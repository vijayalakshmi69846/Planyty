const { Project, User, Task, TeamMember, Team } = require('../models');
const { sendProjectEvent, sendActivityLog } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');
const { Op } = require('sequelize');
// FIXED Helper function - SIMPLIFIED and CORRECT logic
async function updateProjectStatusBasedOnTasks(projectId) {
    try {
        console.log(`=== SYNC START: Project ${projectId} ===`);
        
        // Get all tasks for this project
        const tasks = await Task.findAll({
            where: { project_id: projectId }
        });

        console.log(`Tasks found in DB: ${tasks.length}`);
        
        if (tasks.length === 0) {
            // No tasks - set to planned
            await Project.update(
                { 
                    status: 'planned', 
                    progress: 0,
                    task_count: 0 
                },
                { where: { id: projectId } }
            );
            console.log(`No tasks - set to planned with task_count=0`);
            return 'planned';
        }

        // Calculate average progress
        const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const averageProgress = Math.round(totalProgress / tasks.length);
        
        // Check if all tasks are completed
        const allTasksCompleted = tasks.every(task => 
            task.status === 'completed' || (task.progress || 0) >= 100
        );
        
        // Check if any task is in progress or has progress > 0
        const hasInProgressTasks = tasks.some(task => 
            task.status === 'in_progress' || 
            task.status === 'in progress' ||
            (task.progress || 0) > 0
        );
        
        // SIMPLE LOGIC: Determine project status
        let projectStatus = 'planned';
        
        if (allTasksCompleted && averageProgress >= 100) {
            // All tasks completed
            projectStatus = 'completed';
            console.log(`Setting status: completed (all ${tasks.length} tasks done)`);
        } else if (tasks.length > 0) {
            // ANY project with tasks should be in_progress (unless all tasks are todo with 0% progress)
            const allTasksTodo = tasks.every(task => 
                (task.status === 'todo' || task.status === 'pending') && 
                (task.progress || 0) === 0
            );
            
            if (allTasksTodo) {
                projectStatus = 'planned';
                console.log(`Setting status: planned (all ${tasks.length} tasks are todo with 0% progress)`);
            } else {
                projectStatus = 'in_progress';
                console.log(`Setting status: in_progress (has ${tasks.length} tasks)`);
            }
        }

        const updateData = {
            progress: averageProgress,
            task_count: tasks.length,
            status: projectStatus
        };

        // Set end_date if project is completed
        if (projectStatus === 'completed' && averageProgress >= 100) {
            const project = await Project.findByPk(projectId);
            if (project && !project.end_date) {
                updateData.end_date = new Date();
                console.log(`Setting end_date to now`);
            }
        }

        // Update the project
        await Project.update(updateData, {
            where: { id: projectId }
        });

        console.log(`Updated project ${projectId}: status=${projectStatus}, progress=${averageProgress}%, tasks=${tasks.length}`);
        console.log(`=== SYNC END: Project ${projectId} ===`);
        
        return projectStatus;
    } catch (error) {
        console.error('Error updating project status:', error);
        throw error;
    }
}
// Add this FORCE SYNC function
exports.forceSyncProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log(`=== FORCE SYNC PROJECT ${id} ===`);
        
        // Get ALL tasks including subtasks
        const tasks = await Task.findAll({
            where: { project_id: id }
        });

        // Also update all task statuses based on progress
        for (const task of tasks) {
            const progress = task.progress || 0;
            let taskStatus = task.status;
            
            if (progress >= 100) {
                taskStatus = 'completed';
            } else if (progress > 0) {
                taskStatus = 'in_progress';
            } else {
                taskStatus = 'todo';
            }
            
            if (task.status !== taskStatus) {
                await Task.update(
                    { status: taskStatus },
                    { where: { id: task.id } }
                );
                console.log(`Task ${task.id}: ${task.status} -> ${taskStatus}`);
            }
        }

        // Now sync the project
        const newStatus = await updateProjectStatusBasedOnTasks(id);
        
        // Get updated project
        const updatedProject = await Project.findByPk(id);
        
        res.json({
            message: 'Project force-synced successfully',
            project: updatedProject,
            previousStatus: project.status,
            newStatus: newStatus,
            taskCount: tasks.length
        });
    } catch (error) {
        console.error('Force sync error:', error);
        res.status(500).json({ error: error.message });
    }
};

