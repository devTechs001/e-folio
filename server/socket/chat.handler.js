// Chat Socket Handler
const chatRooms = new Map();
const activeUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // User authentication
        socket.on('authenticate', (userData) => {
            activeUsers.set(socket.id, {
                id: socket.id,
                name: userData.name || 'Anonymous',
                email: userData.email,
                role: userData.role || 'visitor',
                status: 'online',
                avatar: userData.avatar || userData.name?.charAt(0) || 'U'
            });

            // Send current active users
            io.emit('active_users', Array.from(activeUsers.values()));
            
            console.log(`User authenticated: ${userData.name}`);
        });

        // Join chat room
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            
            if (!chatRooms.has(roomId)) {
                chatRooms.set(roomId, {
                    id: roomId,
                    messages: [],
                    members: []
                });
            }

            const room = chatRooms.get(roomId);
            const user = activeUsers.get(socket.id);
            
            if (user && !room.members.find(m => m.id === socket.id)) {
                room.members.push({
                    id: socket.id,
                    name: user.name,
                    avatar: user.avatar
                });
            }

            // Send room history to the user
            socket.emit('room_history', room.messages);
            
            // Notify room of new member
            io.to(roomId).emit('user_joined', {
                user: user?.name || 'Someone',
                roomId,
                timestamp: new Date().toISOString()
            });

            console.log(`User ${user?.name} joined room: ${roomId}`);
        });

        // Leave room
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            
            const room = chatRooms.get(roomId);
            const user = activeUsers.get(socket.id);
            
            if (room) {
                room.members = room.members.filter(m => m.id !== socket.id);
            }

            io.to(roomId).emit('user_left', {
                user: user?.name || 'Someone',
                roomId,
                timestamp: new Date().toISOString()
            });
        });

        // Send message
        socket.on('send_message', (data) => {
            const { roomId, message } = data;
            const user = activeUsers.get(socket.id);

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }

            const messageData = {
                id: Date.now().toString(),
                user: user.name,
                avatar: user.avatar,
                message,
                timestamp: new Date().toISOString(),
                roomId
            };

            // Save message to room
            const room = chatRooms.get(roomId);
            if (room) {
                room.messages.push(messageData);
                
                // Keep only last 100 messages
                if (room.messages.length > 100) {
                    room.messages = room.messages.slice(-100);
                }
            }

            // Broadcast message to room
            io.to(roomId).emit('new_message', messageData);
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { roomId, isTyping } = data;
            const user = activeUsers.get(socket.id);

            if (user) {
                socket.to(roomId).emit('user_typing', {
                    user: user.name,
                    isTyping,
                    roomId
                });
            }
        });

        // Update user status
        socket.on('update_status', (status) => {
            const user = activeUsers.get(socket.id);
            if (user) {
                user.status = status;
                io.emit('active_users', Array.from(activeUsers.values()));
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const user = activeUsers.get(socket.id);
            
            if (user) {
                console.log(`User disconnected: ${user.name}`);
                
                // Remove from all rooms
                chatRooms.forEach((room, roomId) => {
                    room.members = room.members.filter(m => m.id !== socket.id);
                    io.to(roomId).emit('user_left', {
                        user: user.name,
                        roomId,
                        timestamp: new Date().toISOString()
                    });
                });

                // Remove from active users
                activeUsers.delete(socket.id);
                io.emit('active_users', Array.from(activeUsers.values()));
            }
        });
    });

    return {
        chatRooms,
        activeUsers
    };
};
