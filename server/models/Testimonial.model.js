const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true,
        maxlength: [100, 'Position cannot exceed 100 characters']
    },
    company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    avatar: {
        type: String,
        trim: true,
        default: function() {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff&size=200`;
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    website: {
        type: String,
        trim: true
    },
    linkedin: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        default: 5
    },
    content: {
        type: String,
        required: [true, 'Testimonial content is required'],
        trim: true,
        minlength: [10, 'Content must be at least 10 characters'],
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    },
    project: {
        type: String,
        trim: true,
        maxlength: [200, 'Project name cannot exceed 200 characters']
    },
    tags: [{
        type: String,
        trim: true
    }],
    featured: {
        type: Boolean,
        default: false
    },
    visible: {
        type: Boolean,
        default: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    // Metadata
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    source: {
        type: String,
        enum: ['manual', 'form', 'import', 'api'],
        default: 'manual'
    },
    // Analytics
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
testimonialSchema.index({ featured: 1, visible: 1, date: -1 });
testimonialSchema.index({ rating: -1, date: -1 });
testimonialSchema.index({ name: 'text', content: 'text', company: 'text' });
testimonialSchema.index({ displayOrder: 1 });
testimonialSchema.index({ createdAt: -1 });

// Virtual for time ago
testimonialSchema.virtual('timeAgo').get(function() {
    const seconds = Math.floor((new Date() - this.date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
});

// Pre-save middleware
testimonialSchema.pre('save', function(next) {
    // Sanitize content
    if (this.isModified('content')) {
        this.content = this.content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    }

    // Set default avatar if not provided
    if (!this.avatar || this.avatar === '') {
        this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff&size=200`;
    }

    next();
});

// Static method to get statistics
testimonialSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $facet: {
                total: [{ $count: 'count' }],
                visible: [
                    { $match: { visible: true } },
                    { $count: 'count' }
                ],
                featured: [
                    { $match: { featured: true } },
                    { $count: 'count' }
                ],
                verified: [
                    { $match: { verified: true } },
                    { $count: 'count' }
                ],
                averageRating: [
                    { $group: { _id: null, avg: { $avg: '$rating' } } }
                ],
                ratingDistribution: [
                    { $group: { _id: '$rating', count: { $sum: 1 } } },
                    { $sort: { _id: -1 } }
                ],
                recentCount: [
                    {
                        $match: {
                            createdAt: {
                                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        }
                    },
                    { $count: 'count' }
                ],
                topRated: [
                    { $match: { rating: 5, visible: true } },
                    { $sort: { date: -1 } },
                    { $limit: 5 },
                    { $project: { name: 1, company: 1, rating: 1, date: 1 } }
                ],
                recentSubmissions: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 10 },
                    { $project: { name: 1, company: 1, rating: 1, visible: 1, featured: 1, createdAt: 1 } }
                ]
            }
        }
    ]);

    return {
        total: stats[0].total[0]?.count || 0,
        visible: stats[0].visible[0]?.count || 0,
        featured: stats[0].featured[0]?.count || 0,
        verified: stats[0].verified[0]?.count || 0,
        averageRating: stats[0].averageRating[0]?.avg || 0,
        ratingDistribution: stats[0].ratingDistribution || [],
        recentCount: stats[0].recentCount[0]?.count || 0,
        topRatedTestimonials: stats[0].topRated || [],
        recentSubmissions: stats[0].recentSubmissions || []
    };
};

// Instance methods
testimonialSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
};

testimonialSchema.methods.incrementClicks = async function() {
    this.clicks += 1;
    await this.save();
};

module.exports = mongoose.model('Testimonial', testimonialSchema);