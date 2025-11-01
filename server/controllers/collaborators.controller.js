// controllers/collaborators.controller.js
const User = require('../models/User.model');
const Invite = require('../models/Invite.model');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');
const { Parser } = require('json2csv');

// Get all collaborators
exports.getCollaborators = async (req, res) => {
    try {
        const { search, role, status, sortBy = 'createdAt', order = 'desc' } = req.query;

        let query = { 
            _id: { $ne: req.user.id } // Exclude current user
        };

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role && role !== 'all') {
            query.role = role;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const collaborators = await User.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .sort({ [sortBy]: sortOrder })
            .populate('invitedBy', 'name email');

        const formattedCollaborators = collaborators.map(collab => ({
            id: collab._id,
            name: collab.name,
            email: collab.email,
            avatar: collab.avatar || collab.name.charAt(0).toUpperCase(),
            role: collab.role,
            status: collab.status || 'active',
            permissions: collab.permissions || [],
            joinedDate: collab.createdAt.toLocaleDateString(),
            lastActive: collab.lastActive 
                ? new Date(collab.lastActive).toLocaleDateString() 
                : 'Never',
            invitedBy: collab.invitedBy,
            totalProjects: collab.projects?.length || 0,
            totalTasks: collab.tasks?.length || 0
        }));

        res.json({
            success: true,
            collaborators: formattedCollaborators
        });
    } catch (error) {
        console.error('Get collaborators error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get collaborator statistics
exports.getCollaboratorStats = async (req, res) => {
    try {
        const total = await User.countDocuments({ _id: { $ne: req.user.id } });
        const active = await User.countDocuments({ 
            _id: { $ne: req.user.id },
            status: 'active'
        });
        const inactive = await User.countDocuments({ 
            _id: { $ne: req.user.id },
            $or: [
                { status: 'inactive' },
                { lastActive: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            ]
        });
        const suspended = await User.countDocuments({ 
            _id: { $ne: req.user.id },
            status: 'suspended'
        });
        const pending = await Invite.countDocuments({ 
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        res.json({
            success: true,
            stats: {
                total,
                active,
                inactive,
                suspended,
                pending
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Invite collaborator
exports.inviteCollaborator = async (req, res) => {
    try {
        const { email, role, permissions, expiryDays, customMessage } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check if there's already a pending invite
        const existingInvite = await Invite.findOne({
            email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'A pending invitation already exists for this email'
            });
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(inviteToken)
            .digest('hex');

        // Create invite
        const invite = await Invite.create({
            email,
            role: role || 'collaborator',
            permissions: permissions || [],
            token: hashedToken,
            invitedBy: req.user.id,
            expiresAt: new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000),
            customMessage
        });

        // Generate invite link
        const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

        // Send invitation email
        const emailContent = getInviteEmailTemplate({
            inviterName: req.user.name,
            inviteLink,
            role,
            customMessage,
            expiryDays: expiryDays || 7
        });

        await sendEmail({
            to: email,
            subject: `You've been invited to collaborate!`,
            html: emailContent
        });

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'invite_sent',
            details: `Sent invitation to ${email}`,
            metadata: { email, role }
        });

        // Emit socket event
        req.app.get('io').emit('new_invite_sent', {
            email,
            role,
            invitedBy: req.user.name
        });

        res.json({
            success: true,
            message: 'Invitation sent successfully',
            invite: {
                id: invite._id,
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt
            }
        });
    } catch (error) {
        console.error('Invite collaborator error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message
        });
    }
};

// Generate invite link
exports.generateInviteLink = async (req, res) => {
    try {
        const { role, expiryDays, maxUses } = req.body;

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(inviteToken)
            .digest('hex');

        // Create invite
        const invite = await Invite.create({
            role: role || 'collaborator',
            token: hashedToken,
            invitedBy: req.user.id,
            expiresAt: new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000),
            maxUses: maxUses || 1,
            type: 'link'
        });

        const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

        res.json({
            success: true,
            inviteLink,
            invite: {
                id: invite._id,
                role: invite.role,
                expiresAt: invite.expiresAt,
                maxUses: invite.maxUses
            }
        });
    } catch (error) {
        console.error('Generate invite link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invite link',
            error: error.message
        });
    }
};

// Get pending invites
exports.getPendingInvites = async (req, res) => {
    try {
        const invites = await Invite.find({
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 });

        const formattedInvites = invites.map(invite => ({
            id: invite._id,
            email: invite.email,
            role: invite.role,
            sentAt: invite.createdAt,
            expiresAt: invite.expiresAt,
            invitedBy: invite.invitedBy,
            type: invite.type || 'email',
            uses: invite.uses || 0,
            maxUses: invite.maxUses
        }));

        res.json({
            success: true,
            invites: formattedInvites
        });
    } catch (error) {
        console.error('Get pending invites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Resend invite
exports.resendInvite = async (req, res) => {
    try {
        const invite = await Invite.findById(req.params.id);

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found'
            });
        }

        if (invite.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot resend a non-pending invite'
            });
        }

        // Generate new token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(inviteToken)
            .digest('hex');

        // Update invite
        invite.token = hashedToken;
        invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await invite.save();

        // Generate new invite link
        const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${inviteToken}`;

        // Resend email
        const emailContent = getInviteEmailTemplate({
            inviterName: req.user.name,
            inviteLink,
            role: invite.role,
            customMessage: invite.customMessage,
            expiryDays: 7
        });

        await sendEmail({
            to: invite.email,
            subject: `Reminder: You've been invited to collaborate!`,
            html: emailContent
        });

        res.json({
            success: true,
            message: 'Invitation resent successfully'
        });
    } catch (error) {
        console.error('Resend invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend invitation',
            error: error.message
        });
    }
};

