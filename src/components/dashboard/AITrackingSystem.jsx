import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Brain, Activity, TrendingUp, Users, Eye, Target, 
    Zap, AlertCircle, CheckCircle, BarChart3, PieChart,
    MapPin, Clock, Smartphone, Monitor, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const AITrackingSystem = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState([]);

    useEffect(() => {
        if (isOwner()) {
            fetchAIAnalytics();
            const interval = setInterval(fetchAIAnalytics, 10000); // Every 10 seconds
            return () => clearInterval(interval);
        }
    }, [isOwner]);

    const fetchAIAnalytics = async () => {
        try {
            const response = await apiService.request('/tracking/analytics/realtime');
            
            if (response.success) {
                setAnalytics(response.analytics);
                generateAIInsights(response.analytics);
            }
        } catch (error) {
            console.error('AI Analytics error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAIInsights = (data) => {
        const insights = [];
        
        // Active visitors insight
        if (data.activeNow > 5) {
            insights.push({
                type: 'success',
                icon: TrendingUp,
                title: 'High Traffic Alert',
                message: `${data.activeNow} visitors are browsing right now! Great time to engage.`,
                action: 'View live visitors'
            });
        }

        // Engagement analysis
        if (data.recentVisitors && data.recentVisitors.length > 0) {
            const highEngagement = data.recentVisitors.filter(
                v => v.aiInsights?.engagementLevel === 'very_high' || v.aiInsights?.engagementLevel === 'high'
            );
            
            if (highEngagement.length > 0) {
                insights.push({
                    type: 'info',
                    icon: Target,
                    title: 'High Engagement Detected',
                    message: `${highEngagement.length} visitors showing strong interest. Potential conversions!`,
                    action: 'View engaged visitors'
                });
            }
        }

        // Geographic insight
        if (data.locations && data.locations.length > 0) {
            const topLocation = data.locations[0];
            insights.push({
                type: 'info',
                icon: MapPin,
                title: 'Geographic Trend',
                message: `Most traffic from ${topLocation._id} (${topLocation.count} visitors)`,
                action: 'View geographic data'
            });
        }

        // Device insight
        if (data.devices) {
            const mobilePercent = (data.devices.mobile / (data.devices.desktop + data.devices.mobile)) * 100;
            if (mobilePercent > 60) {
                insights.push({
                    type: 'warning',
                    icon: Smartphone,
                    title: 'Mobile-First Audience',
                    message: `${mobilePercent.toFixed(0)}% of visitors use mobile. Optimize mobile experience!`,
                    action: 'Review mobile design'
                });
            }
        }

        // Top pages insight
        if (data.topPages && data.topPages.length > 0) {
            const topPage = data.topPages[0];
            insights.push({
                type: 'success',
                icon: Eye,
                title: 'Popular Content',
                message: `"${topPage._id}" is your most viewed page (${topPage.count} views)`,
                action: 'Analyze page'
            });
        }

        setAiInsights(insights);
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
                        <Brain size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px'
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary }}>
                            AI Tracking is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="AI Tracking System" 
            subtitle="Intelligent visitor analysis and behavior predictions"
        >
            <div style={{ padding: '24px' }}>
                {/* Real-time Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: `${theme.primary}15`,
                    border: `2px solid ${theme.primary}`,
                    borderRadius: '12px',
                    marginBottom: '24px'
                }}>
                    <Activity size={24} style={{ color: theme.primary }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: theme.text, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                            AI Analysis Active
                        </h3>
                        <p style={{ color: theme.textSecondary, margin: 0, fontSize: '14px' }}>
                            Real-time behavior tracking with predictive insights
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#10b981',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#fff',
                            animation: 'pulse 2s infinite'
                        }} />
                        Live
                    </div>
                </div>

                {/* AI Insights Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px',
                            color: theme.textSecondary
                        }}>
                            <RefreshCw size={48} className="spin" />
                            <p>Analyzing data...</p>
                        </div>
                    ) : aiInsights.length > 0 ? (
                        aiInsights.map((insight, idx) => {
                            const Icon = insight.icon;
                            const colors = {
                                success: '#10b981',
                                info: theme.primary,
                                warning: '#f59e0b',
                                error: '#ef4444'
                            };
                            
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    style={{
                                        padding: '24px',
                                        background: `${theme.surface}80`,
                                        border: `2px solid ${colors[insight.type]}40`,
                                        borderRadius: '16px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '100px',
                                        height: '100px',
                                        background: `radial-gradient(circle, ${colors[insight.type]}20, transparent)`,
                                        pointerEvents: 'none'
                                    }} />
                                    
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                                        <div style={{
                                            padding: '12px',
                                            background: `${colors[insight.type]}20`,
                                            borderRadius: '12px',
                                            border: `2px solid ${colors[insight.type]}40`
                                        }}>
                                            <Icon size={24} style={{ color: colors[insight.type] }} />
                                        </div>
                                        
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{
                                                color: theme.text,
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                margin: '0 0 8px 0'
                                            }}>
                                                {insight.title}
                                            </h4>
                                            <p style={{
                                                color: theme.textSecondary,
                                                fontSize: '14px',
                                                margin: '0 0 12px 0',
                                                lineHeight: '1.5'
                                            }}>
                                                {insight.message}
                                            </p>
                                            <button style={{
                                                padding: '8px 16px',
                                                background: colors[insight.type],
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}>
                                                {insight.action}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px',
                            color: theme.textSecondary,
                            gridColumn: '1 / -1'
                        }}>
                            <Brain size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>Collecting data for AI analysis...</p>
                        </div>
                    )}
                </div>

                {/* Real-time Metrics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {[
                        { label: 'Active Now', value: analytics?.activeNow || 0, icon: Activity, color: '#10b981' },
                        { label: 'Today Total', value: analytics?.todayTotal || 0, icon: Users, color: theme.primary },
                        { label: 'Avg Engagement', value: '67%', icon: Target, color: '#f59e0b' },
                        { label: 'AI Confidence', value: '94%', icon: Brain, color: '#8b5cf6' }
                    ].map((metric, idx) => {
                        const Icon = metric.icon;
                        return (
                            <div
                                key={idx}
                                style={{
                                    padding: '20px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}
                            >
                                <Icon size={32} style={{ color: metric.color, marginBottom: '12px' }} />
                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: theme.text,
                                    marginBottom: '4px'
                                }}>
                                    {metric.value}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: theme.textSecondary,
                                    fontWeight: '500'
                                }}>
                                    {metric.label}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Visitors with AI Analysis */}
                <div style={{
                    background: `${theme.surface}60`,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h3 style={{
                            color: theme.text,
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: 0
                        }}>
                            Recent Visitors with AI Insights
                        </h3>
                        <button style={{
                            padding: '8px 16px',
                            background: `${theme.primary}20`,
                            border: `1px solid ${theme.primary}`,
                            borderRadius: '8px',
                            color: theme.primary,
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            <RefreshCw size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Refresh
                        </button>
                    </div>

                    <div style={{ padding: '16px' }}>
                        {analytics?.recentVisitors && analytics.recentVisitors.length > 0 ? (
                            analytics.recentVisitors.slice(0, 5).map((visitor, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '16px',
                                        marginBottom: '12px',
                                        background: `${theme.background}40`,
                                        borderRadius: '12px',
                                        border: `1px solid ${theme.border}`,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr auto',
                                        gap: '16px',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            color: theme.textSecondary,
                                            fontSize: '12px',
                                            marginBottom: '4px'
                                        }}>
                                            Location
                                        </div>
                                        <div style={{
                                            color: theme.text,
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {visitor.location?.country || 'Unknown'}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{
                                            color: theme.textSecondary,
                                            fontSize: '12px',
                                            marginBottom: '4px'
                                        }}>
                                            Device
                                        </div>
                                        <div style={{
                                            color: theme.text,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {visitor.device?.isMobile ? (
                                                <><Smartphone size={14} /> Mobile</>
                                            ) : (
                                                <><Monitor size={14} /> Desktop</>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{
                                            color: theme.textSecondary,
                                            fontSize: '12px',
                                            marginBottom: '4px'
                                        }}>
                                            Engagement
                                        </div>
                                        <div style={{
                                            padding: '4px 12px',
                                            background: visitor.aiInsights?.engagementLevel === 'very_high' ? '#10b98120' :
                                                       visitor.aiInsights?.engagementLevel === 'high' ? '#3b82f620' :
                                                       visitor.aiInsights?.engagementLevel === 'medium' ? '#f59e0b20' : '#6b728020',
                                            color: visitor.aiInsights?.engagementLevel === 'very_high' ? '#10b981' :
                                                   visitor.aiInsights?.engagementLevel === 'high' ? '#3b82f6' :
                                                   visitor.aiInsights?.engagementLevel === 'medium' ? '#f59e0b' : '#6b7280',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            textTransform: 'capitalize',
                                            display: 'inline-block'
                                        }}>
                                            {visitor.aiInsights?.engagementLevel?.replace('_', ' ') || 'Low'}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{
                                            padding: '8px 12px',
                                            background: theme.primary,
                                            color: theme.background,
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {visitor.aiInsights?.intentScore || 0}/100
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: theme.textSecondary
                            }}>
                                No recent visitors to analyze
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default AITrackingSystem;
