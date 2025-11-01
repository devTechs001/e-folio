// middleware/metricsMiddleware.js
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
});

const trackingSessionsTotal = new promClient.Counter({
    name: 'tracking_sessions_total',
    help: 'Total number of tracking sessions',
    labelNames: ['device_type', 'country']
});

const trackingPageviewsTotal = new promClient.Counter({
    name: 'tracking_pageviews_total',
    help: 'Total number of page views',
    labelNames: ['page']
});

const trackingConversionsTotal = new promClient.Counter({
    name: 'tracking_conversions_total',
    help: 'Total number of conversions',
    labelNames: ['conversion_type']
});

const trackingEngagementScore = new promClient.Gauge({
    name: 'tracking_engagement_score',
    help: 'Current engagement score',
    labelNames: ['session_id']
});

const activeVisitors = new promClient.Gauge({
    name: 'tracking_active_visitors',
    help: 'Number of currently active visitors'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(trackingSessionsTotal);
register.registerMetric(trackingPageviewsTotal);
register.registerMetric(trackingConversionsTotal);
register.registerMetric(trackingEngagementScore);
register.registerMetric(activeVisitors);

/**
 * Middleware to track HTTP metrics
 */
exports.metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route ? req.route.path : req.path;

        httpRequestDuration.observe(
            {
                method: req.method,
                route: route,
                status_code: res.statusCode
            },
            duration / 1000
        );

        httpRequestTotal.inc({
            method: req.method,
            route: route,
            status: res.statusCode
        });
    });

    next();
};

/**
 * Track session metrics
 */
exports.trackSessionMetrics = (session) => {
    trackingSessionsTotal.inc({
        device_type: session.device?.isMobile ? 'mobile' : 'desktop',
        country: session.location?.country || 'unknown'
    });

    if (session.aiInsights?.intentScore) {
        trackingEngagementScore.set(
            { session_id: session.sessionId },
            session.aiInsights.intentScore
        );
    }
};

/**
 * Track pageview metrics
 */
exports.trackPageviewMetrics = (page) => {
    trackingPageviewsTotal.inc({ page });
};

/**
 * Track conversion metrics
 */
exports.trackConversionMetrics = (conversionType) => {
    trackingConversionsTotal.inc({ conversion_type: conversionType });
};

/**
 * Update active visitors count
 */
exports.updateActiveVisitors = async () => {
    const TrackingSession = require('../models/TrackingSession');
    const count = await TrackingSession.countDocuments({
        isActive: true,
        startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    });
    activeVisitors.set(count);
};

/**
 * Metrics endpoint
 */
exports.metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports.register = register;