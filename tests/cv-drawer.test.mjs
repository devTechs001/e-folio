/**
 * Phase 28 — the owner's current contract role on the CV (look/style
 * preserved) and the mobile menu button that failed to open the drawer.
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

const experienceBlock = () => {
    const src = read('src/components/CVComponent.jsx');
    const start = src.indexOf('  experience: [');
    const end = src.indexOf('  education: [', start);
    assert.ok(start > 0 && end > start, 'DEFAULT_CV.experience block not found');
    return src.slice(start, end);
};

check('the CV lists the owner\'s current Genco Livestock contract role first', () => {
    const block = experienceBlock();
    assert.match(block, /title: "IT Assistant Manager \(Contract\)"/);
    assert.match(block, /company: "Genco Livestock"/);
    assert.match(block, /period: "Present"/);
    assert.ok(block.indexOf('IT Assistant Manager') < block.indexOf('Full Stack Developer'),
        'the current role should lead the Experience section');
    assert.equal((block.match(/title: "/g) || []).length, 3);
});

check('the new role uses only owner-supplied facts', () => {
    const block = experienceBlock();
    assert.match(block, /description: "Data entry and analysis, database management, security, data integrity, technical support, and other IT-related duties\."/);
    const lower = block.toLowerCase();
    for (const phrase of [
        'data entry', 'analysis', 'database management', 'security',
        'data integrity', 'technical support', 'other it-related'
    ]) assert.ok(lower.includes(phrase), `missing responsibility: ${phrase}`);
    assert.match(block, /location: ""/);
    assert.match(block, /technologies: \[\]/);
    // No invented start year, metric, achievement or technology for this role.
    const newRole = block.slice(block.indexOf('title: "IT Assistant Manager'), block.indexOf('title: "Full Stack Developer"'));
    assert.doesNotMatch(newRole, /20\d\d|%|increased|improved|React|MongoDB|Python/);
});

check('the CV look, style and rendering are unchanged', () => {
    const src = read('src/components/CVComponent.jsx');
    assert.equal((src.match(/import '\.\.\/styles\//g) || []).length, 1);
    assert.match(src, /import '\.\.\/styles\/CVComponent\.css'/);
    for (const cls of ['exp-item', 'exp-header', 'exp-desc', 'exp-tech', 'tech-pill', 'section-title']) {
        assert.ok(src.includes(`className="${cls}"`), `missing existing CV class: ${cls}`);
    }
    assert.match(src, /experience\.map\(\(e, i\)/);
    assert.doesNotMatch(src, /fetch\(|http:\/\/localhost/);
    // The normalisation template still supplies the same fields.
    assert.match(src, /\.\.\.fallback\.experience\[0\]/);
    assert.match(src, /technologies: asArray\(e\.technologies\)/);
});

check('the two existing CV roles are preserved verbatim', () => {
    const block = experienceBlock();
    for (const token of [
        'title: "Full Stack Developer"', 'company: "Tech Innovations Ltd"',
        'period: "2022 - Present"', 'title: "Frontend Developer"',
        'company: "Digital Solutions Co"', 'period: "2020 - 2022"'
    ]) assert.ok(block.includes(token), `missing preserved CV data: ${token}`);
});

check('the drawer breakpoint now matches the CSS that shows the button', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /window\.innerWidth <= 1024/);
    assert.doesNotMatch(header, /window\.innerWidth <= 768/);
    const headerCss = read('src/styles/Header.css');
    assert.match(headerCss, /@media \(max-width: 1024px\) \{\s*\.menu-toggle-btn/);
    assert.match(headerCss, /@media \(max-width: 1024px\) \{\s*\.mobile-nav/);
    // Gating, toggle, overlay and close behaviour remain.
    assert.match(header, /isMenuOpen && isMobile/);
    assert.match(header, /className="lg:hidden menu-toggle-btn"/);
    assert.match(header, /onClick=\{toggleMenu\}/);
    assert.match(header, /onClick=\{closeMenu\}/);
    assert.match(header, /className="menu-overlay"/);
});

check('the modern menu-button restyle is mobile-only', () => {
    const css = read('src/styles/HeaderModern.css');
    const media = css.match(/@media \(max-width: 1024px\) \{([\s\S]*?)\n\}/);
    assert.ok(media, 'mobile media block not found');
    assert.match(media[1], /\.menu-toggle-btn \{[\s\S]*?display: inline-flex/);
    const outside = css.replace(media[0], '');
    assert.doesNotMatch(outside, /\.menu-toggle-btn \{/);
    assert.match(css, /\.menu-toggle-btn svg \{ width: 24px; height: 24px; \}/);
    assert.match(css, /focus-visible/);
    assert.match(css, /prefers-reduced-motion/);
});

check('click-outside is safe for SVG icon targets and real icons remain', () => {
    const header = read('src/pages/Header.jsx');
    assert.match(header, /event\.target instanceof Element/);
    assert.match(header, /target\?\.closest\('\.menu-toggle-btn'\)/);
    assert.match(header, /from 'lucide-react'/);
    assert.match(header, /const NAV_SECTIONS/);
    const code = header.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.doesNotMatch(code, /fas fa-/);
    assert.match(header, /HeaderModern\.css/);
});

check('no secret or external write was introduced', () => {
    const text = read('src/components/CVComponent.jsx') + read('src/pages/Header.jsx')
        + read('src/styles/HeaderModern.css') + read('tests/cv-drawer.test.mjs');
    assert.doesNotMatch(text, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(text, /http:\/\/localhost/);
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:cv-drawer'], /cv-drawer\.test\.mjs/);
        assert.match(scripts.test, /cv-drawer\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ab\./);
    assert.match(report, /Phase 28/);
});

console.log(`\n${passed} CV work-history / mobile drawer regression checks passed.`);
