const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioEditor.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');

// Apply authentication and ownership verification middleware for all portfolio routes
router.use(auth);
router.use(isOwner);

// Portfolio configuration routes
router.get('/config', portfolioController.getPortfolioConfig);
router.post('/config', portfolioController.savePortfolioConfig);

// Portfolio versions routes
router.get('/versions', portfolioController.getPortfolioVersions);
router.post('/versions/:versionId/restore', portfolioController.restorePortfolioVersion);

// Portfolio templates routes
router.get('/templates', portfolioController.getTemplates);
router.get('/templates/custom', portfolioController.getCustomTemplates);
router.post('/templates', portfolioController.applyTemplate);
router.post('/templates/custom', portfolioController.saveCustomTemplate);

// Portfolio publishing routes
router.post('/publish', portfolioController.publishPortfolio);
router.post('/unpublish', portfolioController.unpublishPortfolio);

// Portfolio duplication
router.post('/duplicate', portfolioController.duplicatePortfolio);

module.exports = router;