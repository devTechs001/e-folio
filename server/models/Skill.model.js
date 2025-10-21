const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        enum: ['Frontend', 'Backend', 'DevOps', 'Database', 'Tools', 'Professional'],
        required: true
    },
    type: {
        type: String,
        enum: ['technical', 'professional'],
        default: 'technical'
    },
    color: {
        type: String,
        default: '#00efff'
    },
    icon: {
        type: String
    },
    description: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
