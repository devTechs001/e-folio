// models/Label.js
const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#3B82F6'
    }
}, {
    timestamps: true
});

labelSchema.index({ user: 1, name: 1 });

module.exports = mongoose.models.Label || mongoose.model('Label', labelSchema);

