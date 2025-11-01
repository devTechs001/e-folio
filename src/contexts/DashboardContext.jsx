// client/src/contexts/DashboardContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within DashboardProvider');
    }
    return context;
};

const DashboardProvider = ({ children }) => {
    const [dashboardStats, setDashboardStats] = useState({
        projects: 0,
        visitors: 0,
        messages: 0,
        collaborators: 0
    });
    
    const [recentActivity, setRecentActivity] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [quickStats, setQuickStats] = useState({});

    // Refresh dashboard data
    const refreshDashboard = async () => {
        // Implement your refresh logic here
        console.log('Refreshing dashboard data...');
    };

    const value = {
        dashboardStats,
        setDashboardStats,
        recentActivity,
        setRecentActivity,
        notifications,
        setNotifications,
        quickStats,
        setQuickStats,
        refreshDashboard
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;