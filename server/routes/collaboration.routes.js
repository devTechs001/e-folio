// routes/collaboration.routes.js
// Canonical collaboration router. Mounted at /api/collaboration and, as a
// backwards-compatible alias, at /api/collaboration-requests. Both prefixes
// must expose the same paths because the dashboard currently mixes them.
const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');
const { collaborationUpload } = require('../middleware/upload.middleware');
const {
    getCollaborationRequests,
    getCollaborationStats,
    approveRequest,
    rejectRequest,
    bulkApproveRequests,
    bulkRejectRequests,
    archiveRequest,
    exportRequests,
    getRequestById,
    addRequestNote,
    getCollaborators,
    getPendingInvites,
    getCollaboratorActivity,
    submitCollaborationRequest,
    uploadRequestFile,
    downloadRequestFile,
    updateRequestStatus,
    resendInvite,
    getRequestActivity
} = require('../controllers/collaboration.controller');

// Public routes (rate limited). The upload route needs multer: the controller
// reads req.files, so registering it bare made every upload fail with 400.
router.post('/submit', rateLimiter(10), submitCollaborationRequest);
router.post('/upload', rateLimiter(10), collaborationUpload.array('files', 5), uploadRequestFile);
router.get('/files/:filename', auth, isOwner, downloadRequestFile);

// Collaborator-facing routes. These return site-wide data, so they are
// owner-only rather than merely authenticated.
router.get('/collaborators', auth, isOwner, getCollaborators);
router.get('/invites/pending', auth, isOwner, getPendingInvites);
router.get('/activity', auth, isOwner, getCollaboratorActivity);

// Owner-only routes below
router.get('/export', auth, isOwner, exportRequests);
router.get('/stats', auth, isOwner, getCollaborationStats);

// Bulk operations (both historical spellings) before /:id so the parameter
// router cannot swallow "bulk".
router.post('/bulk/approve', auth, isOwner, bulkApproveRequests);
router.post('/bulk/reject', auth, isOwner, bulkRejectRequests);
router.post('/requests/bulk/approve', auth, isOwner, bulkApproveRequests);
router.post('/requests/bulk/reject', auth, isOwner, bulkRejectRequests);

// Single request routes
router.get('/requests', auth, isOwner, getCollaborationRequests);
router.get('/requests/:id', auth, isOwner, getRequestById);
router.get('/requests/:id/activity', auth, isOwner, getRequestActivity);
router.post('/requests/:id/approve', auth, isOwner, approveRequest);
router.post('/requests/:id/reject', auth, isOwner, rejectRequest);
router.post('/requests/:id/archive', auth, isOwner, archiveRequest);
router.post('/requests/:id/notes', auth, isOwner, addRequestNote);
router.put('/requests/:id/status', auth, isOwner, updateRequestStatus);
router.post('/requests/:id/resend', auth, isOwner, resendInvite);

module.exports = router;
