// src/App.jsx (updated with NotificationProvider and routes)
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage'; // Added
import CompanyOnboarding from './pages/CompanyOnboarding'; // Added
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

// Import your new logo
import logo from './assets/planytynewlogo.png';

// ✅ Main Layout for authenticated users
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-accent-300 to-pink-50">
      {/* Sidebar - Starts OPEN */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
      />

      {/* Floating Logo Button */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-40 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-purple-200"
          title="Open Menu"
        >
          <img
            src={logo}
            alt="Planyty Logo"
            className="w-8 h-8 object-contain"
          />
        </button>
      )}

      {/* Clickable area to close sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed top-4 left-4 z-40 w-64 h-16 cursor-pointer"
          onClick={toggleSidebar}
          title="Close Menu"
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'
      }`}>
        <Header />

        {/* Main content */}
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
            <Route path="/workspaces/:workspaceId/projects/create" element={<CreateProject />} />
            <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDetail />} />
            
            {/* Existing Routes */}
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Catch all routes in main layout and redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ✅ App Router - Handles all routing including auth
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-700">Loading...</p>
        </div>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          {/* Protected Routes - Redirect authenticated users away from auth pages */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboard-company" element={<Navigate to="/dashboard" replace />} />
          <Route path="/*" element={<MainLayout />} />
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