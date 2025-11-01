const express = require('express');
const router = express.Router();
const multer = require('multer');
const profileController = require('../controllers/profile.controller');
const { auth } = require('../middleware/auth.middleware');

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

// Public profile
router.get('/public/:username', profileController.getPublicProfile.bind(profileController));

module.exports = router;