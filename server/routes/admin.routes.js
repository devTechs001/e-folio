const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const Education = require('../models/Education');
const Interests = require('../models/Interests');
const { auth, isOwner } = require('../middleware/auth.middleware');

router.use(auth);
router.use(isOwner);

// List all users with activity data
router.get('/users', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const search = req.query.search || '';
        const status = req.query.status || '';

        const filter = { role: 'user' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        if (status === 'active') filter.isActive = true;
        if (status === 'suspended') filter.isActive = false;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('name username email avatar role isActive isPremium lastLoginAt loginCount createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: { users, total, page, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Suspend/activate user
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive, status: isActive ? 'active' : 'suspended' },
            { new: true }
        ).select('name email username isActive status');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// App settings (maintenance mode toggle)
router.get('/settings', async (req, res) => {
    try {
        const AppSettings = require('../models/AppSettings');
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = await AppSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

router.patch('/settings', async (req, res) => {
    try {
        const AppSettings = require('../models/AppSettings');
        const { maintenanceMode, allowRegistration, maintenanceMessage } = req.body;
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = new AppSettings();
        }
        const prevMaintenance = settings.maintenanceMode;
        if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;
        if (typeof allowRegistration === 'boolean') settings.allowRegistration = allowRegistration;
        if (maintenanceMessage) settings.maintenanceMessage = maintenanceMessage;
        settings.updatedBy = req.user._id;
        settings.updatedAt = new Date();
        await settings.save();

        // Notify all connected users about settings change
        if (global.io) {
            global.io.emit('settings:updated', settings.toObject());

            if (typeof maintenanceMode === 'boolean' && maintenanceMode !== prevMaintenance) {
                const notification = {
                    type: 'system_alert',
                    title: '🔧 Maintenance Update',
                    message: maintenanceMode
                        ? '🛠️ The system is entering maintenance mode. Some features may be temporarily unavailable.'
                        : '✅ Maintenance mode has been disabled. All features are back to normal.',
                    severity: maintenanceMode ? 'warning' : 'success',
                    timestamp: new Date()
                };
                global.io.emit('notification', notification);
            }
        }

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// Online users (active in last 15 min)
router.get('/users/online', async (req, res) => {
    try {
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        const onlineUsers = await User.find({
            lastLoginAt: { $gte: fifteenMinAgo },
            isActive: true
        }).select('name username email avatar lastLoginAt role');
        res.json({ success: true, data: onlineUsers });
    } catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch online users' });
    }
});

// Registration analytics
router.get('/analytics/registrations', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const registrations = await User.aggregate([
            { $match: { createdAt: { $gte: since }, role: 'user' } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const today = new Date();
        const dateMap = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - (days - 1 - i));
            const key = d.toISOString().split('T')[0];
            dateMap[key] = 0;
        }
        registrations.forEach(r => { dateMap[r._id] = (dateMap[r._id] || 0) + r.count; });

        const totalUsers = await User.countDocuments({ role: 'user' });
        const lastWeek = await User.countDocuments({ role: 'user', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

        // Active sessions via tracking
        let activeSessions = 0;
        let todayPageViews = 0;
        try {
            const TrackingSession = require('../models/TrackingSession');
            activeSessions = await TrackingSession.countDocuments({
                isActive: true,
                lastActivity: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
            });
            todayPageViews = await TrackingSession.countDocuments({
                lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
        } catch (e) { /* tracking not available */ }

        res.json({
            success: true,
            data: {
                totalUsers,
                lastWeek,
                activeSessions,
                todayPageViews,
                dailyData: Object.entries(dateMap).map(([date, count]) => ({ date, count }))
            }
        });
    } catch (error) {
        console.error('Error fetching registration analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
});

// System health
router.get('/health', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const os = require('os');

        const dbState = mongoose.connection.readyState;
        const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        let trackingCount = 0;
        try {
            const TrackingSession = require('../models/TrackingSession');
            trackingCount = await TrackingSession.countDocuments({ isActive: true, lastActivity: { $gte: new Date(Date.now() - 30 * 60 * 1000) } });
        } catch (e) { /* ignore */ }

        res.json({
            success: true,
            data: {
                database: dbStatus[dbState] || 'unknown',
                uptime: process.uptime(),
                memory: { free: os.freemem(), total: os.totalmem(), usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) },
                cpu: os.cpus().length,
                platform: os.platform(),
                nodeVersion: process.version,
                activeTrackingSessions: trackingCount,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch system health' });
    }
});

// Recent activity log
router.get('/activity', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

        // Get recent user registrations and logins
        const registrations = await User.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('name username email createdAt lastLoginAt isActive');

        const activity = registrations.map(u => {
            const activities = [];
            activities.push({
                type: 'registered',
                user: { name: u.name, username: u.username, email: u.email },
                timestamp: u.createdAt,
                detail: 'Created an account'
            });
            if (u.lastLoginAt && u.lastLoginAt > u.createdAt) {
                activities.push({
                    type: 'login',
                    user: { name: u.name, username: u.username },
                    timestamp: u.lastLoginAt,
                    detail: 'Logged in'
                });
            }
            return activities;
        }).flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

        res.json({ success: true, data: activity });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity' });
    }
});

// Seed education and interests data
const educationData = [
  { institution: 'Bungoma National Polytechnic', degree: 'Diploma in Computer Science', fieldOfStudy: 'Computer Science', startDate: new Date('2023-09-01'), endDate: null, currentlyStudying: true, description: 'Specializing in software development, web technologies, and computer systems.', grade: 'Ongoing', location: 'Bungoma, Kenya' },
  { institution: 'Ayes Consults Ltd.', degree: 'ICT Essentials', fieldOfStudy: 'Information Technology', startDate: new Date('2023-03-01'), endDate: new Date('2023-07-01'), description: 'Comprehensive training in Microsoft Office Suite, computer maintenance, and essential IT skills.', grade: 'Distinction', location: 'Nairobi, Kenya' },
  { institution: 'Google Africa', degree: 'Digital Skills Training', fieldOfStudy: 'Digital Marketing', startDate: new Date('2023-01-01'), endDate: new Date('2023-03-01'), description: 'Mastered digital marketing, online presence management, and web analytics.', grade: 'Certified', location: 'Online' },
  { institution: 'FreeCodeCamp', degree: 'Certificate in Web Development', fieldOfStudy: 'Web Development', startDate: new Date('2022-01-01'), endDate: new Date('2023-01-01'), description: 'Full-stack web development covering HTML5, CSS3, JavaScript, React, and Node.js.', grade: 'Certified', location: 'Online' },
  { institution: 'Coursera', degree: 'Python Programming Certification', fieldOfStudy: 'Computer Science', startDate: new Date('2022-01-01'), endDate: new Date('2022-12-01'), description: 'Advanced Python programming concepts including data structures and algorithms.', grade: 'Certified', location: 'Online' },
  { institution: 'Musingu High School', degree: 'Secondary Education', fieldOfStudy: 'General Education', startDate: new Date('2019-01-01'), endDate: new Date('2022-11-01'), description: 'Completed secondary education with excellent grades in Mathematics, Physics, and Computer Studies.', grade: 'B+ (Plus)', location: 'Kakamega, Kenya' }
];

const interestsData = [
  { name: 'Programming', category: 'technical', level: 'expert', description: 'Passionate about solving complex problems through code.', icon: 'fas fa-code', color: 'blue' },
  { name: 'Web Design', category: 'creative', level: 'expert', description: 'Creating visually appealing and user-friendly interfaces.', icon: 'fas fa-palette', color: 'purple' },
  { name: 'Mobile Development', category: 'technical', level: 'advanced', description: 'Exploring mobile applications and responsive solutions.', icon: 'fas fa-mobile-alt', color: 'cyan' },
  { name: 'AI & Machine Learning', category: 'technical', level: 'advanced', description: 'Fascinated by AI applications in solving real-world problems.', icon: 'fas fa-robot', color: 'green' },
  { name: 'Blockchain Technology', category: 'technical', level: 'advanced', description: 'Interested in decentralized systems.', icon: 'fas fa-link', color: 'orange' },
  { name: 'Continuous Learning', category: 'personal', level: 'expert', description: 'Committed to staying updated with latest technologies.', icon: 'fas fa-book-reader', color: 'indigo' },
  { name: 'Community Building', category: 'social', level: 'advanced', description: 'Enjoy participating in tech communities.', icon: 'fas fa-users', color: 'pink' },
  { name: 'Innovation', category: 'creative', level: 'expert', description: 'Passionate about creating new solutions.', icon: 'fas fa-lightbulb', color: 'yellow' },
  { name: 'Game Development', category: 'creative', level: 'advanced', description: 'Creating interactive experiences through code.', icon: 'fas fa-gamepad', color: 'red' },
  { name: 'Cloud Computing', category: 'technical', level: 'advanced', description: 'Building scalable cloud-based solutions.', icon: 'fas fa-cloud', color: 'teal' },
  { name: 'Cybersecurity', category: 'technical', level: 'advanced', description: 'Ensuring digital safety in application development.', icon: 'fas fa-shield-alt', color: 'gray' },
  { name: 'Content Creation', category: 'social', level: 'advanced', description: 'Sharing knowledge through tutorials and blogs.', icon: 'fas fa-video', color: 'rose' }
];

router.post('/seed/education-interests', async (req, res) => {
  try {
    const user = await User.findOne({ role: 'owner' }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'No owner user found' });
    const userId = user._id;
    await Education.deleteMany({});
    const eduWithUser = educationData.map(e => ({ ...e, userId }));
    await Education.insertMany(eduWithUser);
    await Interests.deleteMany({});
    const intWithUser = interestsData.map(i => ({ ...i, userId }));
    await Interests.insertMany(intWithUser);
    res.json({ success: true, message: `Seeded ${educationData.length} education, ${interestsData.length} interests` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
