const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getInterests,
    addInterest,
    updateInterest,
    deleteInterest
} = require('../controllers/interests.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');

// Validation rules
const interestsValidation = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Interest name is required'),
    body('category').optional().trim(),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Level must be valid'),
    body('description').optional().trim()
];

// All routes require authentication and owner access
router.use(auth);
router.use(isOwner);

router.route('/')
    .get(getInterests)
    .post(interestsValidation, addInterest);

router.route('/:id')
    .put(interestsValidation, updateInterest)
    .delete(deleteInterest);

module.exports = router;