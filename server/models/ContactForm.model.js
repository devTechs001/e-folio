// models/ContactForm.model.js
const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    budget: {
        type: String,
        enum: ['< $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000 - $50,000', '$50,000+'],
        default: null
    },
    serviceType: {
        type: String,
        enum: ['Web Development', 'Mobile App', 'E-commerce', 'CMS', 'Consulting', 'Other'],
        default: null
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'in-progress', 'completed', 'archived'],
        default: 'new',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    source: {
        type: String,
        enum: ['netlify-form', 'website', 'api', 'email', 'referral'],
        default: 'netlify-form'
    },
    ip: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    starred: {
        type: Boolean,
        default: false
    },
    notes: [{
        text: String,
        addedBy: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [{
        type: String,
        trim: true
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastContactedAt: Date,
    expectedCloseDate: Date,
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
contactFormSchema.index({ createdAt: -1 });
contactFormSchema.index({ status: 1, priority: 1 });
contactFormSchema.index({ email: 1 });
contactFormSchema.index({ read: 1, createdAt: -1 });

// Virtual for days since submission
contactFormSchema.virtual('daysSinceSubmission').get(function() {
    if (this.createdAt) {
        const diff = Date.now() - this.createdAt;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    return null;
});

// Static method to get statistics
contactFormSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {};
    stats.forEach(stat => {
        result[stat._id] = stat.count;
    });
    
    return {
        total: await this.countDocuments(),
        ...result,
        unread: await this.countDocuments({ read: false }),
        starred: await this.countDocuments({ starred: true })
    };
};

module.exports = mongoose.models.ContactForm || mongoose.model('ContactForm', contactFormSchema);
