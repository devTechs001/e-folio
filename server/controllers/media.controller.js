const Media = require('../models/Media');
const Folder = require('../models/Folder');
const User = require('../models/User.model');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const archiver = require('archiver');

class MediaController {
    // Get all media files
    async getMediaFiles(req, res) {
        try {
            const userId = req.user.id;
            const { folderId, type, search, sortBy = 'createdAt', order = 'desc' } = req.query;

            const query = { userId };
            
            if (folderId) {
                query.folderId = folderId;
            }
            
            if (type && type !== 'all') {
                query.type = type;
            }
            
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            const sortOptions = {};
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;

            const files = await Media.find(query)
                .sort(sortOptions)
                .populate('folderId', 'name color')
                .lean();

            res.json({
                success: true,
                data: files
            });
        } catch (error) {
            console.error('Get media files error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch media files'
            });
        }
    }

    // Upload file
    async uploadFile(req, res) {
        try {
            const userId = req.user.id;
            const file = req.file;
            const { folderId } = req.body;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            // Check storage quota
            const storageInfo = await this.getStorageUsage(userId);
            const maxStorage = 10 * 1024 * 1024 * 1024; // 10GB
            
            if (storageInfo.used + file.size > maxStorage) {
                // Delete uploaded file
                await fs.unlink(file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Storage quota exceeded'
                });
            }

            // Determine file type
            const type = this.getFileType(file.mimetype);

            // Process file based on type
            let processedPath = file.path;
            let thumbnail = null;
            let metadata = {};

            if (type === 'image') {
                const result = await this.processImage(file.path, userId);
                processedPath = result.path;
                thumbnail = result.thumbnail;
                metadata = result.metadata;
            } else if (type === 'video') {
                thumbnail = await this.generateVideoThumbnail(file.path, userId);
                metadata = await this.getVideoMetadata(file.path);
            }

            // Generate public URL
            const url = this.generatePublicUrl(processedPath);
            const thumbnailUrl = thumbnail ? this.generatePublicUrl(thumbnail) : null;

            // Create media record
            const media = await Media.create({
                userId,
                folderId: folderId || null,
                name: file.originalname,
                path: processedPath,
                url,
                thumbnail: thumbnailUrl,
                type,
                mimeType: file.mimetype,
                size: file.size,
                metadata
            });

            // Update folder file count
            if (folderId) {
                await Folder.findByIdAndUpdate(folderId, {
                    $inc: { fileCount: 1 }
                });
            }

            // Log activity
            await this.logActivity(userId, 'file_uploaded', {
                fileId: media._id,
                fileName: media.name,
                fileType: type
            });

            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: media
            });
        } catch (error) {
            console.error('Upload file error:', error);
            
            // Clean up file on error
            if (req.file && req.file.path) {
                try {
                    await fs.unlink(req.file.path);
                } catch (err) {
                    console.error('Failed to delete file:', err);
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to upload file'
            });
        }
    }

    // Delete files
    async deleteFiles(req, res) {
        try {
            const userId = req.user.id;
            const { fileIds } = req.body;

            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files specified'
                });
            }

            const files = await Media.find({
                _id: { $in: fileIds },
                userId
            });

            // Delete physical files
            for (const file of files) {
                try {
                    await fs.unlink(file.path);
                    if (file.thumbnail) {
                        await fs.unlink(file.thumbnail.replace('/uploads/', ''));
                    }
                } catch (err) {
                    console.error('Failed to delete file:', err);
                }

                // Update folder count
                if (file.folderId) {
                    await Folder.findByIdAndUpdate(file.folderId, {
                        $inc: { fileCount: -1 }
                    });
                }
            }

            // Delete records
            await Media.deleteMany({
                _id: { $in: fileIds },
                userId
            });

            // Log activity
            await this.logActivity(userId, 'files_deleted', {
                count: fileIds.length
            });

            res.json({
                success: true,
                message: `${fileIds.length} file(s) deleted successfully`
            });
        } catch (error) {
            console.error('Delete files error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete files'
            });
        }
    }

    // Download file
    async downloadFile(req, res) {
        try {
            const userId = req.user.id;
            const { fileId } = req.params;

            const file = await Media.findOne({
                _id: fileId,
                userId
            });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }

            // Check if file exists
            try {
                await fs.access(file.path);
            } catch (err) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on disk'
                });
            }

            // Update download count
            await Media.findByIdAndUpdate(fileId, {
                $inc: { downloads: 1 }
            });

            res.download(file.path, file.name);
        } catch (error) {
            console.error('Download file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to download file'
            });
        }
    }

    // Rename file
    async renameFile(req, res) {
        try {
            const userId = req.user.id;
            const { fileId } = req.params;
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required'
                });
            }

            const file = await Media.findOneAndUpdate(
                { _id: fileId, userId },
                { name: name.trim() },
                { new: true }
            );

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }

            res.json({
                success: true,
                message: 'File renamed successfully',
                data: file
            });
        } catch (error) {
            console.error('Rename file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to rename file'
            });
        }
    }

    // Move files to folder
    async moveFiles(req, res) {
        try {
            const userId = req.user.id;
            const { fileIds, folderId } = req.body;

            // Validate folder exists if provided
            if (folderId) {
                const folder = await Folder.findOne({ _id: folderId, userId });
                if (!folder) {
                    return res.status(404).json({
                        success: false,
                        message: 'Folder not found'
                    });
                }
            }

            // Get old folder IDs for count update
            const files = await Media.find({
                _id: { $in: fileIds },
                userId
            });

            const oldFolderIds = [...new Set(files.map(f => f.folderId).filter(Boolean))];

            // Update files
            await Media.updateMany(
                { _id: { $in: fileIds }, userId },
                { folderId: folderId || null }
            );

            // Update folder counts
            for (const oldFolderId of oldFolderIds) {
                const count = files.filter(f => f.folderId?.toString() === oldFolderId.toString()).length;
                await Folder.findByIdAndUpdate(oldFolderId, {
                    $inc: { fileCount: -count }
                });
            }

            if (folderId) {
                await Folder.findByIdAndUpdate(folderId, {
                    $inc: { fileCount: fileIds.length }
                });
            }

            res.json({
                success: true,
                message: 'Files moved successfully'
            });
        } catch (error) {
            console.error('Move files error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to move files'
            });
        }
    }

    // Get folders
    async getFolders(req, res) {
        try {
            const userId = req.user.id;
            const { parentId } = req.query;

            const query = { userId };
            if (parentId) {
                query.parentId = parentId;
            }

            const folders = await Folder.find(query)
                .sort({ createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data: folders
            });
        } catch (error) {
            console.error('Get folders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch folders'
            });
        }
    }

    // Create folder
    async createFolder(req, res) {
        try {
            const userId = req.user.id;
            const { name, color, parentId } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Folder name is required'
                });
            }

            // Check if folder with same name exists
            const existing = await Folder.findOne({
                userId,
                name: name.trim(),
                parentId: parentId || null
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Folder with this name already exists'
                });
            }

            const folder = await Folder.create({
                userId,
                name: name.trim(),
                color: color || '#06b6d4',
                parentId: parentId || null
            });

            res.json({
                success: true,
                message: 'Folder created successfully',
                data: folder
            });
        } catch (error) {
            console.error('Create folder error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create folder'
            });
        }
    }

    // Delete folder
    async deleteFolder(req, res) {
        try {
            const userId = req.user.id;
            const { folderId } = req.params;
            const { deleteFiles } = req.body;

            const folder = await Folder.findOne({ _id: folderId, userId });
            
            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }

            if (deleteFiles) {
                // Delete all files in folder
                const files = await Media.find({ folderId, userId });
                
                for (const file of files) {
                    try {
                        await fs.unlink(file.path);
                        if (file.thumbnail) {
                            await fs.unlink(file.thumbnail.replace('/uploads/', ''));
                        }
                    } catch (err) {
                        console.error('Failed to delete file:', err);
                    }
                }

                await Media.deleteMany({ folderId, userId });
            } else {
                // Move files to root
                await Media.updateMany(
                    { folderId, userId },
                    { folderId: null }
                );
            }

            await Folder.findByIdAndDelete(folderId);

            res.json({
                success: true,
                message: 'Folder deleted successfully'
            });
        } catch (error) {
            console.error('Delete folder error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete folder'
            });
        }
    }

    // Get storage info
    async getStorageInfo(req, res) {
        try {
            const userId = req.user.id;
            const storageInfo = await this.getStorageUsage(userId);

            res.json({
                success: true,
                data: storageInfo
            });
        } catch (error) {
            console.error('Get storage info error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch storage info'
            });
        }
    }

    // Share file
    async shareFile(req, res) {
        try {
            const userId = req.user.id;
            const { fileId } = req.params;
            const { expiresIn, password, allowDownload } = req.body;

            const file = await Media.findOne({ _id: fileId, userId });
            
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }

            // Generate share token
            const shareToken = this.generateShareToken();
            const expiresAt = expiresIn 
                ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
                : null;

            file.shareSettings = {
                isShared: true,
                shareToken,
                expiresAt,
                password: password ? await bcrypt.hash(password, 10) : null,
                allowDownload: allowDownload !== false
            };

            await file.save();

            const shareUrl = `${process.env.APP_URL}/share/${shareToken}`;

            res.json({
                success: true,
                message: 'File shared successfully',
                data: {
                    shareUrl,
                    expiresAt
                }
            });
        } catch (error) {
            console.error('Share file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to share file'
            });
        }
    }

    // Optimize images
    async optimizeImages(req, res) {
        try {
            const userId = req.user.id;
            const { fileIds } = req.body;

            const files = await Media.find({
                _id: { $in: fileIds },
                userId,
                type: 'image'
            });

            let totalSaved = 0;

            for (const file of files) {
                const originalSize = file.size;
                const optimized = await this.optimizeImage(file.path);
                
                if (optimized.saved > 0) {
                    file.size = optimized.newSize;
                    file.metadata.optimized = true;
                    await file.save();
                    totalSaved += optimized.saved;
                }
            }

            res.json({
                success: true,
                message: 'Images optimized successfully',
                data: {
                    filesOptimized: files.length,
                    spaceSaved: totalSaved
                }
            });
        } catch (error) {
            console.error('Optimize images error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to optimize images'
            });
        }
    }

    // Helper methods
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf')) return 'document';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'document';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
        return 'other';
    }

    async processImage(filePath, userId) {
        const ext = path.extname(filePath);
        const filename = path.basename(filePath, ext);
        const outputPath = path.join(
            path.dirname(filePath),
            `${filename}_processed${ext}`
        );
        const thumbnailPath = path.join(
            path.dirname(filePath),
            `${filename}_thumb.jpg`
        );

        // Optimize and resize image
        const metadata = await sharp(filePath).metadata();
        
        await sharp(filePath)
            .resize(2000, 2000, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);

        // Generate thumbnail
        await sharp(filePath)
            .resize(300, 300, {
                fit: 'cover'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        // Delete original
        await fs.unlink(filePath);

        return {
            path: outputPath,
            thumbnail: thumbnailPath,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            }
        };
    }

    async generateVideoThumbnail(videoPath, userId) {
        return new Promise((resolve, reject) => {
            const thumbnailPath = path.join(
                path.dirname(videoPath),
                `${path.basename(videoPath, path.extname(videoPath))}_thumb.jpg`
            );

            ffmpeg(videoPath)
                .screenshots({
                    count: 1,
                    folder: path.dirname(videoPath),
                    filename: path.basename(thumbnailPath),
                    size: '300x?'
                })
                .on('end', () => resolve(thumbnailPath))
                .on('error', reject);
        });
    }

    async getVideoMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else resolve({
                    duration: metadata.format.duration,
                    bitrate: metadata.format.bit_rate,
                    width: metadata.streams[0].width,
                    height: metadata.streams[0].height
                });
            });
        });
    }

    async optimizeImage(imagePath) {
        const stats = await fs.stat(imagePath);
        const originalSize = stats.size;

        const tempPath = imagePath + '.tmp';
        
        await sharp(imagePath)
            .jpeg({ quality: 80, progressive: true })
            .toFile(tempPath);

        const newStats = await fs.stat(tempPath);
        const newSize = newStats.size;

        if (newSize < originalSize) {
            await fs.unlink(imagePath);
            await fs.rename(tempPath, imagePath);
            
            return {
                saved: originalSize - newSize,
                newSize
            };
        } else {
            await fs.unlink(tempPath);
            return {
                saved: 0,
                newSize: originalSize
            };
        }
    }

    generatePublicUrl(filePath) {
        return filePath.replace(/\\/g, '/').replace(/^.*uploads/, '/uploads');
    }

    generateShareToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    async getStorageUsage(userId) {
        const result = await Media.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: '$size' },
                    totalFiles: { $sum: 1 }
                }
            }
        ]);

        const used = result[0] ? result[0].totalSize : 0;
        const files = result[0] ? result[0].totalFiles : 0;

        return {
            used: Math.round(used / (1024 * 1024)), // Convert to MB
            total: 10 * 1024, // 10GB in MB
            files
        };
    }

    async logActivity(userId, action, metadata = {}) {
        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            userId,
            action,
            metadata,
            timestamp: new Date()
        });
    }
}

module.exports = new MediaController();