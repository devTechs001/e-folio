// controllers/reviews.controller.js
const Review = require('../models/Review.model');
const User = require('../models/User.model');
const ActivityLog = require('../models/ActivityLog');
// const { sendEmail } = require('../utils/email'); // TODO: Create util
const { Parser } = require('json2csv');

// Create review (Public)
exports.createReview = async (req, res) => {
    try {
        const {
            name,
            email,
            rating,
            comment,
            title,
            categories,
            projectId,
            recommend
        } = req.body;

        // Validation
        if (!name || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Name, rating, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (comment.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 10 characters'
            });
        }

        // Check for duplicate review from same email
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

        // Create review
        const review = await Review.create({
            name,
            email,
            rating,
            comment,
            title,
            categories: categories || {},
            projectId,
            recommend: recommend !== undefined ? recommend : true,
            status: 'pending',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Notify owner
        const owner = await User.findOne({ role: 'owner' });
        if (owner) {
            await sendEmail({
                to: owner.email,
                subject: 'New Review Received',
                html: getNewReviewEmailTemplate({
                    name,
                    rating,
                    comment,
                    reviewId: review._id
                })
            });

            // Socket notification
            if (req.app.get('io')) {
                req.app.get('io').to(`user_${owner._id}`).emit('new_review', {
                    id: review._id,
                    name,
                    rating,
                    comment,
                    createdAt: review.createdAt
                });
            }
        }

        // Send confirmation to reviewer
        if (email) {
            await sendEmail({
                to: email,
                subject: 'Thank You for Your Review',
                html: getReviewConfirmationTemplate(name)
            });
        }

        // Log activity
        await ActivityLog.create({
            action: 'review_submitted',
            details: `New review from ${name} with ${rating} stars`,
            metadata: {
                reviewId: review._id,
                rating,
                email
            }
        });

        res.json({
            success: true,
            message: 'Review submitted successfully! It will be published after moderation.',
            review: {
                id: review._id,
                status: review.status
            }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

// Get reviews with filtering (Owner only)
exports.getReviews = async (req, res) => {
    try {
        const {
            status = 'all',
            search,
            rating,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
            startDate,
            endDate
        } = req.query;

        let query = {};

        // Status filter
        if (status !== 'all') {
            query.status = status;
        }

        // Rating filter
        if (rating && rating !== 'all') {
            query.rating = parseInt(rating);
        }

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { comment: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const reviews = await Review.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments(query);

        // Calculate stats
        const stats = await calculateStats();

        res.json({
            success: true,
            reviews,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
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
            error: error.message
        });
    }
};

// Get public reviews (for portfolio display)
exports.getPublicReviews = async (req, res) => {
    try {
        const { limit = 6, sortBy = 'createdAt', featured = false } = req.query;

        let query = {
            status: 'approved',
            isPublic: true
        };

        if (featured === 'true') {
            query.featured = true;
        }

        const reviews = await Review.find(query)
            .select('name rating comment title categories createdAt featured')
            .sort({ [sortBy]: -1 })
            .limit(parseInt(limit));

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
            error: error.message
        });
    }
};

// Get featured reviews
exports.getFeaturedReviews = async (req, res) => {
    try {
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
        console.error('Get featured reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
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

        // Send notification to reviewer
        if (review.email && status === 'approved') {
            await sendEmail({
                to: review.email,
                subject: 'Your Review Has Been Approved',
                html: getReviewApprovedTemplate({
                    name: review.name,
                    comment: review.comment,
                    response
                })
            });
        }

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'review_moderated',
            details: `Review from ${review.name} ${status}`,
            metadata: {
                reviewId: review._id,
                status
            }
        });

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
            error: error.message
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
            await sendEmail({
                to: review.email,
                subject: 'Response to Your Review',
                html: getReviewResponseTemplate({
                    name: review.name,
                    comment: review.comment,
                    response
                })
            });
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
            error: error.message
        });
    }
};

// Bulk moderate reviews
exports.bulkModerateReviews = async (req, res) => {
    try {
        const { reviewIds, status } = req.body;

        await Review.updateMany(
            { _id: { $in: reviewIds } },
            {
                status,
                moderatedBy: req.user.id,
                moderatedAt: new Date()
            }
        );

        res.json({
            success: true,
            message: `${reviewIds.length} reviews ${status}`
        });
    } catch (error) {
        console.error('Bulk moderate error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk moderation failed',
            error: error.message
        });
    }
};

// Bulk delete reviews
exports.bulkDeleteReviews = async (req, res) => {
    try {
        const { reviewIds } = req.body;

        await Review.deleteMany({ _id: { $in: reviewIds } });

        res.json({
            success: true,
            message: `${reviewIds.length} reviews deleted`
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk deletion failed',
            error: error.message
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
            error: error.message
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
            error: error.message
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
            error: error.message
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

        await review.remove();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'review_deleted',
            details: `Deleted review from ${review.name}`,
            metadata: { reviewId: req.params.id }
        });

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
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
            error: error.message
        });
    }
};

// Get review analytics
exports.getReviewAnalytics = async (req, res) => {
    try {
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
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
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
            error: error.message
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
            error: error.message
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
            error: error.message
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
            error: error.message
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