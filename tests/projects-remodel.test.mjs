/**
 * Phase 23 regression checks: the Projects page remodelling must ADD a large
 * feature set without deleting any existing feature, changing the project card
 * interface, inventing data, or re-introducing the hidden top-section headings.
 *
 * Node-only static checks. Confidential: local checkout only, no network,
 * no database, no browser, no external service.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const HEADINGS = [
    'Portfolio at a glance', 'Featured work', 'Explore the catalogue',
    'Tools &amp; shortcuts', 'Compare projects', 'Project timeline',
    'Technology index', 'Popular tags'
];
const NEW_FEATURES = [
    'px-eyebrow', 'px-metrics', 'px-spotlight', 'px-tabs', 'px-categories',
    'px-chip-grid', 'px-toolbar', 'px-compare-picker', 'px-table',
    'px-timeline', 'px-result-count', 'MAX_COMPARE', 'countBy', 'yearOf'
];
const KEPT_FEATURES = [
    'searchQuery', 'sortBy', 'viewMode', 'showFilters', 'ProjectFilters',
    'tech-scroller__strip', 'tech-chip', 'summaryCards', 'stat-card',
    'ProjectShowcase', 'NexStoreCard', 'ArchiveNote', 'tech-showcase',
    'cta-section', 'no-results', 'ProjectCard', 'ProjectModal', 'ImageLightbox',
    'toggleFavorite', 'incrementViews', 'incrementLikes', 'shareProject',
    'subscribePublicProjects', 'subscribeProjectsChanged',
    'loadPublicSection', 'getSnapshotSection', 'applyProjectStats',
    'filteredAndSortedProjects.map(', 'allTechnologies.map(tech =>',
    'onScroll={updateTechScrollState}',
    '}, [updateTechScrollState, projects.length]);'
];
const PAGE_FEATURES = [
    'ProjectsExperience', 'selectedTags', 'toggleTag', 'showFavoritesOnly',
    'copyViewLink', 'surpriseMe', 'resetAllFilters', 'backToTop',
    'searchInputRef', 'URLSearchParams', 'revealFallback',
    "'/'", "'Escape'", 'Oldest First', 'Largest Stack',
    'selectedTechs, selectedTags, showFavoritesOnly, favorites'
];

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const page = () => read('src/pages/Projects.jsx');
const experience = () => read('src/components/ProjectsExperience.jsx');

/* ------------------------------ top-section headings ------------------------ */

check('the top section has visible, semantic headings again', () => {
    const src = experience();
    for (const heading of HEADINGS) assert.ok(src.includes(heading), `missing heading: ${heading}`);
    assert.ok((src.match(/className="px-heading"/g) || []).length >= 5);
    assert.ok((src.match(/<h3|<h4/g) || []).length >= 8);
    assert.match(src, /aria-labelledby=/);
});

check('the top section is no longer gated behind data-reveal opacity', () => {
    const src = page();
    assert.match(src, /<div className="portfolio-hero max-w-7xl mx-auto mb-16">/);
    assert.doesNotMatch(src, /className="portfolio-hero[^"]*"[^>]*data-reveal/);
    assert.match(src, /data-reveal/); // other sections still animate
    assert.match(src, /revealFallback/);
    assert.match(src, /\[data-reveal\]:not\(\.is-visible\)/);
    assert.match(read('src/styles/Projects.css'), /\[data-reveal\]\.is-visible/);
});

/* -------------------------------- vast features ----------------------------- */

check('the new experience layer provides the full feature set', () => {
    const src = experience();
    for (const token of NEW_FEATURES) assert.ok(src.includes(token), `missing feature: ${token}`);
    for (const token of ['onOpenProject', 'onCopyView', 'onSurpriseMe', 'onResetFilters', 'onBackToTop']) {
        assert.ok(src.includes(token), `missing callback: ${token}`);
    }
});

check('the page wires the new layer and its keyboard/share/filter features', () => {
    const src = page();
    for (const token of PAGE_FEATURES) assert.ok(src.includes(token), `missing page feature: ${token}`);
    assert.match(src, /import ProjectsExperience from '\.\.\/components\/ProjectsExperience'/);
    assert.match(src, /ref=\{searchInputRef\}/);
    assert.match(src, /navigator\.clipboard\.writeText/);
    assert.match(src, /window\.addEventListener\('keydown', onKeyDown\)/);
});

check('none of the pre-existing Projects features were deleted', () => {
    const src = page();
    for (const token of KEPT_FEATURES) assert.ok(src.includes(token), `lost feature: ${token}`);
    assert.equal(json('src/data/publicSnapshot.json').sections.projects.projects.length, 14);
    assert.equal(json('src/data/projectShowcase.json').projects.length, 2);
});

check('all values are derived from published records — nothing invented', () => {
    const src = experience();
    assert.doesNotMatch(src, /https?:\/\//);
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /views:\s*\d|likes:\s*\d/);
    assert.match(src, /countBy\(projects, 'technologies'\)/);
    assert.match(src, /countBy\(projects, 'tags'\)/);
    assert.match(src, /\.filter\(metric => metric\.value !== null/);
    assert.doesNotMatch(src, /Math\.random/);
});

check('the project card interface and card CSS are still untouched', () => {
    const css = read('src/styles/ProjectsExperience.css');
    assert.doesNotMatch(css, /\.projects-grid\s*\{|\.project-card\s*\{/);
    assert.match(css, /@media \(max-width: 760px\)/);
    assert.match(css, /prefers-reduced-motion/);
    const card = read('src/pages/ProjectCard.jsx');
    assert.match(card, /project\.duration/);
    assert.ok(read('src/styles/ProjectCard.css').length > 100);
});

check('no secret, external write or runtime service call was introduced', () => {
    const src = page() + experience() + read('src/styles/ProjectsExperience.css');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

/* ----------------------------------- wiring --------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:projects-remodel'], /projects-remodel\.test\.mjs/);
        assert.match(pkg.scripts.test, /projects-remodel\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3w\./);
    assert.match(report, /Phase 23/);
});

console.log(`\n${passed} Projects-page remodelling checks passed.`);
