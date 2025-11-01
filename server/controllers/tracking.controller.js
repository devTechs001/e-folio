// controllers/trackingController.js
const TrackingSession = require('../models/TrackingSession');
const PageAnalytics = require('../models/PageAnalytics');
const asyncHandler = require('express-async-handler');
// const AIAnalysisService = require('../services/AIAnalysisService'); // Disabled - requires TensorFlow rebuild
const GeoLocationService = require('../services/GeoLocationService');
const { v4: uuidv4 } = require('uuid');

// @desc    Initialize tracking session
// @route   POST /api/tracking/session
// @access  Public
exports.initSession = asyncHandler(async (req, res) => {
    const { referrer, campaign, medium, source } = req.body;
    
    // Generate unique session ID
    const sessionId = uuidv4();
    
    // Get device info from user agent
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    
    // Get location from IP
    const location = await GeoLocationService.getLocation(req.ip);
    
    // Create session
    const session = await TrackingSession.create({
        sessionId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        browser: deviceInfo.browser,
        device: deviceInfo.device,
        location,
        source: {
            referrer,
            campaign,
            medium,
            source
        }
    });

    res.json({
        success: true,
        sessionId: session.sessionId
    });
});

// @desc    Track page view
// @route   POST /api/tracking/pageview
// @access  Public
exports.trackPageView = asyncHandler(async (req, res) => {
    const { sessionId, page, title, timeSpent, scrollDepth, interactions } = req.body;

    if (!sessionId) {
        res.status(400);
        throw new Error('Session ID required');
    }

    // Update session
    const session = await TrackingSession.findOne({ sessionId });
    
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Add to page journey
    session.pageJourney.push({
        path: page,
        title,
        timestamp: new Date(),
        timeSpent: timeSpent || 0,
        interactions: interactions || 0
    });

    session.pagesViewed += 1;
    if (scrollDepth) session.scrollDepth = Math.max(session.scrollDepth, scrollDepth);

    // Update AI insights
    session.aiInsights = await AIAnalysisService.analyzeSession(session);

    await session.save();

    // Update page analytics
    await updatePageAnalytics(page, title, timeSpent, scrollDepth);

    // Broadcast to WebSocket if high engagement
    if (session.aiInsights.engagementLevel === 'very_high' || session.aiInsights.engagementLevel === 'high') {
        broadcastHighEngagement(session);
    }

    res.json({
        success: true,
        aiInsights: session.aiInsights
    });
});

// @desc    Track event
// @route   POST /api/tracking/event
// @access  Public
exports.trackEvent = asyncHandler(async (req, res) => {
    const { sessionId, eventType, eventData } = req.body;

    const session = await TrackingSession.findOne({ sessionId });
    
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Add event
    session.events.push({
        type: eventType,
        data: eventData,
        timestamp: new Date()
    });

    // Increment clicks if it's a click event
    if (eventType === 'click') {
        session.clicks += 1;
    }

    // Check for conversion events
    if (eventType === 'conversion') {
        session.converted = true;
        session.conversionType = eventData.type;
        session.conversionValue = eventData.value;
    }

    // Re-analyze with new event
    session.aiInsights = await AIAnalysisService.analyzeSession(session);

    await session.save();

    res.json({
        success: true,
        aiInsights: session.aiInsights
    });
});

// @desc    End session
// @route   POST /api/tracking/session/end
// @access  Public
exports.endSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    const session = await TrackingSession.findOne({ sessionId });
    
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    session.endTime = new Date();
    session.isActive = false;
    session.duration = session.endTime - session.startTime;

    // Final AI analysis
    session.aiInsights = await AIAnalysisService.analyzeSession(session);

    await session.save();

    res.json({
        success: true,
        message: 'Session ended'
    });
});

