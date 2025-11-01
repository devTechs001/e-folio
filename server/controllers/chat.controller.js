// controllers/chat.controller.js
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User.model');
const DirectMessage = require('../models/DirectMessage');

// Get all rooms for user
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { isPrivate: false },
                { members: req.user.id }
            ]
        })
        .populate('members', 'name avatar status')
        .sort({ updatedAt: -1 });

        res.json({
            success: true,
            rooms: rooms.map(room => ({
                id: room._id,
                name: room.name,
                description: room.description,
                isPrivate: room.isPrivate,
                members: room.members.length,
                createdAt: room.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create room
exports.createRoom = async (req, res) => {
    try {
        const { name, description, isPrivate, members } = req.body;

        const room = new Room({
            name,
            description,
            isPrivate,
            members: [req.user.id, ...(members || [])],
            createdBy: req.user.id
        });

        await room.save();

        res.json({
            success: true,
            room: {
                id: room._id,
                name: room.name,
                description: room.description,
                isPrivate: room.isPrivate,
                members: room.members.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create room', error: error.message });
    }
};

// Update room
exports.updateRoom = async (req, res) => {
    try {
        const { name, description, members } = req.body;
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        room.name = name || room.name;
        room.description = description || room.description;
        if (members) room.members = members;

        await room.save();

        res.json({ success: true, room });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete room
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await room.remove();
        await Message.deleteMany({ room: req.params.id });

        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get room messages
exports.getRoomMessages = async (req, res) => {
    try {
        const { limit = 50, before } = req.query;
        
        const query = { room: req.params.id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name avatar')
            .populate('replyTo')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            messages: messages.reverse()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { room, content, type, fileUrl, fileType, replyTo } = req.body;

        const message = new Message({
            room,
            sender: req.user.id,
            senderName: req.user.name,
            senderAvatar: req.user.avatar,
            content,
            type: type || 'text',
            fileUrl,
            fileType,
            replyTo
        });

        await message.save();
        await Room.findByIdAndUpdate(room, { updatedAt: Date.now() });

        // Emit socket event
        req.app.get('io').to(room).emit('new_message', message);

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
    }
};

// Update message
exports.updateMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        message.content = content;
        message.edited = true;
        message.editedAt = Date.now();

        await message.save();

        // Emit socket event
        req.app.get('io').to(message.room.toString()).emit('message_updated', message);

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete message
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const roomId = message.room;
        await message.remove();

        // Emit socket event
        req.app.get('io').to(roomId.toString()).emit('message_deleted', req.params.id);

        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add reaction
exports.addReaction = async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const existingReaction = message.reactions.find(
            r => r.emoji === emoji && r.user.toString() === req.user.id
        );

        if (!existingReaction) {
            message.reactions.push({
                emoji,
                user: req.user.id,
                userName: req.user.name
            });
            await message.save();
        }

        // Group reactions by emoji
        const groupedReactions = message.reactions.reduce((acc, r) => {
            const existing = acc.find(item => item.emoji === r.emoji);
            if (existing) {
                existing.count++;
                existing.users.push(r.userName);
            } else {
                acc.push({ emoji: r.emoji, count: 1, users: [r.userName] });
            }
            return acc;
        }, []);

        // Emit socket event
        req.app.get('io').to(message.room.toString()).emit('message_reaction', {
            messageId: message._id,
            reactions: groupedReactions
        });

        res.json({ success: true, reactions: groupedReactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Search messages
exports.searchMessages = async (req, res) => {
    try {
        const { q, room } = req.query;

        const query = {
            content: { $regex: q, $options: 'i' }
        };

        if (room) {
            query.room = room;
        }

        const results = await Message.find(query)
            .populate('sender', 'name avatar')
            .limit(20)
            .sort({ createdAt: -1 });

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (!message.readBy.includes(req.user.id)) {
            message.readBy.push(req.user.id);
            await message.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Pin message
exports.pinMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        message.isPinned = true;
        await message.save();

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
    try {
        const users = await User.find({ 
            status: { $in: ['online', 'away', 'busy'] }
        }).select('name avatar status');

        res.json({
            success: true,
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                avatar: u.avatar || u.name.charAt(0),
                status: u.status
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// File upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;

        res.json({
            success: true,
            fileUrl,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};

// Get direct messages
exports.getDirectMessages = async (req, res) => {
    try {
        const conversations = await DirectMessage.find({
            participants: req.user.id
        })
        .populate('participants', 'name avatar status')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};