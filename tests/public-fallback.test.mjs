/**
 * Regression checks: public pages stay free of developer/technical wording and
 * fall back to bundled local data when the live API cannot supply a section.
 * Node-only static checks — no DB, no network, no browser, no external service.
 * Confidential: local checkout only.
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

const PUBLIC_FILES = [
    'src/pages/Projects.jsx',
    'src/pages/Skills.jsx',
    'src/pages/Interests.jsx',
    'src/pages/Education.jsx',
    'src/pages/Testimonials.jsx',
    'src/pages/Lab.jsx',
    'src/pages/LoginPage.jsx',
    'src/pages/RegisterPage.jsx',
    'src/pages/AcceptInvite.jsx',
    'src/components/CollaborationRequestStyled.jsx',
    'src/components/ArchiveNote.jsx',
    'src/components/ProjectShowcase.jsx'
];

const TECHNICAL = /temporarily unavailable|please try again later|server is offline|backend is running|request failed with status|data unavailable|database data|HTML error page|status\s*[45]\d\d|ECONNREFUSED|ensure the backend/i;

/* ---------------------------------- data ---------------------------------- */

check('the bundled snapshot has six non-empty sections built from local files', () => {
    const snapshot = json('src/data/publicSnapshot.json');
    assert.equal(Object.keys(snapshot.sections).length, 6);
    for (const [name, section] of Object.entries(snapshot.sections)) {
        assert.equal(section.success, true, `${name} must be usable`);
        assert.ok(section.count > 0, `${name} must not be empty`);
    }
    assert.ok(snapshot.sources.length >= 4);
    for (const source of snapshot.sources) {
        assert.ok(exists(source), `snapshot source ${source} must exist`);
    }
    assert.match(snapshot.description, /Live data always wins/i);
});

check('snapshot values are verbatim from the local backup and seed files', () => {
    const snapshot = json('src/data/publicSnapshot.json');
    const backup = json('server/backups/testimonials/original-fallback-testimonials.json');
    assert.equal(snapshot.sections.testimonials.testimonials.length, backup.length);
    assert.equal(snapshot.sections.testimonials.testimonials[0].name, backup[0].name);
    assert.equal(snapshot.sections.testimonials.testimonials[0].content, backup[0].content);

    const seed = read('server/seed-data.js');
    for (const skill of snapshot.sections.skills.skills.slice(0, 4)) {
        assert.ok(seed.includes(skill.name), `${skill.name} must come from the seed file`);
    }
    const projectsSeed = read('scripts/seed-projects.js');
    const seedLikes = new Map(
        [...projectsSeed.matchAll(/title:\s*"([^"]+)"[\s\S]*?likes:\s*(\d+)/g)]
            .map(match => [match[1], Number(match[2])])
    );
    for (const project of snapshot.sections.projects.projects) {
        assert.ok(projectsSeed.includes(project.title), `${project.title} must come from the seed file`);
        assert.equal(project.views, 0);
        // Owner-specified display values are carried over from the seed file.
        assert.equal(project.likes, seedLikes.get(project.title));
    }
    const lab = json('src/data/labSamples.json');
    assert.equal(snapshot.sections.labProjects.projects.length, lab.samples.length);
    assert.doesNotMatch(snapshot.sections.labProjects.projects[0].title, /\[SAMPLE\]/);
});

check('the NetGate link and its source files are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        'https://net-gate-portal.netlify.app/'
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, 'https://net-gate-portal.netlify.app/');
    assert.match(read('src/utils/nexStore.js'), /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
});

/* --------------------------------- loading --------------------------------- */

