// routes/workspace.routes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const workspaceController = require('../controllers/workspace.controller');

// All routes require authentication
router.use(auth);

// Workspace CRUD
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/all', workspaceController.getAllWorkspaces); // Owner can see ALL workspaces
router.get('/my-collaborations', workspaceController.getCollaboratorWorkspaces);
router.get('/:workspaceId', workspaceController.getWorkspaceById);

// Workspace actions
router.put('/:workspaceId/settings', workspaceController.updateWorkspaceSettings);
router.put('/:workspaceId/archive', workspaceController.archiveWorkspace);
router.delete('/:workspaceId', workspaceController.deleteWorkspace);

// Collaborator management
router.post('/:workspaceId/collaborators', workspaceController.addCollaborator);
router.delete('/:workspaceId/collaborators/:collaboratorId', workspaceController.removeCollaborator);
router.put('/:workspaceId/collaborators/:collaboratorId/permissions', workspaceController.updateCollaboratorPermissions);

// Task management
router.post('/:workspaceId/tasks', workspaceController.addTask);
router.put('/:workspaceId/tasks/:taskId/status', workspaceController.updateTaskStatus);

// Analytics
router.get('/:workspaceId/analytics', workspaceController.getWorkspaceAnalytics);

module.exports = router;
