import React, { createContext, useContext, useReducer, useEffect } from 'react';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50), // Keep only last 50
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Generate unique ID for notifications
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Add a new notification
  const addNotification = (notification) => {
    const id = generateId();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    
    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
    
    return id;
  };

  // Remove a notification
  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  // Clear all notifications
  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  // Mark notification as read
  const markAsRead = (id) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  // Convenience methods for different notification types
  const showSuccess = (message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  };

  const showError = (message, options = {}) => {
    return addNotification({ type: 'error', message, ...options });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  };

  // Update unread count
  useEffect(() => {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadCount });
  }, [state.notifications]);

  const value = {
    ...state,
    // Actions
    addNotification,
    removeNotification,
    clearNotifications,
    markAsRead,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
