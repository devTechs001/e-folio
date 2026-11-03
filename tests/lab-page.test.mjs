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

check('public data pages keep honest empty/error states', () => {
    for (const file of [
        'src/pages/Projects.jsx',
        'src/pages/Skills.jsx',
        'src/pages/Interests.jsx'
    ]) {
        const src = read(file);
        assert.match(src, /loadError/, `${file} must surface load failures`);
        assert.match(src, /set\w*\(\[\]\)|setInterests\(\[\]\)/);
    }
});

check('Lab page reads the three real dashboard-backed endpoints', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /Promise\.allSettled\(\[/);
    assert.match(src, /\/public\/projects\?status=all&limit=100/);
    assert.match(src, /\/public\/skills/);
    assert.match(src, /\/public\/interests/);
    assert.match(src, /setDataStatus/);
    assert.match(src, /lab-source-\$\{dataStatus\}/);
    const css = read('src/styles/Lab.css');
    for (const state of ['live', 'partial', 'unavailable']) {
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

check('Lab page marks samples and lets the owner delete them', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /LAB_SAMPLE_TAG = 'lab-sample'/);
    assert.match(src, /lab-sample-badge/);
    assert.match(src, /api\.deleteProject\(id\)/);
    assert.match(src, /Delete sample/);
    assert.doesNotMatch(src, /FALLBACK_LAB/);
});

check('seed script creates only tagged samples and can remove exactly those', () => {
    const src = read('server/scripts/seedLabSamples.js');
    assert.match(src, /require\('..\/..\/src\/data\/labSamples\.json'\)/);
    assert.match(src, /--remove/);
    assert.match(src, /Project\.deleteMany\(\{ tags: LAB_SAMPLE_TAG \}\)/);
    assert.match(src, /tags: \[LAB_SAMPLE_TAG, \.\.\.sample\.tags\]/);
    assert.doesNotMatch(src, /507f1f77bcf86cd799439011/);
    assert.doesNotMatch(src, /process\.env\.MONGODB_URI\s*\|\|\s*['"][^'"]*:[^'"]*@/);
});

check('sample seeding/removal is exposed as npm scripts', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = JSON.parse(read(file)).scripts;
        assert.match(scripts['seed:lab'] || '', /seedLabSamples\.js/);
        assert.match(scripts['seed:lab:remove'] || '', /seedLabSamples\.js --remove/);
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

check('Lab dashboard can add and delete only sample experiments', () => {
    const src = read('src/components/dashboard/LabManager.jsx');
    assert.match(src, /ApiService\.createProject\(/);
    assert.match(src, /ApiService\.deleteProject\(/);
    assert.match(src, /Add sample experiments/);
    assert.match(src, /Delete all samples/);
    assert.match(src, /const isSample = /);
    assert.match(src, /dashboard\/skills/);
    assert.match(src, /dashboard\/hobbies/);
    assert.match(src, /dashboard\/projects/);
});

check('Lab page links back to its dashboard', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /to="\/dashboard\/lab"/);
    assert.match(src, /to="\/dashboard\/projects"/);
    assert.match(src, /to="\/dashboard\/skills"/);
    assert.match(src, /to="\/dashboard\/hobbies"/);
});

console.log(`\n${passed} lab/dashboard regression checks passed.`);
