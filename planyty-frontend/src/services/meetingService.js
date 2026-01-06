import api from './api';

export const meetingService = {
  // Create a new meeting
  createMeeting: async (meetingData) => {
    try {
      const response = await api.post('/meetings', meetingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all meetings for workspace - FIXED URL
  getWorkspaceMeetings: async (workspaceId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      // FIX: Changed URL from /workspace/:id/meetings to /meetings/workspace/:id/meetings
      const response = await api.get(`/meetings/workspace/${workspaceId}/meetings?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get meeting by ID
  getMeetingById: async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update meeting
  updateMeeting: async (meetingId, updates) => {
    try {
      const response = await api.put(`/meetings/${meetingId}`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete meeting
  deleteMeeting: async (meetingId) => {
    try {
      const response = await api.delete(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update attendee status
  updateAttendeeStatus: async (meetingId, userId, status) => {
    try {
      const response = await api.put(`/meetings/${meetingId}/attendees/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's meetings
  getUserMeetings: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/meetings/user/meetings?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get projects for dropdown
  getProjectsForDropdown: async (workspaceId) => {
    try {
      const response = await api.get(`/meetings/workspace/${workspaceId}/projects/dropdown`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get project members
  getProjectMembers: async (projectId) => {
    try {
      const response = await api.get(`/meetings/project/${projectId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};