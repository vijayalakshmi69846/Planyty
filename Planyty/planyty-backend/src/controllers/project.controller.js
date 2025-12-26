const { Project, User, Task, TeamMember, Team } = require('../models');
const { sendProjectEvent, sendActivityLog } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');
const { Op } = require('sequelize');
exports.createProject = async (req, res) => {
try {
  const { name, description, start_date, end_date, workspace_id } = req.body;
  if (!workspace_id) {
  return res.status(400).json({ error: "workspace_id is required" });
}
const project = await Project.create({name,description,start_date,end_date,workspace_id,created_by: req.user.id,status: 'planned',progress: 0 // Initialize progress
});
  try {
    if (typeof sendProjectEvent === 'function') {
      await sendProjectEvent('PROJECT_CREATED', project, req.user.id);
     }
    if (typeof sendActivityLog === 'function') {
    await sendActivityLog(
    req.user.id,
    'CREATE_PROJECT',
    'project',
    project.id,
    { projectName: project.name });}
    } catch (kafkaError) {
    console.warn("Kafka event failed to send, but project was created:", kafkaError.message);
    }
    res.status(201).json({
      message: 'Project created successfully',project});
    }catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: error.message || 'Failed to create project' });
}};
exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { offset, limit: queryLimit } = paginate(page, limit);
    const where = {};

    if (status) where.status = status;
    if (search) where.name = { [Op.like]: `%${search}%` };

    // --- PRIVACY LOGIC: Filter by Role ---
    if (req.user.role === 'member') {
      // Find all project IDs where this user has an assigned task
      const assignedTasks = await Task.findAll({
        where: { assigned_to: req.user.id },
        attributes: ['project_id'],
        raw: true
      });
      const projectIds = [...new Set(assignedTasks.map(t => t.project_id))];
      where.id = { [Op.in]: projectIds };
    } 
    else if (req.user.role !== 'admin') {
      // Admins and Team Leads see projects they created or are part of
      const memberWorkspaces = await TeamMember.findAll({
        where: { user_id: req.user.id },
        include: [{ model: Team, attributes: ['workspace_id'] }]
      });
      const workspaceIds = memberWorkspaces.map(m => m.Team?.workspace_id).filter(Boolean);

      where[Op.or] = [
        { created_by: req.user.id },
        { workspace_id: { [Op.in]: workspaceIds } }
      ];
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      offset,
      limit: queryLimit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      projects,
      pagination: { total: count, pages: Math.ceil(count / queryLimit), page: parseInt(page) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Task,
          as: 'tasks',
          include: [{
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this project' });
    }

    res.json({ project });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
};
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, progress } = req.body;

    const project = await Project.findByPk(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isAdmin = req.user.role === 'admin';
    const isCreator = Number(project.created_by) === Number(req.user.id);

    // --- REVISED MEMBERSHIP CHECK ---
    // Look for ANY record in TeamMember that links this User to this Workspace 
    // by joining through the Team table.
    const membership = await TeamMember.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: Team,
        where: { workspace_id: project.workspace_id },
        required: true
      }]
    });

    if (!isAdmin && !isCreator && !membership) {
      console.log(`Access Denied: User ${req.user.id} has no TeamMember record linked to Workspace ${project.workspace_id}`);
      return res.status(403).json({ error: "Access Denied: You must be a member of a team in this workspace." });
    }

    // --- PERMISSION-BASED UPDATE ---
    const updateData = {};
    
    // Everyone with access can update progress/status
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;

    // Only Admin/Creator can update core info
    if (isAdmin || isCreator) {
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
    }

    await project.update(updateData);
    res.json({ message: 'Project updated successfully', project });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
};
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
        const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 2. Permission Check
    if (req.user.role !== 'admin' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    // 3. Delete the project 
    // (Since you have no Tasks yet, we don't need to check for them)
    await project.destroy();

    // 4. Kafka and Activity Logs
    if (typeof sendProjectEvent === 'function') {
      await sendProjectEvent('PROJECT_DELETED', project, req.user.id);
    }
    
    if (typeof sendActivityLog === 'function') {
      await sendActivityLog(req.user.id, 'DELETE_PROJECT', 'project', id, { projectName: project.name });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
exports.getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Permission: Creator, Admin, or Workspace Member can see stats
    const workspaceMember = await TeamMember.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: Team,
        where: { workspace_id: project.workspace_id }
      }]
    });

    if (req.user.role !== 'admin' && project.created_by !== req.user.id && !workspaceMember) {
      return res.status(403).json({ error: 'Not authorized to view this project' });
    }

    const tasks = await Task.findAll({ where: { project_id: id } });
    
    const stats = {
      total_tasks: tasks.length,
      todo_tasks: tasks.filter(t => t.status === 'todo').length,
      in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      total_estimated_hours: tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0),
      total_actual_hours: tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0),
      priority_distribution: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Failed to get project statistics' });
  }
};