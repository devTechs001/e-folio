// controllers/reviews.controller.js
const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const User = require('../models/User.model');
const ActivityLog = require('../models/ActivityLog');
const emailService = require('../services/email.service');
const { Parser } = require('@json2csv/plainjs');
const { emitPublicEvent } = require('../utils/projectEvents');

// An unavailable database must never be disguised as real social proof. Every
// degraded response is explicitly unsuccessful and explicitly unpopulated.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REVIEW_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'rating', 'name', 'status', 'featured']);
const dbAvailable = () => mongoose.connection.readyState === 1;
const emptyStats = () => ({ totalReviews: 0, approvedReviews: 0, pendingReviews: 0, rejectedReviews: 0, avgRating: 0 });
const emptyAnalytics = () => ({ ratingDistribution: {}, thisMonth: 0, lastMonth: 0, responseRate: 0, categoryAverages: {} });
const reportUnavailable = (res, label, error, extra = {}) => {
    if (error) console.error(label, error);
    return res.status(503).json({
        success: false,
        message: 'Review data is temporarily unavailable. No sample data is shown.',
        meta: { populated: false },
        ...extra
    });
};
const clampInt = (value, fallback, min, max) => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
};

// Create review (Public)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REVIEW_CATEGORY_KEYS = ['design', 'functionality', 'performance', 'support'];

// Optional visitor fields must never be able to turn a valid submission into
// a Mongoose CastError (a slug project id, a nested rating object, a string
// rating, an undefined categories map, ...).
const normaliseReviewInput = body => {
    const source = body && typeof body === 'object' ? body : {};
    const text = value => (typeof value === 'string' ? value.trim() : '');
    const rawCategories = source.categories && typeof source.categories === 'object' && !Array.isArray(source.categories)
        ? source.categories
        : {};
    const categories = {};
    for (const key of REVIEW_CATEGORY_KEYS) {
        const value = Number(rawCategories[key]);
        categories[key] = Number.isFinite(value) ? Math.min(5, Math.max(0, Math.round(value))) : 0;
    }
    const projectId = /^[0-9a-fA-F]{24}$/.test(String(source.projectId || '')) ? source.projectId : undefined;
    return {
        name: text(source.name).slice(0, 120),
        email: text(source.email).toLowerCase().slice(0, 200),
        rating: Number(source.rating),
        comment: text(source.comment).slice(0, 2000),
        title: text(source.title).slice(0, 150),
        categories,
        projectId,
        recommend: source.recommend !== false
    };
};

// A review already stored in the database must always produce a success
// response. Notification / logging work is isolated from that outcome.
const safeSideEffect = async (label, task) => {
    try { await task(); } catch (error) { console.error(label, error?.message || error); }
};

// Public pages and the owner dashboard refresh themselves from their own
// authorised endpoints when a review is submitted or moderated.
const notifyReviewChange = (req, action, reviewId, status) => {
    emitPublicEvent('review:changed', { action, reviewId: String(reviewId), status }, req.app.get('io'));
};

