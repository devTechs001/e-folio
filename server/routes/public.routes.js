// routes/public.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getSkills,
    getProjects,
    getProfile,
    incrementProjectView,
    toggleProjectLike
} = require('../controllers/public.controller');
const { getPublicTestimonials } = require('../controllers/public-testimonials.controller');
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

// Project interactions (public, rate limited)
router.post('/projects/:id/view', interactionLimiter, incrementProjectView);
router.post('/projects/:id/like', interactionLimiter, toggleProjectLike);

module.exports = router;
