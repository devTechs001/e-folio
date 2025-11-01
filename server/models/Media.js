const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    path: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: String,
    type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'archive', 'other'],
        required: true,
        index: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        format: String,
        optimized: Boolean
    },
    tags: [String],
    description: String,
    
    // Share settings
    shareSettings: {
        isShared: {
            type: Boolean,
            default: false
        },
        shareToken: String,
        expiresAt: Date,
        password: String,
        allowDownload: {
            type: Boolean,
            default: true
        }
    },
    
    // Stats
    views: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    },
    
    uploadedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes
mediaSchema.index({ userId: 1, createdAt: -1 });
mediaSchema.index({ userId: 1, type: 1 });
mediaSchema.index({ userId: 1, folderId: 1 });
mediaSchema.index({ 'shareSettings.shareToken': 1 });

// Virtual for file extension
mediaSchema.virtual('extension').get(function() {
    return path.extname(this.name);
});

module.exports = mongoose.model('Media', mediaSchema);