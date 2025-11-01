const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: String,
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventData: mongoose.Schema.Types.Mixed,
  page: String,
  device: String,
  location: {
    city: String,
    country: String
  },
  ip: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

eventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('Event', eventSchema);