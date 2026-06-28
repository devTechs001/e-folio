const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');
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
    generateMarkdown,
    getPreferences,
    savePreferences,
    getEmbeddings,
    moderateContent,
    generateImage,
    transcribeAudio
} = require('../controllers/ai.controller');

// All routes require authentication
router.use(auth);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// Messages (rate limited)
router.post('/conversations/:id/messages', rateLimiter(30), sendMessage);
router.post('/messages/:id/regenerate', rateLimiter(20), regenerateMessage);
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

// Chat endpoints
router.post('/chat', sendMessage); // Direct chat endpoint
router.post('/chat/stream', sendMessage); // For streaming

// Preferences
router.get('/preferences', getPreferences);
router.post('/preferences', savePreferences);

// Embeddings
router.post('/embeddings', getEmbeddings);

// Moderation
router.post('/moderate', moderateContent);

// Usage stats
router.get('/usage-stats', getStats);

// Images - for vision models
router.post('/images/generate', generateImage);

// Transcription
router.post('/transcribe', transcribeAudio);

module.exports = router;
