// controllers/interests.controller.js
//
// Phase 35 — the hobbies (interests) endpoints behind the dashboard.
//
// Everything here is owner-scoped by the router (`auth` + `isOwner`), except
// `getPublicInterests`, which is mounted on the public router and must never
// expose hidden records. Response shapes keep the existing keys the dashboard
// and the public page already read (`data`, `interests`, `count`).
const Interests = require('../models/Interests');
const asyncHandler = require('express-async-handler');

const LEVEL_SCORE = { beginner: 40, intermediate: 60, advanced: 80, expert: 95 };
const LEVELS = Object.keys(LEVEL_SCORE);
const MAX_TAGS = 8;

function interestLevelToNumber(level) {
    return LEVEL_SCORE[level] || 70;
}

/** Trim, drop blanks, de-duplicate and cap a tag list. */
function normaliseTags(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of value) {
        const tag = String(raw ?? '').trim().slice(0, 40);
        if (!tag) continue;
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(tag);
        if (out.length >= MAX_TAGS) break;
    }
    return out;
}

/** Only let the dashboard write fields the model actually declares. */
function pickWritable(body = {}) {
    const out = {};
    if (body.name !== undefined) out.name = String(body.name).trim();
    if (body.category !== undefined) out.category = String(body.category ?? '').trim();
    if (body.level !== undefined) out.level = body.level;
    if (body.description !== undefined) out.description = String(body.description ?? '').trim();
    if (body.icon !== undefined) out.icon = String(body.icon ?? '').trim();
    if (body.color !== undefined) out.color = String(body.color ?? '').trim();
    if (body.visible !== undefined) out.visible = Boolean(body.visible);
    if (body.tags !== undefined) out.tags = normaliseTags(body.tags);
    if (body.startedYear !== undefined) {
        const year = Number(body.startedYear);
        out.startedYear = Number.isFinite(year) && year > 0 ? year : undefined;
    }
    return out;
}

/** Shape the dashboard reads. IDs are always strings. */
function forOwner(doc) {
    const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
        id: String(raw._id),
        _id: raw._id,
        name: raw.name,
        title: raw.name,
        description: raw.description || '',
        category: raw.category || 'Other',
        level: raw.level || 'intermediate',
        levelScore: interestLevelToNumber(raw.level),
        icon: raw.icon || '',
        color: raw.color || '',
        order: raw.order ?? 0,
        visible: raw.visible !== false,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        startedYear: raw.startedYear ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

/** Public card shape — unchanged keys, plus the new optional ones. */
function forPublic(doc) {
    const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
        id: raw._id,
        icon: raw.icon || 'fas fa-star',
        title: raw.name,
        description: raw.description || '',
        category: raw.category || 'other',
        level: interestLevelToNumber(raw.level),
        color: raw.color || 'blue',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        relatedTech: [],
        startedYear: raw.startedYear ?? null
    };
}

const sortForOwner = { order: 1, createdAt: 1 };

// @desc    Get all interests
// @route   GET /api/interests
// @access  Private (Owner only)
exports.getInterests = asyncHandler(async (req, res) => {
    const query = {};

    // Optional dashboard filters. Absent params behave exactly as before.
    const { category, visible, q } = req.query;
    if (category && category !== 'all') query.category = category;
    if (visible === 'true') query.visible = true;
    if (visible === 'false') query.visible = false;
    if (q && String(q).trim()) {
        const pattern = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: pattern }, { description: pattern }, { category: pattern }, { tags: pattern }];
    }

    const interests = await Interests.find(query).sort(sortForOwner);

    res.json({
        success: true,
        count: interests.length,
        data: interests.map(forOwner),
        // The dashboard reads `interests` on newer builds and `data` on older
        // ones; both point at the same array so nothing has to branch.
        interests: interests.map(forOwner)
    });
});

// @desc    Get all interests (public)
// @route   GET /api/public/interests
// @access  Public
exports.getPublicInterests = asyncHandler(async (req, res) => {
    // Hidden hobbies are the owner's working list, never public content.
    const interests = await Interests.find({ visible: { $ne: false } }).sort(sortForOwner);

    const formatted = interests.map(forPublic);

    res.json({
        success: true,
        count: formatted.length,
        data: formatted,
        interests: formatted
    });
});

// @desc    Add interest
// @route   POST /api/interests
// @access  Private (Owner only)
exports.addInterest = asyncHandler(async (req, res) => {
    const payload = pickWritable(req.body);

    // New hobbies go to the end of the manual order instead of defaulting to
    // 0, which would have shuffled them to the top of an existing list.
    const last = await Interests.findOne({}).sort({ order: -1 }).select('order').lean();
    payload.order = last && Number.isFinite(last.order) ? last.order + 1 : 0;

    const interest = await Interests.create(payload);

    res.status(201).json({
        success: true,
        data: forOwner(interest),
        interest: forOwner(interest)
    });
});

// @desc    Update interest
// @route   PUT /api/interests/:id
// @access  Private (Owner only)
exports.updateInterest = asyncHandler(async (req, res) => {
    let interest = await Interests.findById(req.params.id);

    if (!interest) {
        res.status(404);
        throw new Error('Interest not found');
    }

    const payload = pickWritable(req.body);
    // `order` is owned by the reorder endpoint; a plain edit must not move it.
    delete payload.order;

    interest = await Interests.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: forOwner(interest),
        interest: forOwner(interest)
    });
});

// @desc    Delete interest
// @route   DELETE /api/interests/:id
// @access  Private (Owner only)
exports.deleteInterest = asyncHandler(async (req, res) => {
    const interest = await Interests.findById(req.params.id);

    if (!interest) {
        res.status(404);
        throw new Error('Interest not found');
    }

    await interest.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});

