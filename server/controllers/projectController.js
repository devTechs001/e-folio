// controllers/projectController.js
const Project = require('../models/Project.model');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res) => {
    const {
        status,
        category,
        featured,
        search,
        sortBy = 'createdAt',
        order = 'desc',
        page = 1,
        limit = 20
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (featured) filter.featured = featured === 'true';
    
    if (search) {
        filter.$text = { $search: search };
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [projects, total] = await Promise.all([
        Project.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Project.countDocuments(filter)
    ]);

    res.json({
        success: true,
        projects,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
        }
    });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Increment views
    project.views += 1;
    await project.save();

    res.json({ success: true, project });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error('Validation failed');
    }

    const project = await Project.create({
        ...req.body,
        userId: req.user.id
    });

    res.status(201).json({ success: true, project });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Update fields
    Object.assign(project, req.body);
    await project.save();

    res.json({ success: true, project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted' });
});

// @desc    Bulk delete projects
// @route   POST /api/projects/bulk-delete
// @access  Private
exports.bulkDeleteProjects = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400);
        throw new Error('Invalid project IDs');
    }

    const result = await Project.deleteMany({
        _id: { $in: ids },
        userId: req.user.id
    });

    res.json({
        success: true,
        message: `Deleted ${result.deletedCount} projects`
    });
});

// @desc    Get project analytics
// @route   GET /api/projects/analytics
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [
        totalProjects,
        statusBreakdown,
        categoryBreakdown,
        recentActivity,
        topTechnologies,
        monthlyTrend
    ] = await Promise.all([
        Project.countDocuments({ userId }),
        
        Project.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        
        Project.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        
        Project.find({ userId })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title updatedAt status')
            .lean(),
        
        Project.aggregate([
            { $match: { userId: userId } },
            { $unwind: '$technologies' },
            { $group: { _id: '$technologies', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]),
        
        Project.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ])
    ]);

    res.json({
        success: true,
        analytics: {
            totalProjects,
            statusBreakdown,
            categoryBreakdown,
            recentActivity,
            topTechnologies,
            monthlyTrend
        }
    });
});

// @desc    Upload project image
// @route   POST /api/projects/:id/images
// @access  Private
exports.uploadImage = asyncHandler(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No image file uploaded');
    }

    const imageData = {
        url: req.file.path, // Cloudinary URL
        caption: req.body.caption || '',
        uploadedAt: new Date()
    };

    project.images.push(imageData);
    await project.save();

    res.json({ success: true, image: imageData });
});

// @desc    Sync GitHub metrics
// @route   POST /api/projects/:id/sync-github
// @access  Private
exports.syncGitHubMetrics = asyncHandler(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!project || !project.links?.github) {
        res.status(404);
        throw new Error('Project or GitHub link not found');
    }

    // Extract repo info from GitHub URL
    const match = project.links.github.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        res.status(400);
        throw new Error('Invalid GitHub URL');
    }

    const [, owner, repo] = match;

    try {
        // Fetch from GitHub API (you'll need to install axios and set up GitHub token)
        const axios = require('axios');
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            }
        );

        project.metrics = {
            stars: response.data.stargazers_count,
            forks: response.data.forks_count,
            commits: 0, // Would need additional API call
            lastCommit: response.data.pushed_at
        };

        await project.save();

        res.json({ success: true, metrics: project.metrics });
    } catch (error) {
        res.status(500);
        throw new Error('Failed to sync GitHub metrics');
    }
});