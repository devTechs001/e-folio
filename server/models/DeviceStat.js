// server/models/DeviceStat.js
const mongoose = require('mongoose');

const deviceStatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    desktop: {
        type: Number,
        default: 0
    },
    mobile: {
        type: Number,
        default: 0
    },
    tablet: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

deviceStatSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DeviceStat', deviceStatSchema);