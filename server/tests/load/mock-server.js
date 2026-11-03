#!/usr/bin/env node
'use strict';
/**
 * Tiny standalone target for offline stress tests.
 *
 * Produces the same response shapes as the real tracking endpoints, with a
 * configurable artificial latency. Useful when MongoDB is not available: it
 * verifies the load harness and gives a baseline for p95/throughput without
 * touching production data.
 *
 * Usage: PORT=5051 node mock-server.js
 */
const http = require('http');

const PORT = Number(process.env.PORT || 5051);
const HOST = process.env.HOST || '0.0.0.0';
const BASE_DELAY = Number(process.env.ARTIFICIAL_DELAY_MS || 8);

const delay = () => new Promise(resolve => setTimeout(resolve, BASE_DELAY + Math.random() * BASE_DELAY));
const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
        if (chunks.reduce((n, c) => n + c.length, 0) > 1e6) break;
    }
    await delay();

    if (url.pathname === '/health') return json(res, 200, { status: 'ok', uptime: process.uptime() });
    if (url.pathname === '/api/health') return json(res, 200, { status: 'healthy' });

    switch (url.pathname) {
        case '/api/tracking/session':
            return json(res, 200, { success: true, sessionId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
        case '/api/tracking/pageview':
            return json(res, 200, { success: true, aiInsights: {} });
        case '/api/tracking/event':
            return json(res, 200, { success: true, message: 'Event tracked successfully' });
        case '/api/tracking/session/end':
            return json(res, 200, { success: true, message: 'Session ended' });
        case '/api/tracking/analytics/realtime':
            return json(res, 200, {
                success: true,
                analytics: {
                    activeNow: 3, todayTotal: 42, recentVisitors: [],
                    devices: { mobile: 1, tablet: 0, desktop: 2 },
                    locations: [], topPages: [], sources: {},
                    averageEngagement: 65, conversionRate: '1.20', bounceRate: '30.00',
                    aiConfidence: 94, trafficHistory: []
                }
            });
        default:
            return json(res, 404, { success: false, message: 'Endpoint not found', path: url.pathname });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`E-Folio load-test target listening on http://${HOST}:${PORT} (delay ~${BASE_DELAY}ms)`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
