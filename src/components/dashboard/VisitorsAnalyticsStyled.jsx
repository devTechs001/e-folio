import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Globe, Monitor, Smartphone, Eye, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardLayout from './DashboardLayout';

const VisitorsAnalytics = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();

    const stats = [
        { label: 'Total Visitors', value: '12,847', change: '+12.5%', icon: Users, color: theme.primary },
        { label: 'Page Views', value: '45,231', change: '+8.2%', icon: Eye, color: '#3b82f6' },
        { label: 'Avg. Session', value: '3m 24s', change: '+5.1%', icon: Clock, color: '#10b981' },
        { label: 'Bounce Rate', value: '42.3%', change: '-3.2%', icon: TrendingUp, color: '#f59e0b' }
    ];

    const topCountries = [
        { country: 'United States', visitors: 3542, percentage: 27.6, flag: '🇺🇸' },
        { country: 'United Kingdom', visitors: 2156, percentage: 16.8, flag: '🇬🇧' },
        { country: 'Germany', visitors: 1847, percentage: 14.4, flag: '🇩🇪' },
        { country: 'Canada', visitors: 1234, percentage: 9.6, flag: '🇨🇦' },
        { country: 'Australia', visitors: 987, percentage: 7.7, flag: '🇦🇺' }
    ];

    const devices = [
        { type: 'Desktop', count: 6842, percentage: 53.2, icon: Monitor, color: '#3b82f6' },
        { type: 'Mobile', count: 4567, percentage: 35.5, icon: Smartphone, color: '#10b981' },
        { type: 'Tablet', count: 1438, percentage: 11.3, icon: Monitor, color: '#f59e0b' }
    ];

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '40px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        background: `${theme.surface}90`,
                        borderRadius: '16px',
                        border: `1px solid rgba(239, 68, 68, 0.3)`,
                        maxWidth: '500px'
                    }}>
                        <Users size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px',
                            fontFamily: theme.fontHeading
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
                            Analytics are only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Visitors Analytics" subtitle="Track your portfolio performance and visitor insights">
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: `${stat.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <stat.icon size={24} style={{ color: stat.color }} />
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    background: stat.change.startsWith('+') ? '#10b98120' : '#ef444420',
                                    color: stat.change.startsWith('+') ? '#10b981' : '#ef4444'
                                }}>{stat.change}</span>
                            </div>
                            <p style={{
                                color: theme.textSecondary,
                                fontSize: '14px',
                                margin: '0 0 8px 0'
                            }}>{stat.label}</p>
                            <h3 style={{
                                color: theme.text,
                                fontSize: '32px',
                                fontWeight: '700',
                                margin: 0
                            }}>{stat.value}</h3>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    {/* Top Countries */}
                    <div style={{
                        background: `${theme.surface}80`,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Globe size={24} style={{ color: theme.primary }} />
                            <h3 style={{
                                color: theme.text,
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: 0,
                                fontFamily: theme.fontHeading
                            }}>Top Countries</h3>
                        </div>
                        {topCountries.map((country, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                marginBottom: '12px',
                                background: `${theme.background}40`,
                                borderRadius: '12px',
                                border: `1px solid ${theme.border}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '24px' }}>{country.flag}</span>
                                        <span style={{ color: theme.text, fontSize: '15px', fontWeight: '500' }}>
                                            {country.country}
                                        </span>
                                    </div>
                                    <span style={{ color: theme.primary, fontSize: '15px', fontWeight: '600' }}>
                                        {country.visitors.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '6px',
                                    background: `${theme.surface}`,
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${country.percentage}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                        style={{
                                            height: '100%',
                                            background: theme.gradient,
                                            borderRadius: '3px'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Devices */}
                    <div style={{
                        background: `${theme.surface}80`,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Monitor size={24} style={{ color: theme.primary }} />
                            <h3 style={{
                                color: theme.text,
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: 0,
                                fontFamily: theme.fontHeading
                            }}>Devices</h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: '32px',
                            position: 'relative',
                            height: '200px'
                        }}>
                            {devices.map((device, index) => (
                                <div key={index} style={{
                                    position: 'absolute',
                                    width: `${120 + (2 - index) * 40}px`,
                                    height: `${120 + (2 - index) * 40}px`,
                                    borderRadius: '50%',
                                    border: `8px solid ${device.color}`,
                                    opacity: 0.3 + (index * 0.2)
                                }} />
                            ))}
                        </div>
                        {devices.map((device, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                marginBottom: '12px',
                                background: `${device.color}15`,
                                borderRadius: '12px',
                                border: `1px solid ${device.color}30`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <device.icon size={20} style={{ color: device.color }} />
                                    <span style={{ color: theme.text, fontSize: '15px', fontWeight: '500' }}>
                                        {device.type}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: device.color, fontSize: '18px', fontWeight: '700' }}>
                                        {device.percentage}%
                                    </div>
                                    <div style={{ color: theme.textSecondary, fontSize: '12px' }}>
                                        {device.count.toLocaleString()} users
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Visitors */}
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
                    }}>Recent Visitors</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: theme.textSecondary, fontSize: '14px', fontWeight: '600' }}>Location</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: theme.textSecondary, fontSize: '14px', fontWeight: '600' }}>Page</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: theme.textSecondary, fontSize: '14px', fontWeight: '600' }}>Device</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: theme.textSecondary, fontSize: '14px', fontWeight: '600' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Berlin, DE'].map((location, index) => (
                                    <tr key={index} style={{ borderBottom: `1px solid ${theme.border}20` }}>
                                        <td style={{ padding: '16px', color: theme.text, fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <MapPin size={16} style={{ color: theme.primary }} />
                                                {location}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: theme.text, fontSize: '14px' }}>/projects</td>
                                        <td style={{ padding: '16px', color: theme.textSecondary, fontSize: '14px' }}>Desktop</td>
                                        <td style={{ padding: '16px', color: theme.textSecondary, fontSize: '14px' }}>{index + 1}m ago</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VisitorsAnalytics;
