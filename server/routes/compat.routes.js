'use strict';
/**
 * Compatibility endpoints (confidential).
 *
 * The endpoint audit (`server/scripts/check-endpoint-parity.js`) found a set of
 * paths that the shipped UI calls but that no router registers. Previously the
 * frontend received an HTML 404, logged "unavailable" and silently rendered
 * hard-coded mock data, which is why dashboard values looked plausible but were
 * never live.
 *
 * This router is mounted LAST on /api, so it only sees paths no other router
 * handled. Everything here is read-only unless explicitly noted, is owner-gated
 * where the data is site-wide, and returns real Mongo-backed aggregates. Views
 * for which the project has no data source yet return an explicit empty state
 * with `meta.populated = false` instead of invented numbers.
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const asyncHandler = require('../middleware/async.middleware');
const { auth, isOwner } = require('../middleware/auth.middleware');
const TrackingSession = require('../models/TrackingSession');
const PageAnalytics = require('../models/PageAnalytics');
const Notification = require('../models/Notifications');
const Task = require('../models/Task');
const Review = require('../models/Review.model');
const LearningVideo = require('../models/LearningVideo');
const Tutorial = require('../models/Tutorials');
const LearningProgress = require('../models/LearningProgress');
const { NotificationPreference, PushSubscription } = require('../models/NotificationPreference');
const aiController = require('../controllers/ai.controller');
const { publishTrackingEvent } = require('../socket/tracking.handler');

// analyticsRoutes already ran auth/isOwner before falling through; avoid a
// second database lookup when req.user is already populated.
const ensureAuth = (req, res, next) => (req.user ? next() : auth(req, res, next));
const ensureOwner = (req, res, next) => (req.user?.role === 'owner' ? next() : isOwner(req, res, next));

const ok = (res, data, meta = {}) => res.json({
    success: true,
    data,
    meta: { source: 'compat', populated: true, ...meta }
});

const empty = (res, data = [], note) => res.json({
    success: true,
    data,
    meta: { source: 'compat', populated: false, note: note || 'No backing data source is configured yet.' }
});

const userIdOf = req => req.user?._id || req.user?.id;

function dateFilter(req) {
    const raw = String(req.query.timeRange || req.query.period || req.query.days || '7d');
    const match = /^(\d+)/.exec(raw);
    const days = match ? Math.min(Math.max(parseInt(match[1], 10), 1), 365) : 7;
    return { startTime: { $gte: new Date(Date.now() - days * 86400000) } };
}

const safe = fn => asyncHandler(async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error('[compat] query failed:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load data' });
    }
});

/* ------------------------------------------------------------------ *
 * Visitor analytics extensions (owner only, real aggregates)
 * ------------------------------------------------------------------ */
router.use('/analytics', ensureAuth, ensureOwner);

router.get('/analytics/visitors/sessions', safe(async (req, res) => {
    const rows = await TrackingSession.find(dateFilter(req))
        .sort({ startTime: -1 }).limit(50).lean();
    ok(res, rows.map(s => ({
        sessionId: s.sessionId,
        startTime: s.startTime,
        duration: s.duration,
        pagesViewed: s.pagesViewed,
        clicks: s.clicks,
        device: s.device,
        location: s.location,
        source: s.source,
        isActive: s.isActive
    })));
}));

router.get('/analytics/visitors/devices', safe(async (req, res) => {
    const rows = await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $ifNull: ['$device.type', 'unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    ok(res, rows.map(r => ({ name: r._id, value: r.count })));
}));

router.get('/analytics/visitors/countries', safe(async (req, res) => {
    const rows = await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 20 }
    ]);
    ok(res, rows.map(r => ({ name: r._id, value: r.count })));
}));

router.get('/analytics/visitors/pages', safe(async (req, res) => {
    const rows = await PageAnalytics.aggregate([
        { $match: { date: { $gte: dateFilter(req).startTime.$gte } } },
        { $group: { _id: '$path', views: { $sum: '$views' }, uniqueViews: { $sum: '$uniqueViews' } } },
        { $sort: { views: -1 } }, { $limit: 20 }
    ]);
    ok(res, rows.map(r => ({ page: r._id, views: r.views, uniqueViews: r.uniqueViews })));
}));

