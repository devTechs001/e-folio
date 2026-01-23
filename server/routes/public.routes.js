// routes/public.routes.js
const express = require('express');
const router = express.Router();
const {
    getSkills,
    getProjects,
    getProfile,
    incrementProjectView,
    toggleProjectLike
} = require('../controllers/public.controller');
const { getPublicTestimonials } = require('../controllers/public-testimonials.controller');

// Public routes for portfolio data
router.get('/skills', getSkills);
router.get('/projects', getProjects);
router.get('/profile', getProfile);
router.get('/testimonials', getPublicTestimonials);

// Project interactions (public)
router.post('/projects/:id/view', incrementProjectView);
router.post('/projects/:id/like', toggleProjectLike);

module.exports = router;
