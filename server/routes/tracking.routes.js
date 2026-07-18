// routes/trackingRoutes.js
const express = require('express');
const router = express.Router();
const {
    initSession,
    trackPageView,
    trackEvent,
    endSession,
    getRealtimeAnalytics,
    getHeatmapData,
    getConversionFunnel,
    getBehaviorPatterns,
    getPredictiveAnalytics,
    exportAnalytics
} = require('../controllers/tracking.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');
const { trackingLimiter } = require('../middleware/rateLimitMiddleware');

// Public/collaboration routes (rate limited) - most frequently accessed first
router.post('/session', trackingLimiter, initSession);
router.post('/pageview', trackingLimiter, trackPageView);
router.post('/event', trackingLimiter, trackEvent);
router.post('/review', trackingLimiter, trackEvent);
router.post('/session/end', trackingLimiter, endSession);

// Protected routes (owner only)
router.get('/analytics/realtime', auth, isOwner, getRealtimeAnalytics);
router.get('/heatmap', auth, isOwner, getHeatmapData);
router.get('/funnel', auth, isOwner, getConversionFunnel);
router.get('/patterns', auth, isOwner, getBehaviorPatterns);
router.get('/predictive', auth, isOwner, getPredictiveAnalytics);
router.get('/export', auth, isOwner, exportAnalytics);

module.exports = router;