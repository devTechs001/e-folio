const CollaborationRequest = require('../models/CollaborationRequest.model');
const Invite = require('../models/Invite.model');
const User = require('../models/User.model');
const crypto = require('crypto');

class CollaborationController {
    // Submit collaboration request
    async submitRequest(req, res) {
        try {
            const { name, email, role, message, skills } = req.body;

            if (!name || !email || !message) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Name, email, and message are required' 
                });
            }

            // Check if already requested
            const existingRequest = await CollaborationRequest.findOne({ 
                email: email.toLowerCase(),
                status: 'pending'
            });

            if (existingRequest) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending collaboration request'
                });
            }

            const newRequest = new CollaborationRequest({
                name,
                email: email.toLowerCase(),
                role: role || 'Collaborator',
                message,
                skills: skills || []
            });

            await newRequest.save();

            res.json({
                success: true,
                message: 'Collaboration request submitted successfully! We will review it and get back to you soon.',
                request: newRequest
            });
        } catch (error) {
            console.error('Submit request error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get all collaboration requests (owner only)
    async getRequests(req, res) {
        try {
            const requests = await CollaborationRequest.find()
                .sort({ submittedAt: -1 });

            res.json({
                success: true,
                requests
            });
        } catch (error) {
            console.error('Get requests error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Approve collaboration request and generate invite
    async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const request = await CollaborationRequest.findById(id);

            if (!request) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Request not found' 
                });
            }

            if (request.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Request has already been reviewed'
                });
            }

            // Find owner user
            const owner = await User.findOne({ role: 'owner' });
            if (!owner) {
                return res.status(500).json({
                    success: false,
                    message: 'Owner not found'
                });
            }

            // Generate secure invite token
            const inviteToken = crypto.randomBytes(32).toString('hex');
            
            // Create invite
            const invite = new Invite({
                token: inviteToken,
                email: request.email,
                name: request.name,
                role: 'collaborator',
                invitedBy: owner._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                permissions: ['edit', 'view']
            });

            await invite.save();

            // Update request
            request.status = 'approved';
            request.inviteToken = inviteToken;
            request.reviewedAt = new Date();
            request.reviewedBy = owner._id;
            await request.save();

            const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5174'}/invite/${inviteToken}`;

            res.json({
                success: true,
                message: 'Request approved! Invite link generated.',
                inviteLink,
                invite
            });
        } catch (error) {
            console.error('Approve request error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Reject collaboration request
    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const request = await CollaborationRequest.findById(id);

            if (!request) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Request not found' 
                });
            }

            // Find owner
            const owner = await User.findOne({ role: 'owner' });

            request.status = 'rejected';
            request.reviewedAt = new Date();
            request.reviewedBy = owner?._id;
            await request.save();

            res.json({
                success: true,
                message: 'Request rejected'
            });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get all active collaborators
    async getCollaborators(req, res) {
        try {
            const collaborators = await User.find({ 
                role: 'collaborator',
                status: 'active'
            }).select('-password');

            res.json({
                success: true,
                collaborators
            });
        } catch (error) {
            console.error('Get collaborators error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Accept invite and create collaborator account
    async acceptInvite(req, res) {
        try {
            const { token } = req.params;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required'
                });
            }

            const invite = await Invite.findOne({ token, status: 'pending' });

            if (!invite) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Invalid or expired invite link' 
                });
            }

            // Check if expired
            if (new Date(invite.expiresAt) < new Date()) {
                invite.status = 'expired';
                await invite.save();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invite link has expired' 
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: invite.email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Account with this email already exists'
                });
            }

            // Hash password
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create collaborator account
            const collaborator = new User({
                name: invite.name,
                email: invite.email,
                password: hashedPassword,
                role: 'collaborator',
                status: 'active',
                permissions: invite.permissions || ['view', 'edit']
            });

            await collaborator.save();

            // Update invite
            invite.status = 'accepted';
            invite.acceptedAt = new Date();
            await invite.save();

            res.json({
                success: true,
                message: 'Welcome to the team! You can now log in with your credentials.',
                user: {
                    id: collaborator._id,
                    name: collaborator.name,
                    email: collaborator.email,
                    role: collaborator.role
                }
            });
        } catch (error) {
            console.error('Accept invite error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Verify invite token
    async verifyInvite(req, res) {
        try {
            const { token } = req.params;

            const invite = await Invite.findOne({ token, status: 'pending' })
                .populate('invitedBy', 'name email');

            if (!invite) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Invalid invite link' 
                });
            }

            // Check if expired
            if (new Date(invite.expiresAt) < new Date()) {
                invite.status = 'expired';
                await invite.save();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invite link has expired' 
                });
            }

            res.json({
                success: true,
                invite: {
                    email: invite.email,
                    name: invite.name,
                    role: invite.role,
                    expiresAt: invite.expiresAt,
                    invitedBy: invite.invitedBy
                }
            });
        } catch (error) {
            console.error('Verify invite error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new CollaborationController();
