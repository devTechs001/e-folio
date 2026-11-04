/**
 * Phase 22 regression checks: the public Projects page must keep ALL of its
 * features — the full fourteen-record catalogue, every filter/view/sort/detail
 * control, and the owner's working links. Six of those records were lost when
 * commit 5365771 stripped the old hard-coded fallback array; three detail
 * fields were silently dropped by the offline snapshot builder.
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

const RESTORED = [
    { title: 'Kazi Find', link: 'https://kazi-find.netlify.app/', views: 980 },
    { title: 'HomeScape Platform', link: 'https://home-scape-platform.netlify.app/', views: 920 },
    { title: 'Net Gate', link: 'https://net-gate.netlify.app/', views: 870 },
    { title: 'Schedule Manager', link: 'https://schedule-manager-ap.netlify.app/', views: 910 },
    { title: 'AI Image Editor Pro', link: 'https://ai-image-editor-pro.netlify.app/', views: 1040 },
    { title: 'Elimu Pro Beta', link: 'https://elimu-pro-beta.netlify.app/', views: 880 }
];
const ORIGINAL_EIGHT = [
    'E-Commerce Platform', 'GB Chat', 'CinemaFlix', 'Portfolio Website',
    'Task Management App', 'AI Image Generator', 'Social Media Dashboard',
    'Blockchain Wallet'
];
const RETIRED_LINKS = [
    'devtechs001.github.io/omnibiz', 'devtechs001.github.io/portfolio',
    'devtechs001.github.io/task-manager', 'devtechs001.github.io/ai-image-generator',
    'devtechs001.github.io/blockchain-wallet'
];
const UI_FEATURES = [
    'searchQuery', 'setSearchQuery', 'sortBy', 'setSortBy',
    'viewMode', 'setViewMode', 'view-mode-${viewMode}', 'Grid View', 'List View', 'Masonry View',
    'showFilters', 'ProjectFilters', 'category-pill', 'tech-scroller__strip',
    'tech-chip', 'filter-tag', 'summaryCards', 'stat-card',
    'ProjectShowcase', 'NexStoreCard', 'ArchiveNote',
    'tech-showcase', 'cta-section', 'no-results',
    'ProjectCard', 'ProjectModal', 'ImageLightbox',
    'toggleFavorite', 'incrementViews', 'incrementLikes', 'shareProject',
    'subscribePublicProjects', 'subscribeProjectsChanged',
    'loadPublicSection', 'getSnapshotSection', 'applyProjectStats'
];

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const seed = () => read('scripts/seed-projects.js');
const projects = () => json('src/data/publicSnapshot.json').sections.projects.projects;
const page = () => read('src/pages/Projects.jsx');

/* --------------------------- the full catalogue ---------------------------- */

check('all fourteen original project cards are published, plus the two showcase cards', () => {
    const grid = projects();
    assert.equal(grid.length, 14);
    assert.equal(json('src/data/projectShowcase.json').projects.length, 2);
    assert.equal(grid.length + 2, 16);
    assert.deepEqual(grid.slice(0, 8).map(p => p.title), ORIGINAL_EIGHT);
    assert.deepEqual(grid.slice(8).map(p => p.title), RESTORED.map(r => r.title));
    assert.equal(new Set(grid.map(p => p.title)).size, 14);
});

check('the six restored owner projects keep their original details and working links', () => {
    const grid = projects();
    for (const restored of RESTORED) {
        const record = grid.find(p => p.title === restored.title);
        assert.ok(record, `${restored.title} is missing`);
        assert.equal(record.links.live, restored.link);
        assert.equal(record.views, restored.views, `${restored.title} view count`);
        assert.ok(record.likes >= 600 && record.views >= 600, `${restored.title} counters`);
        assert.ok(record.description && record.fullDescription, `${restored.title} copy`);
        assert.ok(Array.isArray(record.images) && record.images.length >= 2, `${restored.title} images`);
        assert.ok(record.technologies.length >= 4, `${restored.title} technologies`);
        assert.ok(record.tags.length >= 4 && record.category, `${restored.title} taxonomy`);
        assert.ok(record.duration && record.completionDate && record.teamSize, `${restored.title} details`);
    }
});

