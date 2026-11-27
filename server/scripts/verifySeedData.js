#!/usr/bin/env node
/**
 * Read-only check that every seeded dataset is present.
 *
 *   node server/scripts/verifySeedData.js
 *
 * Counts only — it never writes, updates or deletes. Prints one JSON line so the
 * caller can parse it, then a human summary. Exit code 1 when a dataset that
 * should be seeded is empty.
 *
 * Confidential: connects only to the locally configured MongoDB and prints
 * counts, never documents or credentials.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');

const LabEntry = require('../models/LabEntry.model');
const Project = require('../models/Project.model');
// Same source of truth the cleanup seeder uses, so the check and the delete
// can never disagree about what counts as a sample.
const { tag: SAMPLE_TAG } = require('../../src/data/labSamples.json');

async function countTestimonials() {
    // The model name has changed shape before; never let a missing model make
    // the whole verification fail.
    try {
        const Testimonial = require('../models/Testimonial.model');
        return await Testimonial.countDocuments({});
    } catch {
        return null;
    }
}

async function main() {
    const uri = (process.env.MONGODB_URI || '').trim() || 'mongodb://localhost:27017/efolio';

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    } catch (error) {
        console.error(`Could not reach MongoDB: ${error.message}`);
        console.error('Set MONGODB_URI, or start a local MongoDB.');
        process.exit(1);
    }

    try {
        const counts = {
            labEntries: await LabEntry.countDocuments({}),
            seededLabEntries: await LabEntry.countDocuments({ seedKey: { $ne: '' } }),
            projects: await Project.countDocuments({}),
            // Phase 46 — leftover placeholders from the pre-Phase-42 Lab model.
            // These are what "sample tagged projects" means in practice; a clean
            // database has zero, and `npm run seed:samples -- --remove` clears them.
            sampleTaggedProjects: await Project.countDocuments({ tags: SAMPLE_TAG }),
            publicProjects: await Project.countDocuments({
                visibility: 'public',
                hidden: { $ne: true },
                archived: { $ne: true }
            }),
            testimonials: await countTestimonials()
        };

        console.log(JSON.stringify(counts));

        const preview = await LabEntry.find({}).select('title domain status seedKey').lean();
        console.log('');
        console.log(`Lab entries (${preview.length}):`);
        for (const entry of preview) {
            const marker = entry.seedKey ? 'seeded' : 'yours ';
            console.log(`  [${marker}] ${entry.title} — ${entry.domain} (${entry.status})`);
        }

        const problems = [];
        if (counts.labEntries === 0) problems.push('no Lab entries — run: npm run seed:lab');
        if (counts.projects === 0) problems.push('no projects — run: npm run seed:samples');
        if (counts.sampleTaggedProjects > 0) {
            problems.push(
                `${counts.sampleTaggedProjects} sample-tagged project(s) still present — `
                + 'run: npm run seed:samples -- --remove'
            );
        }

        if (problems.length) {
            console.log('\nMissing:');
            for (const problem of problems) console.log(`  - ${problem}`);
            process.exitCode = 1;
        } else {
            console.log('\nEvery dataset is present.');
        }
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { main };
