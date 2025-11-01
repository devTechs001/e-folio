// models/SkillGroup.js
const mongoose = require('mongoose');

const skillGroupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    description: String,
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

skillGroupSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('SkillGroup', skillGroupSchema);