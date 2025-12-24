// src/components/notifications/NotificationsModule.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext'; // Fixed import path

const NotificationsModule = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState('instantly');
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const dropdownRef = useRef(null);

  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount 
  } = useNotifications(); // Using the hook

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(notification => !notification.read)
    : notifications;

  const unreadCount = getUnreadCount();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-105"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[420px] bg-white rounded-lg shadow-2xl border border-purple-200 z-50 animate-slide-down">
          {/* Header */}
          <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-purple-700 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <span className="text-sm text-purple-700">Only show unread</span>
            </div>
          </div>

          {/* Notifications List - Scrollbar hidden */}
          <div className="max-h-64 overflow-y-auto scrollbar-hide">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm">No unread notifications</p>
              </div>
            ) : (
              <div className="p-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 border ${
                      notification.read 
                        ? 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-200' 
                        : 'bg-purple-600 border-purple-600 hover:bg-purple-700 hover:border-purple-700'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            notification.read ? 'text-gray-800' : 'text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></span>
                          )}
                        </div>
                        <p className={`text-xs mb-1 ${
                          notification.read ? 'text-gray-600' : 'text-purple-100'
                        }`}>
                          {notification.message}
                        </p>
                        <span className={`text-xs ${
                          notification.read ? 'text-gray-500' : 'text-purple-200'
                        }`}>
                          {notification.timestamp}
                        </span>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors ml-2 flex-shrink-0"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-b-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Email frequency</span>
                <select
                  value={emailFrequency}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="text-sm border border-purple-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="periodically">Periodically</option>
                  <option value="instantly">Instantly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Desktop notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={desktopNotifications}
                    onChange={(e) => setDesktopNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsModule;