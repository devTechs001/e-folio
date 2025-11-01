// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    technologies: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['planning', 'in-progress', 'completed', 'archived'],
        default: 'in-progress',
        index: true
    },
    category: {
        type: String,
        enum: ['Web', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain', 'DevOps', 'Other'],
        required: true,
        index: true
    },
    links: {
        github: { type: String, trim: true },
        live: { type: String, trim: true },
        demo: { type: String, trim: true },
        documentation: { type: String, trim: true }
    },
    images: [{
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    collaborators: [{
        name: String,
        role: String,
        github: String
    }],
    startDate: Date,
    endDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    metrics: {
        stars: { type: Number, default: 0 },
        forks: { type: Number, default: 0 },
        commits: { type: Number, default: 0 },
        lastCommit: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ updatedAt: -1 });
projectSchema.index({ featured: -1, createdAt: -1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const diff = this.endDate - this.startDate;
        return Math.floor(diff / (1000 * 60 * 60 * 24)); // days
    }
    return null;
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);