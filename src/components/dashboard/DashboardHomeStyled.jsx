import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Eye,
    Zap,
    FolderKanban,
    MessageSquare,
    Calendar,
    Clock,
    ArrowUp,
    ArrowDown,
    Bell,
    Star,
    Heart,
    Share2,
    Download,
    Plus,
    Activity,
    Target,
    Award,
    Rocket,
    CheckCircle,
    AlertCircle,
    Info,
    RefreshCw,
    ExternalLink,
    TrendingDown,
    BarChart3,
    MapPin,
    Globe,
    Smartphone,
    Monitor,
    Video,
    FileText,
    Code,
    Settings,
    Filter,
    Search,
    MoreVertical,
    ArrowRight,
    Briefcase,
    BookOpen,
    Coffee,
    Sparkles,
    Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { format, formatDistanceToNow, subDays, isToday, parseISO } from 'date-fns';

const DashboardHome = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError } = useNotifications();
    const wsRef = useRef(null);

    const [stats, setStats] = useState({
        totalProjects: 0,
        totalVisitors: 0,
        collaborators: 0,
        messages: 0,
        growth: {
            projects: 0,
            visitors: 0,
            collaborators: 0,
            messages: 0
        }
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [quickStats, setQuickStats] = useState({});
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [topSkills, setTopSkills] = useState([]);
    const [deviceStats, setDeviceStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [onlineUsers, setOnlineUsers] = useState(0);

    // Load initial data
    useEffect(() => {
        loadDashboardData();
        setupWebSocket();
        
        // Refresh data every 30 seconds
        const refreshInterval = setInterval(() => {
            loadDashboardData(true);
        }, 30000);

        return () => {
            clearInterval(refreshInterval);
            if (wsRef.current && typeof wsRef.current.close === 'function') {
                wsRef.current.close();
            }
        };
    }, []);

    const setupWebSocket = async () => {
        try {
            // WebSocket is handled by SocketContext, just mark as connected
            await apiService.connectToDashboard();
            wsRef.current = { close: () => {} }; // Dummy object for cleanup
        } catch (error) {
            console.warn('WebSocket setup skipped:', error);
        }
    };

    const handleRealtimeUpdate = (data) => {
        switch (data.type) {
            case 'stats_update':
                setStats(prev => ({ ...prev, ...data.stats }));
                break;
            case 'new_activity':
                setRecentActivity(prev => [data.activity, ...prev.slice(0, 9)]);
                break;
            case 'new_notification':
                setNotifications(prev => [data.notification, ...prev]);
                break;
            case 'visitor_online':
                setOnlineUsers(data.count);
                break;
            case 'new_message':
                setStats(prev => ({
                    ...prev,
                    messages: prev.messages + 1
                }));
                break;
            default:
                break;
        }
        setLastUpdate(new Date());
    };

    const loadDashboardData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setRefreshing(true);

            const [
                statsRes,
                activityRes,
                performanceRes,
                eventsRes,
                tasksRes,
                projectsRes,
                notificationsRes,
                skillsRes,
                deviceRes
            ] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getRecentActivity({ limit: 10 }),
                apiService.getPerformanceData({ days: 7 }),
                apiService.getUpcomingEvents(),
                apiService.getTasks({ status: 'pending', limit: 5 }),
                apiService.getRecentProjects({ limit: 4 }),
                apiService.getNotifications({ limit: 5 }),
                apiService.getTopSkills({ limit: 5 }),
                apiService.getDeviceStats()
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (activityRes.success) setRecentActivity(activityRes.data);
            if (performanceRes.success) setPerformanceData(performanceRes.data);
            if (eventsRes.success) setUpcomingEvents(eventsRes.data);
            if (tasksRes.success) setTasks(tasksRes.data);
            if (projectsRes.success) setRecentProjects(projectsRes.data);
            if (notificationsRes.success) setNotifications(notificationsRes.data);
            if (skillsRes.success) setTopSkills(skillsRes.data);
            if (deviceRes.success) setDeviceStats(deviceRes.data);

            setLastUpdate(new Date());
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            showError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadDashboardData();
        success('Dashboard refreshed');
    };

    const markTaskComplete = async (taskId) => {
        try {
            await apiService.updateTask(taskId, { status: 'completed' });
            setTasks(tasks.filter(t => t._id !== taskId));
            success('Task completed!');
        } catch (err) {
            showError('Failed to update task');
        }
    };

    const dismissNotification = async (notificationId) => {
        try {
            await apiService.dismissNotification(notificationId);
            setNotifications(notifications.filter(n => n._id !== notificationId));
        } catch (err) {
            showError('Failed to dismiss notification');
        }
    };

    const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

    const statCards = [
        {
            label: 'Total Projects',
            value: stats.totalProjects,
            icon: FolderKanban,
            color: 'cyan',
            gradient: 'from-cyan-500 to-blue-500',
            change: stats.growth?.projects || 0,
            link: '/dashboard/projects'
        },
        {
            label: 'Total Visitors',
            value: stats.totalVisitors,
            icon: Eye,
            color: 'blue',
            gradient: 'from-blue-500 to-purple-500',
            change: stats.growth?.visitors || 0,
            link: '/dashboard/analytics/visitors'
        },
        {
            label: 'Collaborators',
            value: stats.collaborators,
            icon: Users,
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500',
            change: stats.growth?.collaborators || 0,
            link: '/dashboard/collaborators'
        },
        {
            label: 'Messages',
            value: stats.messages,
            icon: MessageSquare,
            color: 'pink',
            gradient: 'from-pink-500 to-rose-500',
            change: stats.growth?.messages || 0,
            link: '/dashboard/messages'
        }
    ];

    const quickActions = [
        { icon: Plus, label: 'New Project', color: 'cyan', action: () => window.location.href = '/dashboard/projects/new' },
        { icon: Upload, label: 'Upload Media', color: 'blue', action: () => window.location.href = '/dashboard/media' },
        { icon: Users, label: 'Invite Collaborator', color: 'purple', action: () => window.location.href = '/dashboard/collaborators' },
        { icon: Settings, label: 'Settings', color: 'pink', action: () => window.location.href = '/dashboard/settings' }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`Welcome back, ${user?.name || 'User'}! 👋`}
            subtitle="Here's what's happening with your portfolio today"
            actions={
                <div className="flex items-center gap-3">
                    {/* Online Indicator */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">
                            {onlineUsers} online
                        </span>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock size={14} />
                        <span>Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => stat.link && (window.location.href = stat.link)}
                            className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-xl bg-${stat.color}-500/20 border border-${stat.color}-500/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon size={28} className={`text-${stat.color}-400`} />
                                    </div>
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                        stat.change >= 0
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {stat.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                        {Math.abs(stat.change)}%
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                                <h3 className="text-4xl font-bold text-white mb-1">
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                </h3>
                                <p className="text-slate-500 text-xs">vs. last period</p>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} className="text-cyan-400" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={action.action}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-${action.color}-500/50 transition-all group`}
                        >
                            <action.icon size={24} className={`text-${action.color}-400 mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                            <span className="text-white text-sm font-medium">{action.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Chart - 2 columns */}
                    <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-1">Performance Overview</h3>
                                <p className="text-slate-400 text-sm">Last 7 days activity</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
                                    Views
                                </button>
                                <button className="px-3 py-1 text-slate-400 hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-colors">
                                    Visitors
                                </button>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#06b6d4"
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Recent Activity - 1 column */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                <Activity size={20} />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence>
                                {recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={activity._id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            getActivityColor(activity.type)
                                        }`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium mb-1">
                                                {activity.action}
                                            </p>
                                            <p className="text-slate-400 text-xs flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Secondary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Events */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Calendar size={24} className="text-cyan-400" />
                                Upcoming Events
                            </h3>
                            <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar size={48} className="text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">No upcoming events</p>
                                </div>
                            ) : (
                                upcomingEvents.map((event, index) => (
                                    <div
                                        key={event._id || index}
                                        className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
                                    >
                                        <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-cyan-400 font-bold text-xl">
                                                {format(parseISO(event.date), 'dd')}
                                            </span>
                                            <span className="text-cyan-400 text-xs">
                                                {format(parseISO(event.date), 'MMM')}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-medium mb-1">{event.title}</h4>
                                            <p className="text-slate-400 text-sm flex items-center gap-1">
                                                <Clock size={12} />
                                                {format(parseISO(event.date), 'h:mm a')}
                                            </p>
                                        </div>
                                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                            <MoreVertical size={16} className="text-slate-400" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <CheckCircle size={24} className="text-cyan-400" />
                                Tasks ({tasks.length})
                            </h3>
                            <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                                Add Task
                            </button>
                        </div>
                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle size={48} className="text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">All tasks completed! 🎉</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors group"
                                    >
                                        <button
                                            onClick={() => markTaskComplete(task._id)}
                                            className="w-6 h-6 rounded border-2 border-slate-600 hover:border-cyan-500 transition-colors flex items-center justify-center"
                                        >
                                            <CheckCircle size={16} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-1">{task.title}</p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded ${
                                                    task.priority === 'high'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : task.priority === 'medium'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="text-slate-400 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {format(parseISO(task.dueDate), 'MMM dd')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Projects */}
                    <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Recent Projects</h3>
                            <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-2">
                                View All
                                <ArrowRight size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentProjects.map((project, index) => (
                                <motion.div
                                    key={project._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-slate-900/50 rounded-xl overflow-hidden hover:bg-slate-900/70 transition-all cursor-pointer border border-slate-700/30 hover:border-cyan-500/50"
                                >
                                    {project.thumbnail && (
                                        <div className="h-32 overflow-hidden">
                                            <img
                                                src={project.thumbnail}
                                                alt={project.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h4 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                                            {project.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} />
                                                {project.views || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart size={12} />
                                                {project.likes || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDistanceToNow(parseISO(project.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Device Stats */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-xl font-semibold text-white mb-6">Device Breakdown</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={deviceStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deviceStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-4">
                            {deviceStats.map((device, index) => {
                                const Icon = device.name === 'Desktop' ? Monitor : device.name === 'Mobile' ? Smartphone : Tablet;
                                return (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} style={{ color: COLORS[index] }} />
                                            <span className="text-slate-300 text-sm">{device.name}</span>
                                        </div>
                                        <span className="text-white font-semibold">{device.percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {notifications.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Bell size={24} className="text-cyan-400" />
                                Notifications ({notifications.length})
                            </h3>
                            <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                                Mark all as read
                            </button>
                        </div>
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        notification.type === 'success'
                                            ? 'bg-green-500/20 border border-green-500/30'
                                            : notification.type === 'warning'
                                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                                            : notification.type === 'error'
                                            ? 'bg-red-500/20 border border-red-500/30'
                                            : 'bg-cyan-500/20 border border-cyan-500/30'
                                    }`}>
                                        {notification.type === 'success' ? (
                                            <CheckCircle size={20} className="text-green-400" />
                                        ) : notification.type === 'warning' ? (
                                            <AlertCircle size={20} className="text-yellow-400" />
                                        ) : notification.type === 'error' ? (
                                            <AlertCircle size={20} className="text-red-400" />
                                        ) : (
                                            <Info size={20} className="text-cyan-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{notification.title}</p>
                                        <p className="text-slate-400 text-sm mb-2">{notification.message}</p>
                                        <p className="text-slate-500 text-xs">
                                            {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => dismissNotification(notification._id)}
                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

// Helper functions
const getActivityIcon = (type) => {
    const icons = {
        project: <FolderKanban size={20} className="text-cyan-400" />,
        message: <MessageSquare size={20} className="text-blue-400" />,
        visitor: <Eye size={20} className="text-purple-400" />,
        collaboration: <Users size={20} className="text-pink-400" />,
        update: <Activity size={20} className="text-green-400" />,
        default: <Sparkles size={20} className="text-cyan-400" />
    };
    return icons[type] || icons.default;
};

const getActivityColor = (type) => {
    const colors = {
        project: 'bg-cyan-500/20 border border-cyan-500/30',
        message: 'bg-blue-500/20 border border-blue-500/30',
        visitor: 'bg-purple-500/20 border border-purple-500/30',
        collaboration: 'bg-pink-500/20 border border-pink-500/30',
        update: 'bg-green-500/20 border border-green-500/30',
        default: 'bg-cyan-500/20 border border-cyan-500/30'
    };
    return colors[type] || colors.default;
};

export default DashboardHome;