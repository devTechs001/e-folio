/**
 * Regression checks: the verified HomeScape property-marketplace link added as
 * an APPEND-ONLY second entry in the public Projects showcase. Node-only static
 * checks — no DB, no network, no browser, no external service. Confidential:
 * local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const HOMESCAPE = 'https://homescape-pro.netlify.app/';
const CELLARKEEP = 'https://liqourstor.netlify.app/client';
const NEX_STORE = 'https://nex-store-pro.netlify.app/';
const OMNIBIZ = 'https://ominbiz-solution.netlify.app/';
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const showcase = () => json('src/data/projectShowcase.json');
const homescape = () => showcase().projects.find(p => p.slug === 'homescape-property-marketplace');

/* ---------------------------------- data ---------------------------------- */

check('the supplied URL is stored verbatim, once, as a second entry', () => {
    const data = showcase();
    assert.equal(data.projects.length, 2);
    assert.equal(data.projects[0].slug, 'cellarkeep-client-portal');
    assert.equal(data.projects[1].slug, 'homescape-property-marketplace');
    assert.equal(data.projects[1].url, HOMESCAPE);
    assert.equal((read('src/data/projectShowcase.json').match(/homescape-pro\.netlify\.app\//g) || []).length, 1);
    assert.equal(new Set(data.projects.map(p => p.slug)).size, 2);
    assert.equal(new Set(data.projects.map(p => p.url)).size, 2);
});

check('the link is a plain HTTPS URL with no credentials or query', () => {
    const parsed = new URL(HOMESCAPE);
    assert.equal(parsed.protocol, 'https:');
    assert.equal(parsed.username, '');
    assert.equal(parsed.password, '');
    assert.equal(parsed.pathname, '/');
    assert.equal(parsed.search, '');
    assert.equal(parsed.hash, '');
});

check('the description contains only features observed on the live page', () => {
    const project = homescape();
    assert.equal(project.title, 'HomeScape — Property Marketplace');
    assert.equal(project.category, 'Web');
    assert.equal(project.status, 'live');
    assert.equal(project.verifiedAt, '2026-11-03');
    assert.ok(project.features.length >= 3);
    assert.match(project.description, /property marketplace/i);
    assert.match(project.features.join(' '), /seller accounts/i);
    assert.match(project.note, /illustrative examples/i);
});

check('no invented stack, metrics, achievements or security claims', () => {
    const project = homescape();
    assert.deepEqual(project.technologies, []);
    assert.deepEqual(project.securityNotes, []);
    for (const key of ['views', 'likes', 'achievements', 'metrics', 'uptime', 'users', 'orders', 'conversion']) {
        assert.equal(project[key], undefined, `must not fabricate ${key}`);
    }
    assert.doesNotMatch(JSON.stringify(project), /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.doesNotMatch(JSON.stringify(project), /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
});

check('the shared JSON is the single source of truth for the new URL', () => {
    const hits = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (['node_modules', 'dist', '.cache'].includes(entry.name)) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile() && fs.statSync(full).size < 2_000_000) {
                let text;
                try { text = fs.readFileSync(full, 'utf8'); } catch { return; }
                if (text.includes(HOMESCAPE)) hits.push(path.relative(root, full));
            }
        }
    };
    for (const dir of ['src', 'server']) walk(path.join(root, dir));
    assert.deepEqual(hits, ['src/data/projectShowcase.json']);
});

/* -------------------------------- rendering -------------------------------- */

check('both public Projects surfaces still render the shared showcase', () => {
    for (const file of ['src/pages/Projects.jsx', 'src/components/Projects.jsx']) {
        const src = read(file);
        assert.match(src, /import ProjectShowcase from/);
        assert.match(src, /<ProjectShowcase/);
        assert.doesNotMatch(src, /homescape-pro\.netlify\.app/);
    }
});

check('the shared helper filters unsafe links and freezes every project', () => {
    const src = read('src/utils/projectShowcase.js');
    assert.match(src, /import dataset from '\.\.\/data\/projectShowcase\.json'/);
    assert.match(src, /parsed\.protocol === 'https:'/);
    assert.match(src, /!parsed\.username && !parsed\.password/);
    assert.match(src, /filter\(project => isSafeShowcaseUrl\(project\.url\)\)/);
    assert.match(src, /export const PROJECT_SHOWCASE/);
    assert.match(src, /Object\.freeze/);
});

check('cards use per-project labels and render no empty security block', () => {
    const src = read('src/components/ProjectShowcase.jsx');
    assert.match(src, /project\.linkLabel \|\| 'Open project'/);
    assert.match(src, /project\.securityNotes\.length > 0/);
    assert.match(src, /project\.note && <p className="showcase-card__note">/);
    assert.match(src, /showcaseAnchorProps\(project\)/);
    assert.match(src, /data-project-slug=\{project\.slug\}/);
    assert.doesNotMatch(src, /localStorage|Math\.random|dangerouslySetInnerHTML/);
    assert.match(read('src/styles/ProjectShowcase.css'), /showcase-card__note/);
});

check('the grid fits both cards without replacing the existing layout', () => {
    const css = read('src/styles/ProjectShowcase.css');
    assert.match(css, /repeat\(auto-fit, minmax\(280px, 1fr\)\)/);
    assert.match(css, /showcase-grid--compact/);
});

/* --------------------------------- database -------------------------------- */

check('the existing idempotent seeder picks up the appended record unchanged', () => {
    const src = read('server/scripts/seedProjectShowcase.js');
    assert.match(src, /require\('\.\.\/\.\.\/src\/data\/projectShowcase\.json'\)/);
    assert.match(src, /for \(const project of PROJECTS\)/);
    assert.match(src, /\$setOnInsert: doc/);
    assert.match(src, /upsert: true/);
    assert.match(src, /live: project\.url/);
    assert.match(src, /deleteMany\(\{ tags: SHOWCASE_TAG \}\)/);
    assert.doesNotMatch(src, /homescape-pro\.netlify\.app/);
    assert.ok(fs.existsSync(path.join(root, 'server/scripts/seedProjectShowcase.js')));
});

/* --------------------------------- safety ---------------------------------- */

check('every previously published link — especially NetGate — is unchanged', () => {
    const lab = json('src/data/labSamples.json');
    assert.equal(
        lab.samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    assert.ok(read('server/backups/testimonials/testimonial-samples.backup.json').includes(NETGATE));
    assert.match(read('src/utils/nexStore.js'), /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
    assert.equal(showcase().projects[0].url, CELLARKEEP);
    assert.ok(read('src/data/publicSnapshot.json').includes(OMNIBIZ));
    assert.equal((read('src/data/publicSnapshot.json').match(/net-gate-portal\.netlify\.app\//g) || []).length, 3);
    for (const file of [
        'src/data/labSamples.json',
        'src/data/testimonialSamples.json',
        'src/data/publicSnapshot.json'
    ]) {
        assert.doesNotMatch(read(file), /homescape-pro\.netlify\.app/);
    }
});

check('no secret or external write was introduced by this addition', () => {
    for (const file of [
        'src/data/projectShowcase.json',
        'src/components/ProjectShowcase.jsx',
        'src/styles/ProjectShowcase.css'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest|http:\/\/localhost/);
    }
    assert.equal(NEX_STORE, 'https://nex-store-pro.netlify.app/');
    assert.equal(CELLARKEEP, 'https://liqourstor.netlify.app/client');
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:homescape-link'], /homescape-link\.test\.mjs/);
        assert.match(pkg.scripts.test, /homescape-link\.test\.mjs/);
        assert.match(pkg.scripts['seed:showcase'], /seedProjectShowcase\.js/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3n\./);
    assert.match(report, /Phases 3–/);
    assert.ok(report.includes(HOMESCAPE));
});

console.log(`\n${passed} HomeScape link regression checks passed.`);
