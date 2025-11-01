const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    fingerprint: {
        type: String,
        index: true
    },
    // Location data
    location: {
        ip: String,
        country: String,
        countryCode: String,
        region: String,
        city: String,
        latitude: Number,
        longitude: Number,
        timezone: String
    },
    // Device information
    device: {
        type: {
            type: String,
            enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
            default: 'Unknown'
        },
        os: String,
        browser: String,
        browserVersion: String,
        screenResolution: String,
        language: String
    },
    // Visit data
    pages: [{
        path: String,
        title: String,
        timestamp: Date,
        duration: Number,
        scrollDepth: Number,
        clicks: Number
    }],
    referrer: {
        source: String,
        medium: String,
        campaign: String,
        url: String
    },
    // Session metrics
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    firstVisit: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        index: true
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    pageViews: {
        type: Number,
        default: 0
    },
    bounced: {
        type: Boolean,
        default: false
    },
    converted: {
        type: Boolean,
        default: false
    },
    // Engagement metrics
    interactions: [{
        type: String,
        timestamp: Date,
        data: mongoose.Schema.Types.Mixed
    }],
    // UTM parameters
    utm: {
        source: String,
        medium: String,
        campaign: String,
        term: String,
        content: String
    }
}, {
    timestamps: true
});

// Indexes for performance
visitorSchema.index({ userId: 1, createdAt: -1 });
visitorSchema.index({ userId: 1, isActive: 1 });
visitorSchema.index({ 'location.country': 1 });
visitorSchema.index({ 'device.type': 1 });
visitorSchema.index({ lastActivity: -1 });

// Methods
visitorSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    this.isActive = true;
    return this.save();
};

visitorSchema.methods.endSession = function() {
    this.isActive = false;
    this.totalDuration = Math.floor((new Date() - this.firstVisit) / 1000);
    if (this.pageViews === 1) {
        this.bounced = true;
    }
    return this.save();
};

// Statics
visitorSchema.statics.getActiveCount = function(userId) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.countDocuments({
        userId,
        lastActivity: { $gte: fiveMinutesAgo },
        isActive: true
    });
};

visitorSchema.statics.getRealtimeVisitors = function(userId, limit = 20) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.find({
        userId,
        lastActivity: { $gte: oneHourAgo }
    })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('Visitor', visitorSchema);