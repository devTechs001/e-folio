import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
    Home, FolderKanban, Settings, Palette, BarChart3, 
    Users, UserPlus, Image, Mail, MessageSquare, Bot,
    FileEdit, TrendingUp, LogOut, ArrowLeft, Menu, X,
    Wrench
} from 'lucide-react';

const DashboardSideNavbar = ({ collapsed, setCollapsed, menuItems }) => {
    const { user, userRole, logout } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();

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
        'fas fa-cog': Settings
    };

    const getIcon = (iconClass) => {
        const IconComponent = iconMap[iconClass] || Home;
        return IconComponent;
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div 
            className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}
            style={{
                width: collapsed ? '80px' : '280px',
                background: `linear-gradient(135deg, ${theme.surface}, ${theme.background})`,
                borderRight: `2px solid ${theme.primary}`,
                transition: 'width 0.3s ease',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                boxShadow: `4px 0 20px ${theme.primary}20`,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div 
                className="sidebar-header"
                style={{
                    padding: '24px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}
            >
                {!collapsed && (
                    <div>
                        <h3 style={{ 
                            color: theme.primary, 
                            margin: 0, 
                            fontSize: '20px',
                            fontWeight: '700',
                            fontFamily: theme.fontHeading
                        }}>
                            Dashboard
                        </h3>
                        <p style={{ 
                            color: theme.textSecondary, 
                            margin: '4px 0 0', 
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Panel
                        </p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: `${theme.primary}15`,
                        border: `1px solid ${theme.primary}30`,
                        borderRadius: '8px',
                        color: theme.primary,
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = `${theme.primary}30`;
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = `${theme.primary}15`;
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {collapsed ? <Menu size={20} /> : <X size={20} />}
                </button>
            </div>

            {/* User Info */}
            <div 
                className="user-info"
                style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0,
                    background: `${theme.primary}08`
                }}
            >
                <div 
                    className="user-avatar"
                    style={{
                        width: collapsed ? '40px' : '48px',
                        height: collapsed ? '40px' : '48px',
                        background: theme.gradient,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.background,
                        fontWeight: '700',
                        fontSize: '18px',
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${theme.primary}40`
                    }}
                >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ 
                            color: theme.text, 
                            margin: 0, 
                            fontSize: '15px', 
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {user?.name || 'User'}
                        </p>
                        <p style={{ 
                            color: theme.textSecondary, 
                            margin: 0, 
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                )}
            </div>

            {/* SCROLLABLE Navigation Menu */}
            <nav 
                className="sidebar-nav scrollable-menu"
                style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '12px 0',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${theme.primary}40 transparent`
                }}
            >
                <style>{`
                    .scrollable-menu::-webkit-scrollbar {
                        width: 6px;
                    }
                    .scrollable-menu::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .scrollable-menu::-webkit-scrollbar-thumb {
                        background: ${theme.primary}40;
                        border-radius: 3px;
                    }
                    .scrollable-menu::-webkit-scrollbar-thumb:hover {
                        background: ${theme.primary}60;
                    }
                `}</style>
                {menuItems.map((item, index) => {
                    const Icon = getIcon(item.icon);
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: collapsed ? '14px 20px' : '14px 24px',
                                margin: '4px 12px',
                                color: isActive ? theme.background : theme.text,
                                textDecoration: 'none',
                                background: isActive ? theme.gradient : 'transparent',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : '500',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: isActive ? `0 4px 12px ${theme.primary}40` : 'none'
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = `${theme.primary}15`;
                                    e.currentTarget.style.color = theme.primary;
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = theme.text;
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }
                            }}
                        >
                            <Icon 
                                size={20} 
                                style={{ 
                                    minWidth: '20px',
                                    marginRight: collapsed ? 0 : '12px'
                                }} 
                            />
                            {!collapsed && (
                                <span style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* STATIC Footer Section */}
            <div 
                className="sidebar-footer"
                style={{
                    padding: '16px',
                    borderTop: `1px solid ${theme.border}`,
                    flexShrink: 0,
                    background: `${theme.surface}80`,
                    backdropFilter: 'blur(10px)'
                }}
            >
                {/* Settings */}
                <Link
                    to="/dashboard/settings"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: collapsed ? '12px' : '12px 16px',
                        margin: '8px 0',
                        color: theme.text,
                        textDecoration: 'none',
                        background: location.pathname === '/dashboard/settings' ? `${theme.primary}20` : `${theme.primary}08`,
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: '500',
                        justifyContent: collapsed ? 'center' : 'flex-start'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = `${theme.primary}25`;
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = location.pathname === '/dashboard/settings' ? `${theme.primary}20` : `${theme.primary}08`;
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <Settings size={18} style={{ marginRight: collapsed ? 0 : '10px' }} />
                    {!collapsed && <span>Settings</span>}
                </Link>

                {/* Back to Portfolio */}
                <Link
                    to="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: collapsed ? '12px' : '12px 16px',
                        margin: '8px 0',
                        color: theme.text,
                        textDecoration: 'none',
                        background: `${theme.accent}15`,
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: '500',
                        justifyContent: collapsed ? 'center' : 'flex-start'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = `${theme.accent}25`;
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = `${theme.accent}15`;
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <ArrowLeft size={18} style={{ marginRight: collapsed ? 0 : '10px' }} />
                    {!collapsed && <span>Back to Portfolio</span>}
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: collapsed ? '12px' : '12px 16px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        marginTop: '8px',
                        justifyContent: collapsed ? 'center' : 'flex-start'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <LogOut size={18} style={{ marginRight: collapsed ? 0 : '10px' }} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default DashboardSideNavbar;
