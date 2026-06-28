// routes/contact.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendContactMessage } = require('../controllers/contact.controller');

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Too many contact submissions, please try again later.' }
});

// Public contact form endpoint (no auth required, rate limited)
router.post('/send', contactLimiter, sendContactMessage);

module.exports = router;
