const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { auth } = require('../middleware/auth.middleware');

// Videos
router.get('/videos', learningController.getLearningVideos.bind(learningController));
router.get('/videos/:videoId', learningController.getVideo.bind(learningController));

// Tutorials
router.get('/tutorials', learningController.getTutorials.bind(learningController));
router.get('/tutorials/:tutorialId', learningController.getTutorial.bind(learningController));

// FAQs
router.get('/faqs', learningController.getFAQs.bind(learningController));

// Communities
router.get('/communities', learningController.getCommunities.bind(learningController));

// Progress (authenticated)
router.get('/progress', auth, learningController.getLearningProgress.bind(learningController));
router.post('/progress', auth, learningController.updateProgress.bind(learningController));

// Bookmarks (authenticated)
router.get('/bookmarks', auth, learningController.getBookmarks.bind(learningController));
router.post('/bookmarks', auth, learningController.addBookmark.bind(learningController));
router.delete('/bookmarks/:resourceId', auth, learningController.removeBookmark.bind(learningController));

// Achievements (authenticated)
router.get('/achievements', auth, learningController.getAchievements.bind(learningController));

// Stats (authenticated)
router.get('/stats', auth, learningController.getLearningStats.bind(learningController));

// Comments
router.get('/comments/:resourceId', learningController.getComments.bind(learningController));
router.post('/comments', auth, learningController.addComment.bind(learningController));

// Ratings
router.post('/ratings', auth, learningController.rateResource.bind(learningController));

module.exports = router;