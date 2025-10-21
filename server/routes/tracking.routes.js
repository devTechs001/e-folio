const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');

// Initialize visitor session
router.post('/session/init', trackingController.initSession);

// Track page view
router.post('/page', trackingController.trackPageView);

// Track event
router.post('/event', trackingController.trackEvent);

// Get real-time analytics
router.get('/analytics/realtime', trackingController.getRealTimeAnalytics);

// Reviews
router.post('/review', trackingController.submitReview);
router.get('/reviews', trackingController.getReviews);
router.patch('/review/:id/moderate', trackingController.moderateReview);

module.exports = router;
