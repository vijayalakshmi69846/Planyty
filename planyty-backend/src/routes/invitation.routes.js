const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');

// --- PUBLIC ROUTES (No Token Required) ---
// These must stay above router.use(protect)

// Used by the Onboarding Wizard
router.post('/onboard/validate-step1', invitationController.sendStep1Validation);
router.post('/auth/check-emails', invitationController.checkEmailsExist);
router.post('/onboard', invitationController.sendCompanyInvitations);

// Used when a user clicks the link in their email
router.post('/accept/:token', invitationController.acceptInvitation);

// --- PROTECTED ROUTES (Token Required) ---
router.use(protect);

router.get('/', invitationController.getInvitations);
router.post('/', invitationController.sendInvitation);
router.delete('/:id', invitationController.cancelInvitation);

module.exports = router;