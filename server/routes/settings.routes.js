const express = require('express');
const router = express.Router();
const multer = require('multer');
const settingsController = require('../controllers/settings.controller');
const { auth } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Settings routes
router.get('/', auth, settingsController.getUserSettings.bind(settingsController));
router.put('/', auth, upload.single('avatar'), settingsController.updateUserSettings.bind(settingsController));

// Password
router.post('/password/change', auth, rateLimiter(5), settingsController.changePassword.bind(settingsController));

// API Keys
router.get('/api-keys', auth, settingsController.getApiKeys.bind(settingsController));
router.post('/api-keys', auth, settingsController.generateApiKey.bind(settingsController));
router.delete('/api-keys/:keyId', auth, settingsController.deleteApiKey.bind(settingsController));

// Webhooks
router.get('/webhooks', auth, settingsController.getWebhooks.bind(settingsController));
router.post('/webhooks', auth, settingsController.createWebhook.bind(settingsController));
router.delete('/webhooks/:webhookId', auth, settingsController.deleteWebhook.bind(settingsController));

// Sessions
router.get('/sessions', auth, settingsController.getActiveSessions.bind(settingsController));
router.delete('/sessions/:sessionId', auth, settingsController.terminateSession.bind(settingsController));

// 2FA
router.post('/2fa/enable', auth, settingsController.enable2FA.bind(settingsController));
router.post('/2fa/verify', auth, settingsController.verify2FA.bind(settingsController));
router.post('/2fa/disable', auth, rateLimiter(3), settingsController.disable2FA.bind(settingsController));

// Data & Account
router.get('/export', auth, settingsController.exportUserData.bind(settingsController));
router.post('/delete-account', auth, rateLimiter(3), settingsController.deleteAccount.bind(settingsController));

module.exports = router;