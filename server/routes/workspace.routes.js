// routes/workspace.routes.js
const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../middleware/auth.middleware');
const workspaceController = require('../controllers/workspace.controller');

// All routes require authentication
router.use(auth);

// Workspace CRUD (collaborators can view, owner creates/manages)
router.get('/', workspaceController.getWorkspaces);
router.get('/all', workspaceController.getAllWorkspaces);
router.get('/my-collaborations', workspaceController.getCollaboratorWorkspaces);
router.get('/:workspaceId', workspaceController.getWorkspaceById);
router.get('/:workspaceId/analytics', workspaceController.getWorkspaceAnalytics);

// Owner-only operations
router.post('/', isOwner, workspaceController.createWorkspace);
router.put('/:workspaceId/settings', isOwner, workspaceController.updateWorkspaceSettings);
router.put('/:workspaceId/archive', isOwner, workspaceController.archiveWorkspace);
router.delete('/:workspaceId', isOwner, workspaceController.deleteWorkspace);

// Collaborator management (owner only)
router.post('/:workspaceId/collaborators', isOwner, workspaceController.addCollaborator);
router.delete('/:workspaceId/collaborators/:collaboratorId', isOwner, workspaceController.removeCollaborator);
router.put('/:workspaceId/collaborators/:collaboratorId/permissions', isOwner, workspaceController.updateCollaboratorPermissions);

// Task management
router.post('/:workspaceId/tasks', workspaceController.addTask);
router.put('/:workspaceId/tasks/:taskId/status', workspaceController.updateTaskStatus);

module.exports = router;