// UPDATED Fix Task Counts function
exports.fixTaskCounts = async (req, res) => {
    try {
        console.log('=== FIXING TASK COUNTS FOR ALL PROJECTS ===');
        
        // Get all projects
        const projects = await Project.findAll({
            attributes: ['id', 'name', 'status', 'task_count']
        });

        let fixedCount = 0;
        let statusUpdatedCount = 0;
        
        for (const project of projects) {
            // Count actual tasks in database
            const taskCount = await Task.count({
                where: { project_id: project.id }
            });
            
            // Update if task_count is wrong
            if (project.task_count !== taskCount) {
                console.log(`Project ${project.id} (${project.name}): task_count was ${project.task_count}, should be ${taskCount}`);
                
                const updateData = { task_count: taskCount };
                
                // Also update status based on actual tasks
                if (taskCount > 0 && project.status !== 'completed') {
                    updateData.status = 'in_progress';
                    statusUpdatedCount++;
                    console.log(`  -> Also set status to in_progress`);
                } else if (taskCount === 0 && project.status !== 'planned') {
                    updateData.status = 'planned';
                    statusUpdatedCount++;
                    console.log(`  -> Also set status to planned`);
                }
                
                await Project.update(updateData, {
                    where: { id: project.id }
                });
                
                fixedCount++;
            }
        }
        
        console.log(`=== FIX COMPLETE: Fixed ${fixedCount} projects, updated ${statusUpdatedCount} statuses ===`);
        
        res.json({ 
            message: `Task counts fixed for ${fixedCount} projects`,
            fixed: fixedCount,
            statusUpdated: statusUpdatedCount
        });
    } catch (error) {
        console.error('Fix task counts error:', error);
        res.status(500).json({ error: error.message || 'Failed to fix task counts' });
    }
};
// UPDATED Sync All Projects function
exports.syncAllProjectsStatus = async (req, res) => {
    try {
        console.log('=== START SYNC ALL PROJECTS ===');
        console.log(`User: ${req.user.id}, Role: ${req.user.role}`);
        
        // Get all projects the user has access to
        let projectIds = [];
        
        if (req.user.role === 'member') {
            // Find all project IDs where this user has an assigned task
            const assignedTasks = await Task.findAll({
                where: { assigned_to: req.user.id },
                attributes: ['project_id'],
                raw: true
            });
            projectIds = [...new Set(assignedTasks.map(t => t.project_id))];
            console.log(`Member: Found ${projectIds.length} projects from assigned tasks`);
        } 
        else if (req.user.role === 'admin') {
            // Admin can see all projects
            const allProjects = await Project.findAll({
                attributes: ['id'],
                raw: true
            });
            projectIds = allProjects.map(p => p.id);
            console.log(`Admin: Found ${projectIds.length} all projects`);
        }
        else {
            // Team leads and others see projects they created or are part of
            const memberWorkspaces = await TeamMember.findAll({
                where: { user_id: req.user.id },
                include: [{ model: Team, attributes: ['workspace_id'] }]
            });
            const workspaceIds = memberWorkspaces.map(m => m.Team?.workspace_id).filter(Boolean);

            const userProjects = await Project.findAll({
                where: {
                    [Op.or]: [
                        { created_by: req.user.id },
                        { workspace_id: { [Op.in]: workspaceIds } }
                    ]
                },
                attributes: ['id'],
                raw: true
            });
            projectIds = userProjects.map(p => p.id);
            console.log(`Team Lead: Found ${projectIds.length} projects from workspaces`);
        }

        if (projectIds.length === 0) {
            console.log('No projects found to sync');
            return res.json({ 
                message: 'No projects found to sync',
                synced: 0,
                skipped: 0
            });
        }

        const projects = await Project.findAll({
            where: { id: { [Op.in]: projectIds } },
            attributes: ['id', 'name', 'status', 'task_count'],
            raw: true
        });

        console.log(`Found ${projects.length} projects to sync`);

        // Sync each project
        let syncedCount = 0;
        let skippedCount = 0;
        let convertedToInProgress = 0;
        
        for (const project of projects) {
            console.log(`\nProcessing project ${project.id}: ${project.name} (current status: ${project.status}, tasks: ${project.task_count})`);
            
            // First fix task counts
            const actualTaskCount = await Task.count({
                where: { project_id: project.id }
            });
            
            if (project.task_count !== actualTaskCount) {
                await Project.update(
                    { task_count: actualTaskCount },
                    { where: { id: project.id } }
                );
                console.log(`Fixed task count: ${project.task_count} -> ${actualTaskCount}`);
            }
            
            // Skip already completed projects
            if (project.status === 'completed' && actualTaskCount > 0) {
                // Still check if all tasks are completed
                const completedTasks = await Task.count({
                    where: { 
                        project_id: project.id,
                        [Op.or]: [
                            { status: 'completed' },
                            { progress: { [Op.gte]: 100 } }
                        ]
                    }
                });
                
                if (completedTasks === actualTaskCount) {
                    console.log(`Skipping project ${project.id}: already completed and all tasks done`);
                    skippedCount++;
                    continue;
                }
            }
            
            const newStatus = await updateProjectStatusBasedOnTasks(project.id);
            
            // Check if status changed from planned to in_progress
            if (project.status === 'planned' && newStatus === 'in_progress') {
                convertedToInProgress++;
                console.log(`Project ${project.id} converted from planned to in_progress`);
            }
            
            syncedCount++;
            console.log(`Project ${project.id} synced. New status: ${newStatus}`);
        }

        console.log(`\n=== SYNC COMPLETE ===`);
        console.log(`Synced: ${syncedCount}, Converted to in_progress: ${convertedToInProgress}, Skipped: ${skippedCount}`);

        res.json({ 
            message: `Project status sync completed. ${syncedCount} projects synced (${convertedToInProgress} converted to in_progress), ${skippedCount} projects skipped.`,
            synced: syncedCount,
            convertedToInProgress: convertedToInProgress,
            skipped: skippedCount
        });
    } catch (error) {
        console.error('Sync all projects error:', error);
        res.status(500).json({ error: error.message || 'Failed to sync all projects' });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { name, description, start_date, end_date, workspace_id } = req.body;
        if (!workspace_id) {
            return res.status(400).json({ error: "workspace_id is required" });
        }
        
        const project = await Project.create({
            name,
            description,
            start_date: start_date || new Date(),
            end_date,
            workspace_id,
            created_by: req.user.id,
            status: 'planned',
            progress: 0
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
                    { projectName: project.name }
                );
            }
        } catch (kafkaError) {
            console.warn("Kafka event failed to send, but project was created:", kafkaError.message);
        }
        
        res.status(201).json({
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: error.message || 'Failed to create project' });
    }
};// UPDATED getAllProjects with automatic status correction
exports.getAllProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, sort = 'newest' } = req.query;
        const { offset, limit: queryLimit } = paginate(page, limit);
        const where = {};

        // CRITICAL: Always check and fix project statuses before returning
        console.log('=== AUTO-CORRECTING PROJECT STATUSES ===');
        
        // Get all projects user can access
        let projectIds = [];
        
        if (req.user.role === 'member') {
            const assignedTasks = await Task.findAll({
                where: { assigned_to: req.user.id },
                attributes: ['project_id'],
                raw: true
            });
            projectIds = [...new Set(assignedTasks.map(t => t.project_id))];
        } 
        else if (req.user.role !== 'admin') {
            const memberWorkspaces = await TeamMember.findAll({
                where: { user_id: req.user.id },
                include: [{ model: Team, attributes: ['workspace_id'] }]
            });
            const workspaceIds = memberWorkspaces.map(m => m.Team?.workspace_id).filter(Boolean);

            const userProjects = await Project.findAll({
                where: {
                    [Op.or]: [
                        { created_by: req.user.id },
                        { workspace_id: { [Op.in]: workspaceIds } }
                    ]
                },
                attributes: ['id'],
                raw: true
            });
            projectIds = userProjects.map(p => p.id);
        } else {
            // Admin - get all projects
            const allProjects = await Project.findAll({ attributes: ['id'], raw: true });
            projectIds = allProjects.map(p => p.id);
        }

        // Auto-correct each project's status
        for (const projectId of projectIds) {
            try {
                const taskCount = await Task.count({ where: { project_id: projectId } });
                const project = await Project.findByPk(projectId);
                
                if (project) {
                    // Fix 1: Ensure task_count is correct
                    if (project.task_count !== taskCount) {
                        await Project.update(
                            { task_count: taskCount },
                            { where: { id: projectId } }
                        );
                    }
                    
                    // Fix 2: If project has tasks and is marked as planned, set to in_progress
                    if (taskCount > 0 && project.status === 'planned') {
                        await Project.update(
                            { status: 'in_progress' },
                            { where: { id: projectId } }
                        );
                        console.log(`Auto-corrected project ${projectId}: planned -> in_progress (has ${taskCount} tasks)`);
                    }
                    
                    // Fix 3: If project has no tasks and is not planned, set to planned
                    if (taskCount === 0 && project.status !== 'planned') {
                        await Project.update(
                            { status: 'planned' },
                            { where: { id: projectId } }
                        );
                    }
                }
            } catch (err) {
                console.warn(`Failed to auto-correct project ${projectId}:`, err.message);
            }
        }

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

        // Sorting logic
        let order = [];
        switch(sort) {
            case 'newest':
                order = [['created_at', 'DESC']];
                break;
            case 'oldest':
                order = [['created_at', 'ASC']];
                break;
            case 'progress_high':
                order = [['progress', 'DESC']];
                break;
            case 'progress_low':
                order = [['progress', 'ASC']];
                break;
            case 'name_asc':
                order = [['name', 'ASC']];
                break;
            case 'name_desc':
                order = [['name', 'DESC']];
                break;
            default:
                order = [['created_at', 'DESC']];
        }

        const { count, rows: projects } = await Project.findAndCountAll({
            where,
            offset,
            limit: queryLimit,
            order,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        // ONE MORE CHECK: Calculate correct display status for each project
        const projectsWithCorrectedStatus = await Promise.all(
            projects.map(async (project) => {
                const taskCount = await Task.count({ where: { project_id: project.id } });
                
                // Calculate what the status SHOULD be
                let correctedStatus = project.status;
                
                if (taskCount > 0 && project.status === 'planned') {
                    correctedStatus = 'in_progress';
                } else if (taskCount === 0 && project.status !== 'planned') {
                    correctedStatus = 'planned';
                }
                
                return {
                    ...project.toJSON(),
                    actualTaskCount: taskCount,
                    correctedStatus: correctedStatus,
                    displayStatus: correctedStatus,
                    needsStatusFix: correctedStatus !== project.status
                };
            })
        );

        res.json({
            projects: projectsWithCorrectedStatus,
            pagination: { 
                total: count, 
                pages: Math.ceil(count / queryLimit), 
                page: parseInt(page),
                limit: queryLimit
            }
        });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch projects' });
    }
};
// TEST endpoint to check project status
exports.testProjectStatus = async (req, res) => {
    try {
        const projects = await Project.findAll({
            attributes: ['id', 'name', 'status', 'task_count']
        });
        
        const results = await Promise.all(
            projects.map(async (project) => {
                const taskCount = await Task.count({
                    where: { project_id: project.id }
                });
                
                return {
                    id: project.id,
                    name: project.name,
                    dbStatus: project.status,
                    dbTaskCount: project.task_count,
                    actualTaskCount: taskCount,
                    shouldBeStatus: taskCount > 0 ? 'in_progress' : 'planned',
                    needsFix: (taskCount > 0 && project.status === 'planned') || 
                             (taskCount === 0 && project.status !== 'planned')
                };
            })
        );
        
        const needsFix = results.filter(r => r.needsFix);
        
        res.json({
            message: `Found ${projects.length} projects. ${needsFix.length} need fixing.`,
            projects: results,
            needsFix: needsFix.map(p => ({ id: p.id, name: p.name })),
            summary: {
                total: projects.length,
                planned: projects.filter(p => p.status === 'planned').length,
                in_progress: projects.filter(p => p.status === 'in_progress').length,
                completed: projects.filter(p => p.status === 'completed').length,
                withTasks: results.filter(p => p.actualTaskCount > 0).length,
                needsFix: needsFix.length
            }
        });
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ error: error.message });
    }
};
// UPDATED getProjectById with better data handling
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
                    }],
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check permission
        if (req.user.role !== 'admin' && project.created_by !== req.user.id) {
            const workspaceMember = await TeamMember.findOne({
                where: { user_id: req.user.id },
                include: [{
                    model: Team,
                    where: { workspace_id: project.workspace_id }
                }]
            });
            
            if (!workspaceMember) {
                return res.status(403).json({ error: 'Not authorized to view this project' });
            }
        }

        // Calculate progress for tasks that don't have it
        const updatedTasks = await Promise.all(project.tasks.map(async (task) => {
            let progress = task.progress || 0;
            let status = task.status || 'todo';
            
            // Ensure task has correct status based on progress
            if (progress >= 100 && status !== 'completed') {
                status = 'completed';
                // Update in database too
                await Task.update(
                    { status: 'completed', progress: 100 },
                    { where: { id: task.id } }
                );
            } else if (progress > 0 && progress < 100 && status !== 'in_progress') {
                status = 'in_progress';
                await Task.update(
                    { status: 'in_progress' },
                    { where: { id: task.id } }
                );
            } else if (progress === 0 && status !== 'todo') {
                status = 'todo';
                await Task.update(
                    { status: 'todo', progress: 0 },
                    { where: { id: task.id } }
                );
            }
            
            return {
                ...task.toJSON(),
                progress: progress,
                status: status
            };
        }));

        // Update project status based on tasks
        await updateProjectStatusBasedOnTasks(id);
        
        // Refresh project data
        const updatedProject = await Project.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ]
        });

        res.json({ 
            project: {
                ...updatedProject.toJSON(),
                tasks: updatedTasks
            },
            actualTaskCount: updatedTasks.length
        });

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
        
        // AUTO-COMPLETION LOGIC: Set end_date when progress reaches 100%
        if (progress !== undefined) {
            updateData.progress = progress;
            
            // If progress is set to 100%, mark as completed and set end_date
            if (progress >= 100) {
                updateData.status = 'completed';
                if (!project.end_date) {
                    updateData.end_date = new Date();
                }
            }
            // If progress was 100% and is now less than 100%, clear end_date
            else if (project.progress >= 100 && progress < 100) {
                updateData.status = 'in_progress';
                updateData.end_date = null;
            } else if (progress > 0) {
                // Any progress > 0 means the project is in progress
                updateData.status = 'in_progress';
            } else {
                // 0 progress means planned
                updateData.status = 'planned';
            }
        }
        
        // If status is set to completed, update progress to 100% and set end_date
        if (status === 'completed') {
            updateData.progress = 100;
            updateData.status = 'completed';
            if (!project.end_date) {
                updateData.end_date = new Date();
            }
        }
        // If status is changed from completed to something else, reset progress
        else if (project.status === 'completed' && status && status !== 'completed') {
            updateData.progress = 0;
            updateData.end_date = null;
        }
        
        // If status is provided (and not handled above), update it
        if (status && status !== 'completed') {
            updateData.status = status;
            // Ensure status matches progress
            if (status === 'in_progress' && project.progress === 0) {
                updateData.progress = 1; // Minimum progress for in_progress
            }
        }

        // Only Admin/Creator can update core info
        if (isAdmin || isCreator) {
            if (name) updateData.name = name;
            if (description !== undefined) updateData.description = description;
        }

        await project.update(updateData);
        
        // Sync project status based on tasks after manual update
        await updateProjectStatusBasedOnTasks(id);
        
        try {
            if (typeof sendActivityLog === 'function') {
                await sendActivityLog(
                    req.user.id,
                    'UPDATE_PROJECT',
                    'project',
                    project.id,
                    { 
                        projectName: project.name,
                        updates: updateData
                    }
                );
            }
        } catch (kafkaError) {
            console.warn("Kafka event failed to send:", kafkaError.message);
        }
        
        res.json({ 
            message: 'Project updated successfully', 
            project 
        });

    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: error.message });
    }
};

