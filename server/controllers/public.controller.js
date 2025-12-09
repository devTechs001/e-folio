// controllers/public.controller.js
const Skill = require('../models/Skill.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const asyncHandler = require('express-async-handler');

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
        status = 'completed', 
        search, 
        sortBy = 'order', 
        order = 'asc',
        limit = 50 
    } = req.query;
    
    // Build filter for public projects
    const filter = { 
        status,
        visibility: 'public',
        featured: { $ne: false }
    };
    
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
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const projects = await Project.find(filter)
        .sort(sortOptions)
        .select('title description thumbnail technologies category links githubUrl demoUrl tags featured views likes status visibility createdAt')
        .limit(parseInt(limit))
        .lean();
    
    res.json({
        success: true,
        projects,
        count: projects.length
    });
});

// @desc    Get public profile
// @route   GET /api/public/profile
// @access  Public
exports.getProfile = asyncHandler(async (req, res) => {
    // Get the first user (assuming single portfolio setup)
    const user = await User.findOne({ role: 'owner' })
        .select('name email bio avatar location website github linkedin twitter')
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
