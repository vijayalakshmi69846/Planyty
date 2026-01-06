// meeting.routes.js - FINAL WORKING VERSION
const express = require('express');
const router = express.Router();

const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware.protect);

// Meeting routes
router.post('/', meetingController.createMeeting);
router.get('/workspace/:workspace_id/meetings', meetingController.getWorkspaceMeetings);
router.get('/:id', meetingController.getMeetingById);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

// Project-related routes
router.get('/workspace/:workspace_id/projects/dropdown', meetingController.getProjectsForDropdown);
router.get('/project/:project_id/members', meetingController.getProjectMembers);

// Attendee routes
router.put('/:meeting_id/attendees/:user_id/status', meetingController.updateAttendeeStatus);

// User meetings
router.get('/user/meetings', meetingController.getUserMeetings);

module.exports = router;