// @desc    Get real-time analytics
// @route   GET /api/tracking/analytics/realtime
// @access  Private (Owner only)
exports.getRealtimeAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = 'today' } = req.query;
    
    const dateFilter = getDateFilter(timeRange);
    
    // Active sessions now
    const activeNow = await TrackingSession.countDocuments({
        isActive: true,
        startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 min
    });

    // Total today
    const todayTotal = await TrackingSession.countDocuments(dateFilter);

    // Recent visitors
    const recentVisitors = await TrackingSession.find(dateFilter)
        .sort({ startTime: -1 })
        .limit(20)
        .lean();

    // Device breakdown
    const deviceAgg = await TrackingSession.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                mobile: { $sum: { $cond: ['$device.isMobile', 1, 0] } },
                tablet: { $sum: { $cond: ['$device.isTablet', 1, 0] } },
                desktop: { $sum: { $cond: [{ $and: [{ $not: '$device.isMobile' }, { $not: '$device.isTablet' }] }, 1, 0] } }
            }
        }
    ]);

    const devices = deviceAgg[0] || { mobile: 0, tablet: 0, desktop: 0 };

    // Geographic distribution
    const locations = await TrackingSession.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Top pages
    const topPages = await PageAnalytics.aggregate([
        { $match: { date: { $gte: dateFilter.startTime } } },
        {
            $group: {
                _id: '$path',
                count: { $sum: '$views' },
                avgTime: { $avg: '$avgTimeSpent' },
                uniqueViews: { $sum: '$uniqueViews' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Traffic sources
    const sources = await TrackingSession.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                direct: { $sum: { $cond: [{ $eq: ['$source.referrer', null] }, 1, 0] } },
                search: { $sum: { $cond: [{ $regexMatch: { input: '$source.referrer', regex: /google|bing|yahoo/ } }, 1, 0] } },
                social: { $sum: { $cond: [{ $regexMatch: { input: '$source.referrer', regex: /facebook|twitter|linkedin|instagram/ } }, 1, 0] } },
                referral: { $sum: { $cond: [{ $and: [{ $ne: ['$source.referrer', null] }, { $not: { $regexMatch: { input: '$source.referrer', regex: /google|bing|yahoo|facebook|twitter/ } } }] }, 1, 0] } }
            }
        }
    ]);

    // Engagement metrics
    const engagementAgg = await TrackingSession.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                avgEngagement: { $avg: '$aiInsights.intentScore' },
                avgDuration: { $avg: '$duration' },
                avgPages: { $avg: '$pagesViewed' },
                avgScrollDepth: { $avg: '$scrollDepth' }
            }
        }
    ]);

    const engagement = engagementAgg[0] || {};

    // Conversion rate
    const conversions = await TrackingSession.countDocuments({
        ...dateFilter,
        converted: true
    });
    const conversionRate = todayTotal > 0 ? (conversions / todayTotal) * 100 : 0;

    // Bounce rate (single page visits)
    const bounces = await TrackingSession.countDocuments({
        ...dateFilter,
        pagesViewed: 1
    });
    const bounceRate = todayTotal > 0 ? (bounces / todayTotal) * 100 : 0;

    // Traffic history (for charts)
    const trafficHistory = await getTrafficHistory(timeRange);

    res.json({
        success: true,
        analytics: {
            activeNow,
            todayTotal,
            recentVisitors,
            devices,
            locations,
            topPages,
            sources: sources[0] || { direct: 0, search: 0, social: 0, referral: 0 },
            averageEngagement: Math.round(engagement.avgEngagement || 0),
            conversionRate: conversionRate.toFixed(2),
            bounceRate: bounceRate.toFixed(2),
            aiConfidence: 94, // Could be calculated from AI model confidence
            trafficHistory
        }
    });
});

// @desc    Get heatmap data
// @route   GET /api/tracking/heatmap
// @access  Private
exports.getHeatmapData = asyncHandler(async (req, res) => {
    const { page, timeRange = 'week' } = req.query;
    
    const dateFilter = getDateFilter(timeRange);

    const heatmapData = await PageAnalytics.findOne({
        path: page || '/',
        date: { $gte: dateFilter.startTime }
    }).select('heatmap');

    res.json({
        success: true,
        heatmap: heatmapData?.heatmap || { clicks: [], scrollDepth: [] }
    });
});

// @desc    Get conversion funnel
// @route   GET /api/tracking/funnel
// @access  Private
exports.getConversionFunnel = asyncHandler(async (req, res) => {
    const { timeRange = 'week' } = req.query;
    const dateFilter = getDateFilter(timeRange);

    const totalVisitors = await TrackingSession.countDocuments(dateFilter);
    
    const viewedProjects = await TrackingSession.countDocuments({
        ...dateFilter,
        pageJourney: { $elemMatch: { path: { $regex: /projects/ } } }
    });

    const viewedContact = await TrackingSession.countDocuments({
        ...dateFilter,
        pageJourney: { $elemMatch: { path: { $regex: /contact/ } } }
    });

    const conversions = await TrackingSession.countDocuments({
        ...dateFilter,
        converted: true
    });

    const funnel = [
        {
            name: 'Visitors',
            description: 'Total site visitors',
            count: totalVisitors,
            conversionRate: 100
        },
        {
            name: 'Viewed Projects',
            description: 'Visited projects page',
            count: viewedProjects,
            conversionRate: ((viewedProjects / totalVisitors) * 100).toFixed(1)
        },
        {
            name: 'Viewed Contact',
            description: 'Visited contact page',
            count: viewedContact,
            conversionRate: ((viewedContact / totalVisitors) * 100).toFixed(1)
        },
        {
            name: 'Conversions',
            description: 'Completed desired action',
            count: conversions,
            conversionRate: ((conversions / totalVisitors) * 100).toFixed(1)
        }
    ];

    res.json({
        success: true,
        funnel
    });
});

