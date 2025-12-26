// src/services/userService.js
import api from './api';

export const userService = {
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?query=${query}`);
    return response.data; // Array of {id, email, username}
  }
};