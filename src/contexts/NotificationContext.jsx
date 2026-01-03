import { createContext, useContext, useState, useCallback } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

// Create the context
const NotificationContext = createContext(null);

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Default auto-hide durations in milliseconds
const AUTO_HIDE_DURATION = {
  [NOTIFICATION_TYPES.SUCCESS]: 3000,
  [NOTIFICATION_TYPES.ERROR]: 5000,
  [NOTIFICATION_TYPES.WARNING]: 4000,
  [NOTIFICATION_TYPES.INFO]: 3000,
};

// Create the notification provider component
export const NotificationProvider = ({ children }) => {
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  
  // Add a notification
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const id = options.id || uuidv4();
    const autoHideDuration = options.autoHideDuration || AUTO_HIDE_DURATION[type];
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type,
        autoHideDuration,
        ...options,
      },
    ]);
    
    return id;
  }, []);
  
  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
  }, [showNotification]);
  
  const showError = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.ERROR, options);
  }, [showNotification]);
  
  const showWarning = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.WARNING, options);
  }, [showNotification]);
  
  const showInfo = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.INFO, options);
  }, [showNotification]);
  
  // Close a notification
  const closeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Close all notifications
  const closeAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Create the context value
  const contextValue = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
    closeAllNotifications,
  };
  
  // Provide the context to the children
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => closeNotification(notification.id)}
          anchorOrigin={{ 
            vertical: notification.vertical || 'bottom', 
            horizontal: notification.horizontal || 'center' 
          }}
          sx={{ 
            '& .MuiSnackbarContent-root': { 
              minWidth: notification.width || 'auto',
              maxWidth: notification.maxWidth || 'calc(100vw - 32px)',
            } 
          }}
        >
          <Alert
            onClose={() => closeNotification(notification.id)}
            severity={notification.type}
            variant={notification.variant || 'filled'}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

// Create a custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext; 