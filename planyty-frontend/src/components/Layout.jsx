import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  List,
  MessageSquare,
  Calendar,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  LogOut
} from "lucide-react";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-purple-50 to-pink-50 shadow-md transition-all duration-300 z-50 border-r border-purple-200 ${
          isOpen ? "w-60" : "w-16"
        }`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200">
          {isOpen && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Planyty
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-purple-100 transition text-purple-500"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <LayoutDashboard size={18} className={window.location.pathname === '/dashboard' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Dashboard"}
          </NavLink>

          <NavLink
            to="/workspaces"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <Folder size={18} className={window.location.pathname === '/workspaces' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Workspaces"}
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <List size={18} className={window.location.pathname === '/tasks' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Tasks"}
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <MessageSquare size={18} className={window.location.pathname === '/chat' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Chat"}
          </NavLink>

          <NavLink
            to="/meetings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <Calendar size={18} className={window.location.pathname === '/meetings' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Meetings"}
          </NavLink>

          <NavLink
            to="/team"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <Users size={18} className={window.location.pathname === '/team' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Team"}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-100 transition-all duration-200 ${
                isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : ""
              }`
            }
          >
            <Settings size={18} className={window.location.pathname === '/settings' ? 'text-white' : 'text-purple-500'} /> 
            {isOpen && "Settings"}
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 w-full text-center text-xs text-purple-500">
          © 2025 Planyty
        </div>
      </aside>

      {/* ===== Main Section ===== */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
          isOpen ? "ml-60" : "ml-16"
        }`}
      >
        {/* Fixed Header */}
        <header className="fixed top-0 right-0 left-0 bg-white shadow-sm h-14 flex items-center justify-between px-6 z-40 border-b border-purple-200 rounded-b-lg">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-1.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors relative">
              <Bell className="w-5 h-5 text-purple-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">Harshini</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* ===== Page Content ===== */}
        <main className="flex-1 mt-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;