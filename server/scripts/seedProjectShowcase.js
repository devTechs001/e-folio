#!/usr/bin/env node
/**
 * Seed or remove the verified external project links from the Projects page.
 *
 *   node server/scripts/seedProjectShowcase.js             # create (idempotent)
 *   node server/scripts/seedProjectShowcase.js --remove   # delete ONLY tagged records
 *
 * Records are ordinary Project documents carrying the `portfolio-showcase`
 * tag, so they appear in /dashboard/projects and GET /api/public/projects.
 * Existing project records and every existing project link (including the
 * NetGate link) are never read or modified by this script.
 *
 * Confidential: runs entirely against the locally configured MongoDB. No code
 * or credential value leaves the checkout. No statistics are fabricated.
 */
'use strict';

const path = require('path');
// Prefer the server's own .env; also allow a root .env when invoked from repo root.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const dataset = require('../../src/data/projectShowcase.json');

const SHOWCASE_TAG = dataset.tag;
const PROJECTS = dataset.projects;

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

function isSafeUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch {
        return false;
    }
}

async function removeShowcase() {
    const result = await Project.deleteMany({ tags: SHOWCASE_TAG });
    console.log(`Removed ${result.deletedCount} showcase project(s). Existing project records were not touched.`);
}

async function seedShowcase() {
    const userId = await resolveOwnerId();
    let created = 0;
    let existing = 0;
    let skipped = 0;

    for (const project of PROJECTS) {
        if (!isSafeUrl(project.url)) {
            skipped += 1;
            continue;
        }
        const doc = {
            userId,
            title: project.title,
            description: project.description,
            category: project.category,
            status: project.status,
            technologies: project.technologies || [],
            tags: [SHOWCASE_TAG, ...(project.tags || [])],
            links: {
                live: project.url,
                demo: project.url,
                netlify: project.url
            },
            visibility: 'public',
            hidden: false,
            archived: false,
            featured: false,
            views: 0,
            likes: 0
        };
        const result = await Project.updateOne(
            { title: doc.title, tags: SHOWCASE_TAG },
            { $setOnInsert: doc },
            { upsert: true }
        );
        if (result.upsertedCount) created += 1;
        else existing += 1;
    }

    console.log(`Showcase projects: ${created} created, ${existing} already present, ${skipped} skipped (unsafe URL).`);
    console.log('Remove them with: node server/scripts/seedProjectShowcase.js --remove');
}

async function main() {
    try {
        await connect();
        if (process.argv.includes('--remove')) await removeShowcase();
        else await seedShowcase();
    } catch (error) {
        console.error('[seed:showcase]', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) main();

module.exports = { PROJECTS, SHOWCASE_TAG, isSafeUrl };
