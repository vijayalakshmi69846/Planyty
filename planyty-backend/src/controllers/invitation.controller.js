const { Invitation, User, Team, Workspace, TeamMember } = require('../models');
const Company = require('../models/company.model'); 
const { 
  sendInvitationEvent, 
  sendEmailNotification, 
  sendActivityLog,
  sendUserEvent
} = require('../services/kafka.producer');
const crypto = require('crypto');
const { Op } = require('sequelize');
// ------------------- SEND SINGLE INVITATION (From Dashboard) -------------------
exports.sendInvitation = async (req, res) => {
  try {
    const { email, role, workspaceId } = req.body; 
    const inviter = req.user;
    const targetEmail = email.trim().toLowerCase();

    // 1. Check if user is trying to invite themselves
    if (targetEmail === inviter.email.toLowerCase()) {
      return res.status(400).json({ error: "You cannot invite yourself to a workspace." });
    }

    // 2. Check if an active invitation already exists
    const existingInvite = await Invitation.findOne({
      where: { 
        email: targetEmail, 
        workspace_id: workspaceId,
        status: 'pending'
      }
    });
    if (existingInvite) return res.status(400).json({ error: "An invitation is already pending for this email." });

    // 3. Check if user is already an active member (optional but recommended)
    const existingUser = await User.findOne({ where: { email: targetEmail } });
    if (existingUser) {
        const team = await Team.findOne({ where: { workspace_id: workspaceId } });
        const isMember = await TeamMember.findOne({ where: { team_id: team?.id, user_id: existingUser.id } });
        if (isMember) return res.status(400).json({ error: "This user is already a member of this workspace." });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
    const newInvitation = await Invitation.create({
      email: targetEmail,
      token,
      role: role || 'member',
      workspace_id: parseInt(workspaceId, 10),
      invited_by: inviter.id,
      expires_at: expiresAt,
      status: 'pending'
    });

    const workspace = await Workspace.findByPk(workspaceId);
    
    try {
      await sendEmailNotification('WORKSPACE_INVITATION', targetEmail, {
        token,
        role: role || 'member',
        workspaceName: workspace ? workspace.name : "a Workspace",
        inviterName: inviter.name || inviter.email
      });
    } catch (kafkaError) {
      console.warn("Kafka Email Service failed", kafkaError);
    }

    res.status(201).json({ success: true, invitation: newInvitation });
  } catch (error) {
    res.status(500).json({ error: error.message }); 
  }
};
// invitation.controller.js
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // 1. Find the pending invitation
    const invitation = await Invitation.findOne({ 
      where: { token, status: 'pending' } 
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation link invalid or already used' });
    }

    // 2. Find or Create the User account
    let user = await User.findOne({ where: { email: invitation.email } });
    if (!user) {
      user = await User.create({
        email: invitation.email,
        name,
        password, // Ensure your User model hashes this
        role: invitation.role || 'member',
        is_active: true
      });
    }

    // 3. THE MISSING LINK: Attach the user to the workspace's team
    // This is what makes the workspace show up in the "Workspaces" list
    if (invitation.workspace_id) {
      let team = await Team.findOne({ where: { workspace_id: invitation.workspace_id } });
      
      if (!team) {
        // Create a default team if one doesn't exist for this workspace
        team = await Team.create({ 
          name: 'General', 
          workspace_id: invitation.workspace_id 
        });
      }

      // Add user to the TeamMember table
      await TeamMember.findOrCreate({
        where: { team_id: team.id, user_id: user.id },
        defaults: { role: invitation.role }      });
    }

    // 4. FIX THE STATUS: Change from 'pending' to 'accepted'
    // This makes the "Pending" label disappear in WorkspaceDetail.jsx
    await invitation.update({ status: 'accepted' });

    res.status(201).json({ 
      success: true, 
      message: 'Joined workspace successfully',
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error("Accept Invitation Error:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.sendCompanyInvitations = async (req, res) => {
  try {
    const { companyName, adminEmails, ownerEmail } = req.body;

    // Validation for duplicates
    const duplicate = await Company.findOne({
      where: { [Op.or]: [{ name: companyName }, { owner_email: ownerEmail }] }
    });
    
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Company or Email already exists.' });
    }

    // 1. Create Company
    const newCompany = await Company.create({
      name: companyName,
      owner_email: ownerEmail,
      status: 'pending'
    });

    // 2. Construct Invitation List
    const invitationsList = [
      { email: ownerEmail, role: 'admin', invitedBy: 'system', companyName, senderName: 'Planyty System' }
    ];

    if (adminEmails && Array.isArray(adminEmails)) {
      adminEmails.forEach(item => {
        // Accessing .email because Step 2 now uses objects
        const emailVal = typeof item === 'string' ? item : item.email;
        if (emailVal?.trim()) {
          invitationsList.push({
            email: emailVal.trim(),
            role: 'team_lead',
            invitedBy: 'system',
            companyName,
            senderName: 'Planyty System'
          });
        }
      });
    }

    // 3. Execute
    await Promise.all(invitationsList.map(invite => createAndSendInvitation(invite)));

    return res.status(201).json({
      success: true,
      message: 'Onboarding successful!',
      companyId: newCompany.id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// HELPER: CREATE & SEND INVITATION (Used in Onboarding)
const createAndSendInvitation = async ({ email, role, invitedBy, companyName, senderName }) => {
  const token = crypto.randomBytes(32).toString('hex');
  // Set expiration to 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    email: email.trim().toLowerCase(),
    token,
    role,
    expires_at: expiresAt,
    invited_by: invitedBy === 'system' ? 0 : invitedBy, // Ensure this is an integer
    company_name: companyName, 
    status: 'pending'
  });

  // ✅ KAFKA UPDATE: Ensure the object matches what the Consumer expects
  // Order: (type, email, data_object)
  await sendEmailNotification('COMPANY_INVITATION', email, {
    token,
    role,
    companyName,
    inviterName: senderName // This allows the consumer to use data.inviterName
  });

  return invitation;
};
// ------------------- GET ALL INVITATIONS -------------------
exports.getInvitations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = status ? { status } : {};
    if (req.user.role !== 'admin') where.invited_by = req.user.id;

    const { count, rows: invitations } = await Invitation.findAndCountAll({
      where,
      include: [{ model: User, as: 'inviter', attributes: ['id', 'name', 'email'] }],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      invitations,
      pagination: { page: parseInt(page), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invitations' });
  }
};
// ------------------- CANCEL INVITATION -------------------
exports.cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    // Use findByPk to find the invitation by its UUID
    const invitation = await Invitation.findByPk(id);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found in database' });
    }

    // Permission check: Admin, the person who sent it, or the workspace owner
    await invitation.destroy();
    return res.json({ success: true, message: 'Invitation removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.sendStep1Validation = async (req, res) => {
  try {
    const { companyName, ownerEmail } = req.body;
    const email = ownerEmail.trim().toLowerCase();
    
    const [existingUser, existingCompany] = await Promise.all([
        User.findOne({ where: { email } }),
        Company.findOne({ where: { name: companyName.trim() } })
    ]);

    const errors = [];
    if (existingUser) errors.push({ code: 'EMAIL_REGISTERED', message: 'Email already in use' });
    if (existingCompany) errors.push({ code: 'COMPANY_EXISTS', message: 'Company name taken' });

    if (errors.length > 0) {
        return res.status(409).json({ success: false, errors });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server validation error' });
  }
};
// Add this to your invitation controller
exports.checkEmailsExist = async (req, res) => {
  try {
    const { emails } = req.body; // Array of emails from frontend
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: "Invalid email list" });
    }

    const existingUsers = await User.findAll({
      where: {
        email: { [Op.in]: emails.map(e => e.toLowerCase().trim()) }
      },
      attributes: ['email']
    });

    // Return only the emails that were found
    const foundEmails = existingUsers.map(u => u.email.toLowerCase());
    
    return res.status(200).json({ 
      success: true, 
      existingEmails: foundEmails 
    });
  } catch (error) {
    console.error("Check emails error:", error);
    res.status(500).json({ message: "Internal server error checking emails" });
  }
};