exports.createReview = async (req, res) => {
    const { name, email, rating, comment, title, categories, projectId, recommend } = normaliseReviewInput(req.body);

    if (!name || !rating || !comment) {
        return res.status(400).json({ success: false, message: 'Name, rating, and comment are required' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (comment.length < 10) {
        return res.status(400).json({ success: false, message: 'Comment must be at least 10 characters' });
    }
    if (email && !EMAIL_RE.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    try {
        if (!dbAvailable()) {
            return res.status(503).json({
                success: false,
                message: 'Review service is temporarily unavailable. Please try again shortly.',
                meta: { populated: false }
            });
        }

        // Duplicate protection is scoped to the same email within 24 hours.
        if (email) {
            const existingReview = await Review.findOne({
                email,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already submitted a review recently'
                });
            }
        }

        const review = await Review.create({
            name,
            email: email || undefined,
            rating,
            comment,
            title: title || undefined,
            categories,
            projectId,
            recommend,
            status: 'pending',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Broadcast ids/status only. Reviewer names, emails and review text
        // are never sent to public listeners.
        emitPublicEvent('review:submitted', {
            reviewId: String(review._id),
            status: review.status
        }, req.app.get('io'));

        // Answer as soon as the record exists. All side effects below are
        // fire-and-forget and individually guarded.
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully! It will be published after moderation.',
            review: { id: review._id, status: review.status }
        });

        void Promise.allSettled([
            safeSideEffect('[review] owner notification failed', async () => {
                const owner = await User.findOne({ role: 'owner' });
                if (!owner) return;
                await safeSideEffect('[review] owner email failed', () => emailService.send({
                    to: owner.email,
                    subject: 'New Review Received',
                    template: 'new-testimonial',
                    data: {
                        name,
                        rating,
                        content: comment,
                        email: email || 'Not provided',
                        website: 'N/A',
                        linkedin: 'N/A',
                        project: title || 'N/A',
                        tags: Object.keys(categories).join(', ') || 'N/A',
                        date: new Date().toLocaleString(),
                        year: new Date().getFullYear()
                    }
                }));
                // The old `user_<id>` room was never joined by any socket.
                // Deliver owner-only detail through the authenticated
                // /notifications namespace instead.
                global.notificationsRealtime?.emitToUser(owner._id, 'new_review', {
                    id: String(review._id),
                    name,
                    rating,
                    comment,
                    createdAt: review.createdAt
                });
            }),
            ...(email ? [safeSideEffect('[review] confirmation email failed', () => emailService.send({
                to: email,
                subject: 'Thank You for Your Review',
                template: 'testimonial-approved',
                data: {
                    name,
                    content: comment,
                    rating,
                    portfolioUrl: process.env.CLIENT_URL || 'https://yourportfolio.com',
                    year: new Date().getFullYear()
                }
            }))] : []),
            safeSideEffect('[review] activity log failed', () => ActivityLog.create({
                userId: req.user?.id,
                action: 'review_submitted',
                metadata: { reviewId: review._id, rating, email: email || undefined },
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }))
        ]);
    } catch (error) {
        console.error('Create review error:', error?.message || error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

// Get reviews with filtering (Owner only)
exports.getReviews = async (req, res) => {
    try {
        if (!dbAvailable()) {
            return reportUnavailable(res, 'Get reviews: database not connected', null, {
                reviews: [],
                stats: emptyStats(),
                pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            });
        }

        const {
            status = 'all',
            search,
            rating,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
            startDate,
            endDate,
            count,
            average
        } = req.query;

        if (count === 'true') {
            const total = await Review.countDocuments({});
            return res.json({ success: true, count: total });
        }

        if (average === 'true') {
            const result = await Review.aggregate([
                { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } }
            ]);
            const data = result[0] || { avg: 0, total: 0 };
            return res.json({ success: true, average: data.avg, count: data.total });
        }

        let query = {};

        // Status filter
        if (status !== 'all') {
            query.status = status;
        }

        // Rating filter
        if (rating && rating !== 'all') {
            query.rating = parseInt(rating);
        }

        // Escape user input: an unescaped $regex is an injection/ReDoS vector.
        if (search) {
            const safeSearch = escapeRegex(String(search).slice(0, 100));
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { comment: { $regex: safeSearch, $options: 'i' } },
                { title: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const safeSortBy = REVIEW_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
        const sortOptions = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };
        const safePage = clampInt(page, 1, 1, 100000);
        const safeLimit = clampInt(limit, 10, 1, 100);

        const reviews = await Review.find(query)
            .sort(sortOptions)
            .limit(safeLimit)
            .skip((safePage - 1) * safeLimit);

        const total = await Review.countDocuments(query);

        // Calculate stats
        const stats = await calculateStats();

        res.json({
            success: true,
            reviews,
            stats,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages: Math.ceil(total / safeLimit)
            }
        });
    } catch (error) {
        reportUnavailable(res, 'Get reviews error:', error, {
            reviews: [],
            stats: emptyStats(),
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
    }
};

// Get review by ID
exports.getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({ success: true, review });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Get public reviews (for portfolio display)
exports.getPublicReviews = async (req, res) => {
    try {
        const { limit = 6, sortBy = 'createdAt', featured = false } = req.query;
        const safeSortBy = REVIEW_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
        const safeLimit = clampInt(limit, 6, 1, 50);

        let query = {
            status: 'approved',
            isPublic: true
        };

        if (featured === 'true') {
            query.featured = true;
        }

        const reviews = await Review.find(query)
            .select('name rating comment title categories createdAt featured')
            .sort({ [safeSortBy]: -1 })
            .limit(safeLimit);

        const avgRating = await Review.aggregate([
            { $match: { status: 'approved', isPublic: true } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.json({
            success: true,
            reviews,
            avgRating: avgRating[0]?.avgRating || 0,
            totalReviews: await Review.countDocuments({ status: 'approved', isPublic: true })
        });
    } catch (error) {
        console.error('Get public reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Get featured reviews
exports.getFeaturedReviews = async (req, res) => {
    try {
        if (!dbAvailable()) {
            return reportUnavailable(res, 'Featured reviews: database not connected', null, { reviews: [] });
        }

        const reviews = await Review.find({
            status: 'approved',
            isPublic: true,
            featured: true
        })
        .select('name rating comment title categories createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({ success: true, reviews });
    } catch (error) {
        reportUnavailable(res, 'Get featured reviews error:', error, { reviews: [] });
    }
};

// Moderate review
exports.moderateReview = async (req, res) => {
    try {
        const { status, response } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.status = status;
        if (response) {
            review.response = response;
            review.respondedAt = new Date();
            review.respondedBy = req.user.id;
        }
        review.moderatedBy = req.user.id;
        review.moderatedAt = new Date();

        await review.save();
        notifyReviewChange(req, 'moderated', review._id, status);

        // Send notification to reviewer
        if (review.email && status === 'approved') {
            try {
                await emailService.send({
                    to: review.email,
                    subject: '🎉 Your Review Has Been Approved!',
                    template: 'testimonial-approved',
                    data: {
                        name: review.name,
                        content: review.comment,
                        rating: review.rating,
                        portfolioUrl: process.env.CLIENT_URL || 'https://yourportfolio.com',
                        year: new Date().getFullYear()
                    }
                });
            } catch (emailError) {
                console.error('Failed to send review approval email:', emailError);
            }
        }

        // Logging must never turn a successful moderation into a 500.
        void safeSideEffect('[review] moderation log failed', () => ActivityLog.create({
            userId: req.user.id,
            action: 'review_moderated',
            metadata: { reviewId: review._id, status }
        }));

        // Socket notification
        if (req.app.get('io')) {
            req.app.get('io').emit('review_updated', {
                id: review._id,
                status
            });
        }

        res.json({
            success: true,
            message: `Review ${status}`,
            review
        });
    } catch (error) {
        console.error('Moderate review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to moderate review',
        });
    }
};

// Reply to review
exports.replyToReview = async (req, res) => {
    try {
        const { response } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.response = response;
        review.respondedAt = new Date();
        review.respondedBy = req.user.id;
        await review.save();

        // Send email to reviewer
        if (review.email) {
            try {
                // Create a custom email template for review responses
                await emailService.send({
                    to: review.email,
                    subject: '💬 Response to Your Review',
                    template: 'review-response',
                    data: {
                        name: review.name,
                        originalComment: review.comment,
                        response,
                        portfolioUrl: process.env.CLIENT_URL || 'https://yourportfolio.com',
                        year: new Date().getFullYear()
                    }
                });
            } catch (emailError) {
                console.error('Failed to send review response email:', emailError);
            }
        }

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'review_replied',
            details: `Replied to review from ${review.name}`,
            metadata: { reviewId: review._id }
        });

        res.json({
            success: true,
            message: 'Reply sent successfully',
            review
        });
    } catch (error) {
        console.error('Reply to review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
        });
    }
};

// Bulk moderate reviews
exports.bulkModerateReviews = async (req, res) => {
    try {
        const { reviewIds, ids, status } = req.body;
        const targetIds = (Array.isArray(reviewIds) ? reviewIds : ids) || [];

        if (targetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No reviews selected'
            });
        }

        await Review.updateMany(
            { _id: { $in: targetIds } },
            {
                status,
                moderatedBy: req.user.id,
                moderatedAt: new Date()
            }
        );

        notifyReviewChange(req, 'bulk-moderated', targetIds[0], status);
        res.json({
            success: true,
            message: `${targetIds.length} reviews ${status}`
        });
    } catch (error) {
        console.error('Bulk moderate error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk moderation failed',
        });
    }
};

// Bulk delete reviews
exports.bulkDeleteReviews = async (req, res) => {
    try {
        const { reviewIds, ids } = req.body;
        const targetIds = (Array.isArray(reviewIds) ? reviewIds : ids) || [];

        if (targetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No reviews selected'
            });
        }

        await Review.deleteMany({ _id: { $in: targetIds } });
        notifyReviewChange(req, 'bulk-deleted', targetIds[0]);

        res.json({
            success: true,
            message: `${targetIds.length} reviews deleted`
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk deletion failed',
        });
    }
};

// Toggle featured status
exports.toggleFeaturedReview = async (req, res) => {
    try {
        const { featured } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.featured = featured;
        await review.save();
        notifyReviewChange(req, 'featured', review._id, review.status);

        res.json({
            success: true,
            message: featured ? 'Added to featured' : 'Removed from featured',
            review
        });
    } catch (error) {
        console.error('Toggle featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update featured status',
        });
    }
};

// Toggle review visibility
exports.toggleReviewVisibility = async (req, res) => {
    try {
        const { isPublic } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.isPublic = isPublic;
        await review.save();
        notifyReviewChange(req, 'visibility', review._id, review.status);

        res.json({
            success: true,
            message: isPublic ? 'Made public' : 'Made private',
            review
        });
    } catch (error) {
        console.error('Toggle visibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update visibility',
        });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const { name, email, rating, comment, title, categories } = req.body;
        
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (name) review.name = name;
        if (email) review.email = email;
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (title) review.title = title;
        if (categories) review.categories = categories;

        await review.save();
        notifyReviewChange(req, 'updated', review._id, review.status);

        res.json({
            success: true,
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
        });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await review.deleteOne();
        notifyReviewChange(req, 'deleted', req.params.id);

        // Logging must never turn a successful deletion into a 500.
        void safeSideEffect('[review] deletion log failed', () => ActivityLog.create({
            userId: req.user.id,
            action: 'review_deleted',
            metadata: { reviewId: req.params.id }
        }));

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
        });
    }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
    try {
        const stats = await calculateStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Get review analytics
exports.getReviewAnalytics = async (req, res) => {
    try {
        if (!dbAvailable()) {
            return reportUnavailable(res, 'Review analytics: database not connected', null, { analytics: emptyAnalytics() });
        }

        // Rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$rating', count: { $sum: 1 } } }
        ]);

        const distribution = {};
        ratingDistribution.forEach(item => {
            distribution[item._id] = item.count;
        });

        // Monthly trends
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

        const thisMonth = await Review.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        const lastMonth = await Review.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
        });

        // Response rate
        const totalReviews = await Review.countDocuments();
        const respondedReviews = await Review.countDocuments({ response: { $exists: true, $ne: '' } });
        const responseRate = totalReviews > 0 ? ((respondedReviews / totalReviews) * 100).toFixed(1) : 0;

        // Category averages
        const categoryAverages = await Review.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    avgDesign: { $avg: '$categories.design' },
                    avgFunctionality: { $avg: '$categories.functionality' },
                    avgPerformance: { $avg: '$categories.performance' },
                    avgSupport: { $avg: '$categories.support' }
                }
            }
        ]);

        res.json({
            success: true,
            analytics: {
                ratingDistribution: distribution,
                thisMonth,
                lastMonth,
                responseRate,
                categoryAverages: categoryAverages[0] || {}
            }
        });
    } catch (error) {
        reportUnavailable(res, 'Get analytics error:', error, { analytics: emptyAnalytics() });
    }
};

