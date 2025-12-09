// controllers/public-testimonials.controller.js
const Testimonial = require('../models/Testimonial.model');
const asyncHandler = require('express-async-handler');

// @desc    Get visible testimonials for public display
// @route   GET /api/public/testimonials
// @access  Public
exports.getPublicTestimonials = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, featured } = req.query;
    
    // Build filter for public testimonials
    const filter = { visible: true };
    
    if (featured === 'true') {
        filter.featured = true;
    }

    const testimonials = await Testimonial.find(filter)
        .select('name position company avatar rating content featured date email website linkedin')
        .sort({ featured: -1, order: 1, date: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

    const total = await Testimonial.countDocuments(filter);

    res.json({
        success: true,
        testimonials,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
            totalVisible: await Testimonial.countDocuments({ visible: true }),
            totalFeatured: await Testimonial.countDocuments({ visible: true, featured: true }),
            averageRating: await Testimonial.aggregate([
                { $match: { visible: true } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]).then(result => result[0]?.avgRating || 0)
        }
    });
});
