#!/usr/bin/env node
/**
 * Endpoint parity checker (confidential - runs entirely inside this repository).
 *
 * Compares the API paths the frontend actually calls against the routes the
 * Express server registers. It also works out which source files are reachable
 * from the app entry point, so calls living in orphaned/legacy snippets are
 * reported separately instead of being mistaken for live bugs.
 *
 * Static analysis only: no network calls, no database access, no code leaves
 * the workspace.
 *
 * Usage:
 *   node server/scripts/check-endpoint-parity.js            # human readable
 *   node server/scripts/check-endpoint-parity.js --json    # machine readable
 *   node server/scripts/check-endpoint-parity.js --strict  # exit 1 on live gaps
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SERVER_DIR = path.join(ROOT, 'server');
const ENTRY = path.join(ROOT, 'src/main.jsx');
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all', 'use'];

const read = rel => fs.readFileSync(rel, 'utf8');

/** Remove JS comments so documentation examples are not read as live calls. */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
}

function walk(dir, exts, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', '.git', 'build', 'coverage'].includes(entry.name)) continue;
            walk(full, exts, out);
        } else if (exts.some(ext => entry.name.endsWith(ext))) {
            out.push(full);
        }
    }
    return out;
}

/** Normalise a path so `:id`, `${id}` and query strings compare fairly. */
function normalise(raw) {
    let p = raw.split('?')[0].trim();
    p = p.replace(/\$\{[^}]*\}/g, ':param');
    p = p.replace(/\$\{.*$/, '');
    p = p.replace(/:([A-Za-z0-9_]+)/g, ':param');
    p = p.replace(/([A-Za-z0-9_-]):param$/, '$1');
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\/+/g, '/');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
}

function toRegex(p) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:param/g, '[^/]+');
    return new RegExp('^' + escaped + '$');
}

/** Reachability: which frontend files are actually part of the bundle. */
function activeFiles(allFiles) {
    const set = new Set(allFiles);
    const active = new Set();
    const queue = [ENTRY];

    const resolveImport = (from, spec) => {
        if (!spec.startsWith('.')) return null;
        let target = path.resolve(path.dirname(from), spec);
        const candidates = [target, target + '.js', target + '.jsx', path.join(target, 'index.js'), path.join(target, 'index.jsx')];
        return candidates.find(c => set.has(c)) || null;
    };

    while (queue.length) {
        const file = queue.shift();
        if (!file || active.has(file) || !set.has(file) || !fs.existsSync(file)) continue;
        active.add(file);
        const src = stripComments(read(file));
        const re = /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
        let m;
        while ((m = re.exec(src)) !== null) {
            const next = resolveImport(file, m[1]);
            if (next) queue.push(next);
        }
    }
    return active;
}

