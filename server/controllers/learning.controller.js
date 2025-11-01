const Video = require('../models/LearningVideo');
const Tutorial = require('../models/Tutorials');
const FAQ = require('../models/FAQ');
const Community = require('../models/community');
const Progress = require('../models/LearningProgress');
const Bookmark = require('../models/Bookmark');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');

class LearningController {
    // Get learning videos
    async getLearningVideos(req, res) {
        try {
            const { category, difficulty, search, sortBy = 'createdAt', order = 'desc' } = req.query;

            const query = { isPublished: true };

            if (category && category !== 'all') {
                query.category = category;
            }

            if (difficulty && difficulty !== 'all') {
                query.difficulty = difficulty;
            }

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ];
            }

            const sortOptions = {};
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;

            const videos = await Video.find(query)
                .sort(sortOptions)
                .lean();

            res.json({
                success: true,
                data: videos
            });
        } catch (error) {
            console.error('Get videos error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch videos'
            });
        }
    }

    // Get single video
    async getVideo(req, res) {
        try {
            const { videoId } = req.params;

            const video = await Video.findById(videoId);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Increment view count
            video.views += 1;
            await video.save();

            // Get related videos
            const relatedVideos = await Video.find({
                _id: { $ne: videoId },
                category: video.category,
                isPublished: true
            })
                .limit(4)
                .lean();

            res.json({
                success: true,
                data: {
                    video,
                    relatedVideos
                }
            });
        } catch (error) {
            console.error('Get video error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch video'
            });
        }
    }

    // Get tutorials
    async getTutorials(req, res) {
        try {
            const { category, difficulty, search } = req.query;

            const query = { isPublished: true };

            if (category && category !== 'all') {
                query.category = category;
            }

            if (difficulty && difficulty !== 'all') {
                query.difficulty = difficulty;
            }

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const tutorials = await Tutorial.find(query)
                .sort({ order: 1, createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data: tutorials
            });
        } catch (error) {
            console.error('Get tutorials error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tutorials'
            });
        }
    }

    // Get single tutorial
    async getTutorial(req, res) {
        try {
            const { tutorialId } = req.params;

            const tutorial = await Tutorial.findById(tutorialId);

            if (!tutorial) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutorial not found'
                });
            }

            // Increment view count
            tutorial.views += 1;
            await tutorial.save();

            res.json({
                success: true,
                data: tutorial
            });
        } catch (error) {
            console.error('Get tutorial error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tutorial'
            });
        }
    }

    // Get FAQs
    async getFAQs(req, res) {
        try {
            const { category, search } = req.query;

            const query = { isPublished: true };

            if (category && category !== 'all') {
                query.category = category;
            }

            if (search) {
                query.$or = [
                    { question: { $regex: search, $options: 'i' } },
                    { answer: { $regex: search, $options: 'i' } }
                ];
            }

            const faqs = await FAQ.find(query)
                .sort({ order: 1, views: -1 })
                .lean();

            res.json({
                success: true,
                data: faqs
            });
        } catch (error) {
            console.error('Get FAQs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch FAQs'
            });
        }
    }

    // Get communities
    async getCommunities(req, res) {
        try {
            const communities = await Community.find({ isActive: true })
                .sort({ members: -1 })
                .lean();

            // Get active member count for each community
            const communitiesWithActive = await Promise.all(
                communities.map(async (community) => {
                    const activeNow = await this.getActiveMembersCount(community._id);
                    return {
                        ...community,
                        activeNow
                    };
                })
            );

            res.json({
                success: true,
                data: communitiesWithActive
            });
        } catch (error) {
            console.error('Get communities error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch communities'
            });
        }
    }

    // Get learning progress
    async getLearningProgress(req, res) {
        try {
            const userId = req.user.id;

            const progressRecords = await Progress.find({ userId }).lean();

            // Convert to object for easier lookup
            const progressMap = {};
            progressRecords.forEach(p => {
                progressMap[p.resourceId] = {
                    progress: p.progress,
                    completed: p.completed,
                    completedAt: p.completedAt,
                    lastAccessedAt: p.lastAccessedAt
                };
            });

            res.json({
                success: true,
                data: progressMap
            });
        } catch (error) {
            console.error('Get progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch progress'
            });
        }
    }

    // Update progress
    async updateProgress(req, res) {
        try {
            const userId = req.user.id;
            const { resourceId, progress, completed, type } = req.body;

            const progressRecord = await Progress.findOneAndUpdate(
                { userId, resourceId },
                {
                    userId,
                    resourceId,
                    type,
                    progress: progress || 0,
                    completed: completed || false,
                    completedAt: completed ? new Date() : null,
                    lastAccessedAt: new Date()
                },
                { upsert: true, new: true }
            );

            // Award points if completed
            if (completed && !progressRecord.pointsAwarded) {
                const points = type === 'video' ? 10 : 20;
                await this.awardPoints(userId, points, `Completed ${type}`);
                
                progressRecord.pointsAwarded = true;
                await progressRecord.save();

                // Check for achievements
                await this.checkAchievements(userId);
            }

            res.json({
                success: true,
                data: progressRecord
            });
        } catch (error) {
            console.error('Update progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update progress'
            });
        }
    }

    // Get bookmarks
    async getBookmarks(req, res) {
        try {
            const userId = req.user.id;

            const bookmarks = await Bookmark.find({ userId })
                .sort({ createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data: bookmarks
            });
        } catch (error) {
            console.error('Get bookmarks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bookmarks'
            });
        }
    }

    // Add bookmark
    async addBookmark(req, res) {
        try {
            const userId = req.user.id;
            const { resourceId, type } = req.body;

            const existing = await Bookmark.findOne({ userId, resourceId });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Already bookmarked'
                });
            }

            const bookmark = await Bookmark.create({
                userId,
                resourceId,
                type
            });

            res.json({
                success: true,
                data: bookmark
            });
        } catch (error) {
            console.error('Add bookmark error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add bookmark'
            });
        }
    }

    // Remove bookmark
    async removeBookmark(req, res) {
        try {
            const userId = req.user.id;
            const { resourceId } = req.params;

            await Bookmark.findOneAndDelete({ userId, resourceId });

            res.json({
                success: true,
                message: 'Bookmark removed'
            });
        } catch (error) {
            console.error('Remove bookmark error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove bookmark'
            });
        }
    }

    // Get achievements
    async getAchievements(req, res) {
        try {
            const userId = req.user.id;

            const userAchievements = await UserAchievement.find({ userId })
                .populate('achievementId')
                .lean();

            const achievements = userAchievements.map(ua => ({
                ...ua.achievementId,
                earnedAt: ua.earnedAt
            }));

            res.json({
                success: true,
                data: achievements
            });
        } catch (error) {
            console.error('Get achievements error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements'
            });
        }
    }

    // Get learning stats
    async getLearningStats(req, res) {
        try {
            const userId = req.user.id;

            const [videosProgress, tutorialsProgress, totalPoints, certificates] = await Promise.all([
                Progress.countDocuments({ userId, type: 'video', completed: true }),
                Progress.countDocuments({ userId, type: 'tutorial', completed: true }),
                this.getTotalPoints(userId),
                UserAchievement.countDocuments({ userId, 'achievementId.type': 'certificate' })
            ]);

            res.json({
                success: true,
                data: {
                    videosWatched: videosProgress,
                    tutorialsCompleted: tutorialsProgress,
                    totalPoints,
                    certificatesEarned: certificates
                }
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stats'
            });
        }
    }

    // Add comment
    async addComment(req, res) {
        try {
            const userId = req.user.id;
            const { resourceId, type, content } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Comment content is required'
                });
            }

            const comment = await Comment.create({
                userId,
                resourceId,
                type,
                content: content.trim()
            });

            const populatedComment = await Comment.findById(comment._id)
                .populate('userId', 'name avatar')
                .lean();

            res.json({
                success: true,
                data: populatedComment
            });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add comment'
            });
        }
    }

    // Get comments
    async getComments(req, res) {
        try {
            const { resourceId } = req.params;
            const { limit = 20, page = 1 } = req.query;

            const comments = await Comment.find({ resourceId })
                .populate('userId', 'name avatar')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .lean();

            const total = await Comment.countDocuments({ resourceId });

            res.json({
                success: true,
                data: {
                    comments,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch comments'
            });
        }
    }

    // Rate resource
    async rateResource(req, res) {
        try {
            const userId = req.user.id;
            const { resourceId, rating } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            await Rating.findOneAndUpdate(
                { userId, resourceId },
                { userId, resourceId, rating },
                { upsert: true }
            );

            // Update average rating
            await this.updateAverageRating(resourceId);

            res.json({
                success: true,
                message: 'Rating submitted successfully'
            });
        } catch (error) {
            console.error('Rate resource error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit rating'
            });
        }
    }

    // Helper methods
    async getActiveMembersCount(communityId) {
        // Get members active in last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        // This would integrate with your user activity tracking system
        return Math.floor(Math.random() * 50) + 10; // Placeholder
    }

    async awardPoints(userId, points, reason) {
        const User = require('../models/User.model');
        await User.findByIdAndUpdate(userId, {
            $inc: { learningPoints: points }
        });

        // Log points transaction
        const PointsTransaction = require('../models/PointsTransaction');
        await PointsTransaction.create({
            userId,
            points,
            reason,
            type: 'earned'
        });
    }

    async getTotalPoints(userId) {
        const User = require('../models/User.model');
        const user = await User.findById(userId);
        return user?.learningPoints || 0;
    }

    async checkAchievements(userId) {
        const [videosCompleted, tutorialsCompleted, totalPoints] = await Promise.all([
            Progress.countDocuments({ userId, type: 'video', completed: true }),
            Progress.countDocuments({ userId, type: 'tutorial', completed: true }),
            this.getTotalPoints(userId)
        ]);

        const achievements = await Achievement.find();

        for (const achievement of achievements) {
            const hasAchievement = await UserAchievement.findOne({
                userId,
                achievementId: achievement._id
            });

            if (!hasAchievement) {
                let earned = false;

                // Check achievement criteria
                switch (achievement.criteria.type) {
                    case 'videos_completed':
                        earned = videosCompleted >= achievement.criteria.target;
                        break;
                    case 'tutorials_completed':
                        earned = tutorialsCompleted >= achievement.criteria.target;
                        break;
                    case 'total_points':
                        earned = totalPoints >= achievement.criteria.target;
                        break;
                }

                if (earned) {
                    await UserAchievement.create({
                        userId,
                        achievementId: achievement._id
                    });

                    // Award achievement points
                    await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`);
                }
            }
        }
    }

    async updateAverageRating(resourceId) {
        const ratings = await Rating.find({ resourceId });
        
        if (ratings.length === 0) return;

        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        // Determine resource type and update
        const video = await Video.findById(resourceId);
        const tutorial = await Tutorial.findById(resourceId);
        const faq = await FAQ.findById(resourceId);

        if (video) {
            video.averageRating = average;
            video.ratingsCount = ratings.length;
            await video.save();
        } else if (tutorial) {
            tutorial.averageRating = average;
            tutorial.ratingsCount = ratings.length;
            await tutorial.save();
        } else if (faq) {
            faq.averageRating = average;
            faq.ratingsCount = ratings.length;
            await faq.save();
        }
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

module.exports = new LearningController();