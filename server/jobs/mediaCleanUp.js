const cron = require('node-cron');
const Media = require('../models/Media');
const fs = require('fs').promises;

// Clean up orphaned files (files without database records)
const cleanupOrphanedFiles = async () => {
    console.log('Starting orphaned files cleanup...');
    
    const uploadDir = path.join(__dirname, '../uploads/media');
    const files = await fs.readdir(uploadDir);
    
    for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const dbFile = await Media.findOne({ path: filePath });
        
        if (!dbFile) {
            await fs.unlink(filePath);
            console.log(`Deleted orphaned file: ${file}`);
        }
    }
    
    console.log('Orphaned files cleanup completed');
};

// Clean up expired shares
const cleanupExpiredShares = async () => {
    console.log('Starting expired shares cleanup...');
    
    await Media.updateMany(
        {
            'shareSettings.expiresAt': { $lt: new Date() },
            'shareSettings.isShared': true
        },
        {
            $set: {
                'shareSettings.isShared': false,
                'shareSettings.shareToken': null
            }
        }
    );
    
    console.log('Expired shares cleanup completed');
};

// Schedule cleanup jobs
const scheduleCleanupJobs = () => {
    // Run orphaned files cleanup daily at 2 AM
    cron.schedule('0 2 * * *', cleanupOrphanedFiles);
    
    // Run expired shares cleanup hourly
    cron.schedule('0 * * * *', cleanupExpiredShares);
};

module.exports = {
    scheduleCleanupJobs,
    cleanupOrphanedFiles,
    cleanupExpiredShares
};