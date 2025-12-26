const { Task, Subtask, Tag, User, sequelize } = require('../models');
const emailService = require('../services/email.service'); // Ensure path is correct
exports.createTask = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { title, description, project_id, assigned_to, priority, due_date, tags, subtasks, status } = req.body;

        // 1. Create the task
        const task = await Task.create({
            title, 
            description, 
            project_id, 
            // Handle 'Me' shortcut vs User ID
assigned_to: (assigned_to === 'Me') ? req.user.id : (assigned_to || null),            due_date,
            status: status || 'todo' 
        }, { transaction });

        // 2. Handle Tags
        if (tags && tags.length > 0) {
            const tagInstances = await Promise.all(
                tags.map(tagName => Tag.findOrCreate({ where: { name: tagName }, transaction }))
            );
            await task.setTags(tagInstances.map(t => t[0]), { transaction });
        }

        // 3. Handle Subtasks
        if (subtasks && subtasks.length > 0) {
            await Promise.all(subtasks.map(s => Subtask.create({
                title: s.title,
                task_id: task.id,
                status: 'todo'
            }, { transaction })));
        }

        await transaction.commit();

        // 4. RE-FETCH with associations (Crucial for the "Unassigned" UI fix)
        const completedTask = await Task.findByPk(task.id, {
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
                { model: Subtask, as: 'subtasks' },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
        });

        // 5. TRIGGER EMAIL (If someone is assigned)
        if (completedTask.assignee && completedTask.assignee.email) {
            await emailService.sendMemberAddedEmail(
                completedTask.assignee.email,
                `Project Workspace`, // You can pass project name here if available
                req.user.name || "A teammate",
                { name: title, dueDate: due_date }
            );
        }

        res.status(201).json(completedTask);
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        res.status(400).json({ message: error.message });
    }
};
exports.getTasksByProject = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { project_id: req.params.projectId },
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
                { 
                    model: Subtask, 
                    as: 'subtasks',
                    where: { parent_subtask_id: null },
                    required: false,
                    include: { model: Subtask, as: 'children' }
                }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { tags, ...updates } = req.body;
        
        const task = await Task.findByPk(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const oldAssigneeId = task.assigned_to;

        // --- ADD THIS BLOCK TO FIX THE 400 ERROR ---
        if (updates.assigned_to === 'Me') {
            updates.assigned_to = req.user.id;
        } else if (updates.assigned_to === '') {
            updates.assigned_to = null;
        }
        // --------------------------------------------

        // Now update becomes safe because assigned_to is a Number or Null
        await task.update(updates);

        if (tags) {
            const tagInstances = await Promise.all(
                tags.map(tagName => Tag.findOrCreate({ where: { name: tagName } }))
            );
            await task.setTags(tagInstances.map(t => t[0]));
        }

        const updatedTask = await Task.findByPk(id, {
            include: [
                { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }, 
                { model: Subtask, as: 'subtasks' },
                { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
        });

        // Email Trigger
        if (updatedTask.assigned_to && updatedTask.assigned_to !== oldAssigneeId) {
            if (updatedTask.assignee && updatedTask.assignee.email) {
                await emailService.sendMemberAddedEmail(
                    updatedTask.assignee.email,
                    "Updated Project",
                    req.user.name || "A teammate",
                    { name: updatedTask.title, dueDate: updatedTask.due_date }
                );
            }
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Update Error:", error); // Log the specific error
        res.status(400).json({ message: error.message });
    }
};
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await Task.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// CREATE a Single Subtask (for the Plus button in Form)
exports.createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const subtask = await Subtask.create({
            ...req.body,
            task_id: taskId
        });
        res.status(201).json(subtask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// UPDATE a Subtask (e.g., checking off a subtask)
exports.updateSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        await Subtask.update(req.body, { where: { id } });
        const updated = await Subtask.findByPk(id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { assigned_to: req.user.id }, // Filters by the logged-in user's ID
            include: [
                { model: Tag, as: 'tags', attributes: ['name'] },
                { model: Subtask, as: 'subtasks' }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// DELETE a task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await Task.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subtask.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "Subtask not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};