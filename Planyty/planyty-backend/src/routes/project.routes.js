const express = require('express');
const router = express.Router();
const { Project } = require('../models');
const { protect } = require('../middleware/auth.middleware');
const { deleteProject, updateProject } = require('../controllers/project.controller');
// Match the POST route
router.post('/', protect, async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      created_by: req.user.id,
      // Ensure workspace_id is coming from req.body
      workspace_id: req.body.workspace_id 
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add an update route
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, progress, task_count } = req.body;
    await Project.update(
      { name, description, progress, task_count },
      { where: { id: req.params.id } }
    );
    res.json({ message: "Project updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id', protect, updateProject); // Use your controller function here
router.delete('/:id', protect, deleteProject); // Add this line!
module.exports = router;