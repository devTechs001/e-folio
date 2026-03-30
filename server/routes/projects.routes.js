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
    syncGitHubMetrics
} = require('../controllers/projectController');
const { auth: protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/uploadMiddleware');

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

// All routes require authentication
router.use(protect);

// Main routes
router.route('/')
    .get(getProjects)
    .post(projectValidation, createProject);

router.get('/analytics', getAnalytics);
router.post('/bulk-delete', bulkDeleteProjects);

router.route('/:id')
    .get(getProject)
    .put(projectValidation, updateProject)
    .delete(deleteProject);

router.post('/:id/images', upload.single('image'), uploadImage);
router.post('/:id/sync-github', syncGitHubMetrics);

module.exports = router;