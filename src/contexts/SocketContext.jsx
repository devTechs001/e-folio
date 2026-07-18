import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket.service';
import { useNotifications } from '../components/NotificationSystem';

const SocketContext = createContext(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const { info, success, error, warning } = useNotifications();
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const userRef = useRef(user);
    userRef.current = user;

    useEffect(() => {
        if (user) {
            socketService.connect({
                userId: user.id,
                name: user.name,
                role: user.role
            });

            socketService.on('connect', () => {
                setConnected(true);
                console.log('🔌 Real-time connection established');
                success('🔌 Connected to real-time services');
            });

            socketService.on('disconnect', () => {
                setConnected(false);
                console.log('🔌 Real-time connection lost');
                warning('🔌 Real-time connection lost');
            });

            socketService.on('online_users', (users) => {
                setOnlineUsers(users);
                console.log(`👥 Online users updated: ${users.length} users`);
            });

            socketService.on('notification', (data) => {
                console.log('🔔 Received notification:', data);
                handleRealTimeNotification(data);
            });

            socketService.on('new_collaboration_request', (request) => {
                if (user.role === 'owner') {
                    info(`📩 New collaboration request from ${request.name}`, {
                        title: 'Collaboration Request',
                        action: {
                            label: 'View Request',
                            onClick: () => window.location.href = '/dashboard/collaborators'
                        }
                    });
                }
            });

            socketService.on('request_approved', (data) => {
                success(`✅ Your collaboration request has been approved!`, {
                    title: 'Request Approved',
                    action: {
                        label: 'View Workspace',
                        onClick: () => window.location.href = '/dashboard/workspace'
                    }
                });
            });

            socketService.on('request_rejected', (data) => {
                warning(`❌ Your collaboration request was not accepted at this time.`, {
                    title: 'Request Not Accepted',
                    duration: 8000
                });
            });

            socketService.on('project_updated', (projectData) => {
                success(`🔄 Project "${projectData.name}" has been updated`, {
                    title: 'Project Updated',
                    action: {
                        label: 'View Project',
                        onClick: () => window.location.href = `/dashboard/projects/${projectData.id}`
                    }
                });
            });

            socketService.on('system_alert', (alertData) => {
                const severity = alertData.severity || 'info';
                const notificationFn = severity === 'error' ? error : 
                                       severity === 'warning' ? warning : 
                                       severity === 'success' ? success : info;
                
                notificationFn(alertData.message, {
                    title: alertData.title || 'System Alert',
                    duration: severity === 'error' ? 10000 : 6000
                });
            });

            socketService.on('new_message', (messageData) => {
                info(`💬 New message from ${messageData.sender}`, {
                    title: 'New Message',
                    action: {
                        label: 'Open Chat',
                        onClick: () => window.location.href = '/dashboard/chat'
                    },
                    duration: 5000
                });
            });

            socketService.on('user_typing', (data) => {
                console.log(`⌨️ ${data.userName} is typing in room ${data.roomId}`);
            });

            socketService.on('user_status_update', (data) => {
                console.log(`🔄 User status updated: ${data.userName} is now ${data.status}`);
            });

            return () => {
                if (!userRef.current) {
                    socketService.disconnect();
                    setConnected(false);
                }
            };
        } else {
            socketService.disconnect();
            setConnected(false);
        }
    }, [user]);

    useEffect(() => {
        return () => {
            socketService.disconnect();
        };
    }, []);

    // Handle real-time notifications
    const handleRealTimeNotification = (data) => {
        const { type, message, title, action, severity } = data;
        
        switch (type) {
            case 'collaboration_request':
                info(message, {
                    title: title || 'Collaboration Request',
                    action: action || {
                        label: 'View Request',
                        onClick: () => window.location.href = '/dashboard/collaborators'
                    }
                });
                break;
            case 'project_update':
                success(message, {
                    title: title || 'Project Updated',
                    action: action
                });
                break;
            case 'new_message':
                info(message, {
                    title: title || 'New Message',
                    action: action || {
                        label: 'Open Chat',
                        onClick: () => window.location.href = '/dashboard/chat'
                    }
                });
                break;
            case 'system_alert':
                const severityFn = severity === 'error' ? error : 
                                  severity === 'warning' ? warning : 
                                  severity === 'success' ? success : info;
                severityFn(message, {
                    title: title || 'System Alert',
                    duration: severity === 'error' ? 10000 : 6000
                });
                break;
            default:
                info(message, { title: title || 'Notification' });
        }
    };

    const value = {
        socket: socketService.socket,
        connected,
        onlineUsers,
        joinRoom: socketService.joinRoom.bind(socketService),
        leaveRoom: socketService.leaveRoom.bind(socketService),
        sendMessage: socketService.sendMessage.bind(socketService),
        setTyping: socketService.setTyping.bind(socketService),
        updateStatus: socketService.updateStatus.bind(socketService),
        on: socketService.on.bind(socketService),
        off: socketService.off.bind(socketService),
        sendNotification: (targetUserId, type, message, title, action) => {
            if (socketService.socket) {
                socketService.socket.emit('send_notification', {
                    targetUserId,
                    type,
                    message,
                    title,
                    action
                });
            }
        },
        broadcastSystemAlert: (message, title, severity, targetRole) => {
            if (socketService.socket) {
                socketService.socket.emit('system_alert', {
                    message,
                    title,
                    severity,
                    targetRole
                });
            }
        }
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
