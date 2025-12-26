const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// CHANGE THIS LINE: Use { protect } instead of { auth }
const { protect } = require('../middleware/auth.middleware');

// Search must come BEFORE /:id so it doesn't get treated as an ID
// UPDATE 'auth' to 'protect' in all routes below
router.get('/search', protect, userController.searchUsers);
router.get('/', protect, userController.getAllUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/profile', protect, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);
router.put('/:id/role', protect, userController.updateUserRole);

module.exports = router;