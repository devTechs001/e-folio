// models/SessionReplay.js
const mongoose = require('mongoose');

const sessionReplaySchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    events: [{
        type: {
            type: String,
            enum: ['click', 'scroll', 'mousemove', 'input', 'navigate', 'resize'],
            required: true
        },
        timestamp: {
            type: Number,
            required: true
        },
        data: mongoose.Schema.Types.Mixed
    }],
    snapshots: [{
        timestamp: Number,
        html: String,
        viewport: {
            width: Number,
            height: Number
        }
    }],
    duration: Number,
    recordingStarted: Date,
    recordingEnded: Date,
    compressed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

sessionReplaySchema.index({ sessionId: 1, recordingStarted: -1 });

module.exports = mongoose.model('SessionReplay', sessionReplaySchema);