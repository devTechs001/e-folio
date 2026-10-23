// models/QuickResponse.js
const mongoose = require('mongoose');

const quickResponseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

quickResponseSchema.index({ user: 1 });

module.exports = mongoose.models.QuickResponse || mongoose.model('QuickResponse', quickResponseSchema);

