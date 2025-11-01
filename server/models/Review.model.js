// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    comment: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        trim: true
    },
    categories: {
        design: { type: Number, min: 0, max: 5, default: 0 },
        functionality: { type: Number, min: 0, max: 5, default: 0 },
        performance: { type: Number, min: 0, max: 5, default: 0 },
        support: { type: Number, min: 0, max: 5, default: 0 }
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    recommend: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    response: {
        type: String,
        default: ''
    },
    respondedAt: Date,
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    featured: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatedAt: Date,
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    ipAddress: String,
    userAgent: String,
    helpful: {
        type: Number,
        default: 0
    },
    notHelpful: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ featured: 1, status: 1 });
reviewSchema.index({ email: 1, createdAt: -1 });
reviewSchema.index({ name: 'text', comment: 'text', title: 'text' });

module.exports = mongoose.model('Review', reviewSchema);