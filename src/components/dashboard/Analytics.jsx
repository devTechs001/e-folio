import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Analytics = () => {
    const { isOwner } = useAuth();
    const [analyticsData, setAnalyticsData] = useState({
        totalViews: 1234,
        uniqueVisitors: 892,
        projectViews: 456,
        contactForms: 23,
        collaborationRequests: 7
    });

    const [timeRange, setTimeRange] = useState('7d');
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Simulate analytics data
        const generateChartData = () => {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            const data = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                data.push({
                    date: date.toLocaleDateString(),
                    views: Math.floor(Math.random() * 100) + 20,
                    visitors: Math.floor(Math.random() * 50) + 10
                });
            }
            return data;
        };

        setChartData(generateChartData());
    }, [timeRange]);

    const metrics = [
        {
            title: 'Total Views',
            value: analyticsData.totalViews.toLocaleString(),
            change: '+12%',
            icon: 'fas fa-eye',
            color: '#0ef',
            description: 'Portfolio page views'
        },
        {
            title: 'Unique Visitors',
            value: analyticsData.uniqueVisitors.toLocaleString(),
            change: '+8%',
            icon: 'fas fa-users',
            color: '#00d4ff',
            description: 'Individual visitors'
        },
        {
            title: 'Project Views',
            value: analyticsData.projectViews.toLocaleString(),
            change: '+15%',
            icon: 'fas fa-project-diagram',
            color: '#0ef',
            description: 'Project section views'
        },
        {
            title: 'Contact Forms',
            value: analyticsData.contactForms.toString(),
            change: '+3',
            icon: 'fas fa-envelope',
            color: '#00d4ff',
            description: 'Form submissions'
        },
        {
            title: 'Collaboration Requests',
            value: analyticsData.collaborationRequests.toString(),
            change: '+2',
            icon: 'fas fa-handshake',
            color: '#0ef',
            description: 'Collaboration inquiries'
        }
    ];

    const topPages = [
        { page: 'Home', views: 456, percentage: 37 },
        { page: 'Projects', views: 234, percentage: 19 },
        { page: 'About', views: 189, percentage: 15 },
        { page: 'Skills', views: 167, percentage: 14 },
        { page: 'Contact', views: 123, percentage: 10 },
        { page: 'Education', views: 65, percentage: 5 }
    ];

    const referralSources = [
        { source: 'Direct', visits: 45, percentage: 45 },
        { source: 'GitHub', visits: 23, percentage: 23 },
        { source: 'LinkedIn', visits: 18, percentage: 18 },
        { source: 'Google', visits: 10, percentage: 10 },
        { source: 'Other', visits: 4, percentage: 4 }
    ];

    if (!isOwner()) {
        return (
            <div className="analytics">
                <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '2px solid #ff4444',
                    borderRadius: '15px',
                    padding: '30px',
                    textAlign: 'center'
                }}>
                    <i className="fas fa-lock" style={{ fontSize: '48px', color: '#ff4444', marginBottom: '20px' }}></i>
                    <h3 style={{ color: '#ff4444', marginBottom: '10px' }}>Access Restricted</h3>
                    <p style={{ color: '#ededed', margin: 0 }}>
                        Analytics are only available to the portfolio owner.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics">
            <div className="header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <div>
                    <h2 style={{ color: '#0ef', margin: '0 0 10px 0' }}>Analytics Dashboard</h2>
                    <p style={{ color: '#ededed', margin: 0 }}>
                        Track your portfolio performance and visitor engagement
                    </p>
                </div>
                
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    style={{
                        background: '#081b29',
                        border: '2px solid #0ef',
                        color: '#ededed',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                {metrics.map((metric, index) => (
                    <div key={index} className="metric-card" style={{
                        background: 'rgba(8, 27, 41, 0.8)',
                        border: `2px solid ${metric.color}`,
                        borderRadius: '15px',
                        padding: '25px',
                        transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '15px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: `${metric.color}20`,
                                border: `1px solid ${metric.color}`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: metric.color
                            }}>
                                <i className={metric.icon}></i>
                            </div>
                            <span style={{
                                background: metric.change.startsWith('+') ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                color: metric.change.startsWith('+') ? '#00ff00' : '#ff0000',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {metric.change}
                            </span>
                        </div>
                        <h3 style={{ color: '#ededed', margin: '0 0 5px 0', fontSize: '14px' }}>
                            {metric.title}
                        </h3>
                        <p style={{ color: metric.color, margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
                            {metric.value}
                        </p>
                        <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>
                            {metric.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '30px',
                marginBottom: '30px'
            }}>
                {/* Views Chart */}
                <div className="chart-container" style={{
                    background: 'rgba(8, 27, 41, 0.6)',
                    border: '1px solid rgba(0, 239, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '25px'
                }}>
                    <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Views Over Time</h3>
                    <div className="simple-chart" style={{
                        height: '200px',
                        display: 'flex',
                        alignItems: 'end',
                        gap: '4px',
                        padding: '10px 0'
                    }}>
                        {chartData.slice(0, 14).map((data, index) => (
                            <div key={index} style={{
                                flex: 1,
                                background: 'linear-gradient(to top, #0ef, #00d4ff)',
                                height: `${(data.views / 120) * 100}%`,
                                minHeight: '10px',
                                borderRadius: '2px',
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                            title={`${data.date}: ${data.views} views`}
                            ></div>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#888',
                        fontSize: '12px',
                        marginTop: '10px'
                    }}>
                        <span>0</span>
                        <span>Peak: 120 views</span>
                    </div>
                </div>

                {/* Top Pages */}
                <div className="top-pages" style={{
                    background: 'rgba(8, 27, 41, 0.6)',
                    border: '1px solid rgba(0, 239, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '25px'
                }}>
                    <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Top Pages</h3>
                    <div className="pages-list">
                        {topPages.map((page, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: index < topPages.length - 1 ? '1px solid rgba(0, 239, 255, 0.1)' : 'none'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#ededed', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {page.page}
                                    </div>
                                    <div style={{
                                        background: 'rgba(0, 239, 255, 0.2)',
                                        height: '4px',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        width: '100%'
                                    }}>
                                        <div style={{
                                            background: '#0ef',
                                            height: '100%',
                                            width: `${page.percentage}%`,
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ marginLeft: '15px', textAlign: 'right' }}>
                                    <div style={{ color: '#0ef', fontWeight: 'bold' }}>
                                        {page.views}
                                    </div>
                                    <div style={{ color: '#888', fontSize: '12px' }}>
                                        {page.percentage}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Traffic Sources */}
            <div className="traffic-sources" style={{
                background: 'rgba(8, 27, 41, 0.6)',
                border: '1px solid rgba(0, 239, 255, 0.2)',
                borderRadius: '15px',
                padding: '25px'
            }}>
                <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Traffic Sources</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {referralSources.map((source, index) => (
                        <div key={index} className="source-card" style={{
                            background: 'rgba(0, 239, 255, 0.05)',
                            border: '1px solid rgba(0, 239, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: `conic-gradient(#0ef 0deg ${source.percentage * 3.6}deg, rgba(0, 239, 255, 0.2) ${source.percentage * 3.6}deg 360deg)`,
                                borderRadius: '50%',
                                margin: '0 auto 15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: '#081b29',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#0ef',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                }}>
                                    {source.percentage}%
                                </div>
                            </div>
                            <h4 style={{ color: '#ededed', margin: '0 0 5px 0', fontSize: '14px' }}>
                                {source.source}
                            </h4>
                            <p style={{ color: '#0ef', margin: 0, fontWeight: 'bold' }}>
                                {source.visits} visits
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;