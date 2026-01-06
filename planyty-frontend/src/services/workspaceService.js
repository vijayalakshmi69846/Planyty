import api from './api';

export const getWorkspaces = async () => {
  try {
    const response = await api.get('/workspaces');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    throw error;
  }
};

export const createWorkspace = async (name) => {
  try {
    const response = await api.post('/workspaces', { name });
    return response.data;
  } catch (error) {
    console.error('Failed to create workspace:', error);
    throw error;
  }
};

// Add more workspace-related service functions as needed (e.g., update, delete, getById)
