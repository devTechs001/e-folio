// models/Education.js
const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
    institution: {
        type: String,
        required: [true, 'Institution is required'],
        trim: true,
        maxlength: [100, 'Institution cannot be more than 100 characters']
    },
    degree: {
        type: String,
        required: [true, 'Degree is required'],
        trim: true,
        maxlength: [100, 'Degree cannot be more than 100 characters']
    },
    fieldOfStudy: {
        type: String,
        required: [true, 'Field of study is required'],
        trim: true,
        maxlength: [100, 'Field of study cannot be more than 100 characters']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters'],
        trim: true
    },
    grade: {
        type: String,
        trim: true,
        maxlength: [20, 'Grade cannot be more than 20 characters']
    },
    currentlyStudying: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot be more than 100 characters']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Education', educationSchema);