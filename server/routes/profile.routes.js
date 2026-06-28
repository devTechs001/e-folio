const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const profileController = require('../controllers/profile.controller');
const { auth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { success: false, message: 'Too many requests' }
});

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Validation rules
const certValidation = [
    body('name').trim().isLength({ min: 1 }).withMessage('Certificate name is required'),
    body('issuer').trim().isLength({ min: 1 }).withMessage('Issuer is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('credentialId').optional().trim(),
    body('credentialUrl').optional().isURL().withMessage('Valid URL required')
];

const expValidation = [
    body('company').trim().isLength({ min: 1 }).withMessage('Company is required'),
    body('position').trim().isLength({ min: 1 }).withMessage('Position is required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date required'),
    body('description').optional().trim()
];

const langValidation = [
    body('name').trim().isLength({ min: 1 }).withMessage('Language name required'),
    body('level').isIn(['basic', 'intermediate', 'advanced', 'native', 'fluent']).withMessage('Invalid level')
];

// Profile routes
router.get('/', auth, profileController.getProfile.bind(profileController));
router.put('/', auth, upload.single('avatar'), profileController.updateProfile.bind(profileController));

// Stats & Activity
router.get('/stats', auth, profileController.getProfileStats.bind(profileController));
router.get('/activity', auth, profileController.getRecentActivity.bind(profileController));

// Projects
router.get('/projects/top', auth, profileController.getTopProjects.bind(profileController));

// Skills
router.get('/skills', auth, profileController.getUserSkills.bind(profileController));
router.post('/skills', auth, profileController.updateSkill.bind(profileController));
router.delete('/skills/:skillId', auth, profileController.deleteSkill.bind(profileController));

// Certifications
router.get('/certifications', auth, profileController.getCertifications.bind(profileController));
router.post('/certifications', auth, certValidation, profileController.addCertification.bind(profileController));
router.put('/certifications/:id', auth, certValidation, profileController.updateCertification.bind(profileController));
router.delete('/certifications/:id', auth, profileController.deleteCertification.bind(profileController));

// Work Experience
router.get('/experience', auth, profileController.getWorkExperience.bind(profileController));
router.post('/experience', auth, expValidation, profileController.addWorkExperience.bind(profileController));
router.put('/experience/:id', auth, expValidation, profileController.updateWorkExperience.bind(profileController));
router.delete('/experience/:id', auth, profileController.deleteWorkExperience.bind(profileController));

// Languages
router.get('/languages', auth, profileController.getLanguages.bind(profileController));
router.post('/languages', auth, langValidation, profileController.addLanguage.bind(profileController));
router.put('/languages/:id', auth, langValidation, profileController.updateLanguage.bind(profileController));
router.delete('/languages/:id', auth, profileController.deleteLanguage.bind(profileController));

// Export Resume
router.get('/export/:format', auth, profileController.exportResume.bind(profileController));

// Public profile (rate limited)
router.get('/public/:username', publicLimiter, profileController.getPublicProfile.bind(profileController));

module.exports = router;