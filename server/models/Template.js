// models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    subject: String,
    body: String
}, {
    timestamps: true
});

templateSchema.index({ user: 1, name: 1 });

module.exports = mongoose.models.Template || mongoose.model('Template', templateSchema);

