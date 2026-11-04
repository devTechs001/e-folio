/**
 * Phase 24 regression checks — Lab subsystem review and repair.
 *
 * 1. A working backend used to leave the public Lab grid empty (all portfolio
 *    records have status `completed`, which the Lab status filter excludes).
 * 2. The Lab listened for `skills_changed` / `interests_changed`, events the
 *    server never emitted, and only on the signed-in root socket.
 * 3. Sample wording leaked to anonymous visitors.
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

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const lab = () => read('src/pages/Lab.jsx');

/* --------------------------- the empty-grid defect -------------------------- */

check('the Lab completes live experiment data from its real saved copy', () => {
    const src = lab();
    assert.match(src, /getSnapshotSection\('labProjects'\)/);
    assert.match(src, /const savedAdditions = savedLabProjects\.filter/);
    assert.match(src, /const realProjects = \[\.\.\.liveLabProjects, \.\.\.savedAdditions\]/);
    assert.match(src, /const usedSavedCopy = savedAdditions\.length > 0/);
    assert.match(src, /const fullyLive = allLive && !usedSavedCopy/);
    assert.match(src, /fullyLive \? 'live' : allLive \? 'partial' : 'archive'/);
    // The original three-section loader is unchanged.
    assert.match(src, /loadPublicSection\('projects', \{ fallbackSection: 'labProjects' \}\)/);
    assert.match(src, /loadPublicSection\('skills'\)/);
    assert.match(src, /loadPublicSection\('interests'\)/);
    assert.match(src, /Promise\.all\(\[/);
});

check('the saved Lab copy is derived from real local sample records', () => {
    const builder = read('scripts/build-public-snapshot.mjs');
    assert.match(builder, /const labProjects = labSamples\.map/);
    assert.match(builder, /sample\.title\.replace\(\/\^\\\[SAMPLE\\\]/);
    assert.match(read('server/controllers/public.controller.js'), /createdAt updatedAt images/);
    const snapshot = json('src/data/publicSnapshot.json');
    const records = snapshot.sections.labProjects.projects;
    assert.equal(records.length, 4);
    for (const record of records) {
        assert.ok(['live', 'beta', 'development', 'experimental'].includes(record.status));
        assert.ok(record.title && record.description && record.technologies.length > 0);
    }
});

/* ----------------------------- real-time sync ------------------------------ */

check('anonymous visitors receive namespace, cross-tab and polling refresh signals', () => {
    const src = lab();
    for (const token of [
        'socketService.subscribePublicProjects(refresh)',
        'socketService.subscribePublicLab(refresh)',
        'subscribeProjectsChanged(refresh)',
        "window.addEventListener('settingsChanged', refresh)",
        'document.hidden', 'visibilitychange', '30000'
    ]) assert.ok(src.includes(token), `missing Lab sync: ${token}`);
    assert.doesNotMatch(src, /'skills_changed'|'interests_changed'/);
    assert.match(src, /'lab:changed'/);
});

check('the client subscription is ref-counted and read-only like the other public subscribers', () => {
    const src = read('src/services/socket.service.js');
    assert.match(src, /subscribePublicLab\(callback\)/);
    const block = src.slice(src.indexOf('subscribePublicLab(callback)'), src.indexOf('// Get connection status'));
    assert.match(block, /this\.publicProjectsRefs \+= 1/);
    assert.match(block, /#ensurePublicSocket\(\)/);
    assert.match(block, /socket\.on\('lab:changed', callback\)/);
    assert.match(block, /socket\.off\('lab:changed', callback\)/);
    assert.match(block, /#releasePublicSocket\(\)/);
});

check('skills and interests writes publish only a section name and timestamp', () => {
    const helper = read('server/utils/labEvents.js');
    assert.match(helper, /const LAB_EVENT = 'lab:changed'/);
    assert.match(helper, /\['skills', 'interests', 'projects'\]/);
    assert.match(helper, /io\.of\(PUBLIC_PROJECTS_NAMESPACE\)\.emit\(LAB_EVENT, data\)/);
    assert.match(helper, /io\.emit\(LAB_EVENT, data\)/);
    assert.doesNotMatch(helper, /\b(res\.json|req\.body|password|Authorization|process\.env)\b/);
    const middleware = read('server/middleware/labSync.middleware.js');
    assert.match(middleware, /res\.statusCode < 400 && body\?\.success !== false/);
    assert.match(middleware, /emitLabChanged\(section\)/);
    assert.match(middleware, /return originalJson\(body\)/);
    assert.match(middleware, /catch \{/);
    assert.match(read('server/routes/skills.routes.js'), /router\.use\(labSync\('skills'\)\)/);
    assert.match(read('server/routes/interests.routes.js'), /router\.use\(labSync\('interests'\)\)/);
});

check('dashboard Lab edits publish cross-tab notices and no longer claim instant delivery', () => {
    const src = read('src/components/dashboard/LabManager.jsx');
    assert.match(src, /publishProjectsChanged/);
    assert.equal((src.match(/publishProjectsChanged\(\)/g) || []).length, 3);
    assert.match(src, /live signals, cross-tab notices and its 30-second refresh/);
    assert.doesNotMatch(src, /appear there immediately/);
    assert.match(lab(), /publishProjectsChanged\(\)/);
});

/* --------------------------- copy / data integrity -------------------------- */

check('sample wording is owner-only and zero values stay hidden', () => {
    const src = lab();
    assert.match(src, /\{owner && sample && <span className="lab-sample-badge">/);
    assert.match(src, /value: owner \? sampleCount : 0/);
    assert.match(src, /\.filter\(card => card\.value > 0\)\)/);
    assert.match(src, /project\.views > 0/);
    assert.match(src, /Number\(skill\.level\) > 0/);
    assert.match(src, /f\.count > 0/);
});

check('protected Lab sample files, seed script and NetGate links are untouched', () => {
    const data = json('src/data/labSamples.json');
    assert.equal(data.tag, 'lab-sample');
    assert.equal(data.samples.length, 4);
    for (const sample of data.samples) assert.ok(sample.title.startsWith('[SAMPLE]'));
    assert.equal(read('src/data/labSamples.json').split('https://net-gate-portal.netlify.app/').length - 1, 3);
    const seed = read('server/scripts/seedLabSamples.js');
    assert.match(seed, /--remove/);
    assert.match(seed, /Project\.deleteMany\(\{ tags: LAB_SAMPLE_TAG \}\)/);
    assert.equal(json('src/data/publicSnapshot.json').sections.projects.projects.length, 14);
});

check('no secret, runtime service call or external write was introduced', () => {
    const src = lab() + read('server/utils/labEvents.js') + read('server/middleware/labSync.middleware.js')
        + read('server/routes/skills.routes.js') + read('server/routes/interests.routes.js');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(src, /http:\/\/localhost/);
});

/* ----------------------------------- wiring --------------------------------- */

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:lab-review'], /lab-review\.test\.mjs/);
        assert.match(pkg.scripts.test, /lab-review\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3x\./);
    assert.match(report, /Phase 24/);
});

console.log(`\n${passed} Lab review regression checks passed.`);
