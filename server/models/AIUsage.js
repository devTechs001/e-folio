// models/AIUsageLog.js
const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        index: true
    },
    model: {
        type: String,
        required: true,
        index: true
    },
    tokens: {
        prompt: Number,
        completion: Number,
        total: Number
    },
    cost: Number,
    responseTime: Number,
    endpoint: String,
    ip: String,
    userAgent: String,
    error: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// Indexes for analytics queries
aiUsageLogSchema.index({ userId: 1, timestamp: -1 });
aiUsageLogSchema.index({ model: 1, timestamp: -1 });
aiUsageLogSchema.index({ timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
aiUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);