// controllers/sharingController.js
const SharedConversation = require('../models/SharedConversation');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// @desc    Share conversation
// @route   POST /api/ai/conversations/:id/share
// @access  Private
exports.shareConversation = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const { title, description, password, settings } = req.body;

    const sharedConv = await SharedConversation.create({
        conversationId: conversation._id,
        userId: req.user.id,
        title: title || conversation.title,
        description,
        password: password ? await bcrypt.hash(password, 10) : undefined,
        settings: {
            allowComments: settings?.allowComments || false,
            allowCopy: settings?.allowCopy !== false,
            showMetadata: settings?.showMetadata !== false,
            expiresAt: settings?.expiresAt
        }
    });

    res.json({
        success: true,
        shareId: sharedConv.shareId,
        shareUrl: `${process.env.APP_URL}/shared/${sharedConv.shareId}`
    });
});

// @desc    Get shared conversation
// @route   GET /api/ai/shared/:shareId
// @access  Public
exports.getSharedConversation = asyncHandler(async (req, res) => {
    const { shareId } = req.params;
    const { password } = req.body;

    const shared = await SharedConversation.findOne({
        shareId,
        active: true
    }).populate('conversationId');

    if (!shared) {
        res.status(404);
        throw new Error('Shared conversation not found');
    }

    // Check expiration
    if (shared.settings.expiresAt && new Date() > shared.settings.expiresAt) {
        res.status(410);
        throw new Error('Shared conversation has expired');
    }

    // Check password
    if (shared.password) {
        if (!password) {
            return res.json({
                success: false,
                requiresPassword: true
            });
        }

        const validPassword = await bcrypt.compare(password, shared.password);
        if (!validPassword) {
            res.status(401);
            throw new Error('Invalid password');
        }
    }

    // Get messages
    const messages = await Message.find({
        conversationId: shared.conversationId._id
    })
        .sort({ createdAt: 1 })
        .select('role content createdAt tokens');

    // Update view count
    shared.views += 1;
    shared.lastViewedAt = new Date();
    await shared.save();

    res.json({
        success: true,
        conversation: {
            title: shared.title,
            description: shared.description,
            messages: shared.settings.allowCopy ? messages : messages.map(m => ({
                role: m.role,
                content: m.content,
                createdAt: m.createdAt
            })),
            metadata: shared.settings.showMetadata ? {
                messageCount: messages.length,
                totalTokens: shared.conversationId.totalTokens,
                createdAt: shared.createdAt
            } : null,
            settings: {
                allowCopy: shared.settings.allowCopy,
                allowComments: shared.settings.allowComments
            }
        }
    });
});

// @desc    Revoke share
// @route   DELETE /api/ai/shared/:shareId
// @access  Private
exports.revokeShare = asyncHandler(async (req, res) => {
    const shared = await SharedConversation.findOne({
        shareId: req.params.shareId,
        userId: req.user.id
    });

    if (!shared) {
        res.status(404);
        throw new Error('Shared conversation not found');
    }

    shared.active = false;
    await shared.save();

    res.json({
        success: true,
        message: 'Share revoked'
    });
});

module.exports = exports;