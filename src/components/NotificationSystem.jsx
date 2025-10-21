import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Notification shortcuts
  const success = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({ type: 'error', message, duration: 7000, ...options });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const { type, message, title, action } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-primary-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-dark-500/90 backdrop-blur-sm";
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-400 shadow-lg shadow-green-400/20`;
      case 'error':
        return `${baseStyles} border-red-400 shadow-lg shadow-red-400/20`;
      case 'warning':
        return `${baseStyles} border-yellow-400 shadow-lg shadow-yellow-400/20`;
      default:
        return `${baseStyles} border-primary-500 shadow-lg shadow-primary-500/20`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${getStyles()} rounded-lg p-4 shadow-xl`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-gray-100 mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-gray-300">
            {message}
          </p>
          
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Real-time notification hook for socket events
export const useRealTimeNotifications = () => {
  const { success, error, info, warning } = useNotifications();

  const handleSocketNotification = useCallback((data) => {
    const { type, message, title, ...options } = data;
    
    switch (type) {
      case 'collaboration_request':
        info(`New collaboration request from ${data.sender}`, {
          title: 'Collaboration Request',
          action: {
            label: 'View Request',
            onClick: () => window.location.href = '/dashboard/collaborators'
          }
        });
        break;
      case 'project_update':
        success(`Project "${data.projectName}" has been updated`, {
          title: 'Project Updated'
        });
        break;
      case 'new_message':
        info(`New message from ${data.sender}`, {
          title: 'New Message',
          action: {
            label: 'Open Chat',
            onClick: () => window.location.href = '/dashboard/chat'
          }
        });
        break;
      case 'system_alert':
        warning(message, { title: title || 'System Alert' });
        break;
      default:
        info(message, { title });
    }
  }, [success, error, info, warning]);

  return { handleSocketNotification };
};

export default NotificationProvider;
