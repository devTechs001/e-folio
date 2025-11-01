const mongoose = require('mongoose');

const learningVideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnail: String,
    duration: {
        type: String,
        required: true
    },
    durationSeconds: Number,
    category: {
        type: String,
        enum: ['getting-started', 'customization', 'collaboration', 'analytics', 'advanced'],
        required: true,
        index: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
        index: true
    },
    tags: [String],
    transcript: String,
    
    // Stats
    views: {
        type: Number,
        default: 0
    },
    likes: {
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
    
    // Related content
    relatedVideos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningVideo'
    }],
    
    isPublished: {
        type: Boolean,
        default: true
    },
    publishedAt: Date
}, {
    timestamps: true
});

learningVideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
learningVideoSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('LearningVideo', learningVideoSchema);