/**
 * Regression checks: the owner-supplied working URLs now REPLACE the dead
 * project links (no separate directory), while every already-working link and
 * the protected NetGate link stay untouched.
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
const DEAD_LINKS = [
    'https://devtechs001.github.io/portfolio',
    'https://devtechs001.github.io/task-manager',
    'https://devtechs001.github.io/ai-image-generator',
    'https://devtechs001.github.io/analytics-dashboard',
    'https://wallet.devtechs001.com'
];
const WORKING = [
    'https://home-scape-platform.netlify.app/',
    'https://schedule-manager-ap.netlify.app/',
    'https://ai-image-editor-pro.netlify.app/',
    'https://net-gate.netlify.app/',
    'https://fintech-banking.netlify.app/'
];
const KEPT = [
    'https://ominbiz-solution.netlify.app/',
    'https://gbchat.netlify.app/',
    'https://cinemaflx.netlify.app/'
];
const PROTECTED_NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seed = () => read('scripts/seed-projects.js');
const projects = () => json('src/data/publicSnapshot.json').sections.projects.projects;

/* ------------------------- the owner's link inventory ---------------------- */

check('the owner-supplied URL inventory is kept as a documented local record', () => {
    const links = json('src/data/projectLinks.json').projects;
    assert.equal(links.length, 12);
    for (const url of OWNER_URLS) {
        assert.equal(links.filter(p => p.url === url).length, 1, `${url} must be listed once`);
        const parsed = new URL(url);
        assert.equal(parsed.protocol, 'https:');
        assert.equal(parsed.username, '');
        assert.equal(parsed.password, '');
    }
});

/* ---------------------------- the link replacement ------------------------- */

check('the five dead project links are gone from the seed and the snapshot', () => {
    for (const dead of DEAD_LINKS) {
        assert.ok(!seed().includes(dead), `${dead} must be retired`);
        assert.ok(!JSON.stringify(projects()).includes(dead), `${dead} must not be published`);
    }
    assert.match(seed(), /Phase 18: the five legacy GitHub Pages \/ wallet links/);
});

check('five working owner URLs now drive the five restored project cards', () => {
    const titles = [
        'Portfolio Website', 'Task Management App', 'AI Image Generator',
        'Social Media Dashboard', 'Blockchain Wallet'
    ];
    for (let i = 0; i < titles.length; i += 1) {
        const project = projects().find(p => p.title === titles[i]);
        assert.ok(project, `${titles[i]} must exist`);
        assert.equal(project.links.live, WORKING[i]);
        assert.ok(OWNER_URLS.includes(WORKING[i]));
    }
    for (const url of WORKING) assert.ok(seed().includes(url), `${url} must be in the seed`);
});

check('the three already-working project links are unchanged', () => {
    for (const url of KEPT) {
        assert.ok(seed().includes(url), `${url} must remain in the seed`);
    }
    const byTitle = Object.fromEntries(projects().map(p => [p.title, p]));
    assert.equal(byTitle['E-Commerce Platform'].links.live, KEPT[0]);
    assert.equal(byTitle['GB Chat'].links.live, KEPT[1]);
    assert.equal(byTitle['CinemaFlix'].links.live, KEPT[2]);
    assert.equal(byTitle['E-Commerce Platform'].links.demo, KEPT[0]);
    assert.equal(byTitle['E-Commerce Platform'].links.netlify, KEPT[0]);
});

check('the two featured showcase links are unchanged', () => {
    const showcase = json('src/data/projectShowcase.json').projects;
    assert.equal(showcase.length, 2);
    assert.equal(showcase[0].url, 'https://liqourstor.netlify.app/client');
    assert.equal(showcase[1].url, 'https://homescape-pro.netlify.app/');
});

/* ------------------------- no separate directory UI ----------------------- */

check('the separate project directory was removed from the page and CSS', () => {
    const page = read('src/pages/Projects.jsx');
    const css = read('src/styles/Projects.css');
    for (const token of ['PROJECT_LINKS', 'project-links-section', 'project-links-strip', 'scrollProjectLinks', 'projectLinkHost']) {
        assert.ok(!page.includes(token), `${token} must not be rendered`);
    }
    for (const token of ['Phase 17 — owner-supplied project directory', '.project-links-strip', '.project-link-card']) {
        assert.ok(!css.includes(token), `${token} must not be styled`);
    }
    assert.ok(!fs.existsSync(path.join(root, 'src/utils/projectLinks.js')));
});

/* ------------------------------ retained fixes ----------------------------- */

check('the complete front-end catalogue and zero-value fixes are retained', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /getSnapshotSection\('projects'\)/);
    assert.match(page, /const additions = savedItems\.filter\(/);
    assert.match(page, /filter\(card => card\.count > 0\)/);
    const lab = read('src/pages/Lab.jsx');
    assert.match(lab, /filter\(card => card\.value > 0\)/);
    assert.doesNotMatch(lab, /managed in the dashboard|stored in the Hobbies manager/);
    assert.match(read('src/pages/ProjectCard.jsx'), /Number\(project\.views\) > 0/);
});

/* --------------------------------- safety ---------------------------------- */

check('the protected NetGate link and all its files are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        PROTECTED_NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, PROTECTED_NETGATE);
    assert.equal(read('src/data/publicSnapshot.json').split(PROTECTED_NETGATE).length - 1, 3);
    assert.equal(read('server/backups/testimonials/testimonial-samples.backup.json').split(PROTECTED_NETGATE).length - 1, 1);
    assert.ok(!seed().includes(PROTECTED_NETGATE));
});

check('no secret or external call was introduced', () => {
    for (const file of [
        'src/data/projectLinks.json', 'scripts/seed-projects.js',
        'src/pages/Projects.jsx', 'src/data/publicSnapshot.json'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:project-links'], /project-links\.test\.mjs/);
        assert.match(pkg.scripts.test, /project-links\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3r\./);
    assert.match(report, /Phases 3–/);
    assert.match(report, /dead project links/);
});

console.log(`\n${passed} project-link replacement regression checks passed.`);
