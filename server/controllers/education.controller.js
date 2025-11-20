// controllers/educationController.js
const Education = require('../models/Education');
const asyncHandler = require('express-async-handler');

// @desc    Get all education entries
// @route   GET /api/education
// @access  Private (Owner only)
exports.getEducation = asyncHandler(async (req, res) => {
    const education = await Education.find({}).sort({ startDate: -1 });

    res.json({
        success: true,
        count: education.length,
        data: education
    });
});

// @desc    Add education entry
// @route   POST /api/education
// @access  Private (Owner only)
exports.addEducation = asyncHandler(async (req, res) => {
    const education = await Education.create(req.body);

    res.status(201).json({
        success: true,
        data: education
    });
});

// @desc    Update education entry
// @route   PUT /api/education/:id
// @access  Private (Owner only)
exports.updateEducation = asyncHandler(async (req, res) => {
    let education = await Education.findById(req.params.id);

    if (!education) {
        res.status(404);
        throw new Error('Education entry not found');
    }

    education = await Education.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: education
    });
});

// @desc    Delete education entry
// @route   DELETE /api/education/:id
// @access  Private (Owner only)
exports.deleteEducation = asyncHandler(async (req, res) => {
    const education = await Education.findById(req.params.id);

    if (!education) {
        res.status(404);
        throw new Error('Education entry not found');
    }

    await education.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});