const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All routes require authentication
router.use(protect);
router.get('/test-status', projectController.testProjectStatus);
// Project routes
router.post('/', authorize('admin', 'team_lead'), projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/analytics', projectController.getProjectAnalytics);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', authorize('admin', 'team_lead'), projectController.deleteProject);
router.get('/:id/stats', projectController.getProjectStats);
router.put('/:id/sync-status', projectController.syncProjectStatus);
router.put('/sync-all', protect, projectController.syncAllProjectsStatus); // ADD THIS LINE
router.put('/fix-task-counts', projectController.fixTaskCounts);
router.put('/:id/force-sync', protect, projectController.forceSyncProject);
module.exports = router;