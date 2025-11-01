// models/Invite.js
const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'collaborator', 'viewer'],
        default: 'collaborator'
    },
    permissions: [{
        type: String
    }],
    token: {
        type: String,
        required: true,
        unique: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'cancelled', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    acceptedAt: Date,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customMessage: String,
    type: {
        type: String,
        enum: ['email', 'link'],
        default: 'email'
    },
    maxUses: {
        type: Number,
        default: 1
    },
    uses: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster lookups
inviteSchema.index({ token: 1 });
inviteSchema.index({ email: 1, status: 1 });
inviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Invite', inviteSchema);