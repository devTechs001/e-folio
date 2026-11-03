'use strict';
/**
 * Analytics controller — real, Mongo-backed aggregates.
 *
 * The previous implementation returned large hard-coded objects (fixed 2024
 * dates, invented traffic sources, fake revenue). Every dashboard therefore
 * looked healthy while showing numbers that had nothing to do with the site.
 *
 * This controller now derives everything it can from TrackingSession and
 * PageAnalytics, which are the documents the tracking endpoints actually
 * write. Views for which the project has no data source (SEO rankings, ad
 * campaigns, competitor traffic, A/B tests, configured goals) return an
 * explicit empty state with `meta.populated: false` instead of invented data.
 */

const asyncHandler = require('../middleware/async.middleware');
const TrackingSession = require('../models/TrackingSession');
const PageAnalytics = require('../models/PageAnalytics');
const Project = require('../models/Project.model');

const DAY = 86400000;

function rangeStart(timeRange = '7d') {
    const raw = String(timeRange).toLowerCase();
    if (raw === 'realtime') return new Date(Date.now() - 30 * 60 * 1000);
    if (raw === 'today' || raw === '24h' || raw === '1d') {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    }
    if (raw === '1h') return new Date(Date.now() - 3600000);
    if (raw === 'year' || raw === '365d') return new Date(Date.now() - 365 * DAY);
    const match = /^(\d+)\s*([dhm])?$/.exec(raw);
    const n = match ? Math.min(Math.max(parseInt(match[1], 10), 1), 365) : 7;
    const unit = match?.[2];
    if (unit === 'h') return new Date(Date.now() - n * 3600000);
    if (unit === 'm') return new Date(Date.now() - n * 30 * DAY);
    return new Date(Date.now() - n * DAY);
}

function dateMatch(req) {
    return { startTime: { $gte: rangeStart(req.query.timeRange || req.query.period || req.query.days) } };
}

/** Translate dashboard filter dropdowns into Mongo conditions. */
function applyFilters(query, req) {
    const { device, country, source } = req.query;
    if (device && device !== 'all') {
        if (device === 'mobile') query['device.isMobile'] = true;
        else if (device === 'tablet') query['device.isTablet'] = true;
        else if (device === 'desktop') query['device.type'] = 'desktop';
        else query['device.type'] = device;
    }
    if (country && country !== 'all') query['location.country'] = country;
    if (source && source !== 'all') query['source.source'] = source;
    return query;
}

const matchFor = req => applyFilters(dateMatch(req), req);
const pageMatchFor = req => ({ date: { $gte: rangeStart(req.query.timeRange || req.query.period) } });

const round = (n, dp = 1) => Math.round((Number(n) || 0) * 10 ** dp) / 10 ** dp;
const pct = (part, total) => (total > 0 ? round((part / total) * 100, 2) : 0);

function send(res, data, meta = {}) {
    res.json({ success: true, data, meta: { populated: true, source: 'mongo', ...meta } });
}

function sendEmpty(res, data, note) {
    res.json({ success: true, data, meta: { populated: false, note } });
}

/** One aggregate for the headline numbers shared by several endpoints. */
async function coreStats(match) {
    const [agg] = await TrackingSession.aggregate([
        { $match: match },
        { $group: {
            _id: null,
            sessions: { $sum: 1 },
            pageViews: { $sum: '$pagesViewed' },
            clicks: { $sum: '$clicks' },
            conversions: { $sum: { $cond: ['$converted', 1, 0] } },
            revenue: { $sum: { $ifNull: ['$conversionValue', 0] } },
            bounces: { $sum: { $cond: [{ $lte: ['$pagesViewed', 1] }, 1, 0] } },
            avgDurationMs: { $avg: '$duration' },
            avgPages: { $avg: '$pagesViewed' },
            avgScroll: { $avg: '$scrollDepth' }
        } }
    ]);
    const s = agg || {};
    const sessions = s.sessions || 0;
    return {
        sessions,
        pageViews: s.pageViews || 0,
        clicks: s.clicks || 0,
        conversions: s.conversions || 0,
        revenue: s.revenue || 0,
        bounces: s.bounces || 0,
        avgDurationSeconds: round((s.avgDurationMs || 0) / 1000, 0),
        avgPages: round(s.avgPages || 0),
        avgScroll: round(s.avgScroll || 0),
        bounceRate: pct(s.bounces || 0, sessions),
        conversionRate: pct(s.conversions || 0, sessions)
    };
}

