const mongoose = require('mongoose');

const portfolioVersionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [String],
    isAutoSave: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

portfolioVersionSchema.index({ userId: 1, createdAt: -1 });
portfolioVersionSchema.index({ userId: 1, version: 1 });

module.exports = mongoose.model('PortfolioVersion', portfolioVersionSchema);