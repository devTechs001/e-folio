// routes/collaboration.routes.js
const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');
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
    updateRequestStatus,
    resendInvite,
    getRequestActivity
} = require('../controllers/collaboration.controller');

// Public routes (rate limited) - most frequently accessed first
router.post('/submit', rateLimiter(10), submitCollaborationRequest);
router.post('/upload', rateLimiter(10), uploadRequestFile);

// Collaborator-facing routes (auth only, accessible by collaborators)
router.get('/collaborators', auth, getCollaborators);
router.get('/invites/pending', auth, getPendingInvites);
router.get('/activity', auth, getCollaboratorActivity);

// Owner-only routes below
router.get('/export', auth, isOwner, exportRequests);
router.get('/stats', auth, isOwner, getCollaborationStats);

// Bulk operations before /:id to prevent :id from catching "bulk"
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