// @desc    Get behavior patterns
// @route   GET /api/tracking/patterns
// @access  Private
exports.getBehaviorPatterns = asyncHandler(async (req, res) => {
    const { timeRange = 'week' } = req.query;
    const dateFilter = getDateFilter(timeRange);

    const patterns = await TrackingSession.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                avgSessionDuration: { $avg: '$duration' },
                avgPagesPerSession: { $avg: '$pagesViewed' },
                avgClicks: { $avg: '$clicks' },
                avgScrollDepth: { $avg: '$scrollDepth' },
                avgEngagement: { $avg: '$aiInsights.intentScore' }
            }
        }
    ]);

    res.json({
        success: true,
        patterns: patterns[0] || {}
    });
});

// @desc    Get predictive analytics
// @route   GET /api/tracking/predictive
// @access  Private
exports.getPredictiveAnalytics = asyncHandler(async (req, res) => {
    const predictions = await AIAnalysisService.generatePredictions();

    res.json({
        success: true,
        predictions
    });
});

// @desc    Export analytics
// @route   GET /api/tracking/export
// @access  Private
exports.exportAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = 'month', format = 'csv' } = req.query;
    const dateFilter = getDateFilter(timeRange);

    const sessions = await TrackingSession.find(dateFilter).lean();

    if (format === 'csv') {
        const csv = generateCSV(sessions);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
        res.send(csv);
    } else {
        res.json({
            success: true,
            data: sessions
        });
    }
});

// Helper Functions

function parseUserAgent(userAgent) {
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    
    let browser = 'Unknown';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    let os = 'Unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

    return {
        browser,
        device: {
            type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            isMobile,
            isTablet,
            os
        }
    };
}

async function updatePageAnalytics(page, title, timeSpent, scrollDepth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await PageAnalytics.findOne({ path: page, date: today });

    if (analytics) {
        analytics.views += 1;
        analytics.totalTimeSpent += timeSpent || 0;
        analytics.avgTimeSpent = analytics.totalTimeSpent / analytics.views;
        
        if (scrollDepth) {
            analytics.scrollDepth.avg = ((analytics.scrollDepth.avg * (analytics.views - 1)) + scrollDepth) / analytics.views;
            analytics.scrollDepth.max = Math.max(analytics.scrollDepth.max || 0, scrollDepth);
        }

        await analytics.save();
    } else {
        await PageAnalytics.create({
            path: page,
            title,
            date: today,
            views: 1,
            uniqueViews: 1,
            totalTimeSpent: timeSpent || 0,
            avgTimeSpent: timeSpent || 0,
            scrollDepth: {
                avg: scrollDepth || 0,
                max: scrollDepth || 0
            }
        });
    }
}

function getDateFilter(timeRange) {
    const now = new Date();
    let startTime;

    switch (timeRange) {
        case 'realtime':
            startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
            break;
        case 'today':
            startTime = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startTime = new Date(now.setHours(0, 0, 0, 0));
    }

    return { startTime: { $gte: startTime } };
}

async function getTrafficHistory(timeRange) {
    const now = new Date();
    let groupBy, intervals;

    if (timeRange === 'today' || timeRange === 'realtime') {
        groupBy = { $hour: '$startTime' };
        intervals = 24;
    } else if (timeRange === 'week') {
        groupBy = { $dayOfWeek: '$startTime' };
        intervals = 7;
    } else if (timeRange === 'month') {
        groupBy = { $dayOfMonth: '$startTime' };
        intervals = 30;
    } else {
        groupBy = { $month: '$startTime' };
        intervals = 12;
    }

    const dateFilter = getDateFilter(timeRange);

    const history = await TrackingSession.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: groupBy,
                visitors: { $sum: 1 },
                pageViews: { $sum: '$pagesViewed' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Format labels
    return history.map(h => ({
        label: formatHistoryLabel(h._id, timeRange),
        visitors: h.visitors,
        pageViews: h.pageViews
    }));
}

function formatHistoryLabel(value, timeRange) {
    if (timeRange === 'today' || timeRange === 'realtime') {
        return `${value}:00`;
    } else if (timeRange === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[value - 1];
    } else if (timeRange === 'month') {
        return `Day ${value}`;
    } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[value - 1];
    }
}

function generateCSV(sessions) {
    const headers = ['Session ID', 'Start Time', 'Duration', 'Pages Viewed', 'Clicks', 'Device', 'Location', 'Engagement', 'Converted'];
    
    const rows = sessions.map(s => [
        s.sessionId,
        new Date(s.startTime).toISOString(),
        Math.round((s.duration || 0) / 1000),
        s.pagesViewed,
        s.clicks,
        s.device?.isMobile ? 'Mobile' : 'Desktop',
        `${s.location?.city || ''}, ${s.location?.country || ''}`,
        s.aiInsights?.engagementLevel || 'low',
        s.converted ? 'Yes' : 'No'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function broadcastHighEngagement(session) {
    // This will be handled by WebSocket server
    global.io?.emit('high_engagement', {
        type: 'high_engagement',
        message: `High engagement detected from ${session.location?.country || 'unknown location'}`,
        visitor: session
    });
}

module.exports = exports;