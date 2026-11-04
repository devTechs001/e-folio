/**
 * Regression checks: owner-supplied project links, public Lab copy cleanup,
 * removal of zero-valued public data, and the complete front-end catalogue.
 * Node-only static checks — no DB, no network, no browser. Confidential.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const OWNER_URLS = [
    'https://net-gate.netlify.app/',
    ['https://', 'bizsolutionz', '.netlify.app/'].join(''),
    'https://home-scape-platform.netlify.app/',
    'https://fintech-banking.netlify.app/',
    'https://ai-image-editor-pro.netlify.app/',
    'https://kazi-find.netlify.app/',
    'https://cinemaflx.netlify.app/',
    'https://schedule-manager-ap.netlify.app/',
    'https://gbchat.netlify.app/',
    'https://virtualtourist.netlify.app/',
    'https://mediaplaier.netlify.app/',
    'https://elimu-pro-beta.netlify.app/'
];
const PROTECTED_NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const catalog = () => json('src/data/projectLinks.json');

/* --------------------------- owner-supplied links -------------------------- */

check('all twelve owner-supplied project URLs are published exactly once', () => {
    const links = catalog().projects;
    assert.equal(links.length, 12);
    for (const url of OWNER_URLS) {
        assert.equal(links.filter(p => p.url === url).length, 1, `${url} must appear once`);
        const parsed = new URL(url);
        assert.equal(parsed.protocol, 'https:');
        assert.equal(parsed.username, '');
        assert.equal(parsed.password, '');
    }
    assert.equal(new Set(links.map(p => p.slug)).size, 12);
});

check('every link carries a real title and no invented values', () => {
    const raw = read('src/data/projectLinks.json');
    for (const link of catalog().projects) {
        assert.ok(link.title && link.title.length > 3, `${link.url} needs a real title`);
    }
    for (const key of ['likes', 'views', 'achievements', 'metrics', 'uptime', 'users', 'orders', 'conversion', 'technologies']) {
        assert.doesNotMatch(raw, new RegExp(`"${key}"`), `catalog must not invent ${key}`);
    }
    assert.doesNotMatch(raw, /:\s*0\b/, 'catalog must not contain zero values');
    assert.match(catalog().source, /verified read-only on 2026-11-04/);
});

