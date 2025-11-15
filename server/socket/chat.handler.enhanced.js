const Message = require('../models/Message.model');
const User = require('../models/User.model');

// Active connections tracking
const activeConnections = new Map();
const typingUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // Authenticate user
        socket.on('authenticate', async (userData) => {
            try {
                let user;
                
                // Check if userId is a mock ID (not a valid ObjectId)
                if (userData.userId && typeof userData.userId === 'string' && !/^[0-9a-fA-F]{24}$/.test(userData.userId)) {
                    // Create a mock user object for development
                    user = {
                        _id: userData.userId,
                        id: userData.userId,
                        name: userData.name || 'Mock User',
                        email: userData.email || 'mock@example.com',
                        role: userData.role || 'owner',
                        avatar: userData.avatar || null
                    };
                } else {
                    // Verify user exists in database
                    user = await User.findById(userData.userId).select('-password');
                }
                
                if (!user) {
                    socket.emit('error', { message: 'Invalid user' });
                    return;
                }

                activeConnections.set(socket.id, {
                    socketId: socket.id,
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    status: 'online',
                    connectedAt: new Date()
                });

                socket.userId = user._id;
                socket.userName = user.name;
                socket.userRole = user.role;

                // Broadcast updated user list
                io.emit('active_users', Array.from(activeConnections.values()));
                
                console.log(`👤 User authenticated: ${user.name} (${user.role})`);
                
                socket.emit('authenticated', { success: true, user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar
                }});
            } catch (error) {
                console.error('Authentication error:', error);
                socket.emit('error', { message: 'Authentication failed' });
            }
        });

        // Join chat room
        socket.on('join_room', async (roomId) => {
            try {
                socket.join(roomId);
                socket.currentRoom = roomId;

                const user = activeConnections.get(socket.id);
                
                if (user) {
                    // Load recent messages from database
                    const messages = await Message.find({ room: roomId, isDeleted: false })
                        .sort({ createdAt: -1 })
                        .limit(50);
                    
                    // For mock users, we can't populate from database, so we'll add the sender info manually
                    const processedMessages = messages.map(msg => {
                        const messageObj = msg.toObject();
                        // If the sender is a mock user, use the user info from activeConnections
                        if (typeof messageObj.sender === 'string' && !/^[0-9a-fA-F]{24}$/.test(messageObj.sender)) {
                            const senderConnection = Array.from(activeConnections.values()).find(conn =>
                                conn.userId.toString() === messageObj.sender.toString()
                            );
                            messageObj.sender = senderConnection ? {
                                _id: senderConnection.userId,
                                name: senderConnection.name,
                                email: senderConnection.email,
                                avatar: senderConnection.avatar,
                                role: senderConnection.role
                            } : {
                                _id: messageObj.sender,
                                name: 'Unknown User',
                                email: '',
                                avatar: null,
                                role: 'user'
                            };
                        }
                        return messageObj;
                    });

                    // Send room history
                    socket.emit('room_history', {
                        roomId,
                        messages: processedMessages.reverse()
                    });

                    // Notify room of new member
                    socket.to(roomId).emit('user_joined', {
                        user: {
                            name: user.name,
                            avatar: user.avatar,
                            role: user.role
                        },
                        roomId,
                        timestamp: new Date()
                    });

                    // Mark messages as read
                    await Message.updateMany(
                        {
                            room: roomId,
                            sender: { $ne: user.userId },
                            'readBy.user': { $ne: user.userId }
                        },
                        {
                            $push: {
                                readBy: {
                                    user: user.userId,
                                    readAt: new Date()
                                }
                            }
                        }
                    );

                    console.log(`💬 ${user.name} joined room: ${roomId}`);
                }
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Leave room
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            const user = activeConnections.get(socket.id);
            
            if (user) {
                socket.to(roomId).emit('user_left', {
                    user: {
                        name: user.name,
                        avatar: user.avatar
                    },
                    roomId,
                    timestamp: new Date()
                });
                
                console.log(`👋 ${user.name} left room: ${roomId}`);
            }
        });

        // Send message
        socket.on('send_message', async (data) => {
            try {
                const { roomId, content, type = 'text', fileUrl, fileName, fileSize, replyTo } = data;
                const user = activeConnections.get(socket.id);

                if (!user) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                // Save message to database
                const message = new Message({
                    room: roomId,
                    sender: user.userId, // This could be a mock ID or ObjectId
                    senderName: user.name,
                    senderRole: user.role,
                    content,
                    type,
                    fileUrl,
                    fileName,
                    fileSize,
                    metadata: {
                        replyTo
                    }
                });

                await message.save();
                
                // For mock users, we can't populate from database, so we'll add the sender info manually
                const messageObj = message.toObject();
                if (typeof messageObj.sender === 'string' && !/^[0-9a-fA-F]{24}$/.test(messageObj.sender)) {
                    const senderConnection = Array.from(activeConnections.values()).find(conn =>
                        conn.userId.toString() === messageObj.sender.toString()
                    );
                    messageObj.sender = senderConnection ? {
                        _id: senderConnection.userId,
                        name: senderConnection.name,
                        email: senderConnection.email,
                        avatar: senderConnection.avatar,
                        role: senderConnection.role
                    } : {
                        _id: messageObj.sender,
                        name: 'Unknown User',
                        email: '',
                        avatar: null,
                        role: 'user'
                    };
                }
                
                if (replyTo) {
                    // Handle replyTo population for mock users as well
                    try {
                        const replyMessage = await Message.findById(replyTo);
                        if (replyMessage) {
                            if (typeof replyMessage.sender === 'string' && !/^[0-9a-fA-F]{24}$/.test(replyMessage.sender)) {
                                const senderConnection = Array.from(activeConnections.values()).find(conn =>
                                    conn.userId.toString() === replyMessage.sender.toString()
                                );
                                messageObj.metadata.replyTo = {
                                    _id: replyMessage._id,
                                    content: replyMessage.content,
                                    senderName: senderConnection ? senderConnection.name : 'Unknown User'
                                };
                            } else {
                                await message.populate('metadata.replyTo', 'content senderName');
                            }
                        }
                    } catch (error) {
                        console.error('Error populating reply message:', error);
                    }
                }
                
                // Broadcast message to room
                io.to(roomId).emit('new_message', messageObj);

                // Stop typing indicator
                const typingKey = `${roomId}-${socket.id}`;
                if (typingUsers.has(typingKey)) {
                    typingUsers.delete(typingKey);
                    socket.to(roomId).emit('user_typing', {
                        user: user.name,
                        isTyping: false,
                        roomId
                    });
                }

                console.log(`📨 Message from ${user.name} in ${roomId}`);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Edit message
        socket.on('edit_message', async (data) => {
            try {
                const { messageId, content } = data;
                const user = activeConnections.get(socket.id);

                if (!user) return;

                const message = await Message.findById(messageId);
                
                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                // Handle comparison between mock IDs and real ObjectIds
                const messageSenderId = message.sender.toString();
                const userSenderId = user.userId.toString();
                
                if (messageSenderId !== userSenderId) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }

                message.content = content;
                message.metadata.edited = true;
                message.metadata.editedAt = new Date();
                await message.save();

                io.to(message.room).emit('message_edited', message);
            } catch (error) {
                console.error('Edit message error:', error);
                socket.emit('error', { message: 'Failed to edit message' });
            }
        });

        // Delete message
        socket.on('delete_message', async (data) => {
            try {
                const { messageId } = data;
                const user = activeConnections.get(socket.id);

                if (!user) return;

                const message = await Message.findById(messageId);
                
                if (!message) return;

                // Handle comparison between mock IDs and real ObjectIds
                const messageSenderId = message.sender.toString();
                const userSenderId = user.userId.toString();
                
                if (messageSenderId !== userSenderId) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }

                message.isDeleted = true;
                await message.save();

                io.to(message.room).emit('message_deleted', { messageId });
            } catch (error) {
                console.error('Delete message error:', error);
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { roomId, isTyping } = data;
            const user = activeConnections.get(socket.id);

            if (user) {
                const typingKey = `${roomId}-${socket.id}`;
                
                if (isTyping) {
                    typingUsers.set(typingKey, {
                        user: user.name,
                        roomId,
                        startedAt: new Date()
                    });
                } else {
                    typingUsers.delete(typingKey);
                }

                socket.to(roomId).emit('user_typing', {
                    user: user.name,
                    userId: user.userId,
                    isTyping,
                    roomId
                });
            }
        });

        // Add reaction
        socket.on('add_reaction', async (data) => {
            try {
                const { messageId, emoji } = data;
                const user = activeConnections.get(socket.id);

                if (!user) return;

                const message = await Message.findById(messageId);
                if (!message) return;

                // Check if already reacted - handle mock IDs
                const existingIndex = message.reactions.findIndex(
                    r => r.user.toString() === user.userId.toString() && r.emoji === emoji
                );

                if (existingIndex > -1) {
                    message.reactions.splice(existingIndex, 1);
                } else {
                    message.reactions.push({
                        user: user.userId,
                        emoji
                    });
                }

                await message.save();

                io.to(message.room).emit('reaction_updated', {
                    messageId,
                    reactions: message.reactions
                });
            } catch (error) {
                console.error('Add reaction error:', error);
            }
        });

        // Mark messages as read
        socket.on('mark_as_read', async (data) => {
            try {
                const { roomId } = data;
                const user = activeConnections.get(socket.id);

                if (!user) return;

                await Message.updateMany(
                    {
                        room: roomId,
                        sender: { $ne: user.userId },
                        'readBy.user': { $ne: user.userId }
                    },
                    {
                        $push: {
                            readBy: {
                                user: user.userId,
                                readAt: new Date()
                            }
                        }
                    }
                );

                socket.to(roomId).emit('messages_read', {
                    userId: user.userId,
                    userName: user.name,
                    roomId
                });
            } catch (error) {
                console.error('Mark as read error:', error);
            }
        });

        // File upload progress
        socket.on('file_upload_progress', (data) => {
            const { roomId, progress, fileName } = data;
            const user = activeConnections.get(socket.id);

            if (user) {
                socket.to(roomId).emit('user_uploading', {
                    user: user.name,
                    progress,
                    fileName,
                    roomId
                });
            }
        });

        // Request more messages (pagination)
        socket.on('load_more_messages', async (data) => {
            try {
                const { roomId, before } = data;
                
                const messages = await Message.find({
                    room: roomId,
                    isDeleted: false,
                    createdAt: { $lt: new Date(before) }
                })
                    .sort({ createdAt: -1 })
                    .limit(50);
                
                // Process messages to handle mock users
                const processedMessages = messages.map(msg => {
                    const messageObj = msg.toObject();
                    // If the sender is a mock user, we can't populate from database
                    if (typeof messageObj.sender === 'string' && !/^[0-9a-fA-F]{24}$/.test(messageObj.sender)) {
                        const senderConnection = Array.from(activeConnections.values()).find(conn =>
                            conn.userId.toString() === messageObj.sender.toString()
                        );
                        messageObj.sender = senderConnection ? {
                            _id: senderConnection.userId,
                            name: senderConnection.name,
                            email: senderConnection.email,
                            avatar: senderConnection.avatar,
                            role: senderConnection.role
                        } : {
                            _id: messageObj.sender,
                            name: 'Unknown User',
                            email: '',
                            avatar: null,
                            role: 'user'
                        };
                    }
                    return messageObj;
                });

                socket.emit('more_messages', {
                    roomId,
                    messages: processedMessages.reverse(),
                    hasMore: processedMessages.length === 50
                });
            } catch (error) {
                console.error('Load more messages error:', error);
            }
        });

        // Update user status
        socket.on('update_status', (status) => {
            const user = activeConnections.get(socket.id);
            if (user) {
                user.status = status;
                io.emit('active_users', Array.from(activeConnections.values()));
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            const user = activeConnections.get(socket.id);
            
            if (user) {
                console.log(`❌ User disconnected: ${user.name}`);
                
                // Remove typing indicators
                typingUsers.forEach((value, key) => {
                    if (key.includes(socket.id)) {
                        typingUsers.delete(key);
                    }
                });

                // Notify all rooms
                if (socket.currentRoom) {
                    socket.to(socket.currentRoom).emit('user_left', {
                        user: {
                            name: user.name,
                            avatar: user.avatar
                        },
                        roomId: socket.currentRoom,
                        timestamp: new Date()
                    });
                }

                activeConnections.delete(socket.id);
                io.emit('active_users', Array.from(activeConnections.values()));
            }
        });
    });

    // Cleanup old typing indicators periodically
    setInterval(() => {
        const now = new Date();
        typingUsers.forEach((value, key) => {
            if (now - value.startedAt > 10000) { // 10 seconds timeout
                typingUsers.delete(key);
            }
        });
    }, 5000);

    return {
        activeConnections,
        typingUsers
    };
};
