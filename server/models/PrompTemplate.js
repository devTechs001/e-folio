// models/PromptTemplate.js
const mongoose = require('mongoose');

const promptTemplateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: String,
    category: {
        type: String,
        enum: ['coding', 'writing', 'analysis', 'creative', 'business', 'other'],
        default: 'other',
        index: true
    },
    template: {
        type: String,
        required: true
    },
    variables: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        type: {
            type: String,
            enum: ['text', 'number', 'select', 'textarea'],
            default: 'text'
        },
        options: [String],
        required: {
            type: Boolean,
            default: false
        },
        defaultValue: String
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    tags: [String],
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

promptTemplateSchema.index({ isPublic: 1, category: 1 });
promptTemplateSchema.index({ tags: 1 });
promptTemplateSchema.index({ featured: -1, 'rating.average': -1 });

module.exports = mongoose.model('PromptTemplate', promptTemplateSchema);