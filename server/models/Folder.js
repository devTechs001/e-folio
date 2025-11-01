const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#06b6d4'
    },
    fileCount: {
        type: Number,
        default: 0
    },
    description: String
}, {
    timestamps: true
});

// Indexes
folderSchema.index({ userId: 1, parentId: 1 });
folderSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.models.Folder || mongoose.model('Folder', folderSchema);