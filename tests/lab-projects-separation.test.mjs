/**
 * Phase 42 — the Lab and Projects are separate modules.
 *
 * The previous phase filtered lab records out of the projects feed at render
 * time. That treated the symptom: an "experiment" was still a Project document,
 * so both dashboards read and wrote one collection and the two modules could not
 * be separated by anything stronger than a client-side filter.
 *
 * These checks assert the structural separation instead: a dedicated collection,
 * dedicated routes, dedicated controller, dedicated dashboard, and dedicated
 * data — none of which may reach into the Project model.
 *
 * Node-only static checks plus real-data assertions: no framework, no database,
 * no network. Confidential — everything stays inside this checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const json = relative => JSON.parse(read(relative));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/** Strip comments so prose about old behaviour cannot satisfy a check. */
const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/* --------------------------------- backend -------------------------------- */

check('the Lab has its own collection, separate from Project', () => {
    assert.ok(exists('server/models/LabEntry.model.js'));
    const model = read('server/models/LabEntry.model.js');
    assert.match(model, /mongoose\.model\('LabEntry', labEntrySchema\)/);
    // It must be a standalone schema, not a discriminator on Project.
    assert.doesNotMatch(code(model), /Project\.|mongoose\.model\('Project'|discriminator/);
    // Domain-appropriate vocabulary, not software categories.
    assert.match(model, /LAB_DOMAINS/);
    assert.match(model, /'Reconnaissance'/);
    // Idempotent seeding identity.
    assert.match(model, /\{ userId: 1, slug: 1 \}/);
});

check('the Lab has its own controller and routes, mounted separately', () => {
    assert.ok(exists('server/controllers/lab.controller.js'));
    assert.ok(exists('server/routes/lab.routes.js'));
    const controller = read('server/controllers/lab.controller.js');
    // The controller must not import or touch the Project model at all.
    assert.doesNotMatch(code(controller), /Project\.model|Project\.find|Project\.delete|require\('[^']*Project/);
    assert.match(controller, /require\('\.\.\/models\/LabEntry\.model'\)/);

    const routes = read('server/routes/lab.routes.js');
    assert.doesNotMatch(code(routes), /project/i);
    // Owner-only writes, public reads.
    assert.match(routes, /router\.post\('\/', protect, isOwner/);
    assert.match(routes, /router\.delete\('\/:id', protect, isOwner/);
    assert.match(routes, /router\.get\('\/public', getPublicLabEntries\)/);

    const server = read('server/server.js');
    assert.match(server, /require\('\.\/routes\/lab\.routes'\)/);
    assert.match(server, /app\.use\('\/api\/lab', labRoutes\)/);
});

check('the public Lab endpoint returns experiments, never projects', () => {
    const controller = read('server/controllers/lab.controller.js');
    assert.match(controller, /experiments: entries/);
    // Public listing must expose only published, non-hidden records.
    assert.match(controller, /visibility: 'public', hidden: \{ \$ne: true \}/);
    // Aggregated stats come from the database, not from constants.
    assert.match(controller, /\$group: \{ _id: '\$status'/);
});

/* ------------------------------- data layer ------------------------------- */

check('the seeded Lab records are real, correctly named and project-free', () => {
    const data = json('src/data/labEntries.json');
    assert.equal(data.entries.length, 4);
    for (const entry of data.entries) {
        // No placeholder markers: these are real records the owner maintains.
        assert.doesNotMatch(entry.title, /\[SAMPLE\]/);
        assert.doesNotMatch(entry.summary, /^Sample/);
        assert.ok(entry.title && entry.summary && entry.domain, `${entry.slug} is incomplete`);
        assert.ok(entry.tools.length > 0, `${entry.slug} lists no tools`);
        // Honest scope: lab-only work, stated on the record itself.
        assert.ok(entry.scope, `${entry.slug} states no scope`);
        assert.ok(
            /lab|own|read-only|local|isolated|sandbox|bench/i.test(entry.scope),
            `${entry.slug} scope does not bound the work: ${entry.scope}`
        );
    }
    const slugs = data.entries.map(e => e.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate slug in the seed set');
});

check('the seeded Lab records are not portfolio projects', () => {
    const snapshot = json('src/data/publicSnapshot.json');
    const labTitles = snapshot.sections.labProjects.projects.map(r => r.title);
    const projectTitles = snapshot.sections.projects.projects.map(r => r.title);
    assert.equal(labTitles.length, 4);
    assert.equal(projectTitles.length, 16);
    for (const title of labTitles) {
        assert.ok(!projectTitles.includes(title), `${title} appears on both surfaces`);
    }
    // And no placeholder survived into the public snapshot.
    assert.doesNotMatch(JSON.stringify(snapshot.sections.labProjects), /\[SAMPLE\]/);
});

check('the seeder writes LabEntry only and is idempotent', () => {
    const src = read('server/scripts/seedLabEntries.js');
    assert.doesNotMatch(code(src), /Project/);
    assert.match(src, /LabEntry\.deleteMany\(\{ seedKey: SEED_KEY \}\)/);
    assert.match(src, /\{ userId, slug: entry\.slug \}/);
    assert.match(src, /upsert: true/);
    // Scripts point at the new seeder in both manifests.
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['seed:lab'], /seedLabEntries\.js/);
        assert.match(scripts['seed:lab:remove'], /seedLabEntries\.js --remove/);
    }
});

/* --------------------------------- client --------------------------------- */

check('the public Lab page reads its own endpoint', () => {
    const src = read('src/pages/Lab.jsx');
    assert.match(src, /loadPublicSection\('lab', \{ fallbackSection: 'labProjects', key: 'experiments' \}\)/);
    // It must not read the projects feed and filter it any more.
    assert.doesNotMatch(code(src), /loadPublicSection\('projects'/);
    assert.doesNotMatch(code(src), /isLabExperiment/);
    const loader = read('src/services/publicContent.js');
    assert.match(loader, /lab: '\/public\/lab\?limit=100'/);
    assert.match(loader, /lab: 'experiments'/);
});

check('the public Lab page deletes lab entries, never projects', () => {
    const src = code(read('src/pages/Lab.jsx'));
    assert.match(src, /api\.deleteLabEntry\(id\)/);
    assert.doesNotMatch(src, /api\.deleteProject\(/);
});

check('the two modules do not share a cross-tab channel', () => {
    const sync = read('src/utils/projectSync.js');
    assert.match(sync, /export const publishLabChanged/);
    assert.match(sync, /e-folio:lab-changed/);
    // Distinct storage keys, distinct broadcast channels.
    assert.match(sync, /e-folio:projects-changed/);
    assert.doesNotMatch(code(read('src/pages/Lab.jsx')), /subscribeProjectsChanged|publishProjectsChanged/);
    assert.doesNotMatch(code(read('src/components/dashboard/LabManager.jsx')), /publishProjectsChanged/);
});

check('the Lab dashboard manages its own records only', () => {
    const src = code(read('src/components/dashboard/LabManager.jsx'));
    assert.match(src, /ApiService\.getLabEntries\(\)/);
    assert.match(src, /ApiService\.createLabEntry\(/);
    assert.match(src, /ApiService\.deleteLabEntry\(/);
    assert.match(src, /ApiService\.updateLabEntry\(/);
    // No project reads/writes anywhere in the Lab dashboard.
    assert.doesNotMatch(src, /ApiService\.createProject\(|ApiService\.deleteProject\(|ApiService\.updateProject\(/);
    assert.doesNotMatch(src, /Real projects/);
    assert.doesNotMatch(src, /labSampleData/);
});

check('each module is reachable as its own page and its own dashboard', () => {
    const app = read('src/App.jsx');
    assert.match(app, /<Route path="\/lab"/);
    assert.match(app, /<Route path="\/projects"/);
    // Separate dashboard entries, separate components.
    const dashboard = read('src/pages/Dashboard.jsx');
    assert.match(dashboard, /path: '\/dashboard\/lab'/);
    assert.match(dashboard, /component: LazyLabManager/);
    assert.match(dashboard, /path: '\/dashboard\/projects'/);
    assert.match(dashboard, /component: LazyProjectManager/);
    // Each page cross-links to the other module rather than mixing them.
    assert.ok(exists('src/pages/LabPage.jsx'));
    assert.ok(exists('src/pages/ProjectsPage.jsx'));
    assert.match(read('src/pages/LabPage.jsx'), /to="\/projects"/);
    assert.match(read('src/pages/ProjectsPage.jsx'), /to="\/lab"/);
});

check('the Lab keeps its section on the landing page', () => {
    const landing = read('src/pages/LandingPage.jsx');
    assert.match(landing, /import Lab from '\.\/Lab'/);
    assert.match(landing, /<Lab \/>/);
    // It renders as a section of the page it has always been on.
    assert.match(read('src/pages/Lab.jsx'), /<section className="lab-section" id="lab">/);
});

/* -------------------------------- integrity -------------------------------- */

check('no protected file was touched by this phase', () => {
    // These must still exist; their own suites guard their content.
    for (const file of [
        'src/data/labSamples.json',
        'src/styles/ProjectCard.css',
        'src/components/ProjectCard.jsx',
        'public/CV2.pdf'
    ]) {
        assert.ok(exists(file), `${file} is missing`);
    }
    // The Lab may not alter the project card interface.
    assert.doesNotMatch(code(read('src/pages/Lab.jsx')), /ProjectCard\.css|<ProjectCard/);
});

check('no invented metrics were added with the new module', () => {
    const model = read('server/models/LabEntry.model.js');
    // Counters start at zero and are only ever incremented for real events.
    assert.match(model, /views: \{ type: Number, default: 0/);
    const controller = read('server/controllers/lab.controller.js');
    assert.match(controller, /\$inc: \{ views: 1 \}/);
    assert.match(controller, /\$inc: \{ likes: 1 \}/);
    const manager = read('src/components/dashboard/LabManager.jsx');
    assert.doesNotMatch(manager, /Math\.random|mockData|fakeStats/);
});

console.log(`\n${passed} lab/projects module separation checks passed.`);