// Cancel invite
exports.cancelInvite = async (req, res) => {
    try {
        const invite = await Invite.findById(req.params.id);

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found'
            });
        }

        invite.status = 'cancelled';
        await invite.save();

        res.json({
            success: true,
            message: 'Invitation cancelled'
        });
    } catch (error) {
        console.error('Cancel invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel invitation',
            error: error.message
        });
    }
};

// Update collaborator role
exports.updateCollaboratorRole = async (req, res) => {
    try {
        const { role } = req.body;
        const collaborator = await User.findById(req.params.id);

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        // Prevent changing owner role
        if (collaborator.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Cannot change owner role'
            });
        }

        collaborator.role = role;
        await collaborator.save();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'role_updated',
            details: `Updated ${collaborator.name}'s role to ${role}`,
            metadata: { collaboratorId: collaborator._id, newRole: role }
        });

        // Emit socket event
        req.app.get('io').emit('collaborator_updated', {
            collaborator: {
                id: collaborator._id,
                name: collaborator.name,
                role: collaborator.role
            }
        });

        res.json({
            success: true,
            message: 'Role updated successfully'
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message
        });
    }
};

// Update collaborator permissions
exports.updateCollaboratorPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        const collaborator = await User.findById(req.params.id);

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        collaborator.permissions = permissions;
        await collaborator.save();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'permissions_updated',
            details: `Updated permissions for ${collaborator.name}`,
            metadata: { collaboratorId: collaborator._id, permissions }
        });

        res.json({
            success: true,
            message: 'Permissions updated successfully'
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

// Remove collaborator
exports.removeCollaborator = async (req, res) => {
    try {
        const collaborator = await User.findById(req.params.id);

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        // Prevent removing owner
        if (collaborator.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Cannot remove owner'
            });
        }

        await collaborator.remove();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'collaborator_removed',
            details: `Removed ${collaborator.name} from team`,
            metadata: { collaboratorId: collaborator._id, email: collaborator.email }
        });

        // Emit socket event
        req.app.get('io').emit('collaborator_removed', {
            collaboratorId: collaborator._id
        });

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