// @desc    Reorder hobbies
// @route   POST /api/interests/reorder
// @access  Private (Owner only)
exports.reorderInterests = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        res.status(400);
        throw new Error('Expected an items array');
    }

    const known = await Interests.find({}).select('_id').lean();
    const valid = new Set(known.map(doc => String(doc._id)));

    const updates = items
        .filter(item => item && valid.has(String(item.id)))
        // Ignore unknown ids instead of failing the whole reorder: a stale
        // dashboard tab should not be able to block a save.
        .map((item, index) => ({
            updateOne: {
                filter: { _id: String(item.id) },
                update: { $set: { order: Number.isFinite(Number(item.order)) ? Number(item.order) : index } }
            }
        }));

    if (updates.length) await Interests.bulkWrite(updates);

    res.json({ success: true, message: 'Hobbies reordered', updated: updates.length });
});

// @desc    Quick show/hide without opening the edit form
// @route   PATCH /api/interests/:id/visibility
// @access  Private (Owner only)
exports.setInterestVisibility = asyncHandler(async (req, res) => {
    const interest = await Interests.findById(req.params.id);
    if (!interest) {
        res.status(404);
        throw new Error('Interest not found');
    }

    interest.visible = Boolean(req.body.visible);
    await interest.save();

    res.json({ success: true, data: forOwner(interest) });
});

// @desc    Dashboard summary for the hobbies page
// @route   GET /api/interests/stats
// @access  Private (Owner only)
exports.getInterestStats = asyncHandler(async (req, res) => {
    const [byCategory, byLevel, byVisibility, total, recent, tagged] = await Promise.all([
        Interests.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Interests.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
        Interests.aggregate([{ $group: { _id: '$visible', count: { $sum: 1 } } }]),
        Interests.countDocuments(),
        Interests.find({}).sort({ createdAt: -1 }).limit(5).select('name category createdAt').lean(),
        Interests.countDocuments({ tags: { $exists: true, $not: { $size: 0 } } })
    ]);

    const hidden = byVisibility
        .filter(row => row._id === false)
        .reduce((sum, row) => sum + row.count, 0);

    // Average "level score" so the dashboard can show a real number instead of
    // the placeholder that used to be there.
    const levels = await Interests.find({}).select('level').lean();
    const scored = levels.map(row => interestLevelToNumber(row.level));
    const averageLevel = scored.length
        ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
        : 0;

    res.json({
        success: true,
        stats: {
            total,
            visible: total - hidden,
            hidden,
            categories: byCategory.filter(row => row._id).length,
            tagged,
            averageLevel,
            byCategory: byCategory.map(row => ({ category: row._id || 'Other', count: row.count })),
            byLevel: LEVELS.map(level => ({
                level,
                count: byLevel.find(row => row._id === level)?.count || 0
            })),
            recent: recent.map(row => ({
                id: String(row._id),
                name: row.name,
                category: row.category || 'Other',
                createdAt: row.createdAt
            }))
        }
    });
});

// @desc    Export hobbies as JSON (re-importable through the dashboard)
// @route   GET /api/interests/export
// @access  Private (Owner only)
exports.exportInterests = asyncHandler(async (req, res) => {
    const interests = await Interests.find({}).sort(sortForOwner);

    res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        version: 1,
        count: interests.length,
        hobbies: interests.map(doc => {
            const item = forOwner(doc);
            // Export what can be imported back; ids and timestamps are local
            // to this database and would collide on a different one.
            return {
                name: item.name,
                description: item.description,
                category: item.category,
                level: item.level,
                icon: item.icon,
                color: item.color,
                visible: item.visible,
                tags: item.tags,
                startedYear: item.startedYear
            };
        })
    });
});

// @desc    Bulk import hobbies
// @route   POST /api/interests/import
// @access  Private (Owner only)
exports.importInterests = asyncHandler(async (req, res) => {
    const source = Array.isArray(req.body?.hobbies)
        ? req.body.hobbies
        : Array.isArray(req.body)
            ? req.body
            : null;

    if (!source) {
        res.status(400);
        throw new Error('Expected a hobbies array');
    }
    if (source.length > 200) {
        res.status(400);
        throw new Error('Import is limited to 200 hobbies at a time');
    }

    const existing = await Interests.find({}).select('name').lean();
    const seen = new Set(existing.map(doc => String(doc.name || '').toLowerCase()));
    const last = await Interests.findOne({}).sort({ order: -1 }).select('order').lean();
    let order = last && Number.isFinite(last.order) ? last.order : 0;

    const created = [];
    const skipped = [];

    for (const raw of source) {
        const payload = pickWritable(raw || {});
        if (!payload.name) {
            skipped.push({ name: raw?.name || '', reason: 'missing-name' });
            continue;
        }
        const key = payload.name.toLowerCase();
        if (seen.has(key)) {
            skipped.push({ name: payload.name, reason: 'already-exists' });
            continue;
        }
        seen.add(key);
        order += 1;
        // `insertMany` would skip validation per document; creating one at a
        // time keeps a single bad row from failing the whole import.
        try {
            created.push(await Interests.create({ ...payload, order }));
        } catch (error) {
            skipped.push({ name: payload.name, reason: 'invalid' });
        }
    }

    res.status(existing.length && created.length ? 200 : 201).json({
        success: true,
        imported: created.length,
        skipped: skipped.length,
        details: skipped,
        data: created.map(forOwner)
    });
});
