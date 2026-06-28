const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioEditor.controller');
const { auth, isOwner } = require('../middleware/auth.middleware');

// Apply authentication and ownership verification middleware for all portfolio routes
router.use(auth);
router.use(isOwner);

// Portfolio configuration routes
router.get('/config', portfolioController.getPortfolioConfig.bind(portfolioController));
router.post('/config', portfolioController.savePortfolioConfig.bind(portfolioController));

// Portfolio versions routes
router.get('/versions', portfolioController.getPortfolioVersions.bind(portfolioController));
router.post('/versions/:versionId/restore', portfolioController.restorePortfolioVersion.bind(portfolioController));

// Portfolio templates routes
router.get('/templates', portfolioController.getTemplates.bind(portfolioController));
router.get('/templates/custom', portfolioController.getCustomTemplates.bind(portfolioController));
router.post('/templates', portfolioController.applyTemplate.bind(portfolioController));
router.post('/templates/custom', portfolioController.saveCustomTemplate.bind(portfolioController));

// Portfolio publishing routes
router.post('/publish', portfolioController.publishPortfolio.bind(portfolioController));
router.post('/unpublish', portfolioController.unpublishPortfolio.bind(portfolioController));

// Portfolio duplication
router.post('/duplicate', portfolioController.duplicatePortfolio.bind(portfolioController));

module.exports = router;