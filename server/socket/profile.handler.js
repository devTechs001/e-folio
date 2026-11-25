/**
 * Phase 41 — profile realtime events.
 *
 * The phase-40-era version of this file (added in 49f6ae5) had three problems:
 *
 *  1. **No authentication.** Unlike `notifications.handler.js` and
 *     `tracking.handler.js`, it never verified a token, so any anonymous socket
 *     could emit `profile:update` (or `activity:updated`) and every connected
 *     client would apply it.
 *  2. **`io.emit` broadcast.** `profile:update` went to *everyone*, leaking one
 *     user's profile to all visitors, and `activity:updated` did the same.
 *  3. **Caller-chosen rooms.** `profile:join` trusted a `userId` supplied by the
 *     client, so a socket could subscribe to someone else's profile room.
 *
 * Now: the token decides the identity, and a socket may only join and publish to
 * its own room. Events are scoped to that room instead of broadcast.
 *
 * Confidential: local checkout only.
 */
const security = require('../config/security');

const SCOPED_EVENTS = new Set(['profile:update', 'profile:viewed', 'activity:updated', 'collaboration:request']);

function registerProfileRealtime(io) {
    io.use((socket, next) => {
        const header = socket.handshake.headers?.authorization || '';
        const token = socket.handshake.auth?.token || header.replace(/^Bearer\s+/i, '');

        // Profile events are optional for anonymous visitors: a missing token
        // simply means the socket is not identified and cannot join a room.
        if (!token) {
            socket.data.user = null;
            return next();
        }
        try {
            const decoded = security.verifyToken(token);
            socket.data.user =
                decoded?.id && decoded.id !== '000000000000000000000000'
                    ? { id: String(decoded.id), email: decoded.email, role: decoded.role }
                    : null;
        } catch {
            // An invalid token is treated as anonymous rather than fatal, so
            // public pages keep working.
            socket.data.user = null;
        }
        return next();
    });

    io.on('connection', socket => {
        const ownerId = socket.data.user?.id;

        socket.on('profile:join', data => {
            // Ignore any client-supplied userId: only the authenticated identity
            // may subscribe to a profile room.
            if (!ownerId) return;
            socket.join(`user:${ownerId}`);
            if (data?.userId && String(data.userId) !== ownerId) {
                // Explicitly refuse a mismatched room instead of silently joining.
                socket.emit('profile:error', {
                    event: 'profile:join',
                    message: 'You can only subscribe to your own profile.'
                });
            }
        });

        socket.on('profile:leave', () => {
            if (!ownerId) return;
            socket.leave(`user:${ownerId}`);
        });

        socket.on('profile:update', data => {
            if (!ownerId) {
                socket.emit('profile:error', {
                    event: 'profile:update',
                    message: 'Sign in to publish profile updates.'
                });
                return;
            }
            // The payload's identity is forced to the verified one.
            const payload = {
                userId: ownerId,
                profile: data?.profile ?? null,
                user: data?.user ?? null,
                timestamp: Number(data?.timestamp) || Date.now()
            };
            io.to(`user:${ownerId}`).emit('profile:updated', payload);
        });

        socket.on('profile:viewed', data => {
            const profileId = data?.profileId;
            if (!profileId) return;
            // Only notify the owner of the profile that was viewed; a visitor
            // learns nothing about who else is connected.
            io.to(`user:${profileId}`).emit('profile:viewed', {
                profileId,
                timestamp: Date.now()
            });
        });

        socket.on('activity:updated', data => {
            if (!ownerId) return;
            // Scoped, not broadcast: the previous io.emit leaked every user's
            // activity to every connected client.
            io.to(`user:${ownerId}`).emit('activity:updated', data);
        });

        socket.on('collaboration:request', data => {
            const recipientId = data?.recipientId;
            if (!recipientId) return;
            io.to(`user:${recipientId}`).emit('collaboration:request', data);
        });

        socket.on('disconnect', () => {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`⚡ Profile socket disconnected: ${socket.id}`);
            }
        });
    });
}

module.exports = registerProfileRealtime;
module.exports.SCOPED_EVENTS = SCOPED_EVENTS;
