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

// Workspace chat
router.get('/:workspaceId/messages', workspaceController.getWorkspaceMessages);
router.post('/:workspaceId/messages', workspaceController.sendWorkspaceMessage);

// Workspace resources (files/links/notes)
router.post('/:workspaceId/resources', workspaceController.addWorkspaceResource);
router.delete('/:workspaceId/resources/:resourceId', workspaceController.deleteWorkspaceResource);

// Workspace commits (development workspaces)
router.get('/:workspaceId/commits', workspaceController.getWorkspaceCommits);
router.post('/:workspaceId/commits', workspaceController.addWorkspaceCommit);

// Workspace builds (development workspaces)
router.get('/:workspaceId/builds', workspaceController.getWorkspaceBuilds);
router.post('/:workspaceId/builds', workspaceController.triggerWorkspaceBuild);
router.put('/:workspaceId/builds/:buildId', workspaceController.updateWorkspaceBuild);

module.exports = router;
