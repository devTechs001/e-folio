const mongoose = require('mongoose');
const Notification = require('../models/Notifications');
const User = require('../models/User.model');
const {
    publishUserNotification,
    publishNotificationUpdate,
    validTypes
} = require('../socket/notifications.handler');

const getNotifications = async (req, res) => {
    try {
        const { type, limit, offset } = req.query;
        const userId = req.user.id;

        const query = { userId };
        if (type && validTypes.includes(type)) {
            query.type = type;
        }

        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

        const [total, notifications] = await Promise.all([
            Notification.countDocuments(query),
            Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(offsetNum)
                .lean()
        ]);

        const data = notifications.map(n => ({
            ...n,
            id: n._id
        }));

        res.json({
            success: true,
            data,
            pagination: {
                total,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < total
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const unread = await Notification.find({ userId, read: false })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                count: unread.length,
                notifications: unread.map(n => ({ ...n, id: n._id }))
            }
        });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread notifications'
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        publishNotificationUpdate(userId, { action: 'read', id: String(notification._id) });

        res.json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany({ userId, read: false }, { read: true });
        publishNotificationUpdate(userId, { action: 'read-all' });

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        publishNotificationUpdate(userId, { action: 'delete', id: String(notification._id) });

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.deleteMany({ userId });
        publishNotificationUpdate(userId, { action: 'delete-all' });

        res.json({
            success: true,
            message: 'All notifications deleted'
        });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete all notifications'
        });
    }
};

/** Owner-only: create a notification for the current user (self / test). */
const createNotification = async (req, res) => {
    try {
        const { type, title, message, link, metadata } = req.body;
        const userId = req.user.id;

        if (!type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Type, title, and message are required'
            });
        }

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Persist and deliver only to this user's authenticated room.
        const notification = await publishUserNotification(userId, { type, title, message, link, metadata });
        if (!notification) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create notification'
            });
        }

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created successfully'
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
};

/**
 * Owner-only: send a real-time notification to another registered user.
 * Used by the User Workspaces dashboard to message account holders about
 * their CV/portfolio without touching their session or their records.
 */
const createNotificationForUser = async (req, res) => {
    try {
        const { userId: targetUserId } = req.params;
        const { type, title, message, link, metadata } = req.body || {};

        if (!mongoose.isValidObjectId(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id' });
        }
        if (!type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Type, title, and message are required'
            });
        }
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const target = await User.findById(targetUserId).select('_id username').lean();
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const notification = await publishUserNotification(targetUserId, {
            type,
            title,
            message,
            link,
            metadata: { ...(metadata && typeof metadata === 'object' ? metadata : {}), from: 'owner' }
        });
        if (!notification) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create notification'
            });
        }

        res.status(201).json({
            success: true,
            data: notification,
            message: `Notification delivered to ${target.username || 'user'}`
        });
    } catch (error) {
        console.error('Error creating notification for user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
};

const dismissNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true, dismissed: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        publishNotificationUpdate(userId, { action: 'dismiss', id: String(notification._id) });

        res.json({
            success: true,
            data: notification,
            message: 'Notification dismissed'
        });
    } catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to dismiss notification'
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
    createNotificationForUser,
    dismissNotification
};