// Get reviews by rating
exports.getReviewsByRating = async (req, res) => {
    try {
        const rating = parseInt(req.params.rating);

        const reviews = await Review.find({
            rating,
            status: 'approved'
        }).sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Get reviews by rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Export reviews to CSV
exports.exportReviews = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const reviews = await Review.find(query).sort({ createdAt: -1 });

        const data = reviews.map(review => ({
            name: review.name,
            email: review.email || '',
            rating: review.rating,
            title: review.title || '',
            comment: review.comment,
            status: review.status,
            featured: review.featured ? 'Yes' : 'No',
            isPublic: review.isPublic ? 'Yes' : 'No',
            recommend: review.recommend ? 'Yes' : 'No',
            response: review.response || '',
            createdAt: review.createdAt.toLocaleDateString(),
            moderatedAt: review.moderatedAt ? review.moderatedAt.toLocaleDateString() : ''
        }));

        const fields = [
            'name', 'email', 'rating', 'title', 'comment', 'status',
            'featured', 'isPublic', 'recommend', 'response', 'createdAt', 'moderatedAt'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`reviews-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export failed',
        });
    }
};

// Archive review
exports.archiveReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { archived: true, archivedAt: new Date() },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({ success: true, message: 'Review archived', review });
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive review',
        });
    }
};

// Restore review
exports.restoreReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { archived: false, archivedAt: null },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({ success: true, message: 'Review restored', review });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore review',
        });
    }
};

// Helper function to calculate stats
async function calculateStats() {
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const rejectedReviews = await Review.countDocuments({ status: 'rejected' });

    const avgRatingResult = await Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const avgRating = avgRatingResult[0]?.avgRating || 0;

    return {
        totalReviews,
        approvedReviews,
        pendingReviews,
        rejectedReviews,
        avgRating
    };
}

// Email Templates
function getNewReviewEmailTemplate({ name, rating, comment, reviewId }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .stars { color: #fbbf24; font-size: 24px; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⭐ New Review Received</h1>
                </div>
                <div class="content">
                    <p><strong>New review from ${name}</strong></p>
                    <div class="stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                    <p><strong>Comment:</strong></p>
                    <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${comment}</p>
                    <p style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/dashboard/reviews?id=${reviewId}" class="button">
                            Review & Moderate
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getReviewConfirmationTemplate(name) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Thank You for Your Review!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <p>Thank you so much for taking the time to share your feedback! Your review means a lot to us.</p>
                    <p>Your review is currently being reviewed and will be published shortly.</p>
                    <p>We truly appreciate your support!</p>
                    <p>Best regards,<br>The Team</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getReviewApprovedTemplate({ name, comment, response }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .review-box { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Your Review is Live!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <p>Great news! Your review has been approved and is now published on our portfolio.</p>
                    <div class="review-box">
                        <p><strong>Your Review:</strong></p>
                        <p>${comment}</p>
                    </div>
                    ${response ? `
                    <div class="review-box">
                        <p><strong>Our Response:</strong></p>
                        <p>${response}</p>
                    </div>
                    ` : ''}
                    <p>Thank you for sharing your experience!</p>
                    <p>Best regards,<br>The Team</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getReviewResponseTemplate({ name, comment, response }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💬 Response to Your Review</h1>
                </div>
                <div class="content">
                    <p>Hi ${name},</p>
                    <p>Thank you for your review. We wanted to personally respond to your feedback:</p>
                    <div class="box">
                        <p><strong>Your Review:</strong></p>
                        <p>${comment}</p>
                    </div>
                    <div class="box">
                        <p><strong>Our Response:</strong></p>
                        <p>${response}</p>
                    </div>
                    <p>We appreciate your time and feedback!</p>
                    <p>Best regards,<br>The Team</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Like review
exports.likeReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Get client IP for simple tracking (in production, use user auth)
        const clientIp = req.ip || req.connection.remoteAddress;
        
        // Initialize likes array if it doesn't exist
        if (!review.likes) {
            review.likes = [];
        }

        // Check if already liked
        if (review.likes.includes(clientIp)) {
            return res.status(400).json({
                success: false,
                message: 'Review already liked'
            });
        }

        // Add like
        review.likes.push(clientIp);
        await review.save();

        res.json({
            success: true,
            message: 'Review liked successfully',
            likes: review.likes.length
        });
    } catch (error) {
        console.error('Like review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to like review',
        });
    }
};

// Unlike review
exports.unlikeReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Get client IP for simple tracking
        const clientIp = req.ip || req.connection.remoteAddress;
        
        // Check if liked
        if (!review.likes || !review.likes.includes(clientIp)) {
            return res.status(400).json({
                success: false,
                message: 'Review not liked yet'
            });
        }

        // Remove like
        review.likes = review.likes.filter(ip => ip !== clientIp);
        await review.save();

        res.json({
            success: true,
            message: 'Review unliked successfully',
            likes: review.likes.length
        });
    } catch (error) {
        console.error('Unlike review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlike review',
        });
    }
};