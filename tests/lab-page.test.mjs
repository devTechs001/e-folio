/**
 * Regression tests for the Lab page <-> dashboard integration.
 * Node-only static checks: no framework, no database, no network.
 * Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const LAB_STATUSES = ['live', 'beta', 'development', 'experimental'];

/* ------------------------------------------------------- real data only --- */

check('public projects, skills and hobbies pages no longer fabricate fallback data', () => {
    for (const file of [
        'src/pages/Projects.jsx',
        'src/pages/Skills.jsx',
        'src/pages/Interests.jsx',
        'src/pages/Lab.jsx'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /getFallback\w*\(/, `${file} still has a fallback generator`);
        assert.doesNotMatch(src, /picsum\.photos|unsplash\.com/, `${file} still has stock placeholders`);
    }
});

check('public data pages stay populated with saved copies and friendly copy', () => {
    for (const file of [
        'src/pages/Projects.jsx',
        'src/pages/Skills.jsx',
        'src/pages/Interests.jsx'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /loadError/, `${file} must not show technical errors`);
        assert.match(src, /loadPublicSection\(/, `${file} must use the live-first loader`);
        assert.match(src, /publicEmptyCopy|ArchiveNote/, `${file} must use friendly copy`);
    }
});

check('Lab page reads its OWN endpoint, plus skills and hobbies', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /Promise\.all\(\[/);
    // Phase 42: the Lab is a separate module. It must NOT read the projects
    // feed and filter it — that is what made the two modules share records.
    assert.match(src, /loadPublicSection\('lab', \{ fallbackSection: 'labProjects', key: 'experiments' \}\)/);
    assert.doesNotMatch(src, /loadPublicSection\('projects'/);
    // It still legitimately shows skills and hobbies from their own endpoints.
    assert.match(src, /loadPublicSection\('skills'\)/);
    assert.match(src, /loadPublicSection\('interests'\)/);
    const loader = read('src/services/publicContent.js');
    assert.match(loader, /\/public\/lab\?limit=100/);
    assert.match(loader, /\/public\/skills/);
    assert.match(loader, /\/public\/interests/);
    assert.match(src, /setDataStatus/);
    assert.match(src, /lab-source-\$\{dataStatus\}/);
    const css = read('src/styles/Lab.css');
    for (const state of ['live', 'partial', 'unavailable', 'archive']) {
        assert.match(css, new RegExp(`.lab-source-${state}\\b`));
    }
});

check('Lab page exposes real skills and hobbies sections', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /skillGroups/);
    assert.match(src, /lab-skill-bar/);
    assert.match(src, /lab-hobby-grid/);
    assert.match(src, /Real data · Skills/);
    assert.match(src, /Real data · Hobbies/);
});

/* --------------------------------------------------------- sample data --- */

check('shared sample dataset is clearly labelled and disposable', () => {
    assert.ok(exists('src/data/labSamples.json'));
    const data = JSON.parse(read('src/data/labSamples.json'));
    assert.equal(data.tag, 'lab-sample');
    assert.ok(Array.isArray(data.samples) && data.samples.length >= 3);
    for (const sample of data.samples) {
        assert.ok(sample.title.startsWith('[SAMPLE]'), `${sample.title} is not labelled as a sample`);
        assert.ok(LAB_STATUSES.includes(sample.status), `${sample.status} is not a lab status`);
        assert.ok(sample.description.includes('Sample'), `${sample.title} description is not marked sample`);
        assert.ok(!JSON.stringify(sample).includes('picsum'), 'samples must not reference stock images');
    }
});

check('Lab page deletes LAB entries, never portfolio projects', () => {
    const src = read('src/pages/Lab.jsx');
    // Phase 42: the Lab has its own records and its own delete call. Deleting
    // from the Lab must not touch the Project collection.
    assert.match(src, /api\.deleteLabEntry\(id\)/);
    assert.doesNotMatch(src, /api\.deleteProject\(id\)/);
    assert.match(src, /lab-sample-badge/);
    assert.match(src, /Delete experiment/);
    assert.doesNotMatch(src, /Delete sample/);
    assert.doesNotMatch(src, /FALLBACK_LAB/);
});

check('lab seeder writes only LabEntry records and can remove exactly those', () => {
    const src = read('server/scripts/seedLabEntries.js');
    assert.match(src, /require\('..\/..\/src\/data\/labEntries\.json'\)/);
    assert.match(src, /require\('\.\.\/models\/LabEntry\.model'\)/);
    // The whole point: seeding the Lab must never create a Project document.
    assert.doesNotMatch(src, /Project\./);
    assert.match(src, /--remove/);
    assert.match(src, /LabEntry\.deleteMany\(\{ seedKey: SEED_KEY \}\)/);
    // Idempotent by slug, so a reseed cannot duplicate a record.
    assert.match(src, /\{ userId, slug: entry\.slug \}/);
    assert.match(src, /upsert: true/);
    assert.doesNotMatch(src, /507f1f77bcf86cd799439011/);
    assert.doesNotMatch(src, /process\.env\.MONGODB_URI\s*\|\|\s*['"][^'"]*:[^'"]*@/);
});

check('sample seeding/removal is exposed as npm scripts', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = JSON.parse(read(file)).scripts;
        assert.match(scripts['seed:lab'] || '', /seedLabEntries\.js/);
        assert.match(scripts['seed:lab:remove'] || '', /seedLabEntries\.js --remove/);
    }
});

check('project validation accepts the experimental lab status', () => {
    const src = read('server/routes/projects.routes.js');
    assert.match(src, /'development', 'experimental'\]/);
});

/* ------------------------------------------------------------ dashboard --- */

check('Lab dashboard page is registered in the dashboard menu', () => {
    const src = read('src/pages/Dashboard.jsx');
    assert.match(src, /import\('\.\.\/components\/dashboard\/LabManager'\)/);
    assert.match(src, /path: '\/dashboard\/lab'/);
    assert.match(src, /component: LazyLabManager/);
    assert.ok(exists('src/components/dashboard/LabManager.jsx'));
});

check('Lab dashboard manages LabEntry records only, not projects', () => {
    const src = read('src/components/dashboard/LabManager.jsx');
    // Phase 42: the Lab dashboard reads and writes its own collection through
    // its own API. It must not list, count or delete portfolio projects.
    assert.match(src, /ApiService\.getLabEntries\(\)/);
    assert.match(src, /ApiService\.getLabStats\(\)/);
    assert.match(src, /ApiService\.createLabEntry\(/);
    assert.match(src, /ApiService\.deleteLabEntry\(/);
    assert.doesNotMatch(src, /ApiService\.createProject\(/);
    assert.doesNotMatch(src, /ApiService\.deleteProject\(/);
    // The misleading "Real projects" counter is gone — projects are not this
    // dashboard's data.
    assert.doesNotMatch(src, /Real projects/);
    assert.doesNotMatch(src, /labSampleData/);
    // Navigation to the separate Projects module is still offered.
    assert.match(src, /dashboard\/projects/);
    assert.match(src, /to="\/lab"/);
});

check('Lab page links back to its dashboard', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /to="\/dashboard\/lab"/);
    assert.match(src, /to="\/dashboard\/projects"/);
    assert.match(src, /to="\/dashboard\/skills"/);
    assert.match(src, /to="\/dashboard\/hobbies"/);
});

console.log(`\n${passed} lab/dashboard regression checks passed.`);
