// const express = require('express');
// const router = express.Router();
// const invitationController = require('../controllers/invitation.controller');
// const { protect } = require('../middleware/auth.middleware');

// // Standard routes
// router.use(protect);

// // This fixes :5000/api/invitations
// router.get('/', invitationController.getInvitations);

// // This fixes :5000/api/invitations (POST)
// router.post('/', invitationController.sendInvitation);

// // This fixes :5000/api/invitations/:id (DELETE/CANCEL)
// // Ensure this matches the ID format (UUID vs Integer) in your DB
// router.delete('/:id', invitationController.cancelInvitation);
// module.exports = router;
// invitation.routes.js
// invitation.routes.js
const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');

// 1. ADD THIS ROUTE HERE (Public)
router.post('/accept/:token', invitationController.acceptInvitation); // ADD THIS
// 2. Standard routes (Protected)
router.use(protect);
router.get('/', invitationController.getInvitations);
router.post('/', invitationController.sendInvitation);
router.delete('/:id', invitationController.cancelInvitation);

module.exports = router;