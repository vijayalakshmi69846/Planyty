import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // CRITICAL: Allows browser to send the Refresh Token cookie
});
// Store token functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

// Initialize with stored token
const storedToken = localStorage.getItem('token');
if (storedToken && storedToken !== 'undefined' && storedToken !== '[object Object]') {
  const cleanToken = storedToken.replace(/"/g, '').trim();
  api.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
}

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using the refresh token endpoint
        const refreshToken = localStorage.getItem('refreshToken') || 
                            localStorage.getItem('planyty_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // Clean the refresh token
        const cleanRefreshToken = refreshToken.replace(/"/g, '').trim();
        
        // Call refresh token endpoint
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, 
          { refreshToken: cleanRefreshToken },
          { withCredentials: true }
        );
        
        const { token: newAccessToken } = refreshResponse.data;
        
        // Update stored token
        localStorage.setItem('token', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Retry the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('planyty_token');
        localStorage.removeItem('planyty_user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
// // REQUEST: Add Access Token
// api.interceptors.request.use((config) => {
//   let token = localStorage.getItem('planyty_token');
//   if (token) {
//     const cleanToken = token.replace(/"/g, '').trim();
//     if (cleanToken.length > 20) {
//       config.headers.Authorization = `Bearer ${cleanToken}`;
//     }
//   }
//   return config;
// });

// // RESPONSE: Handle 401 and Refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If 401 error and not already retrying
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         console.log("Access token expired, attempting refresh...");
//         // Call the refresh endpoint (this sends the httpOnly cookie automatically)
//         const res = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        
//         const newAccessToken = res.data.token;
//         localStorage.setItem('planyty_token', newAccessToken);
        
//         // Update header and retry the original request
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         console.error("Refresh token expired or invalid. Logging out.");
//         localStorage.removeItem('planyty_user');
//         localStorage.removeItem('planyty_token');
//         if (!window.location.pathname.includes('/login')) {
//           window.location.href = '/login';
//         }
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;