check('the shared loader keeps only safe HTTPS links and adds safe anchors', () => {
    const util = read('src/utils/projectLinks.js');
    assert.match(util, /isSafeProjectLink/);
    assert.match(util, /projectLinkHost/);
    assert.match(util, /PROJECT_LINKS/);
    assert.match(util, /rel: 'noopener noreferrer'/);
    assert.match(util, /referrerPolicy: 'no-referrer'/);
    assert.doesNotMatch(util, /fetch\(|http:\/\/localhost/);
});

check('the Projects page renders the twelve links in a horizontal scroller', () => {
    const page = read('src/pages/Projects.jsx');
    for (const token of [
        'PROJECT_LINKS', 'projectLinkHost', 'projectLinkAnchorProps',
        'project-links-section', 'project-links-strip', 'project-link-card',
        'scrollProjectLinks', 'projectLinksRef'
    ]) {
        assert.ok(page.includes(token), `missing ${token}`);
    }
    assert.match(page, /PROJECT_LINKS\.map\(link =>/);
    assert.match(page, /aria-label="Scroll project links left"/);
    assert.match(page, /aria-label="Scroll project links right"/);
    const css = read('src/styles/Projects.css');
    assert.match(css, /\.project-links-strip\s*\{[^}]*overflow-x:\s*auto/s);
    assert.doesNotMatch(css.slice(css.indexOf('Phase 17')), /^\s*\.project-card[\s{:,.]/m);
});

/* ---------------------------- front-end catalogue -------------------------- */

check('a partial live project list is completed from the local saved copy', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /getSnapshotSection\('projects'\)/);
    assert.match(page, /const additions = savedItems\.filter\(/);
    assert.match(page, /const items = \[\.\.\.liveItems, \.\.\.additions\]/);
    assert.match(page, /setContentSource\(additions\.length \? 'snapshot' : \(response\.source \|\| ''\)\)/);
    assert.match(page, /if \(isLiveContent\(response\) && additions\.length === 0\)/);
});

check('the eight saved project records and the two featured cards are unchanged', () => {
    const snapshot = json('src/data/publicSnapshot.json');
    assert.equal(snapshot.sections.projects.projects.length, 8);
    assert.equal(json('src/data/projectShowcase.json').projects.length, 2);
    const seed = read('scripts/seed-projects.js');
    assert.equal((seed.match(/title: "/g) || []).length, 8);
});

/* --------------------------------- Lab copy -------------------------------- */

check('the public Lab page no longer describes where skills and projects are stored', () => {
    const lab = read('src/pages/Lab.jsx');
    for (const phrase of [
        /managed in the dashboard/,
        /stored in the Hobbies manager/,
        /pulled from the same records/,
        /Live experiments, the toolkit/
    ]) {
        assert.doesNotMatch(lab, phrase);
    }
    assert.match(lab, /Experiments, the toolkit behind them, and what I tinker with off the bench/);
    assert.match(lab, /A grouped view of the tools used across the experiments/);
    assert.match(lab, /Things I explore away from the bench/);
    assert.match(lab, /\{owner && connected && \(/);
    assert.match(lab, /\{owner && sampleCount > 0 && \(/);
    assert.match(lab, /\{owner && liveUpdate && \(/);
});

check('the Lab page never prints a zero value', () => {
    const lab = read('src/pages/Lab.jsx');
    assert.match(lab, /filter\(card => card\.value > 0\)/);
    assert.match(lab, /metricCards\.length > 0/);
    assert.match(lab, /f\.key === 'all' \|\| f\.count > 0/);
    assert.match(lab, /\{f\.count > 0 && <span className="lab-filter-count">/);
    assert.match(lab, /\{Number\(skill\.level\) > 0 && \(/);
    assert.doesNotMatch(lab, /<small>\{Number\(skill\.level\) \|\| 0\}<\/small>/);
});

/* ------------------------------ no zero values ----------------------------- */

check('the Projects page, card and modal hide zero-valued counters', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /summaryCards/);
    assert.match(page, /filter\(card => card\.count > 0\)/);
    assert.match(page, /summaryCards\.length > 0/);
    for (const file of ['src/pages/ProjectCard.jsx', 'src/pages/ProjectModal.jsx']) {
        const src = read(file);
        // The old unconditional zero prints are gone; values only render
        // inside a > 0 guard.
        assert.doesNotMatch(src, /\{project\.views \|\| 0\}|\{likes \|\| 0\}|Like \(\{likesCount\}\)/);
        assert.match(src, /Number\(.*\) > 0 &&/);
    }
    assert.match(read('src/pages/ProjectCard.jsx'), /Number\(project\.views\) > 0/);
    assert.match(read('src/pages/ProjectModal.jsx'), /Number\(viewsCount\) > 0/);
    assert.match(read('src/pages/ProjectModal.jsx'), /Number\(likesCount\) > 0/);
});

/* --------------------------------- safety ---------------------------------- */

check('the protected NetGate link and every protected file are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        PROTECTED_NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, PROTECTED_NETGATE);
    assert.equal(read('src/data/publicSnapshot.json').split(PROTECTED_NETGATE).length - 1, 3);
    assert.equal(read('server/backups/testimonials/testimonial-samples.backup.json').split(PROTECTED_NETGATE).length - 1, 1);
    assert.equal(json('src/data/projectShowcase.json').projects[0].url, 'https://liqourstor.netlify.app/client');
    assert.equal(json('src/data/projectShowcase.json').projects[1].url, 'https://homescape-pro.netlify.app/');
    const ecommerce = json('src/data/publicSnapshot.json').sections.projects.projects.find(p => p.title === 'E-Commerce Platform');
    assert.equal(ecommerce.links.live, 'https://ominbiz-solution.netlify.app/');
});

check('no secret, external call or technical wording was introduced', () => {
    for (const file of [
        'src/data/projectLinks.json', 'src/utils/projectLinks.js',
        'src/pages/Projects.jsx', 'src/pages/Lab.jsx',
        'src/pages/ProjectCard.jsx', 'src/pages/ProjectModal.jsx'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
        assert.doesNotMatch(src, /temporarily unavailable|ECONNREFUSED|backend is running|status\s*[45]\d\d/i);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:project-links'], /project-links\.test\.mjs/);
        assert.match(pkg.scripts.test, /project-links\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3q\./);
    assert.match(report, /Phases 3–/);
    assert.match(report, /Kazi Find/);
});

console.log(`\n${passed} project-links / Lab / zero-value regression checks passed.`);
