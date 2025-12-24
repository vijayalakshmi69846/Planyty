const { Task, Project, User } = require('../models');
const { sendTaskEvent, sendActivityLog } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');

exports.createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      project_id, 
      assigned_to,
      priority,
      due_date,
      estimated_hours 
    } = req.body;

    // Check if project exists and user has access
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to create task in this project' });
    }

    // Check if assignee exists (if provided)
    if (assigned_to) {
      const assignee = await User.findByPk(assigned_to);
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee not found' });
      }
    }

    const task = await Task.create({
      title,
      description,
      project_id,
      assigned_to,
      created_by: req.user.id,
      priority: priority || 'medium',
      due_date,
      estimated_hours,
      status: 'todo',
      actual_hours: 0
    });

    // Send Kafka events
    await sendTaskEvent('TASK_CREATED', task, req.user.id);
    await sendActivityLog(
      req.user.id,
      'CREATE_TASK',
      'task',
      task.id,
      { 
        taskTitle: task.title,
        projectId: task.project_id
      }
    );

    // If assigned, also log assignment
    if (assigned_to) {
      await sendActivityLog(
        req.user.id,
        'ASSIGN_TASK',
        'task',
        task.id,
        { 
          taskTitle: task.title,
          assignedTo: assigned_to
        }
      );
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          }
        ]
      })
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      project_id, 
      status, 
      priority,
      assigned_to,
      search 
    } = req.query;
    
    const { offset, limit: queryLimit } = paginate(page, limit);

    const where = {};
    if (project_id) where.project_id = project_id;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigned_to) where.assigned_to = assigned_to;
    if (search) where.title = { $like: `%${search}%` };

    // For non-admins, only show tasks from their projects or assigned to them
    if (req.user.role !== 'admin') {
      const userProjects = await Project.findAll({
        where: { created_by: req.user.id },
        attributes: ['id']
      });
      const projectIds = userProjects.map(p => p.id);
      
      where.$or = [
        { project_id: projectIds },
        { assigned_to: req.user.id },
        { created_by: req.user.id }
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      offset,
      limit: queryLimit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        pages: Math.ceil(count / queryLimit)
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Project,
          as: 'project',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permission
    if (req.user.role !== 'admin') {
      const project = await Project.findByPk(task.project_id);
      if (!project || (project.created_by !== req.user.id && task.assigned_to !== req.user.id && task.created_by !== req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view this task' });
      }
    }

    res.json({ task });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project'
      }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permission
    if (req.user.role !== 'admin') {
      const hasAccess = 
        task.project.created_by === req.user.id || 
        task.created_by === req.user.id ||
        task.assigned_to === req.user.id;
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized to update this task' });
      }

      // Regular users can only update certain fields
      if (task.assigned_to === req.user.id || task.created_by === req.user.id) {
        const allowedFields = ['status', 'actual_hours', 'description'];
        const unauthorizedFields = Object.keys(updates).filter(
          field => !allowedFields.includes(field)
        );
        
        if (unauthorizedFields.length > 0) {
          return res.status(403).json({ 
            error: `Only admins or project owners can update: ${unauthorizedFields.join(', ')}` 
          });
        }
      }
    }

    const oldData = { ...task.toJSON() };
    
    // Update task
    await task.update(updates);

    // Send Kafka events
    await sendTaskEvent('TASK_UPDATED', task, req.user.id, { oldData });
    await sendActivityLog(
      req.user.id,
      'UPDATE_TASK',
      'task',
      task.id,
      { 
        taskTitle: task.title,
        changes: Object.keys(updates)
      }
    );

    // If assignment changed, log it
    if (updates.assigned_to && updates.assigned_to !== oldData.assigned_to) {
      await sendActivityLog(
        req.user.id,
        'REASSIGN_TASK',
        'task',
        task.id,
        { 
          taskTitle: task.title,
          oldAssignee: oldData.assigned_to,
          newAssignee: updates.assigned_to
        }
      );
    }

    // If status changed to completed, check project completion
    if (updates.status === 'completed' && oldData.status !== 'completed') {
      const projectTasks = await Task.findAll({ 
        where: { project_id: task.project_id } 
      });
      
      const allCompleted = projectTasks.every(t => t.status === 'completed');
      if (allCompleted) {
        await task.project.update({ status: 'completed' });
        await sendProjectEvent('PROJECT_COMPLETED', task.project, req.user.id);
      }
    }

    res.json({
      message: 'Task updated successfully',
      task: await Task.findByPk(id, {
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          }
        ]
      })
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [{
        model: Project,
        as: 'project'
      }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && task.project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await task.destroy();

    // Send Kafka events
    await sendTaskEvent('TASK_DELETED', task, req.user.id);
    await sendActivityLog(
      req.user.id,
      'DELETE_TASK',
      'task',
      id,
      { taskTitle: task.title }
    );

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const { offset, limit: queryLimit } = paginate(page, limit);

    const where = { assigned_to: req.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        }
      ],
      offset,
      limit: queryLimit,
      order: [
        ['priority', 'DESC'],
        ['due_date', 'ASC']
      ]
    });

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        pages: Math.ceil(count / queryLimit)
      }
    });

  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to get your tasks' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_hours } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assignee or has permission
    if (task.assigned_to !== req.user.id && req.user.role !== 'admin') {
      const project = await Project.findByPk(task.project_id);
      if (!project || project.created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this task' });
      }
    }

    const updates = {};
    if (status) updates.status = status;
    if (actual_hours !== undefined) updates.actual_hours = actual_hours;

    const oldData = { ...task.toJSON() };
    await task.update(updates);

    // Send events
    await sendTaskEvent('TASK_STATUS_UPDATED', task, req.user.id, { oldData });
    await sendActivityLog(
      req.user.id,
      'UPDATE_TASK_STATUS',
      'task',
      task.id,
      { 
        taskTitle: task.title,
        oldStatus: oldData.status,
        newStatus: status
      }
    );

    res.json({
      message: 'Task status updated successfully',
      task
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};