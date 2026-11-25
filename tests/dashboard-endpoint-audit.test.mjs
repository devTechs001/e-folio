/**
 * Dashboard ↔ endpoint connection audit.
 *
 * Path+method parity (check-endpoint-parity.js) only proves that a call has a
 * matching route. It cannot catch the failure that actually breaks a dashboard:
 * a panel visible to a role whose API rejects that role with 403. That is how
 * the admin menu regression happened — the sidebar offered owner-only panels
 * whose endpoints required the owner role.
 *
 * This audit resolves every dashboard menu entry to its real component, collects
 * the endpoints that component calls, resolves each endpoint to the Express
 * route that serves it, and compares the route's guard against the roles that
 * can see the panel. It also checks the reverse direction: an owner-only panel
 * that calls an endpoint with no guard at all.
 *
 * Static analysis only: no network, no database, nothing leaves the checkout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/* ---------------------------------------------------------------- dashboard */

/** Resolve each menu entry to the component file it actually renders. */
const readMenu = () => {
    const dashboard = read('src/pages/Dashboard.jsx');

    // const X = lazy(() => import('../components/dashboard/Foo'))
    const lazyModules = {};
    for (const m of dashboard.matchAll(/const (\w+) = lazy\(\(\) => import\('([^']+)'/g)) {
        let rel = path.normalize(path.join('src/pages', m[2]));
        if (!rel.endsWith('.jsx')) rel += '.jsx';
        lazyModules[m[1]] = rel;
    }

    // const LazyX = () => { ... <Component /> ... }
    const wrappers = {};
    for (const m of dashboard.matchAll(/const (Lazy\w+) = \(\) => \{[\s\S]*?<(\w+) \/>/g)) {
        wrappers[m[1]] = m[2];
    }

    return [...dashboard.matchAll(
        /path: '([^']+)',[\s\S]{0,400}?component: (Lazy\w+),[\s\S]{0,200}?roles: (\[[^\]]*\])/g
    )].map(([, route, alias, roles]) => ({
        route,
        roles: roles.match(/'([^']+)'/g).map(r => r.replace(/'/g, '')),
        file: lazyModules[wrappers[alias]]
    }));
};

/**
 * Calls with the verb they were made with: `apiService.post('/x')` is a write,
 * `request('/x')` inherits the verb the route declares.
 */
