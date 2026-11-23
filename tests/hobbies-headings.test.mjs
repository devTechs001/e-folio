/**
 * Phase 35 — centred public headings + the hobbies dashboard and endpoints.
 *
 * Static checks only: reads source files and asserts the contracts the app and
 * the server rely on. No browser, database or network access.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let failures = 0;
let count = 0;

function check(name, fn) {
    count += 1;
    try {
        fn();
        console.log(`  ok  ${name}`);
    } catch (error) {
        failures += 1;
        console.error(`  FAIL  ${name}`);
        console.error(`        ${error.message}`);
    }
}

/* ------------------------------------------------ shared heading --- */

check('one shared heading component carries the animated decoration', () => {
    const src = read('src/components/SectionHeading.jsx');
    assert.match(src, /sec-head__line/);
    assert.match(src, /sec-head__dot--left/);
    assert.match(src, /sec-head__dot--right/);
    assert.match(src, /sec-head__accent/);
    // The accessible name must be the whole title, not a fragment.
    assert.match(src, /const before = index > -1 \? text\.slice\(0, index\) : text;/);
    assert.match(src, /accent = '',/);
});

check('the heading decoration animates and respects reduced motion', () => {
    const css = read('src/styles/SectionHeading.css');
    assert.match(css, /@keyframes secHeadLineGlow/);
    assert.match(css, /@keyframes secHeadDotPulse/);
    assert.match(css, /@keyframes secHeadGradient/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    // Every animated selector is switched off in that block.
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    assert.match(block, /\.sec-head__line,\s*\.sec-head__dot\s*\{\s*animation: none;/);
    // Font size increases across breakpoints from the old 4xl/5xl baselines.
    assert.match(css, /\.sec-head__title \{\s*margin: 0;[\s\S]*?font-size: 2\.25rem;/);
    assert.match(css, /@media \(min-width: 1280px\) \{\s*\.sec-head__title \{\s*font-size: 4rem;/);
});

check('every public page uses the shared centred heading', () => {
    for (const page of ['Education', 'Projects', 'Contact', 'Lab', 'Interests', 'Testimonials', 'About']) {
        const src = read(`src/pages/${page}.jsx`);
        assert.match(src, /import SectionHeading from '\.\.\/components\/SectionHeading'/, `${page} does not import it`);
        assert.match(src, /<SectionHeading/, `${page} does not render it`);
    }
});

check('the hobbies page keeps the same wording and its stats', () => {
    const src = read('src/pages/Interests.jsx');
    assert.match(src, /text="Hobbies & Interests"/);
    assert.match(src, /accent="Interests"/);
    assert.match(src, /stat-mini-value/);
    // The bespoke decoration markup is gone; the shared one replaced it.
    assert.doesNotMatch(src, /className="title-decoration"/);
});

check('the About heading stays left-aligned in its two-column hero', () => {
    const css = read('src/styles/About.css');
    assert.match(css, /\.about-section \.about-heading \{\s*align-items: center;/);
    assert.match(css, /@media \(min-width: 1024px\) \{\s*\.about-section \.about-heading \{\s*align-items: flex-start;/);
    const src = read('src/pages/About.jsx');
    // The page still owns exactly one h1: the 3D wordmark.
    assert.match(src, /<WelcomeTag3D text=\{ABOUT_WELCOME_3D\} as="h1" \/>/);
});

/* --------------------------------------------- hobbies endpoints --- */

check('the hobbies router keeps its guards and its literal routes first', () => {
    const src = read('server/routes/interests.routes.js');
    assert.match(src, /router\.use\(auth\)/);
    assert.match(src, /router\.use\(isOwner\)/);
    assert.match(src, /router\.use\(labSync\('interests'\)\)/);

    // Literal paths must be registered before `/:id`, or Express reads them as ids.
    const stats = src.indexOf("router.get('/stats'");
    const exported = src.indexOf("router.get('/export'");
    const reorder = src.indexOf("router.post('/reorder'");
    const imported = src.indexOf("router.post('/import'");
    const byId = src.indexOf("router.route('/:id')");
    assert.ok(stats > -1 && exported > -1 && reorder > -1 && imported > -1, 'a route is missing');
    assert.ok(stats < byId && exported < byId && reorder < byId && imported < byId, 'literal route after /:id');
});

check('hidden hobbies never reach the public endpoint', () => {
    const src = read('server/controllers/interests.controller.js');
    // The public query filters hidden records...
    assert.match(src, /exports\.getPublicInterests = asyncHandler\(async \(req, res\) => \{[\s\S]*?visible: \{ \$ne: false \}/);
    // ...and the public mapper never emits visibility or internal ordering.
    const mapper = src.slice(src.indexOf('function forPublic'), src.indexOf('const sortForOwner'));
    assert.doesNotMatch(mapper, /visible/);
    assert.doesNotMatch(mapper, /order/);
});

check('the controller validates and normalises what it writes', () => {
    const src = read('server/controllers/interests.controller.js');
    assert.match(src, /function pickWritable/);
    assert.match(src, /function normaliseTags/);
    // A plain edit must not be able to move a hobby in the manual order.
    assert.match(src, /delete payload\.order/);
    // New hobbies append rather than defaulting to 0.
    assert.match(src, /payload\.order = last && Number\.isFinite\(last\.order\) \? last\.order \+ 1 : 0;/);
    assert.match(src, /if \(source\.length > 200\)/);
});

check('the model gained ordered, visibility, tags and year fields', () => {
    const src = read('server/models/Interests.js');
    assert.match(src, /order: \{\s*type: Number,\s*default: 0\s*\}/);
    assert.match(src, /visible: \{\s*type: Boolean,\s*default: true\s*\}/);
    assert.match(src, /tags: \{\s*type: \[String\],\s*default: \[\]\s*\}/);
    assert.match(src, /startedYear: \{/);
    assert.match(src, /interestsSchema\.index\(\{ order: 1, createdAt: 1 \}\)/);
    assert.match(src, /interestsSchema\.index\(\{ visible: 1 \}\)/);
});

check('reorder rejects unknown ids instead of failing the whole save', () => {
    const src = read('server/controllers/interests.controller.js');
    const block = src.slice(src.indexOf('exports.reorderInterests'), src.indexOf('exports.setInterestVisibility'));
    assert.match(block, /const valid = new Set\(known\.map\(doc => String\(doc\._id\)\)\)/);
    assert.match(block, /\.filter\(item => item && valid\.has\(String\(item\.id\)\)\)/);
    assert.match(block, /await Interests\.bulkWrite\(updates\)/);
});

check('export and import round-trip the writable fields', () => {
    const src = read('server/controllers/interests.controller.js');
    const exported = src.slice(src.indexOf('exports.exportInterests'), src.indexOf('exports.importInterests'));
    for (const field of ['name', 'description', 'category', 'level', 'icon', 'color', 'visible', 'tags', 'startedYear']) {
        assert.match(exported, new RegExp(`${field}: item\\.${field}`), `export drops ${field}`);
    }
    // Ids are per-database and must not travel.
    assert.doesNotMatch(exported, /_id: item\._id/);
});

/* ------------------------------------------------ api + dashboard --- */

check('the dashboard reads the owner list, not the public one', () => {
    const api = read('src/services/api.service.js');
    assert.match(api, /async getInterests\(params\) \{\s*return this\.request\('\/interests', \{ params \}\);[\s\S]*?\}/);
    assert.match(api, /async getPublicInterests\(\)/);
    for (const method of ['getInterestStats', 'setInterestVisibility', 'reorderInterests', 'exportInterests', 'importInterests']) {
        assert.match(api, new RegExp(`async ${method}\\(`), `${method} missing`);
    }
});

check('the manager keeps every existing action and adds the new ones', () => {
    const src = read('src/components/dashboard/HobbiesManager.jsx');
    // Existing behaviour that must not regress.
    assert.match(src, /<DashboardLayout/);
    assert.match(src, /Add Hobby/);
    assert.match(src, /Edit Hobby/);
    assert.match(src, /Delete Hobby\?/);
    assert.match(src, /Search hobbies, tags, categories/);
    assert.match(src, /const handleAdd = async/);
    assert.match(src, /const handleEdit = async/);
    assert.match(src, /const handleDelete = async/);
    // New behaviour.
    assert.match(src, /const toggleVisibility = async/);
    assert.match(src, /const persistOrder = async/);
    assert.match(src, /const handleImportFile = async/);
    assert.match(src, /onDrop=\{\(\) => handleDrop\(interest\.id\)\}/);
    assert.match(src, /Save order/);
});

check('reordering is explicit: nothing saves until the owner presses Save', () => {
    const src = read('src/components/dashboard/HobbiesManager.jsx');
    // Local moves mark the list dirty...
    assert.match(src, /setOrderDirty\(true\);/);
    // ...and the API call only lives inside persistOrder.
    const calls = src.match(/ApiService\.reorderInterests\(/g) || [];
    assert.equal(calls.length, 1);
    assert.match(src, /discardOrder[\s\S]{0,120}loadInterests\(\)/);
});

check('the dashboard never shows raw backend or stack text to the owner', () => {
    const src = read('src/components/dashboard/HobbiesManager.jsx');
    assert.doesNotMatch(src, /err\.stack/);
    assert.doesNotMatch(src, /MongoServerError|ECONNREFUSED/);
    // Errors are routed through the notification system, always with a
    // fallback sentence so an empty message never produces a blank toast.
    assert.match(src, /setError\(err\.message \|\| 'Failed to load interests'\)/);
    assert.match(src, /showError\(err\.message \|\| 'Failed to add hobby'\)/);
    assert.match(src, /showError\(err\.message \|\| 'Failed to delete hobby'\)/);
});

check('the public page filters by the new tags and shows the year', () => {
    const src = read('src/pages/Interests.jsx');
    assert.match(src, /interests\.flatMap\(int => \[int\.category, \.\.\.\(Array\.isArray\(int\.tags\) \? int\.tags : \[\]\)\]\)/);
    assert.match(src, /int\.tags\.includes\(activeCategory\)/);
    assert.match(src, /interest\.startedYear && \(/);
    const css = read('src/styles/Interests.css');
    assert.match(css, /\.interest-since \{/);
});

/* ------------------------------------------------ test wiring --- */

check('the new test is wired into both package manifests', () => {
    const rootPkg = JSON.parse(read('package.json'));
    const serverPkg = JSON.parse(read('server/package.json'));
    assert.match(rootPkg.scripts['test:hobbies-headings'], /tests\/hobbies-headings\.test\.mjs/);
    assert.match(serverPkg.scripts['test:hobbies-headings'], /\.\.\/tests\/hobbies-headings\.test\.mjs/);
    assert.match(rootPkg.scripts.test, /test:hobbies-headings/);
    assert.match(serverPkg.scripts.test, /test:hobbies-headings/);
});

check('the report documents this phase', () => {
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3ah\./);
});

console.log(`\n${count} heading / hobbies dashboard regression checks ${failures ? 'FAILED' : 'passed'}.`);
if (failures) process.exit(1);
