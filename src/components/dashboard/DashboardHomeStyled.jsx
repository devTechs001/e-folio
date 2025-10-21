import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Zap, FolderKanban, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardLayout from './DashboardLayout';

const DashboardHome = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const stats = [
        { label: 'Total Projects', value: '24', icon: FolderKanban, color: theme.primary },
        { label: 'Total Visitors', value: '12.8K', icon: Eye, color: '#3b82f6' },
        { label: 'Collaborators', value: '8', icon: Users, color: '#10b981' },
        { label: 'Messages', value: '47', icon: MessageSquare, color: '#f59e0b' }
    ];

    const recentActivity = [
        { action: 'New project added', time: '2 hours ago', icon: FolderKanban, color: theme.primary },
        { action: 'Message from John', time: '5 hours ago', icon: MessageSquare, color: '#3b82f6' },
        { action: 'Profile viewed', time: '1 day ago', icon: Eye, color: '#10b981' }
    ];

    return (
        <DashboardLayout
            title={`Welcome back, ${user?.name || 'User'}!`}
            subtitle="Here's what's happening with your portfolio today"
        >
            <div style={{ padding: '24px' }}>
                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{
                                background: `${theme.surface}80`,
                                borderRadius: '16px',
                                padding: '24px',
                                border: `1px solid ${theme.border}`,
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{
                                        color: theme.textSecondary,
                                        fontSize: '14px',
                                        marginBottom: '8px'
                                    }}>{stat.label}</p>
                                    <h3 style={{
                                        color: theme.text,
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        margin: 0
                                    }}>{stat.value}</h3>
                                </div>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: `${stat.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <stat.icon size={28} style={{ color: stat.color }} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Quick Stats Chart */}
                    <div style={{
                        background: `${theme.surface}80`,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontFamily: theme.fontHeading
                        }}>Performance Overview</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
                            {[40, 65, 55, 80, 75, 90, 85].map((height, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    style={{
                                        flex: 1,
                                        background: theme.gradient,
                                        borderRadius: '8px 8px 0 0',
                                        minHeight: '20px'
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                <span key={index} style={{ color: theme.textSecondary, fontSize: '12px' }}>{day}</span>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={{
                        background: `${theme.surface}80`,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontFamily: theme.fontHeading
                        }}>Recent Activity</h3>
                        {recentActivity.map((activity, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                marginBottom: '12px',
                                background: `${theme.background}40`,
                                borderRadius: '12px',
                                border: `1px solid ${theme.border}`,
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: `${activity.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <activity.icon size={20} style={{ color: activity.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: theme.text, fontSize: '14px', margin: '0 0 4px 0', fontWeight: '500' }}>
                                        {activity.action}
                                    </p>
                                    <p style={{ color: theme.textSecondary, fontSize: '12px', margin: 0 }}>
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardHome;