// New endpoint to manually sync project status
exports.syncProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check permission
        if (req.user.role !== 'admin' && project.created_by !== req.user.id) {
            const workspaceMember = await TeamMember.findOne({
                where: { user_id: req.user.id },
                include: [{
                    model: Team,
                    where: { workspace_id: project.workspace_id }
                }]
            });
            
            if (!workspaceMember) {
                return res.status(403).json({ error: 'Not authorized to sync this project' });
            }
        }

        // Sync project status based on tasks
        await updateProjectStatusBasedOnTasks(id);
        
        // Get updated project
        const updatedProject = await Project.findByPk(id);
        
        res.json({ 
            message: 'Project status synced successfully',
            project: updatedProject
        });
    } catch (error) {
        console.error('Sync project status error:', error);
        res.status(500).json({ error: 'Failed to sync project status' });
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

        // Get tasks
        const tasks = await Task.findAll({ 
            where: { project_id: id },
            attributes: ['id', 'status', 'priority', 'progress']
        });
        
        // Update task statuses based on progress
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
            
            return { ...task.toJSON(), status };
        });
        
        // Create stats
        const stats = {
            total_tasks: updatedTasks.length,
            todo_tasks: updatedTasks.filter(t => t.status === 'todo' || t.status === 'pending').length,
            in_progress_tasks: updatedTasks.filter(t => t.status === 'in_progress' || t.status === 'in progress').length,
            completed_tasks: updatedTasks.filter(t => t.status === 'completed' || t.status === 'done').length,
            priority_distribution: {
                low: updatedTasks.filter(t => t.priority === 'low' || t.priority === 'Low').length,
                medium: updatedTasks.filter(t => t.priority === 'medium' || t.priority === 'Medium').length,
                high: updatedTasks.filter(t => t.priority === 'high' || t.priority === 'High').length
            }
        };

        res.json({ stats });
    } catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Failed to get project statistics' });
    }
};

