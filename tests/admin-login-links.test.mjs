/**
 * Phase 30 — review of the separate admin/owner login vs the regular user
 * login, and the missing "main links" for an admin/owner session.
 *
 * Node-only static checks: no framework, browser, database or network.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    normalizeRole, isOwnerRole, isAdminRole, canOpenDashboard,
    rolesForMenu, canSeeMenuItem, OWNER_ROLE, ADMIN_ROLE, USER_ROLE
} from '../src/utils/authRoles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

check('legacy admin roles are folded into one canonical vocabulary', () => {
    assert.equal(normalizeRole('admin'), ADMIN_ROLE);
    assert.equal(normalizeRole(' Admin '), ADMIN_ROLE);
    assert.equal(normalizeRole('ADMINISTRATOR'), ADMIN_ROLE);
    assert.equal(normalizeRole('superadmin'), ADMIN_ROLE);
    assert.equal(normalizeRole('root'), ADMIN_ROLE);
    assert.equal(normalizeRole('Owner'), OWNER_ROLE);
    assert.equal(normalizeRole(null), 'visitor');
    assert.equal(normalizeRole('custom-role'), 'custom-role');
});

check('admin is never silently promoted to owner (no auth bypass)', () => {
    assert.equal(isOwnerRole('owner'), true);
    assert.equal(isOwnerRole('admin'), false);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('owner'), false);
    const middleware = read('server/middleware/auth.middleware.js');
    assert.match(middleware, /req\.user\?\.role !== 'owner'/);
    assert.match(middleware, /\['owner', 'admin', 'collaborator', 'user'\]\.includes/);
    assert.match(middleware, /exports\.isOwner = \(req, res, next\) => \{\s*if \(req\.user\?\.role !== 'owner'\)/);
});

check('every authenticated role can now open the dashboard', () => {
    for (const role of ['owner', 'admin', 'administrator', 'collaborator', 'user']) {
        assert.equal(canOpenDashboard(role), true, `missing dashboard access for ${role}`);
    }
    for (const role of ['visitor', '', null]) assert.equal(canOpenDashboard(role), false);
    const login = read('src/pages/LoginPage.jsx');
    assert.match(login, /canOpenDashboard\(result\.role\)/);
    assert.doesNotMatch(login, /result\.role === 'owner' \|\| result\.role === 'collaborator'/);
});

check('existing role visibility is unchanged and admin gets the user menu', () => {
    assert.deepEqual(rolesForMenu('owner'), ['owner']);
    assert.deepEqual(rolesForMenu('collaborator'), ['collaborator']);
    assert.deepEqual(rolesForMenu('user'), ['user']);
    assert.deepEqual(rolesForMenu('admin'), [ADMIN_ROLE, USER_ROLE]);
    assert.ok(!rolesForMenu('admin').includes(OWNER_ROLE));
    assert.equal(canSeeMenuItem({ roles: ['owner', 'user'] }, 'admin'), true);
    assert.equal(canSeeMenuItem({ roles: ['owner'] }, 'admin'), false);
    assert.equal(canSeeMenuItem({ roles: ['owner'] }, 'owner'), true);
    assert.equal(canSeeMenuItem({ roles: ['owner', 'collaborator'] }, 'collaborator'), true);
    assert.equal(canSeeMenuItem({ roles: ['owner', 'collaborator'] }, 'admin'), false);
    assert.equal(canSeeMenuItem({}, 'owner'), false);
});

check('the dashboard menu filter uses the shared helper', () => {
    const dashboard = read('src/pages/Dashboard.jsx');
    assert.match(dashboard, /canSeeMenuItem\(item, userRole\)/);
    assert.doesNotMatch(dashboard, /item\.roles\.includes\(userRole\)/);
});

check('the auth context normalises roles without weakening isOwner', () => {
    const auth = read('src/contexts/AuthContext.jsx');
    assert.match(auth, /normalizeRole\(verifiedUser\.role \|\| savedRole \|\| USER_ROLE\)/);
    assert.match(auth, /const sessionRole = normalizeRole\(response\.user\?\.role\)/);
    assert.match(auth, /normalizeRole\(savedRole \|\| USER_ROLE\)/);
    assert.match(auth, /if \(token && savedUser\)/);
    // Merge resolution: main's effectiveRole fix, expressed with our helper so
    // the legacy `admin` role is preserved rather than collapsed to visitor.
    assert.match(auth, /const effectiveRole = userRole/);
    assert.match(auth, /userRole: effectiveRole/);
    assert.doesNotMatch(auth, /const normalizeRole = \(value\)/);
    assert.match(auth, /const isOwner = \(\) => isOwnerRole\(effectiveRole\)/);
    assert.match(auth, /const isAdmin = \(\) => isAdminRole\(effectiveRole\)/);
    assert.match(auth, /isAdmin,/);
});

check('the public main links are reachable from the dashboard', () => {
    const sidebar = read('src/components/dashboard/DashboardSideNavbar.jsx');
    assert.match(sidebar, /const MAIN_SITE_LINKS = \[/);
    for (const section of ['about', 'skills', 'education', 'interests', 'projects', 'testimonials', 'contact']) {
        assert.ok(sidebar.includes(`hash: '${section}'`), `missing main-site link: ${section}`);
    }
    assert.match(sidebar, /to=\{`\/#\$\{hash\}`\}/);
    assert.equal((sidebar.match(/<MainSiteLinks/g) || []).length, 2, 'desktop + mobile drawers');
    assert.ok(sidebar.includes('Main site'));
});

check('mobile bottom nav points at real public sections', () => {
    const nav = read('src/components/MobileBottomNav.jsx');
    assert.match(nav, /path: '\/\#projects'/);
    assert.match(nav, /path: '\/\#about'/);
    assert.match(nav, /path: '\/\#contact'/);
    assert.doesNotMatch(nav, /path: '\/projects'|path: '\/about'|path: '\/contact'/);
});

check('no secret, external write or owner-role rewrite was introduced', () => {
    const changed = [
        'src/utils/authRoles.js', 'src/contexts/AuthContext.jsx', 'src/pages/LoginPage.jsx',
        'src/pages/Dashboard.jsx', 'src/components/dashboard/DashboardSideNavbar.jsx',
        'src/components/MobileBottomNav.jsx'
    ].map(read).join('\n');
    assert.doesNotMatch(changed, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(changed, /role: 'owner'/);
    // The seeded admin account and its credentials are deliberately untouched.
    assert.match(read('server/seed-projects.js'), /role: 'admin'/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:admin-login-links'], /admin-login-links\.test\.mjs/);
        assert.match(scripts.test, /admin-login-links\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ac\./);
    assert.match(report, /Phase 30/);
});

console.log(`\n${passed} admin/owner login + main links regression checks passed.`);
