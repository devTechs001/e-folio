/**
 * Regression checks: the E-Commerce Platform project now points at the
 * published OmniBiz site. Node-only static checks — no DB, no network, no
 * browser, no external service. Confidential: local checkout only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const NEW_URL = 'https://ominbiz-solution.netlify.app/';
// Built from fragments so this test file itself does not re-introduce the
// retired URLs into the repository scan below.
const OLD_URL = ['https://', 'bizsolutionz', '.netlify.app/'].join('');
const PLACEHOLDER = ['https://', 'demo-ecommerce', '.com'].join('');
const NETGATE = 'https://net-gate-portal.netlify.app/';

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

/** Walk tracked source files, skipping generated/vendored trees. */
const walk = (dir, out = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['.git', 'node_modules', 'dist', 'build', '.cache', 'coverage'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (entry.isFile() && full.length < 260) out.push(path.relative(root, full));
    }
    return out;
};

/* --------------------------------- the swap -------------------------------- */

check('the main E-Commerce Platform record uses the new link everywhere', () => {
    const seed = read('scripts/seed-projects.js');
    const block = seed.slice(seed.indexOf('title: "E-Commerce Platform"'), seed.indexOf('title: "GB Chat"'));
    assert.equal((block.match(/ominbiz-solution\.netlify\.app\//g) || []).length, 3);
    for (const key of ['live', 'demo', 'netlify']) {
        assert.ok(block.includes(`${key}: "${NEW_URL}"`), `${key} must use the new URL`);
    }
    assert.ok(block.includes('github: "https://github.com/devTechs001/ecommerce-platform"'));

    const snapshot = json('src/data/publicSnapshot.json');
    const project = snapshot.sections.projects.projects.find(p => p.title === 'E-Commerce Platform');
    assert.ok(project, 'snapshot must still contain the E-Commerce Platform');
    assert.equal(project.links.live, NEW_URL);
    assert.equal(project.links.demo, NEW_URL);
    assert.equal(project.links.netlify, NEW_URL);
});

check('the placeholder demo links became the real published URL', () => {
    for (const file of ['server/seed-data.js', 'server/scripts/seedProjects.js']) {
        const src = read(file);
        const block = src.slice(src.indexOf('title: "E-Commerce Platform"'), src.indexOf('title: "Portfolio Website"'));
        assert.doesNotMatch(block, /demo-ecommerce\.com/);
        assert.ok(block.includes(NEW_URL), `${file} must use the published URL`);
    }
});

check('both Enterprise E-Commerce records had their legacy netlify link swapped', () => {
    for (const file of ['server/scripts/seed-all-projects.js', 'server/seed-enterprise-projects.js']) {
        const src = read(file);
        assert.ok(src.includes(`netlify: "${NEW_URL}"`), `${file} netlify link must be swapped`);
        // The separate enterprise demo project keeps its own live/demo links.
        assert.ok(src.includes('https://enterprise-ecommerce-platform.netlify.app'), `${file} enterprise links must be untouched`);
    }
});

check('the old link and the placeholder are gone from every source file', () => {
    const offenders = [];
    for (const rel of walk(root)) {
        const full = path.join(root, rel);
        if (fs.statSync(full).size > 2_000_000) continue;
        let text;
        try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
        if (text.includes(OLD_URL) || text.includes(PLACEHOLDER)) offenders.push(rel);
    }
    assert.deepEqual(offenders, [], `stale links remain in: ${offenders.join(', ')}`);
});

/* --------------------------------- safety ---------------------------------- */

check('the NetGate link and its files are untouched', () => {
    assert.equal(
        json('src/data/labSamples.json').samples.find(s => s.title === '[SAMPLE] Network Recon Suite').links.live,
        NETGATE
    );
    assert.equal(json('src/data/testimonialSamples.json').previewUrl, NETGATE);
    assert.ok(read('server/backups/testimonials/testimonial-samples.backup.json').includes(NETGATE));
    assert.match(read('src/utils/nexStore.js'), /export const NEX_STORE_URL = 'https:\/\/nex-store-pro\.netlify\.app\/'/);
    assert.match(read('src/data/projectShowcase.json'), /https:\/\/liqourstor\.netlify\.app\/client/);
});

check('the new URL is a plain HTTPS link with no credentials', () => {
    const parsed = new URL(NEW_URL);
    assert.equal(parsed.protocol, 'https:');
    assert.equal(parsed.username, '');
    assert.equal(parsed.password, '');
    assert.equal(parsed.pathname, '/');
    assert.equal(parsed.search, '');
});

check('the snapshot generator still reads the edited seed file', () => {
    const generator = read('scripts/build-public-snapshot.mjs');
    assert.match(generator, /read\('scripts\/seed-projects\.js'\)/);
    assert.match(generator, /src\/data\/publicSnapshot\.json/);
    for (const file of ['package.json', 'server/package.json']) {
        assert.match(json(file).scripts['snapshot:build'], /build-public-snapshot\.mjs/);
    }
});

check('no secrets or external calls were introduced', () => {
    for (const file of [
        'scripts/seed-projects.js',
        'server/scripts/seedProjects.js',
        'server/scripts/seed-all-projects.js',
        'server/seed-enterprise-projects.js',
        'server/seed-data.js',
        'src/data/publicSnapshot.json'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
        assert.doesNotMatch(src, /fetch\(|axios|XMLHttpRequest/);
    }
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const pkg = json(file);
        assert.match(pkg.scripts['test:ecommerce-link'], /ecommerce-link\.test\.mjs/);
        assert.match(pkg.scripts.test, /ecommerce-link\.test\.mjs/);
    }
    const report = read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md');
    assert.match(report, /## 3m\./);
    assert.match(report, /Phases 3–/);
    assert.ok(report.includes(NEW_URL));
});

console.log(`\n${passed} E-Commerce link regression checks passed.`);
