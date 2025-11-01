// models/CollaborationRequest.js
const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    company: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    inviteLink: String,
    inviteToken: String,
    rejectionReason: String,
    isPriority: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        default: 'website'
    },
    notes: [{
        content: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date
}, {
    timestamps: true
});

// Indexes
collaborationRequestSchema.index({ email: 1 });
collaborationRequestSchema.index({ status: 1 });
collaborationRequestSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);