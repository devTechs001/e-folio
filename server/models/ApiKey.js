const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'delete', 'admin']
    }],
    lastUsed: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: Date,
    deletedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ key: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);