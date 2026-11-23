/**
 * Phase 40 — system monitor, resource readout and server cache purge.
 *
 * Owner-only. Every number here is measured from the running process or the
 * driver; nothing is estimated, seeded or hard-coded. When a metric genuinely
 * cannot be read the field is `null` and the client renders "not measurable"
 * rather than a plausible-looking zero.
 *
 * Confidential: local checkout only.
 */
const os = require('os');
const mongoose = require('mongoose');
const { clearDashboardCaches, getDashboardCacheStats } = require('./securityDashboard.controller');
const cacheService = require('../services/cacheService');

/** Process-wide counters, incremented by the request hook below. */
const counters = {
    requestsTotal: 0,
    requestsSinceStart: 0,
    startedAt: Date.now()
};

/** Middleware that feeds the monitor. Cheap: two integer increments. */
const trackRequests = (req, _res, next) => {
    counters.requestsTotal += 1;
    counters.requestsSinceStart += 1;
    next();
};

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * Read the response-cache stats, tolerating both an in-memory-only build and a
 * Redis-backed one. Returns null rather than guessing if the read fails.
 */
const readResponseCacheStats = async () => {
    try {
        if (typeof cacheService.getStats !== 'function') return null;
        const stats = await cacheService.getStats();
        return {
            memoryEntries: stats?.memoryCache?.size ?? null,
            memoryLimit: stats?.memoryCache?.maxSize ?? null,
            redisEnabled: Boolean(stats?.redis?.enabled),
            redisConnected: Boolean(stats?.redis?.connected)
        };
    } catch {
        return null;
    }
};

const percent = (part, whole) => {
    if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
    return Math.min(100, (part / whole) * 100);
};

/**
 * Read everything the monitor needs.
 * `null` means "could not be measured" — never a fabricated value.
 */
const collectMetrics = async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const load = os.loadavg();
    const heap = process.memoryUsage();
    const dbState = mongoose.connection.readyState;

    // Mongo only reports an estimated document count once connected.
    let documentCount = null;
    if (dbState === 1) {
        try {
            const counts = await Promise.all(
                Object.values(mongoose.connection.collections).map(collection =>
                    collection.estimatedDocumentCount().catch(() => null)
                )
            );
            const known = counts.filter(value => Number.isFinite(value));
            documentCount = known.length ? known.reduce((sum, value) => sum + value, 0) : null;
        } catch {
            documentCount = null;
        }
    }

    const cacheStats = getDashboardCacheStats();

    return {
        measuredAt: new Date().toISOString(),

        process: {
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            rssBytes: heap.rss,
            heapUsedBytes: heap.heapUsed,
            heapTotalBytes: heap.heapTotal,
            externalBytes: heap.external,
            heapLimitBytes: require('v8').getHeapStatistics().heap_size_limit,
            heapUsagePercent: percent(heap.heapUsed, require('v8').getHeapStatistics().heap_size_limit)
        },

        system: {
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            cpuModel: os.cpus()?.[0]?.model || null,
            cpuCores: os.cpus()?.length ?? null,
            loadAverage: { one: load[0] ?? null, five: load[1] ?? null, fifteen: load[2] ?? null },
            totalMemoryBytes: totalMem,
            freeMemoryBytes: freeMem,
            usedMemoryBytes: usedMem,
            memoryUsagePercent: percent(usedMem, totalMem)
        },

        database: {
            state: DB_STATES[dbState] || 'unknown',
            connected: dbState === 1,
            readyState: dbState,
            host: mongoose.connection.host || null,
            name: mongoose.connection.name || null,
            documentCount
        },

        cache: {
            dashboard: cacheStats,
            responseCache: await readResponseCacheStats()
        },

        requests: {
            total: counters.requestsTotal,
            sinceStart: counters.requestsSinceStart,
            trackingSince: new Date(counters.startedAt).toISOString()
        }
    };
};

/**
 * Evaluate alert rules server-side against the measured metrics.
 * Mirrors `src/utils/cacheCleaner.js` thresholds so both ends agree.
 */
