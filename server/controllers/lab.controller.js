// controllers/lab.controller.js
/**
 * Phase 42 — Lab module controller.
 *
 * Reads and writes ONLY `LabEntry`. It never touches the Project collection, so
 * the two modules cannot leak into each other at the data layer regardless of
 * what the client does.
 */
const LabEntry = require('../models/LabEntry.model');
const { LAB_STATUSES } = require('../models/LabEntry.model');

const PUBLIC_FIELDS = [
    'title', 'slug', 'summary', 'description', 'domain', 'status', 'environment',
    'scope', 'tools', 'findings', 'links', 'thumbnail', 'images', 'tags',
    'difficulty', 'featured', 'views', 'likes', 'startedAt', 'completedAt', 'createdAt'
].join(' ');

const trimmed = value => (typeof value === 'string' ? value.trim() : value);

/** Whitelist request fields: never let a client write userId/seedKey/views. */
const pickWritable = body => {
    const out = {};
    const allowed = [
        'title', 'slug', 'summary', 'description', 'domain', 'status', 'environment',
        'scope', 'tools', 'findings', 'links', 'thumbnail', 'images', 'tags',
        'difficulty', 'featured', 'visibility', 'hidden', 'startedAt', 'completedAt'
    ];
    for (const key of allowed) {
        if (body[key] !== undefined) out[key] = trimmed(body[key]);
    }
    return out;
};

const slugify = value => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/**
 * GET /api/public/lab
 * Public experiment grid. Only published, non-hidden records.
 */
exports.getPublicLabEntries = async (req, res) => {
    try {
        const { status, domain, search, limit = 100 } = req.query;
        const filter = { visibility: 'public', hidden: { $ne: true } };

        if (status && status !== 'all') filter.status = status;
        if (domain && domain !== 'all') filter.domain = domain;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { summary: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const capped = Math.min(Number(limit) || 100, 200);
        const entries = await LabEntry.find(filter)
            .sort({ featured: -1, createdAt: -1 })
            .limit(capped)
            .select(PUBLIC_FIELDS)
            .lean();

        res.json({ success: true, experiments: entries, total: entries.length });
    } catch (error) {
        console.error('Error fetching public lab entries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lab entries' });
    }
};

/**
 * GET /api/lab
 * Owner view — every record, including hidden and private ones.
 */
exports.getLabEntries = async (req, res) => {
    try {
        const entries = await LabEntry.find({}).sort({ createdAt: -1 }).lean();
        res.json({ success: true, experiments: entries, total: entries.length });
    } catch (error) {
        console.error('Error fetching lab entries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lab entries' });
    }
};

/** GET /api/lab/stats — real counts, computed by the database. */
exports.getLabStats = async (req, res) => {
    try {
        const [byStatus, total, domains] = await Promise.all([
            LabEntry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            LabEntry.countDocuments({}),
            LabEntry.distinct('domain')
        ]);
        const statuses = Object.fromEntries(LAB_STATUSES.map(status => [status, 0]));
        for (const row of byStatus) {
            if (row._id && statuses[row._id] !== undefined) statuses[row._id] = row.count;
        }
        res.json({
            success: true,
            total,
            statuses,
            domains: domains.filter(Boolean),
            seeded: await LabEntry.countDocuments({ seedKey: { $ne: '' } })
        });
    } catch (error) {
        console.error('Error fetching lab stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lab stats' });
    }
};

exports.getLabEntry = async (req, res) => {
    try {
        const entry = await LabEntry.findById(req.params.id).lean();
        if (!entry) return res.status(404).json({ success: false, message: 'Lab entry not found' });
        res.json({ success: true, experiment: entry });
    } catch (error) {
        console.error('Error fetching lab entry:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lab entry' });
    }
};

exports.createLabEntry = async (req, res) => {
    try {
        const payload = pickWritable(req.body);
        if (!payload.title || !payload.summary) {
            return res.status(400).json({
                success: false,
                message: 'Title and summary are required'
            });
        }
        payload.userId = req.user._id;
        payload.slug = slugify(payload.slug || payload.title);
        // A lab entry authored by the owner is never "seeded"; seedKey stays ''.

        const entry = await LabEntry.create(payload);
        res.status(201).json({ success: true, experiment: entry });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A lab entry with that slug already exists'
            });
        }
        console.error('Error creating lab entry:', error);
        res.status(500).json({ success: false, message: 'Failed to create lab entry' });
    }
};

exports.updateLabEntry = async (req, res) => {
    try {
        const payload = pickWritable(req.body);
        if (payload.title && !payload.slug) payload.slug = slugify(payload.title);

        const entry = await LabEntry.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true, runValidators: true }
        );
        if (!entry) return res.status(404).json({ success: false, message: 'Lab entry not found' });
        res.json({ success: true, experiment: entry });
    } catch (error) {
        console.error('Error updating lab entry:', error);
        res.status(500).json({ success: false, message: 'Failed to update lab entry' });
    }
};

exports.deleteLabEntry = async (req, res) => {
    try {
        const entry = await LabEntry.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ success: false, message: 'Lab entry not found' });
        res.json({ success: true, message: 'Lab entry deleted' });
    } catch (error) {
        console.error('Error deleting lab entry:', error);
        res.status(500).json({ success: false, message: 'Failed to delete lab entry' });
    }
};

/** POST /api/lab/:id/view — real view counter. */
exports.viewLabEntry = async (req, res) => {
    try {
        const entry = await LabEntry.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        ).select('views');
        if (!entry) return res.status(404).json({ success: false, message: 'Lab entry not found' });
        res.json({ success: true, views: entry.views });
    } catch (error) {
        console.error('Error recording lab view:', error);
        res.status(500).json({ success: false, message: 'Failed to record view' });
    }
};

/** POST /api/lab/:id/like — real like counter, owner-authenticated. */
exports.likeLabEntry = async (req, res) => {
    try {
        const entry = await LabEntry.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        ).select('likes');
        if (!entry) return res.status(404).json({ success: false, message: 'Lab entry not found' });
        res.json({ success: true, likes: entry.likes });
    } catch (error) {
        console.error('Error recording lab like:', error);
        res.status(500).json({ success: false, message: 'Failed to record like' });
    }
};