check('restored records are additive: the original eight links and counters are untouched', () => {
    const grid = projects();
    assert.deepEqual(grid.slice(0, 8).map(p => p.views), [1245, 856, 1243, 600, 600, 600, 600, 600]);
    assert.ok(grid.slice(0, 8).every(p => p.likes === 600));
    const snapshot = read('src/data/publicSnapshot.json');
    for (const link of [
        'https://ominbiz-solution.netlify.app/', 'https://gbchat.netlify.app/',
        'https://cinemaflx.netlify.app/', 'https://net-gate-portal.netlify.app/'
    ]) assert.ok(snapshot.includes(link), `${link} must remain published`);
    assert.equal((snapshot.match(/https:\/\/net-gate-portal\.netlify\.app\//g) || []).length, 3);
    for (const retired of RETIRED_LINKS) assert.ok(!snapshot.includes(retired), `${retired} must stay retired`);
});

/* ------------------------------ detail features ----------------------------- */

check('the offline copy now carries duration, challenges and achievements from the seed', () => {
    const generator = read('scripts/build-public-snapshot.mjs');
    for (const field of ['duration', 'challenges', 'achievements']) {
        assert.match(generator, new RegExp(`\\.\\.\\.\\(project\\.${field}|Array\\.isArray\\(project\\.${field}`));
    }
    const grid = projects();
    assert.ok(grid.filter(p => p.duration).length >= 6, 'duration must render on the restored cards');
    assert.ok(grid.some(p => p.challenges), 'challenges must be available to the detail modal');
    assert.ok(grid.some(p => Array.isArray(p.achievements) && p.achievements.length), 'achievements must be available');
});

check('no achievement, metric or link was invented: every value comes from the local seed', () => {
    const source = seed();
    const grid = projects();
    for (const record of grid) {
        for (const achievement of record.achievements || []) {
            assert.ok(source.includes(achievement), `invented achievement: ${achievement}`);
        }
        if (record.challenges) assert.ok(source.includes(record.challenges), 'invented challenges');
        if (record.duration) assert.ok(source.includes(`duration: "${record.duration}"`), 'invented duration');
        assert.ok(source.includes(`title: "${record.title}"`), `invented title: ${record.title}`);
        assert.ok(source.includes(record.links.live), `invented link: ${record.links.live}`);
    }
    assert.doesNotMatch(source, /(?:views|likes):\s*0,/);
    assert.match(source, /NOT measured engagement/i);
});

/* --------------------------------- UI features ------------------------------ */

check('the Projects page still renders every filter, view, sort, detail and sync feature', () => {
    const src = page();
    for (const token of UI_FEATURES) assert.ok(src.includes(token), `missing Projects feature: ${token}`);
    assert.match(src, /allTechnologies\.map\(tech =>/);
    assert.match(src, /filteredAndSortedProjects\.map\(/);
    assert.match(src, /onScroll=\{updateTechScrollState\}/);
    assert.match(src, /\}, \[updateTechScrollState, projects\.length\]\);/);
});

check('the public page is not capped at three projects and keeps the card interface imports', () => {
    const src = page();
    assert.doesNotMatch(src, /\.slice\(0,\s*3\)|limit:\s*3|maxProjects/);
    assert.match(src, /import ProjectCard from '\.\/ProjectCard'/);
    assert.match(src, /import ProjectModal from '\.\/ProjectModal'/);
    assert.match(src, /import ProjectShowcase from '\.\.\/components\/ProjectShowcase'/);
});

check('card markup, card CSS and the protected showcase data are unchanged by this phase', () => {
    const card = read('src/pages/ProjectCard.jsx');
    assert.match(card, /project\.completionDate/);
    assert.match(card, /project\.duration/);
    assert.match(read('src/pages/ProjectModal.jsx'), /project\.achievements/);
    assert.ok(read('src/styles/ProjectCard.css').length > 100);
    const showcase = json('src/data/projectShowcase.json').projects;
    assert.equal(showcase.length, 2);
    assert.ok(showcase.every(p => !('achievements' in p) && !('views' in p)));
});

check('no secret or external write was introduced', () => {
    const src = seed() + page() + read('scripts/build-public-snapshot.mjs') + read('tests/projects-features.test.mjs');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

/* ----------------------------------- wiring --------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:projects-features'], /projects-features\.test\.mjs/);
        assert.match(pkg.scripts.test, /projects-features\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3v\./);
    assert.match(report, /Phase 22/);
});

console.log(`\n${passed} Projects-page feature restoration checks passed.`);