router.get('/analytics/visitors/sources', safe(async (req, res) => {
    const rows = await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $ifNull: ['$source.source', 'direct'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    ok(res, rows.map(r => ({ name: r._id || 'direct', value: r.count })));
}));

router.get('/analytics/visitors/engagement', safe(async (req, res) => {
    const [agg] = await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: {
            _id: null,
            avgPages: { $avg: '$pagesViewed' },
            avgClicks: { $avg: '$clicks' },
            avgDuration: { $avg: '$duration' },
            avgScroll: { $avg: '$scrollDepth' },
            sessions: { $sum: 1 }
        } }
    ]);
    ok(res, {
        sessions: agg?.sessions || 0,
        avgPages: Math.round((agg?.avgPages || 0) * 10) / 10,
        avgClicks: Math.round((agg?.avgClicks || 0) * 10) / 10,
        avgDuration: Math.round(agg?.avgDuration || 0),
        avgScrollDepth: Math.round(agg?.avgScroll || 0)
    });
}));

router.get('/analytics/visitors/demographics', safe(async (req, res) => {
    const [devices, countries] = await Promise.all([
        TrackingSession.aggregate([
            { $match: dateFilter(req) },
            { $group: { _id: { $ifNull: ['$device.type', 'unknown'] }, count: { $sum: 1 } } }
        ]),
        TrackingSession.aggregate([
            { $match: dateFilter(req) },
            { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 }
        ])
    ]);
    ok(res, { devices, countries });
}));

router.get('/analytics/visitors/hours', safe(async (req, res) => {
    const rows = await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    ok(res, rows.map(r => ({ hour: r._id, value: r.count })));
}));

router.get('/analytics/visitors/flow', safe(async (req, res) => {
    const sessions = await TrackingSession.find(dateFilter(req))
        .select('pageJourney').limit(200).lean();
    const links = new Map();
    for (const session of sessions) {
        const paths = (session.pageJourney || []).map(p => p.path).filter(Boolean);
        for (let i = 0; i < paths.length - 1; i++) {
            const key = `${paths[i]} -> ${paths[i + 1]}`;
            links.set(key, (links.get(key) || 0) + 1);
        }
    }
    ok(res, [...links.entries()]
        .map(([path, value]) => ({ path, value }))
        .sort((a, b) => b.value - a.value).slice(0, 20));
}));

router.get('/analytics/visitors/retention', safe(async (_req, res) => {
    empty(res, [], 'Retention needs a stable visitor identifier; tracking is session-scoped today.');
}));
router.get('/analytics/visitors/returning', safe(async (_req, res) => {
    empty(res, [], 'Returning-visitor detection needs a stable visitor identifier.');
}));

router.get('/analytics/events', safe(async (req, res) => {
    const sessions = await TrackingSession.find(dateFilter(req))
        .select('sessionId events startTime').sort({ startTime: -1 }).limit(50).lean();
    const events = sessions.flatMap(s => (s.events || []).map(e => ({
        sessionId: s.sessionId, type: e.type, data: e.data, timestamp: e.timestamp
    }))).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
    ok(res, events);
}));

router.get('/analytics/reviews-visitors/correlation', safe(async (req, res) => {
    const since = dateFilter(req).startTime.$gte;
    const [visitors, reviews] = await Promise.all([
        TrackingSession.countDocuments({ startTime: { $gte: since } }),
        Review.countDocuments({ createdAt: { $gte: since } })
    ]);
    ok(res, { visitors, reviews, reviewsPerVisitor: visitors ? Math.round((reviews / visitors) * 1000) / 1000 : 0 });
}));

router.get('/analytics/export', safe(async (req, res) => {
    const rows = await TrackingSession.find(dateFilter(req))
        .sort({ startTime: -1 }).limit(1000).lean();
    ok(res, {
        format: 'json',
        rows: rows.map(s => ({
            sessionId: s.sessionId, startTime: s.startTime, duration: s.duration,
            pagesViewed: s.pagesViewed, clicks: s.clicks,
            country: s.location?.country, device: s.device?.type
        }))
    });
}));

// Must be registered after the specific /visitors/* paths above.
router.get('/analytics/visitors/:id', safe(async (req, res) => {
    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { sessionId: id };
    const session = await TrackingSession.findOne(query).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Visitor session not found' });
    ok(res, session);
}));

/* ------------------------------------------------------------------ *
 * AI tracking dashboard views (owner only)
 * ------------------------------------------------------------------ */
router.use('/ai', ensureAuth, ensureOwner);

