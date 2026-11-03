/**
 * Regression checks for owner-controlled mock testimonial data.
 * Node-only static checks: no framework, database or network.
 * Confidential — everything stays inside this checkout.
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

const PROJECT_URL = 'https://net-gate-portal.netlify.app/';
const ORIGINAL_NAMES = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim',
    'Jessica Taylor', 'Robert Anderson', 'Amanda White', 'Chris Martinez'
];

/* ------------------------------------------------------------- dataset --- */

check('canonical dataset holds all 8 original testimonials, as they were', () => {
    const data = json('src/data/testimonialSamples.json');
    assert.equal(data.tag, 'testimonial-sample');
    assert.equal(data.samples.length, 8);
    assert.deepEqual(data.samples.map(s => s.name), ORIGINAL_NAMES);
    for (const sample of data.samples) {
        assert.ok(sample.content.length >= 10);
        assert.ok(sample.rating >= 1 && sample.rating <= 5);
        assert.ok(sample.project && Array.isArray(sample.tags));
        assert.ok(typeof sample.featured === 'boolean' && typeof sample.verified === 'boolean');
        assert.ok(sample.date.startsWith('2025-'));
    }
});

check('backup files are exact copies and are documented', () => {
    const data = json('src/data/testimonialSamples.json');
    const original = json('server/backups/testimonials/original-fallback-testimonials.json');
    const backup = json('server/backups/testimonials/testimonial-samples.backup.json');
    assert.deepEqual(original, data.samples, 'original records must be verbatim');
    assert.deepEqual(backup, data, 'full dataset backup must match canonical data');
    assert.ok(exists('server/backups/testimonials/README.md'));
});

check('the supplied project URL replaces the existing project link', () => {
    const data = json('src/data/testimonialSamples.json');
    assert.equal(data.previewUrl, PROJECT_URL);
    assert.equal(data.legacyProjectUrl, 'https://e-folio-pro.netlify.app');
    const labs = json('src/data/labSamples.json');
    const network = labs.samples.find(s => s.title === '[SAMPLE] Network Recon Suite');
    assert.equal(network.links.live, PROJECT_URL);
    assert.equal(network.links.demo, PROJECT_URL);
    assert.ok(!JSON.stringify(network.links).includes('github.com'));
    const seed = read('server/scripts/seedTestimonialSamples.js');
    assert.match(seed, /website: PROJECT_URL/);
});

/* ----------------------------------------------------------- db / seed --- */

check('seeder inserts real tagged documents, preview-only, without touching real data', () => {
    const src = read('server/scripts/seedTestimonialSamples.js');
    assert.match(src, /src', 'data', 'testimonialSamples\.json'/);
    assert.match(src, /JSON\.parse\(fs\.readFileSync\(DATA_FILE, 'utf8'\)\)/);
    assert.match(src, /visible: false/);
    assert.match(src, /tags: \[\.\.\.\(sample\.tags \|\| \[\]\), TAG\]/);
    assert.match(src, /Testimonial\.deleteMany\(\{ tags: TAG \}\)/);
    assert.match(src, /await exportBackup\(\)/);
    assert.match(src, /updateOne\(\s*\{ name: doc\.name, tags: TAG \}/);
    assert.doesNotMatch(src, /507f1f77bcf86cd799439011/);
});

check('seeder supports backup, restore, publish, unpublish and remove', () => {
    const src = read('server/scripts/seedTestimonialSamples.js');
    for (const flag of ['--remove', '--export', '--restore', '--publish', '--unpublish']) {
        assert.ok(src.includes(`'${flag}'`), `missing ${flag} mode`);
    }
    assert.match(src, /--file/);
    assert.match(src, /Testimonial\.find\(\{\}\)\.lean\(\)/);
});

check('backup, seed and restore commands are exposed as npm scripts', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['seed:testimonials'] || '', /seedTestimonialSamples\.js/);
        assert.match(scripts['seed:testimonials:remove'] || '', /--remove/);
        assert.match(scripts['backup:testimonials'] || '', /--export/);
        assert.match(scripts['restore:testimonials'] || '', /--restore/);
    }
});

/* ------------------------------------------------------- owner control --- */

check('dashboard owner panel is wired into the Testimonials manager', () => {
    assert.ok(exists('src/components/dashboard/TestimonialSamplesPanel.jsx'));
    const manager = read('src/components/dashboard/TestimonialManager.jsx');
    assert.match(manager, /import TestimonialSamplesPanel from '\.\/TestimonialSamplesPanel'/);
    assert.match(manager, /<TestimonialSamplesPanel onChanged=\{loadTestimonials\} \/>/);
});

check('owner can add, delete, publish and preview only the tagged samples', () => {
    const src = read('src/components/dashboard/TestimonialSamplesPanel.jsx');
    assert.match(src, /apiService\.createTestimonial\(/);
    assert.match(src, /apiService\.deleteTestimonial\(/);
    assert.match(src, /apiService\.toggleTestimonialVisibility\(/);
    assert.match(src, /visible: false/);
    assert.match(src, /Add sample data/);
    assert.match(src, /Delete all samples/);
    assert.match(src, /Preview mode/);
    assert.match(src, /Preview on public page/);
    assert.match(src, /Exit public preview/);
    assert.match(src, /Real testimonials in the database/);
    assert.doesNotMatch(src, /John Doe|Jane Smith|Alex Johnson/);
});

/* --------------------------------------------------------- preview mode --- */

check('public page never serves mock data outside owner preview mode', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /import sampleDataset from '\.\.\/data\/testimonialSamples\.json'/);
    assert.match(src, /const isSampleTestimonial = /);
    assert.match(src, /if \(previewMode && owner\)/);
    assert.match(src, /useState\(readPreviewFlag\)/);
    assert.match(src, /togglePreview/);
    assert.doesNotMatch(src, /getFallbackTestimonials/);
    assert.doesNotMatch(src, /picsum\.photos/);
});

check('browser cache is versioned so old fabricated records cannot return', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /const CACHE_KEY = 'public_testimonials_v2'/);
    assert.match(src, /cacheService\.delete\(LEGACY_CACHE_KEY\)/);
    assert.match(src, /const cached = previewMode \? null : cacheService\.get\(CACHE_KEY\)/);
});

check('sample cards are clearly labelled in every view mode', () => {
    const src = read('src/pages/Testimonials.jsx');
    const badges = (src.match(/testimonial-sample-badge/g) || []).length;
    assert.ok(badges >= 3, `expected grid/list/carousel badges, found ${badges}`);
    assert.match(src, /is-sample/);
    const css = read('src/styles/Testimonials.css');
    assert.match(css, /\.testimonial-preview-banner/);
    assert.match(css, /\.testimonial-sample-badge/);
});

console.log(`\n${passed} testimonial sample/preview regression checks passed.`);
