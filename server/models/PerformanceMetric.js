// server/models/PerformanceMetric.js
const mongoose = require('mongoose');

const performanceMetricSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    views: {
        type: Number,
        default: 0
    },
    visitors: {
        type: Number,
        default: 0
    },
    uniqueVisitors: {
        type: Number,
        default: 0
    },
    avgSessionDuration: {
        type: Number,
        default: 0
    },
    bounceRate: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for efficient date range queries
performanceMetricSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('PerformanceMetric', performanceMetricSchema);