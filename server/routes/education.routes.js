const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getEducation,
    addEducation,
    updateEducation,
    deleteEducation
} = require('../controllers/education.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');

// Validation rules
const educationValidation = [
    body('institution').trim().isLength({ min: 1 }).withMessage('Institution is required'),
    body('degree').trim().isLength({ min: 1 }).withMessage('Degree is required'),
    body('fieldOfStudy').trim().isLength({ min: 1 }).withMessage('Field of study is required'),
    body('startDate').isISO8601().withMessage('Start date is required and must be valid'),
    body('endDate').optional().isISO8601().withMessage('End date must be valid if provided'),
    body('description').optional().trim()
];

// All routes require authentication and owner access
router.use(auth);
router.use(isOwner);

router.route('/')
    .get(getEducation)
    .post(educationValidation, addEducation);

router.route('/:id')
    .put(educationValidation, updateEducation)
    .delete(deleteEducation);

module.exports = router;