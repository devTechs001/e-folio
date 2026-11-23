// models/Interests.js
const mongoose = require('mongoose');

const interestsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Interest name is required'],
        trim: true,
        maxlength: [100, 'Interest name cannot be more than 100 characters']
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category cannot be more than 50 characters']
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    description: {
        type: String,
        maxlength: [300, 'Description cannot be more than 300 characters'],
        trim: true
    },
    icon: {
        type: String,
        trim: true,
        maxlength: [50, 'Icon name cannot be more than 50 characters']
    },
    color: {
        type: String,
        trim: true,
        maxlength: [20, 'Color cannot be more than 20 characters']
    },
    // Phase 35 — what the hobbies dashboard manages.
    //
    // `order` is the manual position set with the dashboard's reorder action.
    // It is written only through the dedicated reorder endpoint so two quick
    // saves cannot stamp the same value.
    order: {
        type: Number,
        default: 0
    },
    // Hidden hobbies stay in the owner's dashboard and are filtered out of the
    // public /public/interests response; nothing is deleted by hiding.
    visible: {
        type: Boolean,
        default: true
    },
    // Optional free-form tags for the public filter row, trimmed and de-duped
    // by the controller before they are stored.
    tags: {
        type: [String],
        default: []
    },
    // Public "since" year, shown on the public card when present.
    startedYear: {
        type: Number,
        min: [1900, 'Year looks too early'],
        max: [2100, 'Year looks too late']
    }
}, {
    timestamps: true
});

interestsSchema.index({ order: 1, createdAt: 1 });
interestsSchema.index({ category: 1 });
interestsSchema.index({ visible: 1 });

module.exports = mongoose.model('Interests', interestsSchema);