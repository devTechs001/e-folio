/**
 * Regression checks: restore the original project records (14 grid cards plus
 * the 2 featured showcase cards = 16), add visible technology filter buttons
 * and restyle only the Projects page. Node-only static checks — no DB, no
 * network, no browser. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const RESTORED = [
    'Portfolio Website', 'Task Management App', 'AI Image Generator',
    'Social Media Dashboard', 'Blockchain Wallet'
];
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seed = () => read('scripts/seed-projects.js');
const snapshotProjects = () => json('src/data/publicSnapshot.json').sections.projects.projects;
const showcase = () => json('src/data/projectShowcase.json').projects;

/* ------------------------------ the 16 projects ---------------------------- */

check('all fourteen original project records are back, plus two featured cards', () => {
    const projects = snapshotProjects();
    assert.equal(projects.length, 14);
    for (const title of RESTORED) assert.ok(projects.some(p => p.title === title), `${title} is missing`);
    assert.equal(showcase().length, 2);
    assert.equal(projects.length + showcase().length, 16, 'the page must show 16 projects in total');
    assert.equal(new Set(projects.map(p => p.title)).size, projects.length);
});

check('the restored records come from the local seed file, not invented data', () => {
    const src = seed();
    for (const title of RESTORED) assert.ok(src.includes(`title: "${title}"`));
    assert.match(src, /Recovered verbatim from the pre-phase-4 getFallbackProjects/);
    assert.equal((src.match(/title: "/g) || []).length, 14);
});

check('every project has non-zero technologies, so filter buttons have real data', () => {
    const projects = snapshotProjects();
    assert.ok(projects.length >= 8);
    for (const p of projects) {
        assert.ok(Array.isArray(p.technologies) && p.technologies.length > 0, `${p.title} has no technologies`);
    }
    const unique = new Set(projects.flatMap(p => p.technologies));
    assert.ok(unique.size >= 15, `expected a broad technology list, got ${unique.size}`);
});

check('there are several distinct categories for the project filter buttons', () => {
    const categories = new Set(snapshotProjects().map(p => p.category).filter(Boolean));
    assert.ok(categories.size >= 4, `expected 4+ categories, got ${categories.size}`);
    for (const c of ['Web', 'Mobile', 'AI/ML', 'Blockchain']) assert.ok(categories.has(c));
});

check('restored records use only the owner-specified minimum counters, no badges', () => {
    const src = seed();
    // Scope this check to the phase-16 restored block: phase 22 appended six
    // more historical records after it, with their own higher view counts.
    const start = src.indexOf('    // Recovered verbatim');
    const end = src.indexOf('    // Phase 22:');
    const block = src.slice(start, end);
    // The original image URLs (including the historical placeholder images)
    // are preserved verbatim from local Git history; only invented counters
    // and achievement badges were dropped. Phase 19 replaced the zeros with
    // the owner-supplied floor of 600 so no public card shows a zero count.
    assert.doesNotMatch(block, /achievements|Math\.random/);
    assert.equal((block.match(/views: 600,/g) || []).length, 5);
    assert.equal((block.match(/likes: 600,/g) || []).length, 5);
    assert.doesNotMatch(block, /(?:views|likes):\s*0,/);
});

/* ------------------------------- filter buttons ---------------------------- */

check('the page renders a visible technology filter button strip', () => {
    const page = read('src/pages/Projects.jsx');
    for (const token of [
        'tech-scroller__strip', 'tech-scroller__viewport', 'tech-chip',
        'scrollTechStrip', 'toggleTech', 'techScrollerRef', 'aria-pressed'
    ]) {
        assert.ok(page.includes(token), `missing ${token}`);
    }
    assert.match(page, /allTechnologies\.map\(tech =>/);
    assert.match(page, /aria-label="Scroll technology filters left"/);
    assert.match(page, /aria-label="Scroll technology filters right"/);
    assert.ok((page.match(/className=\{`tech-chip/g) || []).length === 1);
});

check('filter buttons are derived from project technologies, not hardcoded', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /const allTechnologies = useMemo\(\(\) => \{/);
    assert.match(page, /projects\.flatMap\(p => p\.technologies \|\| \[\]\)/);
    assert.match(page, /projects\.filter\(p => \(p\.technologies \|\| \[\]\)\.includes\(tech\)\)\.length/);
    assert.match(page, /<ProjectFilters/);
    assert.match(page, /category-pill/);
});

check('scroll affordances and guarded reveal effects are wired', () => {
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /projects-scroll-progress/);
    assert.match(page, /scrollProgress/);
    assert.match(page, /addEventListener\('scroll', onScroll, \{ passive: true \}\)/);
    assert.match(page, /removeEventListener\('scroll', onScroll\)/);
    assert.match(page, /typeof IntersectionObserver === 'undefined'/);
    assert.match(page, /observer\.disconnect\(\)/);
    assert.match(page, /scrollIntoView\(\{ behavior: 'smooth'/);
    assert.match(page, /data-reveal/);
});

/* --------------------------------- restyle --------------------------------- */

check('the page stylesheet has the modern shell without touching card styles', () => {
    const css = read('src/styles/Projects.css');
    const block = css.slice(css.indexOf('Phase 16 — modern page shell'));
    assert.ok(block.length > 1000);
    for (const cls of [
        '.projects-scroll-progress', '.projects-toolbar', '.tech-scroller',
        '.tech-chip', '[data-reveal]', '.is-visible', 'prefers-reduced-motion'
    ]) {
        assert.ok(block.includes(cls), `missing ${cls}`);
    }
    assert.doesNotMatch(block, /^\s*\.project-card[\s{:,.]/m);
    assert.doesNotMatch(block, /^\s*\.projects-grid[\s{:,.]/m);
});

check('the project cards themselves are untouched by the page restyle', () => {
    for (const file of ['src/components/ProjectCard.jsx', 'src/styles/ProjectCard.css']) {
        const src = read(file);
        assert.doesNotMatch(src, /tech-scroller|projects-scroll-progress|data-reveal/);
    }
    const page = read('src/pages/Projects.jsx');
    assert.match(page, /<ProjectCard/);
    assert.match(page, /<ProjectShowcase/);
    assert.match(read('src/components/Projects.jsx'), /<ProjectShowcase compact \/>/);
});

/* --------------------------------- safety ---------------------------------- */

check('NetGate and every protected link file are unchanged', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    assert.equal((read('src/data/publicSnapshot.json').match(/net-gate-portal\.netlify\.app\//g) || []).length, 3);
    assert.equal(showcase()[0].url, 'https://liqourstor.netlify.app/client');
    assert.equal(showcase()[1].url, 'https://homescape-pro.netlify.app/');
    assert.ok(read('src/data/publicSnapshot.json').includes('https://ominbiz-solution.netlify.app/'));
});

check('no secret or external call was introduced', () => {
    for (const file of [
        'scripts/seed-projects.js', 'src/pages/Projects.jsx',
        'src/styles/Projects.css', 'src/data/publicSnapshot.json'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:projects-page'], /projects-page-filters\.test\.mjs/);
        assert.match(pkg.scripts.test, /projects-page-filters\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3p\./);
    assert.match(report, /Phases 3–/);
    assert.ok(report.includes('10'));
});

console.log(`\n${passed} projects-page/filters regression checks passed.`);
