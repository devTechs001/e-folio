/**
 * Regression test: dashboards must read real APIs, never generated data.
 * Runs with Node only (no test framework, no database).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAnalytics, EMPTY_ANALYTICS } from '../src/utils/analyticsData.js';
import httpClient from '../server/utils/httpClient.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

check('analytics dashboard has no demo generator or random values', () => {
    const src = read('src/components/dashboard/Analytics.jsx');
    assert.doesNotMatch(src, /generateEnhancedDemoData|generateRealtimeActivity/);
    assert.doesNotMatch(src, /Math\.random\(/);
    assert.doesNotMatch(src, /new WebSocket\(/);
    assert.match(src, /normalizeAnalytics\(/);
});

check('visitor dashboard has no fabricated rows or deltas', () => {
    const src = read('src/components/dashboard/VisitorsAnalyticsStyled.jsx');
    assert.doesNotMatch(src, /Math\.random\(/);
    assert.doesNotMatch(src, /\[\.\.\.Array\(8\)\]/);
    assert.match(src, /getRealtimeAnalytics\(/);
    assert.match(src, /recentVisitors/);
});

check('email manager has no seeded sample inbox', () => {
    const src = read('src/components/dashboard/EmailManagerEnhanced.jsx');
    assert.doesNotMatch(src, /Seed mock emails|hello@efolio\.dev|Alice Johnson/);
    assert.match(src, /getEmailStats\(/);
    assert.match(src, /getQuickResponses\(/);
});

check('analytics controller returns aggregates, not hard-coded demo data', () => {
    const src = read('server/controllers/analytics.controller.js');
    assert.doesNotMatch(src, /2024-01-01|Mock data for overview|Summer Campaign/);
    assert.match(src, /TrackingSession\.aggregate/);
    assert.match(src, /populated: false/);
});

check('API client supports params and never fabricates success on failure', () => {
    const src = read('src/services/api.service.js');
    assert.match(src, /const \{ timeout, signal, params, \.\.\.fetchOptions \}/);
    assert.doesNotMatch(src, /return \{ success: true, data: (\{\}|\[\]) \}/);
    assert.doesNotMatch(src, /using mock data/);
});

check('realtime tracking endpoint exposes dashboard fields', () => {
    const src = read('server/controllers/tracking.controller.js');
    for (const field of ['totalPageViews', 'weeklyData', 'hourlyData', 'recentVisitors', 'visitorFlow', 'avgDuration']) {
        assert.match(src, new RegExp(`\\b${field}\\b`), `missing ${field}`);
    }
    assert.doesNotMatch(src, /\$gte: dateFilter\.startTime \}/);
});

check('normalizer produces a safe empty skeleton', () => {
    const result = normalizeAnalytics({});
    assert.equal(result.populated, false);
    assert.equal(result.seo.pageSpeed.mobile.score, 0);
    assert.ok(Array.isArray(result.technical.devices));
    assert.ok(Array.isArray(result.overview.chartData));
    assert.equal(EMPTY_ANALYTICS.populated, false);
});

check('normalizer unwraps real API responses', () => {
    const result = normalizeAnalytics({
        overview: { success: true, data: { overview: { summary: { totalViews: 42, realtimeUsers: 3 }, chartData: [{ date: 'Nov 1', views: 5 }] } } },
        traffic: { success: true, data: { traffic: { sources: [{ source: 'direct', visits: 42, percentage: 100 }] } } },
        behavior: { success: true, data: { behavior: { pageViews: [{ page: '/', views: 7 }], recentActivity: [{ name: 'page_view', location: 'Kenya', timestamp: new Date().toISOString() }] } } },
        technical: { success: false, data: {}, message: 'offline' },
        topProjects: { success: true, data: [{ name: 'Demo', views: 5 }] },
        realtime: { success: true, analytics: { activeNow: 9 } }
    });
    assert.equal(result.overview.summary.totalViews, 42);
    assert.equal(result.overview.chartData.length, 1);
    assert.equal(result.traffic.sources.length, 1);
    assert.equal(result.behavior.pageViews.length, 1);
    assert.equal(result.realtimeActivity.length, 1);
    assert.equal(result.topProjects.length, 1);
    assert.equal(result.realtimeUsers, 3);
    assert.deepEqual(result.unavailable, ['technical']);
    assert.equal(result.populated, false);
});

check('http client shim is axios-compatible', () => {
    assert.equal(typeof httpClient.get, 'function');
    assert.equal(typeof httpClient.post, 'function');
    assert.equal(typeof httpClient.request, 'function');
});

console.log(`\n${passed} dashboard API regression checks passed.`);
