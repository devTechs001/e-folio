#!/usr/bin/env node
'use strict';
/**
 * Dependency-free HTTP load / stress test.
 *
 * Uses only Node built-ins so it can run in CI or a sandbox with no k6, no
 * Artillery, no InfluxDB and no cloud account. It drives a fixed number of
 * concurrent virtual users against a configurable endpoint mix and reports
 * latency percentiles, throughput and error rate.
 *
 * Usage:
 *   node smoke-load.js                       # defaults
 *   BASE_URL=http://localhost:5051 VUS=50 DURATION=45s node smoke-load.js
 *   node smoke-load.js --strict              # exit 1 when thresholds are breached
 */
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const VUS = Math.max(1, Number(process.env.VUS || 20));
const DURATION_MS = (() => {
    const raw = String(process.env.DURATION || '30s').trim();
    const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m)?$/.exec(raw);
    if (!match) return 30000;
    const value = Number(match[1]);
    const unit = match[2] || 's';
    return Math.round(value * (unit === 'ms' ? 1 : unit === 'm' ? 60000 : 1000));
})();
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 10000);
const P95_LIMIT_MS = Number(process.env.P95_MS || 800);
const ERROR_RATE_LIMIT = Number(process.env.ERROR_RATE || 0.02);

const POST_PATHS = new Set([
    '/api/tracking/session', '/api/tracking/pageview', '/api/tracking/event', '/api/tracking/session/end'
]);
const ENDPOINTS = (process.env.ENDPOINTS || [
    '/health', '/api/health',
    '/api/tracking/session', '/api/tracking/pageview',
    '/api/tracking/event', '/api/tracking/session/end',
    '/api/tracking/analytics/realtime'
].join(',')).split(',').map(p => p.trim()).filter(Boolean);

const samples = [];
const statusCounts = new Map();
let failures = 0;

function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

async function oneRequest(vu, endpoint) {
    const method = POST_PATHS.has(endpoint) ? 'POST' : 'GET';
    const body = method === 'POST'
        ? JSON.stringify({ sessionId: `load-${vu}`, page: '/', title: 'Load test', eventType: 'click', eventData: { source: 'smoke-load' } })
        : undefined;
    const started = performance.now();
    let status = 0;
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        status = response.status;
        await response.arrayBuffer();
        if (!response.ok) failures += 1;
    } catch {
        failures += 1;
    }
    const elapsed = performance.now() - started;
    samples.push(elapsed);
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
}

async function run() {
    const started = performance.now();
    const deadline = started + DURATION_MS;
    const workers = [];
    for (let vu = 0; vu < VUS; vu++) {
        workers.push((async () => {
            let i = 0;
            while (performance.now() < deadline) {
                await oneRequest(vu, ENDPOINTS[(vu + i++) % ENDPOINTS.length]);
            }
        })());
    }
    await Promise.all(workers);
    const elapsedMs = performance.now() - started;
    const total = samples.length;
    const avg = total ? samples.reduce((a, b) => a + b, 0) / total : 0;
    const result = {
        timestamp: new Date().toISOString(),
        target: BASE_URL,
        virtualUsers: VUS,
        durationMs: Math.round(elapsedMs),
        endpoints: ENDPOINTS,
        requests: total,
        throughputRps: Math.round((total / (elapsedMs / 1000)) * 100) / 100,
        latencyMs: {
            avg: Math.round(avg * 100) / 100,
            p50: Math.round(percentile(samples, 0.5) * 100) / 100,
            p95: Math.round(percentile(samples, 0.95) * 100) / 100,
            p99: Math.round(percentile(samples, 0.99) * 100) / 100,
            max: Math.round(Math.max(0, ...samples) * 100) / 100
        },
        failures,
        errorRate: total ? Math.round((failures / total) * 10000) / 10000 : 0,
        statusCodes: Object.fromEntries(statusCounts),
        thresholds: { p95Ms: P95_LIMIT_MS, errorRate: ERROR_RATE_LIMIT },
        passed: total > 0 &&
            percentile(samples, 0.95) <= P95_LIMIT_MS &&
            (total ? failures / total : 1) <= ERROR_RATE_LIMIT
    };

    const outDir = path.resolve(__dirname, '../../../load-test-results');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `smoke-${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));

    console.log('E-Folio stress test (offline, dependency-free)');
    console.log('='.repeat(56));
    console.log(`Target       : ${BASE_URL}`);
    console.log(`Virtual users: ${VUS}   Duration: ${Math.round(elapsedMs)} ms`);
    console.log(`Requests     : ${total}   Throughput: ${result.throughputRps} req/s`);
    console.log(`Latency      : avg ${result.latencyMs.avg} ms | p50 ${result.latencyMs.p50} ms | p95 ${result.latencyMs.p95} ms | p99 ${result.latencyMs.p99} ms`);
    console.log(`Failures     : ${failures} (${(result.errorRate * 100).toFixed(2)}%)`);
    console.log(`Thresholds   : p95 <= ${P95_LIMIT_MS} ms, error rate <= ${ERROR_RATE_LIMIT}`);
    console.log(`Result       : ${result.passed ? 'PASS' : 'FAIL'}`);
    console.log(`Report       : ${path.relative(process.cwd(), outFile)}`);

    if (!result.passed) process.exitCode = 1;
}

run().catch(error => {
    console.error('Load test failed:', error);
    process.exitCode = 1;
});
