import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// This interceptor runs BEFORE every request
api.interceptors.request.use((config) => {
  // Try to get the token from ANY possible key we might have used
  const token = localStorage.getItem('token') || localStorage.getItem('planyty_token');
  
  // Only attach if it's a real string and NOT "[object Object]"
  if (token && token !== '[object Object]' && token !== 'undefined') {
    // Ensure no quotes are hanging around
    const cleanToken = token.replace(/"/g, '').trim();
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;