const aiViews = {
    behavior: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: '$device.type', sessions: { $sum: 1 }, avgPages: { $avg: '$pagesViewed' } } },
        { $sort: { sessions: -1 } }
    ])),
    engagement: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: null, avgPages: { $avg: '$pagesViewed' }, avgClicks: { $avg: '$clicks' }, total: { $sum: 1 } } }
    ])),
    performance: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, sessions: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ])),
    funnel: async req => (await PageAnalytics.aggregate([
        { $match: { date: { $gte: dateFilter(req).startTime.$gte } } },
        { $group: { _id: '$path', views: { $sum: '$views' } } }, { $sort: { views: -1 } }, { $limit: 10 }
    ])),
    heatmap: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }
    ])),
    history: async req => (await TrackingSession.find(dateFilter(req))
        .select('sessionId startTime pagesViewed clicks location').sort({ startTime: -1 }).limit(50).lean()),
    predictive: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ])),
    conversion: async req => (await TrackingSession.countDocuments({ ...dateFilter(req), converted: true })),
    segmentation: async req => (await TrackingSession.aggregate([
        { $match: dateFilter(req) },
        { $group: { _id: { $ifNull: ['$location.country', 'Unknown'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }
    ])),
    sentiment: async () => [],
    'anomaly-detection': async () => [],
    attribution: async () => [],
    'audience-insights': async () => [],
    cohort: async () => [],
    'content-effectiveness': async () => [],
    experiment: async () => [],
    'feedback-analysis': async () => [],
    insights: async () => [],
    'leading-indicators': async () => [],
    visualization: async () => []
};

const NOT_BACKED = new Set(['sentiment', 'anomaly-detection', 'attribution', 'audience-insights',
    'cohort', 'content-effectiveness', 'experiment', 'feedback-analysis', 'insights',
    'leading-indicators', 'visualization']);

router.get('/ai/tracking/recommendations/:userId', safe(async (_req, res) => {
    empty(res, [], 'Recommendations require the ML service, which is not enabled in this deployment.');
}));
router.get('/ai/tracking/usage/:userId', safe(async (req, res) => {
    const sessions = await TrackingSession.countDocuments({ userId: req.params.userId });
    ok(res, { userId: req.params.userId, sessions });
}));
router.get('/ai/tracking/:view', safe(async (req, res) => {
    const view = req.params.view;
    const loader = aiViews[view];
    if (!loader) return res.status(404).json({ success: false, message: `Unknown AI tracking view: ${view}` });
    const data = await loader(req);
    if (NOT_BACKED.has(view)) return empty(res, data, 'This AI view has no backing data source yet.');
    ok(res, data);
}));

router.post('/ai/tracking/event', ensureOwner, (req, res) => {
    publishTrackingEvent('ai_event', req.body || {});
    res.json({ success: true, message: 'Event accepted' });
});
router.post('/ai/tracking/interaction', ensureOwner, (req, res) => {
    publishTrackingEvent('ai_interaction', req.body || {});
    res.json({ success: true, message: 'Interaction accepted' });
});
// The AI preferences resource supports GET/POST already; PUT is a natural alias.
router.put('/ai/preferences', aiController.savePreferences);

/* ------------------------------------------------------------------ *
 * Learning center extras
 * ------------------------------------------------------------------ */
router.get('/learning/search', safe(async (req, res) => {
    const term = String(req.query.q || req.query.query || '').trim();
    if (!term) return empty(res, [], 'Provide a q/query parameter.');
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [videos, tutorials] = await Promise.all([
        LearningVideo.find({ title: rx }).limit(20).lean(),
        Tutorial.find({ title: rx }).limit(20).lean()
    ]);
    ok(res, [...videos.map(v => ({ ...v, kind: 'video' })), ...tutorials.map(t => ({ ...t, kind: 'tutorial' }))]);
}));

router.get('/learning/resources', safe(async (_req, res) => {
    const [videos, tutorials] = await Promise.all([
        LearningVideo.find().limit(50).lean(), Tutorial.find().limit(50).lean()
    ]);
    ok(res, [...videos.map(v => ({ ...v, kind: 'video' })), ...tutorials.map(t => ({ ...t, kind: 'tutorial' }))]);
}));

router.get('/learning/recommendations', safe(async (req, res) => {
    const videos = await LearningVideo.find().sort({ rating: -1 }).limit(10).lean();
    ok(res, videos);
}));

router.get('/learning/achievements/progress', safe(async (req, res) => {
    const uid = userIdOf(req);
    const rows = uid ? await LearningProgress.find({ userId: uid }).lean() : [];
    ok(res, rows);
}));

const catalogueNotReady = (_req, res) => empty(res, [], 'Learning catalogue extension is not populated yet.');
router.get('/learning/courses/enrolled', catalogueNotReady);
router.get('/learning/courses/:id', catalogueNotReady);
router.get('/learning/paths', catalogueNotReady);
router.get('/learning/paths/:id', catalogueNotReady);
router.get('/learning/quizzes', catalogueNotReady);
router.get('/learning/certificates', catalogueNotReady);
router.get('/learning/certificates/:id', catalogueNotReady);
router.get('/learning/notifications', catalogueNotReady);

const actionNotImplemented = (_req, res) => res.status(501).json({
    success: false,
    message: 'This learning action is not implemented on the server yet.'
});
router.post('/learning/courses/:id/enroll', ensureAuth, actionNotImplemented);
router.post('/learning/quizzes/submit', ensureAuth, actionNotImplemented);
router.post('/learning/notifications/:id/read', ensureAuth, actionNotImplemented);

/* ------------------------------------------------------------------ *
 * Notifications extensions
 * ------------------------------------------------------------------ */
router.use('/notifications', ensureAuth);

router.get('/notifications/preferences', safe(async (req, res) => {
    const uid = userIdOf(req);
    const doc = uid ? await NotificationPreference.findOne({ userId: uid }).lean() : null;
    ok(res, doc?.preferences || {
        email: true, push: true, collaboration: true, reviews: true, system: true, marketing: false
    });
}));

router.put('/notifications/preferences', safe(async (req, res) => {
    const uid = userIdOf(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Authentication required' });
    const doc = await NotificationPreference.findOneAndUpdate(
        { userId: uid },
        { $set: { preferences: req.body || {}, updatedAt: new Date() } },
        { upsert: true, new: true, runValidators: true }
    ).lean();
    ok(res, doc.preferences);
}));

router.get('/notifications/stats', safe(async (req, res) => {
    const uid = userIdOf(req);
    const filter = uid ? { userId: uid } : {};
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [total, unread, today] = await Promise.all([
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, read: false, dismissed: false }),
        Notification.countDocuments({ ...filter, createdAt: { $gte: startOfDay } })
    ]);
    ok(res, { total, unread, today });
}));

router.get('/notifications/history', safe(async (req, res) => {
    const uid = userIdOf(req);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const rows = await Notification.find(uid ? { userId: uid } : {})
        .sort({ createdAt: -1 }).limit(limit).lean();
    ok(res, rows);
}));

router.post('/notifications/send', ensureOwner, safe(async (req, res) => {
    const { title, message, type, link, targetUserId } = req.body || {};
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });
    const doc = await Notification.create({
        userId: targetUserId || userIdOf(req), title, message,
        type: type || 'info', link, metadata: { source: 'compat' }
    });
    ok(res, doc);
}));

