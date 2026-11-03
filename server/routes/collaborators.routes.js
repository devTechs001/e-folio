// routes/collaborators.routes.js
const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');
const {
    getCollaborators,
    getCollaboratorStats,
    inviteCollaborator,
    generateInviteLink,
    getPendingInvites,
    resendInvite,
    cancelInvite,
    updateCollaboratorRole,
    updateCollaboratorPermissions,
    removeCollaborator,
    suspendCollaborator,
    reactivateCollaborator,
    bulkRemoveCollaborators,
    bulkSuspendCollaborators,
    bulkActivateCollaborators,
    exportCollaborators,
    getCollaboratorActivity,
    getCollaboratorDetails,
    acceptInvite,
    validateInviteToken
} = require('../controllers/collaborators.controller');

// Invite recipients do not have an account yet, so these two routes MUST stay
// anonymous. They are rate limited and look up the hash of the token instead of
// trusting anything from the client.
router.get('/invite/validate/:token', rateLimiter(20), validateInviteToken);
router.post('/invite/accept/:token', rateLimiter(10), acceptInvite);

// Everything below requires authentication...
router.use(auth);

// ...and owner privileges.
router.use(isOwner);

// Get collaborators
router.get('/', getCollaborators);

// Statistics
router.get('/stats', getCollaboratorStats);

// Activity logs
router.get('/activity', getCollaboratorActivity);

// Get single collaborator details
router.get('/:id', getCollaboratorDetails);

// Invite management
router.post('/invite', inviteCollaborator);
router.post('/invite/link', generateInviteLink);
router.get('/invites/pending', getPendingInvites);
router.post('/invites/:id/resend', resendInvite);
router.delete('/invites/:id', cancelInvite);

// Update collaborator
router.put('/:id/role', updateCollaboratorRole);
router.put('/:id/permissions', updateCollaboratorPermissions);

// Collaborator actions
router.delete('/:id', removeCollaborator);
router.post('/:id/suspend', suspendCollaborator);
router.post('/:id/reactivate', reactivateCollaborator);

// Bulk operations
router.post('/bulk/remove', bulkRemoveCollaborators);
router.post('/bulk/suspend', bulkSuspendCollaborators);
router.post('/bulk/activate', bulkActivateCollaborators);

// Export
router.get('/export/csv', exportCollaborators);

module.exports = router;