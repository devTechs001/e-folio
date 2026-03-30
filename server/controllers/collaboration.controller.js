// controllers/collaboration.controller.js
const CollaborationRequest = require('../models/CollaborationRequest');
const User = require('../models/User.model');
const Invite = require('../models/Invite.model');
const ActivityLog = require('../models/ActivityLog');
const { generateInviteToken, sendEmail } = require('../utils');
const { Parser } = require('@json2csv/plainjs');

// Get collaboration requests with filtering
exports.getCollaborationRequests = async (req, res) => {
    try {
        const { status, search, sortBy = 'submittedAt', order = 'desc', startDate, endDate } = req.query;

        let query = {};

        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        // Date range
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) query.submittedAt.$lte = new Date(endDate);
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const requests = await CollaborationRequest.find(query)
            .sort({ [sortBy]: sortOrder })
            .populate('processedBy', 'name email');

        res.json({
            success: true,
            requests: requests.map(r => ({
                id: r._id,
                name: r.name,
                email: r.email,
                company: r.company,
                role: r.role,
                message: r.message,
                status: r.status,
                submittedAt: r.submittedAt,
                processedAt: r.processedAt,
                processedBy: r.processedBy,
                inviteLink: r.inviteLink,
                isPriority: r.isPriority,
                source: r.source,
                notes: r.notes
            }))
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get statistics
exports.getCollaborationStats = async (req, res) => {
    try {
        const total = await CollaborationRequest.countDocuments();
        const pending = await CollaborationRequest.countDocuments({ status: 'pending' });
        const approved = await CollaborationRequest.countDocuments({ status: 'approved' });
        const rejected = await CollaborationRequest.countDocuments({ status: 'rejected' });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonth = await CollaborationRequest.countDocuments({
            submittedAt: { $gte: startOfMonth }
        });

        res.json({
            success: true,
            stats: {
                total,
                pending,
                approved,
                rejected,
                thisMonth
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Approve request
exports.approveRequest = async (req, res) => {
    try {
        const { emailTemplate, customMessage, note } = req.body;
        const request = await CollaborationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        // Generate invite token
        const inviteToken = generateInviteToken();
        
        // Use environment variable with fallback to prevent broken links
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
        const inviteLink = `${frontendUrl}/register?token=${inviteToken}&email=${encodeURIComponent(request.email)}`;

        // Update request
        request.status = 'approved';
        request.processedAt = new Date();
        request.processedBy = req.user.id;
        request.inviteLink = inviteLink;
        request.inviteToken = inviteToken;
        if (note) {
            request.notes.push({
                content: note,
                addedBy: req.user.id,
                addedAt: new Date()
            });
        }

        await request.save();

        // Send approval email
        const emailContent = getEmailTemplate(emailTemplate, {
            name: request.name,
            inviteLink,
            customMessage
        });

        await sendEmail({
            to: request.email,
            subject: 'Your Collaboration Request Has Been Approved!',
            html: emailContent
        });

        // Emit socket event
        req.app.get('io').emit('collaboration_request_updated', {
            id: request._id,
            status: 'approved'
        });

        res.json({
            success: true,
            message: 'Request approved successfully',
            inviteLink,
            request: {
                id: request._id,
                status: request.status,
                processedAt: request.processedAt
            }
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Reject request
exports.rejectRequest = async (req, res) => {
    try {
        const { reason, note } = req.body;
        const request = await CollaborationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        // Update request
        request.status = 'rejected';
        request.processedAt = new Date();
        request.processedBy = req.user.id;
        request.rejectionReason = reason;
        if (note) {
            request.notes.push({
                content: note,
                addedBy: req.user.id,
                addedAt: new Date()
            });
        }

        await request.save();

        // Send rejection email (optional)
        if (reason) {
            await sendEmail({
                to: request.email,
                subject: 'Update on Your Collaboration Request',
                html: getRejectionEmailTemplate(request.name, reason)
            });
        }

        // Emit socket event
        req.app.get('io').emit('collaboration_request_updated', {
            id: request._id,
            status: 'rejected'
        });

        res.json({
            success: true,
            message: 'Request rejected',
            request: {
                id: request._id,
                status: request.status,
                processedAt: request.processedAt
            }
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Bulk approve
exports.bulkApproveRequests = async (req, res) => {
    try {
        const { requestIds } = req.body;

        const requests = await CollaborationRequest.find({
            _id: { $in: requestIds },
            status: 'pending'
        });

        const approvedRequests = [];

        for (const request of requests) {
            const inviteToken = generateInviteToken();
            const inviteLink = `${process.env.FRONTEND_URL}/register?token=${inviteToken}&email=${encodeURIComponent(request.email)}`;

            request.status = 'approved';
            request.processedAt = new Date();
            request.processedBy = req.user.id;
            request.inviteLink = inviteLink;
            request.inviteToken = inviteToken;

            await request.save();

            // Send email
            const emailContent = getEmailTemplate('default', {
                name: request.name,
                inviteLink
            });

            await sendEmail({
                to: request.email,
                subject: 'Your Collaboration Request Has Been Approved!',
                html: emailContent
            });

            approvedRequests.push(request);
        }

        res.json({
            success: true,
            message: `Approved ${approvedRequests.length} requests`,
            count: approvedRequests.length
        });
    } catch (error) {
        console.error('Bulk approve error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Bulk reject
exports.bulkRejectRequests = async (req, res) => {
    try {
        const { requestIds } = req.body;

        await CollaborationRequest.updateMany(
            { _id: { $in: requestIds }, status: 'pending' },
            {
                status: 'rejected',
                processedAt: new Date(),
                processedBy: req.user.id
            }
        );

        res.json({
            success: true,
            message: 'Requests rejected successfully'
        });
    } catch (error) {
        console.error('Bulk reject error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Archive request
exports.archiveRequest = async (req, res) => {
    try {
        const request = await CollaborationRequest.findByIdAndUpdate(
            req.params.id,
            { archived: true, archivedAt: new Date() },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, message: 'Request archived' });
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Export requests to CSV
exports.exportRequests = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) query.submittedAt.$lte = new Date(endDate);
        }

        const requests = await CollaborationRequest.find(query)
            .populate('processedBy', 'name email')
            .sort({ submittedAt: -1 });

        const fields = ['name', 'email', 'company', 'role', 'message', 'status', 'submittedAt', 'processedAt'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(requests);

        res.header('Content-Type', 'text/csv');
        res.attachment(`collaboration-requests-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
};

// Get request details
exports.getRequestDetails = async (req, res) => {
    try {
        const request = await CollaborationRequest.findById(req.params.id)
            .populate('processedBy', 'name email avatar')
            .populate('notes.addedBy', 'name email');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, request });
    } catch (error) {
        console.error('Get details error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add note to request
exports.addRequestNote = async (req, res) => {
    try {
        const { content } = req.body;
        const request = await CollaborationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        request.notes.push({
            content,
            addedBy: req.user.id,
            addedAt: new Date()
        });

        await request.save();

        res.json({ success: true, message: 'Note added successfully' });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Helper functions
function getEmailTemplate(template, data) {
    const templates = {
        default: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome ${data.name}!</h2>
                <p>Your collaboration request has been approved!</p>
                <p>Click the button below to complete your registration:</p>
                <a href="${data.inviteLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                    Complete Registration
                </a>
                ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
                <p>This link will expire in 7 days.</p>
            </div>
        `,
        welcome: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7fafc; padding: 40px;">
                <div style="background: white; border-radius: 12px; padding: 32px;">
                    <h1 style="color: #1a202c; margin-bottom: 24px;">🎉 Welcome Aboard, ${data.name}!</h1>
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                        We're excited to have you join our collaboration platform!
                    </p>
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Your request has been approved. Click below to get started:
                    </p>
                    <a href="${data.inviteLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; margin: 24px 0; font-weight: 600;">
                        Get Started →
                    </a>
                    ${data.customMessage ? `<div style="background: #edf2f7; padding: 16px; border-radius: 8px; margin-top: 24px;"><p style="color: #2d3748; margin: 0;">${data.customMessage}</p></div>` : ''}
                </div>
            </div>
        `
    };

    return templates[template] || templates.default;
}

function getRejectionEmailTemplate(name, reason) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${name},</h2>
            <p>Thank you for your interest in collaborating with us.</p>
            <p>After careful consideration, we're unable to approve your request at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>We encourage you to reapply in the future.</p>
            <p>Best regards,<br>The Team</p>
        </div>
    `;
}

// Submit collaboration request (public endpoint)
exports.submitCollaborationRequest = async (req, res) => {
    try {
        const {
            name, email, phone, location, timezone, role, company, experience,
            skills, skillLevels, portfolio, github, linkedin, twitter, instagram,
            website, projectType, budget, timeline, availability, preferredContact,
            message, references, attachments, interests, languages, remoteWork,
            willingToRelocate, newsletter, terms
        } = req.body;

        // Validate required fields
        if (!name || !email || !message || !terms) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: name, email, message, and terms acceptance'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const request = new CollaborationRequest({
            name,
            email,
            phone,
            location,
            timezone,
            role,
            company,
            experience,
            skills: skills || [],
            skillLevels: skillLevels || {},
            portfolio,
            github,
            linkedin,
            twitter,
            instagram,
            website,
            projectType: projectType || [],
            budget,
            timeline,
            availability,
            preferredContact,
            message,
            references: references || [],
            attachments: attachments || [],
            interests: interests || [],
            languages: languages || [],
            remoteWork: remoteWork !== false,
            willingToRelocate: willingToRelocate || false,
            newsletter: newsletter !== false,
            terms: terms === true,
            status: 'pending',
            submittedAt: new Date()
        });

        await request.save();

        res.status(201).json({
            success: true,
            message: 'Collaboration request submitted successfully',
            requestId: request._id
        });
    } catch (error) {
        console.error('Submit collaboration request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit request'
        });
    }
};

// Get request by ID
exports.getRequestById = async (req, res) => {
    try {
        const request = await CollaborationRequest.findById(req.params.id)
            .populate('processedBy', 'name email avatar');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            request
        });
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get request'
        });
    }
};

// Upload request file
exports.uploadRequestFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.json({
            success: true,
            file: {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await CollaborationRequest.findByIdAndUpdate(
            req.params.id,
            { status, processedBy: req.user.id, processedAt: new Date() },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            request
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
};

// Resend invite
exports.resendInvite = async (req, res) => {
    try {
        const request = await CollaborationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Can only resend invites for approved requests'
            });
        }

        // Resend email logic here
        res.json({
            success: true,
            message: 'Invite resent successfully'
        });
    } catch (error) {
        console.error('Resend invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend invite'
        });
    }
};

// Get request activity
exports.getRequestActivity = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await CollaborationRequest.findById(requestId)
            .populate('processedBy', 'name email')
            .populate('notes.addedBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Build activity timeline from request data
        const activity = [];
        
        // Add submission event
        activity.push({
            type: 'submitted',
            timestamp: request.submittedAt,
            details: 'Collaboration request submitted'
        });

        // Add status change events
        if (request.status === 'approved' && request.processedAt) {
            activity.push({
                type: 'approved',
                timestamp: request.processedAt,
                details: 'Request approved',
                processedBy: request.processedBy
            });
        } else if (request.status === 'rejected' && request.processedAt) {
            activity.push({
                type: 'rejected',
                timestamp: request.processedAt,
                details: 'Request rejected',
                processedBy: request.processedBy
            });
        }

        // Add note events
        if (request.notes && request.notes.length > 0) {
            request.notes.forEach(note => {
                activity.push({
                    type: 'note_added',
                    timestamp: note.addedAt,
                    details: 'Note added',
                    addedBy: note.addedBy
                });
            });
        }

        // Sort by timestamp
        activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity'
        });
    }
};

// Get collaborators (for CollaboratorsStyled component)
const getCollaborators = async (req, res) => {
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

// Get pending invites (for CollaboratorsStyled component)
const getPendingInvites = async (req, res) => {
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

// Get collaborator activity (for CollaboratorsStyled component)
const getCollaboratorActivity = async (req, res) => {
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

exports.getCollaborators = getCollaborators;
exports.getPendingInvites = getPendingInvites;
exports.getCollaboratorActivity = getCollaboratorActivity;