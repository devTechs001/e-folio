const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { auth } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Public routes - no authentication required for landing page chatbot (rate limited)
router.post('/chat', rateLimiter(20), chatbotController.chatWithBot);
router.post('/stream', rateLimiter(20), chatbotController.streamChat);
router.get('/info', chatbotController.getChatbotInfo);

// Private routes - for testing and admin
router.get('/test', auth, chatbotController.testConnection);

module.exports = router;
