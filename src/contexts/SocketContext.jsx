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
    const notifyRef = useRef({ info, success, error, warning });
    notifyRef.current = { info, success, error, warning };
    const roleRef = useRef(user?.role);
    roleRef.current = user?.role;

    useEffect(() => {
        if (!user?.id) {
            socketService.disconnect();
            // Logout must also close the private notification namespace.
            socketService.disconnectNotifications(true);
            setConnected(false);
            return undefined;
        }

        // Switching accounts must not reuse the previous user's socket.
        socketService.disconnect();
        socketService.connect({
            userId: user.id,
            name: user.name,
            role: user.role
        });

        const handlers = {
            connect: () => {
                setConnected(true);
                notifyRef.current.success('Connected to real-time services');
            },
            disconnect: () => {
                setConnected(false);
                notifyRef.current.warning('Real-time connection lost');
            },
            online_users: (users) => setOnlineUsers(Array.isArray(users) ? users : []),
            notification: (data) => handleRealTimeNotification(data),
            new_collaboration_request: (request) => {
                if (roleRef.current !== 'owner') return;
                notifyRef.current.info(`New collaboration request from ${request.name}`, {
                    title: 'Collaboration Request',
                    action: { label: 'View Request', onClick: () => { window.location.href = '/dashboard/collaborators'; } }
                });
            },
            request_approved: () => {
                notifyRef.current.success('Your collaboration request has been approved!', {
                    title: 'Request Approved',
                    action: { label: 'View Workspace', onClick: () => { window.location.href = '/dashboard/workspace'; } }
                });
            },
            request_rejected: () => {
                notifyRef.current.warning('Your collaboration request was not accepted at this time.', {
                    title: 'Request Not Accepted', duration: 8000
                });
            },
            project_updated: (projectData) => {
                notifyRef.current.success(`Project "${projectData.name}" has been updated`, {
                    title: 'Project Updated',
                    action: { label: 'View Project', onClick: () => { window.location.href = `/dashboard/projects/${projectData.id}`; } }
                });
            },
            system_alert: (alertData) => {
                const severity = alertData.severity || 'info';
                const notify = severity === 'error' ? notifyRef.current.error
                    : severity === 'warning' ? notifyRef.current.warning
                        : severity === 'success' ? notifyRef.current.success : notifyRef.current.info;
                notify(alertData.message, {
                    title: alertData.title || 'System Alert',
                    duration: severity === 'error' ? 10000 : 6000
                });
            },
            user_typing: () => {},
            user_status_update: () => {}
        };

        for (const [event, callback] of Object.entries(handlers)) {
            socketService.on(event, callback);
        }

        // Cleanup is unconditional: no listener leaks and no socket left open
        // after logout/unmount.
        return () => {
            for (const [event, callback] of Object.entries(handlers)) {
                socketService.off(event, callback);
            }
            socketService.disconnect();
            socketService.disconnectNotifications(true);
            setConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Socket payloads are JSON: an `url` must be turned into a click handler
    // on the client instead of sending a function from the server.
    const withUrlAction = (action) => {
        if (!action) return undefined;
        if (action.onClick) return action;
        if (action.url) return { ...action, onClick: () => { window.location.href = action.url; } };
        return undefined;
    };

    // Handle real-time notifications
    const handleRealTimeNotification = (data) => {
        const { type, message, title, action, severity } = data || {};
        switch (type) {
            case 'collaboration_request':
                notifyRef.current.info(message, {
                    title: title || 'Collaboration Request',
                    action: withUrlAction(action) || { label: 'View Request', onClick: () => { window.location.href = '/dashboard/collaborators'; } }
                });
                break;
            case 'project_update':
                notifyRef.current.success(message, { title: title || 'Project Updated', action: withUrlAction(action) });
                break;
            case 'new_message':
                notifyRef.current.info(message, {
                    title: title || 'New Message',
                    action: withUrlAction(action) || { label: 'Open Chat', onClick: () => { window.location.href = '/dashboard/chat'; } }
                });
                break;
            case 'system_alert': {
                const notify = severity === 'error' ? notifyRef.current.error
                    : severity === 'warning' ? notifyRef.current.warning
                        : severity === 'success' ? notifyRef.current.success : notifyRef.current.info;
                notify(message, { title: title || 'System Alert', duration: severity === 'error' ? 10000 : 6000 });
                break;
            }
            default:
                notifyRef.current.info(message, { title: title || 'Notification' });
        }
    };

    const value = {
        socket: socketService.socket,
        getSocket: () => socketService.socket,
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
                socketService.socket.emit('send_notification', { targetUserId, type, message, title, action });
            }
        },
        broadcastSystemAlert: (message, title, severity, targetRole) => {
            if (socketService.socket) {
                socketService.socket.emit('system_alert', { message, title, severity, targetRole });
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
