const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const { auth, isAuthorized } = require('../middleware/auth.middleware');

router.use(auth);
router.use(isAuthorized);

router.get('/', cvController.getCV);
router.post('/', cvController.saveCV);
router.post('/versions', cvController.createVersion);
router.get('/versions', cvController.getVersions);
router.post('/versions/:versionId/restore', cvController.restoreVersion);
router.delete('/versions/:versionId', cvController.deleteVersion);
router.get('/export/:format', cvController.exportCV);

module.exports = router;
