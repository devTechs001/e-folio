/**
 * DB-backed notifications with a real authenticated Socket.IO stream and an
 * honest polling fallback.
 *
 * - Source of truth: `/api/notifications` (real records, real unread counts).
 * - Live delivery: `/notifications` namespace, JWT-authenticated per-user rooms.
 * - If the socket is unavailable we show "Polling" and re-read the REST API on
 *   a timer; we never invent notifications or claim a live connection.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import { useNotifications } from '../components/NotificationSystem';

const POLL_INTERVAL_MS = 30000;

const normalise = item => ({
    ...item,
    id: String(item.id || item._id || ''),
    read: Boolean(item.read),
    dismissed: Boolean(item.dismissed),
    title: item.title || 'Notification',
    message: item.message || '',
    type: item.type || 'info',
    createdAt: item.createdAt || null
});

export function useWorkspaceNotifications(userId, options = {}) {
    const { toastOnNew = true } = options;
    const { success, error: showError, warning, info } = useNotifications();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [live, setLive] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastSync, setLastSync] = useState(null);
    const toastRef = useRef({ success, error: showError, warning, info });
    toastRef.current = { success, error: showError, warning, info };

    const refresh = useCallback(async () => {
        if (!userId) return;
        const [listResult, unreadResult] = await Promise.allSettled([
            apiService.getAllNotifications({ limit: 30 }),
            apiService.getUnreadNotifications()
        ]);
        const list = listResult.status === 'fulfilled' ? listResult.value : null;
        const unread = unreadResult.status === 'fulfilled' ? unreadResult.value : null;

        if (list?.success && Array.isArray(list.data)) {
            setNotifications(list.data.map(normalise));
            setError('');
        } else if (unread?.success && Array.isArray(unread.data?.notifications)) {
            setNotifications(unread.data.notifications.map(normalise));
            setError('');
        } else if (!list?.success && !unread?.success) {
            setError(list?.message || unread?.message || 'Notifications are unavailable.');
        }

        if (unread?.success && typeof unread.data?.count === 'number') {
            setUnreadCount(unread.data.count);
        } else if (list?.success && Array.isArray(list.data)) {
            setUnreadCount(list.data.filter(n => !n.read).length);
        }
        setLastSync(new Date());
        setLoading(false);
    }, [userId]);

    // REST is always the baseline, even when the socket is live.
    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!userId) return undefined;

        const onNew = payload => {
            if (!payload || !payload.id) return;
            const incoming = normalise(payload);
            setNotifications(prev => {
                if (prev.some(item => item.id === incoming.id)) return prev;
                return [incoming, ...prev].slice(0, 50);
            });
            if (!incoming.read) setUnreadCount(count => count + 1);
            if (toastOnNew) {
                const toast = toastRef.current;
                const notify = incoming.type === 'error' ? toast.error
                    : incoming.type === 'warning' ? toast.warning
                        : incoming.type === 'success' ? toast.success : toast.info;
                notify(incoming.message, { title: incoming.title, duration: 6500 });
            }
        };

        const onUpdate = payload => {
            const action = payload?.action;
            const id = payload?.id ? String(payload.id) : null;
            if (action === 'read-all') {
                setNotifications(prev => prev.map(item => ({ ...item, read: true })));
                setUnreadCount(0);
            } else if (action === 'delete-all') {
                setNotifications([]);
                setUnreadCount(0);
            } else if (action === 'delete' && id) {
                setNotifications(prev => prev.filter(item => item.id !== id));
                refresh();
            } else if ((action === 'read' || action === 'dismiss') && id) {
                setNotifications(prev => prev.map(item => item.id === id
                    ? { ...item, read: true, ...(action === 'dismiss' ? { dismissed: true } : {}) }
                    : item));
                refresh();
            } else {
                refresh();
            }
        };

        const onStatus = state => {
            setLive(Boolean(state?.connected));
            setConnectionError(state?.error || '');
        };

        socketService.onNotificationEvent('notification:new', onNew);
        socketService.onNotificationEvent('notification:updated', onUpdate);
        const unsubscribe = socketService.subscribeNotificationStatus(onStatus);
        socketService.connectNotifications();

        return () => {
            socketService.offNotificationEvent('notification:new', onNew);
            socketService.offNotificationEvent('notification:updated', onUpdate);
            unsubscribe();
            socketService.disconnectNotifications();
        };
    }, [userId, refresh, toastOnNew]);

    // Honest fallback: when the socket is down, poll the real REST endpoint.
    useEffect(() => {
        if (!userId || live) return undefined;
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [userId, live, refresh]);

    const runAction = useCallback(async (fn, fallbackMessage) => {
        try {
            const response = await fn();
            if (response?.success === false) {
                setError(response.message || fallbackMessage);
                toastRef.current.error(response.message || fallbackMessage);
                return false;
            }
            await refresh();
            return true;
        } catch (err) {
            setError(err?.message || fallbackMessage);
            toastRef.current.error(err?.message || fallbackMessage);
            return false;
        }
    }, [refresh]);

    return {
        notifications,
        unreadCount,
        live,
        connectionError,
        loading,
        error,
        lastSync,
        refresh,
        markRead: id => runAction(() => apiService.markNotificationAsRead(id), 'Could not mark as read.'),
        markAllRead: () => runAction(() => apiService.markAllNotificationsAsRead(), 'Could not mark all as read.'),
        dismiss: id => runAction(() => apiService.dismissNotification(id), 'Could not dismiss notification.'),
        remove: id => runAction(() => apiService.deleteNotification(id), 'Could not delete notification.'),
        removeAll: () => runAction(() => apiService.deleteAllNotifications(), 'Could not clear notifications.'),
        sendTest: () => runAction(() => apiService.request('/notifications', {
            method: 'POST',
            body: JSON.stringify({
                type: 'info',
                title: 'Real-time check',
                message: 'If you saw a toast immediately, live notifications are working.'
            })
        }), 'Could not send the test notification.')
    };
}

export default useWorkspaceNotifications;
