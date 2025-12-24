// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('planyty_token');
  
  console.log("API Interceptor - Raw token from storage:", token);
  
  // If token doesn't exist or is corrupted, skip adding Authorization header
  if (!token || token === "[object Object]" || token === "undefined" || token === "null") {
    console.warn("Invalid token detected in interceptor, skipping Authorization header");
    return config;
  }
  
  // Clean the token
  const cleanToken = token.replace(/"/g, '').trim();
  
  // Verify it looks like a JWT (contains dots and is reasonably long)
  if (cleanToken && cleanToken.includes('.') && cleanToken.length > 20) {
    config.headers.Authorization = `Bearer ${cleanToken}`;
    console.log("API Interceptor - Added Authorization header with token");
  } else {
    console.warn("Token doesn't look like a valid JWT, skipping:", cleanToken);
  }
  
  return config;
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log("Unauthorized response - clearing storage");
      localStorage.removeItem('planyty_user');
      localStorage.removeItem('planyty_token');
      
      // Only redirect if we're not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;