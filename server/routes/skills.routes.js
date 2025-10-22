const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skills.controller');
// const { verifyToken } = require('../middleware/auth.middleware'); // Uncomment when auth is needed

// Public routes
router.get('/', skillsController.getSkills);
router.get('/stats', skillsController.getSkillsStats);
router.get('/:id', skillsController.getSkillById);

// Protected routes (uncomment verifyToken when auth is ready)
router.post('/', /* verifyToken, */ skillsController.createSkill);
router.post('/bulk', /* verifyToken, */ skillsController.bulkCreateSkills);
router.put('/:id', /* verifyToken, */ skillsController.updateSkill);
router.delete('/:id', /* verifyToken, */ skillsController.deleteSkill);

module.exports = router;
