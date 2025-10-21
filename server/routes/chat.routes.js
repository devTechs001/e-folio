const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Get messages for a room
router.get('/messages/:room', chatController.getMessages);

// Send a message
router.post('/messages', chatController.sendMessage);

// Edit a message
router.put('/messages/:id', chatController.editMessage);

// Delete a message
router.delete('/messages/:id', chatController.deleteMessage);

// Add/remove reaction
router.post('/messages/:id/react', chatController.addReaction);

// Mark messages as read
router.post('/messages/:room/read', chatController.markAsRead);

// Get online users
router.get('/users/online', chatController.getOnlineUsers);

module.exports = router;
