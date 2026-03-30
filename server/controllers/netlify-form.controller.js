// controllers/netlify-form.controller.js
const ContactForm = require('../models/ContactForm.model');
const asyncHandler = require('express-async-handler');

// @desc    Submit Netlify form
// @route   POST /api/netlify-form/submit
// @access  Public
exports.submitForm = asyncHandler(async (req, res) => {
    const { name, email, subject, message, phone, company, budget, serviceType } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, subject, and message are required'
        });
    }

    // Create form submission
    const formSubmission = await ContactForm.create({
        name,
        email,
        subject,
        message,
        phone,
        company,
        budget,
        serviceType,
        source: 'netlify-form',
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
    });

    // Emit socket event for real-time notification (if socket.io is available)
    if (req.app.get('io')) {
        req.app.get('io').emit('new_form_submission', {
            id: formSubmission._id,
            name: formSubmission.name,
            email: formSubmission.email,
            subject: formSubmission.subject,
            createdAt: formSubmission.createdAt
        });
    }

    // TODO: Send email notification to admin
    // await sendAdminNotification(formSubmission);

    res.status(201).json({
        success: true,
        message: 'Form submitted successfully! We will get back to you soon.',
        data: formSubmission
    });
});

// @desc    Get all form submissions (Admin only)
// @route   GET /api/netlify-form/submissions
// @access  Private/Admin
exports.getSubmissions = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        order = 'desc',
        unreadOnly = 'false'
    } = req.query;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (unreadOnly === 'true') filter.read = false;

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
        ];
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query
    const submissions = await ContactForm.find(filter)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('assignedTo', 'name email')
        .lean();

    const count = await ContactForm.countDocuments(filter);

    res.json({
        success: true,
        submissions,
        pagination: {
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }
    });
});

// @desc    Get single submission
// @route   GET /api/netlify-form/submissions/:id
// @access  Private/Admin
exports.getSubmission = asyncHandler(async (req, res) => {
    const submission = await ContactForm.findById(req.params.id)
        .populate('assignedTo', 'name email')
        .lean();

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    // Mark as read if not already
    if (!submission.read) {
        submission.read = true;
        await ContactForm.findByIdAndUpdate(req.params.id, { read: true });
    }

    res.json({
        success: true,
        submission
    });
});

// @desc    Update submission status
// @route   PATCH /api/netlify-form/submissions/:id/status
// @access  Private/Admin
exports.updateStatus = asyncHandler(async (req, res) => {
    const { status, priority, assignedTo } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const submission = await ContactForm.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    res.json({
        success: true,
        message: 'Submission updated successfully',
        submission
    });
});

// @desc    Add note to submission
// @route   POST /api/netlify-form/submissions/:id/notes
// @access  Private/Admin
exports.addNote = asyncHandler(async (req, res) => {
    const { text, addedBy } = req.body;

    if (!text || !addedBy) {
        return res.status(400).json({
            success: false,
            message: 'Text and addedBy are required'
        });
    }

    const submission = await ContactForm.findById(req.params.id);

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    submission.notes.push({
        text,
        addedBy,
        addedAt: new Date()
    });

    await submission.save();

    res.json({
        success: true,
        message: 'Note added successfully',
        submission
    });
});

// @desc    Toggle star status
// @route   PATCH /api/netlify-form/submissions/:id/star
// @access  Private/Admin
exports.toggleStar = asyncHandler(async (req, res) => {
    const submission = await ContactForm.findById(req.params.id);

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    submission.starred = !submission.starred;
    await submission.save();

    res.json({
        success: true,
        message: submission.starred ? 'Submission starred' : 'Submission unstarred',
        starred: submission.starred
    });
});

// @desc    Delete submission
// @route   DELETE /api/netlify-form/submissions/:id
// @access  Private/Admin
exports.deleteSubmission = asyncHandler(async (req, res) => {
    const submission = await ContactForm.findByIdAndDelete(req.params.id);

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    res.json({
        success: true,
        message: 'Submission deleted successfully'
    });
});

// @desc    Get form statistics
// @route   GET /api/netlify-form/statistics
// @access  Private/Admin
exports.getStatistics = asyncHandler(async (req, res) => {
    const stats = await ContactForm.getStatistics();

    // Get recent submissions
    const recentSubmissions = await ContactForm.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email subject status createdAt');

    // Get submissions by service type
    const byServiceType = await ContactForm.aggregate([
        {
            $group: {
                _id: '$serviceType',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    res.json({
        success: true,
        stats: {
            ...stats,
            recentSubmissions,
            byServiceType
        }
    });
});
