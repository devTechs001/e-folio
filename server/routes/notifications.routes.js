const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
const {
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    dismissNotification
} = require('../controllers/notifications.controller');

router.use(auth);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.post('/mark-all-read', markAllAsRead);
router.post('/:notificationId/read', markAsRead);
router.post('/:notificationId/dismiss', dismissNotification);
router.delete('/:notificationId', isOwner, deleteNotification);
router.post('/', isOwner, createNotification);

module.exports = router;
