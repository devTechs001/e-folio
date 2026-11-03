import { useCallback, useEffect, useRef, useState } from 'react';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';

const INITIAL_DATA = {
    activeUsers: 0,
    currentPageViews: [],
    recentEvents: [],
    liveMetrics: {
        avgEngagement: 0,
        avgDuration: 0,
        topPage: '',
        topLocation: ''
    }
};

const pushEvent = (list, entry) => [entry, ...list].slice(0, 50);

/**
 * Live visitor tracking backed by the authenticated `/tracking` Socket.IO
 * namespace, with an HTTP snapshot fallback.
 *
 * The old implementation opened a raw WebSocket at `${SOCKET_URL}/tracking`,
 * but the server only runs Socket.IO, so it never connected and retried every
 * 5 seconds forever (including after unmount). This hook:
 *   - uses the namespace registered in server/socket/tracking.handler.js,
 *   - polls the realtime REST endpoint for authoritative metrics,
 *   - pauses polling while the tab is hidden,
 *   - cleans up every listener, timer and socket on unmount.
 */
export function useRealtimeTracking({ paused = false, pollIntervalMs = 15000 } = {}) {
    const [realTimeData, setRealTimeData] = useState(INITIAL_DATA);
    const [connected, setConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [source, setSource] = useState('snapshot');
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    const applyEvent = useCallback((envelope) => {
        if (!envelope || pausedRef.current) return;
        const { type, payload = {}, timestamp = Date.now() } = envelope;
        if (type === 'pong' || type === 'ready') return;

        setRealTimeData(prev => {
            switch (type) {
                case 'new_visitor':
                    return {
                        ...prev,
                        activeUsers: prev.activeUsers + 1,
                        currentPageViews: pushEvent(prev.currentPageViews, {
                            sessionId: payload.sessionId,
                            page: '/',
                            location: payload.location,
                            timestamp
                        }),
                        recentEvents: pushEvent(prev.recentEvents, {
                            type: 'visitor',
                            message: `New visitor from ${payload.location?.country || 'Unknown'}`,
                            timestamp,
                            data: payload
                        })
                    };
                case 'page_view': {
                    const existing = prev.currentPageViews.find(pv => pv.sessionId === payload.sessionId);
                    const views = existing
                        ? prev.currentPageViews.map(pv => pv.sessionId === payload.sessionId
                            ? { ...pv, page: payload.page, timestamp } : pv)
                        : pushEvent(prev.currentPageViews, {
                            sessionId: payload.sessionId, page: payload.page, timestamp
                        });
                    return {
                        ...prev,
                        currentPageViews: views,
                        recentEvents: pushEvent(prev.recentEvents, {
                            type: 'pageview',
                            message: `Viewing ${payload.page}`,
                            timestamp,
                            data: payload
                        })
                    };
                }
                case 'event':
                    return {
                        ...prev,
                        recentEvents: pushEvent(prev.recentEvents, {
                            type: payload.eventType || 'event',
                            message: `${payload.eventType || 'event'}: ${payload.eventData?.element || ''}`.trim(),
                            timestamp,
                            data: payload
                        })
                    };
                case 'session_end':
                    return {
                        ...prev,
                        activeUsers: Math.max(0, prev.activeUsers - 1),
                        currentPageViews: prev.currentPageViews.filter(pv => pv.sessionId !== payload.sessionId)
                    };
                case 'high_engagement':
                case 'conversion':
                    return {
                        ...prev,
                        recentEvents: pushEvent(prev.recentEvents, {
                            type,
                            message: type === 'conversion' ? 'New conversion recorded' : 'High-engagement visitor detected',
                            timestamp,
                            data: payload,
                            highlight: true
                        })
                    };
                case 'metrics_update':
                    return { ...prev, liveMetrics: { ...prev.liveMetrics, ...payload } };
                default:
                    return prev;
            }
        });
        setSource('realtime');
        setLastUpdate(new Date(timestamp));
    }, []);

    const refresh = useCallback(async () => {
        try {
            const response = await apiService.getRealtimeAnalytics();
            const a = response?.analytics;
            if (!a) return;
            const durations = (a.recentVisitors || []).map(v => v.duration).filter(Number.isFinite);
            const avgDuration = durations.length
                ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;

            setRealTimeData(prev => ({
                ...prev,
                activeUsers: Number(a.activeNow) || 0,
                liveMetrics: {
                    avgEngagement: Number(a.averageEngagement) || 0,
                    avgDuration: Math.round(avgDuration),
                    topPage: a.topPages?.[0]?._id || a.topPages?.[0]?.page || '',
                    topLocation: a.locations?.[0]?._id || ''
                },
                currentPageViews: (a.recentVisitors || []).slice(0, 20).map(v => ({
                    sessionId: v.sessionId,
                    page: v.page || v.pageJourney?.[0]?.path || '/',
                    location: v.location,
                    timestamp: new Date(v.startTime || Date.now()).getTime()
                }))
            }));
            setSource(prev => (prev === 'realtime' ? 'realtime+snapshot' : 'snapshot'));
            setLastUpdate(new Date());
        } catch (error) {
            // Snapshot failure must not tear down the live socket feed.
            console.warn('Realtime snapshot unavailable:', error?.message || error);
        }
    }, []);

    useEffect(() => {
        let disposed = false;
        const socket = socketService.connectTracking();

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onDisconnect);
        if (socket.connected) onConnect();
        socketService.onTrackingEvent(applyEvent);

        refresh();
        const timer = setInterval(() => {
            if (!document.hidden && !disposed) refresh();
        }, Math.max(pollIntervalMs, 5000));

        const onVisibility = () => {
            if (!document.hidden) refresh();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            disposed = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onDisconnect);
            socketService.offTrackingEvent(applyEvent);
            socketService.disconnectTracking();
            setConnected(false);
        };
    }, [applyEvent, refresh, pollIntervalMs]);

    return { realTimeData, connected, lastUpdate, source, refresh };
}

export default useRealtimeTracking;
