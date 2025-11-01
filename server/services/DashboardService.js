// server/services/dashboardService.js
const DashboardStats = require('../models/DashboardStats');
const Activity = require('../models/Activity');
const PerformanceMetric = require('../models/PerformanceMetric');
const Event = require('../models/Event');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const DeviceStat = require('../models/DeviceStat');
const Project = require('../models/Project.model');
const { startOfDay, endOfDay, subDays, format } = require('date-fns');

class DashboardService {
    constructor(websocket) {
        this.websocket = websocket;
    }

    // Get or create dashboard stats
    async getStats(userId) {
        let stats = await DashboardStats.findOne({ userId });
        
        if (!stats) {
            stats = await DashboardStats.create({
                userId,
                totalProjects: 0,
                totalVisitors: 0,
                collaborators: 0,
                messages: 0
            });
        }

        return stats;
    }

    // Update stats and emit real-time update
    async updateStats(userId, updates) {
        const stats = await this.getStats(userId);
        await stats.updateStats(updates);

        // Emit real-time update
        if (this.websocket) {
            this.websocket.emitStatsUpdate(userId, stats);
        }

        return stats;
    }

    // Increment specific stat
    async incrementStat(userId, statName, amount = 1) {
        const stats = await this.getStats(userId);
        stats[statName] = (stats[statName] || 0) + amount;
        await stats.save();

        if (this.websocket) {
            this.websocket.emitStatsUpdate(userId, stats);
        }

        return stats;
    }

    // Add activity and emit real-time update
    async addActivity(userId, type, action, metadata = {}) {
        const activity = await Activity.create({
            userId,
            type,
            action,
            metadata,
            timestamp: new Date()
        });

        // Emit real-time update
        if (this.websocket) {
            this.websocket.emitNewActivity(userId, activity);
        }

        return activity;
    }

    // Get recent activity
    async getRecentActivity(userId, limit = 10) {
        return await Activity.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    // Get performance data
    async getPerformanceData(userId, days = 7) {
        const startDate = startOfDay(subDays(new Date(), days - 1));
        const endDate = endOfDay(new Date());

        let metrics = await PerformanceMetric.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        })
        .sort({ date: 1 })
        .lean();

        // Fill in missing dates with zero values
        const result = [];
        for (let i = 0; i < days; i++) {
            const date = subDays(new Date(), days - 1 - i);
            const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
            
            const metric = metrics.find(m => 
                format(startOfDay(m.date), 'yyyy-MM-dd') === dateStr
            );

            result.push({
                date: format(date, 'MMM dd'),
                views: metric?.views || 0,
                visitors: metric?.visitors || 0,
                uniqueVisitors: metric?.uniqueVisitors || 0
            });
        }

        return result;
    }

    // Record page view
    async recordPageView(userId, metadata = {}) {
        const today = startOfDay(new Date());

        await PerformanceMetric.findOneAndUpdate(
            { userId, date: today },
            { 
                $inc: { views: 1 },
                $setOnInsert: { userId, date: today }
            },
            { upsert: true }
        );

        // Update total visitors stat
        await this.incrementStat(userId, 'totalVisitors');
    }

    // Get upcoming events
    async getUpcomingEvents(userId, limit = 5) {
        return await Event.find({
            userId,
            date: { $gte: new Date() },
            completed: false
        })
        .sort({ date: 1 })
        .limit(limit)
        .lean();
    }

    // Get tasks
    async getTasks(userId, filters = {}) {
        const query = { userId, ...filters };
        return await Task.find(query)
            .sort({ priority: -1, dueDate: 1 })
            .lean();
    }

    // Update task
    async updateTask(taskId, userId, updates) {
        const task = await Task.findOneAndUpdate(
            { _id: taskId, userId },
            updates,
            { new: true }
        );

        if (task && updates.status === 'completed') {
            task.completedAt = new Date();
            await task.save();

            // Add activity
            await this.addActivity(
                userId,
                'update',
                `Completed task: ${task.title}`
            );
        }

        return task;
    }

    // Get recent projects
    async getRecentProjects(userId, limit = 4) {
        return await Project.find({ userId, status: { $ne: 'deleted' } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title thumbnail views likes createdAt')
            .lean();
    }

    // Create notification and emit real-time update
    async createNotification(userId, type, title, message, metadata = {}) {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            metadata
        });

        // Emit real-time update
        if (this.websocket) {
            this.websocket.emitNewNotification(userId, notification);
        }

        return notification;
    }

    // Get notifications
    async getNotifications(userId, limit = 5) {
        return await Notification.find({ userId, dismissed: false })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    // Dismiss notification
    async dismissNotification(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { dismissed: true },
            { new: true }
        );
    }

    // Get top skills
    async getTopSkills(userId, limit = 5) {
        // This would aggregate from projects or a separate skills collection
        // Placeholder implementation
        return [];
    }

    // Get device stats
    async getDeviceStats(userId) {
        const today = startOfDay(new Date());
        const stats = await DeviceStat.findOne({ userId, date: today });

        if (!stats) {
            return [
                { name: 'Desktop', value: 0, percentage: 0 },
                { name: 'Mobile', value: 0, percentage: 0 },
                { name: 'Tablet', value: 0, percentage: 0 }
            ];
        }

        const total = stats.desktop + stats.mobile + stats.tablet;

        return [
            {
                name: 'Desktop',
                value: stats.desktop,
                percentage: total > 0 ? ((stats.desktop / total) * 100).toFixed(1) : 0
            },
            {
                name: 'Mobile',
                value: stats.mobile,
                percentage: total > 0 ? ((stats.mobile / total) * 100).toFixed(1) : 0
            },
            {
                name: 'Tablet',
                value: stats.tablet,
                percentage: total > 0 ? ((stats.tablet / total) * 100).toFixed(1) : 0
            }
        ];
    }

    // Record device visit
    async recordDeviceVisit(userId, deviceType) {
        const today = startOfDay(new Date());
        const field = deviceType.toLowerCase();

        await DeviceStat.findOneAndUpdate(
            { userId, date: today },
            { 
                $inc: { [field]: 1 },
                $setOnInsert: { userId, date: today }
            },
            { upsert: true }
        );
    }

    // Calculate and update all stats
    async recalculateStats(userId) {
        const [projects, visitors, collaborators, messages] = await Promise.all([
            Project.countDocuments({ userId, status: { $ne: 'deleted' } }),
            PerformanceMetric.aggregate([
                { $match: { userId } },
                { $group: { _id: null, total: { $sum: '$visitors' } } }
            ]),
            // Assuming you have a Collaborator model
            0, // Placeholder
            // Assuming you have a Message model
            0  // Placeholder
        ]);

        return await this.updateStats(userId, {
            totalProjects: projects,
            totalVisitors: visitors[0]?.total || 0,
            collaborators,
            messages
        });
    }
}

module.exports = DashboardService;