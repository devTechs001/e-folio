const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    allowRegistration: {
        type: Boolean,
        default: true
    },
    maintenanceMessage: {
        type: String,
        default: 'We are currently under maintenance. Please check back later.'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
