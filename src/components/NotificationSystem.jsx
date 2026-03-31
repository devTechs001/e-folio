import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X, Volume2, VolumeX } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Sound effects for notifications
const playNotificationSound = (type) => {
  try {
    const audio = new Audio();
    switch (type) {
      case 'success':
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
        break;
      case 'error':
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
        break;
      case 'warning':
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
        break;
      default:
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
    }
    audio.volume = 0.3;
    
    // Try to play audio, respecting browser autoplay policies
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        // Only log the error if it's not the expected user interaction error
        if (e.name !== 'NotAllowedError') {
          console.log('Audio play failed:', e);
        }
      });
    }
  } catch (error) {
    console.log('Sound notification failed:', error);
  }
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxNotifications, setMaxNotifications] = useState(5);

  // Load settings from localStorage
  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem('notification-sound');
    const savedMaxNotifications = localStorage.getItem('notification-max');
    
    if (savedSoundEnabled !== null) {
      setSoundEnabled(JSON.parse(savedSoundEnabled));
    }
    if (savedMaxNotifications !== null) {
      setMaxNotifications(JSON.parse(savedMaxNotifications));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notification-sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('notification-max', JSON.stringify(maxNotifications));
  }, [maxNotifications]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      timestamp: new Date(),
      ...notification,
    };

    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound(newNotification.type);
    }

    setNotifications(prev => {
      const updated = [...prev, newNotification];
      // Limit number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(-maxNotifications);
      }
      return updated;
    });

    // Auto remove notification
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [soundEnabled, maxNotifications]);

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
    soundEnabled,
    setSoundEnabled,
    maxNotifications,
    setMaxNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification, clearAll, soundEnabled, setSoundEnabled } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {/* Notification Controls */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={soundEnabled ? 'Mute notifications' : 'Enable notification sounds'}
              >
                {soundEnabled ? (
                  <Volume2 size={14} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <VolumeX size={14} className="text-gray-400 dark:text-gray-500" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearAll}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium text-gray-600 dark:text-gray-400"
                title="Clear all notifications"
              >
                Clear All
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
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
  const { type, message, title, action, timestamp } = notification;

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-xl shadow-lg backdrop-blur-sm border-l-4";
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50/90 dark:bg-green-900/20 border-green-500 shadow-green-500/20`;
      case 'error':
        return `${baseStyles} bg-red-50/90 dark:bg-red-900/20 border-red-500 shadow-red-500/20`;
      case 'warning':
        return `${baseStyles} bg-yellow-50/90 dark:bg-yellow-900/20 border-yellow-500 shadow-yellow-500/20`;
      default:
        return `${baseStyles} bg-blue-50/90 dark:bg-blue-900/20 border-blue-500 shadow-blue-500/20`;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02, x: -5 }}
      className={`${getStyles()} p-4 cursor-pointer group`}
      onClick={action?.onClick}
    >
      {/* Progress Bar */}
      {notification.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: notification.duration / 1000, ease: "linear" }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex-shrink-0 mt-0.5"
        >
          {getIcon()}
        </motion.div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <motion.h4
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-semibold text-gray-900 dark:text-white mb-1"
            >
              {title}
            </motion.h4>
          )}
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            {message}
          </motion.p>
          
          {/* Action Button */}
          {action && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {action.label}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </div>
        
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Timestamp */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400"
      >
        {formatTime(timestamp)}
      </motion.div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 pointer-events-none"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
      />
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
