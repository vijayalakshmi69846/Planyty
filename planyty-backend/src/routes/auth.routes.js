// src/routes/auth.routes.js 
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware'); 
// 1. Check Invitation Status (Returns invitation_token)
router.post('/initiate-signup', authController.initiateSignup); 
// 2. Accept Invitation & Register (Uses token to verify and create user)
router.post('/accept-invitation', authController.acceptInvitation);
// 3. Login (Generates JWT on success)
router.post('/login', authController.login);
// --- PROTECTED ROUTES (Requires JWT) ---
// Get Profile 
router.get('/auth/profile', protect, authController.getProfile);
// Example Admin-Only Route
router.get('/admin/dashboard', protect, authorize(['admin']), (req, res) => {
   res.status(200).json({ message: 'Welcome Admin!', user: req.user.toJSON() });
});
// auth.routes.js - Add this route
router.post('/refresh-token', authController.refreshAccessToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
module.exports = router;