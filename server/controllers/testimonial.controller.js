const Testimonial = require('../models/Testimonial.model');
const asyncHandler = require('../middleware/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const { Parser } = require('json2csv');
const emailService = require('../services/email.service');

// =============================================
// PUBLIC CONTROLLERS
// =============================================

/**
 * @desc    Get all visible testimonials
 * @route   GET /api/public/testimonials
 * @access  Public
 */
exports.getPublicTestimonials = asyncHandler(async (req, res, next) => {
    const { 
        page = 1, 
        limit = 10, 
        sort = '-date',
        rating,
        featured
    } = req.query;

    const query = { visible: true };

    if (rating) {
        query.rating = parseInt(rating);
    }

    if (featured === 'true') {
        query.featured = true;
    }

    const testimonials = await Testimonial.find(query)
        .select('-ipAddress -userAgent -__v')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Testimonial.countDocuments(query);

    res.status(200).json({
        success: true,
        count: testimonials.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        testimonials
    });
});

/**
 * @desc    Get featured testimonials
 * @route   GET /api/public/testimonials/featured
 * @access  Public
 */
exports.getFeaturedTestimonials = asyncHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find({ 
        visible: true, 
        featured: true 
    })
        .select('-ipAddress -userAgent -__v')
        .sort({ displayOrder: 1, date: -1 })
        .limit(10);

    res.status(200).json({
        success: true,
        count: testimonials.length,
        testimonials
    });
});

/**
 * @desc    Get public statistics
 * @route   GET /api/public/testimonials/stats
 * @access  Public
 */
exports.getPublicStats = asyncHandler(async (req, res, next) => {
    const stats = await Testimonial.aggregate([
        { $match: { visible: true } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                featured: {
                    $sum: { $cond: ['$featured', 1, 0] }
                }
            }
        }
    ]);

    const ratingDistribution = await Testimonial.aggregate([
        { $match: { visible: true } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
        success: true,
        stats: {
            total: stats[0]?.total || 0,
            averageRating: stats[0]?.averageRating?.toFixed(1) || 0,
            featured: stats[0]?.featured || 0,
            ratingDistribution
        }
    });
});

/**
 * @desc    Submit testimonial (public form)
 * @route   POST /api/public/testimonials/submit
 * @access  Public
 */
exports.submitTestimonial = asyncHandler(async (req, res, next) => {
    req.body.source = 'form';
    req.body.ipAddress = req.ip;
    req.body.userAgent = req.headers['user-agent'];
    req.body.visible = false;
    req.body.verified = false;

    const testimonial = await Testimonial.create(req.body);

    // Send email notification about new testimonial submission
    try {
        const emailData = {
            name: testimonial.name,
            position: testimonial.position,
            company: testimonial.company,
            rating: testimonial.rating,
            content: testimonial.content,
            email: testimonial.email,
            website: testimonial.website,
            linkedin: testimonial.linkedin,
            project: testimonial.project,
            tags: testimonial.tags?.join(', ') || 'N/A',
            date: new Date().toLocaleString(),
            year: new Date().getFullYear()
        };

        // Send notification to portfolio owner/admin
        await emailService.send({
            to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@yourportfolio.com',
            subject: '🚀 New Testimonial Received',
            template: 'new-testimonial',
            data: emailData
        });
    } catch (emailError) {
        // If email fails, log the error but don't fail the testimonial submission
        console.error('Failed to send testimonial notification email:', emailError);
    }

    res.status(201).json({
        success: true,
        message: 'Thank you! Your testimonial has been submitted and is pending approval.',
        testimonial: {
            _id: testimonial._id,
            name: testimonial.name
        }
    });
});

/**
 * @desc    Mark testimonial as helpful
 * @route   POST /api/public/testimonials/:id/helpful
 * @access  Public
 */
exports.markHelpful = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    testimonial.helpfulCount += 1;
    await testimonial.save();

    res.status(200).json({
        success: true,
        helpfulCount: testimonial.helpfulCount
    });
});

// =============================================
// ADMIN CONTROLLERS
// =============================================

/**
 * @desc    Get all testimonials (admin)
 * @route   GET /api/testimonials
 * @access  Private/Admin
 */
exports.getAllTestimonials = asyncHandler(async (req, res, next) => {
    const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        search,
        visible,
        featured,
        verified,
        rating
    } = req.query;

    let query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { position: { $regex: search, $options: 'i' } }
        ];
    }

    if (visible !== undefined) {
        query.visible = visible === 'true';
    }

    if (featured !== undefined) {
        query.featured = featured === 'true';
    }

    if (verified !== undefined) {
        query.verified = verified === 'true';
    }

    if (rating) {
        query.rating = parseInt(rating);
    }

    const testimonials = await Testimonial.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Testimonial.countDocuments(query);

    res.status(200).json({
        success: true,
        count: testimonials.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        testimonials
    });
});

/**
 * @desc    Get detailed statistics
 * @route   GET /api/testimonials/stats
 * @access  Private/Admin
 */
exports.getDetailedStats = asyncHandler(async (req, res, next) => {
    const stats = await Testimonial.getStatistics();

    res.status(200).json({
        success: true,
        stats
    });
});

/**
 * @desc    Get single testimonial
 * @route   GET /api/testimonials/:id
 * @access  Private/Admin
 */
