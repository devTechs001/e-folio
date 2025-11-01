const mongoose = require('mongoose');

const portfolioConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    config: {
        sections: [{
            id: String,
            name: String,
            type: String,
            visible: Boolean,
            locked: Boolean,
            settings: mongoose.Schema.Types.Mixed,
            content: {
                title: String,
                description: String,
                data: mongoose.Schema.Types.Mixed
            }
        }],
        theme: {
            primaryColor: String,
            secondaryColor: String,
            backgroundColor: String,
            textColor: String,
            fontFamily: String,
            headingFont: String
        },
        seo: {
            title: String,
            description: String,
            keywords: [String],
            ogImage: String
        },
        settings: {
            animations: Boolean,
            smoothScroll: Boolean,
            darkMode: Boolean,
            showSocialLinks: Boolean
        }
    },
    version: {
        type: Number,
        default: 1
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,
    lastEditedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

portfolioConfigSchema.index({ userId: 1 });
portfolioConfigSchema.index({ isPublished: 1 });

module.exports = mongoose.model('PortfolioConfig', portfolioConfigSchema);