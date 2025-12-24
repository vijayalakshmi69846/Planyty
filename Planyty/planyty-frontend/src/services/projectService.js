import api from './api';

export const getProjects = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}/projects`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
};

export const createProject = async (workspaceId, projectData) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/projects`, projectData);
    return response.data;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};

// Add more project-related service functions as needed (e.g., update, delete, getById)
