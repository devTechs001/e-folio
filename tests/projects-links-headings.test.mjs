/**
 * Phase 36 — E-Commerce link swap, two owner-supplied projects, a larger
 * heading scale and a cleaner three-action hero.
 *
 * Node-only static checks. No network, no database, no browser, no external
 * service. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const BIZ_URL = 'https://bizsolutionz.netlify.app/';
const SOKO_URL = 'https://e-commerce-alfa.netlify.app/';
const NEXUS_URL = 'https://saas-systeme.netlify.app/';
const RETIRED = ['https://', 'ominbiz-solution', '.netlify.app/'].join('');
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seed = () => read('scripts/seed-projects.js');
const grid = () => json('src/data/publicSnapshot.json').sections.projects.projects;

/* ------------------------------- link swap -------------------------------- */

check('the E-Commerce record points at the supplied host in the seed', () => {
    const src = seed();
    const block = src.slice(src.indexOf('title: "E-Commerce Platform"'), src.indexOf('title: "GB Chat"'));
    for (const key of ['live', 'demo', 'netlify']) {
        assert.ok(block.includes(`${key}: "${BIZ_URL}"`), `${key} must use the supplied host`);
    }
    // The GitHub link is untouched by the swap.
    assert.ok(block.includes('github: "https://github.com/devTechs001/ecommerce-platform"'));
});

check('the previous host is retired from every published file', () => {
    assert.ok(!seed().includes(RETIRED), 'seed must not carry the retired host');
    assert.ok(!JSON.stringify(grid()).includes(RETIRED), 'snapshot must not carry it either');
    for (const file of [
        'server/seed-data.js',
        'server/scripts/seedProjects.js',
        'server/scripts/seed-all-projects.js',
        'server/seed-enterprise-projects.js',
        'src/data/projectLinks.json'
    ]) {
        assert.ok(!read(file).includes(RETIRED), `${file} still carries the retired host`);
    }
});

/* ---------------------------- the two projects ----------------------------- */

check('both new projects are real published records with the supplied links', () => {
    const records = Object.fromEntries(grid().map(p => [p.title, p]));
    for (const [title, url] of [['SokoMesh', SOKO_URL], ['Nexus SaaS Platform', NEXUS_URL]]) {
        const record = records[title];
        assert.ok(record, `${title} must be in the saved snapshot`);
        assert.equal(record.links.live, url);
        assert.equal(record.links.demo, url);
        assert.equal(record.links.netlify, url);
        assert.equal(record.status, 'completed');
        assert.equal(record.category, 'Web');
    }
});

check('the two new records meet the owner-supplied counter floor', () => {
    for (const title of ['SokoMesh', 'Nexus SaaS Platform']) {
        const record = grid().find(p => p.title === title);
        assert.ok(record.views >= 600, `${title} views`);
        assert.ok(record.likes >= 600, `${title} likes`);
    }
    // The floor never becomes a zero or an invented higher figure.
    const src = seed();
    assert.doesNotMatch(src, /(?:views|likes):\s*0,/);
});

check('the new records claim no stack, metric or achievement the page cannot show', () => {
    for (const title of ['SokoMesh', 'Nexus SaaS Platform']) {
        const record = grid().find(p => p.title === title);
        for (const key of ['achievements', 'uptime', 'users', 'orders', 'metrics', 'rating']) {
            assert.equal(record[key], undefined, `${title} must not fabricate ${key}`);
        }
        // Technologies list the published build only; no framework guess.
        assert.ok(record.technologies.includes('React'), `${title} technologies`);
        assert.ok(record.technologies.includes('Netlify'), `${title} is a Netlify deployment`);
        assert.ok(!record.technologies.includes('MongoDB'), `${title} has no database surface`);
        assert.ok(!record.technologies.includes('Stripe'), `${title} has no payments surface`);
    }
});

check('the catalogue grew to sixteen grid records and stays unique', () => {
    const records = grid();
    assert.equal(records.length, 16);
    assert.equal(new Set(records.map(p => p.title)).size, 16);
    // Order matters: the fourteen originals keep their positions.
    assert.equal(records[14].title, 'SokoMesh');
    assert.equal(records[15].title, 'Nexus SaaS Platform');
});

