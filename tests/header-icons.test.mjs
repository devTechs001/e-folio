/**
 * Phase 27 — real SVG icons in the header, a modern desktop header restyle,
 * and small scrollable technology cards.
 *
 * Node-only static checks: no framework, browser, database or network.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const ICONS = [
    'Code2', 'User', 'Settings2', 'GraduationCap', 'Heart', 'FolderGit2',
    'MessageSquare', 'Mail', 'LayoutDashboard', 'Handshake', 'Sparkles',
    'Sun', 'Moon', 'Maximize2', 'Minimize2', 'ArrowRight', 'Menu', 'X'
];

check('the header uses real lucide-react SVG icon components', () => {
    const src = read('src/pages/Header.jsx');
    assert.match(src, /from 'lucide-react'/);
    for (const icon of ICONS) assert.ok(src.includes(icon), `missing real icon: ${icon}`);
    assert.match(src, /const NavIcon = /);
    assert.match(src, /<NavIcon icon=\{section\.Icon\}/);
    assert.match(src, /<Code2 className="logo-icon"/);
    assert.match(src, /<LayoutDashboard size=\{18\}/);
    assert.match(src, /<Handshake size=\{17\}/);
    assert.match(src, /<Sparkles className="sparkle-icon"/);
    assert.match(src, /<Menu size=\{24\}/);
    assert.match(src, /<X size=\{24\}/);
});

check('no font-glyph icons remain in the header', () => {
    const src = read('src/pages/Header.jsx');
    // Strip comments so the explanatory note about the old classes is not
    // mistaken for a live icon reference.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.doesNotMatch(code, /fas fa-|fa-brands fa-|fa-solid fa-/);
    assert.doesNotMatch(code, /className=\{section\.icon\}/);
    assert.doesNotMatch(code, /hamburger/);
    assert.doesNotMatch(code, /fa-sparkles|fa-grip-horizontal/);
    // The old NAV_SECTIONS string icons are gone; every entry has a component.
    const nav = src.slice(src.indexOf('const NAV_SECTIONS'), src.indexOf('const getIsMobile'));
    assert.equal((nav.match(/Icon: [A-Z][A-Za-z0-9]*/g) || []).length, 7);
    for (const id of ['about', 'skills', 'education', 'interests', 'projects', 'testimonials', 'contact']) {
        assert.ok(nav.includes(`id: '${id}'`), `missing nav section ${id}`);
    }
});

check('the modern desktop header stylesheet is loaded and scoped', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /import '\.\.\/styles\/HeaderModern\.css'/);
    const css = read('src/styles/HeaderModern.css');
    for (const token of [
        '.header-scrolled', '.logo-icon', '.nav-link-desktop svg', '.dashboard-btn svg',
        '.collaborate-btn svg', '.theme-toggle-btn svg', '.fullscreen-toggle-btn svg',
        '.menu-toggle-btn svg', '.mobile-link-icon svg', '.mobile-link-active-dot',
        'focus-visible', 'prefers-reduced-motion'
    ]) assert.ok(css.includes(token), `missing header style: ${token}`);
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
});

check('technology cards are small and still scrollable', () => {
    const css = read('src/styles/SkillsModern.css');
    assert.match(css, /\.sk-card \{[\s\S]*?height: clamp\(220px, 30vh, 300px\)/);
    assert.match(css, /\.sk-cardview \{[\s\S]*?max-height: clamp\(360px, 56vh, 560px\)/);
    assert.match(css, /\.sk-items \{[\s\S]*?overflow-y: auto/);
    assert.match(css, /\.sk-items::-webkit-scrollbar-thumb/);
    assert.match(css, /\.sk-card \{ height: 240px; \}/);
    // Font sizes stay readable (phase 26).
    assert.match(css, /\.sk-item-label \{[\s\S]*?font-size: 1\.05rem/);
});

check('all header behaviour and routes are preserved', () => {
    const src = read('src/pages/Header.jsx');
    for (const token of [
        'NAV_SECTIONS', 'handleSectionClick', 'closeMenu', 'toggleTheme', 'toggleFullscreen',
        'toggleMenu', 'activeSection', 'isScrolled', 'isDashboardRoute', 'isCollaborateRoute',
        'to="/dashboard"', 'to="/collaborate"', 'menu-overlay', 'mobile-nav',
        'mobile-nav-header', 'drawer-toggles', 'mobile-nav-footer', 'aria-expanded={isMenuOpen}'
    ]) assert.ok(src.includes(token), `missing preserved header behaviour: ${token}`);
});

check('no secret, external call or runtime write was introduced', () => {
    const src = read('src/pages/Header.jsx') + read('src/styles/HeaderModern.css')
        + read('src/styles/SkillsModern.css');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:header-icons'], /header-icons\.test\.mjs/);
        assert.match(scripts.test, /header-icons\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3aa\./);
    assert.match(report, /Phase 27/);
});

console.log(`\n${passed} header icon / compact card regression checks passed.`);
