const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
let collaborationRequests = [];
let collaborators = [];
let inviteLinks = [];

// Get all collaboration requests (owner only)
router.get('/requests', (req, res) => {
    try {
        res.json({
            success: true,
            requests: collaborationRequests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Submit collaboration request
router.post('/request', (req, res) => {
    try {
        const { name, email, role, message, skills } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required' 
            });
        }

        const newRequest = {
            id: Date.now().toString(),
            name,
            email,
            role: role || 'Collaborator',
            message,
            skills: skills || [],
            status: 'pending',
            submittedAt: new Date().toISOString()
        };

        collaborationRequests.push(newRequest);

        res.json({
            success: true,
            message: 'Collaboration request submitted successfully',
            request: newRequest
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Approve collaboration request
router.post('/approve/:id', (req, res) => {
    try {
        const requestId = req.params.id;
        const request = collaborationRequests.find(r => r.id === requestId);

        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found' 
            });
        }

        // Generate invite link
        const inviteToken = Math.random().toString(36).substring(7) + Date.now();
        const inviteLink = {
            token: inviteToken,
            email: request.email,
            name: request.name,
            role: 'collaborator',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            createdAt: new Date().toISOString()
        };

        inviteLinks.push(inviteLink);

        // Update request status
        request.status = 'approved';
        request.inviteToken = inviteToken;

        res.json({
            success: true,
            message: 'Request approved',
            inviteLink: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${inviteToken}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reject collaboration request
router.post('/reject/:id', (req, res) => {
    try {
        const requestId = req.params.id;
        const index = collaborationRequests.findIndex(r => r.id === requestId);

        if (index === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found' 
            });
        }

        collaborationRequests[index].status = 'rejected';

        res.json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all collaborators
router.get('/collaborators', (req, res) => {
    try {
        res.json({
            success: true,
            collaborators
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Accept invite and become collaborator
router.post('/accept-invite/:token', (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const invite = inviteLinks.find(i => i.token === token);

        if (!invite) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid or expired invite link' 
            });
        }

        // Check if expired
        if (new Date(invite.expiresAt) < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invite link has expired' 
            });
        }

        // Create collaborator account
        const collaborator = {
            id: Date.now().toString(),
            email: invite.email,
            name: invite.name,
            role: invite.role,
            joinedAt: new Date().toISOString(),
            status: 'active'
        };

        collaborators.push(collaborator);

        // Remove invite link
        inviteLinks = inviteLinks.filter(i => i.token !== token);

        res.json({
            success: true,
            message: 'Welcome to the team!',
            collaborator
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
