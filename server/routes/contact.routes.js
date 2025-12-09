// routes/contact.routes.js
const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contact.controller');

// Public contact form endpoint (no auth required)
router.post('/send', sendContactMessage);

module.exports = router;
