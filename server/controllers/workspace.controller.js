// controllers/workspace.controller.js
const Workspace = require('../models/Workspace');
const User = require('../models/User.model');
const CollaborationRequest = require('../models/CollaborationRequest');
const emailService = require('../services/email.service');

// Create workspace
exports.createWorkspace = async (req, res) => {
    try {
        const {
            name,
            description,
            collaborationRequestId,
            workspaceType,
            collaborators,
            projects,
            settings,
            startDate,
            endDate
        } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Workspace name is required'
            });
        }

        // Create workspace
        const workspace = new Workspace({
            name,
            description,
            collaborationRequestId,
            ownerId: req.user.id,
            workspaceType: workspaceType || 'custom',
            collaborators: collaborators || [],
            projects: projects || [],
            settings: settings || {
                allowCollaboratorInteraction: false,
                enableChat: false,
                enableTaskBoard: true,
                enableFileSharing: true,
                enableAnalytics: true,
                visibility: 'private'
            },
            startDate: startDate || new Date(),
            endDate,
            status: 'active'
        });

        await workspace.save();

        // If linked to collaboration request, update it
        if (collaborationRequestId) {
            await CollaborationRequest.findByIdAndUpdate(collaborationRequestId, {
                workspaceId: workspace._id
            });
        }

        // Send invitation emails to collaborators
        for (const collaborator of workspace.collaborators) {
            try {
                await emailService.send({
                    to: collaborator.email,
                    subject: `🎉 You've been added to "${workspace.name}" workspace!`,
                    template: 'workspace-invitation',
                    data: {
                        name: collaborator.name,
                        workspaceName: workspace.name,
                        role: collaborator.role,
                        ownerName: req.user.name,
                        workspaceUrl: `${process.env.CLIENT_URL}/workspace`,
                        year: new Date().getFullYear()
                    }
                });
                console.log(`✅ Invitation email sent to ${collaborator.email}`);
            } catch (emailError) {
                console.error('❌ Failed to send invitation email:', emailError);
            }
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('workspace_created', {
                id: workspace._id,
                name: workspace.name,
                ownerId: workspace.ownerId
            });
        }

        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            workspace
        });
    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create workspace',
            error: error.message
        });
    }
};

// Get all workspaces (owner's own workspaces)
exports.getWorkspaces = async (req, res) => {
    try {
        const { status, workspaceType, search, sortBy = 'createdAt', order = 'desc' } = req.query;

        let query = { ownerId: req.user.id };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (workspaceType && workspaceType !== 'all') {
            query.workspaceType = workspaceType;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const workspaces = await Workspace.find(query)
            .populate('collaborators.userId', 'name email avatar')
            .populate('projects', 'title description')
            .sort({ [sortBy]: sortOrder });

        const stats = {
            total: workspaces.length,
            active: workspaces.filter(w => w.status === 'active').length,
            archived: workspaces.filter(w => w.status === 'archived').length,
            totalCollaborators: workspaces.reduce((sum, w) => sum + w.collaborators.length, 0)
        };

        res.json({
            success: true,
            workspaces,
            stats
        });
    } catch (error) {
        console.error('Get workspaces error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get ALL workspaces in the system (for owner/admin to see everything)
exports.getAllWorkspaces = async (req, res) => {
    try {
        const { status, workspaceType, search, sortBy = 'createdAt', order = 'desc' } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (workspaceType && workspaceType !== 'all') {
            query.workspaceType = workspaceType;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const workspaces = await Workspace.find(query)
            .populate('ownerId', 'name email')
            .populate('collaborators.userId', 'name email avatar')
            .populate('projects', 'title description')
            .sort({ [sortBy]: sortOrder });

        const stats = {
            total: workspaces.length,
            active: workspaces.filter(w => w.status === 'active').length,
            archived: workspaces.filter(w => w.status === 'archived').length,
            totalCollaborators: workspaces.reduce((sum, w) => sum + w.collaborators.length, 0),
            byType: workspaceType ? {} : workspaces.reduce((acc, w) => {
                acc[w.workspaceType] = (acc[w.workspaceType] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            workspaces,
            stats
        });
    } catch (error) {
        console.error('Get all workspaces error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get workspace by ID
exports.getWorkspaceById = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate('collaborators.userId', 'name email avatar')
            .populate('projects', 'title description thumbnail')
            .populate('tasks.assignedTo', 'name email');

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        // Check access
        const isOwner = workspace.ownerId.toString() === req.user.id;
        const isCollaborator = workspace.collaborators.some(
            c => c.userId?.toString() === req.user.id && c.status === 'active'
        );

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update last active for collaborator
        if (isCollaborator) {
            const collaborator = workspace.collaborators.find(
                c => c.userId.toString() === req.user.id
            );
            collaborator.lastActive = new Date();
            await workspace.save();
        }

        res.json({
            success: true,
            workspace
        });
    } catch (error) {
        console.error('Get workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get workspaces where user is a collaborator
exports.getCollaboratorWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            'collaborators.userId': req.user.id,
            'collaborators.status': 'active',
            status: 'active'
        })
        .populate('ownerId', 'name email')
        .populate('projects', 'title description');

        res.json({
            success: true,
            workspaces
        });
    } catch (error) {
        console.error('Get collaborator workspaces error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Add collaborator to workspace
exports.addCollaborator = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { email, name, role, permissions } = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        // Check if user is owner
        if (workspace.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only workspace owner can add collaborators'
            });
        }

        // Check if already a collaborator
        const existing = workspace.collaborators.find(
            c => c.email === email || c.userId?.toString() === req.body.userId
        );

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'User is already a collaborator'
            });
        }

        // Add collaborator
        await workspace.addCollaborator({
            email,
            name,
            role,
            permissions,
            addedBy: req.user.id
        });

        // Send email
        try {
            await emailService.send({
                to: email,
                subject: `🎉 You've been added to "${workspace.name}" workspace!`,
                template: 'workspace-invitation',
                data: {
                    name,
                    workspaceName: workspace.name,
                    role,
                    ownerName: req.user.name,
                    workspaceUrl: `${process.env.CLIENT_URL}/workspace`,
                    year: new Date().getFullYear()
                }
            });
            console.log(`✅ Invitation email sent to ${email}`);
        } catch (emailError) {
            console.error('❌ Failed to send invitation email:', emailError);
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('collaborator_added', {
                workspaceId: workspace._id,
                collaborator: { email, name, role }
            });
        }

        res.json({
            success: true,
            message: 'Collaborator added successfully',
            workspace
        });
    } catch (error) {
        console.error('Add collaborator error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add collaborator',
            error: error.message
        });
    }
};

// Remove collaborator
exports.removeCollaborator = async (req, res) => {
    try {
        const { workspaceId, collaboratorId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        // Check if user is owner
        if (workspace.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only workspace owner can remove collaborators'
            });
        }

        await workspace.removeCollaborator(collaboratorId, req.user.id);

        res.json({
            success: true,
            message: 'Collaborator removed successfully'
        });
    } catch (error) {
        console.error('Remove collaborator error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove collaborator',
            error: error.message
        });
    }
};

