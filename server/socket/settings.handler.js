module.exports = (io) => {
    const settingsNamespace = io.of('/settings');
    
    settingsNamespace.on('connection', (socket) => {
        console.log(`⚡ Settings socket connected: ${socket.id}`);
        
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
            }
        });
        
        socket.on('settings:update', (data) => {
            socket.broadcast.emit('settings:updated', data);
            if (data.userId) {
                io.to(`user:${data.userId}`).emit('settings:updated', data);
            }
        });
        
        socket.on('disconnect', () => {
            console.log(`⚡ Settings socket disconnected: ${socket.id}`);
        });
    });
};
