import api from './api';

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    // In a real app, you would store the token/user data from response.data
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const signup = async (name, email, password) => {
  try {
    const response = await api.post('/auth/signup', { name, email, password });
    // In a real app, you would store the token/user data from response.data
    return response.data;
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
};

export const logout = () => {
  // Simulate clearing local storage/session
  localStorage.removeItem('planyty_user');
  // In a real app, you might call an API endpoint to invalidate the session
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('planyty_user');
  return user ? JSON.parse(user) : null;
};
