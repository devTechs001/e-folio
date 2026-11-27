/**
 * Seed pipeline validation.
 *
 * There is no MongoDB in this environment and the binary host is unreachable, so
 * the seeding cannot be executed end to end here. What *can* be proven without a
 * server is that every seed document would be accepted by the schema it targets
 * — validation is pure Mongoose and needs no connection. That catches the failure
 * that matters: a seeder that reports success while the database silently
 * rejects or mutates the records.
 *
 * Run from the server directory so mongoose resolves from server/node_modules.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));

const require = createRequire(path.join(root, 'server', 'package.json'));

let passed = 0;
const failures = [];
const check = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log(`  ok  ${name}`);
    } catch (error) {
        failures.push(`${name}: ${error.message}`);
        console.log(`  FAIL ${name}\n       ${error.message}`);
    }
};

console.log('Seed pipeline validation\n');

/* ----------------------------------- data --------------------------------- */

const labSeed = json('src/data/labEntries.json');

check('every Lab seed record satisfies the LabEntry schema', () => {
    const LabEntry = require('../server/models/LabEntry.model');
    for (const entry of labSeed.entries) {
        const doc = new LabEntry({
            userId: '507f1f77bcf86cd799439011',
            slug: entry.slug,
            title: entry.title,
            summary: entry.summary,
            description: entry.description || '',
            domain: entry.domain,
            status: entry.status,
            environment: entry.environment || '',
            scope: entry.scope || '',
            tools: entry.tools || [],
            findings: entry.findings || '',
            tags: entry.tags || [],
            difficulty: entry.difficulty || 'intermediate',
            featured: Boolean(entry.featured),
            visibility: 'public',
            hidden: false,
            seedKey: labSeed.seedKey
        });
        const error = doc.validateSync();
        assert.equal(error, undefined, `${entry.slug}: ${error && Object.keys(error.errors).join(', ')}`);
    }
});

check('the Lab seed cannot be rejected for a missing required field', () => {
    const LabEntry = require('../server/models/LabEntry.model');
    const missing = new LabEntry({ title: 'x', summary: 'y' });
    const error = missing.validateSync();
    assert.ok(error, 'a record with no owner was accepted');
    assert.ok(error.errors.userId, 'userId is not enforced');
});