/** Collect server routes: { method, path, source, regex }. */
function collectServerRoutes() {
    const serverJs = read(path.join(SERVER_DIR, 'server.js'));
    const mounts = [];
    const requireMap = {};

    const requireRe = /const\s+([A-Za-z0-9_]+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
    let m;
    while ((m = requireRe.exec(serverJs)) !== null) requireMap[m[1]] = m[2];

    const mountRe = /app\.use\(\s*['"](\/api(?:\/[^'"]+)?)['"]\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
    while ((m = mountRe.exec(serverJs)) !== null) {
        const file = requireMap[m[2]];
        if (!file) continue;
        const filePath = path.join(SERVER_DIR, 'routes', path.basename(file) + (file.endsWith('.js') ? '' : '.js'));
        if (!fs.existsSync(filePath)) continue;
        // Frontend paths are relative to the /api base URL.
        mounts.push({ prefix: normalise(m[1]).replace(/^\/api/, '') || '/', file: filePath });
    }

    const routes = [];
    for (const mount of mounts) {
        const source = read(mount.file);
        const rel = path.relative(ROOT, mount.file);
        const build = raw => normalise((mount.prefix + '/' + raw).replace(/\/+/g, '/'));

        const directRe = /router\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/g;
        while ((m = directRe.exec(source)) !== null) {
            const full = build(m[2]);
            routes.push({ method: m[1].toUpperCase(), path: full, source: rel, regex: toRegex(full) });
        }

        const routeRe = /router\.route\(\s*['"`]([^'"`]+)['"`]\s*\)([\s\S]*?)(?=\n\s*router\.|\n\s*module\.exports|$)/g;
        while ((m = routeRe.exec(source)) !== null) {
            const full = build(m[1]);
            const methods = new Set();
            const chainRe = /\.([a-z]+)\s*\(/g;
            let cm;
            while ((cm = chainRe.exec(m[2])) !== null) {
                if (METHODS.includes(cm[1])) methods.add(cm[1].toUpperCase());
            }
            if (methods.size === 0) methods.add('ALL');
            for (const method of methods) {
                routes.push({ method, path: full, source: rel, regex: toRegex(full) });
            }
        }
    }
    return routes;
}

/** Collect frontend calls: { path, method, source, legacy }. */
function collectFrontendCalls() {
    const files = [
        ...walk(path.join(ROOT, 'src'), ['.js', '.jsx']),
        ...walk(path.join(ROOT, 'api'), ['.js']),
        ...walk(path.join(ROOT, 'services'), ['.js']),
        ...walk(path.join(ROOT, 'hooks'), ['.js']),
    ];
    const active = activeFiles(files);
    const calls = [];
    const seen = new Set();

    for (const file of files) {
        const source = stripComments(read(file));
        const rel = path.relative(ROOT, file);
        const legacy = !active.has(file);

        const add = (raw, method, origin = 'call') => {
            const p = normalise(raw);
            const key = method + ' ' + p + ' ' + rel;
            if (seen.has(key)) return;
            seen.add(key);
            calls.push({ path: p, method, source: rel, legacy, origin });
        };

        let m;
        // this.request('/path', { method: 'POST', ... })
        const requestRe = /(?:this\.)?request\(\s*['"`](\/[^'"`]+)['"`]([\s\S]{0,400}?)\)/g;
        while ((m = requestRe.exec(source)) !== null) {
            const methodMatch = /method\s*:\s*['"`]([A-Za-z]+)['"`]/.exec(m[2]);
            add(m[1], methodMatch ? methodMatch[1].toUpperCase() : 'GET');
        }

        // this.get('/path') / this.post(`/path`, data)  (legacy service snippets)
        const thisRe = /this\.(get|post|put|patch|delete)\(\s*['"`](\/[^'"`]+)['"`]/g;
        while ((m = thisRe.exec(source)) !== null) add(m[2], m[1].toUpperCase());

        // axios-like helpers and fetch('/api/...', { method: 'POST' })
        const axiosRe = /\b(?:api|apiClient|axios|http|fetch)\.(get|post|put|patch|delete)\(\s*['"`](\/[^'"`]+)['"`]/g;
        while ((m = axiosRe.exec(source)) !== null) add(m[2], m[1].toUpperCase());

        const fetchRe = /\b\w*[Ff]etch\(\s*['"`](\/api\/[^'"`]+)['"`]([\s\S]{0,300}?)\)/g;
        while ((m = fetchRe.exec(source)) !== null) {
            const methodMatch = /method\s*:\s*['"`]([A-Za-z]+)['"`]/.exec(m[2]);
            add(m[1].replace(/^\/api/, ''), methodMatch ? methodMatch[1].toUpperCase() : 'GET');
        }

        // Any other literal /api/... reference (documentation-style usage).
        const literalRe = /['"`](\/api\/[A-Za-z0-9_/.:${}-]+)['"`]/g;
        while ((m = literalRe.exec(source)) !== null) add(m[1].replace(/^\/api/, ''), 'GET', 'literal');
    }

    // A literal /api/... mention is often just the path passed to a helper.
    // Drop the implied GET when the same file issues a real non-GET call to it.
    const realMethods = new Set(calls
        .filter(c => c.origin !== 'literal' && c.method !== 'GET')
        .map(c => c.source + ' ' + c.path));
    const deduped = calls.filter(c => !(c.origin === 'literal' && realMethods.has(c.source + ' ' + c.path)));
    return deduped.sort((a, b) => (a.method + a.path).localeCompare(b.method + b.path));
}

function analyse() {
    const routes = collectServerRoutes();
    const calls = collectFrontendCalls();
    const matched = [];
    const missing = [];

    for (const call of calls) {
        const pathHits = routes.filter(r => r.regex.test(call.path));
        const exactHits = pathHits.filter(r => r.method === call.method || r.method === 'ALL');
        if (exactHits.length) {
            matched.push({ ...call, route: exactHits[0] });
        } else {
            missing.push({
                ...call,
                reason: pathHits.length ? 'method-mismatch' : 'not-registered',
                available: [...new Set(pathHits.map(r => r.method))].join(',')
            });
        }
    }

    const live = missing.filter(m => !m.legacy);
    const legacy = missing.filter(m => m.legacy);
    const byPrefix = items => {
        const out = {};
        for (const item of items) {
            const prefix = item.path.split('/').filter(Boolean)[0] || '(root)';
            (out[prefix] ||= []).push(item);
        }
        return out;
    };
    return { routes, calls, matched, missing, live, legacy, byPrefix };
}

function printGroup(title, items, byPrefix) {
    if (!items.length) return;
    console.log(`\n${title} (${items.length})`);
    console.log('-'.repeat(56));
    for (const [prefix, group] of Object.entries(byPrefix(items)).sort()) {
        console.log(`  /api/${prefix} — ${group.length}`);
        for (const item of group) {
            console.log(`    ${item.method.padEnd(6)} ${item.path.padEnd(50)} [${item.reason}${item.available ? ': ' + item.available : ''}] ${item.source}`);
        }
    }
}

function main() {
    const { routes, calls, matched, missing, live, legacy, byPrefix } = analyse();
    const asJson = process.argv.includes('--json');
    const strict = process.argv.includes('--strict');
    const brief = ({ method, path, source, reason, available, legacy }) => ({ method, path, source, reason, available, legacy });

    if (asJson) {
        console.log(JSON.stringify({
            serverRoutes: routes.length,
            frontendCalls: calls.length,
            matched: matched.length,
            missing: missing.length,
            liveGaps: live.map(brief),
            legacyGaps: legacy.map(brief)
        }, null, 2));
    } else {
        console.log('E-Folio endpoint parity (static analysis, offline)');
        console.log('='.repeat(56));
        console.log(`Server route definitions : ${routes.length}`);
        console.log(`Frontend API calls       : ${calls.length}`);
        console.log(`Matched (path + method)  : ${matched.length}`);
        console.log(`Unmatched total          : ${missing.length}`);
        console.log(`  live code gaps         : ${live.length}`);
        console.log(`  orphaned/legacy files  : ${legacy.length}`);
        printGroup('LIVE GAPS (reachable from src/main.jsx)', live, byPrefix);
        printGroup('LEGACY GAPS (files not imported by the app)', legacy, byPrefix);
    }

    if (strict && live.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { analyse, collectServerRoutes, collectFrontendCalls, normalise, activeFiles };
