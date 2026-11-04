/**
 * Regression checks: owner-specified minimum display counters (phase 19).
 * Every published project must show likes AND views of 600 or above, and the
 * offline saved copy must carry the SAME numbers as the live seed.
 * Node-only static checks — no DB, no network, no browser, no external service.
 * Confidential: local checkout only.
 *
 * These are display/seed values explicitly requested by the owner. They are
 * NOT measured engagement and must never be described as real user activity.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const OWNER_MINIMUM = 600;
const TITLES = [
    'E-Commerce Platform', 'GB Chat', 'CinemaFlix',
    'Portfolio Website', 'Task Management App', 'AI Image Generator',
    'Social Media Dashboard', 'Blockchain Wallet'
];
const PRESERVED_VIEWS = [1245, 856, 1243];
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seedNumbers = field => [...read('scripts/seed-projects.js').matchAll(new RegExp(`${field}:\\s*(\\d+),`, 'g'))].map(m => Number(m[1]));
const snapshotProjects = () => json('src/data/publicSnapshot.json').sections.projects.projects;

/* --------------------------------- the values ------------------------------- */

check('all eight published seed records have likes and views of at least 600', () => {
    const seed = read('scripts/seed-projects.js');
    const likes = seedNumbers('likes');
    const views = seedNumbers('views');
    assert.equal(likes.length, 8);
    assert.equal(views.length, 8);
    for (const n of [...likes, ...views]) assert.ok(n >= OWNER_MINIMUM, `${n} is below the owner minimum`);
    for (const title of TITLES) assert.ok(seed.includes(`title: "${title}"`), `${title} must be present`);
    assert.doesNotMatch(seed, /(?:views|likes):\s*0,/);
});

check('the offline snapshot carries the same counters for the same projects', () => {
    const projects = snapshotProjects();
    assert.equal(projects.length, 8);
    assert.deepEqual(projects.map(p => p.title), TITLES);
    assert.deepEqual(projects.map(p => p.likes), seedNumbers('likes'));
    assert.deepEqual(projects.map(p => p.views), seedNumbers('views'));
    for (const project of projects) {
        assert.ok(project.likes >= OWNER_MINIMUM);
        assert.ok(project.views >= OWNER_MINIMUM);
    }
});

check('the snapshot generator reads BOTH counters from the seed instead of hardcoding zero', () => {
    const src = read('scripts/build-public-snapshot.mjs');
    assert.match(src, /likes: Number\(project\.likes\) \|\| 0/);
    assert.match(src, /views: Number\(project\.views\) \|\| 0/);
    assert.match(src, /read\('scripts\/seed-projects\.js'\)/);
    const projectBlock = src.slice(src.indexOf('const projects = seedProjects.map'), src.indexOf('// 2. Skills'));
    assert.doesNotMatch(projectBlock, /(?:views|likes):\s*0,/);
});

check('the values are labelled as owner-specified display numbers, not real engagement', () => {
    const seed = read('scripts/seed-projects.js');
    assert.match(seed, /owner-specified display\/seed values/i);
    assert.match(seed, /NOT measured engagement/i);
    const generator = read('scripts/build-public-snapshot.mjs');
    assert.match(generator, /Not measured engagement/i);
});

/* -------------------------------- preserving -------------------------------- */

check('existing counters above the floor and all published links are preserved', () => {
    const seed = read('scripts/seed-projects.js');
    const views = seedNumbers('views');
    assert.deepEqual(views.slice(0, 3), PRESERVED_VIEWS);
    for (const url of [
        'https://ominbiz-solution.netlify.app/',
        'https://gbchat.netlify.app/',
        'https://cinemaflx.netlify.app/',
        'https://home-scape-platform.netlify.app/',
        'https://schedule-manager-ap.netlify.app/',
        'https://ai-image-editor-pro.netlify.app/',
        'https://net-gate.netlify.app/',
        'https://fintech-banking.netlify.app/'
    ]) assert.ok(seed.includes(url), `${url} must be preserved`);
});

check('the project card interface itself stays data-driven', () => {
    const card = read('src/components/ProjectCard.jsx');
    assert.match(card, /likes = 0,/);
    assert.match(card, /\{likes\} likes/);
    assert.doesNotMatch(card, /likes:\s*600/);
    const css = read('src/styles/ProjectCard.css');
    assert.doesNotMatch(css, /\b600\s*likes/i);
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /likes=\{project\.likes \|\| 0\}/);
    assert.doesNotMatch(page, /likes:\s*600/);
});

check('other project datasets and every other seed file are left alone', () => {
    const data = read('server/seed-data.js');
    assert.deepEqual(
        [...data.matchAll(/likes:\s*(\d+)/g)].map(m => Number(m[1])).slice(0, 11),
        [45, 32, 28, 19, 15, 38, 67, 41, 22, 18, 34]
    );
    assert.doesNotMatch(read('server/scripts/seedProjects.js'), /likes:/);
    assert.deepEqual(
        [...read('server/scripts/seed-all-projects.js').matchAll(/likes:\s*(\d+)/g)].map(m => Number(m[1])).slice(0, 3),
        [128, 187, 156]
    );
    assert.deepEqual(
        [...read('server/seed-enterprise-projects.js').matchAll(/likes:\s*(\d+)/g)].map(m => Number(m[1])).slice(0, 3),
        [128, 187, 156]
    );
    assert.match(read('server/scripts/seedProjectShowcase.js'), /likes: 0/);
    const showcase = json('src/data/projectShowcase.json');
    assert.equal(showcase.projects.length, 2);
    for (const project of showcase.projects) assert.equal(project.likes, undefined);
});

check('NetGate and all protected link files are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    assert.ok(read('server/backups/testimonials/testimonial-samples.backup.json').includes(NETGATE));
    assert.equal((read('src/data/publicSnapshot.json').match(/net-gate-portal\.netlify\.app\//g) || []).length, 3);
    assert.equal(json('src/data/projectShowcase.json').projects[0].url, 'https://liqourstor.netlify.app/client');
});

check('no secret or external call was introduced', () => {
    for (const file of [
        'scripts/seed-projects.js',
        'scripts/build-public-snapshot.mjs',
        'src/data/publicSnapshot.json'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
    }
});

/* --------------------------------- wiring ---------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:project-likes'], /project-likes\.test\.mjs/);
        assert.match(pkg.scripts.test, /project-likes\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3o\./);
    assert.match(report, /## 3s\./);
    assert.match(report, /Phases 3–/);
    assert.ok(report.includes(String(OWNER_MINIMUM)));
});

console.log(`\n${passed} project-likes regression checks passed.`);
