// models/PageAnalytics.js
const mongoose = require('mongoose');

const pageAnalyticsSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
        index: true
    },
    title: String,
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Metrics
    views: {
        type: Number,
        default: 1
    },
    uniqueViews: {
        type: Number,
        default: 1
    },
    totalTimeSpent: {
        type: Number,
        default: 0
    },
    avgTimeSpent: {
        type: Number,
        default: 0
    },
    bounceRate: {
        type: Number,
        default: 0
    },
    exitRate: {
        type: Number,
        default: 0
    },
    // Interactions
    clicks: {
        type: Number,
        default: 0
    },
    scrollDepth: {
        avg: Number,
        max: Number
    },
    // Performance
    loadTime: {
        avg: Number,
        samples: Number
    },
    // Heatmap Data
    heatmap: {
        clicks: [{
            x: Number,
            y: Number,
            count: Number
        }],
        scrollDepth: [{
            depth: Number,
            count: Number
        }]
    }
}, {
    timestamps: true
});

pageAnalyticsSchema.index({ path: 1, date: -1 });

module.exports = mongoose.model('PageAnalytics', pageAnalyticsSchema);