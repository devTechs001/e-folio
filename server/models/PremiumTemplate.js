const mongoose = require('mongoose');

const premiumTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['portfolio', 'cv'], required: true },
  description: String,
  thumbnail: String,
  preview: String,
  isPremium: { type: Boolean, default: false },
  category: { type: String, default: 'general' },
  features: [String],
  colorScheme: {
    primary: String,
    secondary: String,
    accent: String,
    background: String,
    surface: String,
    text: String,
    textSecondary: String,
    border: String
  },
  layout: {
    sections: [String],
    style: { type: String, default: 'modern' },
    maxSections: Number
  },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

premiumTemplateSchema.index({ type: 1, isPremium: 1 });
premiumTemplateSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('PremiumTemplate', premiumTemplateSchema);
