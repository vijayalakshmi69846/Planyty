const { Project, User, Task } = require('../models');
const { sendProjectEvent, sendActivityLog } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');

exports.createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    const project = await Project.create({
      name,
      description,
      start_date,
      end_date,
      created_by: req.user.id,
      status: 'planned'
    });

    // Send Kafka events
    await sendProjectEvent('PROJECT_CREATED', project, req.user.id);
    await sendActivityLog(
      req.user.id,
      'CREATE_PROJECT',
      'project',
      project.id,
      { projectName: project.name }
    );

    res.status(201).json({
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { offset, limit: queryLimit } = paginate(page, limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.name = { $like: `%${search}%` };
    }

    // If not admin, only show projects created by this user or where user is team member
    if (req.user.role !== 'admin') {
      where.created_by = req.user.id;
      // Note: You might want to expand this to include projects where user is a team member
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      offset,
      limit: queryLimit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        pages: Math.ceil(count / queryLimit)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
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
    const { name, description, status, start_date, end_date, progress } = req.body;

    // 1. Find project and include workspace info if necessary
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 2. Comprehensive Permission Check
    const isAdmin = req.user.role === 'admin';
    const isCreator = project.created_by === req.user.id;
    
    // Check if the user is a member of the workspace this project belongs to
    const workspaceMember = await TeamMember.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: Team,
        where: { workspace_id: project.workspace_id }
      }]
    });

    if (!isAdmin && !isCreator && !workspaceMember) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    const oldData = { ...project.toJSON() };

    // 3. Conditional Update logic: 
    // Regular members should ideally only update 'progress' or 'status'.
    // Owners/Admins can update everything.
    const updatePayload = {
      progress: progress !== undefined ? progress : project.progress,
      status: status || project.status
    };

    if (isAdmin || isCreator) {
      updatePayload.name = name || project.name;
      updatePayload.description = description !== undefined ? description : project.description;
      updatePayload.start_date = start_date || project.start_date;
      updatePayload.end_date = end_date || project.end_date;
    }
    
    await project.update(updatePayload);

    // 4. Kafka and Activity Logs
    await sendProjectEvent('PROJECT_UPDATED', project, req.user.id, { oldData });
    await sendActivityLog(
      req.user.id,
      'UPDATE_PROJECT',
      'project',
      project.id,
      { 
        projectName: project.name,
        changes: Object.keys(req.body).filter(key => req.body[key] !== undefined)
      }
    );

    res.json({
      message: 'Project updated successfully',
      project
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find the project
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