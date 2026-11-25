/**
 * Phase 41 — Projects/Lab separation, duplicate prevention, real analytics,
 * profile realtime sync, owner public links, and the auth-role regression.
 *
 * Node-only static checks plus real execution of the shared classification and
 * dedupe helpers (no network, no database, no browser).
 * Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const lab = await import(path.join(root, 'src/utils/labClassification.js'));
const snapshot = json('src/data/publicSnapshot.json').sections;

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* ---------------------- Projects vs Lab classification -------------------- */

check('the Projects and Lab pages share one classification rule', () => {
    const labPage = read('src/pages/Lab.jsx');
    const projectsPage = read('src/pages/Projects.jsx');
    for (const src of [labPage, projectsPage]) {
        assert.match(src, /from '\.\.\/utils\/labClassification'/);
    }
    // Neither page may keep its own status list.
    assert.doesNotMatch(labPage, /const LAB_STATUSES = \[/);
    assert.doesNotMatch(projectsPage, /const LAB_STATUSES = \[/);
});

check('a live portfolio project is NOT a Lab experiment', () => {
    // The five records that used to leak into the Lab.
    for (const title of ['Portfolio Website', 'Task Management App', 'Social Media Dashboard', 'Blockchain Wallet']) {
        const record = snapshot.projects.projects.find(p => p.title === title);
        assert.ok(record, `${title} missing from the snapshot`);
        assert.equal(lab.isLabExperiment(record), false, `${title} must stay on Projects`);
    }
    // AI Image Generator is `beta` and also belongs to Projects.
    const beta = snapshot.projects.projects.find(p => p.title === 'AI Image Generator');
    assert.equal(lab.isLabExperiment(beta), false);
});

check('every dedicated Lab record IS a Lab experiment', () => {
    for (const record of snapshot.labProjects.projects) {
        assert.equal(lab.isLabExperiment(record), true, `${record.title} must be a Lab experiment`);
    }
});

check('a "Security" tag alone does not make a project an experiment', () => {
    // Task Management App carries tags including "Security".
    const record = { id: 'snapshot-task-management-app', status: 'live', tags: ['Security'] };
    assert.equal(lab.isLabExperiment(record), false);
});

check('the real datasets produce no cross-page overlap', () => {
    const projects = snapshot.projects.projects;
    const labSaved = snapshot.labProjects.projects;

    const portfolio = lab.dedupeProjects(projects.filter(p => !lab.isLabExperiment(p)));
    const labShown = lab.mergeUnique(
        projects.filter(p => lab.isLabExperiment(p)),
        labSaved.filter(p => lab.isLabExperiment(p))
    );

    // The Lab shows exactly its four experiments.
    assert.equal(labShown.length, 4, `Lab shows ${labShown.length} cards`);
    const portfolioTitles = new Set(portfolio.map(p => p.title.trim().toLowerCase()));
    for (const record of labShown) {
        assert.ok(!portfolioTitles.has(record.title.trim().toLowerCase()), `${record.title} appears on both pages`);
    }
    // Projects keeps every non-lab record and no duplicates.
    assert.equal(portfolio.length, 16, `Projects shows ${portfolio.length} cards`);
});

check('identity survives a rebuilt snapshot (id changes, title does not)', () => {
    const live = [{ id: 'mongo-123', title: 'Network Recon Suite', status: 'beta' }];
    const saved = [{ id: 'snapshot-lab-1', title: 'network recon suite ', status: 'beta' }];
    const merged = lab.mergeUnique(live, saved);
    assert.equal(merged.length, 1, 'rebuild must not duplicate the record');
    assert.equal(merged[0].id, 'mongo-123', 'the live record wins');
});

check('dedupe collapses both identical ids and identical titles', () => {
    const records = [
        { id: 'a', title: 'One' },
        { id: 'a', title: 'One (renamed)' },
        { id: 'b', title: 'One' },
        { id: 'c', title: 'Two' }
    ];
    const out = lab.dedupeProjects(records);
    assert.equal(out.length, 2, `expected 2 unique records, got ${out.length}`);
    assert.deepEqual(out.map(r => r.id), ['a', 'c']);
});

check('identity falls back to a title slug when there is no id', () => {
    assert.equal(lab.projectIdentity({ title: 'My Cool Project!' }), 'slug:my-cool-project');
    assert.equal(lab.projectIdentity({ id: 'x-1', title: 'Anything' }), 'id:x-1');
    assert.equal(lab.projectIdentity({}), '');
});

check('malformed records are ignored rather than crashing a page', () => {
    assert.deepEqual(lab.dedupeProjects([null, undefined, {}, 'nope']), []);
    assert.deepEqual(lab.splitProjects(null), { portfolio: [], lab: [] });
    assert.equal(lab.isLabExperiment(null), false);
});

/* ---------------------------- duplicate seeding --------------------------- */

check('the project seeder clears by title as well as by owner', () => {
    const src = read('scripts/seed-projects.js');
    // Clearing only by userId left records created under another account behind,
    // which is how the grid ended up with duplicates.
    assert.match(src, /const byTitle = await Project\.deleteMany\(\{ title: \{ \$in: seedTitles \} \}\);/);
    assert.match(src, /const byOwner = await Project\.deleteMany\(\{ userId: adminUser\._id \}\);/);
    assert.match(src, /byTitle\.deletedCount/);
});

check('the snapshot catalogue itself has no duplicate titles', () => {
    const titles = snapshot.projects.projects.map(p => p.title.trim().toLowerCase());
    assert.equal(new Set(titles).size, titles.length, 'duplicate titles in the snapshot');
});

/* ------------------------------- analytics -------------------------------- */

check('new-vs-returning is measured, not hardcoded', () => {
    const src = read('server/controllers/analytics.controller.js');
    assert.doesNotMatch(src, /newVsReturning: \{ new: 100, returning: 0 \}/);
    assert.match(src, /let newVsReturning = null;/);
    assert.match(src, /const priorVisitors = await TrackingSession\.distinct\('visitorId'/);
    assert.match(src, /const priorUsers = await TrackingSession\.distinct\('userId'/);
    // Unmeasurable must stay null rather than defaulting to a number.
    assert.match(src, /newVsReturning = null; \/\/ measured value unavailable/);
});

check('technical metrics no longer invent 0 / 0 / 100', () => {
    const src = read('server/controllers/analytics.controller.js');
    assert.doesNotMatch(src, /pageSpeed: 0, errorRate: 0, uptime: 100/);
    assert.match(src, /pageSpeed: null, errorRate: null, uptime: null/);
});

check('the analytics UI renders a missing duration as "not measured"', () => {
    const src = read('src/components/dashboard/Analytics.jsx');
    assert.match(src, /const formatSeconds = value => \{/);
    assert.match(src, /if \(value == null \|\| !Number\.isFinite\(numeric\)\) return 'not measured';/);
    assert.doesNotMatch(src, /loadTimes\?\.avg \|\| 0\}s/);
});

/* --------------------------- profile realtime ---------------------------- */

check('the profile socket handler authenticates like its siblings', () => {
    const src = read('server/socket/profile.handler.js');
    assert.match(src, /security\.verifyToken\(token\)/);
    assert.match(src, /socket\.handshake\.auth\?\.token/);
});

check('profile events are scoped to a room, never broadcast', () => {
    const src = read('server/socket/profile.handler.js');
    // io.emit reaches every connected client and leaked profile data.
    assert.doesNotMatch(src, /io\.emit\('profile:updated'/);
    assert.doesNotMatch(src, /io\.emit\('activity:updated'/);
    assert.match(src, /io\.to\(`user:\$\{ownerId\}`\)\.emit\('profile:updated'/);
    assert.match(src, /io\.to\(`user:\$\{ownerId\}`\)\.emit\('activity:updated'/);
});

check('a socket cannot join someone else\'s profile room', () => {
    const src = read('server/socket/profile.handler.js');
    // The room is derived from the verified identity, not the client payload.
    assert.match(src, /if \(!ownerId\) return;\s*\n\s*socket\.join\(`user:\$\{ownerId\}`\)/);
    assert.match(src, /You can only subscribe to your own profile\./);
    // An unauthenticated socket cannot publish an update at all.
    assert.match(src, /Sign in to publish profile updates\./);
});

check('profile counters refresh instead of freezing after first load', () => {
    const src = read('src/components/dashboard/Profile.jsx');
    assert.match(src, /const refreshStats = async \(\) => \{/);
    assert.match(src, /const timer = setInterval\(\(\) => \{/);
    assert.match(src, /document\.addEventListener\('visibilitychange', onVisible\)/);
    // A failed refresh must not zero the existing values.
    assert.match(src, /Leave the last known values in place; do not zero them out\./);
});

/* ----------------------------- owner public links ------------------------- */

check('the owner session carries the username the public links need', () => {
    const src = read('server/routes/auth.routes.js');
    // Anchor on the owner session block specifically (several handlers build a
    // `user:` object, so a plain indexOf finds the wrong one).
    const anchor = src.indexOf('username: ownerUser?.username');
    assert.ok(anchor > 0, 'owner session does not carry a username');
    const block = src.slice(anchor - 300, anchor + 200);
    assert.match(block, /username: ownerUser\?\.username \|\| ''/);
    assert.match(block, /role: 'owner'/);
    // It must sit inside the object buildOwnerSession returns.
    assert.match(src, /const ownerId = ownerUser \? ownerUser\._id\.toString\(\)/);
});

check('portfolio links can no longer render "undefined"', () => {
    const src = read('src/components/dashboard/PortfolioEditorStyled.jsx');
    assert.doesNotMatch(src, /\/portfolio\/\$\{user\?\.username\}/);
    // The safe helper returns '' for a missing username and is guarded before use.
    assert.match(src, /import \{ publicUserLinks \} from '\.\.\/\.\.\/utils\/userWorkspace';/);
    assert.match(src, /const href = publicUserLinks\(user\?\.username\)\.portfolio; if \(href\) window\.open\(href/);

    const helper = read('src/utils/userWorkspace.js');
    assert.match(helper, /portfolio: slug \? `\/portfolio\/\$\{slug\}` : ''/);
});

/* ---------------------------- auth role regression ------------------------ */

check('isOwner is literal owner-only again', () => {
    const src = read('server/middleware/auth.middleware.js');
    assert.match(src, /exports\.isOwner = \(req, res, next\) => \{\s*if \(req\.user\?\.role !== 'owner'\)/);
    // The admin allowance from 49f6ae5 must not come back. Scope the check to
    // the isOwner export: `hasPermission` legitimately treats admin as elevated
    // and must not be caught by this assertion.
    const isOwnerBlock = src.slice(
        src.indexOf('exports.isOwner'),
        src.indexOf('exports.isAuthorized')
    );
    assert.ok(isOwnerBlock.length > 0, 'isOwner block not found');
    assert.doesNotMatch(isOwnerBlock, /\['owner', 'admin'\]/);
});

check('an admin session never receives the owner menu', () => {
    const src = read('src/utils/authRoles.js');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.match(code, /if \(normalized === ADMIN_ROLE\) return \[ADMIN_ROLE, USER_ROLE\];/);
    assert.doesNotMatch(code, /normalized === OWNER_ROLE \|\| normalized === ADMIN_ROLE\) return \[OWNER_ROLE\]/);
});

check('the auth regression tests assert the strict behaviour', () => {
    const admin = read('tests/admin-login-links.test.mjs');
    assert.match(admin, /assert\.deepEqual\(rolesForMenu\('admin'\), \[ADMIN_ROLE, USER_ROLE\]\)/);
    assert.match(admin, /assert\.ok\(!rolesForMenu\('admin'\)\.includes\(OWNER_ROLE\)\)/);
    assert.match(admin, /admin is never silently promoted to owner/);
});

/* --------------------------------- safety -------------------------------- */

check('no secret or outbound call was introduced', () => {
    for (const file of [
        'src/utils/labClassification.js',
        'src/pages/Projects.jsx',
        'src/pages/Lab.jsx',
        'server/socket/profile.handler.js'
    ]) {
        assert.doesNotMatch(read(file), /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    }
});

check('the protected NetGate link is untouched', () => {
    const samples = json('src/data/labSamples.json');
    const netgate = samples.samples.find(s => s.title.includes('Network Recon Suite'));
    assert.equal(netgate.links.live, 'https://net-gate-portal.netlify.app/');
});

check('the new test is wired into both manifests and the report', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:projects-lab-sync'], /projects-lab-sync\.test\.mjs/);
        assert.match(pkg.scripts.test, /test:projects-lab-sync/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3an\./);
});

console.log(`\n${passed} projects/lab sync regression checks passed.`);
