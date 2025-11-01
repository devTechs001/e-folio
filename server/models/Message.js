// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['system', 'user', 'assistant', 'function'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    model: String,
    tokens: {
        prompt: Number,
        completion: Number,
        total: Number
    },
    cost: Number,
    responseTime: Number, // milliseconds
    files: [{
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    metadata: {
        temperature: Number,
        maxTokens: Number,
        finishReason: String,
        citations: [String],
        functionCall: mongoose.Schema.Types.Mixed
    },
    regenerated: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: String,
    bookmarked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, role: 1 });
messageSchema.index({ bookmarked: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);