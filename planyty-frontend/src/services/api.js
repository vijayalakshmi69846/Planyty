import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('planyty_token');
  if (token && token !== '[object Object]') {
    const cleanToken = token.replace(/"/g, '').trim();
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor to handle automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to call the refresh endpoint
        const refreshRes = await axios.post(
          'http://localhost:5000/api/auth/refresh', 
          {}, 
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const newToken = refreshRes.data.token;
        localStorage.setItem('planyty_token', newToken);

        // Update the failed request header and retry it
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, session is truly dead
        localStorage.removeItem('planyty_token');
        localStorage.removeItem('planyty_user');
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;