// controllers/skillController.js
const Skill = require('../models/Skill.model');
const SkillGroup = require('../models/SkillGroup');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Private
exports.getSkills = asyncHandler(async (req, res) => {
    const {
        type,
        category,
        level,
        featured,
        visible,
        search,
        sortBy = 'order',
        order = 'asc'
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (visible !== undefined) filter.visible = visible === 'true';
    
    if (level) {
        if (level === 'beginner') filter.level = { $lt: 40 };
        else if (level === 'intermediate') filter.level = { $gte: 40, $lt: 70 };
        else if (level === 'advanced') filter.level = { $gte: 70 };
    }
    
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ];
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skills = await Skill.find(filter)
        .sort(sortOptions)
        .populate('projects', 'title')
        .lean();

    res.json({
        success: true,
        skills,
        count: skills.length
    });
});

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Private
exports.getSkill = asyncHandler(async (req, res) => {
    const skill = await Skill.findOne({
        _id: req.params.id,
        userId: req.user.id
    }).populate('projects');

    if (!skill) {
        res.status(404);
        throw new Error('Skill not found');
    }

    res.json({ success: true, skill });
});

// @desc    Add skill
// @route   POST /api/skills
// @access  Private
exports.addSkill = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error('Validation failed');
    }

    // Get the max order value
    const maxOrderSkill = await Skill.findOne({ userId: req.user.id })
        .sort('-order')
        .select('order')
        .lean();

    const skill = await Skill.create({
        ...req.body,
        userId: req.user.id,
        order: (maxOrderSkill?.order || 0) + 1
    });

    res.status(201).json({ success: true, skill });
});

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
exports.updateSkill = asyncHandler(async (req, res) => {
    const skill = await Skill.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!skill) {
        res.status(404);
        throw new Error('Skill not found');
    }

    // Update allowed fields
    const allowedUpdates = [
        'name', 'level', 'category', 'icon', 'color',
        'yearsOfExperience', 'certifications', 'learningResources',
        'visible', 'featured', 'endorsements', 'projects', 'groupId'
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            skill[field] = req.body[field];
        }
    });

    await skill.save();

    res.json({ success: true, skill });
});

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
exports.deleteSkill = asyncHandler(async (req, res) => {
    const skill = await Skill.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!skill) {
        res.status(404);
        throw new Error('Skill not found');
    }

    await skill.deleteOne();

    res.json({ success: true, message: 'Skill deleted' });
});

// @desc    Bulk delete skills
// @route   POST /api/skills/bulk-delete
// @access  Private
exports.bulkDeleteSkills = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400);
        throw new Error('Invalid skill IDs');
    }

    const result = await Skill.deleteMany({
        _id: { $in: ids },
        userId: req.user.id
    });

    res.json({
        success: true,
        message: `Deleted ${result.deletedCount} skills`
    });
});

// @desc    Reorder skills
// @route   POST /api/skills/reorder
// @access  Private
exports.reorderSkills = asyncHandler(async (req, res) => {
    const { skills } = req.body; // Array of { id, order }

    if (!skills || !Array.isArray(skills)) {
        res.status(400);
        throw new Error('Invalid skills data');
    }

    const updatePromises = skills.map(({ id, order }) =>
        Skill.updateOne(
            { _id: id, userId: req.user.id },
            { order }
        )
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Skills reordered' });
});

// @desc    Get skill analytics
// @route   GET /api/skills/analytics
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [
        totalSkills,
        typeBreakdown,
        categoryBreakdown,
        levelBreakdown,
        topSkills,
        recentlyAdded,
        averageLevel
    ] = await Promise.all([
        Skill.countDocuments({ userId }),
        
        Skill.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        
        Skill.aggregate([
            { $match: { userId: userId, type: 'technical' } },
            { $group: { _id: '$category', count: { $sum: 1 }, avgLevel: { $avg: '$level' } } },
            { $sort: { count: -1 } }
        ]),
        
        Skill.aggregate([
            { $match: { userId: userId } },
            {
                $bucket: {
                    groupBy: '$level',
                    boundaries: [0, 40, 70, 100],
                    default: 'Other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]),
        
        Skill.find({ userId })
            .sort({ level: -1 })
            .limit(10)
            .select('name level category color icon')
            .lean(),
        
        Skill.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name level createdAt')
            .lean(),
        
        Skill.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, avgLevel: { $avg: '$level' } } }
        ])
    ]);

    res.json({
        success: true,
        analytics: {
            totalSkills,
            typeBreakdown,
            categoryBreakdown,
            levelBreakdown,
            topSkills,
            recentlyAdded,
            averageLevel: Math.round(averageLevel[0]?.avgLevel || 0)
        }
    });
});

// Skill Groups

// @desc    Get skill groups
// @route   GET /api/skills/groups
// @access  Private
exports.getSkillGroups = asyncHandler(async (req, res) => {
    const groups = await SkillGroup.find({ userId: req.user.id })
        .sort('order')
        .lean();

    // Get skill count for each group
    const groupsWithCounts = await Promise.all(
        groups.map(async (group) => ({
            ...group,
            skillCount: await Skill.countDocuments({ groupId: group._id })
        }))
    );

    res.json({
        success: true,
        groups: groupsWithCounts
    });
});

// @desc    Create skill group
// @route   POST /api/skills/groups
// @access  Private
exports.createSkillGroup = asyncHandler(async (req, res) => {
    const { name, color, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Group name is required');
    }

    const maxOrderGroup = await SkillGroup.findOne({ userId: req.user.id })
        .sort('-order')
        .select('order')
        .lean();

    const group = await SkillGroup.create({
        userId: req.user.id,
        name,
        color: color || '#3b82f6',
        description,
        order: (maxOrderGroup?.order || 0) + 1
    });

    res.status(201).json({ success: true, group });
});

// @desc    Update skill group
// @route   PUT /api/skills/groups/:id
// @access  Private
exports.updateSkillGroup = asyncHandler(async (req, res) => {
    const group = await SkillGroup.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    const { name, color, description } = req.body;
    
    if (name) group.name = name;
    if (color) group.color = color;
    if (description !== undefined) group.description = description;

    await group.save();

    res.json({ success: true, group });
});

// @desc    Delete skill group
// @route   DELETE /api/skills/groups/:id
// @access  Private
exports.deleteSkillGroup = asyncHandler(async (req, res) => {
    const group = await SkillGroup.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    // Remove groupId from all skills in this group
    await Skill.updateMany(
        { groupId: group._id },
        { $unset: { groupId: '' } }
    );

    await group.deleteOne();

    res.json({ success: true, message: 'Group deleted' });
});