async function dailyTrend(match, days) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            views: { $sum: '$pagesViewed' },
            visitors: { $sum: 1 },
            conversions: { $sum: { $cond: ['$converted', 1, 0] } },
            revenue: { $sum: { $ifNull: ['$conversionValue', 0] } }
        } },
        { $sort: { _id: 1 } }
    ]);
    const byDate = new Map(rows.map(r => [r._id, r]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * DAY);
        const key = d.toISOString().slice(0, 10);
        const row = byDate.get(key) || {};
        out.push({
            date: key,
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: row.views || 0,
            visitors: row.visitors || 0,
            conversions: row.conversions || 0,
            revenue: row.revenue || 0
        });
    }
    return out;
}

async function hourlyTrend(match) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: {
            _id: { $hour: '$startTime' },
            views: { $sum: '$pagesViewed' },
            visitors: { $sum: 1 }
        } }
    ]);
    const byHour = new Map(rows.map(r => [r._id, r]));
    return Array.from({ length: 24 }, (_, h) => ({
        hour: `${h}:00`,
        views: byHour.get(h)?.views || 0,
        visitors: byHour.get(h)?.visitors || 0,
        conversions: 0
    }));
}

async function topPages(pageMatch, limit = 10) {
    return PageAnalytics.aggregate([
        { $match: pageMatch },
        { $group: {
            _id: '$path',
            views: { $sum: '$views' },
            uniqueViews: { $sum: '$uniqueViews' },
            bounceRate: { $avg: '$bounceRate' },
            exitRate: { $avg: '$exitRate' },
            avgTime: { $avg: '$avgTimeSpent' }
        } },
        { $sort: { views: -1 } },
        { $limit: limit }
    ]).then(rows => rows.map(r => ({
        path: r._id, page: r._id, views: r.views, uniqueViews: r.uniqueViews,
        bounceRate: round(r.bounceRate || 0), exitRate: round(r.exitRate || 0),
        avgTimeSpent: round(r.avgTime || 0)
    })));
}

async function sourceBreakdown(match) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: {
            _id: { $ifNull: ['$source.source', 'direct'] },
            count: { $sum: 1 },
            avgDurationMs: { $avg: '$duration' },
            bounces: { $sum: { $cond: [{ $lte: ['$pagesViewed', 1] }, 1, 0] } }
        } },
        { $sort: { count: -1 } }
    ]);
    const total = rows.reduce((n, r) => n + r.count, 0);
    return rows.map(r => ({
        source: r._id || 'direct', name: r._id || 'direct',
        visits: r.count, count: r.count, percentage: pct(r.count, total),
        bounce: pct(r.bounces || 0, r.count),
        avgDuration: round((r.avgDurationMs || 0) / 1000, 0),
        change: 0
    }));
}

async function countryBreakdown(match) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 20 }
    ]);
    return rows.map(r => ({ name: r._id || 'Unknown', country: r._id || 'Unknown', visitors: r.count, count: r.count }));
}

async function deviceBreakdown(match) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$device.type', 'desktop'] }, count: { $sum: 1 } } }
    ]);
    const out = { desktop: 0, mobile: 0, tablet: 0 };
    for (const r of rows) {
        const key = String(r._id || 'desktop').toLowerCase();
        if (key in out) out[key] += r.count;
        else out.desktop += r.count;
    }
    return out;
}

async function browserBreakdown(match) {
    const rows = await TrackingSession.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$browser', 'Unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    return rows.map(r => ({ name: r._id, browser: r._id, count: r.count }));
}

