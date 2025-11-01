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
    body('category').isIn(['Web', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain', 'DevOps', 'Other']),
    body('status').optional().isIn(['planning', 'in-progress', 'completed', 'archived'])
];

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