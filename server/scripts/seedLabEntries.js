#!/usr/bin/env node
/**
 * Phase 42 — seed or remove the Lab's real experiment records.
 *
 *   node server/scripts/seedLabEntries.js            # create/update (idempotent)
 *   node server/scripts/seedLabEntries.js --remove   # delete ONLY seeded records
 *
 * Writes to the dedicated `LabEntry` collection. It never touches `Project`,
 * so seeding the Lab cannot create a portfolio project or a duplicate on the
 * Projects page — that was the root cause of the duplicates the Lab used to
 * introduce.
 *
 * Idempotent: records are matched on slug, so re-running updates the existing
 * entry instead of inserting a second copy.
 *
 * Confidential: runs entirely against the locally configured MongoDB. No data
 * leaves the checkout and no credential value is printed.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const LabEntry = require('../models/LabEntry.model');
const User = require('../models/User.model');

const { seedKey: SEED_KEY, entries: ENTRIES } = require('../../src/data/labEntries.json');

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

async function removeSeeded() {
    const result = await LabEntry.deleteMany({ seedKey: SEED_KEY });
    console.log(`Removed ${result.deletedCount} seeded lab experiment(s). Entries you created yourself were not touched.`);
}

async function seedEntries() {
    const userId = await resolveOwnerId();
    let created = 0;
    let updated = 0;

    for (const entry of ENTRIES) {
        const doc = {
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
            seedKey: SEED_KEY
        };

        const result = await LabEntry.updateOne(
            { userId, slug: entry.slug },
            { $set: doc, $setOnInsert: { slug: entry.slug } },
            { upsert: true, runValidators: true }
        );
        if (result.upsertedCount) created += 1;
        else updated += 1;
    }

    console.log(`Lab experiments: ${created} created, ${updated} updated.`);
    console.log('Managed from /dashboard/lab, or run: node server/scripts/seedLabEntries.js --remove');
}

async function main() {
    try {
        await connect();
        if (process.argv.includes('--remove')) await removeSeeded();
        else await seedEntries();
    } catch (error) {
        console.error('[seed:lab]', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) main();

module.exports = { ENTRIES, SEED_KEY };
