// src/controllers/auth.controller.js (FINALIZED WITH KAFKA INTEGRATION)

const { User, Invitation } = require('../models'); 
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
exports.acceptInvitation = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !name || !password) {
      return res.status(400).json({ message: 'Token, name, and password are required' });
    }

    const invitation = await Invitation.findOne({
      where: { token, status: 'pending', expires_at: { [Op.gt]: new Date() } }
    });

    if (!invitation) return res.status(400).json({ message: 'Invalid or expired invitation.' });

    const existingUser = await User.findOne({ where: { email: invitation.email } });
    if (existingUser) {
        await Invitation.update({ status: 'accepted' }, { where: { token } });
        return res.status(409).json({ message: 'User already exists.' });
    }
    
    // 1. CREATE USER
    const user = await User.create({
      email: invitation.email,
      password, 
      name,
      role: invitation.role || 'member'
    });

    // 2. ⭐ THE FIX: LINK USER TO THE WORKSPACE TEAM
    // This removes the "Pending" status and makes the workspace visible
    if (invitation.workspace_id) {
        const team = await Team.findOne({ where: { workspace_id: invitation.workspace_id } });
        if (team) {
            await TeamMember.create({
                team_id: team.id,
                user_id: user.id,
                role: invitation.role || 'member'
            });
        }
    }

    // 3. UPDATE INVITATION STATUS
    await Invitation.update({ status: 'accepted' }, { where: { token } });
    
    const jwtToken = generateToken(user.id);

    try {
        await sendUserEvent('USER_REGISTERED', { id: user.id, email: user.email, name: user.name });
        await sendInvitationEvent('INVITATION_ACCEPTED', { id: invitation.id, email: invitation.email });
        await sendActivityLog(user.id, 'SIGNUP_INVITATION_ACCEPTED', 'User', user.id);
    } catch (kafkaErr) {
        console.warn('Kafka failed:', kafkaErr.message);
    }

    user.last_login = new Date();
    await user.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: jwtToken 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};
/* =====================================================
   LOGIN (INCLUDES JWT & KAFKA)
===================================================== */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isValidPassword = await user.comparePassword(password); 
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // GENERATE JWT TOKEN
    const jwtToken = generateToken(user.id);

    // ⭐ KAFKA EVENT PUBLISHING
    // We send a simplified object to Kafka, not the whole Sequelize instance
    try {
        await sendUserEvent('USER_LOGGED_IN', { 
            id: user.id, 
            email: user.email, 
            name: user.name 
        }, { ipAddress: req.ip });

        await sendActivityLog(user.id, 'USER_LOGIN', 'User', user.id);
    } catch (kafkaErr) {
        console.warn('Kafka USER_LOGGED_IN event failed:', kafkaErr.message);
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: jwtToken 
    });

  } catch (error) {
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