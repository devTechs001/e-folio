const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');

// Make dashboard routes public for development (comment out for production)
// router.use(auth);

// Dashboard stats
router.get('/stats', async (req, res) => {
    res.json({
        success: true,
        data: {
            totalProjects: 12,
            totalVisitors: 1543,
            collaborators: 5,
            messages: 23,
            growth: {
                projects: 15.3,
                visitors: 23.5,
                collaborators: 8.2,
                messages: 12.1
            }
        }
    });
});

// Recent projects
router.get('/projects/recent', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    res.json({
        success: true,
        data: []
    });
});

// Performance data
router.get('/performance', async (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// Quick stats
router.get('/quick-stats', async (req, res) => {
    res.json({
        success: true,
        data: {}
    });
});

// Upcoming events
router.get('/events/upcoming', async (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// Tasks
router.get('/tasks', async (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// Notifications
router.get('/notifications', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json({
        success: true,
        data: []
    });
});

// Top skills
router.get('/skills/top', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    res.json({
        success: true,
        data: []
    });
});

// Device stats
router.get('/devices', async (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

module.exports = router;
