/**
 * Regression checks: the MongoServerError
 * "Updating the path 'pagesViewed' would create a conflict at 'pagesViewed'"
 * from server/controllers/tracking.controller.js. Node-only static checks —
 * no DB, no network, no live server. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const CONTROLLER = 'server/controllers/tracking.controller.js';
let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/** Slice a balanced { ... } object literal following `marker`. */
const objectSlice = (src, marker) => {
    const at = src.indexOf(marker);
    if (at < 0) return '';
    const open = src.indexOf('{', at);
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = open; i < src.length; i += 1) {
        const char = src[i];
        if (quote) {
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
        if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;
            if (depth === 0) return src.slice(open + 1, i);
        }
    }
    return '';
};

/** Top-level keys of an object literal body. */
const topKeys = inner => {
    const keys = [];
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = 0; i < inner.length; i += 1) {
        const char = inner[i];
        if (quote) {
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
        if (char === '{' || char === '[') { depth += 1; continue; }
        if (char === '}' || char === ']') { depth -= 1; continue; }
        if (depth === 0 && /[A-Za-z_$]/.test(char)) {
            const match = /^[A-Za-z_$][\w.]*\s*:/.exec(inner.slice(i));
            if (match) {
                keys.push(match[0].replace(/\s*:$/, ''));
                i += match[0].length - 1;
            }
        }
    }
    return keys;
};

const updateSrc = read(CONTROLLER);
const updateBody = objectSlice(updateSrc, 'const update = {');
const operatorKeys = name => topKeys(objectSlice(updateBody, `${name}:`));

/* -------------------------- the reported conflict -------------------------- */

check('pagesViewed is no longer seeded by $setOnInsert', () => {
    const setOnInsert = objectSlice(updateBody, '$setOnInsert:');
    assert.ok(setOnInsert, 'the update must still use $setOnInsert');
    assert.doesNotMatch(setOnInsert, /pagesViewed/);
    assert.match(updateBody, /\$inc:\s*\{\s*pagesViewed:\s*1\s*\}/);
});

check('pageJourney is written only by $push, never by $setOnInsert', () => {
    const setOnInsert = objectSlice(updateBody, '$setOnInsert:');
    assert.doesNotMatch(setOnInsert, /pageJourney/);
    assert.match(updateBody, /\$push:\s*\{\s*pageJourney:/);
    assert.doesNotMatch(updateBody, /pageJourney:\s*\[\]/);
});

check('scrollDepth is written only by $max, never by $setOnInsert', () => {
    const setOnInsert = objectSlice(updateBody, '$setOnInsert:');
    assert.doesNotMatch(setOnInsert, /scrollDepth/);
    assert.match(updateBody, /\$max:\s*\{\s*scrollDepth:/);
    // $max must always run so an inserted document still gets the 0 default.
    assert.doesNotMatch(updateBody, /if \(scrollDepth\)\s*\{\s*update\.\$max/);
});

check('no update operator writes a path also written by another operator', () => {
    const operators = ['$setOnInsert', '$inc', '$push', '$max', '$set'];
    const seen = new Map();
    for (const op of operators) {
        for (const key of operatorKeys(op)) {
            assert.ok(!seen.has(key), `conflict at '${key}': ${op} and ${seen.get(key)}`);
            seen.set(key, op);
        }
    }
    assert.ok(seen.has('pagesViewed'), '$inc must still increment pagesViewed');
    assert.ok(seen.has('pageJourney'), '$push must still append the page journey');
    assert.ok(seen.has('scrollDepth'), '$max must still track scroll depth');
});

check('the atomic session upsert is preserved', () => {
    assert.match(updateSrc, /TrackingSession\.findOneAndUpdate\(/);
    assert.match(updateSrc, /\{\s*upsert:\s*true,\s*new:\s*true\s*\}\s*\)/);
    assert.match(updateSrc, /MongoDB rejects a single update that writes the same path/);
});

check('the other visitor-ping upsert has no conflicting path either', () => {
    const analytics = read('server/controllers/analytics.controller.js');
    const block = analytics.slice(
        analytics.indexOf('trackVisitor ='),
        analytics.indexOf('if (page)', analytics.indexOf('trackVisitor ='))
    );
    const setOnInsert = objectSlice(block, '$setOnInsert:');
    assert.ok(setOnInsert);
    assert.doesNotMatch(setOnInsert, /pagesViewed|views|uniqueViews/);
    assert.match(block, /\$inc:\s*\{\s*pagesViewed:\s*1\s*\}/);
});

/* --------------------------------- safety ---------------------------------- */

check('no secret or external call was introduced by the fix', () => {
    assert.doesNotMatch(updateSrc, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(updateSrc, /fetch\(|axios|XMLHttpRequest/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:tracking-conflict'], /tracking-conflict\.test\.mjs/);
        assert.match(pkg.scripts.test, /tracking-conflict\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3p\./);
    assert.match(report, /pagesViewed/);
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} tracking-conflict regression checks passed.`);
