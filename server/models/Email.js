// models/Email.js
const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    senderName: String,
    recipient: {
        type: String,
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
    from: {
        name: String,
        email: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    starred: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    spam: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    folder: {
        type: String,
        default: 'inbox'
    },
    labels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label'
    }],
    attachments: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }],
    threadId: String,
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email'
    },
    forwardFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Email'
    }
}, {
    timestamps: true
});

// Indexes
emailSchema.index({ sender: 1, timestamp: -1 });
emailSchema.index({ recipient: 1, timestamp: -1 });
emailSchema.index({ subject: 'text', body: 'text' });
emailSchema.index({ threadId: 1, timestamp: 1 });

module.exports = mongoose.models.Email || mongoose.model('Email', emailSchema);
