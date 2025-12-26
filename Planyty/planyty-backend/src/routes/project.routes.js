const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

// GET all projects (The missing route causing the 404)
router.get('/', protect, projectController.getAllProjects);

// GET project by ID
router.get('/:id', protect, projectController.getProjectById);

// POST create project
router.post('/', protect, projectController.createProject);

// PUT update project
router.put('/:id', protect, projectController.updateProject);

// DELETE project
router.delete('/:id', protect, projectController.deleteProject);

module.exports = router;