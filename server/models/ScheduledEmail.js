// models/ScheduledEmail.js
const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: String,
        required: true
    },
    cc: String,
    bcc: String,
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    priority: String,
    attachments: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }],
    scheduledFor: {
        type: Date,
        required: true
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: Date
}, {
    timestamps: true
});

scheduledEmailSchema.index({ user: 1, scheduledFor: 1, sent: 1 });

module.exports = mongoose.models.ScheduledEmail || mongoose.model('ScheduledEmail', scheduledEmailSchema);

