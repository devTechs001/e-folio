const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['video', 'tutorial'],
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    pointsAwarded: {
        type: Boolean,
        default: false
    },
    
    // Additional data
    currentStep: Number,
    watchTime: Number, // in seconds
    quizScores: [{
        quizId: String,
        score: Number,
        attemptedAt: Date
    }]
}, {
    timestamps: true
});

learningProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });
learningProgressSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);