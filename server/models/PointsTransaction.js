const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    points: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['earned', 'spent', 'bonus', 'penalty'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    relatedId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

pointsTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PointsTransaction', pointsTransactionSchema);