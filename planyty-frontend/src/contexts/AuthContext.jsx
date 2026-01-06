// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; 

export const AuthContext = createContext();

const AuthProviderContent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupEmail, setSignupEmail] = useState(null);
  const [invitationRole, setInvitationRole] = useState(null);
  const [invitationToken, setInvitationToken] = useState(null);

  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000/api";

  // FIXED: Initial Load with better error handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem("planyty_user");
        const savedToken = localStorage.getItem("planyty_token");
        
        if (savedUser && savedToken) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            
            // Verify token is still valid
            try {
              await api.get("/auth/profile");
            } catch (error) {
              if (error.response?.status === 401) {
                console.log("Token expired, logging out");
                logout();
              }
            }
          } catch (e) {
            console.error("Failed to parse saved user:", e);
            logout();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const isTeamLead = user?.role === 'team_lead' || user?.role === 'admin';

  // 2. Universal API Fetcher (For simple fetch calls)
  const fetchApi = async (path, options = {}) => {
    const token = localStorage.getItem("planyty_token") || localStorage.getItem("token");
    
    let cleanToken = token;
    if (token && typeof token === 'string') {
      cleanToken = token.replace(/"/g, '').trim();
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (cleanToken && cleanToken !== 'undefined' && cleanToken !== '[object Object]') {
      headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    const config = { ...options, headers };
    const res = await fetch(`${API_BASE}${path}`, config);
    const data = await res.json();
    
    if (!res.ok) {
      if (res.status === 401) logout();
      throw new Error(data.message || `API call failed with status ${res.status}`);
    }
    return data;
  };
// src/contexts/AuthContext.js - Update login function
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    // Store tokens
    localStorage.setItem('token', token);
    localStorage.setItem('planyty_token', token);
    localStorage.setItem('planyty_user', JSON.stringify(user));
    
    // Set axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Login failed' };
  }
};
// Rest of your functions remain similar but with error handling
  const acceptInvitation = async (token, name, password) => {
    try {
      console.log("🚀 acceptInvitation called with token:", token?.substring(0, 10) + '...');
      
      const response = await fetch(`${API_BASE}/auth/accept-invitation`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, name, password }),
      });

      console.log("📥 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Server response:", data);

      const { user: newUser, token: jwtToken } = data;
      let finalToken = typeof jwtToken === 'object' ? jwtToken.token : jwtToken;
      
      if (finalToken) {
        finalToken = finalToken.replace(/"/g, '').trim();
        setUser(newUser);
        
        localStorage.setItem("planyty_user", JSON.stringify(newUser));
        localStorage.setItem("planyty_token", finalToken);
        
        // Set API header
        api.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;
        
        return { success: true, user: newUser };
      }
      
      throw new Error("No token received from server");
    } catch (error) {
      console.error("💥 acceptInvitation error:", error);
      throw error;
    }
  };
  // 5. Signup Initiation
  const initiateSignup = async (email) => {
    const data = await fetchApi("/auth/initiate-signup", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setSignupEmail(email);
    setInvitationRole(data.assigned_role);
    setInvitationToken(data.invitation_token);
    return data;
  };

// Update logout function
const logout = () => {
  // Call backend logout
  api.post('/auth/logout').catch(console.error);
  
  // Clear all storage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('planyty_token');
  localStorage.removeItem('planyty_user');
  delete api.defaults.headers.common['Authorization'];
  
  setUser(null);
  window.location.href = '/login';
};

return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isTeamLead,
        signupEmail,
        invitationRole,
        invitationToken,
        login,
        logout,
        acceptInvitation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  return <AuthProviderContent>{children}</AuthProviderContent>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
