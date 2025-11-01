const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Get file icon color based on type
const getFileIconColor = (type) => {
    const colors = {
        image: '#3b82f6',
        video: '#a855f7',
        audio: '#10b981',
        document: '#ef4444',
        archive: '#f59e0b',
        other: '#64748b'
    };
    return colors[type] || colors.other;
};

// Format bytes to human readable
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Validate file type
const isValidFileType = (filename, allowedTypes = []) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}-${timestamp}-${random}${ext}`;
};

// Create thumbnail
const createThumbnail = async (imagePath, thumbnailPath, size = 300) => {
    await sharp(imagePath)
        .resize(size, size, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    
    return thumbnailPath;
};

// Get image dimensions
const getImageDimensions = async (imagePath) => {
    const metadata = await sharp(imagePath).metadata();
    return {
        width: metadata.width,
        height: metadata.height
    };
};

// Compress image
const compressImage = async (inputPath, outputPath, quality = 85) => {
    await sharp(inputPath)
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
};

// Calculate folder size
const calculateFolderSize = async (folderPath) => {
    let totalSize = 0;
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
            totalSize += await calculateFolderSize(filePath);
        } else {
            totalSize += stats.size;
        }
    }
    
    return totalSize;
};

// Clean up old files
const cleanupOldFiles = async (directory, daysOld = 30) => {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
        }
    }
};

module.exports = {
    getFileIconColor,
    formatBytes,
    isValidFileType,
    generateUniqueFilename,
    createThumbnail,
    getImageDimensions,
    compressImage,
    calculateFolderSize,
    cleanupOldFiles
};