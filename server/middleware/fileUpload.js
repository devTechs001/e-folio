const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Virus scanning (optional)
const scanFile = async (filePath) => {
    // Integrate with virus scanning service like ClamAV
    // For now, just a placeholder
    return true;
};

// File validation middleware
const validateFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum allowed size'
        });
    }

    next();
};

// Generate secure filename
const generateSecureFilename = (originalname) => {
    const ext = path.extname(originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${hash}${ext}`;
};

module.exports = {
    validateFile,
    generateSecureFilename,
    scanFile
};