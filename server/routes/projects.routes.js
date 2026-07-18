// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    bulkDeleteProjects,
    getAnalytics,
    uploadImage,
    syncGitHubMetrics,
    likeProject,
    unlikeProject,
    viewProject,
    shareProject,
    getProjectStats,
    toggleFavoriteProject,
    getFavoriteProjects
} = require('../controllers/projectController');
const { auth: protect, isOwner } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/uploadMiddleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Validation rules
const projectValidation = [
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required'),
    body('category').optional().isIn(['Web', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain', 'DevOps', 'Data', 'Game', 'IoT', 'Other']),
    body('status').optional().isIn(['idea', 'planning', 'in-progress', 'testing', 'completed', 'on-hold', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('visibility').optional().isIn(['public', 'private', 'unlisted'])
];

// Public endpoint (no auth required)
router.get('/public', async (req, res) => {
    try {
        const Project = require('../models/Project.model');
        
        const projects = await Project.find({ 
            visibility: 'public',
            hidden: false,
            archived: false 
        })
        .select('title description technologies category status featured tags views likes links images completionDate teamSize challenges achievements fullDescription')
        .sort({ featured: -1, createdAt: -1 })
        .lean();

        res.json({
            success: true,
            projects,
            total: projects.length
        });
    } catch (error) {
        console.error('Error fetching public projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects'
        });
    }
});

// Public project interactions (rate limited, no auth required for portfolio visitors)
router.post('/:id/like', rateLimiter(30), likeProject);
router.post('/:id/unlike', rateLimiter(30), unlikeProject);
router.post('/:id/view', rateLimiter(60), viewProject);
router.post('/:id/share', rateLimiter(20), shareProject);
router.get('/:id/stats', rateLimiter(30), getProjectStats);

// All routes below require authentication
router.use(protect);

// Main routes
router.route('/')
    .get(getProjects)
    .post(isOwner, projectValidation, createProject);

router.get('/analytics', getAnalytics);
router.post('/bulk-delete', isOwner, bulkDeleteProjects);
router.get('/favorites', getFavoriteProjects);

router.route('/:id')
    .get(getProject)
    .put(isOwner, projectValidation, updateProject)
    .delete(isOwner, deleteProject);

// Favorites (authenticated user)
router.post('/:id/favorite', toggleFavoriteProject);

router.post('/:id/images', isOwner, upload.single('image'), uploadImage);
router.post('/:id/sync-github', isOwner, syncGitHubMetrics);

module.exports = router;