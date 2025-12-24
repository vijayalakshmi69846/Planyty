// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// IMPORT YOUR API SERVICE (Ensure path is correct based on your folder structure)
import api from "../services/api"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  return <AuthProviderContent>{children}</AuthProviderContent>;
};

const AuthProviderContent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupEmail, setSignupEmail] = useState(null);
  const [invitationRole, setInvitationRole] = useState(null);
  const [invitationToken, setInvitationToken] = useState(null);

  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000/api";

  // 1. Initial Load: Check for saved session
  useEffect(() => {
    const savedUser = localStorage.getItem("planyty_user");
    const savedToken = localStorage.getItem("planyty_token") || localStorage.getItem("token");
    
    if (savedUser && savedToken && savedToken !== '[object Object]') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        logout();
      }
    }
    setLoading(false);
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

  // 3. Login Logic (Fixes the "api is not defined" error)
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;
      
      // Ensure we get a string even if backend returns an object { token: "..." }
      const tokenString = typeof token === 'object' ? token.token : token;
      
      if (tokenString) {
        const cleanToken = tokenString.replace(/"/g, '').trim();
        setUser(user);
        
        // Save to all possible keys for maximum compatibility
        localStorage.setItem("planyty_user", JSON.stringify(user));
        localStorage.setItem("token", cleanToken); 
        localStorage.setItem("planyty_token", cleanToken);
        
        return { success: true };
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // 4. Accept Invitation Logic
  const acceptInvitation = async (token, name, password) => {
    const data = await fetchApi("/auth/accept-invitation", {
      method: "POST",
      body: JSON.stringify({ token, name, password }),
    });

    const { user: newUser, token: jwtToken } = data;
    let finalToken = typeof jwtToken === 'object' ? jwtToken.token : jwtToken;
    
    if (finalToken) {
      finalToken = finalToken.replace(/"/g, '').trim();
      setUser(newUser);
      localStorage.setItem("planyty_user", JSON.stringify(newUser));
      localStorage.setItem("token", finalToken);
      localStorage.setItem("planyty_token", finalToken);
    }
    return { success: true };
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

  // 6. Logout Logic
  const logout = () => {
    setUser(null);
    localStorage.removeItem("planyty_user");
    localStorage.removeItem("planyty_token");
    localStorage.removeItem("token"); 
    navigate("/login");
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
        initiateSignup,
        acceptInvitation,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};