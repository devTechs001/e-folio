const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');

// Apply authentication and ownership verification middleware for all analytics routes
router.use(auth);
router.use(isOwner);

// Basic analytics endpoints
router.post('/track', analyticsController.trackVisitor);
router.get('/', analyticsController.getBasicAnalytics);

// Enhanced analytics endpoints
router.get('/overview', analyticsController.getOverview);
router.get('/traffic', analyticsController.getTrafficAnalytics);
router.get('/behavior', analyticsController.getBehaviorAnalytics);
router.get('/conversion', analyticsController.getConversionAnalytics);
router.get('/technical', analyticsController.getTechnicalAnalytics);
router.get('/social', analyticsController.getSocialMediaAnalytics);
router.get('/seo', analyticsController.getSEOAnalytics);
router.get('/competitor', analyticsController.getCompetitorAnalytics);
router.get('/goals', analyticsController.getGoalsProgress);
router.get('/heatmap', analyticsController.getHeatmapData);
router.get('/ab-tests', analyticsController.getABTestResults);
router.get('/retention', analyticsController.getUserRetention);
router.get('/funnel', analyticsController.getConversionFunnel);
router.get('/alerts', analyticsController.getAnalyticsAlerts);

module.exports = router;
