// NotificationContext.jsx - Fixed version
import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Use refs to track notification cooldowns
  const notificationTimers = useRef(new Map());
  const lastNotificationTime = useRef(0);

  const addNotification = useCallback((notification) => {
    const now = Date.now();
    
    // Prevent spam: Don't show notifications more than once per second
    if (now - lastNotificationTime.current < 1000) {
      console.log('⏱️ Skipping notification (too soon)');
      return;
    }
    
    // Create unique key for this notification
    const notificationKey = `${notification.type || 'info'}-${notification.message?.substring(0, 50)}`;
    
    // Check if similar notification was shown recently (within 3 seconds)
    const lastShown = notificationTimers.current.get(notificationKey);
    if (lastShown && now - lastShown < 3000) {
      console.log('⏱️ Skipping duplicate notification:', notification.message);
      return;
    }
    
    // Update timer
    notificationTimers.current.set(notificationKey, now);
    lastNotificationTime.current = now;
    
    // Clear old timers periodically
    setTimeout(() => {
      const currentTime = Date.now();
      for (const [key, timestamp] of notificationTimers.current.entries()) {
        if (currentTime - timestamp > 3000) {
          notificationTimers.current.delete(key);
        }
      }
    }, 3000);

    const newNotification = {
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };

    setNotifications(prev => {
      // Keep only last 20 notifications
      const newList = [newNotification, ...prev.slice(0, 19)];
      return newList;
    });
    
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if enabled
    if (Notification.permission === 'granted' && notification.showBrowser !== false) {
      try {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: notificationKey, // Use tag to replace similar notifications
          requireInteraction: false,
          silent: true
        });
      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
    
    console.log('📢 Notification added:', newNotification.message);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const getUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        getUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};