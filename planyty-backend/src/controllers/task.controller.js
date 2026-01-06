const { Task, Subtask, Tag, User, Project, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/email.service');

// UPDATED Helper function with better progress calculation
async function updateProjectStatusBasedOnTasks(projectId) {
    try {
        // Get all tasks for this project
        const tasks = await Task.findAll({
            where: { project_id: projectId }
        });

        if (tasks.length === 0) {
            // No tasks yet - keep as planned
            await Project.update(
                { status: 'planned', progress: 0, task_count: 0 },
                { where: { id: projectId } }
            );
            return 'planned';
        }

        // Calculate average progress (only count tasks that have progress)
        const tasksWithProgress = tasks.filter(t => t.progress !== null && t.progress !== undefined);
        let averageProgress = 0;
        
        if (tasksWithProgress.length > 0) {
            const totalProgress = tasksWithProgress.reduce((sum, task) => sum + (task.progress || 0), 0);
            averageProgress = Math.round(totalProgress / tasksWithProgress.length);
        } else {
            // If no tasks have progress, calculate based on status
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            averageProgress = Math.round((completedTasks / tasks.length) * 100);
        }
        
        // Count tasks by status
        const completedTasks = tasks.filter(task => 
            task.status === 'completed' || (task.progress || 0) >= 100
        ).length;
        
        const inProgressTasks = tasks.filter(task => {
            const progress = task.progress || 0;
            return (progress > 0 && progress < 100) || 
                   task.status === 'in_progress' || 
                   task.status === 'in progress';
        }).length;

        const todoTasks = tasks.filter(task => 
            (task.status === 'todo' || task.status === 'pending') && 
            (task.progress || 0) === 0
        ).length;

        // Determine project status
        let projectStatus = 'planned';
        
        if (completedTasks === tasks.length && averageProgress >= 100) {
            projectStatus = 'completed';
        } else if (inProgressTasks > 0 || todoTasks < tasks.length) {
            // If ANY task is not todo (in_progress or completed), project is in_progress
            projectStatus = 'in_progress';
        } else if (todoTasks === tasks.length && averageProgress === 0) {
            projectStatus = 'planned';
        }

        const updateData = {
            progress: averageProgress,
            task_count: tasks.length, // Always update task count
            status: projectStatus
        };

        // Set end_date if project is completed
        if (projectStatus === 'completed' && averageProgress >= 100) {
            const project = await Project.findByPk(projectId);
            if (project && !project.end_date) {
                updateData.end_date = new Date();
            }
        }

        // Update the project
        await Project.update(updateData, {
            where: { id: projectId }
        });

        console.log(`Updated project ${projectId}: status=${projectStatus}, progress=${averageProgress}%, tasks=${tasks.length}`);
        return projectStatus;
    } catch (error) {
        console.error('Error updating project status:', error);
        throw error;
    }
}
// Add this function to task.controller.js
exports.getTaskAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    
    let whereCondition = {};
    
    // For members, only count tasks assigned to them
    if (userRole === 'member') {
      whereCondition = {
        [Op.or]: [
          { assigned_to: userId },
          { '$subtasks.assigned_to$': userId }
        ]
      };
    }
    
    const tasks = await Task.findAll({
      where: whereCondition,
      include: [
        { 
          model: Subtask, 
          as: 'subtasks',
          required: false // Use LEFT JOIN
        }
      ]
    });
    
    // Calculate priority distribution including subtasks
    let priorityDistribution = { high: 0, medium: 0, low: 0 };
    
    tasks.forEach(task => {
      // Count task priority
      if (task.priority) {
        const priority = task.priority.toLowerCase();
        if (priority === 'high') priorityDistribution.high += 1;
        else if (priority === 'medium') priorityDistribution.medium += 1;
        else if (priority === 'low') priorityDistribution.low += 1;
      }
      
      // Count subtask priorities
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
          if (subtask.priority) {
            const priority = subtask.priority.toLowerCase();
            if (priority === 'high') priorityDistribution.high += 1;
            else if (priority === 'medium') priorityDistribution.medium += 1;
            else if (priority === 'low') priorityDistribution.low += 1;
          }
        });
      }
    });
    
    // Calculate total tasks including subtasks
    const totalTasks = tasks.length + tasks.reduce((sum, task) => 
      sum + (task.subtasks ? task.subtasks.length : 0), 0
    );
    
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.progress >= 100
    ).length;
    
    res.json({
      priorityDistribution,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      taskCount: tasks.length,
      subtaskCount: tasks.reduce((sum, task) => 
        sum + (task.subtasks ? task.subtasks.length : 0), 0
      )
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
// UPDATED createTask with better status handling
exports.createTask = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { title, description, project_id, assigned_to, priority, due_date, tags, subtasks, status, progress } = req.body;

        // Auto-determine status based on progress
        let taskStatus = status || 'todo';
        let taskProgress = progress || 0;
        
        // Ensure progress and status are synchronized
        if (progress !== undefined) {
            taskProgress = Math.min(100, Math.max(0, progress)); // Clamp between 0-100
            if (taskProgress >= 100) {
                taskStatus = 'completed';
                taskProgress = 100;
            } else if (taskProgress > 0) {
                taskStatus = 'in_progress';
            } else {
                taskStatus = 'todo';
            }
        } else if (status === 'completed') {
            taskProgress = 100;
            taskStatus = 'completed';
        } else if (status === 'in_progress' || status === 'in progress') {
            taskProgress = taskProgress > 0 ? taskProgress : 1; // Minimum progress
            taskStatus = 'in_progress';
        } else if (status === 'todo' || status === 'pending') {
            taskProgress = 0;
            taskStatus = 'todo';
        }

        // 1. Create the task
        const task = await Task.create({
            title, 
            description, 
            project_id: parseInt(project_id), 
            assigned_to: (assigned_to === 'Me') ? req.user.id : (assigned_to || null),
            due_date,
            status: taskStatus,
            progress: taskProgress,
            created_by: req.user.id
        }, { transaction });

        // 2. Handle Tags
        if (tags && tags.length > 0) {
            const tagInstances = await Promise.all(
                tags.map(tagName => Tag.findOrCreate({ where: { name: tagName }, transaction }))
            );
            await task.setTags(tagInstances.map(t => t[0]), { transaction });
        }

        // 3. Handle Subtasks
        if (subtasks && Array.isArray(subtasks)) {
            const subtaskData = subtasks.map(s => ({
                title: s.title,
                task_id: task.id,
                status: s.status || 'todo',
                assigned_to: s.assigned_to || s.subtaskAssignee?.id,
                due_date: s.due_date,
                priority: s.priority || 'Medium',
                description: s.description,
                progress: s.status === 'completed' ? 100 : 0
            }));
            await Subtask.bulkCreate(subtaskData, { transaction });
        }

        await transaction.commit();
        
        // 4. Update project status IMMEDIATELY
        await updateProjectStatusBasedOnTasks(parseInt(project_id));

        // 5. Fetch with associations
        const completedTask = await Task.findByPk(task.id, {
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
                { 
                    model: Subtask, 
                    as: 'subtasks',
                    include: [
                        { 
                            model: User, 
                            as: 'subtaskAssignee',
                            attributes: ['id', 'name', 'email'] 
                        }
                    ]
                },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
        });

        // 6. Trigger Email
        if (completedTask.assignee && completedTask.assignee.email) {
            try {
                await emailService.sendMemberAddedEmail(
                    completedTask.assignee.email,
                    `Project Workspace`, 
                    req.user.name || "A teammate",
                    { name: title, dueDate: due_date }
                );
            } catch (emailErr) {
                console.warn("Email service failed, but task was created:", emailErr.message);
            }
        }

        res.status(201).json(completedTask);
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error("Create Task Error:", error);
        res.status(400).json({ message: error.message });
    }
};
exports.getTasksByProject = async (req, res) => {
    try {
        const isMember = req.user.role === 'member';
        const userId = req.user.id;
        
        let whereCondition = { project_id: req.params.projectId };
        
        if (isMember) {
            whereCondition = {
                project_id: req.params.projectId,
                [Op.or]: [
                    { assigned_to: userId },
                    { '$subtasks.assigned_to$': userId }
                ]
            };
        }
       
        const tasks = await Task.findAll({
            where: whereCondition,
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
                { 
                    model: Subtask, 
                    as: 'subtasks',
                    include: [{ 
                        model: User, 
                        as: 'subtaskAssignee', 
                        attributes: ['id', 'name', 'email'] 
                    }]
                }
            ],
            subQuery: false,
            order: [['created_at', 'DESC']]
        });

        // Auto-update task statuses based on progress
        const updatedTasks = tasks.map(task => {
            let status = task.status;
            const progress = task.progress || 0;
            
            if (progress >= 100) {
                status = 'completed';
            } else if (progress > 0) {
                status = 'in_progress';
            } else {
                status = 'todo';
            }
            
            // If status needs to be updated, update it in database
            if (status !== task.status) {
                Task.update({ status }, { where: { id: task.id } });
            }
            
            return {
                ...task.toJSON(),
                status: status,
                progress: progress
            };
        });

        // Update project status
        await updateProjectStatusBasedOnTasks(req.params.projectId);

        // FILTER SUBTASKS FOR MEMBERS
        if (isMember) {
            const filteredTasks = updatedTasks.map(task => {
                // If task is assigned to member, show all subtasks
                if (task.assigned_to === userId) {
                    return task;
                }
                
                // Otherwise, filter subtasks assigned to member
                const filteredSubtasks = task.subtasks.filter(subtask => {
                    return subtask.assigned_to === userId || 
                           subtask.subtaskAssignee?.id === userId;
                });
                
                // Return task with filtered subtasks
                return {
                    ...task,
                    subtasks: filteredSubtasks
                };
            });
            
            return res.status(200).json(filteredTasks);
        }

        res.status(200).json(updatedTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// UPDATED updateTask with progress synchronization
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { tags, subtasks, ...updates } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role.toLowerCase();
        
        const task = await Task.findByPk(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // --- PERMISSION CHECK ---
        const isAdminOrLead = userRole === 'admin' || userRole === 'team_lead';
        const isAssignedMember = task.assigned_to == userId;

        if (!isAdminOrLead && !isAssignedMember) {
            return res.status(403).json({ message: "You are not assigned to this task." });
        }

        // --- AUTO-STATUS LOGIC BASED ON PROGRESS ---
        let finalUpdates = { ...updates };
        
        // Ensure progress is always synchronized with status
        if (updates.progress !== undefined) {
            const newProgress = Math.min(100, Math.max(0, updates.progress));
            
            if (newProgress >= 100) {
                finalUpdates.progress = 100;
                finalUpdates.status = 'completed';
                finalUpdates.completed_at = new Date();
            } else if (newProgress > 0) {
                finalUpdates.progress = newProgress;
                finalUpdates.status = 'in_progress';
                finalUpdates.completed_at = null;
            } else {
                finalUpdates.progress = 0;
                finalUpdates.status = 'todo';
                finalUpdates.completed_at = null;
            }
        } 
        // If status is set explicitly
        else if (updates.status === 'completed') {
            finalUpdates.progress = 100;
            finalUpdates.completed_at = new Date();
            finalUpdates.status = 'completed';
        } else if (updates.status === 'in_progress' || updates.status === 'in progress') {
            if (task.progress === 0 || task.progress === null) {
                finalUpdates.progress = 1; // Minimum progress for in_progress
            }
            finalUpdates.completed_at = null;
            finalUpdates.status = 'in_progress';
        } else if (updates.status === 'todo' || updates.status === 'pending') {
            finalUpdates.progress = 0;
            finalUpdates.completed_at = null;
            finalUpdates.status = 'todo';
        }

        // Ensure progress field exists
        if (finalUpdates.progress === undefined) {
            finalUpdates.progress = task.progress || 0;
        }

        if (!isAdminOrLead && isAssignedMember) {
            // Allow members to update status, progress, and completed_at
            finalUpdates = { 
                status: finalUpdates.status,
                progress: finalUpdates.progress,
                completed_at: finalUpdates.completed_at
            };
        } else if (isAdminOrLead) {
            // ADMINS/LEADS handle special assignment logic
            if (updates.assigned_to === 'Me') {
                finalUpdates.assigned_to = userId;
            }
        }

        await task.update(finalUpdates);

        // --- UPDATE PROJECT STATUS IMMEDIATELY ---
        await updateProjectStatusBasedOnTasks(task.project_id);

        // --- RESTRICT METADATA ---
        if (isAdminOrLead) {
            if (tags) {
                const tagInstances = await Promise.all(
                    tags.map(tagName => Tag.findOrCreate({ where: { name: tagName } }))
                );
                await task.setTags(tagInstances.map(t => t[0]));
            }

            if (subtasks && Array.isArray(subtasks)) {
                await Subtask.destroy({ where: { task_id: id } });
                const subtaskData = subtasks.map(s => ({
                    title: s.title,
                    task_id: id,
                    status: s.status || 'todo',
                    assigned_to: s.assigned_to || s.subtaskAssignee?.id, 
                    due_date: s.due_date,
                    priority: s.priority || 'Medium',
                    description: s.description,
                    progress: s.status === 'completed' ? 100 : 0
                }));
                await Subtask.bulkCreate(subtaskData);
            }
        }

        const updatedTask = await Task.findByPk(id, {
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }, 
                { 
                    model: Subtask, 
                    as: 'subtasks',
                    include: [{ model: User, as: 'subtaskAssignee', attributes: ['id', 'name', 'email'] }]
                },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(400).json({ message: error.message });
    }
};
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const projectId = task.project_id;
        await task.destroy();
        
        // Update project status after task deletion
        await updateProjectStatusBasedOnTasks(projectId);
        
        res.status(204).send();
    } catch (error) {
        console.error("Delete Task Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const subtask = await Subtask.create({
            ...req.body,
            task_id: taskId
        });
        
        // 1. RE-FETCH with Assignee AND the Parent Task info (for the email)
        const subtaskWithDetails = await Subtask.findByPk(subtask.id, {
            include: [
                { model: User, as: 'subtaskAssignee', attributes: ['id', 'name', 'email'] },
                { model: Task, as: 'task', attributes: ['title', 'project_id'] }
            ]
        });

        // 2. Update project status
        if (subtaskWithDetails.task) {
            await updateProjectStatusBasedOnTasks(subtaskWithDetails.task.project_id);
        }

        // 3. TRIGGER EMAIL if assignee exists
        if (subtaskWithDetails.subtaskAssignee?.email) {
            try {
                await emailService.sendMemberAddedEmail(
                    subtaskWithDetails.subtaskAssignee.email,
                    `Subtask Assignment`, 
                    req.user.name || "A teammate",
                    { 
                        name: `${subtaskWithDetails.title} (Task: ${subtaskWithDetails.task?.title})`, 
                        dueDate: subtaskWithDetails.due_date 
                    }
                );
            } catch (emailErr) {
                console.warn("Email failed for subtask:", emailErr.message);
            }
        }
        
        res.status(201).json(subtaskWithDetails);
    } catch (error) {
        console.error("Create Subtask Error:", error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const subtask = await Subtask.findByPk(id, {
            include: [{ model: Task, as: 'task', attributes: ['project_id'] }]
        });
        
        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }
        
        await Subtask.update(req.body, { where: { id } });
        
        // Update project status
        if (subtask.task) {
            await updateProjectStatusBasedOnTasks(subtask.task.project_id);
        }
        
        const updated = await Subtask.findByPk(id, {
            include: [
                { 
                    model: User, 
                    as: 'subtaskAssignee',
                    attributes: ['id', 'name', 'email'] 
                }
            ]
        });
        
        res.status(200).json(updated);
    } catch (error) {
        console.error("Update Subtask Error:", error);
        res.status(400).json({ message: error.message });
    }
};

