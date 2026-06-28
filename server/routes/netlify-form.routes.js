// routes/netlify-form.routes.js
const express = require('express');
const router = express.Router();
const {
    submitForm,
    getSubmissions,
    getSubmission,
    updateStatus,
    addNote,
    toggleStar,
    deleteSubmission,
    getStatistics
} = require('../controllers/netlify-form.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Public route for form submission (rate limited)
router.post('/submit', rateLimiter(10), submitForm);

// Protected admin routes
router.use(auth);
router.use(isOwner);

router.get('/statistics', getStatistics);
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmission);
router.patch('/submissions/:id/status', updateStatus);
router.patch('/submissions/:id/star', toggleStar);
router.post('/submissions/:id/notes', addNote);
router.delete('/submissions/:id', deleteSubmission);

module.exports = router;