// Update collaborator permissions
exports.updateCollaboratorPermissions = async (req, res) => {
    try {
        const { workspaceId, collaboratorId } = req.params;
        const { role, permissions } = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        const collaborator = workspace.collaborators.find(
            c => c.userId?.toString() === collaboratorId || c._id.toString() === collaboratorId
        );

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        if (role) collaborator.role = role;
        if (permissions) collaborator.permissions = { ...collaborator.permissions, ...permissions };

        await workspace.save();

        res.json({
            success: true,
            message: 'Permissions updated successfully',
            workspace
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update permissions',
            error: error.message
        });
    }
};

// Add task to workspace
exports.addTask = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { title, description, assignedTo, priority, dueDate } = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        await workspace.addTask({
            title,
            description,
            assignedTo,
            priority,
            dueDate
        });

        res.json({
            success: true,
            message: 'Task added successfully',
            workspace
        });
    } catch (error) {
        console.error('Add task error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add task',
            error: error.message
        });
    }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { workspaceId, taskId } = req.params;
        const { status } = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        workspace.updateTaskStatus(taskId, status);
        await workspace.save();

        res.json({
            success: true,
            message: 'Task status updated successfully',
            workspace
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task status',
            error: error.message
        });
    }
};

// Update workspace settings
exports.updateWorkspaceSettings = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const settings = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        workspace.settings = { ...workspace.settings, ...settings };
        await workspace.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            workspace
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};

// Archive workspace
exports.archiveWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            { status: 'archived' },
            { new: true }
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        res.json({
            success: true,
            message: 'Workspace archived successfully',
            workspace
        });
    } catch (error) {
        console.error('Archive workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive workspace',
            error: error.message
        });
    }
};

// Delete workspace
exports.deleteWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findByIdAndDelete(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        res.json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        console.error('Delete workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete workspace',
            error: error.message
        });
    }
};

// Get workspace analytics
exports.getWorkspaceAnalytics = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        res.json({
            success: true,
            analytics: workspace.analytics
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get analytics',
            error: error.message
        });
    }
};

// Helper function for email template
function getWorkspaceInvitationTemplate(data) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 You're Invited!</h1>
                </div>
                <div class="content">
                    <p>Hi ${data.name},</p>
                    <p><strong>${data.ownerName}</strong> has added you to a workspace:</p>
                    <h2 style="color: #667eea; margin: 20px 0;">"${data.workspaceName}"</h2>
                    <p>Your role: <strong>${data.role}</strong></p>
                    <p>You now have access to collaborate on projects, tasks, and resources within this workspace.</p>
                    <a href="${process.env.CLIENT_URL}/workspace" class="button">Access Your Workspace</a>
                    <div class="footer">
                        <p>This is an automated message. Please don't reply directly to this email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = exports;
