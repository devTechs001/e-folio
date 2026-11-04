/**
 * Regression checks: Projects page ↔ server ↔ dashboard count synchronisation
 * (phase 19). Node-only static checks — no DB, no network, no browser, no
 * external service. Confidential: local checkout only.
 *
 * These checks prove the wiring exists. They do NOT claim live socket/Mongo
 * behaviour, which cannot be exercised in this offline sandbox.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const emitter = () => read('server/utils/projectEvents.js');
const publicController = () => read('server/controllers/public.controller.js');
const projectController = () => read('server/controllers/projectController.js');
const page = () => read('src/pages/Projects.jsx');
const dashboard = () => read('src/components/dashboard/ProjectManagerEnhanced.jsx');

/* ---------------------------- canonical broadcast --------------------------- */

check('one canonical emitter broadcasts to the public namespace and the root socket', () => {
    assert.ok(exists('server/utils/projectEvents.js'));
    const src = emitter();
    assert.match(src, /PUBLIC_PROJECTS_NAMESPACE\s*=\s*'\/public-projects'/);
    assert.match(src, /PROJECT_STATS_EVENT\s*=\s*'project:stats'/);
    assert.match(src, /io\.of\(PUBLIC_PROJECTS_NAMESPACE\)\.emit\(PROJECT_STATS_EVENT/);
    assert.match(src, /io\.emit\('project_changed'/);
    // A delete broadcast must not reset a matched card's counters to zero.
    assert.match(src, /if \(Number\.isFinite\(Number\(likes\)\)/);
    assert.match(src, /if \(Number\.isFinite\(Number\(views\)\)/);
});

check('the unauthenticated, read-only public namespace is registered', () => {
    assert.ok(exists('server/socket/public-projects.handler.js'));
    const handler = read('server/socket/public-projects.handler.js');
    assert.match(handler, /io\.of\(PUBLIC_PROJECTS_NAMESPACE\)/);
    assert.match(handler, /namespace\.on\('connection'/);
    assert.doesNotMatch(handler, /namespace\.use\(|require\('jsonwebtoken'|auth:/);
    assert.match(read('server/server.js'), /require\('\.\/socket\/public-projects\.handler'\)\(io\)/);
});

check('every public like/view mutation broadcasts the persisted counters', () => {
    const src = publicController();
    assert.match(src, /emitProjectStats/);
    assert.equal((src.match(/emitProjectStats\(\{/g) || []).length, 2);
    // The old code read req.session, but no session middleware is installed:
    // every click counted as a NEW like and unlike never worked.
    assert.doesNotMatch(src, /req\.session\?\.likes|req\.session\.likes|if \(!req\.session\)/);
    assert.match(src, /likeRegistry\.has\(likeKey\)/);
    assert.match(src, /LIKE_REGISTRY_LIMIT/);
    // Slug IDs from saved/archive copies must not become a CastError/500.
    assert.equal((src.match(/\[0-9a-fA-F\]\{24\}/g) || []).length, 2);
});

check('owner/dashboard like, view, create, update and delete all broadcast', () => {
    const src = projectController();
    assert.equal((src.match(/emitProjectStats\(/g) || []).length, 6);
    for (const action of ["'like'", "'unlike'", "'view'", "'created'", "'updated'", "'deleted'"]) {
        assert.ok(src.includes(`action: ${action}`), `${action} must be broadcast`);
    }
});

/* --------------------------- client subscriptions --------------------------- */

check('anonymous visitors get their own unauthenticated project socket', () => {
    const src = read('src/services/socket.service.js');
    assert.match(src, /subscribePublicProjects\(callback\)/);
    assert.match(src, /io\(`\$\{SOCKET_URL\}\/public-projects`/);
    assert.match(src, /socket\.on\('project:stats', callback\)/);
    assert.match(src, /socket\.off\('project:stats', callback\)/);
    assert.match(src, /publicProjectsRefs/);
    assert.doesNotMatch(src, /\/public-projects[\s\S]{0,200}auth:/);
});

check('cross-tab dashboard saves are published without sharing user data', () => {
    assert.ok(exists('src/utils/projectSync.js'));
    const src = read('src/utils/projectSync.js');
    assert.match(src, /publishProjectsChanged/);
    assert.match(src, /subscribeProjectsChanged/);
    assert.match(src, /window\.addEventListener\('storage'/);
    assert.match(src, /BroadcastChannel/);
    assert.match(src, /localStorage\.setItem\(PROJECTS_SYNC_KEY, String\(Date\.now\(\)\)\)/);
    assert.doesNotMatch(src, /getItem\('token'\)|Authorization|fetch\(|localStorage\.getItem/);
});

check('the public page subscribes to both the canonical and legacy event names', () => {
    const src = page();
    assert.match(src, /socketService\.subscribePublicProjects\(applyProjectStats\)/);
    for (const event of [
        'project_changed', 'project_updated', 'project_view', 'project_like',
        'project:updated', 'project:liked', 'project:viewed', 'project:created'
    ]) assert.ok(src.includes(`'${event}'`), `${event} listener missing`);
    assert.match(src, /subscribeProjectsChanged\(refresh\)/);
    assert.match(src, /applyProjectStats = useCallback/);
});

check('the page polls with a hidden-tab guard and bypasses the stale cache', () => {
    const src = page();
    assert.match(src, /setInterval\(refresh, 30000\)/);
    assert.match(src, /document\.hidden/);
    assert.match(src, /visibilitychange/);
    assert.match(src, /loadProjects\(true\)/);
    assert.match(src, /if \(force\) cacheService\.delete\('public_projects'\)/);
    assert.match(src, /const cached = force \? null : cacheService\.get\('public_projects'\)/);
    // Polling must not re-trigger the initial loading spinner.
    assert.match(src, /if \(!loadedOnceRef\.current\) setLoading\(true\)/);
});

check('likes and views use the same public endpoints and server-returned counts', () => {
    const src = page();
    assert.match(src, /\/public\/projects\/\$\{projectId\}\/view/);
    assert.match(src, /\/public\/projects\/\$\{projectId\}\/like/);
    assert.match(src, /const views = Number\(response\?\.views\)/);
    assert.match(src, /const likes = Number\(response\?\.likes\)/);
    // The old odd/even local offset double-counted likes.
    assert.doesNotMatch(src, /projectLikes|Odd means liked|currentLikes % 2/);
    assert.match(src, /likes=\{project\.likes \|\| 0\}/);
    assert.match(src, /recordDevIssue\(\{ section: 'projects'/);
});

check('dashboard mutations publish a refresh signal', () => {
    const src = dashboard();
    assert.match(src, /publishProjectsChanged/);
    assert.ok((src.match(/publishProjectsChanged\(\)/g) || []).length >= 9,
        'create, update, delete, bulk delete, duplicate and toggles must all publish');
});

/* ---------------------------------- data ----------------------------------- */

check('every published counter is at least 600 in the seed and the saved copy', () => {
    const seed = read('scripts/seed-projects.js');
    const snapshot = json('src/data/publicSnapshot.json').sections.projects.projects;
    assert.equal(snapshot.length, 8);
    for (const project of snapshot) {
        assert.ok(project.likes >= 600, `${project.title} likes`);
        assert.ok(project.views >= 600, `${project.title} views`);
    }
    assert.match(read('scripts/build-public-snapshot.mjs'), /views: Number\(project\.views\) \|\| 0/);
    assert.doesNotMatch(seed, /(?:likes|views):\s*0,/);
});

check('protected NetGate files, card files and links are unchanged', () => {
    const NETGATE = 'https://net-gate-portal.netlify.app/';
    assert.equal(json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live, NETGATE);
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    assert.equal((read('src/data/publicSnapshot.json').match(/net-gate-portal\.netlify\.app\//g) || []).length, 3);
    assert.ok(!exists('src/utils/projectLinks.js'), 'the rejected directory loader must stay removed');
    assert.doesNotMatch(page(), /project-links-strip|PROJECT_LINKS/);
    assert.match(read('src/components/ProjectCard.jsx'), /\{likes\} likes/);
});

check('no secret, external write or runtime service call was introduced', () => {
    for (const file of [
        'server/utils/projectEvents.js',
        'server/socket/public-projects.handler.js',
        'server/controllers/public.controller.js',
        'server/controllers/projectController.js',
        'src/services/socket.service.js',
        'src/utils/projectSync.js',
        'src/pages/Projects.jsx',
        'scripts/seed-projects.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /http:\/\/localhost/);
    }
});

/* --------------------------------- wiring ---------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:project-sync'], /project-sync\.test\.mjs/);
        assert.match(pkg.scripts.test, /project-sync\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3s\./);
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} project-sync regression checks passed.`);
