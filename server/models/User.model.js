// User Model (MongoDB/Mongoose example - optional)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return this.role !== 'owner';
        }
    },
    role: {
        type: String,
        enum: ['owner', 'collaborator', 'viewer'],
        default: 'collaborator'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    avatar: {
        type: String,
        default: ''
    },
    permissions: [{
        type: String
    }],
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
