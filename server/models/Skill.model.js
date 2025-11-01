// models/Skill.js
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Skill name is required'],
        trim: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters']
    },
    type: {
        type: String,
        enum: ['technical', 'professional'],
        required: true,
        index: true
    },
    level: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 50
    },
    category: {
        type: String,
        required: function() {
            return this.type === 'technical';
        },
        enum: [
            'Frontend', 'Backend', 'DevOps', 'Database', 'Mobile',
            'AI/ML', 'Cloud', 'Tools', 'Leadership', 'Communication',
            'Project Management', 'Problem Solving', 'Creativity', 'Teamwork'
        ],
        index: true
    },
    icon: {
        type: String,
        default: 'fa-solid fa-code'
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    yearsOfExperience: {
        type: Number,
        min: 0,
        default: 0
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    certifications: [{
        type: String,
        trim: true
    }],
    learningResources: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['article', 'video', 'course', 'book', 'documentation'],
            default: 'article'
        },
        completedDate: Date,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    visible: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    endorsements: {
        type: Number,
        default: 0,
        min: 0
    },
    order: {
        type: Number,
        default: 0
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillGroup'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
skillSchema.index({ userId: 1, type: 1 });
skillSchema.index({ userId: 1, featured: -1 });
skillSchema.index({ userId: 1, level: -1 });
skillSchema.index({ userId: 1, order: 1 });

// Virtual for level category
skillSchema.virtual('levelCategory').get(function() {
    if (this.level < 40) return 'beginner';
    if (this.level < 70) return 'intermediate';
    return 'advanced';
});

module.exports = mongoose.models.Skill || mongoose.model('Skill', skillSchema);