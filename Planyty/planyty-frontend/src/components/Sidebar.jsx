import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, MessageSquare, Calendar, Settings, Users, Folder, X } from 'lucide-react';
import logo from '../assets/planytynewlogo.png';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', path: '/workspaces', icon: Folder },
  { name: 'Tasks', path: '/tasks', icon: ListChecks },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Meetings', path: '/meetings', icon: Calendar },
  { name: 'Team', path: '/team', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Overlay for mobile - closes sidebar when clicked */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-purple-50 to-pink-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out shadow-xl border-r border-purple-200`}
      >
        {/* Header with Clickable Logo to CLOSE sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          {/* LOGO SECTION - EXACT SAME AS FLOATING BUTTON */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 bg-white rounded-lg shadow-lg border border-purple-200"
              title="Close Menu"
            >
              <img
                src={logo}
                alt="Planyty Logo"
                className="w-8 h-8 object-contain"
              />
            </button>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ml-3">
              Planyty
            </h1>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 hover:bg-purple-100 rounded transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-purple-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-purple-700 hover:bg-purple-100 hover:text-purple-800'
                }`
              }
            >
              <item.icon
                className={`w-5 h-5 min-w-5 ${
                  window.location.pathname === item.path ? 'text-white' : 'text-purple-500'
                }`}
              />
              <span className="ml-3 whitespace-nowrap">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 text-center border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-xs text-purple-500">
            &copy; {new Date().getFullYear()} Planyty
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;