/**
 * Phase 40 — system monitor, resource readout, cache cleaner, alerts and the
 * enhanced splash screen.
 *
 * Node-only static checks plus real execution of the pure helpers (no network,
 * no database, no browser).
 * Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

// The shared logic is pure and importable in Node.
const core = await import(path.join(root, 'src/utils/cacheCleaner.js'));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* ------------------------------- shared core ------------------------------ */

check('cache surfaces are declared with scope and destructive flags', () => {
    const ids = core.CACHE_SURFACES.map(surface => surface.id);
    for (const required of ['api-cache', 'local-storage', 'session-storage', 'service-worker-cache', 'review-outbox', 'server-cache']) {
        assert.ok(ids.includes(required), `missing surface ${required}`);
    }
    for (const surface of core.CACHE_SURFACES) {
        assert.ok(['client', 'server'].includes(surface.scope), `${surface.id} has no valid scope`);
        assert.equal(typeof surface.destructive, 'boolean', `${surface.id} destructive flag`);
    }
    // Only unsent drafts are destructive.
    const destructive = core.CACHE_SURFACES.filter(surface => surface.destructive).map(surface => surface.id);
    assert.deepEqual(destructive, ['review-outbox']);
});

check('sign-in state and drafts are protected from every purge', () => {
    for (const key of ['token', 'efolio_token', 'authToken', 'refreshToken', 'cv:draft', 'efolio:token', 'cvDraft:1']) {
        assert.equal(core.shouldClearStorageKey(key), false, `${key} must be protected`);
    }
    // Protected keys must lose even when they also match a clearable prefix.
    assert.equal(core.shouldClearStorageKey('efolio:token'), false);
});

check('cache and theme keys are clearable', () => {
    for (const key of ['efolio:theme', 'cache:projects', 'publicSection:skills', 'dashboard:filters']) {
        assert.equal(core.shouldClearStorageKey(key), true, `${key} should be clearable`);
    }
    // An unrelated key from another app on the same origin is left alone.
    assert.equal(core.shouldClearStorageKey('someOtherApp:data'), false);
});

check('destructive surfaces are skipped unless explicitly allowed', () => {
    const guarded = core.selectSurfaces({ scope: 'client' });
    assert.ok(!guarded.selected.some(surface => surface.id === 'review-outbox'));
    assert.ok(guarded.skipped.some(surface => surface.id === 'review-outbox'));

    const allowed = core.selectSurfaces({ scope: 'client', allowDestructive: true });
    assert.ok(allowed.selected.some(surface => surface.id === 'review-outbox'));
});

check('scopes never mix: client work cannot ask for the server cache', () => {
    const clientRun = core.selectSurfaces({ scope: 'client', ids: ['server-cache'], allowDestructive: true });
    assert.equal(clientRun.selected.length, 0);
    const serverRun = core.selectSurfaces({ scope: 'server' });
    assert.deepEqual(serverRun.selected.map(surface => surface.id), ['server-cache']);
});

check('requesting only one surface returns only that surface', () => {
    const run = core.selectSurfaces({ scope: 'client', ids: ['api-cache'] });
    assert.deepEqual(run.selected.map(surface => surface.id), ['api-cache']);
});

check('a run summary never reports success for partial or failed work', () => {
    assert.equal(core.summariseRun([
        { status: 'cleared' }, { status: 'cleared' }
    ]).status, 'cleared');
    assert.equal(core.summariseRun([
        { status: 'cleared' }, { status: 'unsupported' }
    ]).status, 'partial');
    assert.equal(core.summariseRun([
        { status: 'cleared' }, { status: 'error' }
    ]).status, 'failed');
    assert.equal(core.summariseRun([]).status, 'empty');
});

check('byte formatting refuses to invent a number', () => {
    assert.equal(core.formatBytes(null), '—');
    assert.equal(core.formatBytes(undefined), '—');
    assert.equal(core.formatBytes('nonsense'), '—');
    assert.equal(core.formatBytes(-1), '—');
    assert.equal(core.formatBytes(0), '0 B');
    assert.equal(core.formatBytes(2048), '2.0 KB');
    assert.equal(core.formatBytes(5 * 1024 * 1024), '5.0 MB');
});

check('storage measurement reports unavailability instead of zero', () => {
    assert.deepEqual(core.measureStorageArea(null), { available: false, keys: 0, bytes: 0 });

    const fake = {
        length: 2,
        key: index => ['token', 'efolio:theme'][index],
        getItem: key => (key === 'token' ? 'abc' : 'dark')
    };
    const measured = core.measureStorageArea(fake);
    assert.equal(measured.available, true);
    assert.equal(measured.keys, 2);
    assert.ok(measured.bytes > 0);

    const throwing = {
        get length() { throw new Error('blocked'); }
    };
    assert.equal(core.measureStorageArea(throwing).available, false);
});

