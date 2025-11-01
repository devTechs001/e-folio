const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  page: {
    type: String,
    required: true,
    index: true
  },
  referrer: String,
  source: String,
  userAgent: String,
  device: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
    default: 'Unknown'
  },
  ip: String,
  location: {
    city: String,
    country: String,
    countryCode: String,
    latitude: Number,
    longitude: Number
  },
  timeOnPage: Number,
  bounced: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for better query performance
pageViewSchema.index({ userId: 1, createdAt: -1 });
pageViewSchema.index({ sessionId: 1, createdAt: -1 });
pageViewSchema.index({ page: 1, createdAt: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);