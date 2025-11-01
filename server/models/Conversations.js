// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Conversation',
        trim: true,
        maxlength: 200
    },
    model: {
        type: String,
        enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2'],
        default: 'gpt-3.5-turbo'
    },
    settings: {
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 2
        },
        maxTokens: {
            type: Number,
            default: 2000,
            min: 100,
            max: 4000
        },
        topP: {
            type: Number,
            default: 1
        },
        frequencyPenalty: {
            type: Number,
            default: 0
        },
        presencePenalty: {
            type: Number,
            default: 0
        }
    },
    systemPrompt: {
        type: String,
        default: 'You are a helpful AI assistant for a portfolio website. Help with coding, design, and project management.'
    },
    messageCount: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    pinned: {
        type: Boolean,
        default: false
    },
    archived: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        lastMessageAt: Date,
        estimatedCost: Number,
        averageResponseTime: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });
conversationSchema.index({ userId: 1, archived: 1 });
conversationSchema.index({ tags: 1 });

// Virtual populate messages
conversationSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'conversationId'
});

// Auto-generate title from first message
conversationSchema.methods.generateTitle = async function() {
    const Message = mongoose.model('Message');
    const firstMessage = await Message.findOne({ 
        conversationId: this._id 
    }).sort({ createdAt: 1 });

    if (firstMessage && firstMessage.content) {
        const title = firstMessage.content.substring(0, 50);
        this.title = title + (firstMessage.content.length > 50 ? '...' : '');
        await this.save();
    }
};

module.exports = mongoose.model('Conversation', conversationSchema);