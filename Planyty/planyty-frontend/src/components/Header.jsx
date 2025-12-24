import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, User, LogOut } from 'lucide-react';
import NotificationsModule from '../components/notifications/NotificationsModule'; // Add this import

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-lg rounded-lg mx-4 mt-4 border border-purple-200">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Empty space where logo would be */}
        <div className="flex items-center space-x-4">
          {/* Search bar on mobile */}
          <div className="lg:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-1.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-48 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Center - Search bar on desktop */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-1.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Right side - Notifications and User menu */}
        <div className="flex items-center space-x-4">
          {/* Replace the simple bell button with NotificationsModule */}
          <NotificationsModule />
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700 hidden sm:block">
                {user?.name || 'User'}
              </span>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;