/* --------------------------------- alerts -------------------------------- */

check('alerts fire on real thresholds and stay quiet when healthy', () => {
    const healthy = core.evaluateAlerts({
        memoryUsagePercent: 40,
        heapUsagePercent: 30,
        databaseConnected: true,
        browserStorageBytes: 1024,
        cacheEntries: 5
    });
    assert.deepEqual(healthy, []);

    const sick = core.evaluateAlerts({
        memoryUsagePercent: 95,
        heapUsagePercent: 90,
        databaseConnected: false
    });
    const ids = sick.map(alert => alert.id);
    assert.ok(ids.includes('memory-high'), 'critical memory alert');
    assert.ok(ids.includes('heap-pressure'), 'heap alert');
    assert.ok(ids.includes('database-down'), 'database alert');
    // The elevated-memory rule must not double-report alongside the critical one.
    assert.ok(!ids.includes('memory-elevated'));
});

check('unknown metrics never raise an alert', () => {
    assert.deepEqual(core.evaluateAlerts({}), []);
    assert.deepEqual(core.evaluateAlerts({ memoryUsagePercent: null }), []);
    assert.deepEqual(core.evaluateAlerts({ memoryUsagePercent: 'abc' }), []);
});

check('alerts are ordered by severity and the chip reflects the worst', () => {
    const alerts = core.evaluateAlerts({ memoryUsagePercent: 80, databaseConnected: false });
    assert.equal(alerts[0].severity, 'critical');
    assert.equal(core.alertStatus(alerts).level, 'critical');
    assert.equal(core.alertStatus([]).level, 'healthy');
    assert.equal(core.alertStatus([{ severity: 'info' }]).level, 'info');
});

/* ------------------------------ server side ------------------------------ */

check('the monitor reads real process data, never placeholders', () => {
    const src = read('server/controllers/systemMonitor.controller.js');
    for (const api of ['os.totalmem()', 'os.freemem()', 'os.loadavg()', 'process.memoryUsage()', 'process.uptime()', 'getHeapStatistics()']) {
        assert.ok(src.includes(api), `missing real measurement ${api}`);
    }
    assert.match(src, /mode: 'live-process'/);
    // Unmeasurable values must be null, not zero.
    assert.match(src, /return null;/);
});

