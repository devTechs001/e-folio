// routes/collaboration-requests.routes.js
// Backwards-compatible alias of collaboration.routes.js, mounted at
// /api/collaboration-requests. The public form and the older dashboard views
// use this prefix, so it must expose exactly the same paths and guards.
// tests/collaboration-review.test.mjs fails if the two declarations drift.
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

router.post('/submit', rateLimiter(10), submitCollaborationRequest);
router.post('/upload', rateLimiter(10), collaborationUpload.array('files', 5), uploadRequestFile);
router.get('/files/:filename', auth, isOwner, downloadRequestFile);

router.get('/collaborators', auth, isOwner, getCollaborators);
router.get('/invites/pending', auth, isOwner, getPendingInvites);
router.get('/activity', auth, isOwner, getCollaboratorActivity);

router.get('/export', auth, isOwner, exportRequests);
router.get('/stats', auth, isOwner, getCollaborationStats);

router.post('/bulk/approve', auth, isOwner, bulkApproveRequests);
router.post('/bulk/reject', auth, isOwner, bulkRejectRequests);
router.post('/requests/bulk/approve', auth, isOwner, bulkApproveRequests);
router.post('/requests/bulk/reject', auth, isOwner, bulkRejectRequests);

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
