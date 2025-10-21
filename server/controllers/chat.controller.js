const Message = require('../models/Message.model');
const User = require('../models/User.model');

class ChatController {
    // Get messages for a room
    async getMessages(req, res) {
        try {
            const { room } = req.params;
            const { limit = 50, before } = req.query;

            const query = { room, isDeleted: false };
            if (before) {
                query.createdAt = { $lt: new Date(before) };
            }

            const messages = await Message.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .populate('sender', 'name email avatar role')
                .populate('metadata.replyTo', 'content senderName');

            res.json({
                success: true,
                messages: messages.reverse(), // Return in chronological order
                hasMore: messages.length === parseInt(limit)
            });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Send a message
    async sendMessage(req, res) {
        try {
            const { room, content, type = 'text', fileUrl, fileName, fileSize, replyTo } = req.body;
            const { userId, userName, userRole } = req.user || {}; // From auth middleware

            if (!content && !fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Message content or file is required'
                });
            }

            const message = new Message({
                room,
                sender: userId,
                senderName: userName,
                senderRole: userRole,
                content: content || fileName,
                type,
                fileUrl,
                fileName,
                fileSize,
                metadata: {
                    replyTo
                }
            });

            await message.save();
            await message.populate('sender', 'name email avatar role');

            res.json({
                success: true,
                message
            });
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Edit a message
    async editMessage(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const { userId } = req.user || {};

            const message = await Message.findById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            if (message.sender.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            message.content = content;
            message.metadata.edited = true;
            message.metadata.editedAt = new Date();
            await message.save();

            res.json({
                success: true,
                message
            });
        } catch (error) {
            console.error('Edit message error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Delete a message
    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.user || {};

            const message = await Message.findById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            if (message.sender.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            message.isDeleted = true;
            await message.save();

            res.json({
                success: true,
                message: 'Message deleted'
            });
        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Add reaction to message
    async addReaction(req, res) {
        try {
            const { id } = req.params;
            const { emoji } = req.body;
            const { userId } = req.user || {};

            const message = await Message.findById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            // Check if user already reacted with this emoji
            const existingReaction = message.reactions.find(
                r => r.user.toString() === userId && r.emoji === emoji
            );

            if (existingReaction) {
                // Remove reaction
                message.reactions = message.reactions.filter(
                    r => !(r.user.toString() === userId && r.emoji === emoji)
                );
            } else {
                // Add reaction
                message.reactions.push({
                    user: userId,
                    emoji
                });
            }

            await message.save();

            res.json({
                success: true,
                message
            });
        } catch (error) {
            console.error('Add reaction error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Mark messages as read
    async markAsRead(req, res) {
        try {
            const { room } = req.params;
            const { userId } = req.user || {};

            await Message.updateMany(
                {
                    room,
                    sender: { $ne: userId },
                    'readBy.user': { $ne: userId }
                },
                {
                    $push: {
                        readBy: {
                            user: userId,
                            readAt: new Date()
                        }
                    }
                }
            );

            res.json({
                success: true,
                message: 'Messages marked as read'
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get online users
    async getOnlineUsers(req, res) {
        try {
            // This will be populated from Socket.io
            res.json({
                success: true,
                users: [] // Will be managed by Socket.io
            });
        } catch (error) {
            console.error('Get online users error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new ChatController();