check('publicContent tries the live API first and flags the saved copy', () => {
    const src = read('src/services/publicContent.js');
    assert.match(src, /apiService\.request\(endpoint/);
    assert.match(src, /isUsable\(response, key\)/);
    assert.match(src, /source: 'live', snapshot: false/);
    assert.match(src, /source: 'snapshot',\s*snapshot: true/s);
    assert.match(src, /recordDevIssue\(\{ section, endpoint, error \}\)/);
    assert.match(src, /fallbackSection \|\| section/);
    assert.match(src, /export const isLiveContent/);
});

check('the saved copy is never cached as live data', () => {
    for (const file of ['src/pages/Projects.jsx', 'src/pages/Skills.jsx', 'src/pages/Testimonials.jsx', 'src/pages/Lab.jsx']) {
        const src = read(file);
        assert.match(src, /cacheService\.set\(/);
        assert.ok(src.includes('isLiveContent'), `${file} must guard its cache write`);
    }
});

check('all six public data pages load through the shared loader', () => {
    for (const file of PUBLIC_FILES.slice(0, 6)) {
        assert.match(read(file), /loadPublicSection\(/, `${file} must use the live-first loader`);
    }
    assert.match(read('src/pages/Lab.jsx'), /fallbackSection: 'labProjects'/);
    assert.match(read('src/pages/Education.jsx'), /getFallbackEducation\(\)/);
});

/* -------------------------------- messaging -------------------------------- */

check('no public file renders technical or developer wording', () => {
    for (const file of PUBLIC_FILES) {
        const src = read(file);
        assert.doesNotMatch(src, TECHNICAL, `${file} must not expose technical wording`);
        assert.doesNotMatch(src, /setLoadError|loadError/, `${file} must not keep a technical error banner`);
    }
});

check('friendly copy is short and contains no status or exception text', () => {
    const src = read('src/utils/publicMessaging.js');
    assert.match(src, /export const PUBLIC_COPY/);
    assert.match(src, /archive: 'A selection from the portfolio archive'/);
    assert.match(src, /publicEmptyCopy|publicCopy/);
    const copyBlock = src.slice(src.indexOf('export const PUBLIC_COPY'), src.indexOf('}));'));
    assert.doesNotMatch(copyBlock, /500|503|505|database|server|offline|unavailable|exception/i);
});

check('technical detail is recorded for developers but logged only in dev', () => {
    const src = read('src/utils/publicMessaging.js');
    assert.match(src, /export const IS_DEV = Boolean\(import\.meta\.env\.DEV\)/);
    assert.match(src, /if \(IS_DEV\) \{[\s\S]*?console\.warn/);
    assert.match(src, /statusFromError/);
    assert.match(src, /export const getDevIssues/);
    assert.match(src, /MAX_ISSUES = 25/);
});

check('the dev diagnostics panel is dev-only and absent from production', () => {
    const app = read('src/App.jsx');
    assert.match(app, /\{import\.meta\.env\.DEV && <DevDiagnostics \/>\}/);
    const panel = read('src/components/DevDiagnostics.jsx');
    assert.match(panel, /if \(!IS_DEV\) return null/);
    assert.match(panel, /getDevIssues\(\)/);
    assert.match(panel, /document\.hidden/);
    assert.doesNotMatch(panel, /localStorage|fetch\(|axios/);
});

check('raw API error text stays internal, for developers', () => {
    const service = read('src/services/api.service.js');
    assert.match(service, /Request failed with status/);
    assert.match(service, /Unable to connect to the server/);
    assert.match(service, /INTERNAL \/ DEV-ONLY/);
    // The public testimonials page no longer uses the convenience wrapper
    // that leaks error.message into a response object.
    assert.doesNotMatch(read('src/pages/Testimonials.jsx'), /apiService\.getTestimonials\(\)/);
});

check('owner-only technical wording stays owner-gated', () => {
    const lab = read('src/pages/Lab.jsx');
    assert.match(lab, /owner \? \(/);
    assert.match(lab, /live database records/);
    assert.match(lab, /Experiments, tools and interests from the portfolio/);
    const testimonials = read('src/pages/Testimonials.jsx');
    assert.match(testimonials, /previewMode && owner &&/);
});

check('no secrets or external calls were introduced', () => {
    for (const file of [
        'src/data/publicSnapshot.json',
        'src/services/publicContent.js',
        'src/utils/publicMessaging.js',
        'src/components/DevDiagnostics.jsx',
        'src/components/ArchiveNote.jsx',
        'scripts/build-public-snapshot.mjs'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest/);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:public-fallback'], /public-fallback\.test\.mjs/);
        assert.match(pkg.scripts.test, /public-fallback\.test\.mjs/);
    }
    assert.match(json('package.json').scripts['snapshot:build'], /build-public-snapshot\.mjs/);
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3l\./);
    assert.match(report, /Phases 3–/);
});

console.log(`\n${passed} public-fallback / dev-info regression checks passed.`);
