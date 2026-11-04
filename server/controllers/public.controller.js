// controllers/public.controller.js
const Skill = require('../models/Skill.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');
const { emitProjectStats } = require('../utils/projectEvents');

// Bounded, in-process like registry (no session middleware in this app).
const likeRegistry = new Map();
const LIKE_REGISTRY_LIMIT = 5000;

// @desc    Get public skills
// @route   GET /api/public/skills
// @access  Public
exports.getSkills = asyncHandler(async (req, res) => {
    const { type, search, sortBy = 'order', order = 'asc' } = req.query;
    
    // Build filter for public skills only
    const filter = { visible: true };
    
    if (type) filter.type = type;
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
        .select('name type level category icon visible order')
        .lean();
    
    res.json({
        success: true,
        skills,
        count: skills.length
    });
});

// @desc    Get public projects
// @route   GET /api/public/projects
// @route   GET /api/projects (for backward compatibility)
// @access  Public
exports.getProjects = asyncHandler(async (req, res) => {
    const { 
        category, 
        featured, 
        status, 
        search, 
        sortBy = 'order', 
        order = 'asc',
        limit = 50 
    } = req.query;
    
    // Build filter for public projects (show all visible, non-archived ones by default)
    const filter = { 
        visibility: 'public',
        hidden: { $ne: true },
        archived: { $ne: true }
    };
    
    if (status && status !== 'all' && status !== 'completed') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (featured !== undefined) filter.featured = featured === 'true';
    
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { technologies: { $in: [new RegExp(search, 'i')] } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }
    
    // Build sort options
    const sortOptions = {};
    if (['order', 'title', 'createdAt', 'views', 'likes', 'updatedAt'].includes(sortBy)) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1;
    }
    
    const projects = await Project.find(filter)
        .sort(sortOptions)
        .select('title description thumbnail technologies category links tags featured views likes status visibility createdAt updatedAt images fullDescription completionDate teamSize challenges achievements metrics pinned')
        .limit(parseInt(limit))
        .lean();

    // Add id field for frontend compatibility (lean queries don't include virtuals)
    const formatted = projects.map(p => ({
        ...p,
        id: p._id.toString()
    }));
    
    res.json({
        success: true,
        projects: formatted,
        count: formatted.length
    });
});

// @desc    Get public profile
// @route   GET /api/public/profile
// @access  Public
exports.getProfile = asyncHandler(async (req, res) => {
    // Get the first user (assuming single portfolio setup)
    const user = await User.findOne({ role: 'owner' })
        .select('name email bio avatar location website github linkedin twitter username')
        .lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Profile not found'
        });
    }

    res.json({
        success: true,
        profile: user
    });
});

// @desc    Refresh public projects cache signal (returns fresh stats)
// @route   POST /api/public/projects/refresh
// @access  Public
exports.refreshProjects = asyncHandler(async (req, res) => {
    const total = await Project.countDocuments({
        visibility: 'public',
        hidden: { $ne: true },
        archived: { $ne: true }
    });
    const featured = await Project.countDocuments({
        visibility: 'public',
        featured: true,
        hidden: { $ne: true },
        archived: { $ne: true }
    });

    res.json({
        success: true,
        message: 'Projects refreshed',
        stats: { total, featured }
    });
});

// @desc    Increment project view count
// @route   POST /api/public/projects/:id/view
// @access  Public
exports.incrementProjectView = asyncHandler(async (req, res) => {
    // Saved/archive copies use slug IDs; never let a CastError become a 500.
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }

    // Increment views
    project.views = (project.views || 0) + 1;
    await project.save();

    // Canonical broadcast: anonymous public pages get the same count as the
    // dashboard. The legacy root event is kept for existing listeners.
    emitProjectStats({
        projectId: project._id,
        title: project.title,
        likes: project.likes,
        views: project.views,
        action: 'view'
    }, req.app.get('io'));
    if (req.app.get('io')) {
        req.app.get('io').emit('project_view', {
            projectId: project._id,
            views: project.views
        });
    }

    res.json({
        success: true,
        views: project.views
    });
});

// @desc    Toggle project like
// @route   POST /api/public/projects/:id/like
// @access  Public
exports.toggleProjectLike = asyncHandler(async (req, res) => {
    // Saved/archive copies use slug IDs; never let a CastError become a 500.
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }

    // No express-session middleware is installed, so `req.session` was always
    // undefined and every request counted as a NEW like. Track the like state
    // in a bounded in-process registry instead.
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const likeKey = `${project._id}:${identifier}`;
    const hasLiked = likeRegistry.has(likeKey);

    if (hasLiked) {
        project.likes = Math.max((project.likes || 0) - 1, 0);
        likeRegistry.delete(likeKey);
    } else {
        project.likes = (project.likes || 0) + 1;
        if (likeRegistry.size >= LIKE_REGISTRY_LIMIT) likeRegistry.clear();
        likeRegistry.set(likeKey, true);
    }

    await project.save();

    emitProjectStats({
        projectId: project._id,
        title: project.title,
        likes: project.likes,
        views: project.views,
        action: hasLiked ? 'unlike' : 'like'
    }, req.app.get('io'));

    // Emit socket event for real-time update
    if (req.app.get('io')) {
        req.app.get('io').emit('project_like', {
            projectId: project._id,
            title: project.title,
            likes: project.likes,
            views: project.views,
            action: hasLiked ? 'unlike' : 'like'
        });
    }

    res.json({
        success: true,
        likes: project.likes,
        liked: !hasLiked
    });
});
