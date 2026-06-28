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

// @desc    Get all education entries (public)
// @route   GET /api/public/education
// @access  Public
exports.getPublicEducation = asyncHandler(async (req, res) => {
    const education = await Education.find({}).sort({ startDate: -1 });

    const formatted = education.map((e, i) => ({
        id: e._id,
        icon: getEducationIcon(e),
        period: formatEducationPeriod(e),
        degree: e.degree,
        level: e.degree,
        institution: e.institution,
        location: e.location || '',
        description: e.description || '',
        category: getEducationCategory(e),
        grade: e.grade || '',
        skills: [],
        color: getEducationColor(i)
    }));

    res.json({
        success: true,
        count: formatted.length,
        data: formatted,
        education: formatted
    });
});

function getEducationIcon(entry) {
    if (!entry) return 'fas fa-graduation-cap';
    const degree = (entry.degree || '').toLowerCase();
    if (degree.includes('diploma') || degree.includes('computer')) return 'fas fa-graduation-cap';
    if (degree.includes('ict') || degree.includes('essentials')) return 'fas fa-laptop-code';
    if (degree.includes('digital') || degree.includes('google')) return 'fas fa-certificate';
    if (degree.includes('web') || degree.includes('development')) return 'fas fa-laptop-code';
    if (degree.includes('python')) return 'fas fa-code';
    return 'fas fa-school';
}

function formatEducationPeriod(entry) {
    const startYear = entry.startDate ? new Date(entry.startDate).getFullYear() : '';
    if (entry.currentlyStudying || !entry.endDate) {
        return `${startYear} - Present`;
    }
    const endYear = entry.endDate ? new Date(entry.endDate).getFullYear() : '';
    const startStr = entry.startDate ? new Date(entry.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const endStr = entry.endDate ? new Date(entry.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    return `${startStr} - ${endStr}`;
}

function getEducationCategory(entry) {
    if (!entry) return 'academic';
    const desc = ((entry.description || '') + ' ' + (entry.degree || '') + ' ' + (entry.fieldOfStudy || '')).toLowerCase();
    if (desc.includes('certif') || desc.includes('google') || desc.includes('coursera') || desc.includes('freecodecamp')) return 'certification';
    if (desc.includes('ict') || desc.includes('digital market')) return 'professional';
    return 'academic';
}

function getEducationColor(index) {
    const colors = ['blue', 'green', 'purple', 'cyan', 'yellow', 'orange'];
    return colors[index % colors.length];
}

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