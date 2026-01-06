const { User, Invitation, Team, TeamMember, sequelize } = require('../models');
const { generateTokens, REFRESH_SECRET } = require('../middleware/auth.middleware');
const { sendUserEvent, sendActivityLog } = require('../services/kafka.producer');
const { sendResetPasswordEmail } = require('../services/email.service');const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node module
// Helper to handle cookie security consistently
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in prod (https), false in dev (http)
  sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/* =====================================================
   HELPER: AUTH RESPONSE HANDLER
===================================================== */
const sendAuthResponse = async (user, res, message, statusCode = 200) => {
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  user.refresh_token = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return res.status(statusCode).json({
    message,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: accessToken 
  });
};

/* =====================================================
   REFRESH TOKEN ENDPOINT (FIXED)
===================================================== */
exports.refreshToken = async (req, res) => {
  const incomingToken = req.cookies.refreshToken;
  if (!incomingToken) return res.status(401).json({ message: 'Refresh token missing' });

  try {
    const decoded = jwt.verify(incomingToken, REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refresh_token !== incomingToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refresh_token = refreshToken;
    await user.save();

    // Use consistent options here
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.json({ token: accessToken });
  } catch (error) {
    return res.status(403).json({ message: 'Refresh token expired' });
  }
};

/* =====================================================
   LOGIN (PRESERVED SYNC LOGIC)
===================================================== */
exports.login = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active || !(await user.comparePassword(password))) {
      await t.rollback();
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    // --- YOUR INVITATION SYNC LOGIC ---
    const pendingInvites = await Invitation.findAll({
      where: { email: email.toLowerCase(), status: 'pending' },
      transaction: t
    });

    for (const invite of pendingInvites) {
      const team = await Team.findOne({ where: { workspace_id: invite.workspace_id }, transaction: t });
      if (team) {
        await TeamMember.findOrCreate({
          where: { team_id: team.id, user_id: user.id },
          defaults: { role: invite.role || 'member' },
          transaction: t
        });
      }
      await invite.update({ status: 'accepted' }, { transaction: t });
    }

    user.last_login = new Date();
    await user.save({ transaction: t });
    await t.commit();

    sendUserEvent('USER_LOGGED_IN', { id: user.id, email: user.email }, { ipAddress: req.ip }).catch(e => console.error(e));
    sendActivityLog(user.id, 'USER_LOGIN', 'User', user.id).catch(e => console.error(e));

    return sendAuthResponse(user, res, 'Login successful');
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({ message: 'Login failed' });
  }
};

/* =====================================================
   LOGOUT (FIXED)
===================================================== */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.update({ refresh_token: null }, { where: { refresh_token: refreshToken } });
    }

    // Clear with exact same options (except maxAge)
    res.clearCookie('refreshToken', { 
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite 
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};
/* =====================================================
   ACCEPT INVITATION (REWRITTEN WITH REFRESH TOKEN)
===================================================== */
exports.acceptInvitation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token, name, password } = req.body;
    const invitation = await Invitation.findOne({ where: { token, status: 'pending' }, transaction: t });

    if (!invitation) {
      await t.rollback();
      return res.status(404).json({ error: "Invitation not found or already accepted." });
    }

    let user = await User.findOne({ where: { email: invitation.email }, transaction: t });
    if (!user) {
      user = await User.create({ email: invitation.email, name, password, role: invitation.role || 'member' }, { transaction: t });
    }

    const team = await Team.findOne({ where: { workspace_id: invitation.workspace_id }, transaction: t });
    if (team) {
      await TeamMember.findOrCreate({
        where: { team_id: team.id, user_id: user.id },
        defaults: { role: invitation.role || 'member' },
        transaction: t
      });
    }

    await invitation.update({ status: 'accepted' }, { transaction: t });
    await t.commit();
    
    sendUserEvent('USER_INVITATION_ACCEPTED', { id: user.id, email: user.email }, { ipAddress: req.ip }).catch(e => console.error(e));
    
    return sendAuthResponse(user, res, 'Account created successfully');
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({ message: 'Failed to accept invitation' });
  }
};

exports.initiateSignup = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(409).json({ message: 'User already exists.' });
      const invitation = await Invitation.findOne({
        where: {
          email,
          status: 'pending',
          expires_at: { [Op.gt]: new Date() }
        }
      });
  
      if (!invitation) {
        return res.status(403).json({
          success: false,
          message: 'Your email address is not invited or the invitation has expired.'
        });
      }
  
      return res.status(200).json({
        success: true,
        is_invited: true,
        invitation_token: invitation.token,
        assigned_role: invitation.role
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to process request' });
    }
  };

exports.getProfile = async (req, res) => {
  res.status(200).json({ message: 'Profile retrieved successfully', user: req.user });
};
// In auth.controller.js - Add this function
exports.refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    
    // Update refresh token in DB
    user.refresh_token = newRefreshToken;
    await user.save();
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      token: accessToken,
      message: 'Token refreshed successfully'
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired. Please login again.' });
    }
    
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Return 200 for security so hackers don't know who has an account
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. These must match the model names exactly
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour
    
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({ message: 'Reset email sent successfully.' });
  } catch (error) {
    console.error("Forgot Password Error:", error); // This will show the EXACT error in your terminal
    res.status(500).json({ message: 'Internal server error.' });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ 
      where: { 
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() } 
      } 
    });

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    // ⭐ NEW: Check if the new password is the same as the old one
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password cannot be the same as your current password. Please choose a different one.' 
      });
    }

    // Update password (hooks in user.model.js will hash this automatically)
    user.password = password;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    user.refresh_token = null; // Logout from all devices for safety
    
    await user.save();
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};