// src/components/Dashboard/AITrackingSystem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Activity, TrendingUp, Users, Eye, Target, Zap,
    AlertCircle, CheckCircle, BarChart3, PieChart, MapPin,
    Clock, Smartphone, Monitor, RefreshCw, Download, Filter,
    Calendar, Globe, MousePointer, Route, Share2, Link2,
    Award, Flame, TrendingDown, ArrowUp, ArrowDown, Play,
    Pause, Settings, Bell, BellOff, ExternalLink, Search,
    Navigation, Wifi, WifiOff, Layers, Grid, List, ChevronRight,
    Hash, Percent, Timer, Maximize2, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AITrackingSystem = () => {
    const { user, isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const wsRef = useRef(null);

    // State Management
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [realTimeEnabled, setRealTimeEnabled] = useState(true);
    const [aiInsights, setAiInsights] = useState([]);
    const [notifications, setNotifications] = useState(true);
    const [viewMode, setViewMode] = useState('overview');
    const [timeRange, setTimeRange] = useState('today');
    const [selectedMetric, setSelectedMetric] = useState('all');
    const [visitorDetails, setVisitorDetails] = useState(null);
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [heatmapData, setHeatmapData] = useState(null);
    const [conversionFunnel, setConversionFunnel] = useState([]);
    const [behaviorPatterns, setBehaviorPatterns] = useState([]);
    const [predictiveData, setPredictiveData] = useState(null);

    // Load initial data
    useEffect(() => {
        if (isOwner()) {
            fetchInitialData();
            setupWebSocket();
            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        }
    }, [isOwner]);

    // Time range effect
    useEffect(() => {
        if (isOwner()) {
            fetchAIAnalytics();
        }
    }, [timeRange]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchAIAnalytics(),
                fetchHeatmapData(),
                fetchConversionFunnel(),
                fetchBehaviorPatterns(),
                fetchPredictiveAnalytics()
            ]);
        } catch (err) {
            error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAIAnalytics = async () => {
        try {
            const response = await apiService.request('/tracking/analytics/realtime', {
                params: { timeRange }
            });

            if (response.success) {
                setAnalytics(response.analytics);
                generateAIInsights(response.analytics);
            }
        } catch (err) {
            console.error('AI Analytics error:', err);
        }
    };

    const fetchHeatmapData = async () => {
        try {
            const response = await apiService.request('/tracking/heatmap');
            if (response.success) {
                setHeatmapData(response.heatmap);
            }
        } catch (err) {
            console.error('Heatmap error:', err);
        }
    };

    const fetchConversionFunnel = async () => {
        try {
            const response = await apiService.request('/tracking/funnel');
            if (response.success) {
                setConversionFunnel(response.funnel);
            }
        } catch (err) {
            console.error('Funnel error:', err);
        }
    };

    const fetchBehaviorPatterns = async () => {
        try {
            const response = await apiService.request('/tracking/patterns');
            if (response.success) {
                setBehaviorPatterns(response.patterns);
            }
        } catch (err) {
            console.error('Patterns error:', err);
        }
    };

    const fetchPredictiveAnalytics = async () => {
        try {
            const response = await apiService.request('/tracking/predictive');
            if (response.success) {
                setPredictiveData(response.predictions);
            }
        } catch (err) {
            console.error('Predictive error:', err);
        }
    };

    const setupWebSocket = () => {
        if (!realTimeEnabled) return;

        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        wsRef.current = new WebSocket(`${wsUrl}/tracking`);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
            wsRef.current.send(JSON.stringify({ 
                type: 'auth', 
                token: localStorage.getItem('token') 
            }));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected');
            if (realTimeEnabled) {
                setTimeout(setupWebSocket, 5000);
            }
        };
    };

    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'new_visitor':
                handleNewVisitor(data.visitor);
                break;
            case 'analytics_update':
                setAnalytics(prev => ({ ...prev, ...data.analytics }));
                break;
            case 'high_engagement':
                if (notifications) {
                    showNotification('High Engagement', data.message, 'success');
                }
                break;
            case 'conversion':
                if (notifications) {
                    showNotification('Conversion!', data.message, 'success');
                }
                break;
            default:
                break;
        }
    };

    const handleNewVisitor = (visitor) => {
        setAnalytics(prev => ({
            ...prev,
            activeNow: (prev?.activeNow || 0) + 1,
            recentVisitors: [visitor, ...(prev?.recentVisitors || [])].slice(0, 10)
        }));

        if (notifications && visitor.aiInsights?.engagementLevel === 'very_high') {
            showNotification(
                'High-Value Visitor',
                `New visitor from ${visitor.location?.country} showing strong interest`,
                'info'
            );
        }
    };

    const showNotification = (title, message, type) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/logo.png' });
        }
        // Also show in-app notification
        success(`${title}: ${message}`);
    };

    const generateAIInsights = (data) => {
        const insights = [];

        // Active visitors insight
        if (data.activeNow > 5) {
            insights.push({
                type: 'success',
                icon: TrendingUp,
                title: 'High Traffic Alert',
                message: `${data.activeNow} visitors are browsing right now! ${data.activeNow > 10 ? 'Peak activity detected.' : 'Great engagement.'}`,
                action: 'View live visitors',
                priority: 'high'
            });
        }

        // Engagement analysis
        if (data.recentVisitors?.length > 0) {
            const highEngagement = data.recentVisitors.filter(
                v => v.aiInsights?.engagementLevel === 'very_high' || v.aiInsights?.engagementLevel === 'high'
            );

            if (highEngagement.length > 0) {
                insights.push({
                    type: 'info',
                    icon: Target,
                    title: 'High Engagement Detected',
                    message: `${highEngagement.length} visitors showing strong interest. Average intent score: ${Math.round(highEngagement.reduce((acc, v) => acc + (v.aiInsights?.intentScore || 0), 0) / highEngagement.length)}`,
                    action: 'View engaged visitors',
                    priority: 'high'
                });
            }
        }

        // Conversion rate insight
        if (data.conversionRate) {
            const rate = parseFloat(data.conversionRate);
            if (rate > 5) {
                insights.push({
                    type: 'success',
                    icon: Award,
                    title: 'Excellent Conversion Rate',
                    message: `Your conversion rate is ${rate.toFixed(1)}%, above industry average!`,
                    action: 'View conversions',
                    priority: 'medium'
                });
            } else if (rate < 2) {
                insights.push({
                    type: 'warning',
                    icon: AlertCircle,
                    title: 'Low Conversion Rate',
                    message: `Conversion rate is ${rate.toFixed(1)}%. Consider optimizing your CTAs.`,
                    action: 'Optimization tips',
                    priority: 'high'
                });
            }
        }

        // Geographic insight
        if (data.locations?.length > 0) {
            const topLocation = data.locations[0];
            const percentage = ((topLocation.count / data.todayTotal) * 100).toFixed(1);
            insights.push({
                type: 'info',
                icon: MapPin,
                title: 'Geographic Trend',
                message: `${percentage}% of traffic from ${topLocation._id} (${topLocation.count} visitors). Consider localization.`,
                action: 'View geographic data',
                priority: 'medium'
            });
        }

        // Device insight
        if (data.devices) {
            const total = data.devices.mobile + data.devices.desktop + (data.devices.tablet || 0);
            const mobilePercent = (data.devices.mobile / total) * 100;

            if (mobilePercent > 70) {
                insights.push({
                    type: 'warning',
                    icon: Smartphone,
                    title: 'Mobile-Dominant Traffic',
                    message: `${mobilePercent.toFixed(0)}% mobile users. Ensure optimal mobile experience!`,
                    action: 'Mobile optimization',
                    priority: 'high'
                });
            }
        }

        // Top pages insight
        if (data.topPages?.length > 0) {
            const topPage = data.topPages[0];
            const avgTime = data.averageTimeOnPage?.[topPage._id] || 0;
            insights.push({
                type: 'success',
                icon: Eye,
                title: 'Top Performing Content',
                message: `"${topPage._id}" - ${topPage.count} views, avg ${Math.round(avgTime / 1000)}s time`,
                action: 'Analyze page',
                priority: 'medium'
            });
        }

        // Bounce rate insight
        if (data.bounceRate) {
            const rate = parseFloat(data.bounceRate);
            if (rate > 70) {
                insights.push({
                    type: 'error',
                    icon: AlertCircle,
                    title: 'High Bounce Rate Alert',
                    message: `${rate.toFixed(1)}% bounce rate. Users leaving too quickly!`,
                    action: 'Reduce bounce rate',
                    priority: 'high'
                });
            }
        }

        // Time-based insight
        const hour = new Date().getHours();
        if (data.activeNow > data.averageActiveUsers * 1.5) {
            insights.push({
                type: 'info',
                icon: Flame,
                title: 'Peak Activity Time',
                message: `Traffic is ${Math.round((data.activeNow / data.averageActiveUsers) * 100)}% above average for this time!`,
                action: 'View trends',
                priority: 'low'
            });
        }

        // Predictive insight
        if (predictiveData?.nextHourPrediction) {
            insights.push({
                type: 'info',
                icon: Brain,
                title: 'AI Prediction',
                message: `Expected ${predictiveData.nextHourPrediction} visitors in the next hour (${predictiveData.confidence}% confidence)`,
                action: 'View predictions',
                priority: 'low'
            });
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        setAiInsights(insights);
    };

    const exportAnalytics = async () => {
        try {
            const response = await apiService.request('/tracking/export', {
                params: { timeRange, format: 'csv' },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-${timeRange}-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            success('Analytics exported successfully');
        } catch (err) {
            error('Failed to export analytics');
        }
    };

    const toggleRealTime = () => {
        setRealTimeEnabled(!realTimeEnabled);
        if (!realTimeEnabled) {
            setupWebSocket();
        } else if (wsRef.current) {
            wsRef.current.close();
        }
    };

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <div className="text-center p-10 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/30 max-w-md">
                        <Brain size={64} className="mx-auto mb-5 text-red-500" />
                        <h2 className="text-3xl font-bold text-red-500 mb-3">Access Restricted</h2>
                        <p className="text-gray-400">AI Tracking is only available to the portfolio owner.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="AI Tracking System"
            subtitle={`Intelligent visitor analysis • ${analytics?.todayTotal || 0} visitors today`}
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        {notifications ? <Bell size={16} /> : <BellOff size={16} />}
                        Notifications
                    </button>

                    <button
                        onClick={toggleRealTime}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            realTimeEnabled
                                ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                    >
                        {realTimeEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
                        {realTimeEnabled ? 'Live' : 'Paused'}
                    </button>

                    <button
                        onClick={exportAnalytics}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>

                    <button
                        onClick={fetchInitialData}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                                 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg 
                                 shadow-blue-500/25 flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Real-time Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                        realTimeEnabled
                            ? 'bg-green-500/10 border-green-500'
                            : 'bg-gray-500/10 border-gray-500'
                    }`}
                >
                    <Activity size={24} className={realTimeEnabled ? 'text-green-500' : 'text-gray-500'} />
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                            {realTimeEnabled ? 'AI Analysis Active' : 'Real-time Paused'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {realTimeEnabled
                                ? 'Live behavior tracking with predictive insights'
                                : 'Click "Live" to resume real-time tracking'}
                        </p>
                    </div>
                    {realTimeEnabled && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-full text-white text-sm font-semibold">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Live
                        </div>
                    )}
                </motion.div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {[
                        { value: 'realtime', label: 'Real-time', icon: Activity },
                        { value: 'today', label: 'Today', icon: Clock },
                        { value: 'week', label: 'This Week', icon: Calendar },
                        { value: 'month', label: 'This Month', icon: Calendar },
                        { value: 'year', label: 'This Year', icon: Calendar }
                    ].map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                timeRange === range.value
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            <range.icon size={16} />
                            {range.label}
                        </button>
                    ))}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[
                        {
                            label: 'Active Now',
                            value: analytics?.activeNow || 0,
                            icon: Activity,
                            color: 'green',
                            change: '+12%',
                            trend: 'up'
                        },
                        {
                            label: 'Total Visitors',
                            value: analytics?.todayTotal || 0,
                            icon: Users,
                            color: 'blue',
                            change: '+8%',
                            trend: 'up'
                        },
                        {
                            label: 'Avg Engagement',
                            value: `${analytics?.averageEngagement || 67}%`,
                            icon: Target,
                            color: 'amber',
                            change: '+3%',
                            trend: 'up'
                        },
                        {
                            label: 'Conversion Rate',
                            value: `${analytics?.conversionRate || 3.2}%`,
                            icon: Award,
                            color: 'purple',
                            change: '-1%',
                            trend: 'down'
                        },
                        {
                            label: 'AI Confidence',
                            value: `${analytics?.aiConfidence || 94}%`,
                            icon: Brain,
                            color: 'pink',
                            change: '+2%',
                            trend: 'up'
                        }
                    ].map((metric, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-5 
                                     border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 bg-${metric.color}-500/10 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <metric.icon className={`text-${metric.color}-500`} size={24} />
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                                    metric.trend === 'up'
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-red-500/20 text-red-500'
                                }`}>
                                    {metric.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                    {metric.change}
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 font-medium mb-1">{metric.label}</p>
                            <h3 className={`text-3xl font-bold bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600 bg-clip-text text-transparent`}>
                                {metric.value}
                            </h3>
                            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600`} />
                        </motion.div>
                    ))}
                </div>

                {/* AI Insights Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain className="text-purple-500" size={24} />
                            AI-Powered Insights
                        </h3>
                        <span className="text-sm text-gray-400">
                            {aiInsights.length} insights • Updated {new Date().toLocaleTimeString()}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
                                <p className="text-gray-400">Analyzing data with AI...</p>
                            </div>
                        </div>
                    ) : aiInsights.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {aiInsights.map((insight, idx) => {
                                const Icon = insight.icon;
                                const colors = {
                                    success: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-500', gradient: 'from-green-500/20' },
                                    info: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-500', gradient: 'from-blue-500/20' },
                                    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-500', gradient: 'from-amber-500/20' },
                                    error: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-500', gradient: 'from-red-500/20' }
                                };
                                const style = colors[insight.type];

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative overflow-hidden ${style.bg} border-2 ${style.border} rounded-xl p-5 hover:scale-105 transition-all`}
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-radial ${style.gradient} to-transparent opacity-50`} />

                                        <div className="flex items-start gap-4 mb-4 relative">
                                            <div className={`p-3 ${style.bg} border-2 ${style.border} rounded-xl`}>
                                                <Icon size={24} className={style.text} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold mb-1">{insight.title}</h4>
                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                    {insight.message}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            className={`w-full px-4 py-2 ${style.bg} border ${style.border} ${style.text} rounded-lg font-semibold hover:bg-opacity-20 transition-all flex items-center justify-center gap-2`}
                                        >
                                            {insight.action}
                                            <ChevronRight size={16} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                            <Brain size={64} className="mx-auto mb-4 text-gray-600" />
                            <h3 className="text-xl font-semibold mb-2">Collecting Data</h3>
                            <p className="text-gray-400">AI insights will appear as we gather more visitor data</p>
                        </div>
                    )}
                </div>

                {/* Traffic Overview Chart */}
                <TrafficChart analytics={analytics} timeRange={timeRange} />

                {/* Recent Visitors Table */}
                <RecentVisitorsTable
                    visitors={analytics?.recentVisitors || []}
                    onVisitorClick={(visitor) => {
                        setVisitorDetails(visitor);
                        setShowVisitorModal(true);
                    }}
                />

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeviceBreakdown devices={analytics?.devices} />
                    <GeographicDistribution locations={analytics?.locations} />
                    <TopPages pages={analytics?.topPages} />
                    <TrafficSources sources={analytics?.sources} />
                </div>

                {/* Conversion Funnel */}
                <ConversionFunnel funnel={conversionFunnel} />

                {/* Behavior Patterns */}
                <BehaviorPatterns patterns={behaviorPatterns} />

                {/* Predictive Analytics */}
                <PredictiveAnalytics predictions={predictiveData} />

                {/* Visitor Details Modal */}
                <VisitorDetailsModal
                    show={showVisitorModal}
                    visitor={visitorDetails}
                    onClose={() => {
                        setShowVisitorModal(false);
                        setVisitorDetails(null);
                    }}
                />
            </div>
        </DashboardLayout>
    );
};

// Sub-components...

const TrafficChart = ({ analytics, timeRange }) => {
    if (!analytics?.trafficHistory) return null;

    const chartData = {
        labels: analytics.trafficHistory.map(d => d.label),
        datasets: [
            {
                label: 'Visitors',
                data: analytics.trafficHistory.map(d => d.visitors),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Page Views',
                data: analytics.trafficHistory.map(d => d.pageViews),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, labels: { color: '#fff' } },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                displayColors: true
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#fff' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#fff' }
            }
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={24} />
                Traffic Overview
            </h3>
            <div style={{ height: '300px' }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

const RecentVisitorsTable = ({ visitors, onVisitorClick }) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="text-green-500" size={24} />
                    Recent Visitors
                    <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm font-bold">
                        {visitors.length}
                    </span>
                </h3>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all flex items-center gap-2">
                    <Eye size={16} /> View All
                </button>
            </div>

            <div className="overflow-x-auto">
                {visitors.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No recent visitors</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Location</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Device</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Page</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Engagement</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Intent</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Time</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-400 text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.slice(0, 10).map((visitor, idx) => {
                                const engagementColors = {
                                    very_high: 'bg-green-500/20 text-green-500',
                                    high: 'bg-blue-500/20 text-blue-500',
                                    medium: 'bg-amber-500/20 text-amber-500',
                                    low: 'bg-gray-500/20 text-gray-500'
                                };

                                return (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="font-medium">
                                                    {visitor.location?.city || visitor.location?.country || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {visitor.device?.isMobile ? (
                                                    <><Smartphone size={14} /> Mobile</>
                                                ) : (
                                                    <><Monitor size={14} /> Desktop</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-400 truncate max-w-xs block">
                                                {visitor.page || '/'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                                engagementColors[visitor.aiInsights?.engagementLevel || 'low']
                                            }`}>
                                                {(visitor.aiInsights?.engagementLevel || 'low').replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                        style={{ width: `${visitor.aiInsights?.intentScore || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold">
                                                    {visitor.aiInsights?.intentScore || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-400">
                                            {new Date(visitor.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => onVisitorClick(visitor)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// Continue with more components in next response...

export default AITrackingSystem;