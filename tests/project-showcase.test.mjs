/**
 * Regression checks: the verified CellarKeep client-portal link added to the
 * public Projects section. Node-only static checks — no DB, no network, no
 * browser and no external service. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const URL = 'https://liqourstor.netlify.app/client';
let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/* ---------------------------------- data ---------------------------------- */

check('the new project link is stored exactly once in the shared JSON', () => {
    const data = json('src/data/projectShowcase.json');
    assert.equal(data.projects.length, 1);
    assert.equal(data.projects[0].url, URL);
    assert.equal(data.projects[0].slug, 'cellarkeep-client-portal');
    assert.equal(data.projects[0].title, 'CellarKeep — Client Portal');
    assert.equal(data.projects[0].category, 'Web');
    assert.equal(data.projects[0].status, 'live');
    assert.equal((read('src/data/projectShowcase.json').match(/liqourstor\.netlify\.app\/client/g) || []).length, 1);
});

check('no invented stack, statistics or achievements are attached to the link', () => {
    const project = json('src/data/projectShowcase.json').projects[0];
    assert.deepEqual(project.technologies, []);
    for (const key of ['views', 'likes', 'achievements', 'metrics', 'uptime', 'users', 'order']) {
        assert.equal(project[key], undefined, `must not fabricate ${key}`);
    }
    assert.match(project.description, /loyalty club/i);
    assert.ok(project.securityNotes.length >= 3);
    assert.ok(project.features.length >= 3);
});

/* --------------------------------- rendering ------------------------------- */

check('the showcase helper renders only safe absolute HTTPS links', () => {
    const src = read('src/utils/projectShowcase.js');
    assert.match(src, /parsed\.protocol === 'https:'/);
    assert.match(src, /!parsed\.username && !parsed\.password/);
    assert.match(src, /new URL\(url\)/);
    assert.match(src, /filter\(project => isSafeShowcaseUrl\(project\.url\)\)/);
    assert.match(src, /export const PROJECT_SHOWCASE/);
    assert.match(src, /export const SHOWCASE_TAG/);
});

check('external anchors use safe rel/target/referrer attributes', () => {
    const src = read('src/utils/projectShowcase.js');
    assert.match(src, /target: '_blank'/);
    assert.match(src, /rel: 'noopener noreferrer'/);
    assert.match(src, /referrerPolicy: 'no-referrer'/);
    const card = read('src/components/ProjectShowcase.jsx');
    assert.match(card, /showcaseAnchorProps\(project\)/);
    assert.match(card, /data-project-slug=\{project\.slug\}/);
    assert.doesNotMatch(card, /localStorage|Math\.random|dangerouslySetInnerHTML/);
});

check('both public Projects surfaces render the shared showcase', () => {
    for (const file of ['src/pages/Projects.jsx', 'src/components/Projects.jsx']) {
        const src = read(file);
        assert.match(src, /import ProjectShowcase from/);
        assert.match(src, /<ProjectShowcase/);
    }
    assert.match(read('src/components/Projects.jsx'), /<ProjectShowcase compact \/>/);
});

check('the card has a real copy action and an offline hint', () => {
    const src = read('src/components/ProjectShowcase.jsx');
    assert.match(src, /navigator\.clipboard\.writeText/);
    assert.match(src, /showcaseShareUrl\(project\)/);
    assert.match(src, /addEventListener\('online'/);
    assert.match(src, /addEventListener\('offline'/);
    assert.match(src, /clearTimeout\(timer\)/);
    assert.ok(fs.existsSync(path.join(root, 'src/styles/ProjectShowcase.css')));
});

/* --------------------------------- database -------------------------------- */

check('the idempotent seeder reads the same shared JSON file', () => {
    const src = read('server/scripts/seedProjectShowcase.js');
    assert.match(src, /require\('\.\.\/\.\.\/src\/data\/projectShowcase\.json'\)/);
    assert.match(src, /\$setOnInsert: doc/);
    assert.match(src, /upsert: true/);
    assert.match(src, /views: 0/);
    assert.match(src, /likes: 0/);
    assert.match(src, /visibility: 'public'/);
    assert.match(src, /live: project\.url/);
});

check('removal is strictly scoped to this tag and never touches real records', () => {
    const src = read('server/scripts/seedProjectShowcase.js');
    assert.match(src, /deleteMany\(\{ tags: SHOWCASE_TAG \}\)/);
    assert.match(src, /--remove/);
    assert.match(src, /Existing project records were not touched/);
    assert.doesNotMatch(src, /deleteMany\(\{\s*\}\)|dropDatabase|Project\.deleteMany\(\{ title/);
});

check('both package scripts expose the seeder and the regression test', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['seed:showcase'], /seedProjectShowcase\.js/);
        assert.match(pkg.scripts['seed:showcase:remove'], /--remove/);
        assert.match(pkg.scripts['test:project-showcase'], /project-showcase\.test\.mjs/);
        assert.match(pkg.scripts.test, /project-showcase\.test\.mjs/);
    }
});

/* --------------------------------- safety ---------------------------------- */

check('existing project links — especially NetGate — are unchanged', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        'https://net-gate-portal.netlify.app/'
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    assert.match(read('src/utils/nexStore.js'), /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
});

check('no secrets, localhost calls or external writes in the new files', () => {
    for (const file of [
        'src/data/projectShowcase.json',
        'src/utils/projectShowcase.js',
        'src/components/ProjectShowcase.jsx',
        'server/scripts/seedProjectShowcase.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /http:\/\/localhost|ws:\/\/localhost/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest/);
    }
    assert.match(read('server/scripts/seedProjectShowcase.js'), /credential value leaves the checkout/);
});

check('the confidential report documents this addition', () => {
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3k\./);
    assert.ok(report.includes(URL));
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} project-showcase regression checks passed.`);
