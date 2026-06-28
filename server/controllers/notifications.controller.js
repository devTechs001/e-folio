const crypto = require('crypto');

let notifications = [
    {
        id: crypto.randomUUID(),
        type: 'message',
        title: 'New message from John',
        message: 'John sent you a message regarding the portfolio project.',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        icon: 'message'
    },
    {
        id: crypto.randomUUID(),
        type: 'review',
        title: 'New review received',
        message: 'Your project "E-Commerce Platform" received a 5-star review.',
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        icon: 'star'
    },
    {
        id: crypto.randomUUID(),
        type: 'project',
        title: 'Project milestone completed',
        message: 'The "Dashboard Redesign" project has reached 75% completion.',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        icon: 'project'
    },
    {
        id: crypto.randomUUID(),
        type: 'collaboration',
        title: 'Collaboration request accepted',
        message: 'Sarah has accepted your collaboration request for the mobile app.',
        read: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        icon: 'users'
    },
    {
        id: crypto.randomUUID(),
        type: 'system',
        title: 'System maintenance',
        message: 'Scheduled maintenance will occur on Sunday at 2:00 AM UTC.',
        read: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        icon: 'settings'
    },
    {
        id: crypto.randomUUID(),
        type: 'update',
        title: 'New feature available',
        message: 'AI-powered project suggestions are now available in your dashboard.',
        read: false,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        icon: 'bell'
    }
];

const getNotifications = async (req, res) => {
    try {
        let result = [...notifications];
        const { type, limit, offset } = req.query;

        if (type) {
            result = result.filter(n => n.type === type);
        }

        const total = result.length;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);
        const paginated = result.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginated,
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
        const unread = notifications.filter(n => !n.read);
        res.json({
            success: true,
            data: {
                count: unread.length,
                notifications: unread
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
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
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
        notifications.forEach(n => { n.read = true; });
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
        const index = notifications.findIndex(n => n.id === notificationId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notifications.splice(index, 1);
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

const createNotification = async (req, res) => {
    try {
        const { type, title, message, icon } = req.body;

        if (!type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Type, title, and message are required'
            });
        }

        const validTypes = ['message', 'review', 'project', 'collaboration', 'system', 'update'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const notification = {
            id: crypto.randomUUID(),
            type,
            title,
            message,
            read: false,
            createdAt: new Date().toISOString(),
            icon: icon || 'bell'
        };

        notifications.unshift(notification);
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

const dismissNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
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
    createNotification,
    dismissNotification
};
