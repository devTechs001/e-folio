/**
 * Regression checks: owner-specified starting like counts on the three public
 * project cards. Node-only static checks — no DB, no network, no browser, no
 * external service. Confidential: local checkout only.
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

const VALUES = [500, 600, 100];
const TITLES = ['E-Commerce Platform', 'GB Chat', 'CinemaFlix'];
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seedLikes = () => [...read('scripts/seed-projects.js').matchAll(/likes:\s*(\d+),/g)].map(m => Number(m[1]));
const snapshotProjects = () => json('src/data/publicSnapshot.json').sections.projects.projects;

/* --------------------------------- the values ------------------------------- */

check('the three supplied like values are on the three published project records, in order', () => {
    assert.deepEqual(seedLikes(), VALUES);
    const seed = read('scripts/seed-projects.js');
    for (const title of TITLES) assert.ok(seed.includes(`title: "${title}"`));
    assert.equal((seed.match(/likes:\s*\d+,/g) || []).length, 3);
});

check('the offline snapshot carries the same values for the same projects', () => {
    const projects = snapshotProjects();
    assert.equal(projects.length, 3);
    assert.deepEqual(projects.map(p => p.title), TITLES);
    assert.deepEqual(projects.map(p => p.likes), VALUES);
    assert.deepEqual(projects.map(p => p.views), [0, 0, 0], 'views were not requested and stay zero');
});

check('the snapshot generator reads likes from the seed instead of hardcoding zero', () => {
    const src = read('scripts/build-public-snapshot.mjs');
    assert.match(src, /likes: Number\(project\.likes\) \|\| 0/);
    assert.match(src, /views: 0,/);
    assert.match(src, /read\('scripts\/seed-projects\.js'\)/);
    assert.doesNotMatch(src, /likes: 0,\n\s*order:/);
});

check('the values are labelled as owner-specified display numbers, not real engagement', () => {
    const seed = read('scripts/seed-projects.js');
    assert.match(seed, /owner-specified display\/seed values/i);
    assert.match(seed, /NOT measured engagement/i);
    const generator = read('scripts/build-public-snapshot.mjs');
    assert.match(generator, /Not measured engagement/i);
});

/* -------------------------------- preserving -------------------------------- */

check('only the likes field changed on the three project records', () => {
    const seed = read('scripts/seed-projects.js');
    for (const [title, views] of [['E-Commerce Platform', 1245], ['GB Chat', 856], ['CinemaFlix', 1243]]) {
        const block = seed.slice(seed.indexOf(`title: "${title}"`), seed.indexOf('links:', seed.indexOf(`title: "${title}"`)));
        assert.ok(block.includes(`views: ${views},`), `${title} views must be untouched`);
        assert.ok(block.includes(`likes: ${VALUES[TITLES.indexOf(title)]},`));
        assert.ok(block.includes(`title: "${title}"`));
    }
    assert.ok(seed.includes('https://ominbiz-solution.netlify.app/'));
    assert.ok(seed.includes('https://gbchat.netlify.app/'));
    assert.ok(seed.includes('https://cinemaflx.netlify.app/'));
});

check('the project card interface itself is unchanged and stays data-driven', () => {
    const card = read('src/components/ProjectCard.jsx');
    assert.match(card, /likes = 0,/);
    assert.match(card, /\{likes\} likes/);
    assert.doesNotMatch(card, /likes:\s*(?:500|600|100)/);
    const css = read('src/styles/ProjectCard.css');
    assert.doesNotMatch(css, /\b(?:500|600|100)\s*likes/i);
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /p\.likes \|\| 0/);
    assert.doesNotMatch(page, /likes:\s*(?:500|600|100)/);
});

check('the eight other project records and every other seed file are left alone', () => {
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
    assert.match(report, /Phases 3–/);
    for (const value of VALUES) assert.ok(report.includes(String(value)), `report must document ${value}`);
});

console.log(`\n${passed} project-likes regression checks passed.`);
