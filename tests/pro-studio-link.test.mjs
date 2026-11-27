/**
 * Regression checks: the Pro-Studio-Master link added as an APPEND-ONLY third
 * entry in the public Projects showcase.
 *
 * Node-only static checks — no DB, no network, no browser, no external service.
 * Confidential: local checkout only.
 *
 * What is protected here:
 *   - the URL is stored verbatim and exactly once;
 *   - the two previously published showcase links are untouched;
 *   - the record is safe to render (HTTPS, no credentials);
 *   - the card copy describes only what the live site actually states;
 *   - it reaches both the Projects page and the MongoDB seeder from one file.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const STUDIO = 'https://pro-studio-master.netlify.app/';
const CELLARKEEP = 'https://liqourstor.netlify.app/client';
const HOMESCAPE = 'https://homescape-pro.netlify.app/';
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const showcase = () => json('src/data/projectShowcase.json').projects;
const studio = () => showcase().find(p => p.slug === 'pro-studio-master');

/* ---------------------------------- data ---------------------------------- */

check('the supplied URL is stored verbatim, exactly once', () => {
    const entry = studio();
    assert.ok(entry, 'the Pro-Studio-Master entry is missing');
    assert.equal(entry.url, STUDIO);
    const occurrences = (read('src/data/projectShowcase.json').match(/pro-studio-master\.netlify\.app/g) || []).length;
    assert.equal(occurrences, 1, `the URL appears ${occurrences} times`);
});

check('it was appended without disturbing the existing entries', () => {
    const projects = showcase();
    assert.equal(projects[0].url, CELLARKEEP);
    assert.equal(projects[1].url, HOMESCAPE);
    assert.equal(projects[projects.length - 1].slug, 'pro-studio-master');
    assert.equal(new Set(projects.map(p => p.slug)).size, projects.length, 'duplicate slug');
    assert.equal(new Set(projects.map(p => p.url)).size, projects.length, 'duplicate url');
});

check('the link is a plain HTTPS URL with no credentials or query', () => {
    const parsed = new URL(STUDIO);
    assert.equal(parsed.protocol, 'https:');
    assert.equal(parsed.username, '');
    assert.equal(parsed.password, '');
    assert.equal(parsed.pathname, '/');
    assert.equal(parsed.search, '');
});

check('the record has everything the card renders', () => {
    const entry = studio();
    // ProjectShowcase renders label, title, description, features, a notes list,
    // a link label and the URL — a missing field would render a blank block.
    for (const field of ['slug', 'title', 'label', 'description', 'category', 'status', 'linkLabel', 'verifiedAt']) {
        assert.ok(entry[field], `${field} is missing`);
    }
    assert.ok(Array.isArray(entry.features) && entry.features.length >= 3, 'too few features');
    assert.ok(Array.isArray(entry.securityNotes) && entry.securityNotes.length >= 3, 'too few notes');
    assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0);
    assert.ok(Array.isArray(entry.technologies) && entry.technologies.length > 0);
});

check('the card copy restates only what the live site states', () => {
    const entry = studio();
    const copy = JSON.stringify(entry);
    // Facts taken from the published landing and download pages.
    assert.match(copy, /music studio/i);
    assert.match(copy, /piano roll/i);
    assert.match(copy, /3D mixer/i);
    // Honest positioning: it is local-first, and the site says so.
    assert.match(copy, /on your (own )?computer|locals?|127\.0\.0\.1/i);
    // No invented engagement or performance metrics.
    for (const banned of [/\d+%\s*uptime/i, /daily active users/i, /stars?\b/i, /\d+k\+? downloads/i]) {
        assert.doesNotMatch(copy, banned);
    }
});

check('it claims no penetration-testing or security-audit scope', () => {
    // This is a music application. The showcase card must not imply offensive
    // testing or a security assessment that never took place.
    const entry = studio();
    const copy = JSON.stringify(entry);
    for (const banned of [/pentest/i, /penetration/i, /vulnerab/i, /exploit/i, /audited/i, /CVE/i]) {
        assert.doesNotMatch(copy, banned);
    }
});

/* -------------------------------- rendering -------------------------------- */

check('the showcase link is safe to render', () => {
    const utils = read('src/utils/projectShowcase.js');
    // Only absolute HTTPS links without embedded credentials are rendered.
    assert.match(utils, /parsed\.protocol === 'https:'/);
    assert.match(utils, /!parsed\.username && !parsed\.password/);
    // External anchors must not leak the referrer.
    assert.match(utils, /rel: 'noopener noreferrer'/);
    assert.match(utils, /referrerPolicy: 'no-referrer'/);
    // A stray http: entry must not silently render.
    assert.ok(!STUDIO.startsWith('http:'));
});

check('the Projects page renders the shared showcase', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /import ProjectShowcase from '\.\.\/components\/ProjectShowcase'/);
    assert.match(page, /<ProjectShowcase \/>/);
    // The grid auto-fits, so a third record needs no layout change.
    const css = read('src/styles/ProjectShowcase.css');
    assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(280px, 1fr\)\);/);
});

/* --------------------------------- seeding --------------------------------- */

check('the MongoDB seeder picks the record up from the same file', () => {
    const seeder = read('server/scripts/seedProjectShowcase.js');
    assert.match(seeder, /require\('\.\.\/\.\.\/src\/data\/projectShowcase\.json'\)/);
    assert.match(seeder, /const PROJECTS = dataset\.projects/);
    // Idempotent: matched on title + tag, so re-running cannot duplicate it.
    assert.match(seeder, /\{ title: doc\.title, tags: SHOWCASE_TAG \}/);
    assert.match(seeder, /upsert: true/);
    // And the record is in the set that seeder iterates.
    assert.ok(studio());
});

check('the pipeline seeds showcase records as part of the full seed', () => {
    const pipeline = read('server/scripts/seedAllSamples.js');
    assert.match(pipeline, /server\/scripts\/seedProjectShowcase\.js/);
});

/* -------------------------------- protection ------------------------------- */

check('no previously published link was changed or removed', () => {
    const projects = showcase();
    const urls = projects.map(p => p.url);
    assert.ok(urls.includes(CELLARKEEP), 'CellarKeep link lost');
    assert.ok(urls.includes(HOMESCAPE), 'HomeScape link lost');
    // The protected NetGate URL lives on the Network Recon Suite record.
    const lab = json('src/data/labEntries.json').entries.find(e => e.slug === 'network-recon-suite');
    assert.equal(lab.links.live, NETGATE);
    assert.ok(read('src/data/publicSnapshot.json').includes('net-gate-portal.netlify.app'));
});

check('no secret or external write was introduced', () => {
    const src = read('src/data/projectShowcase.json') + read('tests/pro-studio-link.test.mjs');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

console.log(`\n${passed} Pro-Studio-Master link checks passed.`);