async function recentEvents(match) {
    const sessions = await TrackingSession.find(match)
        .select('sessionId events pageJourney startTime location device browser')
        .sort({ startTime: -1 }).limit(50).lean();
    const events = [];
    const links = new Map();
    for (const s of sessions) {
        for (const e of s.events || []) {
            events.push({
                id: `${s.sessionId}-${events.length}`,
                name: e.type, type: e.type, category: e.type,
                timestamp: e.timestamp, count: 1,
                location: s.location?.country, device: s.device?.type, browser: s.browser
            });
        }
        const paths = (s.pageJourney || []).map(p => p.path).filter(Boolean);
        for (let i = 0; i < paths.length - 1; i++) {
            const key = `${paths[i]}|${paths[i + 1]}`;
            links.set(key, (links.get(key) || 0) + 1);
        }
    }
    const userFlow = [...links.entries()]
        .map(([key, users]) => {
            const [from, to] = key.split('|');
            return { from, to, users, fromCount: users, toCount: users };
        })
        .sort((a, b) => b.users - a.users).slice(0, 20);
    return { events, userFlow };
}

class AnalyticsController {
    /** Public visitor ping — persisted so it can actually be aggregated. */
    trackVisitor = asyncHandler(async (req, res) => {
        const { page, country, device, browser, ip, sessionId } = req.body || {};
        const id = sessionId || req.sessionID || `ping-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await TrackingSession.updateOne(
            { sessionId: id },
            {
                $setOnInsert: {
                    sessionId: id, ip, browser,
                    'device.type': device || 'desktop',
                    'location.country': country || 'Unknown',
                    startTime: new Date()
                },
                $inc: { pagesViewed: 1 }
            },
            { upsert: true }
        );
        if (page) {
            await PageAnalytics.updateOne(
                { path: page, date: new Date(new Date().setHours(0, 0, 0, 0)) },
                { $setOnInsert: { title: page }, $inc: { views: 1, uniqueViews: 1 } },
                { upsert: true }
            );
        }
        res.json({ success: true, message: 'Analytics tracked' });
    });

    getBasicAnalytics = asyncHandler(async (req, res) => {
        const match = dateMatch(req);
        const [stats, pages, countries, devices, browsers] = await Promise.all([
            coreStats(match), topPages(pageMatchFor(req)), countryBreakdown(match),
            deviceBreakdown(match), browserBreakdown(match)
        ]);
        const recent = await TrackingSession.find(match)
            .sort({ startTime: -1 }).limit(20).lean();
        send(res, {
            totalVisitors: stats.sessions,
            pageViews: stats.pageViews,
            topPages: pages,
            topCountries: countries,
            devices,
            browsers,
            recentVisitors: recent.map(s => ({
                page: s.pageJourney?.[0]?.path || '/',
                country: s.location?.country,
                device: s.device?.type,
                browser: s.browser,
                timestamp: s.startTime
            }))
        });
    });

    getOverview = asyncHandler(async (req, res) => {
        const match = matchFor(req);
        const days = Math.max(1, Math.round((Date.now() - rangeStart(req.query.timeRange)) / DAY));
        const [stats, trend, hourly, pages, sources, previous] = await Promise.all([
            coreStats(match), dailyTrend(match, Math.min(days, 90)), hourlyTrend(match),
            topPages(pageMatchFor(req)), sourceBreakdown(match),
            coreStats({ startTime: { $gte: new Date(rangeStart(req.query.timeRange).getTime() - days * DAY), $lt: rangeStart(req.query.timeRange) } })
        ]);
        const activeNow = await TrackingSession.countDocuments({
            isActive: true, startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        });
        const change = (a, b) => (b > 0 ? round(((a - b) / b) * 100, 2) : 0);
        const trafficSources = Object.fromEntries(sources.map(s => [s.source.toLowerCase(), s.percentage]));
        send(res, {
            overview: {
                summary: {
                    totalViews: stats.pageViews,
                    uniqueVisitors: stats.sessions,
                    avgSessionDuration: stats.avgDurationSeconds,
                    bounceRate: stats.bounceRate,
                    conversionRate: stats.conversionRate,
                    pageviewsPerSession: stats.avgPages,
                    totalRevenue: stats.revenue,
                    realtimeUsers: activeNow,
                    goalCompletions: stats.conversions,
                    newVsReturning: { new: 100, returning: 0 }
                },
                trends: {
                    viewsChange: change(stats.pageViews, previous.pageViews),
                    visitorsChange: change(stats.sessions, previous.sessions),
                    engagementChange: change(stats.avgPages, previous.avgPages),
                    conversionChange: change(stats.conversionRate, previous.conversionRate),
                    revenueChange: change(stats.revenue, previous.revenue)
                },
                trafficSources,
                topPages: pages,
                trafficTrend: trend.map(t => ({ date: t.date, views: t.views })),
                chartData: trend.map(t => ({
                    date: t.label, views: t.views, visitors: t.visitors,
                    engagement: t.visitors ? round(t.views / t.visitors) : 0,
                    conversions: t.conversions, revenue: t.revenue,
                    bounceRate: stats.bounceRate
                })),
                hourlyData: hourly
            }
        }, { note: 'New vs returning visitors requires a stable visitor identifier; shown as 100% new.' });
    });

    getTrafficAnalytics = asyncHandler(async (req, res) => {
        const match = matchFor(req);
        const [stats, sources, countries, devices, pages] = await Promise.all([
            coreStats(match), sourceBreakdown(match), countryBreakdown(match),
            deviceBreakdown(match), topPages(pageMatchFor(req))
        ]);
        const trend = await dailyTrend(match, Math.min(30, Math.max(1, Math.round((Date.now() - rangeStart(req.query.timeRange)) / DAY))));
        const referrers = await TrackingSession.aggregate([
            { $match: match },
            { $group: { _id: { $ifNull: ['$source.referrer', 'direct'] }, visits: { $sum: 1 } } },
            { $sort: { visits: -1 } }, { $limit: 10 }
        ]);
        send(res, {
            traffic: {
                sources,
                referrers: referrers.map(r => ({ url: r._id, visits: r.visits, conversions: 0, change: 0 })),
                campaigns: [], keywords: [],
                totalVisitors: stats.sessions,
                uniqueVisitors: stats.sessions,
                pageViews: stats.pageViews,
                avgSessionDuration: stats.avgDurationSeconds,
                bounceRate: stats.bounceRate,
                pagesPerSession: stats.avgPages,
                devices,
                countries: countries.map(c => ({ ...c, percentage: pct(c.count, stats.sessions) })),
                topPages: pages,
                trafficTrend: trend.map(t => ({ date: t.date, visitors: t.visitors }))
            }
        }, { note: 'Campaign and keyword data require ad/search-console integrations; those arrays are empty.' });
    });

    getBehaviorAnalytics = asyncHandler(async (req, res) => {
        const match = matchFor(req);
        const [stats, pages, flow] = await Promise.all([
            coreStats(match), topPages(pageMatchFor(req), 20), recentEvents(match)
        ]);
        const eventCounts = new Map();
        for (const e of flow.events) {
            eventCounts.set(e.name, (eventCounts.get(e.name) || 0) + 1);
        }
        send(res, {
            behavior: {
                pageViews: pages,
                userFlow: flow.userFlow,
                eventTracking: [...eventCounts.entries()].map(([name, count]) => ({
                    name, category: 'Tracked events', count, conversionRate: 0
                })),
                searchTerms: [],
                avgTimeOnPage: stats.avgDurationSeconds,
                avgPagesPerSession: stats.avgPages,
                bounceRate: stats.bounceRate,
                exitRate: 0,
                topExitPages: pages.slice(0, 5).map(p => ({ path: p.path, exitRate: p.exitRate })),
                scrollDepth: { avgDepth: stats.avgScroll, deepScrolls: 0, mediumScrolls: 0 },
                popularPaths: flow.userFlow.map(f => ({ path: f.from, next: f.to, count: f.users })),
                recentActivity: flow.events.slice(0, 20).map(e => ({
                    id: e.id, action: e.name, name: e.name,
                    location: e.location || 'Unknown', device: e.device || 'Unknown',
                    browser: e.browser || 'Unknown', timestamp: e.timestamp,
                    isNewUser: true
                }))
            }
        }, { note: 'Site search terms and deep-scroll buckets are not instrumented yet.' });
    });

    getConversionAnalytics = asyncHandler(async (req, res) => {
        const match = matchFor(req);
        const stats = await coreStats(match);
        const trend = await dailyTrend(match, 7);
        const converted = await TrackingSession.aggregate([
            { $match: { ...match, converted: true } },
            { $group: { _id: { $ifNull: ['$source.source', 'direct'] }, count: { $sum: 1 } } }
        ]);
        const conversionBySource = Object.fromEntries(
            converted.map(r => [String(r._id).toLowerCase(), pct(r.count, stats.sessions)])
        );
        send(res, {
            conversion: {
                goals: [],
                funnel: [
                    { stage: 'Sessions', users: stats.sessions, conversion: 100 },
                    { stage: 'Engaged (>1 page)', users: Math.max(0, stats.sessions - stats.bounces), conversion: pct(stats.sessions - stats.bounces, stats.sessions) },
                    { stage: 'Converted', users: stats.conversions, conversion: stats.conversionRate }
                ],
                attribution: converted.map(r => ({
                    channel: r._id, firstClick: `${pct(r.count, stats.conversions)}%`,
                    lastClick: `${pct(r.count, stats.conversions)}%`, linear: `${pct(r.count, stats.conversions)}%`
                })),
                cohortAnalysis: [],
                conversionRate: stats.conversionRate,
                totalConversions: stats.conversions,
                revenue: stats.revenue,
                topConvertingPages: [],
                conversionBySource,
                conversionTrend: trend.map(t => ({ date: t.date, conversions: t.conversions }))
            }
        }, { note: 'Goals, cohorts and per-page conversion require configured conversion events.' });
    });

    getTechnicalAnalytics = asyncHandler(async (req, res) => {
        const match = matchFor(req);
        const [devices, browsers, loadRows] = await Promise.all([
            deviceBreakdown(match), browserBreakdown(match),
            PageAnalytics.aggregate([
                { $match: pageMatchFor(req) },
                { $group: { _id: '$path', load: { $avg: '$loadTime.avg' }, views: { $sum: '$views' } } },
                { $sort: { load: -1 } }
            ])
        ]);
        const loads = loadRows.map(r => round(r.load || 0, 2)).filter(n => n > 0).sort((a, b) => a - b);
        const pick = p => (loads.length ? loads[Math.min(loads.length - 1, Math.floor(loads.length * p))] : 0);
        const total = Object.values(devices).reduce((a, b) => a + b, 0) || 1;
        send(res, {
            technical: {
                avgLoadTime: round(loads.reduce((a, b) => a + b, 0) / (loads.length || 1), 2),
                pageSpeed: 0, errorRate: 0, uptime: 100,
                topPerformingPages: loadRows.slice(0, 5).map(r => ({ path: r._id, loadTime: round(r.load) })),
                slowestPages: loadRows.slice(-5).reverse().map(r => ({ path: r._id, loadTime: round(r.load) })),
                browsers,
                devices: Object.entries(devices).map(([name, value]) => ({
                    name, value, percentage: pct(value, total)
                })),
                loadTimes: {
                    avg: round(loads.reduce((a, b) => a + b, 0) / (loads.length || 1), 2),
                    median: pick(0.5), p95: pick(0.95), p99: pick(0.99),
                    byPage: loadRows.map(r => ({ path: r._id, loadTime: round(r.load), views: r.views }))
                },
                errors: []
            }
        }, { note: 'Page-speed scores and JS error logs need a RUM/Lighthouse integration.' });
    });

    getSocialMediaAnalytics = asyncHandler(async (req, res) => {
        const sources = await sourceBreakdown(matchFor(req));
        const social = sources.filter(s => /social|facebook|twitter|linkedin|instagram|reddit/i.test(s.source));
        const referrals = social.reduce((n, s) => n + s.visits, 0);
        sendEmpty(res, {
            social: {
                totalReferrals: referrals, engagementRate: 0,
                topPosts: [], sharesByPlatform: {}, referralSources: {},
                shares: [], followers: {},
                socialTrend: []
            }
        }, 'No social-platform API is connected; only referrer-derived social sessions are reported.');
    });

    getSEOAnalytics = asyncHandler(async (_req, res) => {
        sendEmpty(res, {
            seo: {
                organicTraffic: 0, searchRankings: 0, backlinks: 0, impressions: 0,
                clickThroughRate: 0, topKeywords: [], rankings: [], backlinksList: [],
                indexedPages: 0, crawlErrors: 0, mobileFriendly: false,
                pageSpeed: { mobile: { score: 0, fcp: 0, lcp: 0, cls: 0, tti: 0 }, desktop: { score: 0, fcp: 0, lcp: 0, cls: 0, tti: 0 } },
                coreWebVitals: { lcp: 0, fcp: 0, cls: 0, ttfb: 0 }, seoScore: 0
            }
        }, 'SEO metrics require a Search Console / Lighthouse integration.');
    });

    getCompetitorAnalytics = asyncHandler(async (_req, res) => {
        sendEmpty(res, { competitors: { topCompetitors: [], marketShare: [], keywords: [], gapAnalysis: [] } },
            'Competitor traffic is not collected by this application.');
    });

    getGoalsProgress = asyncHandler(async (_req, res) => {
        sendEmpty(res, [], 'No analytics goals have been configured.');
    });

    getHeatmapData = asyncHandler(async (req, res) => {
        const row = await PageAnalytics.findOne({
            path: req.query.page || '/', date: { $gte: rangeStart(req.query.timeRange || '7d') }
        }).select('heatmap').lean();
        send(res, { heatmap: row?.heatmap || { clicks: [], scrollDepth: [] } });
    });

    getABTestResults = asyncHandler(async (_req, res) => {
        sendEmpty(res, [], 'A/B tests are not configured.');
    });

    getUserRetention = asyncHandler(async (_req, res) => {
        sendEmpty(res, [], 'Retention needs a stable visitor identifier; tracking is session-scoped.');
    });

    getConversionFunnel = asyncHandler(async (req, res) => {
        const stats = await coreStats(matchFor(req));
        send(res, {
            funnel: [
                { stage: 'Sessions', users: stats.sessions, conversion: 100 },
                { stage: 'Engaged', users: Math.max(0, stats.sessions - stats.bounces), conversion: pct(stats.sessions - stats.bounces, stats.sessions) },
                { stage: 'Converted', users: stats.conversions, conversion: stats.conversionRate }
            ]
        });
    });

    getAnalyticsAlerts = asyncHandler(async (req, res) => {
        const stats = await coreStats(matchFor(req));
        const alerts = [];
        if (stats.sessions === 0) {
            alerts.push({ id: 'no-traffic', type: 'traffic', severity: 'low', message: 'No visitor sessions recorded for this period.', timestamp: new Date(), resolved: false });
        }
        if (stats.bounceRate > 70 && stats.sessions > 10) {
            alerts.push({ id: 'bounce', type: 'engagement', severity: 'medium', message: `Bounce rate is ${stats.bounceRate}% for this period.`, timestamp: new Date(), resolved: false });
        }
        if (stats.conversionRate === 0 && stats.sessions > 20) {
            alerts.push({ id: 'conversion', type: 'conversion', severity: 'low', message: 'No conversions recorded for this period.', timestamp: new Date(), resolved: false });
        }
        send(res, alerts);
    });

    getTopProjects = asyncHandler(async (_req, res) => {
        const rows = await Project.find({}).select('title views likes').sort({ views: -1 }).limit(10).lean();
        send(res, rows.map(p => ({ name: p.title, views: p.views || 0, likes: p.likes || 0 })));
    });
}

module.exports = new AnalyticsController();
