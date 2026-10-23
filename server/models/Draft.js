// models/Draft.js
const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: String,
    cc: String,
    bcc: String,
    subject: String,
    body: String,
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    attachments: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }]
}, {
    timestamps: true
});

draftSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.models.Draft || mongoose.model('Draft', draftSchema);

