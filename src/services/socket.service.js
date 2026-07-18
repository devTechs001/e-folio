// Socket.io Service for Real-time Communication
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    // Connect to Socket.io server
    connect(userData) {
        if (this.socket?.connected) {
            return this.socket;
        }
        if (this.socket) {
            this.disconnect();
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000, // 20 seconds
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            this.connected = true;
            
            // Authenticate user
            if (userData) {
                this.authenticate(userData);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.connected = false;
            
            // Try to reconnect on server disconnect
            if (reason === 'io server disconnect') {
                setTimeout(() => {
                    this.connect(userData);
                }, 1000);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                description: error.description
            });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnection attempt #${attemptNumber}`);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Successful reconnection after ${attemptNumber} attempts`);
            this.connected = true;
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed after max attempts');
        });

        return this.socket;
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Authenticate user
    authenticate(userData) {
        if (this.socket) {
            this.socket.emit('authenticate', userData);
        }
    }

    // Join chat room
    joinRoom(roomId) {
        if (this.socket) {
            this.socket.emit('join_room', roomId);
        }
    }

    // Leave chat room
    leaveRoom(roomId) {
        if (this.socket) {
            this.socket.emit('leave_room', roomId);
        }
    }

    // Send message
    sendMessage(roomId, message) {
        if (this.socket) {
            this.socket.emit('send_message', { roomId, message });
        }
    }

    // Typing indicator
    setTyping(roomId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { roomId, isTyping });
        }
    }

    // Update user status
    updateStatus(status) {
        if (this.socket) {
            this.socket.emit('update_status', status);
        }
    }

    // Listen for events
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Join settings room
    joinSettings(userId) {
        if (this.socket) {
            this.socket.emit('join', userId);
        }
    }

    // Emit settings update
    emitSettingsUpdate(data) {
        if (this.socket) {
            this.socket.emit('settings:update', data);
        }
    }

    // Listen for settings updates
    onSettingsUpdated(callback) {
        if (this.socket) {
            this.socket.on('settings:updated', callback);
        }
    }

    // Get connection status
    isConnected() {
        return this.connected && this.socket?.connected;
    }
}

export default new SocketService();
