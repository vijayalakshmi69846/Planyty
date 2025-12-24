import api from './api';

export const getTasks = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const response = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    return response.data;
  } catch (error) {
    console.error('Failed to update task status:', error);
    throw error;
  }
};

// Add more task-related service functions as needed (e.g., update, delete, getById)
