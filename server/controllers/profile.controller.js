const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Analytics = require('../models/Analytics');
const ActivityLog = require('../models/ActivityLog');
const Skill = require('../models/Skill.model');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class ProfileController {
    // Get profile data
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId)
                .select('-password -twoFactorSecret -twoFactorBackupCodes')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    }

    // Update profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const profile = JSON.parse(req.body.profile || '{}');

            // Handle avatar upload
            let avatarUrl = null;
            if (req.file) {
                avatarUrl = await this.processAvatar(req.file, userId);
            }

            // Validate username uniqueness
            if (profile.username) {
                const existingUser = await User.findOne({
                    username: profile.username,
                    _id: { $ne: userId }
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
            }

            // Validate email uniqueness
            if (profile.email) {
                const existingEmail = await User.findOne({
                    email: profile.email,
                    _id: { $ne: userId }
                });

                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            const updateData = {
                name: profile.name,
                username: profile.username,
                email: profile.email,
                bio: profile.bio,
                location: profile.location,
                role: profile.role,
                company: profile.company,
                website: profile.website,
                phone: profile.phone,
                socialLinks: profile.socialLinks,
                preferences: profile.preferences,
                updatedAt: new Date()
            };

            if (avatarUrl) {
                // Delete old avatar
                const oldUser = await User.findById(userId);
                if (oldUser.avatar && oldUser.avatar.startsWith('/uploads')) {
                    await this.deleteFile(oldUser.avatar);
                }
                updateData.avatar = avatarUrl;
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password -twoFactorSecret -twoFactorBackupCodes');

            // Log activity
            await ActivityLog.create({
                userId,
                action: 'profile_updated',
                metadata: {
                    fields: Object.keys(profile),
                    hasAvatar: !!avatarUrl
                }
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }

    // Get profile stats
    async getProfileStats(req, res) {
        try {
            const userId = req.user.id;

            const [
                projects,
                analytics,
                collaborations,
                messages,
                performanceData
            ] = await Promise.all([
                Project.countDocuments({ userId }),
                this.getAnalyticsSummary(userId),
                this.getCollaboratorsCount(userId),
                this.getMessagesCount(userId),
                this.getPerformanceData(userId)
            ]);

            const stats = {
                totalProjects: projects,
                totalViews: analytics.totalViews,
                collaborators: collaborations,
                messages: messages,
                isPremium: req.user.isPremium || false,
                performanceData
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stats'
            });
        }
    }

    // Get recent activity
    async getRecentActivity(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;

            const activities = await ActivityLog.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();

            const formattedActivities = activities.map(activity => ({
                id: activity._id,
                title: this.getActivityTitle(activity.action),
                description: this.getActivityDescription(activity),
                timestamp: this.getTimeAgo(activity.timestamp),
                color: this.getActivityColor(activity.action),
                icon: this.getActivityIcon(activity.action)
            }));

            res.json({
                success: true,
                data: formattedActivities
            });
        } catch (error) {
            console.error('Get activity error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch activity'
            });
        }
    }

    // Get top projects
    async getTopProjects(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 4;

            const projects = await Project.find({ userId })
                .sort({ views: -1, likes: -1 })
                .limit(limit)
                .select('title description views likes tags thumbnail')
                .lean();

            res.json({
                success: true,
                data: projects
            });
        } catch (error) {
            console.error('Get projects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch projects'
            });
        }
    }

    // Get user skills
    async getUserSkills(req, res) {
        try {
            const userId = req.user.id;

            const skills = await Skill.find({ userId })
                .sort({ level: -1 })
                .lean();

            res.json({
                success: true,
                data: skills
            });
        } catch (error) {
            console.error('Get skills error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skills'
            });
        }
    }

    // Add or update skill
    async updateSkill(req, res) {
        try {
            const userId = req.user.id;
            const { name, level, category } = req.body;

            if (!name || level < 0 || level > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid skill data'
                });
            }

            const skill = await Skill.findOneAndUpdate(
                { userId, name },
                {
                    userId,
                    name,
                    level,
                    category: category || 'Other'
                },
                { upsert: true, new: true }
            );

            res.json({
                success: true,
                message: 'Skill updated successfully',
                data: skill
            });
        } catch (error) {
            console.error('Update skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update skill'
            });
        }
    }

    // Delete skill
    async deleteSkill(req, res) {
        try {
            const userId = req.user.id;
            const { skillId } = req.params;

            await Skill.findOneAndDelete({ _id: skillId, userId });

            res.json({
                success: true,
                message: 'Skill deleted successfully'
            });
        } catch (error) {
            console.error('Delete skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete skill'
            });
        }
    }

    // Get public profile
    async getPublicProfile(req, res) {
        try {
            const { username } = req.params;

            const user = await User.findOne({ username })
                .select('-password -twoFactorSecret -twoFactorBackupCodes -settings.security')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check privacy settings
            if (user.settings?.privacy?.profileVisibility === 'private') {
                return res.status(403).json({
                    success: false,
                    message: 'This profile is private'
                });
            }

            // Get public data
            const [projects, skills] = await Promise.all([
                Project.find({ 
                    userId: user._id,
                    isPublic: true 
                }).select('title description tags thumbnail views likes'),
                Skill.find({ userId: user._id })
            ]);

            const publicProfile = {
                name: user.name,
                username: user.username,
                bio: user.bio,
                avatar: user.avatar,
                location: user.location,
                role: user.role,
                company: user.company,
                website: user.website,
                socialLinks: user.socialLinks,
                projects: user.settings?.privacy?.showProjects ? projects : [],
                skills,
                joinedDate: user.createdAt
            };

            // Only include email/phone if user allows
            if (user.preferences?.publicEmail) {
                publicProfile.email = user.email;
            }
            if (user.preferences?.publicPhone) {
                publicProfile.phone = user.phone;
            }

            // Track profile view
            await this.trackProfileView(user._id, req.ip);

            res.json({
                success: true,
                data: publicProfile
            });
        } catch (error) {
            console.error('Get public profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    }

    // Helper methods
    async processAvatar(file, userId) {
        try {
            const uploadDir = path.join(__dirname, '../uploads/avatars');
            await fs.mkdir(uploadDir, { recursive: true });

            const filename = `${userId}_${Date.now()}.jpg`;
            const filepath = path.join(uploadDir, filename);

            // Process image with sharp
            await sharp(file.buffer)
                .resize(400, 400, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 90 })
                .toFile(filepath);

            return `/uploads/avatars/${filename}`;
        } catch (error) {
            console.error('Avatar processing error:', error);
            throw new Error('Failed to process avatar');
        }
    }

    async deleteFile(filePath) {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            await fs.unlink(fullPath);
        } catch (error) {
            console.error('Delete file error:', error);
        }
    }

    async getAnalyticsSummary(userId) {
        const analytics = await Analytics.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$pageViews' }
                }
            }
        ]);

        return {
            totalViews: analytics[0]?.totalViews || 0
        };
    }

    async getCollaboratorsCount(userId) {
        const Collaboration = require('../models/Collaboration');
        const collaborators = await Collaboration.distinct('collaboratorId', {
            userId,
            status: 'active'
        });
        return collaborators.length;
    }

    async getMessagesCount(userId) {
        const Message = require('../models/Message');
        return await Message.countDocuments({
            $or: [
                { senderId: userId },
                { recipientId: userId }
            ]
        });
    }

    async getPerformanceData(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const analytics = await Analytics.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    views: { $sum: '$pageViews' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return analytics.map(item => ({
            date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: item.views
        }));
    }

    async trackProfileView(userId, ip) {
        try {
            await Analytics.create({
                userId,
                type: 'profile_view',
                ip,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Track view error:', error);
        }
    }

    getActivityTitle(action) {
        const titles = {
            profile_updated: 'Profile Updated',
            project_created: 'Created New Project',
            project_updated: 'Updated Project',
            skill_added: 'Added New Skill',
            collaboration_started: 'Started Collaboration',
            message_sent: 'Sent Message',
            settings_updated: 'Updated Settings'
        };
        return titles[action] || action;
    }

    getActivityDescription(activity) {
        const descriptions = {
            profile_updated: 'Updated profile information',
            project_created: `Created "${activity.metadata?.projectName || 'a project'}"`,
            project_updated: `Updated "${activity.metadata?.projectName || 'a project'}"`,
            skill_added: `Added ${activity.metadata?.skillName || 'new skill'}`,
            collaboration_started: 'Started a new collaboration',
            message_sent: 'Sent a message',
            settings_updated: 'Changed account settings'
        };
        return descriptions[activity.action] || 'Performed an action';
    }

    getActivityColor(action) {
        const colors = {
            profile_updated: '#06b6d4',
            project_created: '#10b981',
            project_updated: '#3b82f6',
            skill_added: '#8b5cf6',
            collaboration_started: '#ec4899',
            message_sent: '#f59e0b',
            settings_updated: '#64748b'
        };
        return colors[action] || '#06b6d4';
    }

    getActivityIcon(action) {
        // Return icon name/component identifier
        const icons = {
            profile_updated: 'User',
            project_created: 'Plus',
            project_updated: 'Edit',
            skill_added: 'Zap',
            collaboration_started: 'Users',
            message_sent: 'Mail',
            settings_updated: 'Settings'
        };
        return icons[action] || 'Activity';
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }
}

module.exports = new ProfileController();