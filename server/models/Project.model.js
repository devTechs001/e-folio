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
        enum: ['idea', 'planning', 'in-progress', 'testing', 'completed', 'on-hold', 'archived'],
        default: 'in-progress',
        index: true
    },
    category: {
        type: String,
        enum: ['Web', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain', 'DevOps', 'Data', 'Game', 'IoT', 'Other'],
        required: true,
        index: true
    },
    links: {
        github: { type: String, trim: true },
        live: { type: String, trim: true },
        demo: { type: String, trim: true },
        documentation: { type: String, trim: true },
        staging: { type: String, trim: true },
        analytics: { type: String, trim: true },
        monitoring: { type: String, trim: true },
        api: { type: String, trim: true }
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
        enum: ['low', 'medium', 'high', 'urgent'],
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
    },
    // Extended fields for enhanced project management
    client: { type: String, trim: true },
    budget: { type: Number, default: 0 },
    currentStage: { type: String, enum: ['idea', 'planning', 'development', 'testing', 'deployment', 'maintenance'], default: 'planning' },
    stageHistory: [{
        stage: String,
        date: Date,
        notes: String
    }],
    milestones: [{
        name: String,
        description: String,
        dueDate: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date
    }],
    team: [{
        name: String,
        role: String,
        email: String
    }],
    resources: {
        budget: { type: Number, default: 0 },
        timeline: String,
        tools: [String],
        documentation: String
    },
    deliverables: {
        current: [String],
        completed: [String],
        pending: [String]
    },
    automation: {
        autoDeploy: { type: Boolean, default: false },
        ciCd: { type: Boolean, default: false },
        testing: { type: Boolean, default: false },
        monitoring: { type: Boolean, default: false },
        notifications: { type: Boolean, default: true }
    },
    analytics: {
        views: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        uptime: { type: Number, default: 0 },
        errors: { type: Number, default: 0 }
    },
    challenges: String,
    achievements: [String],
    fullDescription: String,
    teamSize: Number,
    completionDate: Date,
    hidden: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false }
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
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ currentStage: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const diff = this.endDate - this.startDate;
        return Math.floor(diff / (1000 * 60 * 60 * 24)); // days
    }
    return null;
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);