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

// Public routes (rate limited)
router.post('/submit', rateLimiter(10), submitCollaborationRequest);
router.post('/upload', rateLimiter(10), uploadRequestFile);

// All routes require authentication and owner role
router.use(auth, isOwner);

// Get requests with filtering
router.get('/requests', getCollaborationRequests);

// Get statistics
router.get('/stats', getCollaborationStats);

// Get single request details
router.get('/requests/:id', getRequestById);
router.get('/requests/:id/activity', getRequestActivity);

// Approve request
router.post('/requests/:id/approve', approveRequest);

// Reject request
router.post('/requests/:id/reject', rejectRequest);

// Bulk operations
router.post('/requests/bulk/approve', bulkApproveRequests);
router.post('/requests/bulk/reject', bulkRejectRequests);

// Archive request
router.post('/requests/:id/archive', archiveRequest);

// Add note to request
router.post('/requests/:id/notes', addRequestNote);

// Update request status
router.put('/requests/:id/status', updateRequestStatus);

// Resend invite
router.post('/requests/:id/resend', resendInvite);

// Export requests
router.get('/export', exportRequests);

// Get collaborators
router.get('/collaborators', getCollaborators);

// Get pending invites
router.get('/invites/pending', getPendingInvites);

// Get collaborator activity
router.get('/activity', getCollaboratorActivity);

module.exports = router;