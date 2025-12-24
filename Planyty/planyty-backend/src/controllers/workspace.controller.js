// src/controllers/workspace.controller.js
const { Workspace, Project, User, Team, TeamMember, Invitation } = require('../models');
const { Op } = require('sequelize');
exports.createWorkspace = async (req, res) => {
  try {
    console.log("=== CREATE WORKSPACE ===");
    console.log("User making request:", req.user.id, req.user.email);
    console.log("Request body:", req.body);
    
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }
    
    const workspace = await Workspace.create({
      name,
      description: description || null,
      color: color || 'purple',
      created_by: req.user.id
    });

    console.log("Workspace created successfully:", workspace.id);
    
    res.status(201).json(workspace);
  } catch (error) {
    console.error("Workspace creation error:", error);
    res.status(500).json({ error: 'Failed to create workspace', details: error.message });
  }
};
exports.getAllWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email; // The person logging in

    const workspaces = await Workspace.findAll({
      include: [
        {
          model: Team,
          as: 'teams',
          include: [{ model: User, as: 'members', where: { id: userId }, required: false }]
        },
        {
          model: Invitation,
          as: 'invitations',
          where: { email: userEmail, status: 'pending' },
          required: false
        }
      ],
      where: {
        [Op.or]: [
          { created_by: userId }, // Owner
          { '$teams.members.id$': userId }, // Active member
          { '$invitations.email$': userEmail } // Invited member
        ]
      },
      distinct: true
    });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.id, 10);
    const workspace = await Workspace.findByPk(workspaceId, {
      include: [
        { model: Project, as: 'Projects' },
        {
          model: Team, as: 'teams',
          include: [{ 
            model: User, as: 'members', 
            attributes: ['id', 'name', 'email'],
            through: { attributes: ['role'] } // Ensure you pull 'role' from TeamMember
          }]
        },
        { model: Invitation, as: 'invitations', where: { status: 'pending' }, required: false },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] } 
      ]
    });

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const data = workspace.toJSON();
    const memberMap = new Map();

    // 1. Owner from Creator
    if (data.creator) {
      memberMap.set(data.creator.email.toLowerCase(), {
        id: data.creator.id,
        name: data.creator.name,
        email: data.creator.email,
        status: 'owner',
        role: 'owner'
      });
    }

    // 2. Map Active Members and their roles
    data.teams?.forEach(team => {
      team.members?.forEach(m => {
        const emailKey = m.email.toLowerCase();
        if (!memberMap.has(emailKey)) {
          memberMap.set(emailKey, {
            id: m.id,
            name: m.name,
            email: m.email,
            status: 'active',
            role: m.TeamMember?.role || 'member' // Pull role from join table
          });
        }
      });
    });

    // 3. Pending Invitations
    data.invitations?.forEach(inv => {
      const emailKey = inv.email.toLowerCase();
      if (!memberMap.has(emailKey)) {
        memberMap.set(emailKey, {
          id: inv.id,
          email: inv.email,
          name: 'Pending Invite',
          status: 'pending',
          role: inv.role || 'member'
        });
      }
    });

    data.allMembers = Array.from(memberMap.values());
    data.membersCount = memberMap.size;
    
    // Stats...
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateWorkspace = async (req, res) => {
  try {
    // Optional: Add backend role check here as well
    const { name, description } = req.body;
    await Workspace.update({ name, description }, { where: { id: req.params.id } });
    res.json({ message: "Updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params; // id is workspaceId
    
    // 1. Find all teams belonging to this workspace
    const teams = await Team.findAll({ where: { workspace_id: id } });
    const teamIds = teams.map(t => t.id);
    
    if (teamIds.length === 0) {
      return res.status(404).json({ error: "No teams found for this workspace" });
    }

    // 2. Remove the user from ALL teams in this workspace
    const deletedCount = await TeamMember.destroy({ 
      where: { 
        team_id: { [Op.in]: teamIds }, 
        user_id: userId 
      } 
    });

    if (deletedCount === 0) {
        return res.status(404).json({ error: "Member not found in this workspace's teams" });
    }

    res.json({ success: true, message: "Member removed from all workspace teams" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Only the creator (owner) can delete the workspace
    if (workspace.created_by !== userId) {
      return res.status(403).json({ error: 'Only the workspace owner can delete it' });
    }

    await workspace.destroy();
    res.json({ success: true, message: 'Workspace and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};