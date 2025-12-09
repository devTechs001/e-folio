const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// Public routes - no authentication required for landing page chatbot
router.post('/chat', chatbotController.chatWithBot);
router.post('/stream', chatbotController.streamChat);
router.get('/info', chatbotController.getChatbotInfo);

// Private routes - for testing and admin
router.get('/test', chatbotController.testConnection);

module.exports = router;
