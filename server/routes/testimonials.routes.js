const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonial.controller');
const { auth: protect, isOwner } = require('../middleware/auth.middleware');
const { validateTestimonial } = require('../middleware/validation.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiters
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many testimonial submissions, please try again later.'
});

// =============================================
// PUBLIC ROUTES
// =============================================

router.get('/public/testimonials', publicLimiter, testimonialController.getPublicTestimonials);
router.get('/public/testimonials/featured', publicLimiter, testimonialController.getFeaturedTestimonials);
router.get('/public/testimonials/stats', publicLimiter, testimonialController.getPublicStats);
router.post('/public/testimonials/submit', submissionLimiter, validateTestimonial, testimonialController.submitTestimonial);
router.post('/public/testimonials/:id/helpful', publicLimiter, testimonialController.markHelpful);

// =============================================
// ADMIN ROUTES
// =============================================

router.get('/stats', protect, isOwner, testimonialController.getDetailedStats);
router.get('/export/json', protect, isOwner, testimonialController.exportAsJSON);
router.get('/export/csv', protect, isOwner, testimonialController.exportAsCSV);
router.post('/bulk-delete', protect, isOwner, testimonialController.bulkDelete);
router.post('/bulk-update', protect, isOwner, testimonialController.bulkUpdate);

router.get('/:id', protect, isOwner, testimonialController.getTestimonialById);
router.put('/:id', protect, isOwner, validateTestimonial, testimonialController.updateTestimonial);
router.delete('/:id', protect, isOwner, testimonialController.deleteTestimonial);
router.patch('/:id/toggle-visibility', protect, isOwner, testimonialController.toggleVisibility);
router.patch('/:id/toggle-featured', protect, isOwner, testimonialController.toggleFeatured);
router.patch('/:id/toggle-verified', protect, isOwner, testimonialController.toggleVerified);
router.patch('/:id/reorder', protect, isOwner, testimonialController.updateDisplayOrder);

router.route('/')
    .get(protect, isOwner, testimonialController.getAllTestimonials)
    .post(protect, isOwner, validateTestimonial, testimonialController.createTestimonial);

module.exports = router;