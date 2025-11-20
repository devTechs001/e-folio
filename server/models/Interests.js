// models/Interests.js
const mongoose = require('mongoose');

const interestsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Interest name is required'],
        trim: true,
        maxlength: [100, 'Interest name cannot be more than 100 characters']
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category cannot be more than 50 characters']
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    description: {
        type: String,
        maxlength: [300, 'Description cannot be more than 300 characters'],
        trim: true
    },
    icon: {
        type: String,
        trim: true,
        maxlength: [50, 'Icon name cannot be more than 50 characters']
    },
    color: {
        type: String,
        trim: true,
        maxlength: [20, 'Color cannot be more than 20 characters']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Interests', interestsSchema);