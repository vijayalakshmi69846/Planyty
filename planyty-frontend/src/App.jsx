// src/App.jsx (FIXED VERSION)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
// Layout Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
// Pages
import LandingPage from './pages/LandingPage';
import CompanyOnboarding from './pages/CompanyOnboarding';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import Meetings from './pages/Meetings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import Team from './pages/Team';
import Settings from './pages/Settings';
// Workspace Pages
import Workspaces from './pages/workspaces/Workspaces';
import WorkspaceDetail from './pages/workspaces/WorkspaceDetail';
import CreateWorkspace from './pages/workspaces/CreateWorkspace';
// Project Pages  
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import CreateProject from './pages/projects/CreateProject';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// Import your new logo
import logo from './assets/planytynewlogo.png';

// ✅ Simple Private Route Component (if you need it, but your AuthProvider already handles this)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// ✅ Main Layout for authenticated users
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-accent-300 to-pink-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-40 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-purple-200"
        >
          <img src={logo} alt="Planyty Logo" className="w-8 h-8 object-contain" />
        </button>
      )}

      {isSidebarOpen && (
        <div className="fixed top-4 left-4 z-40 w-64 h-16 cursor-pointer" onClick={toggleSidebar} />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Workspace Routes */}
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/workspaces/create" element={<CreateWorkspace />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
            
            {/* Project Routes */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            
            {/* Workspace-specific project routes */}
            <Route path="/workspaces/:workspaceId/projects/create" element={<CreateProject />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDetail />} />
            
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/meetings" element={<Meetings workspaceId={1} />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ✅ App Router - FIXED GATEKEEPER LOGIC
const AppRouter = () => {
  const { user, loading } = useAuth();

  // Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboard-company" element={<CompanyOnboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          {/* Protected Routes - All routes under MainLayout are protected */}
          <Route path="/*" element={<MainLayout />} />
          
          {/* These redirects ensure users can't access auth pages when logged in */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboard-company" element={<Navigate to="/dashboard" replace />} />
          
          {/* Keep reset password accessible from email links */}
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </>
      )}
    </Routes>
  );
};

// ✅ Root Component with all Providers
const App = () => (
  <AuthProvider>
    <AppProvider>
      <SocketProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </SocketProvider>
    </AppProvider>
  </AuthProvider>
);

export default App;