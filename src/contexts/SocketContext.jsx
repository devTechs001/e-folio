import { createContext, useContext, useEffect, useState } from 'react';
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
    const { user, isAuthenticated } = useAuth();
    const { info, success } = useNotifications();
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        // Connect to socket when user is authenticated
        if (isAuthenticated && user) {
            const socket = socketService.connect({
                userId: user.id,
                name: user.name,
                role: user.role
            });

            // Listen for connection status
            socketService.on('connect', () => {
                setConnected(true);
                console.log('🔌 Real-time connection established');
            });

            socketService.on('disconnect', () => {
                setConnected(false);
                console.log('🔌 Real-time connection lost');
            });

            // Listen for online users updates
            socketService.on('online_users', (users) => {
                setOnlineUsers(users);
            });

            // Listen for new collaboration requests (owner only)
            socketService.on('new_collaboration_request', (request) => {
                if (user.role === 'owner') {
                    info(`📩 New collaboration request from ${request.name}`);
                }
            });

            // Listen for request approval/rejection
            socketService.on('request_approved', (data) => {
                success(`✅ Your collaboration request has been approved!`);
            });

            socketService.on('request_rejected', (data) => {
                info(`❌ Your collaboration request was not accepted at this time.`);
            });

            return () => {
                socketService.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    const value = {
        socket: socketService.socket,
        connected,
        onlineUsers,
        joinRoom: socketService.joinRoom.bind(socketService),
        leaveRoom: socketService.leaveRoom.bind(socketService),
        sendMessage: socketService.sendMessage.bind(socketService),
        on: socketService.on.bind(socketService),
        off: socketService.off.bind(socketService)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