check('the Lab seed idempotency key is unique per record', () => {
    const slugs = labSeed.entries.map(entry => entry.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate slug would upsert over another record');
    const LabEntry = require('../server/models/LabEntry.model');
    // The unique (userId, slug) index is what makes re-running the seeder safe.
    const indexes = LabEntry.schema.indexes();
    const compound = indexes.find(([fields]) => fields.userId === 1 && fields.slug === 1);
    assert.ok(compound, 'the (userId, slug) unique index is missing');
    assert.equal(compound[1].unique, true, 'the (userId, slug) index is not unique');
});

check('the LabEntry schema declares no duplicate indexes', () => {
    // Mongoose warns at connect time when a path is indexed twice. That warning
    // appeared for seedKey (path-level `index: true` plus schema.index()).
    const LabEntry = require('../server/models/LabEntry.model');
    const seen = new Set();
    for (const [fields, options] of LabEntry.schema.indexes()) {
        const key = JSON.stringify(fields);
        assert.ok(!seen.has(key), `duplicate index on ${key}`);
        seen.add(key);
        // A sparse index over a unique field is fine; a bare duplicate is not.
        assert.ok(options && typeof options === 'object');
    }
});

/* -------------------------------- pipeline -------------------------------- */

check('one command seeds every dataset in dependency order', () => {
    const src = read('server/scripts/seedAllSamples.js');
    const order = [...src.matchAll(/script: '([^']+)'/g)].map(m => m[1]);
    assert.deepEqual(order, [
        'server/scripts/seedLabEntries.js',
        'scripts/seed-projects.js',
        'server/scripts/seedProjectShowcase.js',
        'server/scripts/seedTestimonialSamples.js',
        // Phase 46 — cleanup-only step, never seeds (see the check below).
        'server/scripts/seedLabSamples.js'
    ]);
    // Lab first (no dependencies), projects after it.
    assert.ok(order[0].includes('LabEntries'));
    // Every referenced script must exist.
    for (const script of order) assert.ok(exists(script), `${script} is missing`);
});

check('the legacy sample cleanup deletes but never re-seeds', () => {
    const src = read('server/scripts/seedAllSamples.js');
    const step = src.slice(src.indexOf("name: 'Legacy sample-tagged projects'"));
    const body = step.slice(0, step.indexOf('}'));
    // Marked remove-only, and it deletes only its own tagged records.
    assert.match(body, /removeMode: 'flag'/);
    assert.match(body, /seed: 'never'/);
    // The normal seed path must skip it, or the samples would come straight back.
    assert.match(src, /if \(!remove && step\.seed === 'never'\)/);
    assert.match(src, /cleanup step, only runs with --remove/);
    // And the seeder it calls can only delete records carrying its own tag.
    const seeder = read('server/scripts/seedLabSamples.js');
    assert.match(seeder, /Project\.deleteMany\(\{ tags: LAB_SAMPLE_TAG \}\)/);
    // The tag is shared with verification, so the check and the delete agree.
    assert.match(read('server/scripts/verifySeedData.js'), /sampleTaggedProjects/);
});

check('the pipeline supports dry-run, verify and remove', () => {
    const src = read('server/scripts/seedAllSamples.js');
    for (const flag of ['--dry-run', '--verify', '--remove']) {
        assert.ok(src.includes(flag), `${flag} is not handled`);
    }
    // Dry run must not contact the database.
    const dry = src.slice(src.indexOf("if (dryRun)"), src.indexOf("if (verify)"));
    assert.doesNotMatch(dry, /mongoose|connect/);
});

check('the pipeline never prints the connection string', () => {
    const src = read('server/scripts/seedAllSamples.js');
    // A Render MONGODB_URI carries credentials; it must never be echoed.
    assert.doesNotMatch(src, /console\.log\(\s*uri\s*\)/);
    assert.doesNotMatch(src, /console\.log\(\s*process\.env\.MONGODB_URI\s*\)/);
    assert.match(src, /describeTarget/);
});

check('verification is read-only and reports real counts', () => {
    const src = read('server/scripts/verifySeedData.js');
    assert.match(src, /countDocuments/);
    // No write operations anywhere in the verifier.
    for (const write of ['deleteMany', 'updateOne', 'insertMany', 'create(', 'bulkWrite', 'findOneAndUpdate']) {
        assert.ok(!src.includes(write), `verifier performs ${write}`);
    }
});

check('every seeder targets the same default database', () => {
    // The seeders defaulted to `e-folio` and `efolio` — two different databases
    // with no error. The whole pipeline must agree with server/config/database.js.
    const server = read('server/config/database.js');
    assert.match(server, /27017\/efolio/);
    for (const file of [
        'scripts/seed-projects.js',
        'server/scripts/seedLabEntries.js',
        'server/scripts/seedProjectShowcase.js',
        'server/scripts/seedTestimonialSamples.js'
    ]) {
        const src = read(file);
        assert.doesNotMatch(src, /27017\/e-folio/, `${file} still targets e-folio`);
    }
});

check('a missing install fails with an instruction, not a stack trace', () => {
    const src = read('server/scripts/seedAllSamples.js');
    assert.match(src, /assertDependencies/);
    assert.match(src, /require\.resolve\('mongoose'/);
    assert.match(src, /cd server && npm install/);
});

check('seeding is exposed as an npm script in both manifests', () => {
    for (const file of ['package.json', 'server/package.json']) {
        const scripts = json(file).scripts;
        assert.match(scripts['seed:samples'], /seedAllSamples\.js/);
    }
});

check('the seeder never writes a Project document for a lab record', () => {
    const src = read('server/scripts/seedLabEntries.js');
    assert.doesNotMatch(src, /Project\.(create|insertMany|updateOne|deleteMany)/);
    assert.match(src, /LabEntry\.updateOne/);
});

console.log(`\n${passed} seed pipeline checks passed.`);
if (failures.length) {
    console.log(`\n${failures.length} check(s) failed:`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
}
