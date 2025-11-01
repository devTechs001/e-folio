const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mediaController = require('../controllers/media.controller');
const { auth } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimitMiddleware');

// Configure multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/media');
        const fs = require('fs').promises;
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mp3|wav|pdf|doc|docx|xls|xlsx|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// Media file routes
router.get('/files', auth, mediaController.getMediaFiles.bind(mediaController));
router.post('/files/upload', auth, rateLimiter(30), upload.single('file'), mediaController.uploadFile.bind(mediaController));
router.delete('/files', auth, mediaController.deleteFiles.bind(mediaController));
router.get('/files/:fileId/download', auth, mediaController.downloadFile.bind(mediaController));
router.put('/files/:fileId/rename', auth, mediaController.renameFile.bind(mediaController));
router.put('/files/move', auth, mediaController.moveFiles.bind(mediaController));
router.post('/files/:fileId/share', auth, mediaController.shareFile.bind(mediaController));
router.post('/files/optimize', auth, mediaController.optimizeImages.bind(mediaController));

// Folder routes
router.get('/folders', auth, mediaController.getFolders.bind(mediaController));
router.post('/folders', auth, mediaController.createFolder.bind(mediaController));
router.delete('/folders/:folderId', auth, mediaController.deleteFolder.bind(mediaController));

// Storage info
router.get('/storage', auth, mediaController.getStorageInfo.bind(mediaController));

module.exports = router;