// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to Notifications',
      message: 'You\'ll receive notifications for important events here',
      timestamp: 'Just now',
      read: false,
      type: 'info'
    },
    {
      id: 2,
      title: 'Task Completed',
      message: 'Your task "Design Review" has been completed',
      timestamp: '5 min ago',
      read: true,
      type: 'task'
    },
    {
      id: 3,
      title: 'New Message',
      message: 'You have a new message from John Doe',
      timestamp: '1 hour ago',
      read: true,
      type: 'message'
    },
    {
      id: 4,
      title: 'Meeting Reminder',
      message: 'Team meeting starts in 30 minutes',
      timestamp: '2 hours ago',
      read: false,
      type: 'meeting'
    }
  ]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      read: false,
      timestamp: 'Just now'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-mark as read after 5 seconds if still unread
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }, 5000);

    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      getUnreadCount,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Export the context itself if needed
export { NotificationContext };