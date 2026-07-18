const express = require('express');
const router = express.Router();
const PremiumTemplate = require('../models/PremiumTemplate');
const User = require('../models/User.model');
const { auth } = require('../middleware/auth.middleware');

router.get('/', async (req, res) => {
  try {
    const { type, category } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    const templates = await PremiumTemplate.find(filter).sort({ isPremium: 1, downloads: -1 }).lean();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:type/:slug', async (req, res) => {
  try {
    const template = await PremiumTemplate.findOne({ type: req.params.type, slug: req.params.slug }).lean();
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    let isUnlocked = false;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        isUnlocked = !template.isPremium || user?.isPremium;
      } catch {}
    }
    res.json({ success: true, data: { ...template, isUnlocked } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
