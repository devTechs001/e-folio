const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getInterests,
    addInterest,
    updateInterest,
    deleteInterest,
    reorderInterests,
    setInterestVisibility,
    getInterestStats,
    exportInterests,
    importInterests
} = require('../controllers/interests.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');
const { labSync } = require('../middleware/labSync.middleware');

// Validation rules
const interestsValidation = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Interest name is required'),
    body('category').optional().trim(),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Level must be valid'),
    body('description').optional().trim(),
    body('tags').optional().isArray({ max: 8 }).withMessage('Up to 8 tags'),
    body('startedYear').optional({ nullable: true }).isInt({ min: 1900, max: 2100 }).withMessage('Year must be valid')
];

// All routes require authentication and owner access
router.use(auth);
router.use(isOwner);
// Phase 24: tell public Lab pages to refresh after a successful write.
router.use(labSync('interests'));

// Read-only routes. These must come before `/:id` so the literal names are not
// read as an id. `labSync` is a no-op for GET, so listing them here is purely
// about ordering.
router.get('/stats', getInterestStats);
router.get('/export', exportInterests);
router.post('/reorder', reorderInterests);
router.post('/import', importInterests);

router.route('/')
    .get(getInterests)
    .post(interestsValidation, addInterest);

router.patch('/:id/visibility', setInterestVisibility);

router.route('/:id')
    .put(interestsValidation, updateInterest)
    .delete(deleteInterest);

module.exports = router;
