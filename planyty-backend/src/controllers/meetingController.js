const { Meeting, MeetingAttendee, User, Project, Workspace, Task } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const emailService = require('../services/email.service');

// Helper function to send email invitations
const sendMeetingInvitations = async (meeting, attendeeIds) => {
  try {
    // Get meeting creator details
    const creator = await User.findByPk(meeting.created_by, {
      attributes: ['id', 'name', 'email']
    });

    // Get project details if exists
    let projectName = 'General Meeting';
    if (meeting.project_id) {
      const project = await Project.findByPk(meeting.project_id, {
        attributes: ['name']
      });
      if (project) projectName = project.name;
    }

    // Get all attendees
    const attendees = await User.findAll({
      where: { id: attendeeIds },
      attributes: ['id', 'name', 'email']
    });

    // Send email to each attendee
    for (const attendee of attendees) {
      try {
        // Skip sending email to the creator (they already know)
        if (attendee.id === creator.id) continue;

        await emailService.sendMeetingInvitation({
          to: attendee.email,
          meeting: {
            title: meeting.title,
            date: new Date(meeting.start_time).toLocaleDateString(),
            time: new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${Math.round((new Date(meeting.end_time) - new Date(meeting.start_time)) / 60000)} minutes`,
            link: meeting.meeting_link,
            description: meeting.description,
            project: projectName
          },
          host: {
            name: creator.name,
            email: creator.email
          }
        });

        console.log(`📧 Meeting invitation sent to: ${attendee.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${attendee.email}:`, emailError.message);
        // Continue with other emails even if one fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending meeting invitations:', error);
    return false;
  }
};

// Helper function to calculate meeting status based on current time
const calculateMeetingStatus = (meeting) => {
  const now = new Date();
  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  
  // If meeting is manually marked as cancelled, keep it as cancelled
  if (meeting.status === 'cancelled') {
    return 'cancelled';
  }
  
  if (now < startTime) {
    return 'scheduled';
  } else if (now >= startTime && now <= endTime) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

// Helper function to update meeting statuses in database
const updateMeetingStatuses = async (meetings) => {
  const now = new Date();
  
  for (const meeting of meetings) {
    const newStatus = calculateMeetingStatus(meeting);
    
    // Only update if status has changed
    if (meeting.status !== newStatus) {
      try {
        await meeting.update({ status: newStatus });
        console.log(`Updated meeting ${meeting.id} status from ${meeting.status} to ${newStatus}`);
      } catch (error) {
        console.error(`Failed to update meeting ${meeting.id} status:`, error);
      }
    }
  }
};

class MeetingController {
  // Create a new meeting
  async createMeeting(req, res) {
    try {
      const { workspace_id, title, description, start_time, end_time, project_id } = req.body;
      const created_by = req.user.id;

      // Generate unique meeting link for Jitsi
      const meetingId = crypto.randomBytes(8).toString('hex');
      const meetingLink = `https://meet.jit.si/${workspace_id}_${meetingId}`;

      // Create meeting
      const meeting = await Meeting.create({
        workspace_id,
        created_by,
        title,
        description,
        meeting_link: meetingLink,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        project_id: project_id || null,
        status: 'scheduled'
      });

      // Find all users with tasks in this project (if project is selected)
      let attendees = [];
      
      if (project_id) {
        // Get all tasks in this project
        const tasks = await Task.findAll({
          where: { project_id },
          attributes: ['assigned_to'],
          raw: true
        });
        
        // Extract unique user IDs (exclude null/undefined)
        const userIds = [...new Set(tasks
          .map(task => task.assigned_to)
          .filter(userId => userId !== null && userId !== undefined)
        )];
        
        // Add the meeting creator to attendees if not already included
        if (!userIds.includes(created_by)) {
          userIds.push(created_by);
        }
        
        // Add attendees to the meeting
        const attendeeRecords = userIds.map(user_id => ({
          meeting_id: meeting.id,
          user_id,
          status: 'invited'
        }));
        
        if (attendeeRecords.length > 0) {
          await MeetingAttendee.bulkCreate(attendeeRecords);
        }
        
        attendees = userIds;
      } else {
        // If no project selected, just add the creator
        await MeetingAttendee.create({
          meeting_id: meeting.id,
          user_id: created_by,
          status: 'invited'
        });
        
        attendees = [created_by];
      }

      // Send email invitations to all attendees (fire and forget - don't wait for completion)
      sendMeetingInvitations(meeting, attendees).catch(error => {
        console.error('Failed to send meeting invitations:', error);
        // Don't fail the whole request if email sending fails
      });

      // Get meeting with associations
      const meetingWithDetails = await Meeting.findByPk(meeting.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'attendees',
            attributes: ['id', 'name', 'email'],
            through: {
              attributes: ['status']
            }
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Meeting created successfully and invitations sent!',
        data: meetingWithDetails
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create meeting',
        error: error.message
      });
    }
  }

  // Get workspace meetings
  async getWorkspaceMeetings(req, res) {
    try {
      const { workspace_id } = req.params;
      const { status, start_date, end_date } = req.query;

      const where = { workspace_id };
      
      if (status) where.status = status;
      if (start_date && end_date) {
        where.start_time = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const meetings = await Meeting.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'attendees',
            attributes: ['id', 'name', 'email'],
            through: {
              attributes: ['status']
            }
          }
        ],
        order: [['start_time', 'ASC']]
      });

      // Update meeting statuses based on current time
      await updateMeetingStatuses(meetings);

      // Filter based on frontend requirements
      let filteredMeetings = meetings;
      
      // For frontend filtering (upcoming/past), we need to recalculate
      if (status === 'scheduled') {
        // For "upcoming" filter, show only meetings that are still in the future
        filteredMeetings = meetings.filter(meeting => {
          const meetingStatus = calculateMeetingStatus(meeting);
          return meetingStatus === 'scheduled' || meetingStatus === 'ongoing';
        });
      } else if (status === 'completed') {
        // For "past" filter, show only meetings that are completed
        filteredMeetings = meetings.filter(meeting => {
          const meetingStatus = calculateMeetingStatus(meeting);
          return meetingStatus === 'completed';
        });
      }

      res.json({
        success: true,
        data: filteredMeetings
      });
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meetings',
        error: error.message
      });
    }
  }

  // Get projects for dropdown
  async getProjectsForDropdown(req, res) {
    try {
      const { workspace_id } = req.params;
      
      const projects = await Project.findAll({
        where: { workspace_id },
        attributes: ['id', 'name', 'description'],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message
      });
    }
  }

  // Get project members (users with tasks in project)
  async getProjectMembers(req, res) {
    try {
      const { project_id } = req.params;
      
      // Get all tasks in this project and their assignees
      const tasks = await Task.findAll({
        where: { project_id },
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email'],
            where: {
              id: { [Op.not]: null }
            },
            required: false
          }
        ]
      });

      // Extract unique users from tasks
      const membersMap = new Map();
      tasks.forEach(task => {
        if (task.assignee) {
          membersMap.set(task.assignee.id, {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email
          });
        }
      });

      const members = Array.from(membersMap.values());

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Error fetching project members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project members',
        error: error.message
      });
    }
  }

  // Get meeting by ID
  async getMeetingById(req, res) {
    try {
      const { id } = req.params;

      const meeting = await Meeting.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'attendees',
            attributes: ['id', 'name', 'email'],
            through: {
              attributes: ['status']
            }
          }
        ]
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Update meeting status based on current time
      const newStatus = calculateMeetingStatus(meeting);
      if (meeting.status !== newStatus) {
        await meeting.update({ status: newStatus });
      }

      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch meeting',
        error: error.message
      });
    }
  }

  // Update meeting
  async updateMeeting(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const meeting = await Meeting.findByPk(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Check if user is the creator
      if (meeting.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only meeting creator can update'
        });
      }

      // Update meeting
      if (updates.start_time) updates.start_time = new Date(updates.start_time);
      if (updates.end_time) updates.end_time = new Date(updates.end_time);

      await meeting.update(updates);

      // Update attendees if provided
      if (updates.attendees) {
        // Remove existing attendees
        await MeetingAttendee.destroy({ where: { meeting_id: id } });
        
        // Add new attendees
        const attendeeRecords = updates.attendees.map(user_id => ({
          meeting_id: id,
          user_id,
          status: 'invited'
        }));
        await MeetingAttendee.bulkCreate(attendeeRecords);
      }

      const updatedMeeting = await Meeting.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'attendees',
            attributes: ['id', 'name', 'email'],
            through: {
              attributes: ['status']
            }
          }
        ]
      });

      res.json({
        success: true,
        message: 'Meeting updated successfully',
        data: updatedMeeting
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update meeting',
        error: error.message
      });
    }
  }

  // Delete meeting
  async deleteMeeting(req, res) {
    try {
      const { id } = req.params;

      const meeting = await Meeting.findByPk(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Check if user is the creator
      if (meeting.created_by !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this meeting'
        });
      }

      // Delete meeting attendees first
      await MeetingAttendee.destroy({ where: { meeting_id: id } });
      
      // Delete meeting
      await meeting.destroy();

      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete meeting',
        error: error.message
      });
    }
  }

  // Update attendee status
  async updateAttendeeStatus(req, res) {
    try {
      const { meeting_id, user_id } = req.params;
      const { status } = req.body;

      const attendee = await MeetingAttendee.findOne({
        where: { meeting_id, user_id }
      });

      if (!attendee) {
        return res.status(404).json({
          success: false,
          message: 'Attendee not found for this meeting'
        });
      }

      await attendee.update({ status });

      res.json({
        success: true,
        message: 'Attendee status updated successfully'
      });
    } catch (error) {
      console.error('Error updating attendee status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attendee status',
        error: error.message
      });
    }
  }

  // Get user's meetings
  async getUserMeetings(req, res) {
    try {
      const user_id = req.user.id;
      const { status, upcoming } = req.query;

      const meetings = await Meeting.findAll({
        include: [
          {
            model: User,
            as: 'attendees',
            where: { id: user_id },
            attributes: [],
            through: {
              where: {}
            }
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          }
        ],
        where: status ? { status } : {},
        order: [['start_time', 'ASC']]
      });

      // Update meeting statuses based on current time
      await updateMeetingStatuses(meetings);

      // Filter based on frontend requirements
      let filteredMeetings = meetings;
      
      // For upcoming filter, show only meetings that are still in the future
      if (upcoming === 'true') {
        const now = new Date();
        filteredMeetings = meetings.filter(meeting => {
          const meetingStatus = calculateMeetingStatus(meeting);
          return meetingStatus === 'scheduled' || meetingStatus === 'ongoing';
        });
      }

      res.json({
        success: true,
        data: filteredMeetings
      });
    } catch (error) {
      console.error('Error fetching user meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user meetings',
        error: error.message
      });
    }
  }
}

module.exports = new MeetingController();