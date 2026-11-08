/**
 * Phase 32 — owner/admin credentials move to the Render environment, and the
 * mobile drawer icon is fixed.
 *
 * Node-only static checks: no framework, browser, database, network, Render
 * API call or external service. Confidential — everything stays in this repo.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));

// Known leaked demo values are matched by shape, never repeated verbatim in
// this file (keeps the confidential secret scan clean).
const LEGACY_SECRET = /admin\d{3,}|DevDan@\d{3,}|efolio_pro_jwt_secret_key_\d{4}_secure/;

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* ------------------------------ Render environment ------------------------------ */

check('render.yaml declares owner/admin credential keys without values', () => {
    const yaml = read('render.yaml');
    for (const key of ['OWNER_EMAIL', 'OWNER_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
        const block = new RegExp(`- key: ${key}\\n\\s*sync: false`);
        assert.match(yaml, block, `${key} must be declared with sync:false`);
    }
    assert.doesNotMatch(yaml, /OWNER_PASSWORD:\s*\S|ADMIN_PASSWORD:\s*\S/);
    assert.match(yaml, /Set in the Render dashboard|Render dashboard, never committed/);
    assert.doesNotMatch(yaml, /AIza[0-9A-Za-z_\-]{20,}|ghp_[A-Za-z0-9]{20,}|mongodb\+srv:\/\/[^<\s]/);
});

check('the committed env template carries placeholders only', () => {
    const example = read('.env.render.example');
    for (const key of ['OWNER_EMAIL', 'OWNER_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
        assert.match(example, new RegExp(`^${key}=<[^>]+>$`, 'm'), `${key} must be a placeholder`);
    }
    assert.match(example, /SAFE TO COMMIT|Never commit|never put real values/i);
    assert.match(example, /OWNER_PASSWORD_HASH/);
    assert.doesNotMatch(example, LEGACY_SECRET);
    assert.doesNotMatch(example, /AIza[0-9A-Za-z_\-]{20,}|ghp_[A-Za-z0-9]{20,}/);
    // Real env files remain untracked/ignored.
    assert.match(read('.gitignore'), /^\.env\.\*$/m);
    assert.ok(!exists('.env.render'), 'no real Render env file may be committed');
});

check('a local confidential setup guide lists the exact Render variables', () => {
    const doc = read('RENDER_AUTH_ENV_SETUP.md');
    for (const key of ['OWNER_EMAIL', 'OWNER_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'OWNER_PASSWORD_HASH', 'JWT_SECRET']) {
        assert.ok(doc.includes(key), `missing variable in setup guide: ${key}`);
    }
    assert.match(doc, /\/login\/owner/);
    assert.match(doc, /Rotate|history/i);
    assert.doesNotMatch(doc, LEGACY_SECRET);
    assert.doesNotMatch(doc, /AIza[0-9A-Za-z_\-]{20,}|ghp_[A-Za-z0-9]{20,}/);
});

check('production owner email is fail-closed and no real address is compiled in', () => {
    const security = read('server/config/security.js');
    assert.match(security, /const fallback = isProduction\(\) \? '' : 'owner@example\.invalid'/);
    assert.doesNotMatch(security, /devtechs842|@gmail\.com/);
    assert.match(security, /issues\.push\('OWNER_EMAIL is missing'\)/);
    assert.match(security, /ADMIN_EMAIL \/ ADMIN_PASSWORD must be set together/);
    assert.match(security, /issues\.push\('OWNER_PASSWORD \/ OWNER_PASSWORD_HASH is missing'\)/);
});

check('both project seeds read admin credentials from the environment', () => {
    for (const file of ['server/seed-projects.js', 'scripts/seed-projects.js']) {
        const src = read(file);
        assert.match(src, /process\.env\.ADMIN_EMAIL/, file);
        assert.match(src, /role: \{ \$in: \['admin', 'owner'\] \}/, file);
        assert.doesNotMatch(src, /admin\d{3,}|admin@efolio\.com/, file);
        assert.doesNotMatch(src, /bcrypt\.hash\('[^']+'/, file);
    }
    assert.match(read('server/seed-projects.js'), /process\.env\.ADMIN_PASSWORD/);
    assert.match(read('server/seed-projects.js'), /ADMIN_EMAIL and ADMIN_PASSWORD in the Render environment/);
    // The root seed is ESM: a bare require() would throw at runtime.
    assert.match(read('scripts/seed-projects.js'), /^import /m);
    assert.doesNotMatch(read('scripts/seed-projects.js'), /require\('bcryptjs'\)/);
    assert.match(read('server/seed-projects.js'), /role: 'admin'/);
});

check('the two login flows still read the owner credentials from the environment', () => {
    const routes = read('server/routes/auth.routes.js');
    assert.match(routes, /router\.post\('\/login\/owner', ownerLoginLimiter/);
    assert.match(routes, /security\.getOwnerEmail\(\)/);
    assert.match(routes, /security\.verifyOwnerPassword\(password, bcrypt\)/);
    assert.match(read('server/middleware/auth.middleware.js'), /req\.user\?\.role !== 'owner'/);
    assert.match(read('src/services/api.service.js'), /this\.request\('\/auth\/login\/owner'/);
});

/* -------------------------------- mobile drawer -------------------------------- */

check('the header breakpoint uses the CSS media query, not a stale innerWidth state', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /const MOBILE_QUERY = '\(max-width: 1024px\)'/);
    assert.match(header, /window\.matchMedia\(MOBILE_QUERY\)\.matches/);
    assert.match(header, /mql\.addEventListener\('change', syncViewport\)/);
    assert.match(header, /window\.addEventListener\('resize', syncViewport\)/);
    assert.match(header, /useState\(getIsMobile\)/);
    assert.doesNotMatch(header, /useEffect\(\(\) => \{[\s\S]*?\}, \[isMobile, isMenuOpen\]\)/);
});

check('the drawer is no longer gated on a possibly-stale JS boolean', () => {
    const header = read('src/pages/Header.jsx');
    const drawerStart = header.indexOf('{/* Mobile Navigation Drawer */}');
    assert.ok(drawerStart > 0);
    assert.match(header.slice(drawerStart), /\{isMenuOpen && \(\s*<motion\.nav/);
    assert.match(header, /id="mobile-drawer"/);
    // Header.css already hides the drawer above the shared breakpoint.
    const css = read('src/styles/Header.css');
    assert.match(css, /\.mobile-nav \{\s*display: none;/);
    assert.match(css, /@media \(max-width: 1024px\) \{[\s\S]*?\.mobile-nav \{[\s\S]*?display: block/);
});

check('the toggle no longer relies on the conflicting Tailwind lg:hidden rule', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /id="mobile-drawer-toggle"/);
    assert.match(header, /className="menu-toggle-btn"/);
    assert.doesNotMatch(header, /className="lg:hidden menu-toggle-btn"|lg:hidden menu-toggle/);
    assert.match(header, /aria-controls="mobile-drawer"/);
    assert.match(header, /aria-expanded=\{isMenuOpen\}/);
    const headerCss = read('src/styles/Header.css');
    assert.match(headerCss, /pointer-events: auto/);
    assert.match(headerCss, /touch-action: manipulation/);
    const modern = read('src/styles/HeaderModern.css');
    assert.match(modern, /z-index: 1002/);
});

check('outside interactions cannot close the drawer on the opening tap', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /document\.addEventListener\('pointerdown', handleOutside\)/);
    assert.match(header, /event\.composedPath\(\)/);
    assert.match(header, /isInside\(event\.target\)/);
    assert.match(header, /document\.addEventListener\('keydown', handleKeyDown\)/);
    assert.match(header, /event\.key === 'Escape'/);
    assert.doesNotMatch(header, /document\.addEventListener\('click', handleClickOutside\)/);
    assert.match(header, /onClick=\{toggleMenu\}/);
});

check('the dashboard has one mobile backdrop and a reachable menu button', () => {
    const dashboard = read('src/pages/Dashboard.jsx');
    // z-30 also appears on an unrelated sticky tab bar; assert on the
    // duplicated full-screen backdrop specifically.
    assert.doesNotMatch(dashboard, /bg-black\/60 backdrop-blur-sm z-30|Mobile Menu Backdrop/);
    assert.match(dashboard, /the single mobile backdrop is rendered by/);
    const side = read('src/components/dashboard/DashboardSideNavbar.jsx');
    assert.match(side, /backdrop-blur-sm z-\[35\]/);
    assert.match(side, /id="dashboard-mobile-drawer"/);
    assert.equal((side.match(/bg-black\/60 backdrop-blur-sm z-\[/g) || []).length, 1);
    const top = read('src/components/dashboard/DashboardTopNavbar.jsx');
    assert.match(top, /aria-controls="dashboard-mobile-drawer"/);
    assert.match(top, /relative z-\[36\]/);
});

check('no secret, hard-coded credential or external write was introduced', () => {
    const files = [
        'render.yaml', '.env.render.example', 'RENDER_AUTH_ENV_SETUP.md',
        'server/config/security.js', 'server/seed-projects.js', 'scripts/seed-projects.js',
        'src/pages/Header.jsx', 'src/styles/Header.css', 'src/styles/HeaderModern.css',
        'src/pages/Dashboard.jsx', 'src/components/dashboard/DashboardSideNavbar.jsx',
        'src/components/dashboard/DashboardTopNavbar.jsx'
    ];
    for (const file of files) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|mongodb\+srv:\/\/[^<\s]/, file);
        assert.doesNotMatch(src, LEGACY_SECRET, file);
    }
    for (const file of [
        'src/data/publicSnapshot.json', 'src/data/labSamples.json',
        'src/data/testimonialSamples.json', 'src/components/ProjectCard.jsx',
        'src/styles/CVComponent.css', 'public/CV2.pdf'
    ]) assert.ok(exists(file), `${file} must still exist`);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:render-env-drawer'], /render-env-drawer\.test\.mjs/);
        assert.match(scripts.test, /render-env-drawer\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ae\./);
    assert.match(report, /Phase 32/);
});

console.log(`\n${passed} Render-env credential / mobile drawer regression checks passed.`);
