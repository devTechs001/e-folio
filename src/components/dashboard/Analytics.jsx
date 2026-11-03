// src/pages/Analytics.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiActivity, FiEye, FiUsers, FiClock, FiZap, FiMail, FiTrendingUp,
  FiRefreshCw, FiDownload, FiMonitor, FiSmartphone, FiTablet, FiMapPin,
  FiArrowUp, FiArrowDown, FiFilter, FiSearch, FiTarget, FiAlertCircle,
  FiShare2, FiLink, FiMousePointer, FiAward, FiDollarSign, FiShoppingCart,
  FiBell, FiStar, FiGlobe, FiTrello, FiGitBranch, FiCode, FiHeart,
  FiMessageCircle, FiBarChart2, FiPieChart, FiLayers, FiCalendar,
  FiCheckCircle, FiXCircle, FiSettings, FiBookmark
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, FunnelChart, Funnel, LabelList
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api.service';
import socketService from '../../services/socket.service';
import { normalizeAnalytics, EMPTY_ANALYTICS } from '../../utils/analyticsData';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user, isOwner } = useAuth();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, realtime, advanced
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['views', 'visitors', 'engagement']);
  const [filters, setFilters] = useState({
    device: 'all',
    country: 'all',
    source: 'all',
    page: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [goals, setGoals] = useState([]);
  const [abTests, setAbTests] = useState([]);

  // Fetch every section from the real analytics endpoints. A failed request
  // produces an explicit empty state — never generated demo numbers.
  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      const [
        overviewData, trafficData, behaviorData, conversionData,
        technicalData, socialData, seoData, competitorData, goalsData,
        eventsData, heatmapData, abTestData, retentionData, funnelData,
        alertsData, topProjectsData, realtimeSnapshot
      ] = await Promise.all([
        apiService.getAnalyticsOverview(timeRange, filters),
        apiService.getTrafficAnalytics(timeRange, filters),
        apiService.getBehaviorAnalytics(timeRange, filters),
        apiService.getConversionAnalytics(timeRange, filters),
        apiService.getTechnicalAnalytics(timeRange, filters),
        apiService.getSocialMediaAnalytics(timeRange),
        apiService.getSEOAnalytics(timeRange),
        apiService.getCompetitorAnalytics(timeRange),
        apiService.getGoalsProgress(),
        apiService.getCustomEvents(timeRange, filters),
        apiService.getHeatmapData(filters.page),
        apiService.getABTestResults(),
        apiService.getUserRetention(timeRange),
        apiService.getConversionFunnel(timeRange),
        apiService.getAnalyticsAlerts(),
        apiService.getAnalyticsTopProjects(),
        apiService.getRealtimeAnalytics({ timeRange })
      ]);

      const normalized = normalizeAnalytics({
        overview: overviewData,
        traffic: trafficData,
        behavior: behaviorData,
        conversion: conversionData,
        technical: technicalData,
        social: socialData,
        seo: seoData,
        competitor: competitorData,
        goals: goalsData,
        events: eventsData,
        heatmap: heatmapData,
        abTests: abTestData,
        retention: retentionData,
        funnel: funnelData,
        alerts: alertsData,
        topProjects: topProjectsData,
        realtime: realtimeSnapshot
      });

      setAnalyticsData(normalized);
      setGoals(normalized.goals);
      setAbTests(normalized.abTests);
      setNotifications(normalized.notifications);
      if (normalized.unavailable.length) {
        console.warn('Analytics sections unavailable:', normalized.unavailable.join(', '));
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
      setAnalyticsData(EMPTY_ANALYTICS);
      setGoals([]);
      setAbTests([]);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, filters]);

  // Real-time updates use the Socket.IO /tracking namespace. The old code
  // opened a raw WebSocket at ws://localhost:3001, which the server never
  // served, so the "realtime" view was permanently stale.
  useEffect(() => {
    if (viewMode !== 'realtime') return undefined;
    const handleEvent = (envelope) => {
      if (!envelope || typeof envelope !== 'object') return;
      setRealtimeData(prev => ({ ...prev, ...envelope.payload, lastEvent: envelope.type, lastEventAt: Date.now() }));
      if (typeof envelope.payload?.activeUsers === 'number') {
        setAnalyticsData(prev => prev ? { ...prev, realtimeUsers: envelope.payload.activeUsers } : prev);
      }
    };
    socketService.connectTracking();
    socketService.onTrackingEvent(handleEvent);
    return () => {
      socketService.offTrackingEvent(handleEvent);
      socketService.disconnectTracking();
    };
  }, [viewMode]);

  // Auto-refresh (skip hidden tabs).
  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(() => {
      if (!document.hidden) loadAnalytics();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  // Export Functions
  const exportData = async (format = 'csv') => {
    try {
      toast.loading('Preparing export...');
      const response = await apiService.exportAnalytics({ 
        timeRange, 
        format,
        filters,
        metrics: selectedMetrics 
      });
      
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${Date.now()}.${format}`;
      a.click();
      toast.success('Export completed!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed. Please try again.');
    }
  };

  const exportToPDF = async () => {
    try {
      toast.loading('Generating PDF report...');
      const response = await apiService.generatePDFReport({ 
        timeRange, 
        filters,
        sections: ['overview', 'traffic', 'behavior', 'conversion']
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${Date.now()}.pdf`;
      a.click();
      toast.success('PDF generated successfully!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF report.');
    }
  };

  // Schedule Reports
  const scheduleReport = async (frequency, email) => {
    try {
      await apiService.scheduleAnalyticsReport({
        frequency, // daily, weekly, monthly
        email,
        timeRange,
        format: 'pdf'
      });
      toast.success(`Report scheduled successfully! You'll receive ${frequency} reports at ${email}`);
    } catch (err) {
      toast.error('Failed to schedule report.');
    }
  };

  // Components
  const MetricCard = ({ title, value, change, icon: Icon, color, description, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-slate-800/50 backdrop-blur-sm border border-${color}-500/20 rounded-xl p-6 hover:border-${color}-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
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

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f43f5e'];

  // Access Control
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

  // Loading State
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

  // Don't render until data is loaded
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

  const data = analyticsData || EMPTY_ANALYTICS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                Advanced Analytics Dashboard
              </h1>
              <p className="text-slate-400">
                Comprehensive insights into your portfolio performance
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

              {/* Honest signal when one or more API sections failed. */}
              {data.unavailable && data.unavailable.length > 0 && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                  Some analytics sections could not be loaded
                  ({data.unavailable.join(', ')}). Showing only verified data.
                </div>
              )}

              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="relative group">
                  <button className="relative px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                    <FiBell className="text-xl" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 max-h-96 overflow-y-auto">
                    {(notifications || []).map((notif, idx) => (
                      <div key={idx} className="p-4 border-b border-slate-700 hover:bg-slate-700/50">
                        <div className="flex items-start gap-3">
                          <FiAlertCircle className={`text-${notif.type === 'warning' ? 'yellow' : notif.type === 'error' ? 'red' : 'blue'}-400 mt-1`} />
                          <div>
                            <p className="text-slate-300 text-sm font-medium">{notif.title}</p>
                            <p className="text-slate-500 text-xs mt-1">{notif.message}</p>
                            <span className="text-slate-600 text-xs">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

              {/* Export Dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2 font-medium">
                  <FiDownload />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportData('csv')}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors flex items-center gap-2"
                  >
                    <FiDownload className="text-cyan-400" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <FiCode className="text-blue-400" />
                    Export as JSON
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors flex items-center gap-2"
                  >
                    <FiDownload className="text-purple-400" />
                    Generate PDF Report
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
                <option value="custom">Custom Range</option>
              </select>

              {/* Comparison Mode Toggle */}
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                  comparisonMode 
                    ? 'bg-cyan-500 border-cyan-500 text-slate-900' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FiTrendingUp />
                Compare
              </button>

              {/* Filters */}
              <button
                onClick={() => document.getElementById('filtersPanel').classList.toggle('hidden')}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FiFilter />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div id="filtersPanel" className="hidden bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Device</label>
                <select
                  value={filters.device}
                  onChange={(e) => setFilters({...filters, device: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Devices</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Countries</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="IN">India</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Traffic Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({...filters, source: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Sources</option>
                  <option value="direct">Direct</option>
                  <option value="organic">Organic Search</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Page</label>
                <select
                  value={filters.page}
                  onChange={(e) => setFilters({...filters, page: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Pages</option>
                  <option value="home">Home</option>
                  <option value="projects">Projects</option>
                  <option value="about">About</option>
                  <option value="contact">Contact</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: FiActivity },
              { id: 'traffic', label: 'Traffic', icon: FiTrendingUp },
              { id: 'behavior', label: 'Behavior', icon: FiMousePointer },
              { id: 'conversion', label: 'Conversions', icon: FiTarget },
              { id: 'realtime', label: 'Real-time', icon: FiZap },
              { id: 'advanced', label: 'Advanced', icon: FiLayers }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors relative whitespace-nowrap ${
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
                value={data.overview?.summary?.totalViews?.toLocaleString() || '0'}
                change={data.overview?.trends?.viewsChange || 0}
                icon={FiEye}
                color="cyan"
                description="Portfolio page views"
                trend={`+${Math.abs(data.overview?.trends?.viewsChange * 100 || 0)} views`}
              />
              <MetricCard
                title="Unique Visitors"
                value={data.overview?.summary?.uniqueVisitors?.toLocaleString() || '0'}
                change={data.overview?.trends?.visitorsChange || 0}
                icon={FiUsers}
                color="blue"
                description="Individual visitors"
                trend={`${data.overview?.summary?.newVsReturning?.returning || 0}% returning`}
              />
              <MetricCard
                title="Avg. Session"
                value={`${Math.floor(data.overview?.summary?.avgSessionDuration / 60) || 0}m ${(data.overview?.summary?.avgSessionDuration || 0) % 60}s`}
                change={data.overview?.trends?.engagementChange || 0}
                icon={FiClock}
                color="purple"
                description="Average session duration"
                trend={`${data.overview?.summary?.bounceRate || 0}% bounce rate`}
              />
              <MetricCard
                title="Conversion Rate"
                value={`${data.overview?.summary?.conversionRate || 0}%`}
                change={data.overview?.trends?.conversionChange || 0}
                icon={FiZap}
                color="pink"
                description="Goal completion rate"
                trend={`${data.overview?.summary?.goalCompletions || 0} completions`}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Pages/Session"
                value={data.overview?.summary?.pageviewsPerSession?.toFixed(1) || '0.0'}
                change={8.5}
                icon={FiActivity}
                color="cyan"
                description="Average pages per session"
              />
              <MetricCard
                title="Total Revenue"
                value={`$${data.overview?.summary?.totalRevenue?.toLocaleString() || '0'}`}
                change={data.overview?.trends?.revenueChange || 0}
                icon={FiDollarSign}
                color="green"
                description="Generated revenue"
              />
              <MetricCard
                title="Online Now"
                value={data.overview?.summary?.realtimeUsers || 0}
                change={15.3}
                icon={FiActivity}
                color="green"
                description="Active users right now"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Multi-metric Trend Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-cyan-400">Traffic Overview</h3>
                  <div className="flex gap-2">
                    {['views', 'visitors', 'engagement'].map(metric => (
                      <button
                        key={metric}
                        onClick={() => {
                          const newMetrics = selectedMetrics.includes(metric)
                            ? selectedMetrics.filter(m => m !== metric)
                            : [...selectedMetrics, metric];
                          setSelectedMetrics(newMetrics);
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedMetrics.includes(metric)
                            ? 'bg-cyan-500 text-slate-900'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {metric}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.overview?.chartData || []}>
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
                    {selectedMetrics.includes('views') && (
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                    )}
                    {selectedMetrics.includes('visitors') && (
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                      />
                    )}
                    {selectedMetrics.includes('engagement') && (
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Hourly Activity */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Hourly Activity Pattern</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.overview?.hourlyData || []}>
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
                    <Legend />
                    <Bar dataKey="views" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="conversions" stroke="#ec4899" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Page Performance & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Pages */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-cyan-400">Page Performance</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search pages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 pl-10"
                    />
                    <FiSearch className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {(data.behavior?.pageViews || [])
                    .filter(page => page.page.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((page, index) => (
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
                          style={{ width: `${(page.views / (data.behavior?.pageViews?.[0]?.views || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>{page.uniqueViews.toLocaleString()} unique • {page.bounceRate}% bounce</span>
                        <span>{page.exitRate}% exit rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Traffic Sources</h3>
                <div className="space-y-4">
                  {(data.traffic?.sources || []).map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center relative" style={{
                          background: `conic-gradient(${COLORS[index]} 0deg ${source.percentage * 3.6}deg, rgba(100, 116, 139, 0.2) ${source.percentage * 3.6}deg 360deg)`
                        }}>
                          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold" style={{ color: COLORS[index] }}>
                              {Math.round(source.percentage)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-300 font-medium flex items-center gap-2">
                            {source.source}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              source.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {source.change >= 0 ? '+' : ''}{source.change}%
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {source.visits.toLocaleString()} visits • {source.bounce}% bounce • {Math.floor(source.avgDuration / 60)}m avg
                          </div>
                        </div>
                      </div>
                      <FiArrowUp className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Devices & Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Device Breakdown */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Device & Browser Analytics</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-slate-400 text-sm mb-3">Device Type</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={data.technical.devices}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {(data.technical?.devices || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm mb-3">Browser Share</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={data.technical.browsers}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="users"
                        >
                          {(data.technical?.browsers || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-3">
                  {(data.technical?.devices || []).map((device, index) => {
                    const Icon = device.device === 'Desktop' ? FiMonitor : device.device === 'Mobile' ? FiSmartphone : FiTablet;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="text-slate-400" />
                          <div>
                            <span className="text-slate-300 block">{device.device}</span>
                            <span className="text-xs text-slate-500">{Math.floor(device.avgSession / 60)}m avg • {device.bounceRate}% bounce</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-400 font-semibold">{device.percentage}%</div>
                          <div className="text-xs text-slate-500">{device.count.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Geographic Distribution</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {(data.locations || []).map((location, index) => (
                    <div key={index} className="space-y-2 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FiMapPin className="text-cyan-400" />
                          <div>
                            <span className="text-slate-300 font-medium">{location.city}, {location.country}</span>
                            <span className="text-xs text-slate-500 block">{location.visits.toLocaleString()} visits</span>
                          </div>
                        </div>
                        <span className="text-cyan-400 text-sm font-semibold">
                          {location.percentage}%
                        </span>
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Top Performing Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.topProjects || []).map((project, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg p-5 hover:bg-slate-900/70 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-slate-300 font-medium flex-1">{project.name}</h4>
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-500 flex items-center gap-1">
                          <FiEye className="text-cyan-400" />
                          Views
                        </span>
                        <span className="text-slate-300 font-semibold">{project.views}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-500 flex items-center gap-1">
                          <FiHeart className="text-pink-400" />
                          Likes
                        </span>
                        <span className="text-slate-300 font-semibold">{project.likes}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-500 flex items-center gap-1">
                          <FiShare2 className="text-blue-400" />
                          Shares
                        </span>
                        <span className="text-slate-300 font-semibold">{project.shares}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-500 flex items-center gap-1">
                          <FiMousePointer className="text-purple-400" />
                          Demos
                        </span>
                        <span className="text-slate-300 font-semibold">{project.demos}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Conversion Rate</span>
                        <span className="text-green-400 font-semibold">
                          {((project.conversions / project.views) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals Progress */}
            {goals && goals.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Goals & Objectives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(data.conversion?.goals || []).map((goal, index) => (
                    <div key={index} className="p-4 bg-slate-900/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <FiTarget className="text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-slate-300 font-medium">{goal.name}</h4>
                            <p className="text-xs text-slate-500">{goal.completions} completions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-400 font-bold text-lg">{goal.conversionRate}%</div>
                          <div className="text-xs text-slate-500">${goal.value.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${goal.conversionRate * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Traffic Mode */}
        {viewMode === 'traffic' && (
          <div className="space-y-8">
            {/* Traffic Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Sessions"
                value="23,456"
                change={15.3}
                icon={FiActivity}
                color="cyan"
                description="Total user sessions"
              />
              <MetricCard
                title="New Users"
                value="8,234"
                change={12.7}
                icon={FiUsers}
                color="blue"
                description="First-time visitors"
              />
              <MetricCard
                title="Returning Users"
                value="15,222"
                change={8.9}
                icon={FiUsers}
                color="purple"
                description="Repeat visitors"
              />
            </div>

            {/* Traffic Sources Detail */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Traffic Sources Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-medium pb-3">Source</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Visits</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Share</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Bounce Rate</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Avg. Duration</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.traffic?.sources || []).map((source, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-900/30">
                        <td className="py-4 text-slate-300 font-medium">{source.source}</td>
                        <td className="py-4 text-right text-slate-300">{source.visits.toLocaleString()}</td>
                        <td className="py-4 text-right text-cyan-400">{source.percentage}%</td>
                        <td className="py-4 text-right text-slate-400">{source.bounce}%</td>
                        <td className="py-4 text-right text-slate-400">{Math.floor(source.avgDuration / 60)}m {source.avgDuration % 60}s</td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            source.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {source.change >= 0 ? '+' : ''}{source.change}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Referrers & Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Referrers */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Top Referrers</h3>
                <div className="space-y-3">
                  {(data.traffic?.referrers || []).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FiLink className="text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-300 font-medium truncate">{referrer.url}</div>
                          <div className="text-xs text-slate-500">{referrer.visits.toLocaleString()} visits</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 text-sm font-semibold">{referrer.conversions}</div>
                        <div className="text-xs text-slate-500">conversions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaigns Performance */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Campaign Performance</h3>
                <div className="space-y-4">
                  {(data.traffic?.campaigns || []).map((campaign, index) => (
                    <div key={index} className="p-4 bg-slate-900/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-slate-300 font-medium">{campaign.name}</h4>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          ROI: {campaign.roi}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500 text-xs">Clicks</div>
                          <div className="text-slate-300 font-semibold">{campaign.clicks.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Conversions</div>
                          <div className="text-green-400 font-semibold">{campaign.conversions}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs">Cost</div>
                          <div className="text-slate-300 font-semibold">${campaign.cost}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO Keywords */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Top SEO Keywords</h3>
              <div className="space-y-3">
                {(data.traffic?.keywords || []).map((keyword, index) => (
                  <div key={index} className="p-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-medium">{keyword.keyword}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          keyword.position <= 3 ? 'bg-green-500/20 text-green-400' :
                          keyword.position <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          Pos #{keyword.position.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-cyan-400 font-semibold">{keyword.clicks}</span>
                        <span className="text-slate-500"> / {keyword.searches} searches</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>CTR: {keyword.ctr}%</span>
                      <span>Difficulty: {keyword.difficulty}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Behavior Mode */}
        {viewMode === 'behavior' && (
          <div className="space-y-8">
            {/* Behavior Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Avg. Pages/Session"
                value={data.overview?.summary?.pageviewsPerSession?.toFixed(1) || '0.0'}
                change={8.5}
                icon={FiActivity}
                color="cyan"
                description="Pages viewed per session"
              />
              <MetricCard
                title="Avg. Time on Page"
                value="3m 24s"
                change={12.3}
                icon={FiClock}
                color="blue"
                description="Average engagement time"
              />
              <MetricCard
                title="Bounce Rate"
                value={`${data.overview?.summary?.bounceRate || 0}%`}
                change={-5.2}
                icon={FiTrendingUp}
                color="purple"
                description="Single page sessions"
              />
              <MetricCard
                title="Exit Rate"
                value="25.4%"
                change={-3.1}
                icon={FiArrowDown}
                color="pink"
                description="Page exit percentage"
              />
            </div>

            {/* User Flow Visualization */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">User Journey Flow</h3>
              <div className="space-y-4">
                {(data.behavior?.userFlow || []).map((flow, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="text-cyan-400 font-medium">{flow.from}</div>
                        <div className="text-xs text-slate-500 mt-1">{flow.users.toLocaleString()} users</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FiArrowUp className="text-cyan-400 rotate-90" />
                        <span className="text-xs text-slate-500">{100 - flow.dropoff}%</span>
                      </div>
                      <div className="flex-1 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="text-blue-400 font-medium">{flow.to}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {Math.floor(flow.users * (1 - flow.dropoff / 100)).toLocaleString()} users
                        </div>
                      </div>
                    </div>
                    {flow.dropoff > 0 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                          {flow.dropoff}% drop-off
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Event Tracking */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Custom Events Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.behavior?.eventTracking || []).map((event, index) => (
                  <div key={index} className="p-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                        <FiMousePointer className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-300 font-medium truncate">{event.event}</h4>
                        <p className="text-xs text-slate-500">{event.uniqueUsers.toLocaleString()} unique users</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs">Total Events</div>
                        <div className="text-cyan-400 font-bold">{event.count.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Avg/User</div>
                        <div className="text-blue-400 font-bold">{event.avgPerUser.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Search Analysis */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Site Search Terms</h3>
              <div className="space-y-3">
                {(data.behavior?.searchTerms || []).map((search, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FiSearch className="text-cyan-400" />
                      <div>
                        <div className="text-slate-300 font-medium">{search.term}</div>
                        <div className="text-xs text-slate-500">{search.searches} searches • {search.results} results</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">{search.clicks}</div>
                      <div className="text-xs text-slate-500">clicks</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversion Mode */}
        {viewMode === 'conversion' && (
          <div className="space-y-8">
            {/* Conversion Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Overall Conversion"
                value={`${data.overview?.summary?.conversionRate || 0}%`}
                change={data.overview?.trends?.conversionChange || 0}
                icon={FiTarget}
                color="green"
                description="Overall conversion rate"
              />
              <MetricCard
                title="Goal Completions"
                value={data.overview?.summary?.goalCompletions || 0}
                change={15.7}
                icon={FiCheckCircle}
                color="cyan"
                description="Total goals achieved"
              />
              <MetricCard
                title="Total Revenue"
                value={`$${data.overview?.summary?.totalRevenue?.toLocaleString() || '0'}`}
                change={data.overview?.trends?.revenueChange || 0}
                icon={FiDollarSign}
                color="green"
                description="Generated revenue"
              />
              <MetricCard
                title="Avg. Order Value"
                value="$98.50"
                change={8.3}
                icon={FiShoppingCart}
                color="blue"
                description="Average transaction value"
              />
            </div>

            {/* Conversion Funnel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Conversion Funnel</h3>
              <div className="space-y-4">
                {(data.conversion?.funnel || []).map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-medium">{stage.stage}</span>
                        <span className="text-xs text-slate-500">{stage.users.toLocaleString()} users</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-semibold">{stage.conversion}%</span>
                        {index > 0 && (
                          <span className="text-xs text-red-400">
                            -{stage.dropoff}% drop-off
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-12 bg-slate-700/30 rounded-lg overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-4"
                        style={{ width: `${stage.conversion}%` }}
                      >
                        <span className="text-white font-bold text-sm">{stage.users.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution Models */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Attribution Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-medium pb-3">Channel</th>
                      <th className="text-right text-slate-400 font-medium pb-3">First Click</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Last Click</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Linear</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Time Decay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.conversion?.attribution || []).map((attr, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-900/30">
                        <td className="py-4 text-slate-300 font-medium">{attr.channel}</td>
                        <td className="py-4 text-right text-slate-300">{attr.firstClick}</td>
                        <td className="py-4 text-right text-slate-300">{attr.lastClick}</td>
                        <td className="py-4 text-right text-slate-300">{attr.linear}</td>
                        <td className="py-4 text-right text-cyan-400 font-semibold">{attr.timeDecay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cohort Analysis */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">User Retention Cohort</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-medium pb-3 pr-6">Cohort</th>
                      <th className="text-right text-slate-400 font-medium pb-3 px-2">Users</th>
                      {Array.from({ length: 8 }, (_, i) => (
                        <th key={i} className="text-right text-slate-400 font-medium pb-3 px-2">W{i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.conversion?.cohortAnalysis || []).map((cohort, index) => (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 text-slate-300 font-medium pr-6">{cohort.week}</td>
                        <td className="py-3 text-right text-slate-300 px-2">{cohort.users}</td>
                        {Array.from({ length: 8 }, (_, i) => (
                          <td key={i} className="py-3 text-right px-2">
                            {cohort.retention[i] !== undefined ? (
                              <span className={`px-2 py-1 rounded ${
                                cohort.retention[i] >= 70 ? 'bg-green-500/20 text-green-400' :
                                cohort.retention[i] >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                cohort.retention[i] >= 30 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {cohort.retention[i]}%
                              </span>
                            ) : (
                              <span className="text-slate-700">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Mode */}
        {viewMode === 'realtime' && (
          <div className="space-y-8">
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  {(data.overview?.chartData || []).slice(-6).reduce((sum, d) => sum + (d.views || 0), 0)}
                </p>
                <p className="text-slate-500 text-sm mt-2">Last hour</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Avg. Duration</h3>
                <p className="text-4xl font-bold text-blue-400">3m 45s</p>
                <p className="text-slate-500 text-sm mt-2">Current session</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Events (5m)</h3>
                <p className="text-4xl font-bold text-purple-400">47</p>
                <p className="text-slate-500 text-sm mt-2">Recent interactions</p>
              </div>
            </div>

            {/* Active Pages */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Active Pages Right Now</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.behavior?.pageViews || []).slice(0, 6).map((page, index) => (
                  <div key={index} className="p-4 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-slate-300 font-medium">{page.page}</h4>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        {page.uniqueViews || 0} unique
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{page.views || 0} views</span>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {(data.realtimeActivity || []).map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors animate-slideIn"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                      <FiActivity className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-300 text-sm font-medium">{activity.action}</p>
                        {activity.isNewUser && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FiMapPin className="text-cyan-400" />
                          {activity.location}
                        </span>
                        <span className="flex items-center gap-1">
                          {activity.device === 'Desktop' ? <FiMonitor /> : <FiSmartphone />}
                          {activity.device}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiGlobe />
                          {activity.browser}
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

        {/* Advanced Mode */}
        {viewMode === 'advanced' && (
          <div className="space-y-8">
            {/* Technical Performance */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Technical Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-slate-400 font-medium mb-4">Page Load Times</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-slate-300">Average</span>
                      <span className="text-cyan-400 font-semibold">{data.technical?.loadTimes?.avg || 0}s</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-slate-300">Median</span>
                      <span className="text-blue-400 font-semibold">{data.technical?.loadTimes?.median || 0}s</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-slate-300">95th Percentile</span>
                      <span className="text-purple-400 font-semibold">{data.technical?.loadTimes?.p95 || 0}s</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded">
                      <span className="text-slate-300">99th Percentile</span>
                      <span className="text-pink-400 font-semibold">{data.technical?.loadTimes?.p99 || 0}s</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-slate-400 font-medium mb-4">Load Time by Page</h4>
                  <div className="space-y-3">
                    {(data.technical?.loadTimes?.byPage || []).map((page, index) => (
                      <div key={index} className="p-3 bg-slate-900/30 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 font-medium">{page.page}</span>
                          <span className="text-cyan-400">{page.avg}s</span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>Median: {page.median}s</span>
                          <span>P95: {page.p95}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PageSpeed Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Mobile Performance</h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Performance Score</span>
                    <span className="text-3xl font-bold text-green-400">{data.seo.pageSpeed.mobile.score}</span>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${data.seo.pageSpeed.mobile.score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">First Contentful Paint</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.mobile.fcp}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Largest Contentful Paint</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.mobile.lcp}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Cumulative Layout Shift</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.mobile.cls}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Time to Interactive</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.mobile.tti}s</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">Desktop Performance</h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Performance Score</span>
                    <span className="text-3xl font-bold text-green-400">{data.seo.pageSpeed.desktop.score}</span>
                  </div>
                  <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${data.seo.pageSpeed.desktop.score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">First Contentful Paint</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.desktop.fcp}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Largest Contentful Paint</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.desktop.lcp}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Cumulative Layout Shift</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.desktop.cls}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Time to Interactive</span>
                    <span className="text-slate-300 font-medium">{data.seo.pageSpeed.desktop.tti}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Rankings */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">SEO Rankings & Backlinks</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-slate-400 font-medium mb-4">Keyword Rankings</h4>
                  <div className="space-y-3">
                    {(data.seo?.rankings || []).map((keyword, index) => (
                      <div key={index} className="p-3 bg-slate-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 font-medium">{keyword.keyword}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              keyword.position < keyword.previousPosition 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {keyword.position < keyword.previousPosition ? '↑' : '↓'} 
                              {Math.abs(keyword.position - keyword.previousPosition)}
                            </span>
                            <span className="text-cyan-400 font-bold">#{keyword.position}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{keyword.searches.toLocaleString()} searches/mo</span>
                          <span>Difficulty: {keyword.difficulty}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 font-medium mb-4">Top Backlinks</h4>
                  <div className="space-y-3">
                    {(data.seo?.backlinks || []).map((backlink, index) => (
                      <div key={index} className="p-3 bg-slate-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 font-medium">{backlink.domain}</span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            DA: {backlink.authority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{backlink.links} links</span>
                          <span>{backlink.dofollow} dofollow</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Analytics */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Social Media Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(data.social?.followers || {}).map(([platform, stats]) => (
                  <div key={platform} className="p-4 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-slate-300 font-medium capitalize">{platform}</h4>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        +{stats.growth}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 mb-2">
                      {stats.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stats.engagement}% engagement rate
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-slate-400 font-medium">Social Shares & Engagement</h4>
                {(data.social?.shares || []).map((share, index) => (
                  <div key={index} className="p-4 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">{share.platform}</span>
                      <span className="text-cyan-400 font-semibold">{share.engagement}% engagement</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                      <span>{share.shares.toLocaleString()} shares</span>
                      <span>{share.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Tracking */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Error Monitoring</h3>
              <div className="space-y-3">
                {(data.technical?.errors || []).map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <FiAlertCircle className={`text-2xl ${
                        error.impact === 'high' ? 'text-red-400' :
                        error.impact === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`} />
                      <div>
                        <div className="text-slate-300 font-medium">{error.error}</div>
                        <div className="text-xs text-slate-500">{error.count} occurrences</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      error.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                      error.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {error.impact} impact
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* A/B Test Results */}
            {abTests && abTests.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-6">A/B Test Results</h3>
                <div className="space-y-4">
                  {(abTests || []).map((test, index) => (
                    <div key={index} className="p-4 bg-slate-900/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-slate-300 font-medium">{test.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          test.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                          test.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-800/50 rounded">
                          <div className="text-xs text-slate-500 mb-1">Variant A (Control)</div>
                          <div className="text-lg font-bold text-slate-300">{test.variantA.conversionRate}%</div>
                          <div className="text-xs text-slate-500">{test.variantA.visitors.toLocaleString()} visitors</div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded border-2 border-cyan-500/30">
                          <div className="text-xs text-slate-500 mb-1">Variant B (Test)</div>
                          <div className="text-lg font-bold text-cyan-400">{test.variantB.conversionRate}%</div>
                          <div className="text-xs text-slate-500">{test.variantB.visitors.toLocaleString()} visitors</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Improvement</span>
                          <span className="text-green-400 font-semibold">+{test.improvement}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Scrollbar & Animation Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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