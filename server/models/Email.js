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

module.exports = mongoose.model('Email', emailSchema);

// models/Draft.js
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

module.exports = mongoose.model('Draft', draftSchema);

// models/Label.js
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

module.exports = mongoose.model('Label', labelSchema);

// models/Template.js
const templateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    subject: String,
    body: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);

// models/Folder.js
const folderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Folder', folderSchema);

// models/QuickResponse.js
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

module.exports = mongoose.model('QuickResponse', quickResponseSchema);

// models/ScheduledEmail.js
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

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);

// models/EmailSettings.js
const emailSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    signature: String,
    autoReply: {
        type: Boolean,
        default: false
    },
    autoReplyMessage: String,
    readReceipts: {
        type: Boolean,
        default: true
    },
    notifications: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailSettings', emailSettingsSchema);