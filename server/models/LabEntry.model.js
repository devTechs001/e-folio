// models/LabEntry.model.js
/**
 * Phase 42 — the Lab is its own module.
 *
 * Before this, an "experiment" was just a `Project` document that happened to
 * carry a lab status or a `lab-sample` tag. Both dashboards and both public
 * pages therefore read and wrote ONE collection, so the two modules could not
 * be separated by anything stronger than a client-side filter, and every Lab
 * card was implicitly also a portfolio project.
 *
 * `LabEntry` is a separate collection in its own right. It models a
 * cybersecurity operations record — an engagement, lab build or research note —
 * not a software product. Nothing here is derived from Project and no Project
 * document is ever matched as a lab record.
 */
const mongoose = require('mongoose');

/** Statuses shown as Lab filters. Mirrors LAB_STATUSES in the client. */
const LAB_STATUSES = ['development', 'experimental', 'beta', 'live', 'archived'];

/** Cybersecurity domains, not software categories. */
const LAB_DOMAINS = [
    'Reconnaissance',
    'Network Security',
    'Web Security',
    'Cloud Security',
    'Wireless Security',
    'Systems & Active Directory',
    'Malware Analysis',
    'Digital Forensics',
    'Blue Team',
    'Tooling'
];

const labEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Lab entry title is required'],
        trim: true,
        maxlength: [120, 'Title cannot exceed 120 characters']
    },
    /**
     * Stable, URL-safe identity. Used by the seeder for idempotency and by the
     * client to dedupe a live record against its saved copy, so a rebuilt
     * snapshot cannot produce a duplicate card.
     */
    slug: {
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    summary: {
        type: String,
        required: [true, 'A short summary is required'],
        trim: true,
        maxlength: [240, 'Summary cannot exceed 240 characters']
    },
    description: {
        type: String,
        default: '',
        maxlength: [4000, 'Description cannot exceed 4000 characters']
    },
    domain: {
        type: String,
        enum: LAB_DOMAINS,
        default: 'Tooling',
        index: true
    },
    status: {
        type: String,
        enum: LAB_STATUSES,
        default: 'development',
        index: true
    },
    /** What the experiment runs against. Kept free-form and honest. */
    environment: { type: String, trim: true, default: '' },
    /** Deliberately-scoped surface, e.g. "lab VLAN only". No live targets. */
    scope: { type: String, trim: true, default: '' },
    tools: [{ type: String, trim: true }],
    findings: { type: String, default: '', maxlength: 4000 },
    links: {
        github: { type: String, trim: true },
        writeup: { type: String, trim: true },
        documentation: { type: String, trim: true }
    },
    thumbnail: { type: String, trim: true, default: '' },
    images: [{
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    tags: [{ type: String, trim: true }],
    difficulty: {
        type: String,
        enum: ['introductory', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    featured: { type: Boolean, default: false, index: true },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public',
        index: true
    },
    hidden: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    startedAt: Date,
    completedAt: Date,
    /** Provenance for seeded records, so `--remove` can target exactly them. */
    seedKey: { type: String, trim: true, default: '' }
}, {
    timestamps: true
});

// Public listing and the dashboard both filter on these.
labEntrySchema.index({ visibility: 1, hidden: 1, status: 1 });
// Declared once, here. `index: true` on the path plus this line produced a
// duplicate-index warning at connect time.
labEntrySchema.index({ seedKey: 1 }, { sparse: true });

/** One record per (owner, slug): a reseed updates instead of duplicating. */
labEntrySchema.index(
    { userId: 1, slug: 1 },
    { unique: true, partialFilterExpression: { slug: { $type: 'string', $ne: '' } } }
);

module.exports = mongoose.model('LabEntry', labEntrySchema);
module.exports.LAB_STATUSES = LAB_STATUSES;
module.exports.LAB_DOMAINS = LAB_DOMAINS;
