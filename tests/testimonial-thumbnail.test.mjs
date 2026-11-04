/**
 * Phase 25 — a new local thumbnail for the first testimonial.
 *
 * The canonical mock-testimonial dataset and both backup files are protected:
 * they must stay byte-for-byte as they were. The thumbnail is therefore added
 * as a NEW asset plus a NEW name->path mapping, resolved by the public page at
 * render time. Node-only static checks; no network, DB or browser.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
};

const ASSET = 'public/assets/images/testimonials/sarah-johnson-thumbnail.jpg';
const URL = '/assets/images/testimonials/sarah-johnson-thumbnail.jpg';

check('a new local thumbnail asset exists and is a small real JPEG', () => {
    const file = fs.readFileSync(path.join(root, ASSET));
    assert.ok(file.length > 2000 && file.length < 100_000, `unexpected size ${file.length}`);
    assert.equal(file[0], 0xff);
    assert.equal(file[1], 0xd8);
    assert.equal(file[2], 0xff);
    assert.equal(file.indexOf(Buffer.from('JFIF')), 6);
});

check('the mapping targets the first testimonial only, by name', () => {
    const mapping = json('src/data/testimonialThumbnails.json');
    const samples = json('src/data/testimonialSamples.json');
    const first = samples.samples[0];
    assert.equal(first.name, 'Sarah Johnson');
    assert.deepEqual(Object.keys(mapping.byName), [first.name]);
    assert.equal(mapping.byName[first.name], URL);
    assert.ok(fs.existsSync(path.join(root, 'public' + URL)));
});

check('the protected canonical dataset and both backups are unchanged', () => {
    const data = json('src/data/testimonialSamples.json');
    const original = json('server/backups/testimonials/original-fallback-testimonials.json');
    const backup = json('server/backups/testimonials/testimonial-samples.backup.json');
    assert.deepEqual(original, data.samples);
    assert.deepEqual(backup, data);
    assert.equal(data.samples.length, 8);
    assert.equal(data.samples[0].avatar, 'https://images.unsplash.com/photo-1494790108756-2616b612b786?ixlib=rb-4.0.3');
    for (const sample of data.samples) assert.ok(!('thumbnail' in sample));
});

check('the public page resolves the thumbnail in grid, list, carousel and modal', () => {
    const src = read('src/pages/Testimonials.jsx');
    assert.match(src, /import thumbnailOverrides from '\.\.\/data\/testimonialThumbnails\.json'/);
    assert.match(src, /const thumbnailFor = /);
    assert.match(src, /item\?\.thumbnail \|\| thumbnailOverrides\.byName\[item\?\.name\] \|\| item\?\.avatar/);
    assert.equal((src.match(/src=\{thumbnailFor\(/g) || []).length, 4);
    assert.doesNotMatch(src, /src=\{testimonial\.avatar\}|src=\{selectedTestimonial\.avatar\}/);
    assert.equal((src.match(/loading="lazy"/g) || []).length, 3);
});

check('the server can store and serve a thumbnail without exposing other data', () => {
    const model = read('server/models/Testimonial.model.js');
    assert.match(model, /thumbnail: \{\s*type: String,\s*trim: true\s*\}/);
    const controller = read('server/controllers/public-testimonials.controller.js');
    assert.match(controller, /avatar thumbnail rating/);
    assert.doesNotMatch(controller, /password|ipAddress|userAgent/);
});

check('no secret, external write or remote image dependency was introduced', () => {
    const src = read('src/data/testimonialThumbnails.json') + read('src/pages/Testimonials.jsx');
    assert.doesNotMatch(src, /AIza[0-9A-Za-z_\-]{20,}|mongodb\+srv:\/\/|ghp_[A-Za-z0-9]{20,}/);
    assert.ok(!read('src/data/testimonialThumbnails.json').includes('http://'));
    assert.ok(!read('src/data/testimonialThumbnails.json').includes('https://'));
});

check('package scripts and the confidential report are wired', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['test:testimonial-thumbnail'], /testimonial-thumbnail\.test\.mjs/);
        assert.match(scripts.test, /testimonial-thumbnail\.test\.mjs/);
    }
    assert.match(read('CONFIDENTIAL_AUDIT_AND_FIX_REPORT.md'), /## 3y\./);
});

console.log(`\n${passed} testimonial thumbnail regression checks passed.`);
