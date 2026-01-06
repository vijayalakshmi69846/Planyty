const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
// Project-specific task fetching
router.get('/projects/:projectId/tasks', protect, taskController.getTasksByProject);
// Task CRUD
router.post('/tasks', protect, taskController.createTask);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);
// Subtask Specific Actions
router.post('/tasks/:taskId/subtasks', protect, taskController.createSubtask);
router.put('/subtasks/:id', protect, taskController.updateSubtask);
// Ensure this route exists and matches the controller function
router.delete('/subtasks/:id', protect,taskController.deleteSubtask);
// Add this route in task.routes.js
router.get('/analytics', protect, taskController.getTaskAnalytics);
module.exports = router;