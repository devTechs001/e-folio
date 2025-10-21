import React from 'react';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';

const DashboardTopNavbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();

    return (
        <div style={{
            height: '70px',
            background: `${theme.surface}90`,
            borderBottom: `1px solid ${theme.border}`,
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px'
        }}>
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    width: '400px',
                    maxWidth: '100%'
                }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: theme.textSecondary
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        style={{
                            width: '100%',
                            padding: '10px 16px 10px 40px',
                            background: `${theme.background}80`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '10px',
                            color: theme.text,
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Notifications */}
                <button style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${theme.primary}15`,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.primary,
                    position: 'relative',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                >
                    <Bell size={20} />
                    <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ef4444'
                    }} />
                </button>

                {/* Settings */}
                <Link to="/dashboard/settings" style={{ textDecoration: 'none' }}>
                    <button style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${theme.primary}15`,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.primary,
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                    onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                    >
                        <Settings size={20} />
                    </button>
                </Link>

                {/* User Profile */}
                <Link to="/dashboard/profile" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '6px 12px 6px 6px',
                        background: `${theme.primary}15`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                    onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: theme.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.background,
                            fontWeight: '700',
                            fontSize: '14px'
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{
                            color: theme.text,
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            {user?.name || 'User'}
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default DashboardTopNavbar;
