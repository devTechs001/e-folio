const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const {
    getConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    regenerateMessage,
    rateMessage,
    toggleBookmark,
    getBookmarks,
    searchMessages,
    getStats,
    exportConversation,
    generateMarkdown
} = require('../controllers/ai.controller');

// All routes require authentication
router.use(auth);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// Messages
router.post('/conversations/:id/messages', sendMessage);
router.post('/messages/:id/regenerate', regenerateMessage);
router.post('/messages/:id/rate', rateMessage);

// Bookmarks
router.post('/messages/:id/bookmark', toggleBookmark);
router.get('/bookmarks', getBookmarks);

// Search & Stats
router.get('/search', searchMessages);
router.get('/stats', getStats);

// Export
router.get('/conversations/:id/export', exportConversation);
router.post('/generate-markdown', generateMarkdown);

module.exports = router;
