// client/src/components/Dashboard/DashboardSideNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
    Home, FolderKanban, Settings, Palette, BarChart3, 
    Users, UserPlus, Image, Mail, MessageSquare, Bot,
    FileEdit, TrendingUp, LogOut, ArrowLeft, Menu, X,
    Wrench, User, GraduationCap, Activity, PieChart,
    Star, ChevronDown, ChevronRight, Circle,
    Zap, Shield, Crown, Sparkles, Bell, HelpCircle,
    Bookmark, Calendar, Clock, Globe, Award, Code
} from 'lucide-react';

const DashboardSideNavbar = ({ collapsed, setCollapsed, menuItems = [] }) => {
    const { user, userRole, logout } = useAuth();
    const { theme, isDark } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [expandedSections, setExpandedSections] = useState({});
    const [isScrolled, setIsScrolled] = useState(false);
    const [showTooltip, setShowTooltip] = useState(null);

    // Icon mapping
    const iconMap = {
        'fas fa-tachometer-alt': Home,
        'fas fa-project-diagram': FolderKanban,
        'fas fa-cogs': Wrench,
        'fas fa-palette': Palette,
        'fas fa-chart-bar': BarChart3,
        'fas fa-user-friends': TrendingUp,
        'fas fa-images': Image,
        'fas fa-envelope': Mail,
        'fas fa-users': Users,
        'fas fa-user-plus': UserPlus,
        'fas fa-comments': MessageSquare,
        'fas fa-robot': Bot,
        'fas fa-edit': FileEdit,
        'fas fa-cog': Settings,
        'fas fa-user': User,
        'fas fa-graduation-cap': GraduationCap,
        'fas fa-activity': Activity,
        'fas fa-pie-chart': PieChart,
        'fas fa-star': Star,
        'fas fa-star-half-alt': Star,
        'fas fa-code': Code,
        'fas fa-calendar': Calendar,
        'fas fa-bookmark': Bookmark,
        'fas fa-globe': Globe,
        'fas fa-award': Award,
        'fas fa-clock': Clock,
        'fas fa-bell': Bell,
        'fas fa-help-circle': HelpCircle
    };

    const getIcon = (iconClass) => iconMap[iconClass] || Home;

    // Group menu items by category
    const groupedMenuItems = menuItems.reduce((acc, item) => {
        const category = item.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Handle scroll in nav
    useEffect(() => {
        const navElement = document.querySelector('.sidebar-nav-scroll');
        if (!navElement) return;

        const handleScroll = () => {
            setIsScrolled(navElement.scrollTop > 10);
        };

        navElement.addEventListener('scroll', handleScroll);
        return () => navElement.removeEventListener('scroll', handleScroll);
    }, []);

    // Get role badge
    const getRoleBadge = () => {
        const badges = {
            admin: { icon: Crown, color: 'from-yellow-400 to-orange-500', label: 'Admin' },
            editor: { icon: Shield, color: 'from-blue-400 to-cyan-500', label: 'Editor' },
            user: { icon: User, color: 'from-purple-400 to-pink-500', label: 'User' }
        };
        return badges[userRole?.toLowerCase()] || badges.user;
    };

    const roleBadge = getRoleBadge();

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 280 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50 shadow-2xl"
            >
                {/* Header */}
                <div className={`flex-shrink-0 border-b border-slate-800/50 transition-all duration-300 ${
                    isScrolled ? 'shadow-lg bg-slate-900/95 backdrop-blur-xl' : ''
                }`}>
                    <div className="p-6">
                        <div className="flex items-center justify-between gap-3">
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                        <Zap size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Dashboard</h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'} Panel
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                            
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className={`p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group ${
                                    collapsed ? 'mx-auto' : ''
                                }`}
                            >
                                {collapsed ? (
                                    <Menu size={20} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                ) : (
                                    <X size={20} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-shrink-0 border-b border-slate-800/50 bg-gradient-to-br from-slate-800/30 to-transparent">
                    <div className={`p-4 ${collapsed ? 'px-3' : 'px-6'}`}>
                        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                            {/* Avatar */}
                            <div className="relative group">
                                <div className={`${collapsed ? 'w-12 h-12' : 'w-14 h-14'} rounded-xl bg-gradient-to-br ${roleBadge.color} flex items-center justify-center font-bold text-white text-lg shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                                    {user?.avatar ? (
                                        <img 
                                            src={user.avatar} 
                                            alt={user.name} 
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        user?.name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                {/* Online Status */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                                
                                {/* Role Badge on Avatar */}
                                {!collapsed && (
                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${roleBadge.color} flex items-center justify-center shadow-lg`}>
                                        <roleBadge.icon size={12} className="text-white" />
                                    </div>
                                )}
                            </div>

                            {/* User Details */}
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-sm font-semibold text-white truncate mb-0.5">
                                        {user?.name || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${roleBadge.color} text-white shadow-sm`}>
                                            <roleBadge.icon size={10} />
                                            {roleBadge.label}
                                        </span>
                                        <Circle size={4} className="text-slate-600" />
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Online
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Quick Stats (only when expanded) */}
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-3 gap-2 mt-4"
                            >
                                <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                    <p className="text-xs font-bold text-cyan-400">12</p>
                                    <p className="text-[10px] text-slate-500">Projects</p>
                                </div>
                                <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                    <p className="text-xs font-bold text-blue-400">847</p>
                                    <p className="text-[10px] text-slate-500">Views</p>
                                </div>
                                <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                    <p className="text-xs font-bold text-purple-400">5</p>
                                    <p className="text-[10px] text-slate-500">Tasks</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar sidebar-nav-scroll">
                    <div className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
                        {Object.keys(groupedMenuItems).length > 0 ? (
                            Object.entries(groupedMenuItems).map(([category, items], idx) => (
                                <div key={idx} className="mb-6">
                                    {/* Category Header */}
                                    {!collapsed && (
                                        <div className="px-3 mb-2">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                                <span>{category}</span>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                            </h3>
                                        </div>
                                    )}

                                    {/* Menu Items */}
                                    {items.map((item, index) => (
                                        <NavItem
                                            key={index}
                                            item={item}
                                            collapsed={collapsed}
                                            isActive={location.pathname === item.path}
                                            getIcon={getIcon}
                                            showTooltip={showTooltip}
                                            setShowTooltip={setShowTooltip}
                                        />
                                    ))}
                                </div>
                            ))
                        ) : (
                            // Fallback if no grouped items
                            menuItems.map((item, index) => (
                                <NavItem
                                    key={index}
                                    item={item}
                                    collapsed={collapsed}
                                    isActive={location.pathname === item.path}
                                    getIcon={getIcon}
                                    showTooltip={showTooltip}
                                    setShowTooltip={setShowTooltip}
                                />
                            ))
                        )}
                    </div>
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-slate-800/50 bg-gradient-to-b from-transparent to-slate-950/50 backdrop-blur-sm">
                    <div className={`p-4 space-y-2 ${collapsed ? 'px-2' : ''}`}>
                        {/* Settings */}
                        <Link
                            to="/dashboard/settings"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                                location.pathname === '/dashboard/settings'
                                    ? 'bg-slate-800 text-cyan-400 shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            } ${collapsed ? 'justify-center' : ''}`}
                        >
                            <Settings size={18} className={location.pathname === '/dashboard/settings' ? 'text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'} />
                            {!collapsed && (
                                <span className="text-sm font-medium">Settings</span>
                            )}
                        </Link>

                        {/* Back to Portfolio */}
                        <Link
                            to="/"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 ${
                                collapsed ? 'justify-center' : ''
                            }`}
                        >
                            <ArrowLeft size={18} className="group-hover:animate-pulse" />
                            {!collapsed && (
                                <span className="text-sm font-medium">Back to Portfolio</span>
                            )}
                        </Link>

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 ${
                                collapsed ? 'justify-center' : ''
                            }`}
                        >
                            <LogOut size={18} className="group-hover:animate-pulse" />
                            {!collapsed && (
                                <span className="text-sm font-medium">Logout</span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Sidebar - Slide from left */}
            <AnimatePresence>
                {!collapsed && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCollapsed(true)}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />

                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col"
                        >
                            {/* Same content as desktop but without collapse state */}
                            <MobileSidebarContent
                                user={user}
                                userRole={userRole}
                                roleBadge={roleBadge}
                                groupedMenuItems={groupedMenuItems}
                                menuItems={menuItems}
                                location={location}
                                getIcon={getIcon}
                                logout={logout}
                                onClose={() => setCollapsed(true)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// Navigation Item Component
const NavItem = ({ item, collapsed, isActive, getIcon, showTooltip, setShowTooltip }) => {
    const Icon = getIcon(item.icon);
    const hasNotification = item.badge && parseInt(item.badge) > 0;

    return (
        <div className="relative">
            <Link
                to={item.path}
                onMouseEnter={() => collapsed && setShowTooltip(item.label)}
                onMouseLeave={() => setShowTooltip(null)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20 border border-cyan-500/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                } ${collapsed ? 'justify-center' : ''}`}
            >
                {/* Active Indicator */}
                {isActive && (
                    <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full"
                    />
                )}

                {/* Icon */}
                <div className="relative">
                    <Icon 
                        size={20} 
                        className={`${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'} transition-colors flex-shrink-0`}
                    />
                    {/* Notification Badge */}
                    {hasNotification && collapsed && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </div>

                {/* Label */}
                {!collapsed && (
                    <>
                        <span className="text-sm font-medium flex-1 truncate">
                            {item.label}
                        </span>
                        {hasNotification && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold border border-red-500/30">
                                {item.badge}
                            </span>
                        )}
                    </>
                )}

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'opacity-100' : ''
                }`}></div>
            </Link>

            {/* Tooltip for collapsed state */}
            <AnimatePresence>
                {collapsed && showTooltip === item.label && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50"
                    >
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Mobile Sidebar Content
const MobileSidebarContent = ({ 
    user, 
    userRole, 
    roleBadge, 
    groupedMenuItems, 
    menuItems, 
    location, 
    getIcon, 
    logout,
    onClose 
}) => {
    return (
        <>
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Zap size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Dashboard</h2>
                            <p className="text-xs text-slate-400">
                                {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'} Panel
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* User Info */}
            <div className="flex-shrink-0 p-6 border-b border-slate-800 bg-slate-800/30">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${roleBadge.color} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${roleBadge.color} text-white mt-1`}>
                            <roleBadge.icon size={10} />
                            {roleBadge.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                {Object.entries(groupedMenuItems).map(([category, items], idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {category}
                        </h3>
                        <div className="space-y-1">
                            {items.map((item, index) => {
                                const Icon = getIcon(item.icon);
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                                                : 'text-slate-400 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-sm font-medium flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-slate-800 space-y-2">
                <Link
                    to="/dashboard/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                </Link>
                <Link
                    to="/"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Portfolio</span>
                </Link>
                <button
                    onClick={() => { logout(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </>
    );
};

export default DashboardSideNavbar;