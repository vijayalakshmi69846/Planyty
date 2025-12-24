// src/routes/workspace.routes.js
const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { protect } = require('../middleware/auth.middleware');
router.use(protect);
// This handles GET http://localhost:5000/api/workspaces
router.get('/', workspaceController.getAllWorkspaces); 
// This handles POST http://localhost:5000/api/workspaces
router.post('/', workspaceController.createWorkspace);
// This handles GET http://localhost:5000/api/workspaces/:id
router.get('/:id', workspaceController.getWorkspaceById);
// Add these to your existing workspace routes
router.put('/:id', protect, workspaceController.updateWorkspace);
// Ensure the parameter names match what you destructure in the controller
router.delete('/:id/members/:userId', workspaceController.removeMember);
// router.delete('/:id/members/:userId', protect, workspaceController.removeMember);
// src/routes/workspace.routes.js
router.delete('/:id', protect, workspaceController.deleteWorkspace);
module.exports = router;