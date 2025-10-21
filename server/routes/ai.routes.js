const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Generate content
router.post('/generate', aiController.generateContent);

// Improve content
router.post('/improve', aiController.improveContent);

// Get suggestions
router.post('/suggestions', aiController.getSuggestions);

// Analyze content
router.post('/analyze', aiController.analyzeContent);

// Generate code
router.post('/code', aiController.generateCode);

module.exports = router;