// Suspend collaborator
exports.suspendCollaborator = async (req, res) => {
    try {
        const collaborator = await User.findById(req.params.id);

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        if (collaborator.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Cannot suspend owner'
            });
        }

        collaborator.status = 'suspended';
        await collaborator.save();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'collaborator_suspended',
            details: `Suspended ${collaborator.name}`,
            metadata: { collaboratorId: collaborator._id }
        });

        res.json({
            success: true,
            message: 'Collaborator suspended successfully'
        });
    } catch (error) {
        console.error('Suspend collaborator error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend collaborator',
            error: error.message
        });
    }
};

// Reactivate collaborator
exports.reactivateCollaborator = async (req, res) => {
    try {
        const collaborator = await User.findById(req.params.id);

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        collaborator.status = 'active';
        await collaborator.save();

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'collaborator_reactivated',
            details: `Reactivated ${collaborator.name}`,
            metadata: { collaboratorId: collaborator._id }
        });

        res.json({
            success: true,
            message: 'Collaborator reactivated successfully'
        });
    } catch (error) {
        console.error('Reactivate collaborator error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reactivate collaborator',
            error: error.message
        });
    }
};

// Bulk remove collaborators
exports.bulkRemoveCollaborators = async (req, res) => {
    try {
        const { collaboratorIds } = req.body;

        if (!collaboratorIds || collaboratorIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No collaborators selected'
            });
        }

        // Remove collaborators (excluding owners)
        const result = await User.deleteMany({
            _id: { $in: collaboratorIds },
            role: { $ne: 'owner' }
        });

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'bulk_remove',
            details: `Removed ${result.deletedCount} collaborators`,
            metadata: { count: result.deletedCount }
        });

        res.json({
            success: true,
            message: `Removed ${result.deletedCount} collaborators`,
            count: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk remove error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove collaborators',
            error: error.message
        });
    }
};

// Bulk suspend collaborators
exports.bulkSuspendCollaborators = async (req, res) => {
    try {
        const { collaboratorIds } = req.body;

        const result = await User.updateMany(
            {
                _id: { $in: collaboratorIds },
                role: { $ne: 'owner' }
            },
            { status: 'suspended' }
        );

        res.json({
            success: true,
            message: `Suspended ${result.modifiedCount} collaborators`,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Bulk suspend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend collaborators',
            error: error.message
        });
    }
};

// Bulk activate collaborators
exports.bulkActivateCollaborators = async (req, res) => {
    try {
        const { collaboratorIds } = req.body;

        const result = await User.updateMany(
            { _id: { $in: collaboratorIds } },
            { status: 'active' }
        );

        res.json({
            success: true,
            message: `Activated ${result.modifiedCount} collaborators`,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Bulk activate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate collaborators',
            error: error.message
        });
    }
};

