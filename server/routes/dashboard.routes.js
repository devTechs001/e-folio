const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const DashboardService = require('../services/DashboardService');
const dashboardService = new DashboardService();

// Make dashboard routes public for development (comment out for production)
// router.use(auth);

// Dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1'; // Fallback user ID for development
        const stats = await dashboardService.getStats(userId);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats'
        });
    }
});

// Recent projects
router.get('/projects/recent', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const limit = parseInt(req.query.limit) || 5;
        const projects = await dashboardService.getRecentProjects(userId, limit);
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Error fetching recent projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent projects'
        });
    }
});

// Performance data
router.get('/performance', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const days = parseInt(req.query.days) || 7;
        const performance = await dashboardService.getPerformanceData(userId, days);
        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        console.error('Error fetching performance data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance data'
        });
    }
});

// Quick stats
router.get('/quick-stats', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const stats = await dashboardService.getStats(userId);
        res.json({
            success: true,
            data: {
                totalProjects: stats.totalProjects,
                totalVisitors: stats.totalVisitors,
                collaborators: stats.collaborators,
                messages: stats.messages
            }
        });
    } catch (error) {
        console.error('Error fetching quick stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quick stats'
        });
    }
});

// Upcoming events
router.get('/events/upcoming', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const limit = parseInt(req.query.limit) || 5;
        const events = await dashboardService.getUpcomingEvents(userId, limit);
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming events'
        });
    }
});

// Tasks
router.get('/tasks', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.limit) filters.limit = parseInt(req.query.limit);
        
        const tasks = await dashboardService.getTasks(userId, filters);
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
});

// Notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const limit = parseInt(req.query.limit) || 10;
        const notifications = await dashboardService.getNotifications(userId, limit);
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Top skills
router.get('/skills/top', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const limit = parseInt(req.query.limit) || 5;
        const skills = await dashboardService.getTopSkills(userId, limit);
        res.json({
            success: true,
            data: skills
        });
    } catch (error) {
        console.error('Error fetching top skills:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top skills'
        });
    }
});

// Device stats
router.get('/devices', async (req, res) => {
    try {
        const userId = req.user?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
        const deviceStats = await dashboardService.getDeviceStats(userId);
        res.json({
            success: true,
            data: deviceStats
        });
    } catch (error) {
        console.error('Error fetching device stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch device stats'
        });
    }
});

module.exports = router;
