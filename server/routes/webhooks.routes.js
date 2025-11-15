// routes/webhooks.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getWebhooks,
    getWebhook,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook
} = require('../controllers/webhooks.controller');
const { auth: protect } = require('../middleware/auth.middleware');

// Validation rules
const webhookValidation = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
    body('url').isURL().withMessage('Valid URL is required'),
    body('events').isArray({ min: 1 }).withMessage('At least one event is required'),
    body('secret').optional().isLength({ min: 8 }).withMessage('Secret must be at least 8 characters')
];

// All routes require authentication
router.use(protect);

// Main routes
router.route('/')
    .get(getWebhooks)
    .post(webhookValidation, createWebhook);

router.route('/:id')
    .get(getWebhook)
    .put(webhookValidation, updateWebhook)
    .delete(deleteWebhook);

router.post('/:id/test', testWebhook);

module.exports = router;
