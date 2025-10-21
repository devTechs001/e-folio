import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Globe, Monitor, Smartphone, Eye, MapPin, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const VisitorsAnalytics = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOwner()) {
            fetchAnalytics();
            const interval = setInterval(fetchAnalytics, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isOwner]);

    const fetchAnalytics = async () => {
        try {
            const response = await apiService.request('/tracking/analytics/realtime');
            if (response.success) {
                setAnalytics(response.analytics);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { 
            label: 'Active Now', 
            value: analytics?.activeNow || 0, 
            change: 'Live', 
            icon: Activity, 
            color: '#10b981',
            isLive: true
        },
        { 
            label: 'Today Total', 
            value: analytics?.todayTotal || 0, 
            change: '+' + ((analytics?.todayTotal || 0) * 0.12).toFixed(1) + '%', 
            icon: Users, 
            color: theme.primary 
        },
        { 
            label: 'Top Page Views', 
            value: analytics?.topPages?.[0]?.count || 0, 
            change: analytics?.topPages?.[0]?._id || 'N/A', 
            icon: Eye, 
            color: '#3b82f6' 
        },
        { 
            label: 'Device Split', 
            value: `${analytics?.devices?.desktop || 0}/${analytics?.devices?.mobile || 0}`, 
            change: 'Desktop/Mobile', 
            icon: Monitor, 
            color: '#f59e0b' 
        }
    ];

    const topCountries = analytics?.locations?.map(loc => ({
        country: loc._id || 'Unknown',
        visitors: loc.count,
        percentage: ((loc.count / (analytics.todayTotal || 1)) * 100).toFixed(1),
        flag: getCountryFlag(loc._id)
    })) || [];

    const devices = [
        { 
            type: 'Desktop', 
            count: analytics?.devices?.desktop || 0, 
            percentage: ((analytics?.devices?.desktop || 0) / ((analytics?.devices?.desktop || 0) + (analytics?.devices?.mobile || 1)) * 100).toFixed(1), 
            icon: Monitor, 
            color: '#3b82f6' 
        },
        { 
            type: 'Mobile', 
            count: analytics?.devices?.mobile || 0, 
            percentage: ((analytics?.devices?.mobile || 0) / ((analytics?.devices?.desktop || 1) + (analytics?.devices?.mobile || 0)) * 100).toFixed(1), 
            icon: Smartphone, 
            color: '#10b981' 
        }
    ];

    const getCountryFlag = (country) => {
        const flags = {
            'United States': '🇺🇸',
            'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪',
            'Canada': '🇨🇦',
            'Australia': '🇦🇺',
            'France': '🇫🇷',
            'India': '🇮🇳',
            'Japan': '🇯🇵'
        };
        return flags[country] || '🌍';
    };

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
