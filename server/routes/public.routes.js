// routes/public.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User.model');
const PortfolioConfig = require('../models/PortfolioConfig');
const CurriculumVitae = require('../models/CurriculumVitae');
const {
    getSkills,
    getProjects,
    getProfile,
    incrementProjectView,
    toggleProjectLike,
    refreshProjects
} = require('../controllers/public.controller');
const { getPublicTestimonials } = require('../controllers/public-testimonials.controller');
const { optionalAuth, auth, isOwner } = require('../middleware/auth.middleware');
const { getPublicEducation } = require('../controllers/education.controller');
const { getPublicInterests } = require('../controllers/interests.controller');

const interactionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// Public routes for portfolio data
router.get('/skills', getSkills);
router.get('/projects', getProjects);
router.get('/profile', getProfile);
router.get('/education', getPublicEducation);
router.get('/interests', getPublicInterests);
router.get('/testimonials', getPublicTestimonials);

// Public portfolio by username
router.get('/portfolio/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const portfolio = await PortfolioConfig.findOne({ userId: user._id });
        if (!portfolio) {
            return res.status(404).json({ success: false, message: 'Portfolio not found' });
        }
        res.json({ success: true, user: { name: user.name, username: user.username, avatar: user.avatar }, portfolio: portfolio.config });
    } catch (error) {
        console.error('Error fetching public portfolio:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Public CV by username.
// Phase 33: a CV the holder has not published is not readable by visitors, so
// a draft (or a half-written document) can never leak before it is ready.
// The owner of the record can still preview their own unpublished CV.
const fetchPublicCv = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('name username avatar role _id');
        if (!user) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        const cv = await CurriculumVitae.findOne({ userId: user._id });
        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        const viewerIsHolder = Boolean(req.user) && String(req.user._id) === String(user._id);
        if (!cv.isPublished && !viewerIsHolder) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }
        const document = cv.isPublished && cv.publishedSnapshot ? cv.publishedSnapshot : cv;
        res.json({
            success: true,
            user: { name: user.name, username: user.username, avatar: user.avatar },
            cv: document,
            meta: {
                published: Boolean(cv.isPublished),
                publishedAt: cv.publishedAt || null
            }
        });
    } catch (error) {
        console.error('Error fetching public CV:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

router.get('/cv/:username', optionalAuth, interactionLimiter, fetchPublicCv);
// Same document as JSON download for anyone who wants the raw copy.
router.get('/cv/:username/export.json', optionalAuth, interactionLimiter, fetchPublicCv);

// Project interactions (public, rate limited)
// Recomputes published-project counters. Only the dashboard triggers this, so
// it is owner-guarded: an unauthenticated POST that runs two database counts is
// needless surface, even though it writes nothing.
router.post('/projects/refresh', auth, isOwner, refreshProjects);
router.post('/projects/:id/view', interactionLimiter, incrementProjectView);
router.post('/projects/:id/like', interactionLimiter, toggleProjectLike);

module.exports = router;