// Export collaborators
exports.exportCollaborators = async (req, res) => {
    try {
        const collaborators = await User.find({ _id: { $ne: req.user.id } })
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .sort({ createdAt: -1 });

        const data = collaborators.map(collab => ({
            name: collab.name,
            email: collab.email,
            role: collab.role,
            status: collab.status || 'active',
            joinedDate: collab.createdAt.toLocaleDateString(),
            lastActive: collab.lastActive 
                ? new Date(collab.lastActive).toLocaleDateString() 
                : 'Never'
        }));

        const fields = ['name', 'email', 'role', 'status', 'joinedDate', 'lastActive'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`collaborators-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export failed',
            error: error.message
        });
    }
};

// Get collaborator activity logs
exports.getCollaboratorActivity = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const logs = await ActivityLog.find({
            action: {
                $in: [
                    'invite_sent',
                    'collaborator_added',
                    'role_updated',
                    'permissions_updated',
                    'collaborator_removed',
                    'collaborator_suspended',
                    'collaborator_reactivated'
                ]
            }
        })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        res.json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get collaborator details
exports.getCollaboratorDetails = async (req, res) => {
    try {
        const collaborator = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .populate('invitedBy', 'name email')
            .populate('projects')
            .populate('tasks');

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        // Get activity for this collaborator
        const activity = await ActivityLog.find({ user: collaborator._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            collaborator: {
                id: collaborator._id,
                name: collaborator.name,
                email: collaborator.email,
                avatar: collaborator.avatar,
                role: collaborator.role,
                status: collaborator.status,
                permissions: collaborator.permissions,
                joinedDate: collaborator.createdAt,
                lastActive: collaborator.lastActive,
                invitedBy: collaborator.invitedBy,
                projects: collaborator.projects,
                tasks: collaborator.tasks,
                activity
            }
        });
    } catch (error) {
        console.error('Get details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Validate invite token
exports.validateInviteToken = async (req, res) => {
    try {
        const { token } = req.params;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const invite = await Invite.findOne({
            token: hashedToken,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('invitedBy', 'name email');

        if (!invite) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Check max uses
        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'This invitation has reached its maximum usage'
            });
        }

        res.json({
            success: true,
            invite: {
                email: invite.email,
                role: invite.role,
                invitedBy: invite.invitedBy,
                expiresAt: invite.expiresAt
            }
        });
    } catch (error) {
        console.error('Validate token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Accept invite
exports.acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const { name, password } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const invite = await Invite.findOne({
            token: hashedToken,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if (!invite) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: invite.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email: invite.email,
            password,
            role: invite.role,
            permissions: invite.permissions || [],
            invitedBy: invite.invitedBy,
            status: 'active'
        });

        // Update invite
        invite.status = 'accepted';
        invite.acceptedAt = new Date();
        invite.acceptedBy = user._id;
        invite.uses = (invite.uses || 0) + 1;
        await invite.save();

        // Log activity
        await ActivityLog.create({
            user: user._id,
            action: 'collaborator_added',
            details: `${name} joined the team`,
            metadata: { email: invite.email, role: invite.role }
        });

        // Emit socket event
        req.app.get('io').emit('collaborator_added', {
            collaborator: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

        // Send welcome email
        await sendEmail({
            to: user.email,
            subject: 'Welcome to the team!',
            html: getWelcomeEmailTemplate({ name: user.name })
        });

        // Generate auth token
        const authToken = user.getSignedJwtToken();

        res.json({
            success: true,
            message: 'Successfully joined the team',
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept invitation',
            error: error.message
        });
    }
};

// Helper: Get invite email template
function getInviteEmailTemplate({ inviterName, inviteLink, role, customMessage, expiryDays }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
                .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 You're Invited!</h1>
                </div>
                <div class="content">
                    <p>Hi there!</p>
                    <p><strong>${inviterName}</strong> has invited you to join their team as a <strong>${role}</strong>.</p>
                    
                    ${customMessage ? `<div class="info-box"><p style="margin: 0;"><strong>Personal message:</strong><br>${customMessage}</p></div>` : ''}
                    
                    <p>Click the button below to accept the invitation and create your account:</p>
                    
                    <div style="text-align: center;">
                        <a href="${inviteLink}" class="button">Accept Invitation</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280;">This invitation will expire in <strong>${expiryDays} days</strong>.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #9ca3af;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #667eea; word-break: break-all;">${inviteLink}</p>
                </div>
                <div class="footer">
                    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                    <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Helper: Get welcome email template
function getWelcomeEmailTemplate({ name }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
                .feature { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome Aboard, ${name}! 🎊</h1>
                </div>
                <div class="content">
                    <p>We're thrilled to have you join our team!</p>
                    
                    <p>You now have access to:</p>
                    
                    <div class="feature">
                        ✅ <strong>Collaborative Projects</strong> - Work together seamlessly
                    </div>
                    <div class="feature">
                        ✅ <strong>Real-time Communication</strong> - Chat with your team
                    </div>
                    <div class="feature">
                        ✅ <strong>Task Management</strong> - Stay organized and productive
                    </div>
                    <div class="feature">
                        ✅ <strong>File Sharing</strong> - Share resources easily
                    </div>
                    
                    <p>Ready to get started? Log in to your account and explore!</p>
                    
                    <p>If you have any questions, don't hesitate to reach out to your team.</p>
                    
                    <p>Best regards,<br>Your Team</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}