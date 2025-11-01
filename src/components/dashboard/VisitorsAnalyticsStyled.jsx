import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Globe,
    Monitor,
    Smartphone,
    Eye,
    MapPin,
    Clock,
    Activity,
    Download,
    Filter,
    RefreshCw,
    BarChart3,
    PieChart,
    Search,
    Calendar,
    ChevronDown,
    Tablet,
    ExternalLink,
    MousePointer,
    Timer,
    Zap,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Share2,
    Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const VisitorsAnalytics = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('today'); // today, week, month, year
    const [viewMode, setViewMode] = useState('overview'); // overview, detailed, realtime
    const [selectedMetric, setSelectedMetric] = useState('visitors');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDevice, setFilterDevice] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [realtimeData, setRealtimeData] = useState([]);
    const [visitorFlow, setVisitorFlow] = useState([]);

    useEffect(() => {
        if (isOwner()) {
            fetchAnalytics();
            const interval = setInterval(() => {
                fetchAnalytics(true); // Silent refresh
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isOwner, timeRange, filterDevice, filterLocation]);

    const fetchAnalytics = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setRefreshing(true);

            const response = await apiService.request('/tracking/analytics/realtime', {
                params: {
                    timeRange,
                    device: filterDevice,
                    location: filterLocation
                }
            });

            if (response.success) {
                setAnalytics(response.analytics);
                setRealtimeData(response.realtimeVisitors || []);
                setVisitorFlow(response.visitorFlow || []);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Fallback to demo data
            setAnalytics(generateDemoData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateDemoData = () => ({
        activeNow: 23,
        todayTotal: 456,
        weekTotal: 3421,
        monthTotal: 12456,
        avgDuration: 245,
        bounceRate: 32.5,
        conversionRate: 4.2,
        topPages: [
            { _id: '/projects', count: 234, avgDuration: 320 },
            { _id: '/about', count: 189, avgDuration: 180 },
            { _id: '/contact', count: 98, avgDuration: 150 }
        ],
        locations: [
            { _id: 'United States', count: 156, percentage: 34.2 },
            { _id: 'United Kingdom', count: 89, percentage: 19.5 },
            { _id: 'Germany', count: 67, percentage: 14.7 },
            { _id: 'Canada', count: 54, percentage: 11.8 },
            { _id: 'Australia', count: 43, percentage: 9.4 }
        ],
        devices: {
            desktop: 267,
            mobile: 156,
            tablet: 33
        },
        browsers: [
            { name: 'Chrome', count: 234, percentage: 51.3 },
            { name: 'Safari', count: 123, percentage: 27.0 },
            { name: 'Firefox', count: 67, percentage: 14.7 },
            { name: 'Edge', count: 32, percentage: 7.0 }
        ],
        hourlyData: Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            visitors: Math.floor(Math.random() * 50) + 10,
            pageViews: Math.floor(Math.random() * 100) + 30
        })),
        weeklyData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
            day,
            visitors: Math.floor(Math.random() * 200) + 100,
            pageViews: Math.floor(Math.random() * 400) + 200,
            newVisitors: Math.floor(Math.random() * 100) + 50,
            returningVisitors: Math.floor(Math.random() * 100) + 50
        })),
        referrers: [
            { source: 'Direct', count: 189, percentage: 41.4 },
            { source: 'Google', count: 123, percentage: 27.0 },
            { source: 'LinkedIn', count: 78, percentage: 17.1 },
            { source: 'GitHub', count: 45, percentage: 9.9 },
            { source: 'Twitter', count: 21, percentage: 4.6 }
        ],
        engagement: {
            totalClicks: 1234,
            avgClicksPerVisitor: 2.7,
            totalScrollDepth: 67.5,
            avgTimeOnPage: 185
        }
    });

    const stats = useMemo(() => {
        if (!analytics) return [];

        const previousTotal = analytics.weekTotal || 0;
        const currentTotal = analytics.todayTotal || 0;
        const change = previousTotal > 0 ? ((currentTotal - (previousTotal / 7)) / (previousTotal / 7) * 100).toFixed(1) : 0;

        return [
            {
                label: 'Active Now',
                value: analytics.activeNow || 0,
                change: 'Live',
                icon: Activity,
                color: '#10b981',
                isLive: true,
                description: 'Currently browsing',
                trend: 'up'
            },
            {
                label: 'Today\'s Visitors',
                value: analytics.todayTotal || 0,
                change: `${change >= 0 ? '+' : ''}${change}%`,
                icon: Users,
                color: theme.primary,
                description: 'vs. yesterday',
                trend: change >= 0 ? 'up' : 'down'
            },
            {
                label: 'Avg. Duration',
                value: formatDuration(analytics.avgDuration || 0),
                change: '+8.3%',
                icon: Timer,
                color: '#3b82f6',
                description: 'Time on site',
                trend: 'up'
            },
            {
                label: 'Bounce Rate',
                value: `${analytics.bounceRate || 0}%`,
                change: '-2.1%',
                icon: Target,
                color: '#f59e0b',
                description: 'Lower is better',
                trend: 'down',
                inverse: true
            },
            {
                label: 'Total Page Views',
                value: (analytics.todayTotal || 0) * 2.7,
                change: '+15.2%',
                icon: Eye,
                color: '#8b5cf6',
                description: 'Pages viewed',
                trend: 'up'
            },
            {
                label: 'Conversion Rate',
                value: `${analytics.conversionRate || 0}%`,
                change: '+3.4%',
                icon: Zap,
                color: '#ec4899',
                description: 'Contact forms',
                trend: 'up'
            }
        ];
    }, [analytics, theme.primary]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const topCountries = useMemo(() => {
        return (analytics?.locations || []).map(loc => ({
            country: loc._id || 'Unknown',
            visitors: loc.count,
            percentage: ((loc.count / (analytics.todayTotal || 1)) * 100).toFixed(1),
            flag: getCountryFlag(loc._id),
            change: (Math.random() * 20 - 5).toFixed(1)
        }));
    }, [analytics]);

    const devices = useMemo(() => {
        const total = (analytics?.devices?.desktop || 0) + 
                     (analytics?.devices?.mobile || 0) + 
                     (analytics?.devices?.tablet || 0) || 1;

        return [
            {
                type: 'Desktop',
                count: analytics?.devices?.desktop || 0,
                percentage: ((analytics?.devices?.desktop || 0) / total * 100).toFixed(1),
                icon: Monitor,
                color: '#3b82f6'
            },
            {
                type: 'Mobile',
                count: analytics?.devices?.mobile || 0,
                percentage: ((analytics?.devices?.mobile || 0) / total * 100).toFixed(1),
                icon: Smartphone,
                color: '#10b981'
            },
            {
                type: 'Tablet',
                count: analytics?.devices?.tablet || 0,
                percentage: ((analytics?.devices?.tablet || 0) / total * 100).toFixed(1),
                icon: Tablet,
                color: '#f59e0b'
            }
        ];
    }, [analytics]);

    const getCountryFlag = (country) => {
        const flags = {
            'United States': '🇺🇸',
            'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪',
            'Canada': '🇨🇦',
            'Australia': '🇦🇺',
            'France': '🇫🇷',
            'India': '🇮🇳',
            'Japan': '🇯🇵',
            'Brazil': '🇧🇷',
            'China': '🇨🇳'
        };
        return flags[country] || '🌍';
    };

    const exportData = useCallback(async (format) => {
        try {
            const response = await apiService.exportAnalytics({
                timeRange,
                format,
                type: 'visitors'
            });
            
            const blob = new Blob([response.data], { 
                type: format === 'csv' ? 'text/csv' : 'application/json' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `visitors-analytics-${timeRange}.${format}`;
            a.click();
            setShowExportMenu(false);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }, [timeRange]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-300 font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-sm">{entry.name}:</span>
                            <span className="font-semibold" style={{ color: entry.color }}>
                                {entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CHART_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-red-500/30 max-w-md"
                    >
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users size={40} className="text-red-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-400 mb-4">
                            Access Restricted
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Analytics are only available to the portfolio owner.
                        </p>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400 text-lg">Loading analytics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="Visitors Analytics" 
            subtitle="Track your portfolio performance and visitor insights in real-time"
        >
            <div className="p-6 space-y-6">
                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        {/* View Mode Tabs */}
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'detailed', label: 'Detailed', icon: PieChart },
                                { id: 'realtime', label: 'Real-time', icon: Activity }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setViewMode(mode.id)}
                                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                                        viewMode === mode.id
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                                            : 'text-slate-400 hover:text-slate-300'
                                    }`}
                                >
                                    <mode.icon size={16} />
                                    <span className="font-medium">{mode.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Real-time Indicator */}
                        {viewMode === 'realtime' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 text-sm font-medium">Live Updates</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Time Range Selector */}
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>

                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchAnalytics()}
                            disabled={refreshing}
                            className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        {/* Export Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2 font-medium"
                            >
                                <Download size={16} />
                                Export
                            </button>

                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10"
                                    >
                                        <button
                                            onClick={() => exportData('csv')}
                                            className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                                        >
                                            Export as CSV
                                        </button>
                                        <button
                                            onClick={() => exportData('json')}
                                            className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                                        >
                                            Export as JSON
                                        </button>
                                        <button
                                            onClick={() => exportData('pdf')}
                                            className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                                        >
                                            Export as PDF
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <stat.icon size={24} style={{ color: stat.color }} />
                                </div>
                                <div className="flex items-center gap-1">
                                    {stat.isLive ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            {stat.change}
                                        </span>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                            (stat.inverse ? stat.trend === 'down' : stat.trend === 'up')
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white mb-1">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                            </h3>
                            <p className="text-slate-500 text-xs">{stat.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Based on View Mode */}
                {viewMode === 'overview' && (
                    <>
                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Visitors Trend */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white">Visitor Trends</h3>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700">
                                            Visitors
                                        </button>
                                        <button className="px-3 py-1 text-slate-400 rounded-lg text-sm hover:bg-slate-700/50">
                                            Page Views
                                        </button>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={analytics?.weeklyData || []}>
                                        <defs>
                                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="day" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="visitors"
                                            stroke="#06b6d4"
                                            fillOpacity={1}
                                            fill="url(#colorVisitors)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="pageViews"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorPageViews)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Hourly Activity */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6">Hourly Activity</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics?.hourlyData?.slice(0, 12) || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="hour" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="visitors" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Locations and Devices */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Countries */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Globe size={24} className="text-cyan-400" />
                                        <h3 className="text-xl font-semibold text-white">Top Countries</h3>
                                    </div>
                                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-sm">
                                        View All <ExternalLink size={14} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {topCountries.slice(0, 5).map((country, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-all group cursor-pointer"
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{country.flag}</span>
                                                    <div>
                                                        <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                                                            {country.country}
                                                        </div>
                                                        <div className="text-slate-500 text-xs">
                                                            {country.percentage}% of total
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-cyan-400 font-bold text-lg">
                                                        {country.visitors.toLocaleString()}
                                                    </div>
                                                    <div className={`text-xs flex items-center gap-1 justify-end ${
                                                        parseFloat(country.change) >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {parseFloat(country.change) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {country.change}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${country.percentage}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Device Breakdown */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <Monitor size={24} className="text-cyan-400" />
                                    <h3 className="text-xl font-semibold text-white">Device Breakdown</h3>
                                </div>
                                
                                <div className="flex justify-center mb-8">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RechartsPie>
                                            <Pie
                                                data={devices}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="count"
                                            >
                                                {devices.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-3">
                                    {devices.map((device, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-all"
                                            style={{ backgroundColor: `${device.color}15` }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <device.icon size={20} style={{ color: device.color }} />
                                                    <span className="text-white font-medium">{device.type}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg" style={{ color: device.color }}>
                                                        {device.percentage}%
                                                    </div>
                                                    <div className="text-slate-400 text-sm">
                                                        {device.count.toLocaleString()} users
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${device.percentage}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: device.color }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Traffic Sources & Top Pages */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Traffic Sources */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6">Traffic Sources</h3>
                                <div className="space-y-3">
                                    {analytics?.referrers?.map((source, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                                    <Share2 size={18} className="text-cyan-400" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{source.source}</div>
                                                    <div className="text-slate-500 text-xs">{source.percentage}%</div>
                                                </div>
                                            </div>
                                            <div className="text-cyan-400 font-semibold">
                                                {source.count.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Pages */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6">Top Pages</h3>
                                <div className="space-y-3">
                                    {analytics?.topPages?.map((page, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                    <Eye size={18} className="text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                                                        {page._id}
                                                    </div>
                                                    <div className="text-slate-500 text-xs">
                                                        Avg. {formatDuration(page.avgDuration)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-purple-400 font-semibold">
                                                {page.count.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Real-time View */}
                {viewMode === 'realtime' && (
                    <div className="space-y-6">
                        {/* Real-time Activity Feed */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Activity size={24} className="text-green-400" />
                                    <h3 className="text-xl font-semibold text-white">Live Activity Feed</h3>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-sm font-medium">
                                        {analytics?.activeNow || 0} online
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {realtimeData.map((activity, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-all border border-slate-700/30"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <MousePointer size={18} className="text-cyan-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium mb-1">
                                                Visitor from {activity.location || 'Unknown'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-cyan-400" />
                                                    {activity.page || '/'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {activity.device === 'Desktop' ? <Monitor size={12} /> : <Smartphone size={12} />}
                                                    {activity.device || 'Unknown'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {activity.timestamp || 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs font-medium">
                                            Active
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Visitor Flow */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                            <h3 className="text-xl font-semibold text-white mb-6">Visitor Flow</h3>
                            <div className="space-y-4">
                                {visitorFlow.map((flow, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex-1 p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-slate-400 text-xs mb-1">{flow.from}</div>
                                            <div className="text-white font-semibold">{flow.fromCount}</div>
                                        </div>
                                        <ArrowUpRight className="text-cyan-400" />
                                        <div className="flex-1 p-3 bg-slate-900/50 rounded-lg text-center">
                                            <div className="text-slate-400 text-xs mb-1">{flow.to}</div>
                                            <div className="text-white font-semibold">{flow.toCount}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Visitors Table */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Recent Visitors</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500/50 w-64"
                                />
                            </div>
                            <button className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all flex items-center gap-2">
                                <Filter size={16} />
                                Filter
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Location</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Page</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Device</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Browser</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Duration</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Time</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(8)].map((_, index) => (
                                    <tr key={index} className="border-b border-slate-700/20 hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-cyan-400" />
                                                <span className="text-white">
                                                    {['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU'][index % 4]}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-300">/projects</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                {index % 2 === 0 ? <Monitor size={16} /> : <Smartphone size={16} />}
                                                {index % 2 === 0 ? 'Desktop' : 'Mobile'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-300">Chrome</td>
                                        <td className="px-4 py-4 text-slate-300">{Math.floor(Math.random() * 5)}m {Math.floor(Math.random() * 60)}s</td>
                                        <td className="px-4 py-4 text-slate-400">{index + 1}m ago</td>
                                        <td className="px-4 py-4">
                                            <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                                                <MoreVertical size={16} className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
                        <div className="text-slate-400 text-sm">
                            Showing 1 to 8 of 234 visitors
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all disabled:opacity-50">
                                Previous
                            </button>
                            <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all">
                                1
                            </button>
                            <button className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all">
                                2
                            </button>
                            <button className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all">
                                3
                            </button>
                            <button className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-all">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(100, 116, 139, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default VisitorsAnalytics;