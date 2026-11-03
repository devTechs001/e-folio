#!/usr/bin/env node
/**
 * Testimonial sample-data manager (local only).
 *
 *   node server/scripts/seedTestimonialSamples.js                    # seed (idempotent)
 *   node server/scripts/seedTestimonialSamples.js --remove          # delete ONLY tagged samples
 *   node server/scripts/seedTestimonialSamples.js --export          # backup ALL DB testimonials
 *   node server/scripts/seedTestimonialSamples.js --publish         # make samples public
 *   node server/scripts/seedTestimonialSamples.js --unpublish       # preview-only again
 *   node server/scripts/seedTestimonialSamples.js --restore --file <backup.json>
 *
 * The 8 sample records are the ORIGINAL ones from the old frontend fallback,
 * kept verbatim in src/data/testimonialSamples.json and backed up in
 * server/backups/testimonials/. They are inserted as REAL Testimonial documents
 * carrying the `testimonial-sample` tag and `visible: false`, so normal visitors
 * never see them; the owner can preview, publish or delete them from
 * Dashboard > Testimonials.
 *
 * Real client testimonials are never modified or deleted by --seed/--remove.
 * A full timestamped DB backup is written before any seeding or restoration.
 */
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const Testimonial = require('../models/Testimonial.model');

const DATA_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'testimonialSamples.json');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'testimonials');
const dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const TAG = dataset.tag;
const PROJECT_URL = dataset.previewUrl;

const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const fileArg = () => {
    const i = args.indexOf('--file');
    return i >= 0 ? args[i + 1] : null;
};

function payloadFor(sample) {
    return {
        ...sample,
        date: new Date(sample.date),
        tags: [...(sample.tags || []), TAG],
        website: PROJECT_URL,
        visible: false,
        featured: Boolean(sample.featured),
        verified: Boolean(sample.verified),
        source: 'import'
    };
}

function backupPath() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(BACKUP_DIR, `db-testimonials-${stamp}.json`);
}

async function connect() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/efolio';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}

async function exportBackup() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const records = await Testimonial.find({}).lean();
    const file = backupPath();
    fs.writeFileSync(file, JSON.stringify({
        exportedAt: new Date().toISOString(),
        collection: 'testimonials',
        count: records.length,
        note: 'Full backup taken before any sample-data operation. Existing records are preserved as they were.',
        records
    }, null, 2) + '\n');
    console.log(`Backup written: ${path.relative(process.cwd(), file)} (${records.length} records, real data untouched).`);
    return file;
}

async function seed() {
    await exportBackup();
    let created = 0;
    let existing = 0;
    for (const sample of dataset.samples) {
        const doc = payloadFor(sample);
        const result = await Testimonial.updateOne(
            { name: doc.name, tags: TAG },
            { $setOnInsert: doc },
            { upsert: true }
        );
        if (result.upsertedCount) created += 1;
        else existing += 1;
    }
    const total = await Testimonial.countDocuments({ tags: TAG });
    console.log(`Sample testimonials: ${created} inserted, ${existing} already present, ${total} tagged total.`);
    console.log('They are preview-only (visible:false). Publish with --publish or from Dashboard > Testimonials.');
}

async function remove() {
    const result = await Testimonial.deleteMany({ tags: TAG });
    console.log(`Removed ${result.deletedCount} sample testimonial(s). Real testimonials untouched.`);
}

async function setVisibility(visible) {
    const result = await Testimonial.updateMany({ tags: TAG }, { $set: { visible } });
    console.log(`${result.modifiedCount} sample testimonial(s) are now ${visible ? 'PUBLIC' : 'PREVIEW ONLY'}.`);
}

async function restore() {
    const file = fileArg();
    if (!file || !fs.existsSync(file)) {
        throw new Error('Provide an existing backup file: --restore --file <backup.json>');
    }
    await exportBackup();
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const records = Array.isArray(parsed) ? parsed : (parsed.records || parsed.samples || []);
    if (records.length === 0) throw new Error('Backup file contains no testimonial records.');
    let inserted = 0;
    let skipped = 0;
    for (const record of records) {
        const doc = { ...record };
        delete doc.__v;
        const filter = doc._id ? { _id: doc._id } : { name: doc.name };
        if (!doc._id) delete doc._id;
        const result = await Testimonial.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
        if (result.upsertedCount) inserted += 1;
        else skipped += 1;
    }
    console.log(`Restored ${inserted} record(s), ${skipped} already present. Nothing was deleted.`);
}

async function main() {
    try {
        await connect();
        if (has('--remove')) await remove();
        else if (has('--export')) await exportBackup();
        else if (has('--restore')) await restore();
        else if (has('--publish')) await setVisibility(true);
        else if (has('--unpublish')) await setVisibility(false);
        else await seed();
    } catch (error) {
        console.error('[testimonial-samples]', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) main();

module.exports = { TAG, PROJECT_URL, dataset, payloadFor };
