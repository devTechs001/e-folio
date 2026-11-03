'use strict';
/**
 * Real-time visitor tracking over the existing Socket.IO server.
 *
 * The dashboard used to open a raw WebSocket to `/tracking`, but no raw WS
 * server was ever started (trackingSocket.js / aiSocket.js were never
 * instantiated and depend on an undeclared `ws` package). This namespace uses
 * the Socket.IO instance the server already owns, and authenticates with the
 * same JWT helper as the REST API.
 */

const security = require('../config/security');

function registerTrackingRealtime(io) {
    const namespace = io.of('/tracking');

    namespace.use((socket, next) => {
        const header = socket.handshake.headers?.authorization || '';
        const token = socket.handshake.auth?.token || header.replace(/^Bearer\s+/i, '');

        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = security.verifyToken(token);
            if (decoded.role !== 'owner') return next(new Error('Owner access required'));
            socket.data.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            return next();
        } catch (error) {
            return next(new Error('Invalid token'));
        }
    });

    namespace.on('connection', (socket) => {
        socket.join('owners');
        socket.emit('tracking:ready', { timestamp: Date.now() });

        socket.on('subscribe', () => socket.join('owners'));
        socket.on('ping', () => socket.emit('tracking:event', { type: 'pong', timestamp: Date.now() }));
    });

    /** Broadcast a tracking event to connected owner dashboards. */
    const publish = (type, payload = {}) => {
        namespace.to('owners').emit('tracking:event', {
            type,
            payload,
            timestamp: Date.now()
        });
    };

    const realtime = { namespace, publish };
    global.trackingRealtime = realtime;
    return realtime;
}

/** Safe to call from controllers even when the namespace is not registered. */
function publishTrackingEvent(type, payload) {
    try {
        global.trackingRealtime?.publish(type, payload);
    } catch (error) {
        // Real-time delivery must never break the underlying REST request.
        console.warn('[tracking] realtime publish skipped:', error.message);
    }
}

module.exports = { registerTrackingRealtime, publishTrackingEvent };
