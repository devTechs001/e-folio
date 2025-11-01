const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    icon: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['learning', 'engagement', 'milestone'],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    criteria: {
        type: {
            type: String,
            enum: ['videos_completed', 'tutorials_completed', 'total_points', 'streak_days', 'community_participation'],
            required: true
        },
        target: {
            type: Number,
            required: true
        }
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Achievement', achievementSchema);