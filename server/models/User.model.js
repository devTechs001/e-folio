const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: String,
    bio: {
        type: String,
        maxlength: 500
    },
    role: String,
    company: String,
    location: String,
    website: String,
    phone: String,
    
    // Social Links
    socialLinks: {
        github: String,
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String,
        youtube: String
    },

    // Preferences
    preferences: {
        publicEmail: {
            type: Boolean,
            default: false
        },
        publicPhone: {
            type: Boolean,
            default: false
        },
        showActivity: {
            type: Boolean,
            default: true
        },
        emailNotifications: {
            type: Boolean,
            default: true
        }
    },

    // Settings
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            collaborationRequests: { type: Boolean, default: true },
            comments: { type: Boolean, default: false },
            projectUpdates: { type: Boolean, default: true },
            newsletter: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true },
            analytics: { type: Boolean, default: false }
        },
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'private', 'collaborators'],
                default: 'public'
            },
            showEmail: { type: Boolean, default: false },
            showActivity: { type: Boolean, default: true },
            showProjects: { type: Boolean, default: true },
            allowComments: { type: Boolean, default: true },
            allowCollaborations: { type: Boolean, default: true },
            indexProfile: { type: Boolean, default: true }
        },
        appearance: {
            theme: { type: String, default: 'dark' },
            fontSize: { type: String, default: 'medium' },
            language: { type: String, default: 'en' },
            dateFormat: { type: String, default: 'MM/DD/YYYY' },
            timezone: { type: String, default: 'UTC' }
        },
        security: {
            sessionTimeout: { type: Number, default: 30 }
        }
    },

    // Security
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    twoFactorTempSecret: String,
    twoFactorBackupCodes: [String],
    passwordChangedAt: Date,

    // Premium
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpiresAt: Date,

    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: Date,
    loginCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);