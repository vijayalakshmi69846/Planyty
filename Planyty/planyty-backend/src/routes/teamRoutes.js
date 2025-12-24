const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
// Use the 'protect' variable you imported here
const { protect } = require('../middleware/auth.middleware');

// 🔍 Debug logs to verify functions are loaded
console.log('--- Team Routes Initialization ---');
console.log('createTeam status:', typeof teamController.createTeam); 
console.log('addMember status:', typeof teamController.addMember);
console.log('protect middleware status:', typeof protect);

// Ensure the middleware is a function before applying to routes
if (typeof protect !== 'function') {
    console.error('CRITICAL ERROR: protect middleware is undefined! Check auth.middleware.js exports.');
}

// 1. Create a new team
router.post('/', protect, teamController.createTeam);

// 2. Get teams for a specific user
router.get('/user/:userId', protect, teamController.getTeamsByUser);

// 3. Update team details (Name/Description)
// FIX: Changed auth.middleware to protect
router.put('/:teamId', protect, teamController.updateTeam);

// 4. Delete a team
// FIX: Changed auth.middleware to protect
router.delete('/:teamId', protect, teamController.deleteTeam);

// 5. Add an individual member to an existing team
router.post('/:teamId/members', protect, teamController.addMember);
module.exports = router;