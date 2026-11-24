module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`⚡ Profile socket connected: ${socket.id}`);

        socket.on('profile:join', (data) => {
            const { userId } = data || {};
            if (userId) {
                socket.join(`profile:${userId}`);
                socket.join(`user:${userId}`);
            }
        });

        socket.on('profile:leave', (data) => {
            const { userId } = data || {};
            if (userId) {
                socket.leave(`profile:${userId}`);
                socket.leave(`user:${userId}`);
            }
        });

        socket.on('profile:update', (data) => {
            const { userId, profile, user, timestamp } = data || {};
            const payload = {
                userId,
                profile,
                user,
                timestamp: timestamp || Date.now()
            };
            io.emit('profile:updated', payload);
            if (userId) {
                io.to(`user:${userId}`).emit('profile:updated', payload);
            }
        });

        socket.on('profile:viewed', (data) => {
            const { profileId, viewerId } = data || {};
            const payload = {
                profileId,
                viewerId,
                timestamp: Date.now()
            };
            if (profileId) {
                io.to(`user:${profileId}`).emit('profile:viewed', payload);
            }
        });

        socket.on('activity:updated', (data) => {
            io.emit('activity:updated', data);
        });

        socket.on('collaboration:request', (data) => {
            const { recipientId } = data || {};
            if (recipientId) {
                io.to(`user:${recipientId}`).emit('collaboration:request', data);
            }
        });

        socket.on('disconnect', () => {
            console.log(`⚡ Profile socket disconnected: ${socket.id}`);
        });
    });
};
