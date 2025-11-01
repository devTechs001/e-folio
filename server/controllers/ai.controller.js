// controllers/aiAssistantController.js
const Conversation = require('../models/Conversations');
const Message = require('../models/Message');
const AIService = require('../services/AIService');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all conversations for user
// @route   GET /api/ai/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
    const {
        archived = false,
        search,
        tags,
        sortBy = 'updatedAt',
        order = 'desc',
        page = 1,
        limit = 20
    } = req.query;

    // Build filter
    const filter = { 
        userId: req.user.id,
        archived: archived === 'true'
    };

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    if (tags) {
        filter.tags = { $in: tags.split(',') };
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
        Conversation.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'messages',
                options: { 
                    sort: { createdAt: -1 },
                    limit: 1
                }
            })
            .lean(),
        Conversation.countDocuments(filter)
    ]);

    res.json({
        success: true,
        conversations,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
        }
    });
});

// @desc    Get single conversation
// @route   GET /api/ai/conversations/:id
// @access  Private
exports.getConversation = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    // Get all messages for this conversation
    const messages = await Message.find({ 
        conversationId: conversation._id 
    }).sort({ createdAt: 1 });

    res.json({
        success: true,
        conversation: {
            ...conversation.toObject(),
            messages
        }
    });
});

// @desc    Create new conversation
// @route   POST /api/ai/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res) => {
    const { title, model, systemPrompt, settings } = req.body;

    const conversation = await Conversation.create({
        userId: req.user.id,
        title: title || 'New Conversation',
        model: model || 'gpt-3.5-turbo',
        systemPrompt,
        settings
    });

    res.status(201).json({
        success: true,
        conversation
    });
});

// @desc    Update conversation
// @route   PUT /api/ai/conversations/:id
// @access  Private
exports.updateConversation = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const { title, pinned, archived, tags, settings } = req.body;

    if (title) conversation.title = title;
    if (pinned !== undefined) conversation.pinned = pinned;
    if (archived !== undefined) conversation.archived = archived;
    if (tags) conversation.tags = tags;
    if (settings) conversation.settings = { ...conversation.settings, ...settings };

    await conversation.save();

    res.json({
        success: true,
        conversation
    });
});

// @desc    Delete conversation
// @route   DELETE /api/ai/conversations/:id
// @access  Private
exports.deleteConversation = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    // Delete all messages
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete conversation
    await conversation.deleteOne();

    res.json({
        success: true,
        message: 'Conversation deleted'
    });
});

// @desc    Send message
// @route   POST /api/ai/conversations/:id/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
    const { message, files, stream = false } = req.body;

    let conversation;

    // Create new conversation if no ID provided
    if (!req.params.id || req.params.id === 'new') {
        conversation = await Conversation.create({
            userId: req.user.id,
            title: 'New Conversation',
            model: req.body.model || 'gpt-3.5-turbo'
        });
    } else {
        conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!conversation) {
            res.status(404);
            throw new Error('Conversation not found');
        }
    }

    // Moderate content
    const moderation = await AIService.moderateContent(message);
    if (moderation.flagged) {
        res.status(400);
        throw new Error('Message contains inappropriate content');
    }

    // Save user message
    const userMessage = await Message.create({
        conversationId: conversation._id,
        role: 'user',
        content: message,
        files
    });

    // Get conversation history
    const history = await Message.find({ 
        conversationId: conversation._id 
    })
        .sort({ createdAt: 1 })
        .select('role content')
        .lean();

    // Send to AI
    const aiResponse = await AIService.sendMessage({
        model: conversation.model,
        messages: history,
        temperature: conversation.settings.temperature,
        maxTokens: conversation.settings.maxTokens,
        stream,
        systemPrompt: conversation.systemPrompt
    });

    if (stream) {
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the stream
        aiResponse.pipe(res);

        // Save message after streaming completes
        aiResponse.on('end', async () => {
            // This would need to be handled differently in production
            // Maybe use WebSocket or save partial responses
        });
    } else {
        // Save AI response
        const aiMessage = await Message.create({
            conversationId: conversation._id,
            role: 'assistant',
            content: aiResponse.content,
            model: aiResponse.model,
            tokens: aiResponse.tokens,
            cost: aiResponse.cost,
            responseTime: aiResponse.responseTime,
            metadata: {
                temperature: conversation.settings.temperature,
                maxTokens: conversation.settings.maxTokens,
                finishReason: aiResponse.finishReason
            }
        });

        // Update conversation
        conversation.messageCount += 2;
        conversation.totalTokens += aiResponse.tokens.total;
        conversation.metadata.lastMessageAt = new Date();

        if (!conversation.metadata.estimatedCost) {
            conversation.metadata.estimatedCost = 0;
        }
        conversation.metadata.estimatedCost += aiResponse.cost;

        // Auto-generate title from first message
        if (conversation.messageCount === 2) {
            await conversation.generateTitle();
        }

        await conversation.save();

        res.json({
            success: true,
            conversation,
            message: aiMessage
        });
    }
});

