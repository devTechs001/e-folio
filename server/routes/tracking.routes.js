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

// Public routes (rate limited)
router.post('/session', trackingLimiter, initSession);
router.post('/pageview', trackingLimiter, trackPageView);
router.post('/event', trackingLimiter, trackEvent);
router.post('/session/end', trackingLimiter, endSession);
router.post('/review', trackingLimiter, trackEvent); // Reuse trackEvent for review submission

// Protected routes (owner only)
router.use(auth);
router.use(isOwner);

router.get('/analytics/realtime', getRealtimeAnalytics);
router.get('/heatmap', getHeatmapData);
router.get('/funnel', getConversionFunnel);
router.get('/patterns', getBehaviorPatterns);
router.get('/predictive', getPredictiveAnalytics);
router.get('/export', exportAnalytics);

module.exports = router;