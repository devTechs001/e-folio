const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    icon: String,
    members: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        enum: ['users', 'developers', 'designers', 'support'],
        required: true
    },
    platform: {
        type: String,
        enum: ['discord', 'slack', 'telegram', 'forum'],
        required: true
    },
    inviteLink: String,
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        autoJoin: Boolean,
        requireApproval: Boolean,
        maxMembers: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Community', communitySchema);