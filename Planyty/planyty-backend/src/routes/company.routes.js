// src/routes/company.routes.js (FIXED)

const express = require('express');
const router = express.Router();
// ⭐ FIX: Import the new controller function along with the existing one
const { 
  sendCompanyInvitations, 
  sendStep1Validation 
} = require('../controllers/invitation.controller'); 

// Public route for final company onboarding submission
router.post('/onboard', sendCompanyInvitations);

// Public route for step 1 validation (runs before the final submission)
router.post('/onboard/validate-step1', sendStep1Validation); 

module.exports = router;