// controllers/trackingController.js
const TrackingSession = require('../models/TrackingSession');
const PageAnalytics = require('../models/PageAnalytics');
const asyncHandler = require('../middleware/async.middleware');
// const AIAnalysisService = require('../services/AIAnalysisService'); // Disabled - requires TensorFlow rebuild
const GeoLocationService = require('../services/GeoLocationService');
const { publishTrackingEvent } = require('../socket/tracking.handler');
// const { v4: uuidv4 } = require('uuid');

// Simple UUID generator fallback
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// @desc    Initialize tracking session
// @route   POST /api/tracking/session
// @access  Public
exports.initSession = asyncHandler(async (req, res) => {
    const { sessionId: existingSessionId, referrer, campaign, medium, source } = req.body;
    
    // Use frontend-provided sessionId if available, otherwise generate new one
    const sessionId = existingSessionId || uuidv4();
    
    // Check if session already exists (e.g. if init was called before)
    const existing = await TrackingSession.findOne({ sessionId });
    if (existing) {
        return res.json({
            success: true,
            sessionId: existing.sessionId
        });
    }
    
    // Get device info from user agent
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    
    // Get location from IP
    const location = await GeoLocationService.getLocationFromIP(req.ip);
    
    // Format referrer to be string only (extract the URL if it's an object)
    let referrerString = referrer;
    if (typeof referrer === 'object' && referrer.url) {
        referrerString = referrer.url;
    } else if (typeof referrer === 'object') {
        referrerString = referrer.source || 'direct';
    }
    
    // Create session
    const session = await TrackingSession.create({
        sessionId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        browser: deviceInfo.browser,
        device: deviceInfo.device,
        location,
        source: {
            referrer: referrerString,
            campaign,
            medium,
            source
        }
    });

    publishTrackingEvent('new_visitor', {
        sessionId: session.sessionId,
        location: session.location,
        device: session.device,
        source: session.source
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

    // Normalize page: frontend sends {path, title} object, backend expects string
    const pagePath = typeof page === 'object' && page !== null ? page.path : page;
    const pageTitle = typeof page === 'object' && page !== null ? (page.title || title) : title;

    // Find or create session (atomic upsert to prevent race conditions)
    const update = {
        $setOnInsert: {
            sessionId,
            startTime: new Date(),
            pagesViewed: 0,
            pageJourney: [],
            scrollDepth: 0,
            interactions: 0
        },
        $push: {
            pageJourney: {
                path: pagePath,
                title: pageTitle,
                timestamp: new Date(),
                timeSpent: timeSpent || 0,
                interactions: interactions || 0
            }
        },
        $inc: { pagesViewed: 1 },
        $set: { lastActivity: new Date() }
    };

    if (scrollDepth) {
        update.$max = { scrollDepth };
    }

    const session = await TrackingSession.findOneAndUpdate(
        { sessionId },
        update,
        { upsert: true, new: true }
    );

    // Update page analytics with normalized path (non-critical)
    try {
        await updatePageAnalytics(pagePath, pageTitle, timeSpent, scrollDepth);
    } catch (analyticsError) {
        console.warn('Failed to update page analytics:', analyticsError.message);
    }

    // Broadcast to WebSocket if high engagement (AI analysis service disabled)
    if (session.aiInsights && session.aiInsights.engagementLevel && 
        (session.aiInsights.engagementLevel === 'very_high' || session.aiInsights.engagementLevel === 'high')) {
        broadcastHighEngagement(session);
    }

    publishTrackingEvent('page_view', {
        sessionId,
        page: pagePath,
        title: pageTitle,
        timeSpent: timeSpent || 0,
        scrollDepth: scrollDepth || 0
    });

    res.json({
        success: true,
        aiInsights: session.aiInsights || {}
    });
});

// @desc    Track event
// @route   POST /api/tracking/event
// @access  Public
exports.trackEvent = asyncHandler(async (req, res) => {
    const { sessionId, eventType, eventData } = req.body;

    if (!sessionId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Session ID is required' 
        });
    }

    const session = await TrackingSession.findOne({ sessionId });
    
    if (!session) {
        // Create a new session if not found (for better UX)
        const newSession = new TrackingSession({
            sessionId,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            browser: 'unknown',
            device: { 
                type: 'unknown', 
                isMobile: false, 
                isTablet: false, 
                os: 'unknown' 
            },
            location: { 
                country: 'unknown', 
                city: 'unknown', 
                region: 'unknown',
                timezone: 'unknown'
            },
            source: {
                referrer: req.get('Referrer') || 'direct',
                campaign: '',
                medium: '',
                source: ''
            },
            events: eventType && eventData ? [{
                type: eventType,
                data: eventData,
                timestamp: new Date()
            }] : [],
            clicks: eventType === 'click' ? 1 : 0,
            scrollDepth: 0,
            timeOnPage: [],
            pageJourney: [],
            startTime: new Date(),
            lastActivity: new Date()
        });
        
        await newSession.save();
        
        publishTrackingEvent('event', { sessionId, eventType, eventData });

        return res.json({
            success: true,
            message: 'New session created and event tracked'
        });
    }

    // Add event to existing session
    session.events.push({
        type: eventType,
        data: eventData,
        timestamp: new Date()
    });

    // Increment clicks if it's a click event
    if (eventType === 'click') {
        session.clicks += 1;
    }

    session.lastActivity = new Date();
    await session.save();

    publishTrackingEvent('event', { sessionId, eventType, eventData });

    res.json({
        success: true,
        message: 'Event tracked successfully'
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

    // Final AI analysis - skip if service is disabled
    // const AIAnalysisService = require('../services/AIAnalysisService'); // Disabled - requires TensorFlow rebuild
    // if (typeof AIAnalysisService !== 'undefined' && AIAnalysisService.analyzeSession) {
    //     session.aiInsights = await AIAnalysisService.analyzeSession(session);
    // }

    await session.save();

    publishTrackingEvent('session_end', { sessionId, duration: session.duration });

    res.json({
        success: true,
        message: 'Session ended'
    });
});

// @desc    Get real-time analytics
// @route   GET /api/tracking/analytics/realtime
// @access  Private (Owner only)
exports.getRealtimeAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = 'today', device = 'all', location = 'all' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    const since = dateFilter.startTime.$gte;

    const match = { ...dateFilter };
    if (device === 'mobile') match['device.isMobile'] = true;
    else if (device === 'tablet') match['device.isTablet'] = true;
    else if (device === 'desktop') match['device.type'] = 'desktop';
    if (location && location !== 'all') match['location.country'] = location;

    const [
        activeNow, todayTotal, weekTotal, recentVisitors, devicesAgg,
        locations, topPages, referrers, engagementAgg, weeklyAgg, hourlyAgg,
        totalsAgg, conversions, bounces, trafficHistory
    ] = await Promise.all([
        TrackingSession.countDocuments({ isActive: true, startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) } }),
        TrackingSession.countDocuments(match),
        TrackingSession.countDocuments({ ...match, startTime: { $gte: new Date(Date.now() - 7 * 86400000) } }),
        TrackingSession.find(match).sort({ startTime: -1 }).limit(20).lean(),
        TrackingSession.aggregate([
            { $match: match },
            { $group: {
                _id: null,
                mobile: { $sum: { $cond: ['$device.isMobile', 1, 0] } },
                tablet: { $sum: { $cond: ['$device.isTablet', 1, 0] } },
                desktop: { $sum: { $cond: [{ $and: [{ $not: '$device.isMobile' }, { $not: '$device.isTablet' }] }, 1, 0] } }
            } }
        ]),
        TrackingSession.aggregate([
            { $match: match },
            { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 }
        ]),
        PageAnalytics.aggregate([
            { $match: { date: { $gte: since } } },
            { $group: {
                _id: '$path', count: { $sum: '$views' },
                avgDuration: { $avg: '$avgTimeSpent' }, uniqueViews: { $sum: '$uniqueViews' }
            } },
            { $sort: { count: -1 } }, { $limit: 10 }
        ]),
        TrackingSession.aggregate([
            { $match: match },
            { $group: { _id: { $ifNull: ['$source.source', 'direct'] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        TrackingSession.aggregate([
            { $match: match },
            { $group: {
                _id: null,
                avgEngagement: { $avg: '$aiInsights.intentScore' },
                avgDurationMs: { $avg: '$duration' },
                avgPages: { $avg: '$pagesViewed' },
                avgScrollDepth: { $avg: '$scrollDepth' }
            } }
        ]),
        TrackingSession.aggregate([
            { $match: { startTime: { $gte: new Date(Date.now() - 7 * 86400000) } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                visitors: { $sum: 1 }, pageViews: { $sum: '$pagesViewed' }
            } },
            { $sort: { _id: 1 } }
        ]),
        TrackingSession.aggregate([
            { $match: match },
            { $group: { _id: { $hour: '$startTime' }, visitors: { $sum: 1 } } }
        ]),
        TrackingSession.aggregate([
            { $match: match },
            { $group: { _id: null, pageViews: { $sum: '$pagesViewed' } } }
        ]),
        TrackingSession.countDocuments({ ...match, converted: true }),
        TrackingSession.countDocuments({ ...match, pagesViewed: 1 }),
        getTrafficHistory(timeRange)
    ]);

    const engagement = engagementAgg[0] || {};
    const devices = devicesAgg[0] || { mobile: 0, tablet: 0, desktop: 0 };
    delete devices._id;
    const totalPageViews = totalsAgg[0]?.pageViews || 0;
    const sourceTotal = referrers.reduce((n, r) => n + r.count, 0);

    const weeklyMap = new Map(weeklyAgg.map(r => [r._id, r]));
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(Date.now() - (6 - i) * 86400000);
        const key = day.toISOString().slice(0, 10);
        const row = weeklyMap.get(key) || {};
        return {
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            visitors: row.visitors || 0,
            pageViews: row.pageViews || 0
        };
    });
    const hourlyMap = new Map(hourlyAgg.map(r => [r._id, r.visitors]));
    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
        hour: `${String(h).padStart(2, '0')}:00`, visitors: hourlyMap.get(h) || 0
    }));

    const flatten = (v) => ({
        id: v.sessionId,
        sessionId: v.sessionId,
        location: v.location?.country || 'Unknown',
        page: v.pageJourney?.[0]?.path || '/',
        device: v.device?.type || 'desktop',
        browser: v.browser || 'Unknown',
        duration: Math.round((v.duration || 0) / 1000),
        timestamp: v.startTime,
        isActive: v.isActive
    });

    const flow = new Map();
    for (const session of recentVisitors) {
        const paths = (session.pageJourney || []).map(x => x.path).filter(Boolean);
        for (let i = 0; i < paths.length - 1; i++) {
            const key = `${paths[i]}|${paths[i + 1]}`;
            flow.set(key, (flow.get(key) || 0) + 1);
        }
    }
    const visitorFlow = [...flow.entries()].map(([key, count]) => {
        const [from, to] = key.split('|');
        return { from, to, fromCount: count, toCount: count };
    }).sort((a, b) => b.fromCount - a.fromCount).slice(0, 10);

    res.json({
        success: true,
        analytics: {
            activeNow,
            todayTotal,
            weekTotal,
            totalPageViews,
            avgDuration: Math.round((engagement.avgDurationMs || 0) / 1000),
            avgPages: Math.round((engagement.avgPages || 0) * 10) / 10,
            avgScrollDepth: Math.round(engagement.avgScrollDepth || 0),
            devices,
            locations,
            topPages,
            referrers: referrers.map(r => ({
                source: r._id || 'direct', count: r.count,
                percentage: sourceTotal ? Math.round((r.count / sourceTotal) * 1000) / 10 : 0
            })),
            sources: Object.fromEntries(referrers.map(r => [r._id || 'direct', r.count])),
            recentVisitors: recentVisitors.map(flatten),
            realtimeVisitors: recentVisitors.filter(v => v.isActive).map(flatten),
            visitorFlow,
            weeklyData,
            hourlyData,
            averageEngagement: Math.round(engagement.avgEngagement || 0),
            conversionRate: todayTotal > 0 ? (conversions / todayTotal * 100).toFixed(2) : '0.00',
            bounceRate: todayTotal > 0 ? (bounces / todayTotal * 100).toFixed(2) : '0.00',
            trafficHistory
        },
        meta: { source: 'mongo', populated: true }
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
        date: { $gte: dateFilter.startTime.$gte }
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
    // Note: AIAnalysisService is commented out to prevent server startup issues
    // const AIAnalysisService = require('../services/AIAnalysisService'); // Disabled - requires TensorFlow rebuild
    const predictions = { message: 'AI Analysis service is currently disabled', status: 'service_disabled' };

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
    if (!page) return;

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
    publishTrackingEvent('high_engagement', {
        sessionId: session.sessionId,
        engagementLevel: session.aiInsights?.engagementLevel
    });
    try {
        if (global.io) {
            global.io.emit('high_engagement', {
                type: 'high_engagement',
                message: `High engagement detected from ${session?.location?.country || 'unknown location'}`,
                visitor: session
            });
        }
    } catch (e) {
        // non-critical
    }
}

module.exports = exports;