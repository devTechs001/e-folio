#!/usr/bin/env node
/**
 * Seed every sample dataset, in dependency order.
 *
 *   node server/scripts/seedAllSamples.js              # seed everything
 *   node server/scripts/seedAllSamples.js --dry-run    # report only, no writes
 *   node server/scripts/seedAllSamples.js --verify     # check counts, no writes
 *   node server/scripts/seedAllSamples.js --remove     # remove ONLY seeded records
 *
 * Why this exists: the samples live in four different seeders with different
 * entry points and two different default database names, so "add the samples to
 * the database" meant running them one at a time and guessing the order. This
 * runs them as one idempotent operation:
 *
 *   1. Lab entries     — own collection, no dependencies
 *   2. Projects        — needs an owner/admin account to attach to
 *   3. Project showcase— presentation records only
 *   4. Testimonials    — sample set, tagged and removable
 *
 * Every step is idempotent and every --remove path deletes ONLY records that
 * step created (tag, seedKey or title match). Real records are never touched.
 *
 * Confidential: runs entirely against the locally configured MongoDB. No data
 * leaves the checkout and no credential value is printed.
 */
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * One default database name for every seeder.
 *
 * `scripts/seed-projects.js` defaulted to `e-folio` while the server and the
 * other seeders default to `efolio`. Locally, without MONGODB_URI set, those are
 * two different databases — so seeding projects and checking the dashboard could
 * silently address different data. The database name now comes from here.
 */
function databaseUri() {
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
        return process.env.MONGODB_URI.trim();
    }
    return 'mongodb://localhost:27017/efolio';
}

const STEPS = [
    {
        name: 'Lab entries',
        script: 'server/scripts/seedLabEntries.js',
        removeMode: 'same',
        detail: '4 cybersecurity experiments in their own collection'
    },
    {
        name: 'Projects',
        script: 'scripts/seed-projects.js',
        removeMode: 'unsupported',
        detail: '16 portfolio projects (+2 showcase records)'
    },
    {
        name: 'Project showcase',
        script: 'server/scripts/seedProjectShowcase.js',
        removeMode: 'flag',
        detail: 'showcase presentation records'
    },
    {
        name: 'Testimonials',
        script: 'server/scripts/seedTestimonialSamples.js',
        removeMode: 'flag',
        detail: 'sample testimonials, tagged and removable'
    }
];

/** Fail with an instruction, not a stack trace, when deps are not installed. */
function assertDependencies() {
    try {
        require.resolve('mongoose', { paths: [path.join(ROOT, 'server'), ROOT] });
    } catch {
        console.error('Mongoose is not installed for this checkout.');
        console.error('');
        console.error('The server dependencies live in server/, so install them first:');
        console.error('  cd server && npm install');
        console.error('');
        console.error('No database was contacted.');
        process.exit(2);
    }
}

assertDependencies();

const argv = process.argv.slice(2);
const flags = new Set(argv);
const dryRun = flags.has('--dry-run');
const verify = flags.has('--verify');
const remove = flags.has('--remove');

const uri = databaseUri();
// Never print the connection string: it may carry credentials in Render.
const describeTarget = () => {
    if (process.env.MONGODB_URI) return 'MONGODB_URI (configured in the environment)';
    return 'local MongoDB, database `efolio` (MONGODB_URI is not set)';
};

function runStep(step, args) {
    const result = spawnSync(process.execPath, [path.join(ROOT, step.script), ...args], {
        cwd: ROOT,
        env: { ...process.env, MONGODB_URI: uri },
        encoding: 'utf8'
    });
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    return { ok: result.status === 0, output, status: result.status };
}

function printBlock(title, body, indent = '    ') {
    console.log(`  ${title}`);
    if (!body) return;
    for (const line of body.split('\n')) {
        if (line.trim()) console.log(`${indent}${line}`);
    }
}

function main() {
    console.log('E-Folio sample seeding');
    console.log('========================================================');
    console.log(`Target   : ${describeTarget()}`);
    console.log(`Mode     : ${remove ? 'REMOVE seeded records' : verify ? 'VERIFY only' : dryRun ? 'DRY RUN (no writes)' : 'SEED'}`);
    console.log('');

    if (dryRun) {
        console.log('Would run, in order:');
        for (const [index, step] of STEPS.entries()) {
            console.log(`  ${index + 1}. ${step.name} — ${step.detail}`);
            console.log(`     node ${step.script}`);
        }
        console.log('\nNo database was contacted.');
        return;
    }

    if (verify) {
        // Verification is a separate script so mongoose resolves from the
        // server's own node_modules rather than an inline -e evaluation, which
        // resolves from the repository root and fails there.
        const result = spawnSync(process.execPath, [path.join(ROOT, 'server/scripts/verifySeedData.js')], {
            cwd: ROOT,
            env: { ...process.env, MONGODB_URI: uri },
            encoding: 'utf8'
        });
        const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
        printBlock(result.status === 0 ? 'Verification' : 'Could not verify', output);
        if (result.status !== 0) process.exitCode = result.status || 1;
        return;
    }

    const failures = [];
    for (const [index, step] of STEPS.entries()) {
        console.log(`${index + 1}. ${step.name} — ${step.detail}`);

        let args = [];
        if (remove) {
            if (step.removeMode === 'flag') args = ['--remove'];
            else if (step.removeMode === 'same') args = ['--remove'];
            else {
                console.log('    skipped: this dataset has no removal path (it would delete real records too)\n');
                continue;
            }
        }

        const result = runStep(step, args);
        printBlock(result.ok ? 'ok' : 'FAILED', result.output);
        console.log('');
        if (!result.ok) failures.push(step.name);
    }

    console.log('========================================================');
    if (failures.length) {
        console.log(`Finished with ${failures.length} failure(s): ${failures.join(', ')}`);
        console.log('Nothing was rolled back — the seeders are idempotent, so re-running is safe.');
        process.exitCode = 1;
        return;
    }
    console.log(remove ? 'Seeded records removed. Real records untouched.' : 'All datasets seeded.');
    console.log('Confirm with: npm run seed:samples -- --verify');
}

if (require.main === module) main();

module.exports = { STEPS, databaseUri };