check('the monitor endpoint is owner-only and rate limited', () => {
    const routes = read('server/routes/admin.routes.js');
    const authIdx = routes.indexOf('router.use(auth);');
    const ownerIdx = routes.indexOf('router.use(isOwner);');
    const systemIdx = routes.indexOf("router.get('/system'");
    assert.ok(authIdx > -1 && ownerIdx > authIdx, 'auth then isOwner must mount first');
    assert.ok(systemIdx > ownerIdx, 'the system route must come after the owner gate');

    const purgeIdx = routes.indexOf("router.post('/system/cache/purge'");
    assert.ok(purgeIdx > ownerIdx, 'purge must come after the owner gate');
    assert.match(routes, /const purgeLimiter = rateLimit\(\{/);
    assert.match(routes, /router\.post\('\/system\/cache\/purge', purgeLimiter, purgeServerCache\)/);
});

check('the purge refuses unknown targets instead of guessing', () => {
    const src = read('server/controllers/systemMonitor.controller.js');
    assert.match(src, /const unknown = targets\.filter\(target => !\['dashboard', 'response'\]\.includes\(target\)\);/);
    assert.match(src, /status\(400\)/);
});

check('the purge reports what was really removed', () => {
    const src = read('server/controllers/systemMonitor.controller.js');
    assert.match(src, /const cleared = clearDashboardCaches\(\);/);
    assert.match(src, /removed: cleared\.cleared/);
    // It must use the real cache service, not the dead middleware.
    assert.match(src, /const cacheService = require\('\.\.\/services\/cacheService'\);/);
    assert.doesNotMatch(src, /middleware\/cacheMiddleware/);
});

check('dashboard caches expose real clear and stats hooks', () => {
    const src = read('server/controllers/securityDashboard.controller.js');
    assert.match(src, /const clearDashboardCaches = \(\) => \{/);
    assert.match(src, /const getDashboardCacheStats = \(\) => \(\{/);
    assert.match(src, /clearDashboardCaches,\s*\n\s*getDashboardCacheStats/);
});

/* --------------------------------- client -------------------------------- */

check('the monitor page is owner-gated and shows no fake zeroes', () => {
    const src = read('src/components/dashboard/SystemMonitorPage.jsx');
    assert.match(src, /if \(!isOwner\) \{/);
    assert.match(src, /Owner access required/);
    // Missing measurements must render as text, not 0.
    assert.ok(src.includes('not measurable'), 'missing "not measurable" fallback');
    assert.match(src, /Storage is not available|not measurable/);
});

check('the page never claims "live" without a successful read', () => {
    const src = read('src/components/dashboard/SystemMonitorPage.jsx');
    assert.match(src, /const live = Boolean\(metrics\) && !metricsError;/);
    // A response that is not successful clears the metrics rather than keeping stale ones.
    assert.match(src, /setMetrics\(null\);\s*\n\s*setMetricsError\(res\?\.message \|\| 'The server returned no metrics\.'\);/);
});

check('only real milestones drive the splash progress', () => {
    const src = read('src/components/LoadingScreen.jsx');
    assert.match(src, /document\.fonts\.ready/);
    assert.match(src, /const progress = stage === 'boot' \? 34 : stage === 'fonts' \? 68 : 92;/);
    // No setInterval-driven fake percentage.
    assert.doesNotMatch(src, /setInterval\(/);
});

check('the splash respects reduced motion and offers a way out of a failed load', () => {
    const src = read('src/components/LoadingScreen.jsx');
    assert.match(src, /useReducedMotion/);
    assert.match(src, /prefersReducedMotion/);
    assert.match(src, /ChunkLoadError/);
    assert.match(src, /Reload the page/);
    assert.match(src, /role="status"/);
});

check('the static boot splash exists and is dismissed after mount', () => {
    const html = read('index.html');
    assert.match(html, /<div id="efolio-boot" role="status"/);
    assert.match(html, /efolio-boot__mark/);
    // It must not claim progress.
    assert.doesNotMatch(html, /efolio-boot__bar|progressbar/);
    // Reduced motion is honoured before any CSS bundle loads.
    assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
    // A slow-load message replaces the spinner text.
    assert.match(html, /Still loading/);

    const main = read('src/main.jsx');
    assert.match(main, /function dismissBootSplash\(\)/);
    assert.match(main, /boot\.classList\.add\('is-hidden'\)/);
    assert.match(main, /requestAnimationFrame\(\(\) => requestAnimationFrame\(dismissBootSplash\)\)/);
});

check('the boot splash cannot trap focus or block clicks once hidden', () => {
    const html = read('index.html');
    assert.match(html, /#efolio-boot\.is-hidden \{ opacity: 0; pointer-events: none; \}/);
    const main = read('src/main.jsx');
    // Removed from the DOM, not merely hidden.
    assert.match(main, /boot\.remove\(\)/);
});

check('the system monitor is registered in the dashboard for the owner only', () => {
    const src = read('src/pages/Dashboard.jsx');
    assert.match(src, /path: '\/dashboard\/system-monitor'/);
    assert.match(src, /component: LazySystemMonitorPage/);
    const entry = src.slice(src.indexOf("path: '/dashboard/system-monitor'"), src.indexOf("path: '/dashboard/system-monitor'") + 420);
    assert.match(entry, /roles: \['owner'\]/);
});

check('the client cleaner only deletes caches this app owns', () => {
    const src = read('src/services/cacheCleaner.service.js');
    assert.match(src, /\/\^\(static-media-cache\|google-fonts-cache\|workbox-\)\/i/);
    // It must not call the "delete everything" form.
    assert.doesNotMatch(src, /caches\.keys\(\)\.then\([^)]*=>\s*Promise\.all\([^)]*caches\.delete/);
    assert.match(src, /shouldClearStorageKey/);
});

check('the cleaner reports skipped surfaces rather than silently ignoring them', () => {
    const src = read('src/services/cacheCleaner.service.js');
    assert.match(src, /status: 'skipped'/);
    assert.match(src, /Not cleared: \$\{surface\.reason\}\./);
});

/* -------------------------------- wiring --------------------------------- */

check('no secret or outbound call was introduced', () => {
    for (const file of [
        'src/utils/cacheCleaner.js',
        'src/services/cacheCleaner.service.js',
        'src/components/dashboard/SystemMonitorPage.jsx',
        'src/components/LoadingScreen.jsx',
        'server/controllers/systemMonitor.controller.js'
    ]) {
        assert.doesNotMatch(read(file), /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:system-monitor'], /system-monitor\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:system-monitor/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3am\./);
});

console.log(`\n${passed} system-monitor regression checks passed.`);
