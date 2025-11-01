const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['getting-started', 'customization', 'collaboration', 'analytics', 'advanced'],
        required: true,
        index: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'easy',
        index: true
    },
    estimatedTime: {
        type: String,
        required: true
    },
    steps: [{
        title: String,
        content: String,
        images: [String],
        codeSnippets: [{
            language: String,
            code: String
        }],
        order: Number
    }],
    prerequisites: [String],
    tags: [String],
    
    // Stats
    views: {
        type: Number,
        default: 0
    },
    completions: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    ratingsCount: {
        type: Number,
        default: 0
    },
    
    order: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

tutorialSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Tutorial', tutorialSchema);