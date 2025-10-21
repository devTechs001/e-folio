const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaboration.controller');

// Get all collaboration requests (owner only)
router.get('/requests', collaborationController.getRequests);

// Submit collaboration request
router.post('/request', collaborationController.submitRequest);

// Approve collaboration request
router.post('/approve/:id', collaborationController.approveRequest);

// Reject collaboration request
router.post('/reject/:id', collaborationController.rejectRequest);

// Get all collaborators
router.get('/collaborators', collaborationController.getCollaborators);

// Verify invite token
router.get('/invite/:token', collaborationController.verifyInvite);

// Accept invite and become collaborator
router.post('/accept-invite/:token', collaborationController.acceptInvite);

module.exports = router;
