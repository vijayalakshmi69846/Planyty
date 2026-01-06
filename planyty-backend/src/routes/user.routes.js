// user.routes.js - Update to include new endpoints
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // You'll need to create this

// Current user profile
router.get('/profile', protect, userController.getCurrentUserProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);
router.put('/preferences', protect, userController.updatePreferences);

// Avatar upload
router.post('/upload-avatar', protect, upload.single('avatar'), userController.uploadAvatar);

// Account management
router.delete('/account', protect, userController.deleteAccount);
router.get('/export-data', protect, userController.exportData);

// Search and user management
router.get('/search', protect, userController.searchUsers);
router.get('/', protect, userController.getAllUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/:id/role', protect, userController.updateUserRole);

module.exports = router;