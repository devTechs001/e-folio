// models/CollaborationRequest.js
const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
    // Personal Info
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: String,
    location: String,
    timezone: String,
    
    // Professional Info
    role: String,
    company: String,
    experience: String,
    skills: [{
        type: String
    }],
    skillLevels: {
        type: Map,
        of: String // beginner, intermediate, advanced, expert
    },
    
    // Online Presence
    portfolio: String,
    github: String,
    linkedin: String,
    twitter: String,
    instagram: String,
    website: String,
    
    // Project Details
    projectType: [{
        type: String
    }],
    budget: String,
    timeline: String,
    availability: String,
    preferredContact: {
        type: String,
        enum: ['email', 'phone', 'linkedin', 'any'],
        default: 'email'
    },
    
    // Additional Info
    message: {
        type: String,
        required: true
    },
    references: [{
        name: String,
        email: String,
        relationship: String
    }],
    attachments: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }],
    interests: [{
        type: String
    }],
    languages: [{
        type: String
    }],
    
    // Preferences
    remoteWork: {
        type: Boolean,
        default: true
    },
    willingToRelocate: {
        type: Boolean,
        default: false
    },
    newsletter: {
        type: Boolean,
        default: true
    },
    
    // Status & Processing
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'archived'],
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
    
    // Additional tracking
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
    isPriority: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    source: {
        type: String,
        default: 'website'
    }
}, {
    timestamps: true
});

// Indexes
collaborationRequestSchema.index({ email: 1, status: 1 });
collaborationRequestSchema.index({ submittedAt: -1 });
collaborationRequestSchema.index({ status: 1 });
collaborationRequestSchema.index({ name: 'text', email: 'text', message: 'text' });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);