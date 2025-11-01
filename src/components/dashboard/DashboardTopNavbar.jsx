// client/src/components/Dashboard/DashboardTopNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Search, User, Settings, LogOut, Menu, X,
    Moon, Sun, Maximize2, Minimize2, ChevronDown,
    Mail, MessageSquare, Calendar, Clock, Check,
    AlertCircle, Info, CheckCircle, XCircle,
    Command, Filter, Download, Upload, Share2,
    Activity, TrendingUp, Zap,
    Star, Bookmark, HelpCircle, Home, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const DashboardTopNavbar = ({ 
    onToggleSidebar, 
    sidebarCollapsed,
    breadcrumbs = [],
    showBreadcrumbs = true,
    showSearch = true 
}) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const { notifications: systemNotifications } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(3);

    const searchInputRef = useRef(null);

    // Sample notifications
    useEffect(() => {
        setNotifications([
            {
                id: 1,
                type: 'success',
                title: 'Project Published',
                message: 'Your project has been published successfully',
                time: new Date(Date.now() - 5 * 60 * 1000),
                read: false,
                icon: CheckCircle,
                link: '/dashboard/projects'
            },
            {
                id: 2,
                type: 'info',
                title: 'New Collaborator',
                message: 'John Doe joined your project',
                time: new Date(Date.now() - 30 * 60 * 1000),
                read: false,
                icon: User,
                link: '/dashboard/collaborators'
            },
            {
                id: 3,
                type: 'warning',
                title: 'Deadline Approaching',
                message: 'Project deadline is in 2 days',
                time: new Date(Date.now() - 2 * 60 * 60 * 1000),
                read: true,
                icon: Clock,
                link: '/dashboard/projects'
            },
            {
                id: 4,
                type: 'message',
                title: 'New Message',
                message: 'You have 3 unread messages',
                time: new Date(Date.now() - 3 * 60 * 60 * 1000),
                read: true,
                icon: MessageSquare,
                link: '/dashboard/messages'
            }
        ]);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Cmd/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            // Escape to close search
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
                setQuickActionsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.notifications-dropdown')) setNotificationsOpen(false);
            if (!e.target.closest('.user-menu-dropdown')) setUserMenuOpen(false);
            if (!e.target.closest('.quick-actions-dropdown')) setQuickActionsOpen(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Mark notification as read
    const markAsRead = (id) => {
        setNotifications(notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    // Quick actions
    const quickActions = [
        { icon: Upload, label: 'Upload File', action: () => navigate('/dashboard/media') },
        { icon: Download, label: 'Export Data', action: () => {} },
        { icon: Share2, label: 'Share', action: () => {} },
        { icon: Filter, label: 'Filter', action: () => {} }
    ];

    // Search suggestions
    const searchSuggestions = [
        { type: 'page', label: 'Projects', icon: Home, path: '/dashboard/projects' },
        { type: 'page', label: 'Analytics', icon: TrendingUp, path: '/dashboard/analytics' },
        { type: 'page', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
        { type: 'action', label: 'Create New Project', icon: Zap, action: () => {} }
    ];

    const filteredSuggestions = searchSuggestions.filter(s => 
        s.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Main Top Navbar */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg">
                <div className="h-16 sm:h-18 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-full gap-4">
                        {/* Left Section */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={onToggleSidebar}
                                className="lg:hidden p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all"
                            >
                                <Menu size={20} className="text-slate-300" />
                            </button>

                            {/* Desktop Sidebar Toggle */}
                            <button
                                onClick={onToggleSidebar}
                                className="hidden lg:flex items-center justify-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all group"
                                title="Toggle Sidebar"
                            >
                                <Menu size={20} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </button>

                            {/* Breadcrumbs - Desktop Only */}
                            {showBreadcrumbs && breadcrumbs.length > 0 && (
                                <nav className="hidden md:flex items-center gap-2 text-sm">
                                    <Link 
                                        to="/dashboard" 
                                        className="text-slate-400 hover:text-cyan-400 transition-colors"
                                    >
                                        <Home size={16} />
                                    </Link>
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={index}>
                                            <span className="text-slate-600">/</span>
                                            {crumb.path ? (
                                                <Link
                                                    to={crumb.path}
                                                    className="text-slate-400 hover:text-cyan-400 transition-colors truncate max-w-[150px]"
                                                >
                                                    {crumb.label}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-200 font-medium truncate max-w-[150px]">
                                                    {crumb.label}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </nav>
                            )}

                            {/* Search Bar - Desktop */}
                            {showSearch && (
                                <div className="hidden md:block flex-1 max-w-md lg:max-w-lg xl:max-w-xl">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setSearchOpen(true)}
                                            placeholder="Search dashboard... (⌘K)"
                                            className="w-full pl-10 pr-20 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        />
                                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-[10px] text-slate-400 font-mono">
                                            <Command size={10} />K
                                        </kbd>
                                    </div>

                                    {/* Search Dropdown */}
                                    <AnimatePresence>
                                        {searchOpen && searchQuery && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-w-md lg:max-w-lg xl:max-w-xl"
                                            >
                                                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                                                    {filteredSuggestions.length > 0 ? (
                                                        filteredSuggestions.map((suggestion, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    if (suggestion.path) navigate(suggestion.path);
                                                                    if (suggestion.action) suggestion.action();
                                                                    setSearchOpen(false);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 text-left transition-colors group"
                                                            >
                                                                <suggestion.icon size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-slate-200 font-medium">{suggestion.label}</p>
                                                                    <p className="text-xs text-slate-500 capitalize">{suggestion.type}</p>
                                                                </div>
                                                                <ArrowLeft size={14} className="text-slate-600 rotate-180" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Search size={32} className="text-slate-600 mx-auto mb-2" />
                                                            <p className="text-slate-400 text-sm">No results found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-2">
                            {/* Search Icon - Mobile */}
                            {showSearch && (
                                <button
                                    onClick={() => setSearchOpen(!searchOpen)}
                                    className="md:hidden p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all"
                                >
                                    <Search size={18} className="text-slate-400" />
                                </button>
                            )}

                            {/* Quick Actions */}
                            <div className="hidden xl:flex items-center gap-1 quick-actions-dropdown relative">
                                <button
                                    onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all"
                                    title="Quick Actions"
                                >
                                    <Zap size={18} className="text-slate-400" />
                                </button>

                                <AnimatePresence>
                                    {quickActionsOpen && (
                                        <QuickActionsDropdown 
                                            actions={quickActions}
                                            onClose={() => setQuickActionsOpen(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="hidden sm:flex items-center justify-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all group"
                                title="Toggle Theme"
                            >
                                {isDark ? (
                                    <Sun size={18} className="text-slate-400 group-hover:text-yellow-400 transition-colors" />
                                ) : (
                                    <Moon size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                )}
                            </button>

                            {/* Fullscreen Toggle */}
                            <button
                                onClick={toggleFullscreen}
                                className="hidden lg:flex items-center justify-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all group"
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? (
                                    <Minimize2 size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                ) : (
                                    <Maximize2 size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                )}
                            </button>

                            {/* Notifications */}
                            <div className="relative notifications-dropdown">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all group"
                                >
                                    <Bell size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse border-2 border-slate-900">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {notificationsOpen && (
                                        <NotificationsDropdown
                                            notifications={notifications}
                                            onMarkAsRead={markAsRead}
                                            onMarkAllAsRead={markAllAsRead}
                                            onClose={() => setNotificationsOpen(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* User Menu */}
                            <div className="relative user-menu-dropdown">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-cyan-500/50 transition-all group"
                                >
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-lg object-cover" />
                                        ) : (
                                            user?.name?.charAt(0)?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-slate-200 max-w-[100px] truncate">
                                        {user?.name || 'User'}
                                    </span>
                                    <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <UserDropdown
                                            user={user}
                                            onLogout={logout}
                                            onClose={() => setUserMenuOpen(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Search Overlay */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-xl"
                        >
                            <div className="p-4">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search dashboard..."
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => {
                                            setSearchOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                {searchQuery && filteredSuggestions.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (suggestion.path) navigate(suggestion.path);
                                                    if (suggestion.action) suggestion.action();
                                                    setSearchOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                                            >
                                                <suggestion.icon size={18} className="text-slate-400" />
                                                <span className="text-sm text-slate-200">{suggestion.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
};

// Notifications Dropdown Component
const NotificationsDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
    const navigate = useNavigate();

    const getNotificationStyle = (type) => {
        const styles = {
            success: 'bg-green-500/20 text-green-400 border-green-500/30',
            info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            error: 'bg-red-500/20 text-red-400 border-red-500/30',
            message: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
        return styles[type] || styles.info;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                <div>
                    <h3 className="text-white font-semibold text-sm">Notifications</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        You have {notifications.filter(n => !n.read).length} unread notifications
                    </p>
                </div>
                <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                    Mark all read
                </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => {
                                if (notification.link) {
                                    navigate(notification.link);
                                    onClose();
                                }
                                if (!notification.read) {
                                    onMarkAsRead(notification.id);
                                }
                            }}
                            className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-slate-700/20' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getNotificationStyle(notification.type)}`}>
                                    <notification.icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-white font-medium text-sm">
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatDistanceToNow(notification.time, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <Bell size={48} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No notifications</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                <button className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 font-medium py-2 transition-colors">
                    View all notifications
                </button>
            </div>
        </motion.div>
    );
};

// User Dropdown Component
const UserDropdown = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();

    const menuItems = [
        { icon: User, label: 'Profile', path: '/dashboard/profile' },
        { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
        { icon: Activity, label: 'Activity', path: '/dashboard/activity' },
        { icon: Bookmark, label: 'Saved Items', path: '/dashboard/saved' },
        { icon: HelpCircle, label: 'Help & Support', path: '/help' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        >
            {/* User Info */}
            <div className="p-4 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                            user?.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user?.name || 'User'}</p>
                        <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium border border-cyan-500/30">
                        Pro Plan
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Online
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            navigate(item.path);
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                        <item.icon size={18} />
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-slate-700">
                <button
                    onClick={() => {
                        onLogout();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </motion.div>
    );
};

// Quick Actions Dropdown
const QuickActionsDropdown = ({ actions, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        >
            <div className="p-2">
                <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Quick Actions</h3>
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.action();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                        <action.icon size={18} />
                        <span className="text-sm">{action.label}</span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default DashboardTopNavbar;