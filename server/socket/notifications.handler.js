'use strict';
/**
 * Authenticated, per-user real-time notifications.
 *
 * The legacy root namespace broadcast every `notification` event to every
 * connected client. This namespace verifies the same JWT as the REST API and
 * delivers each event only to the recipient's own room, so CV/portfolio/account
 * notifications are private. REST notifications remain the source of truth:
 * the client also polls `/api/notifications` when the socket is unavailable.
 */

const security = require('../config/security');
const Notification = require('../models/Notifications');

const validTypes = [
    'message', 'review', 'project', 'collaboration', 'system', 'update',
    'success', 'warning', 'error', 'info', 'workspace', 'account', 'cv', 'portfolio'
];

function registerNotificationsRealtime(io) {
    const namespace = io.of('/notifications');

    namespace.use((socket, next) => {
        const header = socket.handshake.headers?.authorization || '';
        const token = socket.handshake.auth?.token || header.replace(/^Bearer\s+/i, '');
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = security.verifyToken(token);
            if (!decoded?.id) return next(new Error('Invalid token'));
            socket.data.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            return next();
        } catch {
            return next(new Error('Invalid token'));
        }
    });

    namespace.on('connection', socket => {
        const room = `user:${socket.data.user.id}`;
        socket.join(room);
        socket.emit('notifications:ready', { timestamp: Date.now(), room });
        socket.on('notifications:subscribe', () => socket.join(room));
    });

    const emitToUser = (userId, event, payload) => {
        if (!userId) return;
        namespace.to(`user:${String(userId)}`).emit(event, payload);
    };

    const realtime = { namespace, emitToUser };
    global.notificationsRealtime = realtime;
    return realtime;
}

/** Emit without writing to the DB (read/delete state changes in other tabs). */
function publishNotificationUpdate(userId, payload = {}) {
    try {
        global.notificationsRealtime?.emitToUser(userId, 'notification:updated', {
            ...payload,
            timestamp: Date.now()
        });
    } catch (error) {
        console.warn('[notifications] realtime update skipped:', error.message);
    }
}

/**
 * Persist a notification and deliver it in real time to one user only.
 * Best effort: a notification failure must never break the REST request that
 * triggered it (registration, CV save, portfolio publish, ...).
 */
async function publishUserNotification(userId, payload = {}) {
    if (!userId) return null;
    const type = validTypes.includes(payload.type) ? payload.type : 'info';
    const title = String(payload.title || 'Notification').slice(0, 160);
    const message = String(payload.message || '').slice(0, 1000);
    if (!title || !message) return null;

    try {
        const doc = await Notification.create({
            userId,
            type,
            title,
            message,
            link: payload.link ? String(payload.link).slice(0, 500) : undefined,
            metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
            read: false
        });
        const serialized = {
            ...doc.toObject(),
            id: String(doc._id),
            userId: String(doc.userId)
        };
        try {
            global.notificationsRealtime?.emitToUser(userId, 'notification:new', serialized);
        } catch (error) {
            console.warn('[notifications] realtime delivery skipped:', error.message);
        }
        return serialized;
    } catch (error) {
        console.warn('[notifications] could not record notification:', error.message);
        return null;
    }
}

module.exports = {
    registerNotificationsRealtime,
    publishUserNotification,
    publishNotificationUpdate,
    validTypes
};
