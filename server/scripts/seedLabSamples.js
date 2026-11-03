#!/usr/bin/env node
/**
 * Seed or remove the clearly-labelled SAMPLE lab experiments.
 *
 *   node server/scripts/seedLabSamples.js             # create samples (idempotent)
 *   node server/scripts/seedLabSamples.js --remove   # delete ONLY tagged samples
 *
 * Samples are ordinary Project documents carrying the `lab-sample` tag, so they
 * show up in /dashboard/projects, /dashboard/lab and the public Lab page, and
 * can be deleted from any of those places. Real projects, skills and hobbies
 * are never touched by this script.
 *
 * Confidential: runs entirely against the locally configured MongoDB. No data
 * leaves the checkout and no credential value is printed.
 */
'use strict';

const path = require('path');
// Prefer the server's own .env; also allow a root .env when invoked from repo root.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const User = require('../models/User.model');

const { tag: LAB_SAMPLE_TAG, samples: SAMPLES } = require('../../src/data/labSamples.json');

// Starter content for the Lab page — intentionally labelled SAMPLE, not
// portfolio facts. Delete them once real experiments exist. The single shared
// JSON file is also used by /dashboard/lab so the CLI and UI never drift.

async function connect() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/efolio';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}

async function resolveOwnerId() {
    const owner = await User.findOne({ role: 'owner' }).select('_id').lean();
    if (owner?._id) return owner._id;
    if (process.env.SEED_USER_ID && mongoose.Types.ObjectId.isValid(process.env.SEED_USER_ID)) {
        return new mongoose.Types.ObjectId(process.env.SEED_USER_ID);
    }
    throw new Error('No owner user found. Create the owner account first, or set SEED_USER_ID.');
}

async function removeSamples() {
    const result = await Project.deleteMany({ tags: LAB_SAMPLE_TAG });
    console.log(`Removed ${result.deletedCount} sample lab project(s). Real records were not touched.`);
}

async function seedSamples() {
    const userId = await resolveOwnerId();
    let created = 0;
    let existing = 0;

    for (const sample of SAMPLES) {
        const doc = {
            ...sample,
            userId,
            tags: [LAB_SAMPLE_TAG, ...sample.tags],
            visibility: 'public',
            hidden: false,
            archived: false,
            featured: false,
            views: 0,
            likes: 0
        };
        const result = await Project.updateOne(
            { title: doc.title, tags: LAB_SAMPLE_TAG },
            { $setOnInsert: doc },
            { upsert: true }
        );
        if (result.upsertedCount) created += 1;
        else existing += 1;
    }

    console.log(`Sample lab projects: ${created} created, ${existing} already present.`);
    console.log('Delete them from /dashboard/lab, /dashboard/projects, the public Lab page (as owner),');
    console.log('or run: node server/scripts/seedLabSamples.js --remove');
}

async function main() {
    try {
        await connect();
        if (process.argv.includes('--remove')) await removeSamples();
        else await seedSamples();
    } catch (error) {
        console.error('[seed:lab]', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) main();

module.exports = { SAMPLES, LAB_SAMPLE_TAG };
