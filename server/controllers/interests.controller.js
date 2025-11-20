// controllers/interestsController.js
const Interests = require('../models/Interests'); // or Interest, depending on your model
const asyncHandler = require('express-async-handler');

// @desc    Get all interests
// @route   GET /api/interests
// @access  Private (Owner only)
exports.getInterests = asyncHandler(async (req, res) => {
    const interests = await Interests.find({}).sort({ name: 1 });

    res.json({
        success: true,
        count: interests.length,
        data: interests
    });
});

// @desc    Add interest
// @route   POST /api/interests
// @access  Private (Owner only)
exports.addInterest = asyncHandler(async (req, res) => {
    const interest = await Interests.create(req.body);

    res.status(201).json({
        success: true,
        data: interest
    });
});

// @desc    Update interest
// @route   PUT /api/interests/:id
// @access  Private (Owner only)
exports.updateInterest = asyncHandler(async (req, res) => {
    let interest = await Interests.findById(req.params.id);

    if (!interest) {
        res.status(404);
        throw new Error('Interest not found');
    }

    interest = await Interests.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: interest
    });
});

// @desc    Delete interest
// @route   DELETE /api/interests/:id
// @access  Private (Owner only)
exports.deleteInterest = asyncHandler(async (req, res) => {
    const interest = await Interests.findById(req.params.id);

    if (!interest) {
        res.status(404);
        throw new Error('Interest not found');
    }

    await interest.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});