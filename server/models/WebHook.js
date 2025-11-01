const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    url: {
        type: String,
        required: true
    },
    events: [{
        type: String,
        required: true
    }],
    secret: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    failureCount: {
        type: Number,
        default: 0
    },
    lastTriggered: Date,
    lastSuccess: Date,
    lastFailure: Date,
    deletedAt: Date
}, {
    timestamps: true
});

webhookSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);