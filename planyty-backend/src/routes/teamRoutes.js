const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
// Use the 'protect' variable you imported here
const { protect } = require('../middleware/auth.middleware');
console.log('--- Team Routes Initialization ---');
console.log('createTeam status:', typeof teamController.createTeam); 
console.log('addMember status:', typeof teamController.addMember);
console.log('protect middleware status:', typeof protect);

// Ensure the middleware is a function before applying to routes
if (typeof protect !== 'function') {
    console.error('CRITICAL ERROR: protect middleware is undefined! Check auth.middleware.js exports.');
}
// 1. Create a new team
router.post('/', protect, teamController.createTeam);
// 2. Get teams for a specific user
router.get('/user/:userId', protect, teamController.getTeamsByUser);
// 3. Update team details (Name/Description)
router.put('/:teamId', protect, teamController.updateTeam);
// 4. Delete a team
router.delete('/:teamId', protect, teamController.deleteTeam);
// 5. Add an individual member to an existing team
router.post('/:teamId/members', protect, teamController.addMember);
// Get detailed team channel information
router.get('/team-channel/:teamId',protect, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    // Check if user belongs to this team
    const userTeam = await Team.findOne({
      include: [{
        model: User,
        as: 'members',
        where: { id: userId },
        attributes: []
      }],
      where: { id: parseInt(teamId) }
    });
    
    if (!userTeam) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    
    // Get team details
    const team = await Team.findOne({
      where: { id: parseInt(teamId) },
      attributes: ['id', 'name', 'description', 'workspace_id']
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Get projects for this team's workspace
    const projects = await Project.findAll({
      where: { workspace_id: team.workspace_id },
      attributes: ['id', 'name', 'description', 'status', 'progress', 'start_date', 'end_date'],
      include: [{
        model: Task,
        as: 'tasks',
        attributes: ['id', 'title', 'description', 'status', 'priority', 'due_date'],
        include: [{
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar', 'role']
        }]
      }]
    });
    
    // Get all team members
    const members = await User.findAll({
      include: [{
        model: Team,
        as: 'teams',
        where: { id: parseInt(teamId) },
        attributes: []
      }],
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'created_at']
    });
    
    res.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        workspaceId: team.workspace_id
      },
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        startDate: project.start_date,
        endDate: project.end_date,
        tasks: project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          assignee: task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
            avatar: task.assignee.avatar,
            role: task.assignee.role
          } : null
        }))
      })),
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        joinedAt: member.created_at
      }))
    });
    
  } catch (error) {
    console.error('Team channel details error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;