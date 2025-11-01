// routes/skillRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getSkills,
    getSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    bulkDeleteSkills,
    reorderSkills,
    getAnalytics,
    getSkillGroups,
    createSkillGroup,
    updateSkillGroup,
    deleteSkillGroup
} = require('../controllers/skills.controller');
const { auth: protect } = require('../middleware/auth.middleware');

// Validation rules
const skillValidation = [
    body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name is required'),
    body('type').isIn(['technical', 'professional']).withMessage('Invalid type'),
    body('level').isInt({ min: 0, max: 100 }).withMessage('Level must be 0-100')
];

// All routes require authentication
router.use(protect);

// Main routes
router.route('/')
    .get(getSkills)
    .post(skillValidation, addSkill);

router.get('/analytics', getAnalytics);
router.post('/bulk-delete', bulkDeleteSkills);
router.post('/reorder', reorderSkills);

router.route('/:id')
    .get(getSkill)
    .put(updateSkill)
    .delete(deleteSkill);

// Group routes
router.route('/groups')
    .get(getSkillGroups)
    .post(createSkillGroup);

router.route('/groups/:id')
    .put(updateSkillGroup)
    .delete(deleteSkillGroup);

module.exports = router;