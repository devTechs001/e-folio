const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
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
    fingerprint: {
        type: String,
        index: true
    },
    ip: {
        type: String
    },
    location: {
        country: String,
        city: String,
        region: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        timezone: String
    },
    device: {
        type: String,
        browser: String,
        os: String,
        isMobile: Boolean,
        screenResolution: String,
        language: String
    },
    referrer: {
        source: String,
        medium: String,
        campaign: String,
        url: String
    },
    pages: [{
        path: String,
        title: String,
        enteredAt: Date,
        exitedAt: Date,
        timeSpent: Number,
        scrollDepth: Number,
        interactions: {
            clicks: Number,
            hovers: Number,
            formSubmissions: Number
        }
    }],
    events: [{
        type: {
            type: String,
            enum: ['click', 'scroll', 'hover', 'input', 'download', 'video_play', 'form_submit']
        },
        element: String,
        elementId: String,
        elementClass: String,
        page: String,
        timestamp: Date,
        data: mongoose.Schema.Types.Mixed
    }],
    engagement: {
        totalTimeSpent: { type: Number, default: 0 },
        pagesViewed: { type: Number, default: 0 },
        interactions: { type: Number, default: 0 },
        scrollDepthAvg: { type: Number, default: 0 },
        bounced: { type: Boolean, default: false },
        converted: { type: Boolean, default: false }
    },
    aiInsights: {
        intentScore: Number,
        engagementLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high']
        },
        interests: [String],
        likelyNextAction: String,
        conversionProbability: Number,
        behaviorPattern: String
    },
    status: {
        type: String,
        enum: ['active', 'idle', 'ended'],
        default: 'active'
    },
    firstVisit: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
visitorSchema.index({ sessionId: 1, lastActivity: -1 });
visitorSchema.index({ 'location.country': 1 });
visitorSchema.index({ 'device.isMobile': 1 });
visitorSchema.index({ status: 1, lastActivity: -1 });

// Auto-end inactive sessions after 30 minutes
visitorSchema.methods.checkInactive = function() {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
    
    if (this.lastActivity < thirtyMinutesAgo && this.status === 'active') {
        this.status = 'ended';
        return true;
    }
    return false;
};

module.exports = mongoose.model('Visitor', visitorSchema);
