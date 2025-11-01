const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  events: {
    type: Map,
    of: Number,
    default: {}
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

analyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);