const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isReturning: {
    type: Boolean,
    default: false
  },
  pageCount: {
    type: Number,
    default: 1
  },
  duration: Number,
  startTime: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  referrer: String,
  landingPage: String,
  exitPage: String,
  device: String,
  browser: String,
  os: String,
  location: {
    city: String,
    country: String,
    countryCode: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

visitSchema.index({ userId: 1, createdAt: -1 });
visitSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Visit', visitSchema);