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

// Public routes
router.post('/session', initSession);
router.post('/pageview', trackPageView);
router.post('/event', trackEvent);
router.post('/session/end', endSession);

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