// models/SharedConversation.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const sharedConversationSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shareId: {
        type: String,
        unique: true,
        required: true,
        default: () => crypto.randomBytes(16).toString('hex')
    },
    title: String,
    description: String,
    password: String,
    settings: {
        allowComments: {
            type: Boolean,
            default: false
        },
        allowCopy: {
            type: Boolean,
            default: true
        },
        showMetadata: {
            type: Boolean,
            default: true
        },
        expiresAt: Date
    },
    views: {
        type: Number,
        default: 0
    },
    lastViewedAt: Date,
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

sharedConversationSchema.index({ shareId: 1, active: 1 });
sharedConversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SharedConversation', sharedConversationSchema);