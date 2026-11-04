// Socket.io Service for Real-time Communication
import { io } from 'socket.io-client';

// Prefer an explicit socket URL, then the configured absolute backend origin,
// then the page's own origin. Never call localhost from browser-facing code:
// the live-preview browser is not the sandbox running the dev server.
const configuredSocketOrigin =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
const SOCKET_URL = /^(https?|wss?):\/\//.test(configuredSocketOrigin)
    ? configuredSocketOrigin
    : (typeof window !== 'undefined' ? window.location.origin : '');

// Shared connection state for the notification namespace. Components can
// subscribe without owning the socket, so live/polling status stays in sync.
const socketEventStatus = { connected: false, error: '', listeners: new Set() };

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.trackingSocket = null;
        // Several dashboards share the same owner namespace. Ref-count the
        // consumers so one component unmounting does not disconnect the rest.
        this.trackingRefs = 0;
        // Buffered listeners so components can subscribe before the socket is
        // created, and keep their subscriptions across reconnects.
        this.listeners = new Map();
        this.trackingListeners = new Map();
        // Authenticated /notifications namespace: private, per-user rooms.
        this.notificationSocket = null;
        this.notificationRefs = 0;
        this.notificationListeners = new Map();
        this.notificationsConnected = false;
        // Public, unauthenticated namespace for portfolio project counts.
        // Anonymous visitors use this instead of the authenticated root socket.
        this.publicProjectsSocket = null;
        this.publicProjectsRefs = 0;
    }

    #addListener(map, event, callback) {
        if (!map.has(event)) map.set(event, new Set());
        map.get(event).add(callback);
    }

    #removeListener(map, event, callback) {
        const set = map.get(event);
        if (!set) return;
        if (callback) set.delete(callback);
        else set.clear();
        if (set.size === 0) map.delete(event);
    }

    #attach(map, socket) {
        for (const [event, callbacks] of map.entries()) {
            for (const callback of callbacks) socket.on(event, callback);
        }
    }

    // Connect to Socket.io server
    connect(userData) {
        if (this.socket?.connected) return this.socket;
        if (this.socket) this.disconnect();

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 20,
            timeout: 20000,
            autoConnect: true
        });

        const socket = this.socket;

        socket.on('connect', () => {
            this.connected = true;
            if (userData) this.authenticate(userData);
        });

        socket.on('disconnect', (reason) => {
            this.connected = false;
            // A server-side disconnect disables auto-reconnect; reconnect
            // explicitly but keep the buffered application listeners intact.
            if (reason === 'io server disconnect') {
                setTimeout(() => {
                    if (!this.socket?.connected) this.connect(userData);
                }, 1000);
            }
        });

        socket.on('connect_error', (error) => {
            console.warn('Socket connection error:', error?.message || error);
        });

        socket.on('reconnect_failed', () => {
            this.connected = false;
            console.warn('Real-time connection could not be restored');
        });

        this.#attach(this.listeners, socket);
        return socket;
    }

    // Disconnect from server
    disconnect() {
        // The root socket and the notification namespace have independent
        // lifecycles: reconnecting chat must not drop private notifications.
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
    }

    /** Owner-only tracking namespace (replaces the dead raw /tracking WS). */
    connectTracking() {
        this.trackingRefs += 1;
        if (this.trackingSocket?.connected) return this.trackingSocket;
        if (this.trackingSocket) {
            const refs = this.trackingRefs;
            this.disconnectTracking(true);
            this.trackingRefs = refs;
        }

        const token = localStorage.getItem('token');
        this.trackingSocket = io(`${SOCKET_URL}/tracking`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 20
        });
        this.#attach(this.trackingListeners, this.trackingSocket);
        return this.trackingSocket;
    }

    disconnectTracking(force = false) {
        if (!force && this.trackingRefs > 0) this.trackingRefs -= 1;
        if (!force && this.trackingRefs > 0) return;
        if (this.trackingSocket) {
            this.trackingSocket.removeAllListeners();
            this.trackingSocket.disconnect();
            this.trackingSocket = null;
        }
        if (force) this.trackingRefs = 0;
    }

    onTrackingEvent(callback) {
        this.#addListener(this.trackingListeners, 'tracking:event', callback);
        this.trackingSocket?.on('tracking:event', callback);
    }

    offTrackingEvent(callback) {
        this.#removeListener(this.trackingListeners, 'tracking:event', callback);
        this.trackingSocket?.off('tracking:event', callback);
    }

    // Authenticate user
    authenticate(userData) {
        if (this.socket) this.socket.emit('authenticate', userData);
    }

    // Join chat room
    joinRoom(roomId) {
        if (this.socket) this.socket.emit('join_room', roomId);
    }

    // Leave chat room
    leaveRoom(roomId) {
        if (this.socket) this.socket.emit('leave_room', roomId);
    }

    // Send message
    sendMessage(roomId, message) {
        if (this.socket) this.socket.emit('send_message', { roomId, message });
    }

    // Typing indicator
    setTyping(roomId, isTyping) {
        if (this.socket) this.socket.emit('typing', { roomId, isTyping });
    }

    // Update user status
    updateStatus(status) {
        if (this.socket) this.socket.emit('update_status', status);
    }

    // Listen for events (works before connect() and survives reconnects)
    on(event, callback) {
        this.#addListener(this.listeners, event, callback);
        this.socket?.on(event, callback);
    }

    // Remove event listener
    off(event, callback) {
        this.#removeListener(this.listeners, event, callback);
        this.socket?.off(event, callback);
    }

    // Join settings room
    joinSettings(userId) {
        if (this.socket) this.socket.emit('join', userId);
    }

    // Emit settings update
    emitSettingsUpdate(data) {
        if (this.socket) this.socket.emit('settings:update', data);
    }

    // Listen for settings updates
    onSettingsUpdated(callback) {
        this.on('settings:updated', callback);
    }


    /**
     * Owner/user notification namespace. Unlike the legacy root `notification`
     * broadcast, this namespace verifies the JWT and delivers only to the
     * recipient's `user:<id>` room.
     */
    connectNotifications() {
        this.notificationRefs += 1;
        if (this.notificationSocket?.connected) return this.notificationSocket;
        if (this.notificationSocket) {
            const refs = this.notificationRefs;
            this.disconnectNotifications(true);
            this.notificationRefs = refs;
        }

        const token = localStorage.getItem('token');
        if (!token) return null;

        socketEventStatus.connected = false;
        this.notificationSocket = io(`${SOCKET_URL}/notifications`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 20
        });
        this.#attach(this.notificationListeners, this.notificationSocket);
        this.notificationSocket.on('connect', () => {
            this.notificationsConnected = true;
            socketEventStatus.connected = true;
            socketEventStatus.error = '';
            this.#emitStatus();
        });
        this.notificationSocket.on('disconnect', () => {
            this.notificationsConnected = false;
            socketEventStatus.connected = false;
            this.#emitStatus();
        });
        this.notificationSocket.on('connect_error', error => {
            this.notificationsConnected = false;
            socketEventStatus.connected = false;
            socketEventStatus.error = error?.message || 'Connection failed';
            this.#emitStatus();
        });
        return this.notificationSocket;
    }

    disconnectNotifications(force = false) {
        if (!force && this.notificationRefs > 0) this.notificationRefs -= 1;
        if (!force && this.notificationRefs > 0) return;
        if (this.notificationSocket) {
            this.notificationSocket.removeAllListeners();
            this.notificationSocket.disconnect();
            this.notificationSocket = null;
        }
        this.notificationsConnected = false;
        socketEventStatus.connected = false;
        if (force) this.notificationRefs = 0;
        this.#emitStatus();
    }

    onNotificationEvent(event, callback) {
        this.#addListener(this.notificationListeners, event, callback);
        this.notificationSocket?.on(event, callback);
    }

    offNotificationEvent(event, callback) {
        this.#removeListener(this.notificationListeners, event, callback);
        this.notificationSocket?.off(event, callback);
    }

    subscribeNotificationStatus(callback) {
        socketEventStatus.listeners.add(callback);
        callback({ ...socketEventStatus, listeners: undefined });
        return () => socketEventStatus.listeners.delete(callback);
    }

    #emitStatus() {
        for (const callback of socketEventStatus.listeners) {
            try { callback({ connected: socketEventStatus.connected, error: socketEventStatus.error }); } catch { /* ignore */ }
        }
    }

    isNotificationsConnected() {
        return this.notificationsConnected && Boolean(this.notificationSocket?.connected);
    }

    /**
     * Subscribe to public project-count broadcasts. No authentication and no
     * user data are sent; the namespace is read-only. Works for anonymous
     * visitors, unlike the root socket owned by SocketContext.
     */
    subscribePublicProjects(callback) {
        if (typeof callback !== 'function') return () => {};
        this.publicProjectsRefs += 1;
        if (!this.publicProjectsSocket) {
            this.publicProjectsSocket = io(`${SOCKET_URL}/public-projects`, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: 10
            });
            this.publicProjectsSocket.on('connect_error', err => {
                // A missing backend must never break the public page; the
                // polling fallback in Projects.jsx still refreshes counts.
                if (import.meta.env.DEV) console.warn('[public projects] socket unavailable:', err?.message);
            });
        }
        const socket = this.publicProjectsSocket;
        socket.on('project:stats', callback);
        return () => {
            socket.off('project:stats', callback);
            this.publicProjectsRefs -= 1;
            if (this.publicProjectsRefs <= 0) {
                socket.removeAllListeners();
                socket.disconnect();
                if (this.publicProjectsSocket === socket) this.publicProjectsSocket = null;
                this.publicProjectsRefs = 0;
            }
        };
    }

    // Get connection status
    isConnected() {
        return this.connected && this.socket?.connected;
    }
}

export default new SocketService();
