// client/src/contexts/DashboardContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';

const DashboardContext = createContext();

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within DashboardProvider');
    }
    return context;
};

const INITIAL_STATS = {
    projects: 0,
    visitors: 0,
    messages: 0,
    collaborators: 0,
    totalProjects: 0,
    totalVisitors: 0
};

const unpack = (result) => {
    if (result.status !== 'fulfilled') return null;
    const payload = result.value;
    if (!payload || payload.success === false) return null;
    return payload.data ?? payload;
};

const DashboardProvider = ({ children }) => {
    const [dashboardStats, setDashboardStats] = useState(INITIAL_STATS);
    const [recentActivity, setRecentActivity] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [quickStats, setQuickStats] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);
    const inFlight = useRef(false);
    const lastSocketRefresh = useRef(0);

    /**
     * Real refresh: previously this was a console.log stub, so the dashboard's
     * refresh control did nothing while the UI reported success.
     */
    const refreshDashboard = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setRefreshing(true);
        setError(null);

        try {
            const [statsResult, quickResult, notificationsResult, activityResult] = await Promise.allSettled([
                apiService.getDashboardStats(),
                apiService.getQuickStats(),
                apiService.getNotifications(10),
                apiService.getRecentActivity(10)
            ]);

            const stats = unpack(statsResult);
            const quick = unpack(quickResult);
            const notes = unpack(notificationsResult);
            const activity = unpack(activityResult);

            if (stats && typeof stats === 'object') {
                setDashboardStats(prev => ({ ...prev, ...stats }));
            }
            if (quick && typeof quick === 'object') {
                setQuickStats(quick);
                setDashboardStats(prev => ({ ...prev, ...quick }));
            }
            if (Array.isArray(notes)) setNotifications(notes);
            else if (Array.isArray(notes?.notifications)) setNotifications(notes.notifications);
            if (Array.isArray(activity)) setRecentActivity(activity);
            else if (Array.isArray(activity?.activities)) setRecentActivity(activity.activities);

            const failed = [statsResult, quickResult, notificationsResult, activityResult]
                .filter(r => r.status === 'rejected').length;
            if (failed === 4) setError('Dashboard data is temporarily unavailable.');
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message || 'Failed to refresh dashboard');
        } finally {
            inFlight.current = false;
            setRefreshing(false);
        }
    }, []);

    // Load once on mount and invalidate (throttled) on real-time broadcasts.
    useEffect(() => {
        refreshDashboard();

        const onStatsUpdate = () => {
            const now = Date.now();
            if (now - lastSocketRefresh.current < 5000) return;
            lastSocketRefresh.current = now;
            refreshDashboard();
        };

        socketService.on('stats_update', onStatsUpdate);
        socketService.on('new_activity', onStatsUpdate);
        socketService.on('notification', onStatsUpdate);
        return () => {
            socketService.off('stats_update', onStatsUpdate);
            socketService.off('new_activity', onStatsUpdate);
            socketService.off('notification', onStatsUpdate);
        };
    }, [refreshDashboard]);

    const value = {
        dashboardStats,
        setDashboardStats,
        recentActivity,
        setRecentActivity,
        notifications,
        setNotifications,
        quickStats,
        setQuickStats,
        refreshing,
        lastUpdated,
        error,
        refreshDashboard
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;
