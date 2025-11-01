// server/models/DashboardStats.js
const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalProjects: {
        type: Number,
        default: 0
    },
    totalVisitors: {
        type: Number,
        default: 0
    },
    collaborators: {
        type: Number,
        default: 0
    },
    messages: {
        type: Number,
        default: 0
    },
    growth: {
        projects: {
            type: Number,
            default: 0
        },
        visitors: {
            type: Number,
            default: 0
        },
        collaborators: {
            type: Number,
            default: 0
        },
        messages: {
            type: Number,
            default: 0
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update stats method
dashboardStatsSchema.methods.updateStats = async function(updates) {
    const oldStats = { ...this.toObject() };
    
    Object.keys(updates).forEach(key => {
        if (this[key] !== undefined) {
            this[key] = updates[key];
        }
    });

    // Calculate growth percentages
    if (oldStats.totalProjects > 0) {
        this.growth.projects = ((this.totalProjects - oldStats.totalProjects) / oldStats.totalProjects * 100).toFixed(2);
    }
    if (oldStats.totalVisitors > 0) {
        this.growth.visitors = ((this.totalVisitors - oldStats.totalVisitors) / oldStats.totalVisitors * 100).toFixed(2);
    }
    if (oldStats.collaborators > 0) {
        this.growth.collaborators = ((this.collaborators - oldStats.collaborators) / oldStats.collaborators * 100).toFixed(2);
    }
    if (oldStats.messages > 0) {
        this.growth.messages = ((this.messages - oldStats.messages) / oldStats.messages * 100).toFixed(2);
    }

    this.lastUpdated = new Date();
    await this.save();
};

module.exports = mongoose.model('DashboardStats', dashboardStatsSchema);