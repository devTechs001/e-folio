const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    technologies: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'archived'],
        default: 'in-progress'
    },
    images: [{
        url: String,
        caption: String
    }],
    links: {
        github: String,
        live: String,
        demo: String
    },
    category: {
        type: String,
        enum: ['Web', 'Mobile', 'Desktop', 'AI/ML', 'Other'],
        default: 'Web'
    },
    featured: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
