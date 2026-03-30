// routes/collaboration.routes.js
const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
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
    getCollaboratorActivity
} = require('../controllers/collaboration.controller');

// All routes require authentication and owner role
router.use(auth, isOwner);

// Get requests with filtering
router.get('/requests', getCollaborationRequests);

// Get statistics
router.get('/stats', getCollaborationStats);

// Get single request details
router.get('/requests/:id', getRequestById);

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

// Export requests
router.get('/export', exportRequests);

// Get collaborators
router.get('/collaborators', getCollaborators);

// Get pending invites
router.get('/invites/pending', getPendingInvites);

// Get collaborator activity
router.get('/activity', getCollaboratorActivity);

module.exports = router;