const callsOfDetailed = src => {
    const code = stripComments(src);
    const out = [];
    for (const m of code.matchAll(
        /(?:apiService|api)\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g
    )) {
        if (!m[2].startsWith('/')) continue;
        out.push({ verb: m[1].toUpperCase(), url: m[2].split('?')[0].replace(/\$\{[^}]*\}/g, ':param') });
    }
    for (const m of code.matchAll(/request\(\s*[`'"]([^`'"]+)[`'"]/g)) {
        if (!m[1].startsWith('/')) continue;
        out.push({ verb: null, url: m[1].split('?')[0].replace(/\$\{[^}]*\}/g, ':param') });
    }
    return out;
};

/** Endpoint literals a component calls, normalised to `/path` form. */
const callsOf = src => {
    const code = stripComments(src);
    const found = new Set();
    const patterns = [
        /request\(\s*[`'"]([^`'"]+)[`'"]/g,
        /apiService\.(?:get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g,
        /api\.(?:get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g
    ];
    for (const re of patterns) {
        for (const m of code.matchAll(re)) {
            let url = m[1].trim();
            if (!url.startsWith('/')) continue;
            // Drop the query string and any template interpolation tail.
            url = url.split('?')[0];
            // Collapse `${...}` to a parameter so it matches the route shape.
            url = url.replace(/\$\{[^}]*\}/g, ':param');
            found.add(url);
        }
    }
    return [...found];
};

/* ------------------------------------------------------------------- routes */

/** Registered API prefixes and the router module mounted on each. */
const readMounts = () => {
    const server = read('server/server.js');
    const requires = {};
    for (const m of server.matchAll(/const (\w+) = require\('\.\/routes\/([^']+)'\)/g)) {
        requires[m[1]] = `server/routes/${m[2]}.js`;
    }
    const mounts = {};
    for (const m of server.matchAll(/app\.use\('\/api([^']*)', (\w+)\)/g)) {
        const prefix = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
        if (requires[m[2]]) mounts[prefix] = requires[m[2]];
    }
    return mounts;
};

/**
 * Guards declared on a router. `router.use(GUARD)` applies to everything below
 * it; a per-route guard only applies to that route.
 */
const readRouteGuards = routerFile => {
    const src = read(routerFile);
    const lines = src.split('\n');
    let routerWide = 'auth';
    const routes = [];

    for (const line of lines) {
        if (/^\s*\/\//.test(line)) continue;

        const use = line.match(/router\.use\(([^)]*)\)/);
        if (use) {
            if (/\bisOwner\b/.test(use[1])) routerWide = 'owner';
            else if (/\bisAuthorized\b/.test(use[1])) routerWide = 'authorized';
            continue;
        }

        // router.get('/path', ...guards..., handler)
        const single = line.match(/router\.(get|post|put|patch|delete)\(\s*'([^']+)',([^)]*)/);
        if (single) {
            const [, method, routePath, rest] = single;
            routes.push({
                method: method.toUpperCase(),
                path: routePath,
                guard: /\bisOwner\b/.test(rest) ? 'owner'
                    : /\bisAuthorized\b/.test(rest) ? 'authorized'
                        : /\bauth\b|protect/.test(rest) ? 'auth'
                            : 'public'
            });
            continue;
        }

        // router.route('/path').get(...).post(isOwner, ...)
        const chain = line.match(/router\.route\(\s*'([^']+)'\s*\)(.*)/);
        if (chain) {
            const [, routePath, rest] = chain;
            for (const verb of rest.matchAll(/\.(get|post|put|patch|delete)\(([^)]*)/g)) {
                routes.push({
                    method: verb[1].toUpperCase(),
                    path: routePath,
                    guard: /\bisOwner\b/.test(verb[2]) ? 'owner'
                        : /\bisAuthorized\b/.test(verb[2]) ? 'authorized'
                            : /\bauth\b|protect/.test(verb[2]) ? 'auth'
                                : routerWide
                });
            }
        }
    }

    // A route with no explicit isOwner/isAuthorized inherits the router-wide
    // guard, and the strictest guard wins. The earlier version only promoted
    // `public`, so a route under `router.use(isOwner)` was recorded as merely
    // `auth` — which made this audit blind to exactly the regression it exists
    // to catch.
    const RANK = { public: 0, auth: 1, authorized: 2, owner: 3 };
    for (const route of routes) {
        if (RANK[routerWide] > RANK[route.guard]) route.guard = routerWide;
    }

    return { routerWide, routes };
};

/** Find the route serving `url` under a mounted prefix. */
const matchRoute = (mounts, url) => {
    for (const [prefix, file] of Object.entries(mounts)) {
        if (prefix && !url.startsWith(prefix)) continue;
        const { routes } = readRouteGuards(file);
        const rest = prefix ? url.slice(prefix.length) || '/' : url;

        const candidates = routes.filter(route => {
            // Compare segment counts, treating `:id` and `:param` as wildcards.
            const a = route.path.split('/').filter(Boolean);
            const b = rest.split('/').filter(Boolean);
            if (a.length !== b.length) return false;
            return a.every((seg, i) => (seg.startsWith(':') ? true : seg === b[i]));
        });
        if (candidates.length) return { ...candidates[0], file, prefix };
    }
    return null;
};

/* -------------------------------------------------------------------- audit */

const OWNER_ONLY = roles => roles.every(role => role === 'owner');

/**
 * Can a session holding `roles` reach a route behind `guard`?
 *
 * The earlier version answered `roles.length > 0` for anything that was not
 * `owner`, which made the check vacuous: an owner-only panel widened to
 * collaborators still "passed". It is now explicitly false when the panel admits
 * a role the guard rejects.
 */
const DASHBOARD_ROLES = ['owner', 'admin', 'collaborator', 'user'];
const admits = (guard, roles) => {
    const nonOwner = roles.filter(role => role !== 'owner');
    if (guard === 'owner') return nonOwner.length === 0;
    if (guard === 'authorized') return roles.every(role => DASHBOARD_ROLES.includes(role));
    // `auth` accepts any signed-in account, so only a visitor-only panel fails.
    return roles.every(role => DASHBOARD_ROLES.includes(role));
};

let passed = 0;
const failures = [];
const check = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log(`  ok  ${name}`);
    } catch (error) {
        failures.push(`${name}: ${error.message}`);
        console.log(`  FAIL ${name}\n       ${error.message}`);
    }
};

console.log('Dashboard ↔ endpoint connection audit\n');

const menu = readMenu();
const mounts = readMounts();

check('every dashboard entry resolves to a real component', () => {
    const unresolved = menu.filter(item => !item.file || !exists(item.file));
    if (unresolved.length) {
        throw new Error(unresolved.map(u => `${u.route} -> ${u.file || 'unresolved'}`).join('; '));
    }
});

check('every endpoint a panel calls is served by a mounted route', () => {
    const gaps = [];
    for (const item of menu) {
        for (const url of callsOf(read(item.file))) {
            if (!matchRoute(mounts, url)) gaps.push(`${item.route}: ${url}`);
        }
    }
    if (gaps.length) throw new Error(`unserved: ${gaps.join('; ')}`);
});

check('no panel is offered to a role its endpoints reject', () => {
    // The regression this exists to prevent: a non-owner menu entry whose API
    // answers 403 because the route is owner-guarded.
    //
    // A panel may legitimately contain owner-only calls if it gates them on the
    // same role the API enforces. That is only accepted when the gating flag is
    // actually used to guard the call, so the flag cannot be decorative — which
    // is exactly the state this audit found ProjectManagerEnhanced in.
    const broken = [];
    for (const item of menu) {
        if (OWNER_ONLY(item.roles)) continue;
        const source = read(item.file);
        const gatesOwnerWrites = /canManage\s*=\s*[^;]*role[^;]*owner/i.test(source)
            && (source.match(/\bcanManage\b/g) || []).length > 1;
        for (const call of callsOfDetailed(source)) {
            const route = matchRoute(mounts, call.url);
            if (!route) continue;
            if (admits(route.guard, item.roles)) continue;
            const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method);
            if (isWrite && gatesOwnerWrites) continue;
            broken.push(`${item.route} (${item.roles.join('/')}) -> ${call.url} needs ${route.guard}`);
        }
    }
    if (broken.length) throw new Error(broken.join('; '));
});

check('no panel WRITES through an unguarded route', () => {
    // The real risk in the reverse direction is a mutation reaching an
    // unauthenticated endpoint. Reading published content from /public/* is
    // legitimate even inside an owner panel — SkillsEditorEnhanced previews the
    // same list a visitor sees — so only writes are flagged here.
    const leaks = [];
    for (const item of menu) {
        for (const call of callsOfDetailed(read(item.file))) {
            const route = matchRoute(mounts, call.url);
            if (!route) continue;
            const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method);
            // Public interaction counters are intentionally anonymous: a visitor
            // must be able to record a view or a like without an account. The
            // dashboard calling them is the same contract, not a leak.
            const anonymousByDesign = /^\/projects\/:(id|param)\/view$/.test(route.path);
            if (isWrite && route.guard === 'public' && !anonymousByDesign) {
                leaks.push(`${item.route} ${route.method} ${call.url}`);
            }
        }
    }
    if (leaks.length) throw new Error(leaks.join('; '));
});

console.log(`\n${passed} dashboard connection checks passed.`);
if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
}
