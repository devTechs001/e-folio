const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    visitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    categories: {
        design: Number,
        functionality: Number,
        performance: Number,
        content: Number
    },
    projectReviewed: {
        type: String
    },
    helpful: {
        count: { type: Number, default: 0 },
        users: [String]
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'pending'
    },
    featured: {
        type: Boolean,
        default: false
    },
    response: {
        text: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    metadata: {
        userAgent: String,
        ip: String,
        location: String
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ featured: 1, status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
