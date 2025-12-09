// routes/public.routes.js
const express = require('express');
const router = express.Router();
const {
    getSkills,
    getProjects,
    getProfile
} = require('../controllers/public.controller');
const { getPublicTestimonials } = require('../controllers/public-testimonials.controller');

// Public routes for portfolio data
router.get('/skills', getSkills);
router.get('/projects', getProjects);
router.get('/profile', getProfile);
router.get('/testimonials', getPublicTestimonials);

module.exports = router;
