// src/services/userService.js
import api from './api';

export const userService = {
  // Get current user profile
  getCurrentUser() {
    return api.get('/users/profile');
  },

  // Update user profile
  updateProfile(data) {
    return api.put('/users/profile', data);
  },

  // Change password
  changePassword(currentPassword, newPassword) {
    return api.put('/users/change-password', { currentPassword, newPassword });
  },

  // Update preferences
  updatePreferences(preferences) {
    return api.put('/users/preferences', { preferences });
  },

  // Search users
  searchUsers(query) {
    return api.get(`/users/search?query=${query}`);
  },

  // Upload profile picture
  uploadProfilePicture(formData) {
    return api.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete account
  deleteAccount() {
    return api.delete('/users/account');
  },

  // Export data
  exportData() {
    return api.get('/users/export-data', { responseType: 'blob' });
  },
};