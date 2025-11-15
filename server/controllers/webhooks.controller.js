// controllers/webhooks.controller.js
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Mock webhooks storage (in production, use a database)
let webhooks = [];

// Helper function to generate webhook signature
const generateSignature = (payload, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
};

// Helper function to send webhook
const sendWebhook = async (webhook, payload) => {
    try {
        const signature = generateSignature(payload, webhook.secret);
        
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'User-Agent': 'E-Folio-Webhooks/1.0'
            },
            body: JSON.stringify(payload)
        });

        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Get all webhooks
const getWebhooks = async (req, res) => {
    try {
        const userWebhooks = webhooks.filter(w => w.userId === req.user.id);
        res.json({
            success: true,
            data: userWebhooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get single webhook
const getWebhook = async (req, res) => {
    try {
        const webhook = webhooks.find(w => w.id === req.params.id && w.userId === req.user.id);
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            data: webhook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create webhook
const createWebhook = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { name, url, events, secret, active = true } = req.body;

        const webhook = {
            id: crypto.randomUUID(),
            userId: req.user.id,
            name,
            url,
            events,
            secret: secret || crypto.randomBytes(32).toString('hex'),
            active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastTriggered: null,
            deliveryLogs: []
        };

        webhooks.push(webhook);

        res.status(201).json({
            success: true,
            data: webhook,
            message: 'Webhook created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update webhook
const updateWebhook = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const webhookIndex = webhooks.findIndex(w => w.id === req.params.id && w.userId === req.user.id);
        
        if (webhookIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        const { name, url, events, secret, active } = req.body;

        webhooks[webhookIndex] = {
            ...webhooks[webhookIndex],
            ...(name && { name }),
            ...(url && { url }),
            ...(events && { events }),
            ...(secret && { secret }),
            ...(active !== undefined && { active }),
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: webhooks[webhookIndex],
            message: 'Webhook updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete webhook
const deleteWebhook = async (req, res) => {
    try {
        const webhookIndex = webhooks.findIndex(w => w.id === req.params.id && w.userId === req.user.id);
        
        if (webhookIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        webhooks.splice(webhookIndex, 1);

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Test webhook
const testWebhook = async (req, res) => {
    try {
        const webhook = webhooks.find(w => w.id === req.params.id && w.userId === req.user.id);
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook from E-Folio',
                webhookId: webhook.id
            }
        };

        const result = await sendWebhook(webhook, testPayload);

        // Log the delivery attempt
        const deliveryLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            payload: testPayload,
            success: result.success,
            status: result.status,
            statusText: result.statusText,
            error: result.error
        };

        webhook.deliveryLogs.push(deliveryLog);
        webhook.lastTriggered = new Date().toISOString();

        res.json({
            success: true,
            data: {
                webhookId: webhook.id,
                testResult: result,
                deliveryLog
            },
            message: 'Webhook test completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getWebhooks,
    getWebhook,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook
};