router.post('/notifications/push/subscribe', safe(async (req, res) => {
    const uid = userIdOf(req);
    const { endpoint, keys } = req.body || {};
    if (!uid || !endpoint) return res.status(400).json({ success: false, message: 'endpoint is required' });
    await PushSubscription.updateOne(
        { userId: uid, endpoint },
        { $set: { keys: keys || {} } }, { upsert: true }
    );
    ok(res, { subscribed: true });
}));

router.post('/notifications/push/unsubscribe', safe(async (req, res) => {
    const uid = userIdOf(req);
    const { endpoint } = req.body || {};
    await PushSubscription.deleteOne({ userId: uid, ...(endpoint ? { endpoint } : {}) });
    ok(res, { subscribed: false });
}));

/* ------------------------------------------------------------------ *
 * Dashboard / tracking / admin extensions
 * ------------------------------------------------------------------ */
router.put('/dashboard/tasks/:id', ensureAuth, safe(async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid task id' });
    }
    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const update = {};
    for (const key of allowed) if (key in (req.body || {})) update[key] = req.body[key];
    if (update.status === 'completed') update.completedAt = new Date();
    const task = await Task.findOneAndUpdate(
        { _id: id, ...(req.user?.role === 'owner' ? {} : { userId: userIdOf(req) }) },
        { $set: update }, { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    ok(res, task);
}));

router.get('/tracking/analytics/export', ensureOwner, safe(async (req, res) => {
    const rows = await TrackingSession.find(dateFilter(req)).sort({ startTime: -1 }).limit(1000).lean();
    ok(res, {
        format: 'json',
        rows: rows.map(s => ({
            sessionId: s.sessionId, startTime: s.startTime, duration: s.duration,
            pagesViewed: s.pagesViewed, clicks: s.clicks,
            country: s.location?.country, device: s.device?.type,
            converted: Boolean(s.converted)
        }))
    });
}));

router.get('/tracking/reviews', ensureOwner, safe(async (req, res) => {
    const rows = await Review.find().sort({ createdAt: -1 }).limit(100).lean();
    ok(res, rows);
}));

// Destructive admin operations are deliberately NOT exposed over HTTP: they
// are registered only to return an explicit refusal instead of an HTML 404.
const adminRefusal = (_req, res) => res.status(403).json({
    success: false,
    message: 'Destructive admin operations are disabled over HTTP. Run the seed/reset scripts locally.'
});
router.post('/admin/reset', ensureOwner, adminRefusal);
router.post('/admin/seed/projects', ensureOwner, adminRefusal);
router.post('/admin/seed/skills', ensureOwner, adminRefusal);
router.post('/admin/seed/test-data', ensureOwner, adminRefusal);

module.exports = router;
