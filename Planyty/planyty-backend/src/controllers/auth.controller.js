// src/controllers/auth.controller.js (FINALIZED WITH KAFKA INTEGRATION)
const { User, Invitation, Team, TeamMember, sequelize } = require('../models');
const { generateToken } = require('../middleware/auth.middleware'); 
const { 
  sendUserEvent, 
  sendInvitationEvent, 
  sendActivityLog 
} = require('../services/kafka.producer'); 
const { Op } = require('sequelize');
/* =====================================================
   STEP 1: INITIATE SIGNUP / CHECK INVITATION
===================================================== */
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
/* =====================================================
   STEP 2: ACCEPT INVITATION / REGISTER USER
===================================================== */
// src/controllers/auth.controller.js
exports.acceptInvitation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token, name, password } = req.body;

    // 1. Find the invitation using the token
    const invitation = await Invitation.findOne({ 
      where: { token, status: 'pending' },
      transaction: t 
    });

    if (!invitation) {
      await t.rollback();
      return res.status(404).json({ error: "Invitation not found or already accepted." });
    }

    // 2. Create the User (if they don't exist)
    let user = await User.findOne({ where: { email: invitation.email }, transaction: t });
    if (!user) {
      user = await User.create({
        email: invitation.email,
        name,
        password, // Ensure password hashing is in your User model hooks
        role: invitation.role || 'member'
      }, { transaction: t });
    }

    // 3. ⭐ CRITICAL: Link User to the Workspace Team
    const team = await Team.findOne({ 
      where: { workspace_id: invitation.workspace_id },
      transaction: t 
    });

    if (team) {
      await TeamMember.findOrCreate({
        where: { team_id: team.id, user_id: user.id },
        defaults: { role: invitation.role || 'member' },
        transaction: t
      });
    }

    // 4. ⭐ UPDATE INVITATION STATUS (This removes "Waiting..." from UI)
    await invitation.update({ status: 'accepted' }, { transaction: t });

    await t.commit();
    
    // ... Generate JWT and send response
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};
/* =====================================================
   LOGIN (INCLUDES JWT & KAFKA)
===================================================== */
exports.login = async (req, res) => {
  const t = await sequelize.transaction(); // Use a transaction for safety
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      await t.rollback();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      await t.rollback();
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isValidPassword = await user.comparePassword(password); 
    if (!isValidPassword) {
      await t.rollback();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // --- START: INVITATION SYNC LOGIC ---
    // 1. Check if this existing user has any pending invites
    const pendingInvites = await Invitation.findAll({
      where: { email: email.toLowerCase(), status: 'pending' },
      transaction: t
    });

    for (const invite of pendingInvites) {
      // 2. Find the team associated with the workspace in the invite
      const team = await Team.findOne({ 
        where: { workspace_id: invite.workspace_id },
        transaction: t 
      });

      if (team) {
        // 3. Create the TeamMember record (This makes them "Active" and counts them)
        await TeamMember.findOrCreate({
          where: { team_id: team.id, user_id: user.id },
          defaults: { role: invite.role || 'member' },
          transaction: t
        });
      }

      // 4. Update the invitation to 'accepted' (This removes the "Waiting..." label)
      await invite.update({ status: 'accepted' }, { transaction: t });
    }
    // --- END: INVITATION SYNC LOGIC ---

    user.last_login = new Date();
    await user.save({ transaction: t });

    const jwtToken = generateToken(user.id);

    await t.commit(); // Commit all changes at once

    // Kafka events (non-blocking)
    try {
        await sendUserEvent('USER_LOGGED_IN', { id: user.id, email: user.email, name: user.name }, { ipAddress: req.ip });
        await sendActivityLog(user.id, 'USER_LOGIN', 'User', user.id);
    } catch (kafkaErr) {
        console.warn('Kafka event failed:', kafkaErr.message);
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: jwtToken 
    });

  } catch (error) {
    await t.rollback();
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};
/* =====================================================
   GET PROFILE
===================================================== */
exports.getProfile = async (req, res) => {
  res.status(200).json({
    message: 'Profile retrieved successfully',
    user: req.user
  });
};