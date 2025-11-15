// routes/reviews.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reviewsController = require('../controllers/reviews.controller');
const { auth } = require('../middleware/auth.middleware');

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

// Main reviews routes
router.route('/')
    .get(reviewsController.getReviews)
    .post(auth, reviewsController.createReview);

router.route('/featured')
    .get(reviewsController.getFeaturedReviews);

router.route('/analytics')
    .get(reviewsController.getReviewAnalytics);

router.route('/:id')
    .get(reviewsController.getReviewById)
    .put(auth, reviewsController.updateReview)
    .delete(auth, reviewsController.deleteReview);

router.route('/:id/approve')
    .post(auth, reviewsController.moderateReview);

router.route('/:id/moderate')
    .patch(auth, reviewsController.moderateReview);

// Upload attachment endpoint
router.post('/upload-attachment', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.json({
            success: true,
            url: `/uploads/reviews/${req.file.filename}`,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (error) {
        res.status(50).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});

module.exports = router;