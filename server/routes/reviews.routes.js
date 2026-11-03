// routes/reviews.routes.js
const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');
const { reviewUpload } = require('../middleware/upload.middleware');

// Intentionally anonymous: portfolio display and review submission.
// Everything that reads the full review collection (emails, IP addresses,
// pending/private reviews) or mutates moderation state is owner-only.
router.get('/public', reviewsController.getPublicReviews);
router.post('/submit', rateLimiter(5), reviewsController.createReview);
router.get('/featured', reviewsController.getFeaturedReviews);

// Like/unlike review endpoints (public actions, rate limited)
router.post('/:id/like', rateLimiter(30), reviewsController.likeReview);
router.delete('/:id/like', rateLimiter(30), reviewsController.unlikeReview);

// "export" must be declared before /:id so the parameter route cannot catch it.
// All administrative routes require both a valid token and the owner role:
// `auth` alone let any collaborator moderate, export or delete every review.
router.get('/export', auth, isOwner, reviewsController.exportReviews);

router.post('/upload-attachment', auth, isOwner, reviewUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }
    return res.json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/reviews/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size
    });
});

router.post('/bulk/moderate', auth, isOwner, reviewsController.bulkModerateReviews);
router.post('/bulk/delete', auth, isOwner, reviewsController.bulkDeleteReviews);

router.route('/')
    .get(auth, isOwner, reviewsController.getReviews)
    .post(auth, isOwner, reviewsController.createReview);

router.route('/analytics')
    .get(auth, isOwner, reviewsController.getReviewAnalytics);

router.route('/:id')
    .get(auth, isOwner, reviewsController.getReviewById)
    .put(auth, isOwner, reviewsController.updateReview)
    .delete(auth, isOwner, reviewsController.deleteReview);

router.route('/:id/approve')
    .post(auth, isOwner, reviewsController.moderateReview);

router.route('/:id/moderate')
    .patch(auth, isOwner, reviewsController.moderateReview);

router.post('/:id/reply', auth, isOwner, reviewsController.replyToReview);
router.put('/:id/featured', auth, isOwner, reviewsController.toggleFeaturedReview);
router.put('/:id/visibility', auth, isOwner, reviewsController.toggleReviewVisibility);

module.exports = router;