exports.getTestimonialById = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    res.status(200).json({
        success: true,
        testimonial
    });
});

/**
 * @desc    Create new testimonial
 * @route   POST /api/testimonials
 * @access  Private/Admin
 */
exports.createTestimonial = asyncHandler(async (req, res, next) => {
    req.body.source = 'manual';

    const testimonial = await Testimonial.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Testimonial created successfully',
        testimonial
    });
});

/**
 * @desc    Update testimonial
 * @route   PUT /api/testimonials/:id
 * @access  Private/Admin
 */
exports.updateTestimonial = asyncHandler(async (req, res, next) => {
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    testimonial = await Testimonial.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'Testimonial updated successfully',
        testimonial
    });
});

/**
 * @desc    Delete testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Private/Admin
 */
exports.deleteTestimonial = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    await testimonial.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Testimonial deleted successfully',
        data: {}
    });
});

/**
 * @desc    Toggle visibility
 * @route   PATCH /api/testimonials/:id/toggle-visibility
 * @access  Private/Admin
 */
exports.toggleVisibility = asyncHandler(async (req, res, next) => {
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    const wasVisible = testimonial.visible;
    testimonial.visible = !testimonial.visible;
    await testimonial.save();

    // Send notification to submitter if testimonial is now visible (approved)
    if (testimonial.visible && !wasVisible && testimonial.email) {
        try {
            await emailService.send({
                to: testimonial.email,
                subject: '🎉 Your Testimonial Has Been Approved!',
                template: 'testimonial-approved',
                data: {
                    name: testimonial.name,
                    content: testimonial.content,
                    rating: testimonial.rating,
                    portfolioUrl: process.env.CLIENT_URL || 'https://yourportfolio.com',
                    year: new Date().getFullYear()
                }
            });
        } catch (emailError) {
            console.error('Failed to send testimonial approval email:', emailError);
        }
    }

    res.status(200).json({
        success: true,
        message: `Testimonial ${testimonial.visible ? 'shown' : 'hidden'} successfully`,
        testimonial
    });
});

/**
 * @desc    Toggle featured status
 * @route   PATCH /api/testimonials/:id/toggle-featured
 * @access  Private/Admin
 */
exports.toggleFeatured = asyncHandler(async (req, res, next) => {
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    testimonial.featured = !testimonial.featured;
    await testimonial.save();

    res.status(200).json({
        success: true,
        message: `Testimonial ${testimonial.featured ? 'featured' : 'unfeatured'} successfully`,
        testimonial
    });
});

/**
 * @desc    Toggle verified status
 * @route   PATCH /api/testimonials/:id/toggle-verified
 * @access  Private/Admin
 */
exports.toggleVerified = asyncHandler(async (req, res, next) => {
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    testimonial.verified = !testimonial.verified;
    await testimonial.save();

    res.status(200).json({
        success: true,
        message: `Testimonial ${testimonial.verified ? 'verified' : 'unverified'} successfully`,
        testimonial
    });
});

/**
 * @desc    Update display order
 * @route   PATCH /api/testimonials/:id/reorder
 * @access  Private/Admin
 */
exports.updateDisplayOrder = asyncHandler(async (req, res, next) => {
    const { displayOrder } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(
        req.params.id,
        { displayOrder },
        { new: true }
    );

    if (!testimonial) {
        return next(new ErrorResponse('Testimonial not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Display order updated successfully',
        testimonial
    });
});

/**
 * @desc    Bulk delete testimonials
 * @route   POST /api/testimonials/bulk-delete
 * @access  Private/Admin
 */
exports.bulkDelete = asyncHandler(async (req, res, next) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorResponse('Please provide an array of testimonial IDs', 400));
    }

    const result = await Testimonial.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        success: true,
        message: `${result.deletedCount} testimonial(s) deleted successfully`,
        deletedCount: result.deletedCount
    });
});

/**
 * @desc    Bulk update testimonials
 * @route   POST /api/testimonials/bulk-update
 * @access  Private/Admin
 */
exports.bulkUpdate = asyncHandler(async (req, res, next) => {
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorResponse('Please provide an array of testimonial IDs', 400));
    }

    if (!updates || typeof updates !== 'object') {
        return next(new ErrorResponse('Please provide valid updates', 400));
    }

    const result = await Testimonial.updateMany(
        { _id: { $in: ids } },
        { $set: updates }
    );

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} testimonial(s) updated successfully`,
        modifiedCount: result.modifiedCount
    });
});

/**
 * @desc    Export testimonials as JSON
 * @route   GET /api/testimonials/export/json
 * @access  Private/Admin
 */
exports.exportAsJSON = asyncHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find()
        .select('-__v')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: testimonials.length,
        data: testimonials,
        exportedAt: new Date().toISOString()
    });
});

/**
 * @desc    Export testimonials as CSV
 * @route   GET /api/testimonials/export/csv
 * @access  Private/Admin
 */
exports.exportAsCSV = asyncHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find()
        .select('-__v')
        .sort('-createdAt')
        .lean();

    const fields = [
        'name',
        'position',
        'company',
        'email',
        'rating',
        'content',
        'featured',
        'visible',
        'verified',
        'date',
        'createdAt'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(testimonials);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=testimonials.csv');
    res.status(200).send(csv);
});