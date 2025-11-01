import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api.service';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  FiEye, 
  FiUsers, 
  FiTrendingUp, 
  FiMail, 
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiMapPin,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiClock,
  FiActivity,
  FiZap,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

const Analytics = () => {
  const { isOwner } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, realtime
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [filters, setFilters] = useState({
    page: 'all',
    device: 'all',
    source: 'all'
  });

  useEffect(() => {
    loadAnalytics();
    // Real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (viewMode === 'realtime') {
        loadAnalytics(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [timeRange, filters, viewMode]);

  const loadAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const response = await apiService.getAnalytics({
        timeRange,
        filters,
        includeComparison: comparisonMode
      });
      
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      // Fallback to demo data
      setAnalyticsData(generateDemoData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateDemoData = () => {
    return {
      summary: {
        totalViews: 12456,
        uniqueVisitors: 8923,
        projectViews: 4567,
        contactForms: 234,
        collaborationRequests: 45,
        avgSessionDuration: 245, // seconds
        bounceRate: 32.5,
        conversionRate: 2.8,
        returningVisitors: 3421,
        newVisitors: 5502
      },
      trends: {
        viewsChange: 12.5,
        visitorsChange: 8.3,
        engagementChange: -2.1,
        conversionChange: 15.2
      },
      chartData: generateChartData(),
      hourlyData: generateHourlyData(),
      pageViews: [
        { page: 'Home', views: 4560, uniqueViews: 3421, avgTime: 145, bounceRate: 25 },
        { page: 'Projects', views: 3234, uniqueViews: 2543, avgTime: 320, bounceRate: 15 },
        { page: 'About', views: 2189, uniqueViews: 1876, avgTime: 180, bounceRate: 30 },
        { page: 'Skills', views: 1876, uniqueViews: 1432, avgTime: 95, bounceRate: 45 },
        { page: 'Contact', views: 1234, uniqueViews: 987, avgTime: 210, bounceRate: 20 },
        { page: 'Education', views: 876, uniqueViews: 654, avgTime: 120, bounceRate: 35 }
      ],
      trafficSources: [
        { source: 'Direct', visits: 4521, percentage: 45.2, change: 5.3 },
        { source: 'GitHub', visits: 2345, percentage: 23.4, change: 12.1 },
        { source: 'LinkedIn', visits: 1876, percentage: 18.8, change: -3.2 },
        { source: 'Google Search', visits: 987, percentage: 9.9, change: 8.7 },
        { source: 'Other', visits: 271, percentage: 2.7, change: -1.5 }
      ],
      devices: [
        { device: 'Desktop', count: 5234, percentage: 58.7 },
        { device: 'Mobile', count: 2987, percentage: 33.5 },
        { device: 'Tablet', count: 702, percentage: 7.8 }
      ],
      locations: [
        { country: 'United States', visits: 3456, percentage: 38.7 },
        { country: 'United Kingdom', visits: 1234, percentage: 13.8 },
        { country: 'India', visits: 987, percentage: 11.1 },
        { country: 'Canada', visits: 876, percentage: 9.8 },
        { country: 'Germany', visits: 654, percentage: 7.3 },
        { country: 'Others', visits: 1716, percentage: 19.3 }
      ],
      topProjects: [
        { name: 'E-commerce Platform', views: 1234, likes: 156, shares: 23 },
        { name: 'AI Chatbot', views: 987, likes: 134, shares: 18 },
        { name: 'Portfolio Website', views: 876, likes: 98, shares: 12 },
        { name: 'Mobile App', views: 654, likes: 76, shares: 8 }
      ],
      realtimeUsers: 23,
      realtimeActivity: generateRealtimeActivity()
    };
  };

  const generateChartData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.floor(Math.random() * 300) + 100,
        visitors: Math.floor(Math.random() * 150) + 50,
        engagement: Math.floor(Math.random() * 200) + 80,
        conversions: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const generateHourlyData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      views: Math.floor(Math.random() * 100) + 20,
      visitors: Math.floor(Math.random() * 50) + 10
    }));
  };

  const generateRealtimeActivity = () => {
    const activities = [
      'Viewed Home page',
      'Clicked on Project',
      'Downloaded Resume',
      'Submitted Contact Form',
      'Viewed Skills section',
      'Shared on LinkedIn',
      'Viewed About page'
    ];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      action: activities[Math.floor(Math.random() * activities.length)],
      location: ['New York, US', 'London, UK', 'Mumbai, IN', 'Toronto, CA'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
      device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)]
    }));
  };

  const exportData = async (format = 'csv') => {
    try {
      const response = await apiService.exportAnalytics({ timeRange, format });
      const blob = new Blob([response.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.${format}`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, description, trend }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full bg-${color}-500/10 border border-${color}-500/30 flex items-center justify-center`}>
          <Icon className={`text-${color}-400 text-xl`} />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {change >= 0 ? <FiArrowUp /> : <FiArrowDown />}
          {Math.abs(change)}%
        </span>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className={`text-3xl font-bold text-${color}-400 mb-2`}>{value}</p>
      <p className="text-slate-500 text-xs">{description}</p>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">vs. previous period</span>
            <span className="text-slate-400 font-medium">{trend}</span>
          </div>
        </div>
      )}
    </div>
  );

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  if (!isOwner()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-12 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiActivity className="text-red-400 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-4">Access Restricted</h3>
            <p className="text-slate-300">
              Analytics are only available to the portfolio owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const data = analyticsData || generateDemoData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-slate-400">
                Track your portfolio performance and visitor engagement
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Realtime Indicator */}
              {viewMode === 'realtime' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    {data.realtimeUsers} online now
                  </span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => loadAnalytics()}
                disabled={refreshing}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>

              {/* Export Button */}
              <div className="relative group">
                <button className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2 font-medium">
                  <FiDownload />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportData('csv')}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-cyan-500/30 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-slate-700">
            {[
              { id: 'overview', label: 'Overview', icon: FiActivity },
              { id: 'detailed', label: 'Detailed', icon: FiTrendingUp },
              { id: 'realtime', label: 'Real-time', icon: FiZap }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors relative ${
                  viewMode === id
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon />
                {label}
                {viewMode === id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Views"
                value={data.summary.totalViews.toLocaleString()}
                change={data.trends.viewsChange}
                icon={FiEye}
                color="cyan"
                description="Portfolio page views"
                trend={`+${Math.abs(data.trends.viewsChange * 100)} views`}
              />
              <MetricCard
                title="Unique Visitors"
                value={data.summary.uniqueVisitors.toLocaleString()}
                change={data.trends.visitorsChange}
                icon={FiUsers}
                color="blue"
                description="Individual visitors"
                trend={`${data.summary.returningVisitors} returning`}
              />
              <MetricCard
                title="Avg. Session"
                value={`${Math.floor(data.summary.avgSessionDuration / 60)}m ${data.summary.avgSessionDuration % 60}s`}
                change={data.trends.engagementChange}
                icon={FiClock}
                color="purple"
                description="Average session duration"
                trend={`${data.summary.bounceRate}% bounce rate`}
              />
              <MetricCard
                title="Conversion Rate"
                value={`${data.summary.conversionRate}%`}
                change={data.trends.conversionChange}
                icon={FiZap}
                color="pink"
                description="Contact form submissions"
                trend={`${data.summary.contactForms} submissions`}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Project Views"
                value={data.summary.projectViews.toLocaleString()}
                change={15.3}
                icon={FiActivity}
                color="cyan"
                description="Total project impressions"
              />
              <MetricCard
                title="Contact Forms"
                value={data.summary.contactForms}
                change={8.7}
                icon={FiMail}
                color="blue"
                description="Form submissions received"
              />
              <MetricCard
                title="Collaborations"
                value={data.summary.collaborationRequests}
                change={12.4}
                icon={FiUsers}
                color="purple"
                description="Partnership inquiries"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Views Trend Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Traffic Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Activity */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Hourly Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="views" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Page Performance & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Pages */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Page Performance</h3>
                <div className="space-y-4">
                  {data.pageViews.map((page, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">{page.page}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-cyan-400 font-semibold">{page.views.toLocaleString()}</span>
                          <span className="text-slate-500">{Math.floor(page.avgTime / 60)}m {page.avgTime % 60}s</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-cyan-500/50"
                          style={{ width: `${(page.views / data.pageViews[0].views) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                        <span>{page.uniqueViews.toLocaleString()} unique</span>
                        <span>{page.bounceRate}% bounce</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Traffic Sources</h3>
                <div className="space-y-4">
                  {data.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                          background: `conic-gradient(${COLORS[index]} 0deg ${source.percentage * 3.6}deg, rgba(100, 116, 139, 0.2) ${source.percentage * 3.6}deg 360deg)`
                        }}>
                          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold" style={{ color: COLORS[index] }}>
                              {Math.round(source.percentage)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-300 font-medium">{source.source}</div>
                          <div className="text-sm text-slate-500">{source.visits.toLocaleString()} visits</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        source.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {source.change >= 0 ? '+' : ''}{source.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Devices & Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Device Breakdown */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Device Breakdown</h3>
                <div className="flex items-center justify-center mb-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.devices}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.devices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {data.devices.map((device, index) => {
                    const Icon = device.device === 'Desktop' ? FiMonitor : device.device === 'Mobile' ? FiSmartphone : FiTablet;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="text-slate-400" />
                          <span className="text-slate-300">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${device.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            ></div>
                          </div>
                          <span className="text-slate-400 text-sm w-12 text-right">{device.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Geographic Distribution</h3>
                <div className="space-y-4">
                  {data.locations.map((location, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FiMapPin className="text-cyan-400" />
                          <span className="text-slate-300">{location.country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-sm">{location.visits.toLocaleString()}</span>
                          <span className="text-cyan-400 text-sm font-semibold w-12 text-right">
                            {location.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${location.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Projects */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Top Performing Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.topProjects.map((project, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
                    <h4 className="text-slate-300 font-medium mb-3 truncate">{project.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <FiEye className="text-cyan-400" />
                          Views
                        </span>
                        <span className="text-slate-300 font-semibold">{project.views}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Likes</span>
                        <span className="text-slate-300 font-semibold">{project.likes}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Shares</span>
                        <span className="text-slate-300 font-semibold">{project.shares}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Real-time Mode */}
        {viewMode === 'realtime' && (
          <div className="space-y-8">
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Active Users</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-4xl font-bold text-green-400">{data.realtimeUsers}</p>
                <p className="text-slate-500 text-sm mt-2">Currently browsing</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Page Views (1h)</h3>
                <p className="text-4xl font-bold text-cyan-400">
                  {data.chartData.slice(-6).reduce((sum, d) => sum + d.views, 0)}
                </p>
                <p className="text-slate-500 text-sm mt-2">Last hour</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Avg. Duration</h3>
                <p className="text-4xl font-bold text-blue-400">3m 45s</p>
                <p className="text-slate-500 text-sm mt-2">Current session</p>
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Live Activity Feed</h3>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {data.realtimeActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors animate-slideIn">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                      <FiActivity className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm">{activity.action}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="text-cyan-400" />
                          {activity.location}
                        </span>
                        <span className="flex items-center gap-1">
                          {activity.device === 'Desktop' ? <FiMonitor /> : <FiSmartphone />}
                          {activity.device}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock />
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
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
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Analytics;