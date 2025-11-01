// models/TrackingSession.js
const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Visitor Information
    ip: String,
    userAgent: String,
    browser: String,
    device: {
        type: String,
        isMobile: Boolean,
        isTablet: Boolean,
        os: String
    },
    location: {
        country: String,
        city: String,
        region: String,
        latitude: Number,
        longitude: Number,
        timezone: String
    },
    // Session Data
    startTime: {
        type: Date,
        default: Date.now,
        index: true
    },
    endTime: Date,
    duration: Number, // milliseconds
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    // Engagement Metrics
    pagesViewed: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    scrollDepth: {
        type: Number,
        default: 0
    },
    timeOnPage: [{
        page: String,
        duration: Number
    }],
    // Page Journey
    pageJourney: [{
        path: String,
        title: String,
        timestamp: Date,
        timeSpent: Number,
        interactions: Number
    }],
    // Traffic Source
    source: {
        referrer: String,
        campaign: String,
        medium: String,
        source: String
    },
    // AI Insights
    aiInsights: {
        engagementLevel: {
            type: String,
            enum: ['very_high', 'high', 'medium', 'low'],
            default: 'low'
        },
        intentScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        conversionProbability: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        behaviorType: {
            type: String,
            enum: ['explorer', 'searcher', 'buyer', 'researcher'],
            default: 'explorer'
        },
        predictedActions: [String],
        riskOfLeaving: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    // Events
    events: [{
        type: String,
        data: mongoose.Schema.Types.Mixed,
        timestamp: Date
    }],
    // Conversion
    converted: {
        type: Boolean,
        default: false
    },
    conversionValue: Number,
    conversionType: String
}, {
    timestamps: true
});

// Indexes
trackingSessionSchema.index({ startTime: -1 });
trackingSessionSchema.index({ isActive: 1, startTime: -1 });
trackingSessionSchema.index({ 'location.country': 1 });
trackingSessionSchema.index({ 'device.isMobile': 1 });
trackingSessionSchema.index({ converted: 1 });
trackingSessionSchema.index({ 'aiInsights.engagementLevel': 1 });

// Calculate duration before save
trackingSessionSchema.pre('save', function(next) {
    if (this.endTime && this.startTime) {
        this.duration = this.endTime - this.startTime;
    }
    next();
});

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);