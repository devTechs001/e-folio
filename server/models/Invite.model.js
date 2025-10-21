const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['collaborator', 'viewer'],
        default: 'collaborator'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'rejected'],
        default: 'pending'
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    acceptedAt: {
        type: Date
    },
    permissions: [{
        type: String
    }]
}, {
    timestamps: true
});

// Auto-expire invites
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invite', inviteSchema);