exports.getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const isMember = req.user.role === 'member';
        
        const tasks = await Task.findAll({
            where: {
                [Op.or]: [
                    { assigned_to: userId },
                    { '$subtasks.assigned_to$': userId }
                ]
            },
            include: [
                { model: Tag, as: 'tags', attributes: ['name'] },
                { 
                    model: Subtask, 
                    as: 'subtasks',
                    include: [
                        { model: User, as: 'subtaskAssignee', attributes: ['id', 'name', 'email'] }
                    ]
                }
            ],
            subQuery: false,
            order: [['created_at', 'DESC']]
        });

        // Auto-update task statuses based on progress
        const updatedTasks = tasks.map(task => {
            let status = task.status;
            const progress = task.progress || 0;
            
            if (progress >= 100) {
                status = 'completed';
            } else if (progress > 0) {
                status = 'in_progress';
            } else {
                status = 'todo';
            }
            
            return {
                ...task.toJSON(),
                status: status,
                progress: progress
            };
        });

        // Filter subtasks for members
        if (isMember) {
            const filteredTasks = updatedTasks.map(task => {
                // If task is assigned to member, show all subtasks
                if (task.assigned_to === userId) {
                    return task;
                }
                
                // Otherwise, filter subtasks assigned to member
                const filteredSubtasks = task.subtasks.filter(subtask => {
                    return subtask.assigned_to === userId || 
                           subtask.subtaskAssignee?.id === userId;
                });
                
                return {
                    ...task,
                    subtasks: filteredSubtasks
                };
            });
            
            return res.status(200).json(filteredTasks);
        }

        res.status(200).json(updatedTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const subtask = await Subtask.findByPk(id, {
            include: [{ model: Task, as: 'task', attributes: ['project_id'] }]
        });
        
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }
        
        const projectId = subtask.task?.project_id;
        const deleted = await Subtask.destroy({ where: { id } });
        
        if (!deleted) {
            return res.status(404).json({ message: "Subtask not found" });
        }
        
        // Update project status
        if (projectId) {
            await updateProjectStatusBasedOnTasks(projectId);
        }
        
        res.status(204).send();
    } catch (error) {
        console.error("Delete Subtask Error:", error);
        res.status(500).json({ message: error.message });
    }
};