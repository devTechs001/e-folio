const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: String
}, {
    timestamps: true
});

ratingSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);