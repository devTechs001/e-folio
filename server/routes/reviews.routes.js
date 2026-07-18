// routes/reviews.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reviewsController = require('../controllers/reviews.controller');
const { auth } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/reviews');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Public/review endpoints (no auth required, accessible by public/collaborators)
router.get('/public', reviewsController.getPublicReviews);
router.post('/submit', rateLimiter(5), reviewsController.createReview);

router.route('/featured')
    .get(reviewsController.getFeaturedReviews);

// Like/unlike review endpoints (public actions, rate limited)
router.post('/:id/like', rateLimiter(30), reviewsController.likeReview);
router.delete('/:id/like', rateLimiter(30), reviewsController.unlikeReview);

// Export before /:id to prevent :id from catching "export"
router.get('/export', auth, reviewsController.exportReviews);

// Upload attachment (requires auth)
router.post('/upload-attachment', auth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/reviews/${req.file.filename}`;

        res.json({
            success: true,
            url: fullUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Upload failed'
        });
    }
});

// Bulk actions (must be before /:id to prevent route conflict)
router.post('/bulk/moderate', auth, reviewsController.bulkModerateReviews);
router.post('/bulk/delete', auth, reviewsController.bulkDeleteReviews);

// Admin/protected routes (require auth)
router.route('/')
    .get(reviewsController.getReviews)
    .post(auth, reviewsController.createReview);

router.route('/analytics')
    .get(auth, reviewsController.getReviewAnalytics);

router.route('/:id')
    .get(reviewsController.getReviewById)
    .put(auth, reviewsController.updateReview)
    .delete(auth, reviewsController.deleteReview);

router.route('/:id/approve')
    .post(auth, reviewsController.moderateReview);

router.route('/:id/moderate')
    .patch(auth, reviewsController.moderateReview);

// Reply to review
router.post('/:id/reply', auth, reviewsController.replyToReview);

// Toggle featured status
router.put('/:id/featured', auth, reviewsController.toggleFeaturedReview);

// Toggle visibility
router.put('/:id/visibility', auth, reviewsController.toggleReviewVisibility);

module.exports = router;