const buildAlerts = (metrics) => {
    const alerts = [];
    const push = (id, severity, title, detail) => alerts.push({ id, severity, title, detail });

    const mem = metrics.system.memoryUsagePercent;
    if (mem != null) {
        if (mem >= 90) push('memory-high', 'critical', 'Server memory critically high', `${mem.toFixed(1)}% of system memory is in use.`);
        else if (mem >= 75) push('memory-elevated', 'warning', 'Server memory elevated', `${mem.toFixed(1)}% of system memory is in use.`);
    }

    const heap = metrics.process.heapUsagePercent;
    if (heap != null && heap >= 85) {
        push('heap-pressure', 'warning', 'Node heap pressure', `${heap.toFixed(1)}% of the V8 heap limit is allocated.`);
    }

    if (!metrics.database.connected) {
        push('database-down', 'critical', 'Database disconnected', 'The API cannot reach MongoDB. Writes will fail until it reconnects.');
    }

    const load1 = metrics.system.loadAverage.one;
    const cores = metrics.system.cpuCores;
    if (load1 != null && cores) {
        const perCore = load1 / cores;
        if (perCore >= 2) push('load-high', 'critical', 'CPU load critically high', `Load average ${load1.toFixed(2)} across ${cores} cores.`);
        else if (perCore >= 1) push('load-elevated', 'warning', 'CPU load elevated', `Load average ${load1.toFixed(2)} across ${cores} cores.`);
    }

    const rank = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
};

/** GET /api/admin/system — metrics + alerts. */
const getSystemMetrics = async (_req, res) => {
    try {
        const metrics = await collectMetrics();
        const alerts = buildAlerts(metrics);
        res.json({
            success: true,
            data: {
                ...metrics,
                alerts,
                alertStatus: alerts.some(alert => alert.severity === 'critical')
                    ? 'critical'
                    : alerts.some(alert => alert.severity === 'warning')
                        ? 'warning'
                        : alerts.length
                            ? 'info'
                            : 'healthy',
                mode: 'live-process',
                note: 'Measured from the running API process and its MongoDB connection. Unmeasurable values are null, never zero.'
            }
        });
    } catch (error) {
        console.error('System metrics failed:', error);
        res.status(500).json({
            success: false,
            message: 'System metrics could not be collected.',
            data: { measuredAt: new Date().toISOString(), error: 'collection-failed' }
        });
    }
};

/**
 * POST /api/admin/system/cache/purge — clear the server-side caches.
 *
 * Scoped to caches this process owns. It never touches request-scoped data,
 * MongoDB collections, or the filesystem.
 */
const purgeServerCache = async (req, res) => {
    try {
        const targets = Array.isArray(req.body?.targets) ? req.body.targets : ['dashboard'];
        const unknown = targets.filter(target => !['dashboard', 'response'].includes(target));
        if (unknown.length) {
            return res.status(400).json({
                success: false,
                message: `Unknown cache target${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`
            });
        }

        const results = [];

        if (targets.includes('dashboard')) {
            const cleared = clearDashboardCaches();
            results.push({
                id: 'dashboard',
                label: 'Dashboard inventory & audit cache',
                status: 'cleared',
                removed: cleared.cleared,
                detail: cleared.cleared
                    ? `Dropped ${cleared.cleared} cached entr${cleared.cleared === 1 ? 'y' : 'ies'} (${cleared.surfaces.join(', ')}).`
                    : 'These caches were already empty.'
            });
        }

        if (targets.includes('response')) {
            const before = await readResponseCacheStats();
            try {
                await cacheService.clear('*');
                results.push({
                    id: 'response',
                    label: 'Response cache',
                    status: 'cleared',
                    removed: before?.memoryEntries ?? 0,
                    detail: before?.memoryEntries
                        ? `Dropped ${before.memoryEntries} in-memory entr${before.memoryEntries === 1 ? 'y' : 'ies'}.`
                        : 'The response cache was already empty.'
                });
            } catch {
                results.push({
                    id: 'response',
                    label: 'Response cache',
                    status: 'error',
                    removed: 0,
                    detail: 'The response cache could not be cleared.'
                });
            }
        }

        res.json({
            success: true,
            data: {
                purgedAt: new Date().toISOString(),
                scope: 'server',
                results,
                note: 'Server-side caches only. Browser storage is cleared from the client.'
            }
        });
    } catch (error) {
        console.error('Server cache purge failed:', error);
        res.status(500).json({ success: false, message: 'The cache purge failed.' });
    }
};

module.exports = {
    getSystemMetrics,
    purgeServerCache,
    trackRequests,
    collectMetrics,
    buildAlerts
};
