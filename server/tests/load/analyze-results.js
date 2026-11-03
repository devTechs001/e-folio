#!/usr/bin/env node
'use strict';
/**
 * Summarise k6 JSON-line output without any external service.
 * Usage: node analyze-results.js <results.json> [--strict]
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
    console.error('Usage: node analyze-results.js <k6-results.json> [--strict]');
    process.exit(2);
}

const durations = [];
let failedPoints = 0;
let failedChecks = 0;
let totalChecks = 0;
let requests = 0;
let firstAt = null;
let lastAt = null;

const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
for (const line of lines) {
    let point;
    try { point = JSON.parse(line); } catch { continue; }
    const ts = Date.parse(point.time);
    if (Number.isFinite(ts)) {
        if (firstAt === null || ts < firstAt) firstAt = ts;
        if (lastAt === null || ts > lastAt) lastAt = ts;
    }
    switch (point.metric) {
        case 'http_req_duration':
            if (typeof point.data?.value === 'number') durations.push(point.data.value);
            break;
        case 'http_reqs':
            requests += 1;
            break;
        case 'http_req_failed':
            if (point.data?.value === 1) failedPoints += 1;
            break;
        case 'checks':
            totalChecks += 1;
            if (point.data?.value === 0) failedChecks += 1;
            break;
        default:
            break;
    }
}

const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

const elapsedSeconds = firstAt && lastAt ? Math.max((lastAt - firstAt) / 1000, 1) : 1;
const summary = {
    file: path.basename(file),
    dataPoints: lines.length,
    durationSamples: durations.length,
    httpRequests: requests,
    throughputRps: Math.round((requests / elapsedSeconds) * 100) / 100,
    latencyMs: {
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / (durations.length || 1) * 100) / 100,
        p50: Math.round(percentile(durations, 0.5) * 100) / 100,
        p95: Math.round(percentile(durations, 0.95) * 100) / 100,
        p99: Math.round(percentile(durations, 0.99) * 100) / 100
    },
    failedRequests: failedPoints,
    failedChecks,
    totalChecks
};

console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes('--strict') && (summary.latencyMs.p95 > 800 || summary.failedRequests > 0)) {
    process.exitCode = 1;
}