// New: Get project analytics for dashboard
exports.getProjectAnalytics = async (req, res) => {
    try {
        // Get projects for the current user based on their role
        let where = {};
        
        if (req.user.role === 'member') {
            const assignedTasks = await Task.findAll({
                where: { assigned_to: req.user.id },
                attributes: ['project_id'],
                raw: true
            });
            const projectIds = [...new Set(assignedTasks.map(t => t.project_id))];
            where.id = { [Op.in]: projectIds };
        } 
        else if (req.user.role !== 'admin') {
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

        const projects = await Project.findAll({
            where,
            attributes: ['id', 'name', 'status', 'progress', 'created_at', 'updated_at']
        });

        const analytics = {
            total_projects: projects.length,
            projects_by_status: {
                planned: projects.filter(p => p.status === 'planned').length,
                in_progress: projects.filter(p => p.status === 'in_progress').length,
                completed: projects.filter(p => p.status === 'completed').length
                // Note: on_hold is removed as requested
            },
            average_progress: projects.length > 0 
                ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
                : 0,
            recent_projects: projects
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                .slice(0, 10)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    last_updated: p.updated_at
                }))
        };

        res.json({ analytics });
    } catch (error) {
        console.error('Get project analytics error:', error);
        res.status(500).json({ error: 'Failed to get project analytics' });
    }
};