/**
 * Phase 26 — readable technology typography, a scrollable card viewpoint,
 * a restyled first page with three primary actions, and a modern drawer.
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

/* ------------------------------------------------- technology typography --- */

check('technology labels are no longer tiny', () => {
    const skills = read('src/styles/SkillsModern.css');
    assert.match(skills, /\.sk-item-label \{[\s\S]*?font-size: 1\.05rem/);
    assert.match(skills, /\.sk-chip \{[\s\S]*?font-size: 0\.92rem/);
    assert.match(skills, /\.sk-score \{[^}]*font-size: 0\.85rem/);
    assert.match(skills, /\.sk-card-heading h4 \{[\s\S]*?font-size: 1\.15rem/);
    const projects = read('src/styles/Projects.css');
    const tech = projects.slice(projects.indexOf('.tech-chip {'), projects.indexOf('.tech-chip:hover'));
    assert.match(tech, /font-size: 0\.95rem/);
    const countBlock = projects.slice(projects.indexOf('.tech-chip__count {'), projects.indexOf('.tech-chip__count {') + 320);
    assert.match(countBlock, /font-size: 0\.8rem/);
    const experience = read('src/styles/ProjectsExperience.css');
    assert.match(experience, /\.px-chip \{[\s\S]*?font-size: 0\.9rem/);
    assert.match(experience, /\.px-chip span \{[^}]*font-size: 0\.78rem/);
});

/* ------------------------------------------------------------- scrollers --- */

check('the card area keeps a consistent viewpoint with real scrollers', () => {
    const css = read('src/styles/SkillsModern.css');
    assert.match(css, /\.sk-cardview \{[\s\S]*?max-height: clamp\(360px, 56vh, 560px\)[\s\S]*?overflow-y: auto/);
    assert.match(css, /\.sk-cardview::-webkit-scrollbar-thumb/);
    assert.match(css, /\.sk-items \{[\s\S]*?overflow-y: auto/);
    assert.match(css, /\.sk-items::-webkit-scrollbar-thumb/);
    // Phase 27: small, scrollable technology cards.
    assert.match(css, /\.sk-card \{[\s\S]*?height: clamp\(220px, 30vh, 300px\)/);
    assert.match(css, /\.sk-card \{ height: 240px; \}/);
    assert.match(css, /\.sk-chipbar \{ flex-wrap: nowrap; overflow-x: auto/);
    assert.match(css, /\.sk-scroll-hint/);
});

check('the Skills page exposes the scroll region accessibly', () => {
    const src = read('src/pages/Skills.jsx');
    assert.match(src, /className="sk-scroll-hint"/);
    assert.match(src, /className="sk-cardview"/);
    assert.match(src, /role="region"/);
    assert.match(src, /aria-label="CV skill groups"/);
    assert.match(src, /tabIndex=\{0\}/);
    assert.ok(src.indexOf('className="sk-cardview"') < src.indexOf('className="sk-grid"'));
    // Phase 25 behaviour survives.
    assert.match(src, /CV_SKILL_SECTIONS/);
    assert.match(src, /scoresFor/);
    assert.match(src, /technical-skills-container/);
});

/* --------------------------------------------------------- first page CTA --- */

check('the first page has exactly three restyled primary actions, in order', () => {
    const src = read('src/pages/LandingPage.jsx');
    assert.match(src, /className="collaboration-hero lp-hero"/);
    assert.match(src, /className="lp-actions"/);
    const labels = [...src.matchAll(/className="lp-action__title">([^<]+)</g)].map(m => m[1]);
    assert.deepEqual(labels, ['Create Your Portfolio', 'Collaborate with Me', 'Build Your CV']);
    assert.match(src, /<Link to="\/register" className="lp-action lp-action--primary">/);
    assert.match(src, /<Link to="\/collaborate" className="lp-action lp-action--accent">/);
    assert.match(src, /<Link to="\/cv" className="lp-action lp-action--ghost">/);
    assert.equal((src.match(/className="lp-action lp-action--/g) || []).length, 3);
    assert.doesNotMatch(src, /hero-cta-btn/);
    assert.match(src, /className="lp-trust/);
});

check('the hero restyle is modern, scoped and motion-safe', () => {
    const css = read('src/styles/LandingPage.css');
    for (const token of [
        '.lp-hero .lp-actions', 'grid-template-columns: repeat(3, minmax(0, 1fr))',
        '.lp-hero .lp-action--primary', '.lp-hero .lp-action--accent',
        '.lp-hero .lp-action--ghost', '.lp-hero .lp-action__title',
        '.lp-hero .feature-card h3', '.lp-hero .lp-trust',
        'prefers-reduced-motion', 'focus-visible'
    ]) assert.ok(css.includes(token), `missing hero style: ${token}`);
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
});

check('no new claims or metrics were added to the first page', () => {
    const src = read('src/pages/LandingPage.jsx');
    assert.equal((src.match(/\d+\+ (?:Projects|Happy Clients|Years Experience)/g) || []).length, 3);
    assert.match(src, /24\/7 Support/);
    assert.match(src, /setShowBanner/);
    assert.match(src, /scrollProgress/);
});

/* --------------------------------------------------------------- drawer --- */

check('the drawer is restyled without losing any control', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /import '\.\.\/styles\/HeaderDrawer\.css'/);
    assert.match(header, /className="mobile-nav-header"/);
    assert.match(header, /className="mobile-nav-brand"/);
    assert.match(header, /className="drawer-toggles"/);
    assert.match(header, /aria-label="Close menu"/);
    assert.match(header, /onClick=\{closeMenu\}/);
    for (const token of ['mobile-theme-toggle', 'mobile-fullscreen-toggle', 'mobile-nav-links',
        'mobile-dashboard-btn', 'mobile-collaborate-btn', 'mobile-nav-footer', 'NAV_SECTIONS']) {
        assert.ok(header.includes(token), `missing preserved drawer control: ${token}`);
    }
});

check('drawer styles are modern, accessible and scoped', () => {
    const css = read('src/styles/HeaderDrawer.css');
    for (const token of ['.mobile-nav-header', '.mobile-nav-brand__mark', '.mobile-nav-close',
        '.drawer-toggles', '.mobile-nav-link', '.mobile-special-links',
        '::-webkit-scrollbar-thumb', 'focus-visible', 'prefers-reduced-motion']) {
        assert.ok(css.includes(token), `missing drawer style: ${token}`);
    }
    assert.match(css, /@media \(max-width: 1024px\)/);
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
});

/* ------------------------------------------------------ safety / wiring --- */

check('new UI files contain no secret, external call or runtime write', () => {
    const src = read('src/styles/SkillsModern.css') + read('src/styles/LandingPage.css')
        + read('src/styles/HeaderDrawer.css') + read('src/pages/Header.jsx')
        + read('src/pages/LandingPage.jsx') + read('src/pages/Skills.jsx');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:ui-polish'], /ui-polish\.test\.mjs/);
        assert.match(scripts.test, /ui-polish\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3z\./);
    assert.match(report, /Phase 26/);
});

console.log(`\n${passed} UI polish regression checks passed.`);