// @desc    Regenerate AI response
// @route   POST /api/ai/messages/:id/regenerate
// @access  Private
exports.regenerateMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message || message.role !== 'assistant') {
        res.status(404);
        throw new Error('Message not found');
    }

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    // Get history up to this message
    const history = await Message.find({
        conversationId: conversation._id,
        createdAt: { $lt: message.createdAt }
    })
        .sort({ createdAt: 1 })
        .select('role content')
        .lean();

    // Regenerate
    const aiResponse = await AIService.sendMessage({
        model: conversation.model,
        messages: history,
        temperature: conversation.settings.temperature,
        maxTokens: conversation.settings.maxTokens,
        systemPrompt: conversation.systemPrompt
    });

    // Update message
    message.content = aiResponse.content;
    message.tokens = aiResponse.tokens;
    message.cost = aiResponse.cost;
    message.responseTime = aiResponse.responseTime;
    message.regenerated = true;
    
    await message.save();

    res.json({
        success: true,
        message
    });
});

// @desc    Rate message
// @route   POST /api/ai/messages/:id/rate
// @access  Private
exports.rateMessage = asyncHandler(async (req, res) => {
    const { rating, feedback } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Verify ownership
    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    message.rating = rating;
    message.feedback = feedback;
    
    await message.save();

    res.json({
        success: true,
        message
    });
});

// @desc    Toggle bookmark message
// @route   POST /api/ai/messages/:id/bookmark
// @access  Private
exports.toggleBookmark = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Verify ownership
    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    message.bookmarked = !message.bookmarked;
    await message.save();

    res.json({
        success: true,
        message
    });
});

// @desc    Get bookmarked messages
// @route   GET /api/ai/bookmarks
// @access  Private
exports.getBookmarks = asyncHandler(async (req, res) => {
    // Get all conversations for user
    const conversations = await Conversation.find({ 
        userId: req.user.id 
    }).select('_id');

    const conversationIds = conversations.map(c => c._id);

    // Get bookmarked messages
    const bookmarks = await Message.find({
        conversationId: { $in: conversationIds },
        bookmarked: true
    })
        .populate('conversationId', 'title')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        bookmarks
    });
});

// @desc    Search messages
// @route   GET /api/ai/search
// @access  Private
exports.searchMessages = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
        res.status(400);
        throw new Error('Search query required');
    }

    // Get all conversations for user
    const conversations = await Conversation.find({ 
        userId: req.user.id 
    }).select('_id');

    const conversationIds = conversations.map(c => c._id);

    // Search messages
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        Message.find({
            conversationId: { $in: conversationIds },
            content: { $regex: query, $options: 'i' }
        })
            .populate('conversationId', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Message.countDocuments({
            conversationId: { $in: conversationIds },
            content: { $regex: query, $options: 'i' }
        })
    ]);

    res.json({
        success: true,
        messages,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
        }
    });
});

// @desc    Get usage statistics
// @route   GET /api/ai/stats
// @access  Private
exports.getStats = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ 
        userId: req.user.id 
    });

    const conversationIds = conversations.map(c => c._id);

    const [
        totalMessages,
        totalTokens,
        totalCost,
        messagesByModel,
        dailyUsage
    ] = await Promise.all([
        Message.countDocuments({ 
            conversationId: { $in: conversationIds } 
        }),
        
        Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $group: { _id: null, total: { $sum: '$tokens.total' } } }
        ]),
        
        Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $group: { _id: null, total: { $sum: '$cost' } } }
        ]),
        
        Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $group: { _id: '$model', count: { $sum: 1 } } }
        ]),
        
        Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    messages: { $sum: 1 },
                    tokens: { $sum: '$tokens.total' },
                    cost: { $sum: '$cost' }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ])
    ]);

    res.json({
        success: true,
        stats: {
            totalConversations: conversations.length,
            totalMessages,
            totalTokens: totalTokens[0]?.total || 0,
            totalCost: (totalCost[0]?.total || 0).toFixed(4),
            messagesByModel,
            dailyUsage,
            averageTokensPerMessage: totalMessages > 0 
                ? Math.round((totalTokens[0]?.total || 0) / totalMessages)
                : 0
        }
    });
});

// @desc    Export conversation
// @route   GET /api/ai/conversations/:id/export
// @access  Private
exports.exportConversation = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const messages = await Message.find({ 
        conversationId: conversation._id 
    }).sort({ createdAt: 1 });

    const exportData = {
        title: conversation.title,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount,
        totalTokens: conversation.totalTokens,
        estimatedCost: conversation.metadata.estimatedCost,
        messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
            tokens: m.tokens
        }))
    };

    const { format = 'json' } = req.query;

    if (format === 'markdown') {
        const markdown = this.generateMarkdown(exportData);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${conversation.title}.md"`);
        res.send(markdown);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${conversation.title}.json"`);
        res.json(exportData);
    }
});

// Helper to generate markdown
exports.generateMarkdown = (data) => {
    let markdown = `# ${data.title}\n\n`;
    markdown += `**Model:** ${data.model}\n`;
    markdown += `**Created:** ${new Date(data.createdAt).toLocaleString()}\n`;
    markdown += `**Messages:** ${data.messageCount}\n`;
    markdown += `**Tokens:** ${data.totalTokens}\n`;
    markdown += `**Cost:** $${data.estimatedCost}\n\n`;
    markdown += `---\n\n`;

    data.messages.forEach(msg => {
        markdown += `## ${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
        markdown += `---\n\n`;
    });

    return markdown;
};

module.exports = exports;