check('the snapshot builder produced the new records from the seed, not by hand', () => {
    const generator = read('scripts/build-public-snapshot.mjs');
    assert.match(generator, /read\('scripts\/seed-projects\.js'\)/);
    // Every snapshot record must correspond to a seed record.
    const titles = [...seed().matchAll(/title: "([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(grid().map(p => p.title), titles);
});

/* ------------------------------ heading scale ------------------------------ */

check('the public heading scale is larger than phase 35 at every breakpoint', () => {
    const css = read('src/styles/SectionHeading.css');
    const previous = ['2.25rem', '2.75rem', '3.25rem', '3.75rem', '4rem'];
    const current = ['2.5rem', '3rem', '3.5rem', '4.25rem', '4.75rem'];
    assert.equal((css.match(/var\(--sec-head-size,/g) || []).length, 5);
    for (let i = 0; i < current.length; i += 1) {
        assert.ok(css.includes(`font-size: var(--sec-head-size, ${current[i]});`), `missing ${current[i]}`);
        assert.ok(
            parseFloat(current[i]) > parseFloat(previous[i]),
            `${current[i]} must exceed the previous ${previous[i]}`
        );
        assert.ok(!css.includes(`font-size: ${previous[i]};`), `${previous[i]} must be gone`);
    }
});

check('the larger headings still wrap and still honour reduced motion', () => {
    const css = read('src/styles/SectionHeading.css');
    assert.match(css, /text-wrap: balance;/);
    assert.match(css, /line-height: 1\.1;/);
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    assert.match(block, /\.sec-head__accent,\s*\.sec-head__line,\s*\.sec-head__dot\s*\{\s*animation: none;/);
});

/* -------------------------------- the hero -------------------------------- */

check('the hero keeps exactly three actions in the same order and destinations', () => {
    const src = read('src/pages/LandingPage.jsx');
    const labels = [...src.matchAll(/className="lp-action__title">([^<]+)</g)].map(m => m[1]);
    assert.deepEqual(labels, ['Create Your Portfolio', 'Collaborate with Me', 'Build Your CV']);
    assert.match(src, /<Link to="\/register" className="lp-action lp-action--primary">/);
    assert.match(src, /<Link to="\/collaborate" className="lp-action lp-action--accent">/);
    assert.match(src, /<Link to="\/cv" className="lp-action lp-action--ghost">/);
});

check('the primary action is visually dominant and the other two are grouped', () => {
    const src = read('src/pages/LandingPage.jsx');
    const css = read('src/styles/LandingPage.css');
    assert.match(src, /<div className="lp-actions__secondary">/);
    // One column for the primary, two equal cells for the supporting pair.
    assert.match(css, /\.lp-hero \.lp-actions \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\);/);
    assert.match(css, /\.lp-hero \.lp-actions__secondary \{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    // The primary card is taller and its title larger than the supporting cards.
    assert.match(css, /\.lp-hero \.lp-action--primary \{[\s\S]*?min-height: 108px;/);
    assert.match(css, /\.lp-hero \.lp-action--primary \.lp-action__title \{ font-size: 1\.25rem; \}/);
});

check('the hero is responsive at phone width and motion-safe', () => {
    const css = read('src/styles/LandingPage.css');
    // Phones stack everything; nothing stays in a two-up row below 720px.
    assert.match(css, /@media \(max-width: 720px\) \{[\s\S]*?\.lp-hero \.lp-actions__secondary \{ grid-template-columns: minmax\(0, 1fr\); \}/);
    assert.match(css, /@media \(max-width: 720px\) \{[\s\S]*?\.lp-hero \.lp-action \{ min-height: 84px;/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.lp-hero \.lp-action \{ transition: none; \}/);
    assert.match(css, /\.lp-hero \.lp-action:focus-visible \{ outline: 2px solid/);
});

/* ------------------------------- protection ------------------------------- */

check('the protected NetGate link and project-card files are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    for (const file of [
        'src/components/ProjectCard.jsx', 'src/styles/ProjectCard.css',
        'src/pages/ProjectCard.jsx', 'src/pages/ProjectModal.jsx'
    ]) {
        assert.ok(fs.existsSync(path.join(root, file)), `${file} must still exist`);
    }
});

check('no secret or outbound call was introduced', () => {
    for (const file of ['scripts/seed-projects.js', 'src/data/publicSnapshot.json', 'src/pages/LandingPage.jsx']) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
    for (const file of ['scripts/seed-projects.js', 'src/data/publicSnapshot.json']) {
        assert.doesNotMatch(read(file), /fetch\(|axios|XMLHttpRequest/);
    }
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:projects-links-headings'], /projects-links-headings\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:projects-links-headings/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ai\./);
    assert.ok(report.includes(BIZ_URL));
    assert.ok(report.includes(SOKO_URL));
    assert.ok(report.includes(NEXUS_URL));
});

console.log(`\n${passed} project links / headings / hero regression checks passed.`);
