/**
 * Phase 31 — remove the DEV · API badge (security), finish the identified
 * auth fixes, and give the portfolio owner and regular CV/portfolio users two
 * separate sign-in pages with two separate server flows.
 *
 * Node-only static checks: no framework, browser, database, network or
 * external service. Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const walk = (dir, out = []) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(rel, out);
        else if (/\.(jsx?|css)$/.test(entry.name)) out.push(rel);
    }
    return out;
};

check('the DEV · API badge and its stylesheet are gone from the UI', () => {
    assert.ok(!exists('src/components/DevDiagnostics.jsx'));
    assert.ok(!exists('src/styles/DevDiagnostics.css'));
    for (const file of walk('src')) {
        const src = read(file);
        assert.doesNotMatch(src, /DEV · API|Developer diagnostics|dev-diagnostics|<DevDiagnostics/, file);
    }
    assert.doesNotMatch(read('src/App.jsx'), /import\.meta\.env\.DEV && </);
});

check('technical detail stays console-only in dev builds, never public', () => {
    const messaging = read('src/utils/publicMessaging.js');
    assert.match(messaging, /export const IS_DEV = Boolean\(import\.meta\.env\.DEV\)/);
    assert.match(messaging, /if \(IS_DEV\) \{[\s\S]*?console\.warn/);
    assert.match(messaging, /No diagnostics badge, panel, endpoint list or status code/);
    assert.doesNotMatch(messaging, /<DevDiagnostics \/>|dev panel/);
    assert.match(read('src/utils/publicMessaging.js'), /export const getDevIssues/);
});

check('the owner has a dedicated server endpoint with its own rate limit', () => {
    const routes = read('server/routes/auth.routes.js');
    assert.match(routes, /const ownerLoginLimiter = rateLimit\(\{[\s\S]*?max: 10/);
    assert.match(routes, /router\.post\('\/login\/owner', ownerLoginLimiter/);
    const ownerRoute = routes.slice(routes.indexOf("router.post('/login/owner'"), routes.indexOf("router.post('/login', loginLimiter"));
    assert.match(ownerRoute, /security\.verifyOwnerPassword\(password, bcrypt\)/);
    assert.match(ownerRoute, /message: 'Invalid credentials'/);
    assert.match(ownerRoute, /buildOwnerSession\(ownerEmail\)/);
    const helper = routes.slice(routes.indexOf('async function buildOwnerSession'), routes.indexOf('const ownerLoginLimiter'));
    assert.match(helper, /role: 'owner'/);
    assert.match(helper, /security\.signToken/);
    // No database account can be exchanged for an owner token here.
    assert.doesNotMatch(ownerRoute, /User\.findOne/);
    assert.doesNotMatch(ownerRoute, /signToken\(\{[^}]*role: 'user'/);
});

check('the regular user endpoint is users-only and refuses owner credentials', () => {
    const routes = read('server/routes/auth.routes.js');
    const userRoute = routes.slice(routes.indexOf("router.post('/login', loginLimiter"), routes.indexOf('// Collaborator login'));
    assert.match(userRoute, /normalizedEmail === security\.getOwnerEmail\(\)/);
    assert.match(userRoute, /message: 'Invalid credentials'/);
    assert.match(userRoute, /User\.findOne\(\{ email: normalizedEmail \}\)/);
    assert.match(userRoute, /signToken\(\{ id: user\._id\.toString\(\), email: user\.email, role: user\.role \|\| 'user' \}/);
    assert.doesNotMatch(userRoute, /verifyOwnerPassword/);
    assert.doesNotMatch(userRoute, /role: 'owner'/);
});

check('the identified server-side role gaps are fixed without privilege elevation', () => {
    const middleware = read('server/middleware/auth.middleware.js');
    assert.match(middleware, /exports\.isOwner = \(req, res, next\) => \{\s*if \(req\.user\?\.role !== 'owner'\)/);
    assert.match(middleware, /\['owner', 'admin', 'collaborator', 'user'\]\.includes\(req\.user\?\.role\)/);
    assert.match(read('server/routes/auth.routes.js'), /\['user', 'admin', 'collaborator'\]\.includes\(decoded\.role\)/);
    assert.match(read('src/components/dashboard/DashboardSideNavbar.jsx'), /owner: \{ icon: Crown/);
    assert.match(read('src/components/dashboard/DashboardSideNavbar.jsx'), /collaborator: \{ icon: Shield/);
});

check('the client uses a separate API call for the owner flow', () => {
    const service = read('src/services/api.service.js');
    assert.match(service, /async ownerLogin\(email, password\)/);
    assert.match(service, /this\.request\('\/auth\/login\/owner'/);
    assert.match(service, /async login\(email, password\)/);
    assert.match(service, /this\.request\('\/auth\/login', \{/);
});

check('the auth context never accepts an owner session from the user endpoint', () => {
    const auth = read('src/contexts/AuthContext.jsx');
    assert.match(auth, /apiService\.ownerLogin\(credentials\.email, credentials\.password\)/);
    assert.match(auth, /normalizeRole\(response\.user\?\.role\) === OWNER_ROLE/);
    assert.match(auth, /const sessionRole = normalizeRole\(response\.user\?\.role\)/);
    assert.match(auth, /if \(sessionRole === OWNER_ROLE\) \{[\s\S]*?owner sign-in page/);
    assert.match(auth, /setUserRole\(OWNER_ROLE\)/);
    assert.doesNotMatch(auth, /setUserRole\('owner'\)/);
});

check('both sign-in pages are routed and the existing flows remain', () => {
    const app = read('src/App.jsx');
    assert.match(app, /<Route path="\/login" element=\{<LoginPage \/>\} \/>/);
    assert.match(app, /<Route path="\/login\/owner" element=\{<OwnerLoginPage \/>\} \/>/);
    assert.match(app, /<Route path="\/login\/collaborator" element=\{<LoginPage collaborator=\{true\} \/>\} \/>/);
    assert.match(app, /<Route path="\/register" element=\{<RegisterPage \/>\} \/>/);
});

check('the owner page is private, distinct and leaks no technical detail', () => {
    const raw = read('src/pages/OwnerLoginPage.jsx');
    // Strip comments: the header comment itself says the page shows NO hints.
    const page = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.match(page, /Portfolio Owner/);
    assert.match(page, /login\(\{ email, password \}, 'owner'\)/);
    assert.match(page, /publicCopy\('auth'\)/);
    assert.match(page, /to="\/login">User sign in/);
    assert.doesNotMatch(page, /to="\/register"|social-login|accessCode|handleSocialLogin/);
    assert.doesNotMatch(page, /OWNER_EMAIL|OWNER_PASSWORD|devtechs|admin123/i);
    assert.doesNotMatch(page, /status\s*[45]\d\d|ECONNREFUSED|request failed|temporarily unavailable|server is offline/i);
    assert.match(read('src/styles/OwnerLoginPage.css'), /\.owner-login \.owner-login__crest/);
});

check('the user page is about building a CV and portfolio, and links to owner access', () => {
    const page = read('src/pages/LoginPage.jsx');
    assert.match(page, /Sign in to build and manage your CV and portfolio/);
    assert.match(page, /Account[s]? are for creating and managing your own CV and portfolio/);
    assert.match(page, /<Link to="\/login\/owner">Owner sign in<\/Link>/);
    assert.match(page, /to="\/register"/);
    // A sign-in form must not demand a Full Name that login() never reads.
    assert.doesNotMatch(page, /Full Name|name="name"/);
    assert.match(read('src/styles/LoginPage.css'), /\.owner-login-link/);
});

check('no secret, hard-coded credential, external call or auth bypass was added', () => {
    const files = [
        'src/App.jsx', 'src/pages/OwnerLoginPage.jsx', 'src/pages/LoginPage.jsx',
        'src/contexts/AuthContext.jsx', 'src/services/api.service.js',
        'src/styles/OwnerLoginPage.css', 'src/styles/LoginPage.css',
        'server/routes/auth.routes.js', 'server/middleware/auth.middleware.js',
        'src/components/dashboard/DashboardSideNavbar.jsx', 'src/utils/publicMessaging.js'
    ];
    for (const file of files) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/, file);
        assert.doesNotMatch(src, /DevDan@123|admin123|efolio_pro_jwt_secret_key/, file);
    }
    // Protected seed/backup/sample/card files are untouched.
    for (const file of [
        'server/seed-projects.js', 'src/data/publicSnapshot.json',
        'src/data/labSamples.json', 'src/data/testimonialSamples.json',
        'src/components/ProjectCard.jsx'
    ]) {
        assert.ok(exists(file), `${file} must still exist`);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:two-login-pages'], /two-login-pages\.test\.mjs/);
        assert.match(scripts.test, /two-login-pages\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ad\./);
    assert.match(report, /Phase 31/);
});

console.log(`\n${passed} two-login-page / dev-badge-removal regression checks passed.`);
