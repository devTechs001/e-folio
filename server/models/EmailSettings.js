// models/EmailSettings.js
const mongoose = require('mongoose');

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

module.exports = mongoose.models.EmailSettings || mongoose.model('EmailSettings', emailSettingsSchema);

