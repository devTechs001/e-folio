const User = require('../models/User.model');
const ApiKey = require('../models/ApiKey');
const Webhook = require('../models/WebHook');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class SettingsController {
    // Get user settings
    async getUserSettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId)
                .select('-password -__v')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    profile: {
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        bio: user.bio,
                        location: user.location,
                        website: user.website,
                        github: user.socialLinks?.github,
                        linkedin: user.socialLinks?.linkedin,
                        twitter: user.socialLinks?.twitter,
                        phone: user.phone
                    },
                    notifications: user.settings?.notifications || {},
                    privacy: user.settings?.privacy || {},
                    appearance: user.settings?.appearance || {},
                    security: {
                        twoFactorEnabled: user.twoFactorEnabled,
                        emailVerified: user.emailVerified,
                        phoneVerified: user.phoneVerified,
                        sessionTimeout: user.settings?.security?.sessionTimeout
                    }
                }
            });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch settings'
            });
        }
    }

    // Update user settings
    async updateUserSettings(req, res) {
        try {
            const userId = req.user.id;
            const settings = JSON.parse(req.body.settings || '{}');

            // Handle avatar upload
            let avatarUrl = null;
            if (req.file) {
                avatarUrl = await this.uploadAvatar(req.file, userId);
            }

            const updateData = {
                name: settings.profile?.name,
                email: settings.profile?.email,
                username: settings.profile?.username,
                bio: settings.profile?.bio,
                location: settings.profile?.location,
                website: settings.profile?.website,
                phone: settings.profile?.phone,
                socialLinks: {
                    github: settings.profile?.github,
                    linkedin: settings.profile?.linkedin,
                    twitter: settings.profile?.twitter
                },
                settings: {
                    notifications: settings.notifications,
                    privacy: settings.privacy,
                    appearance: settings.appearance,
                    security: {
                        sessionTimeout: settings.security?.sessionTimeout
                    }
                }
            };

            if (avatarUrl) {
                updateData.avatar = avatarUrl;
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');

            // Log activity
            await this.logActivity(userId, 'settings_updated', {
                changes: Object.keys(settings)
            });

            res.json({
                success: true,
                message: 'Settings updated successfully',
                user
            });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update settings'
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Validate new password
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters'
                });
            }

            // Hash and update password
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedPassword;
            user.passwordChangedAt = new Date();
            await user.save();

            // Invalidate all other sessions
            await Session.deleteMany({
                userId,
                _id: { $ne: req.sessionId }
            });

            // Send email notification
            await this.sendPasswordChangeEmail(user.email, user.name);

            // Log activity
            await this.logActivity(userId, 'password_changed');

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }

    // Generate API key
    async generateApiKey(req, res) {
        try {
            const userId = req.user.id;
            const { name, permissions = ['read'] } = req.body;

            // Generate secure API key
            const key = `pk_${crypto.randomBytes(32).toString('hex')}`;
            const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

            const apiKey = await ApiKey.create({
                userId,
                name: name || `API Key ${Date.now()}`,
                key: hashedKey,
                permissions,
                lastUsed: null
            });

            // Log activity
            await this.logActivity(userId, 'api_key_generated', { keyId: apiKey._id });

            res.json({
                success: true,
                message: 'API key generated successfully',
                apiKey: {
                    _id: apiKey._id,
                    name: apiKey.name,
                    key: key, // Only show once
                    permissions: apiKey.permissions,
                    createdAt: apiKey.createdAt
                }
            });
        } catch (error) {
            console.error('Generate API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate API key'
            });
        }
    }

    // Get API keys
    async getApiKeys(req, res) {
        try {
            const userId = req.user.id;
            const apiKeys = await ApiKey.find({ userId, isActive: true })
                .select('-key')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: apiKeys
            });
        } catch (error) {
            console.error('Get API keys error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch API keys'
            });
        }
    }

    // Delete API key
    async deleteApiKey(req, res) {
        try {
            const userId = req.user.id;
            const { keyId } = req.params;

            const apiKey = await ApiKey.findOneAndUpdate(
                { _id: keyId, userId },
                { isActive: false, deletedAt: new Date() },
                { new: true }
            );

            if (!apiKey) {
                return res.status(404).json({
                    success: false,
                    message: 'API key not found'
                });
            }

            // Log activity
            await this.logActivity(userId, 'api_key_deleted', { keyId });

            res.json({
                success: true,
                message: 'API key deleted successfully'
            });
        } catch (error) {
            console.error('Delete API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete API key'
            });
        }
    }

    // Create webhook
    async createWebhook(req, res) {
        try {
            const userId = req.user.id;
            const { url, events, secret } = req.body;

            if (!url || !events || !Array.isArray(events)) {
                return res.status(400).json({
                    success: false,
                    message: 'URL and events are required'
                });
            }

            // Validate URL
            try {
                new URL(url);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL'
                });
            }

            const webhook = await Webhook.create({
                userId,
                url,
                events,
                secret: secret || crypto.randomBytes(32).toString('hex'),
                isActive: true
            });

            // Test webhook
            await this.testWebhook(webhook);

            // Log activity
            await this.logActivity(userId, 'webhook_created', { webhookId: webhook._id });

            res.json({
                success: true,
                message: 'Webhook created successfully',
                webhook
            });
        } catch (error) {
            console.error('Create webhook error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create webhook'
            });
        }
    }

    // Get webhooks
    async getWebhooks(req, res) {
        try {
            const userId = req.user.id;
            const webhooks = await Webhook.find({ userId, isActive: true })
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: webhooks
            });
        } catch (error) {
            console.error('Get webhooks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch webhooks'
            });
        }
    }

    // Delete webhook
    async deleteWebhook(req, res) {
        try {
            const userId = req.user.id;
            const { webhookId } = req.params;

            const webhook = await Webhook.findOneAndUpdate(
                { _id: webhookId, userId },
                { isActive: false, deletedAt: new Date() },
                { new: true }
            );

            if (!webhook) {
                return res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }

            // Log activity
            await this.logActivity(userId, 'webhook_deleted', { webhookId });

            res.json({
                success: true,
                message: 'Webhook deleted successfully'
            });
        } catch (error) {
            console.error('Delete webhook error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete webhook'
            });
        }
    }

    // Get active sessions
    async getActiveSessions(req, res) {
        try {
            const userId = req.user.id;
            const currentSessionId = req.sessionId;

            const sessions = await Session.find({
                userId,
                isActive: true,
                expiresAt: { $gt: new Date() }
            })
                .sort({ lastActivity: -1 })
                .lean();

            const formattedSessions = sessions.map(session => ({
                _id: session._id,
                device: session.device?.type || 'Unknown',
                browser: session.device?.browser || 'Unknown',
                os: session.device?.os || 'Unknown',
                location: session.location?.city && session.location?.country
                    ? `${session.location.city}, ${session.location.country}`
                    : 'Unknown',
                ip: session.ip,
                lastActive: this.getTimeAgo(session.lastActivity),
                isCurrent: session._id.toString() === currentSessionId,
                createdAt: session.createdAt
            }));

            res.json({
                success: true,
                data: formattedSessions
            });
        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sessions'
            });
        }
    }

    // Terminate session
    async terminateSession(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;

            const session = await Session.findOneAndUpdate(
                { _id: sessionId, userId },
                { isActive: false, terminatedAt: new Date() },
                { new: true }
            );

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            // Log activity
            await this.logActivity(userId, 'session_terminated', { sessionId });

            res.json({
                success: true,
                message: 'Session terminated successfully'
            });
        } catch (error) {
            console.error('Terminate session error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to terminate session'
            });
        }
    }

    // Enable 2FA
    async enable2FA(req, res) {
        try {
            const userId = req.user.id;
            const speakeasy = require('speakeasy');
            const QRCode = require('qrcode');

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `Portfolio (${user.email})`,
                length: 32
            });

            // Generate QR code
            const qrCode = await QRCode.toDataURL(secret.otpauth_url);

            // Store secret temporarily (will be confirmed after verification)
            user.twoFactorSecret = secret.base32;
            user.twoFactorTempSecret = secret.base32;
            await user.save();

            res.json({
                success: true,
                message: '2FA secret generated',
                data: {
                    secret: secret.base32,
                    qrCode
                }
            });
        } catch (error) {
            console.error('Enable 2FA error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to enable 2FA'
            });
        }
    }

    // Verify and confirm 2FA
    async verify2FA(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            const speakeasy = require('speakeasy');

            const user = await User.findById(userId);
            if (!user || !user.twoFactorTempSecret) {
                return res.status(400).json({
                    success: false,
                    message: 'No 2FA setup in progress'
                });
            }

            // Verify token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorTempSecret,
                encoding: 'base32',
                token,
                window: 2
            });

            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

            // Confirm 2FA
            user.twoFactorEnabled = true;
            user.twoFactorSecret = user.twoFactorTempSecret;
            user.twoFactorTempSecret = undefined;

            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            user.twoFactorBackupCodes = backupCodes.map(code =>
                crypto.createHash('sha256').update(code).digest('hex')
            );

            await user.save();

            // Log activity
            await this.logActivity(userId, '2fa_enabled');

            res.json({
                success: true,
                message: '2FA enabled successfully',
                backupCodes
            });
        } catch (error) {
            console.error('Verify 2FA error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify 2FA'
            });
        }
    }

    // Disable 2FA
    async disable2FA(req, res) {
        try {
            const userId = req.user.id;
            const { password, token } = req.body;
            const speakeasy = require('speakeasy');

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Verify 2FA token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 2
            });

            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

            // Disable 2FA
            user.twoFactorEnabled = false;
            user.twoFactorSecret = undefined;
            user.twoFactorBackupCodes = undefined;
            await user.save();

            // Log activity
            await this.logActivity(userId, '2fa_disabled');

            res.json({
                success: true,
                message: '2FA disabled successfully'
            });
        } catch (error) {
            console.error('Disable 2FA error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to disable 2FA'
            });
        }
    }

    // Export user data
    async exportUserData(req, res) {
        try {
            const userId = req.user.id;

            const [user, projects, collaborations, analytics] = await Promise.all([
                User.findById(userId).select('-password -twoFactorSecret').lean(),
                require('../models/Project.model').find({ userId }).lean(),
                require('../models/Collaboration').find({ userId }).lean(),
                require('../models/Analytics').find({ userId }).lean()
            ]);

            const exportData = {
                user,
                projects,
                collaborations,
                analytics,
                exportedAt: new Date().toISOString()
            };

            // Log activity
            await this.logActivity(userId, 'data_exported');

            res.json({
                success: true,
                data: exportData
            });
        } catch (error) {
            console.error('Export data error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export data'
            });
        }
    }

    // Delete account
    async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            const { password, confirmation } = req.body;

            if (confirmation !== 'DELETE') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }

            // Delete user data
            await Promise.all([
                User.findByIdAndDelete(userId),
                require('../models/Project.model').deleteMany({ userId }),
                require('../models/Collaboration').deleteMany({ userId }),
                require('../models/Analytics').deleteMany({ userId }),
                ApiKey.deleteMany({ userId }),
                Webhook.deleteMany({ userId }),
                Session.deleteMany({ userId })
            ]);

            // Delete uploaded files
            await this.deleteUserFiles(userId);

            // Send goodbye email
            await this.sendAccountDeletedEmail(user.email, user.name);

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete account'
            });
        }
    }

    // Helper methods
    async uploadAvatar(file, userId) {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        await fs.mkdir(uploadDir, { recursive: true });

        const ext = path.extname(file.originalname);
        const filename = `${userId}_${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        await fs.writeFile(filepath, file.buffer);

        return `/uploads/avatars/${filename}`;
    }

    async deleteUserFiles(userId) {
        const uploadDir = path.join(__dirname, '../uploads');
        try {
            const dirs = ['avatars', 'projects'];
            for (const dir of dirs) {
                const dirPath = path.join(uploadDir, dir);
                const files = await fs.readdir(dirPath);
                const userFiles = files.filter(f => f.startsWith(userId));
                for (const file of userFiles) {
                    await fs.unlink(path.join(dirPath, file));
                }
            }
        } catch (error) {
            console.error('Delete files error:', error);
        }
    }

    async testWebhook(webhook) {
        const axios = require('axios');
        try {
            await axios.post(webhook.url, {
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: { message: 'Webhook test successful' }
            }, {
                headers: {
                    'X-Webhook-Secret': webhook.secret,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
        } catch (error) {
            console.error('Webhook test failed:', error.message);
        }
    }

    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
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

    async sendPasswordChangeEmail(email, name) {
        const emailService = require('../services/email.service');
        await emailService.send({
            to: email,
            subject: 'Password Changed',
            template: 'password-changed',
            data: { name }
        });
    }

    async sendAccountDeletedEmail(email, name) {
        const emailService = require('../services/email.service');
        await emailService.send({
            to: email,
            subject: 'Account Deleted',
            template: 'account-deleted',
            data: { name }
        });
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

module.exports = new SettingsController();