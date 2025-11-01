// controllers/email.controller.js
const Email = require('../models/Email');
// const Draft = require('../models/Draft'); // TODO: Create model
// const Label = require('../models/Label'); // TODO: Create model
// const Template = require('../models/Template'); // TODO: Create model
const Folder = require('../models/Folder');
// const QuickResponse = require('../models/QuickResponse'); // TODO: Create model
// const ScheduledEmail = require('../models/ScheduledEmail'); // TODO: Create model
// const EmailSettings = require('../models/EmailSettings'); // TODO: Create model
// const { sendEmail: sendEmailService } = require('../utils/email'); // TODO: Create util
const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');

// Get emails with filtering and pagination
exports.getEmails = async (req, res) => {
    try {
        const {
            folder = 'inbox',
            page = 1,
            limit = 20,
            sortBy = 'timestamp',
            sortOrder = 'desc',
            unread,
            starred,
            hasAttachment,
            priority,
            label
        } = req.query;

        let query = { recipient: req.user.email };

        // Folder filtering
        switch (folder) {
            case 'inbox':
                query.folder = 'inbox';
                query.deleted = false;
                query.archived = false;
                break;
            case 'sent':
                query = { sender: req.user.email, deleted: false };
                break;
            case 'starred':
                query.starred = true;
                query.deleted = false;
                break;
            case 'archived':
                query.archived = true;
                query.deleted = false;
                break;
            case 'trash':
                query.deleted = true;
                break;
            case 'spam':
                query.spam = true;
                break;
            case 'drafts':
                // Handle drafts separately
                const drafts = await Draft.find({ user: req.user.id })
                    .sort({ updatedAt: -1 })
                    .limit(parseInt(limit))
                    .skip((parseInt(page) - 1) * parseInt(limit));
                return res.json({ success: true, emails: drafts, isDrafts: true });
        }

        // Additional filters
        if (unread === 'true') query.read = false;
        if (starred === 'true') query.starred = true;
        if (hasAttachment === 'true') query['attachments.0'] = { $exists: true };
        if (priority && priority !== 'all') query.priority = priority;
        if (label && label !== 'all') query.labels = label;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const emails = await Email.find(query)
            .populate('labels')
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Email.countDocuments(query);

        res.json({
            success: true,
            emails: emails.map(email => ({
                id: email._id,
                from: email.from,
                to: email.to,
                cc: email.cc,
                bcc: email.bcc,
                subject: email.subject,
                body: email.body,
                preview: email.body.substring(0, 150),
                timestamp: email.timestamp,
                read: email.read,
                starred: email.starred,
                hasAttachment: email.attachments.length > 0,
                attachments: email.attachments,
                labels: email.labels,
                priority: email.priority,
                folder: email.folder,
                threadId: email.threadId
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get emails error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get email by ID
exports.getEmailById = async (req, res) => {
    try {
        const email = await Email.findById(req.params.id)
            .populate('labels')
            .populate('replyTo')
            .populate('forwardFrom');

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found'
            });
        }

        // Check access
        if (email.recipient !== req.user.email && email.sender !== req.user.email) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({ success: true, email });
    } catch (error) {
        console.error('Get email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Send email
exports.sendEmail = async (req, res) => {
    try {
        const {
            to,
            cc,
            bcc,
            subject,
            body,
            priority = 'normal',
            attachments = [],
            scheduledFor,
            signature = true
        } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'To, subject, and body are required'
            });
        }

        // Get user settings for signature
        let finalBody = body;
        if (signature) {
            const settings = await EmailSettings.findOne({ user: req.user.id });
            if (settings && settings.signature) {
                finalBody += `\n\n${settings.signature}`;
            }
        }

        // If scheduled, save as scheduled email
        if (scheduledFor) {
            const scheduledEmail = await ScheduledEmail.create({
                user: req.user.id,
                to,
                cc,
                bcc,
                subject,
                body: finalBody,
                priority,
                attachments,
                scheduledFor: new Date(scheduledFor)
            });

            return res.json({
                success: true,
                message: 'Email scheduled successfully',
                scheduledEmail
            });
        }

        // Create email record
        const email = await Email.create({
            sender: req.user.email,
            senderName: req.user.name,
            recipient: to,
            to,
            cc,
            bcc,
            subject,
            body: finalBody,
            priority,
            attachments,
            folder: 'sent',
            threadId: generateThreadId(subject)
        });

        // Send actual email
        await sendEmailService({
            to,
            cc,
            bcc,
            subject,
            html: formatEmailHTML(finalBody),
            attachments: attachments.map(att => ({
                filename: att.name,
                path: att.url
            }))
        });

        // Emit socket event
        req.app.get('io').emit('email_sent', {
            emailId: email._id,
            to
        });

        res.json({
            success: true,
            message: 'Email sent successfully',
            email
        });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

// Reply to email
exports.replyToEmail = async (req, res) => {
    try {
        const originalEmail = await Email.findById(req.params.id);
        if (!originalEmail) {
            return res.status(404).json({
                success: false,
                message: 'Original email not found'
            });
        }

        const { body, attachments = [] } = req.body;

        const replyEmail = await Email.create({
            sender: req.user.email,
            senderName: req.user.name,
            recipient: originalEmail.sender,
            to: originalEmail.sender,
            subject: `Re: ${originalEmail.subject}`,
            body,
            attachments,
            folder: 'sent',
            replyTo: originalEmail._id,
            threadId: originalEmail.threadId
        });

        // Send email
        await sendEmailService({
            to: originalEmail.sender,
            subject: `Re: ${originalEmail.subject}`,
            html: formatEmailHTML(body)
        });

        res.json({
            success: true,
            message: 'Reply sent successfully',
            email: replyEmail
        });
    } catch (error) {
        console.error('Reply email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message
        });
    }
};

// Forward email
exports.forwardEmail = async (req, res) => {
    try {
        const originalEmail = await Email.findById(req.params.id);
        if (!originalEmail) {
            return res.status(404).json({
                success: false,
                message: 'Original email not found'
            });
        }

        const { to, body, attachments } = req.body;

        const forwardEmail = await Email.create({
            sender: req.user.email,
            senderName: req.user.name,
            recipient: to,
            to,
            subject: `Fwd: ${originalEmail.subject}`,
            body: `${body}\n\n---\nForwarded message:\nFrom: ${originalEmail.senderName} <${originalEmail.sender}>\nDate: ${originalEmail.timestamp}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body}`,
            attachments: attachments || originalEmail.attachments,
            folder: 'sent',
            forwardFrom: originalEmail._id,
            threadId: generateThreadId(originalEmail.subject)
        });

        // Send email
        await sendEmailService({
            to,
            subject: `Fwd: ${originalEmail.subject}`,
            html: formatEmailHTML(forwardEmail.body)
        });

        res.json({
            success: true,
            message: 'Email forwarded successfully',
            email: forwardEmail
        });
    } catch (error) {
        console.error('Forward email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to forward email',
            error: error.message
        });
    }
};

// Delete emails
exports.deleteEmails = async (req, res) => {
    try {
        const { ids } = req.body;
        const emailIds = ids || [req.params.id];

        await Email.updateMany(
            { _id: { $in: emailIds } },
            { deleted: true, deletedAt: new Date() }
        );

        res.json({
            success: true,
            message: `${emailIds.length} email(s) deleted`
        });
    } catch (error) {
        console.error('Delete emails error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete emails',
            error: error.message
        });
    }
};

// Archive emails
exports.archiveEmails = async (req, res) => {
    try {
        const { ids } = req.body;
        const emailIds = ids || [req.params.id];

        await Email.updateMany(
            { _id: { $in: emailIds } },
            { archived: true, archivedAt: new Date(), folder: 'archived' }
        );

        res.json({
            success: true,
            message: `${emailIds.length} email(s) archived`
        });
    } catch (error) {
        console.error('Archive emails error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive emails',
            error: error.message
        });
    }
};

// Mark as read
exports.markAsRead = async (req, res) => {
    try {
        const { ids } = req.body;
        const emailIds = ids || [req.params.id];

        await Email.updateMany(
            { _id: { $in: emailIds } },
            { read: true, readAt: new Date() }
        );

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as read',
            error: error.message
        });
    }
};

// Mark as unread
exports.markAsUnread = async (req, res) => {
    try {
        const { ids } = req.body;
        const emailIds = ids || [req.params.id];

        await Email.updateMany(
            { _id: { $in: emailIds } },
            { read: false, readAt: null }
        );

        res.json({ success: true, message: 'Marked as unread' });
    } catch (error) {
        console.error('Mark as unread error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as unread',
            error: error.message
        });
    }
};

// Toggle star
exports.toggleStar = async (req, res) => {
    try {
        const email = await Email.findById(req.params.id);
        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found'
            });
        }

        email.starred = !email.starred;
        await email.save();

        res.json({
            success: true,
            starred: email.starred
        });
    } catch (error) {
        console.error('Toggle star error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle star',
            error: error.message
        });
    }
};

// Get email stats
exports.getEmailStats = async (req, res) => {
    try {
        const total = await Email.countDocuments({
            $or: [
                { sender: req.user.email },
                { recipient: req.user.email }
            ],
            deleted: false
        });

        const unread = await Email.countDocuments({
            recipient: req.user.email,
            read: false,
            deleted: false,
            archived: false
        });

        const sent = await Email.countDocuments({
            sender: req.user.email,
            deleted: false
        });

        const drafts = await Draft.countDocuments({
            user: req.user.id
        });

        const starred = await Email.countDocuments({
            recipient: req.user.email,
            starred: true,
            deleted: false
        });

        res.json({
            success: true,
            stats: {
                total,
                unread,
                sent,
                drafts,
                starred
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Search emails
exports.searchEmails = async (req, res) => {
    try {
        const { q, folder, dateFrom, dateTo } = req.query;

        let query = {
            $or: [
                { sender: req.user.email },
                { recipient: req.user.email }
            ],
            deleted: false
        };

        if (q) {
            query.$or = [
                { subject: { $regex: q, $options: 'i' } },
                { body: { $regex: q, $options: 'i' } },
                { senderName: { $regex: q, $options: 'i' } },
                { sender: { $regex: q, $options: 'i' } }
            ];
        }

        if (folder) query.folder = folder;
        if (dateFrom) query.timestamp = { $gte: new Date(dateFrom) };
        if (dateTo) query.timestamp = { ...query.timestamp, $lte: new Date(dateTo) };

        const results = await Email.find(query)
            .populate('labels')
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({ success: true, results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
};

// Get drafts
exports.getDrafts = async (req, res) => {
    try {
        const drafts = await Draft.find({ user: req.user.id })
            .sort({ updatedAt: -1 });

        res.json({ success: true, drafts });
    } catch (error) {
        console.error('Get drafts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Save draft
exports.saveDraft = async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, attachments, priority } = req.body;

        let draft;
        if (req.params.id) {
            // Update existing draft
            draft = await Draft.findOneAndUpdate(
                { _id: req.params.id, user: req.user.id },
                { to, cc, bcc, subject, body, attachments, priority },
                { new: true }
            );
        } else {
            // Create new draft
            draft = await Draft.create({
                user: req.user.id,
                to,
                cc,
                bcc,
                subject,
                body,
                attachments,
                priority
            });
        }

        res.json({
            success: true,
            message: 'Draft saved',
            draft
        });
    } catch (error) {
        console.error('Save draft error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save draft',
            error: error.message
        });
    }
};

// Delete draft
exports.deleteDraft = async (req, res) => {
    try {
        await Draft.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        res.json({ success: true, message: 'Draft deleted' });
    } catch (error) {
        console.error('Delete draft error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete draft',
            error: error.message
        });
    }
};

// Get labels
exports.getLabels = async (req, res) => {
    try {
        const labels = await Label.find({ user: req.user.id });
        res.json({ success: true, labels });
    } catch (error) {
        console.error('Get labels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create label
exports.createLabel = async (req, res) => {
    try {
        const { name, color } = req.body;

        const label = await Label.create({
            user: req.user.id,
            name,
            color
        });

        res.json({ success: true, label });
    } catch (error) {
        console.error('Create label error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create label',
            error: error.message
        });
    }
};

// Update label
exports.updateLabel = async (req, res) => {
    try {
        const { name, color } = req.body;

        const label = await Label.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { name, color },
            { new: true }
        );

        res.json({ success: true, label });
    } catch (error) {
        console.error('Update label error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update label',
            error: error.message
        });
    }
};

// Delete label
exports.deleteLabel = async (req, res) => {
    try {
        await Label.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        // Remove label from all emails
        await Email.updateMany(
            { labels: req.params.id },
            { $pull: { labels: req.params.id } }
        );

        res.json({ success: true, message: 'Label deleted' });
    } catch (error) {
        console.error('Delete label error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete label',
            error: error.message
        });
    }
};

// Add label to email
exports.addLabel = async (req, res) => {
    try {
        const email = await Email.findById(req.params.id);
        if (!email.labels.includes(req.params.labelId)) {
            email.labels.push(req.params.labelId);
            await email.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Add label error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add label',
            error: error.message
        });
    }
};

// Remove label from email
exports.removeLabel = async (req, res) => {
    try {
        await Email.findByIdAndUpdate(
            req.params.id,
            { $pull: { labels: req.params.labelId } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove label error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove label',
            error: error.message
        });
    }
};

// Get templates
exports.getTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ user: req.user.id });
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create template
exports.createTemplate = async (req, res) => {
    try {
        const { name, description, subject, body } = req.body;

        const template = await Template.create({
            user: req.user.id,
            name,
            description,
            subject,
            body
        });

        res.json({ success: true, template });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create template',
            error: error.message
        });
    }
};

// Update template
exports.updateTemplate = async (req, res) => {
    try {
        const { name, description, subject, body } = req.body;

        const template = await Template.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { name, description, subject, body },
            { new: true }
        );

        res.json({ success: true, template });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update template',
            error: error.message
        });
    }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
    try {
        await Template.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete template',
            error: error.message
        });
    }
};

// Get folders
exports.getFolders = async (req, res) => {
    try {
        const folders = await Folder.find({ user: req.user.id });
        res.json({ success: true, folders });
    } catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create folder
exports.createFolder = async (req, res) => {
    try {
        const { name, color } = req.body;

        const folder = await Folder.create({
            user: req.user.id,
            name,
            color
        });

        res.json({ success: true, folder });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create folder',
            error: error.message
        });
    }
};

// Move to folder
exports.moveToFolder = async (req, res) => {
    try {
        const { folderId } = req.body;

        await Email.findByIdAndUpdate(
            req.params.id,
            { folder: folderId }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Move to folder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to move email',
            error: error.message
        });
    }
};

// Get email settings
exports.getEmailSettings = async (req, res) => {
    try {
        let settings = await EmailSettings.findOne({ user: req.user.id });

        if (!settings) {
            settings = await EmailSettings.create({
                user: req.user.id,
                signature: '',
                autoReply: false,
                autoReplyMessage: '',
                readReceipts: true,
                notifications: true
            });
        }

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update email settings
exports.updateEmailSettings = async (req, res) => {
    try {
        const settings = await EmailSettings.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, upsert: true }
        );

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};

// Get quick responses
exports.getQuickResponses = async (req, res) => {
    try {
        const responses = await QuickResponse.find({ user: req.user.id });
        res.json({ success: true, responses });
    } catch (error) {
        console.error('Get quick responses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create quick response
exports.createQuickResponse = async (req, res) => {
    try {
        const { title, content } = req.body;

        const response = await QuickResponse.create({
            user: req.user.id,
            title,
            content
        });

        res.json({ success: true, response });
    } catch (error) {
        console.error('Create quick response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create quick response',
            error: error.message
        });
    }
};

// Schedule email
exports.scheduleEmail = async (req, res) => {
    try {
        const scheduledEmail = await ScheduledEmail.create({
            user: req.user.id,
            ...req.body
        });

        res.json({
            success: true,
            message: 'Email scheduled',
            scheduledEmail
        });
    } catch (error) {
        console.error('Schedule email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule email',
            error: error.message
        });
    }
};

// Get scheduled emails
exports.getScheduledEmails = async (req, res) => {
    try {
        const scheduled = await ScheduledEmail.find({
            user: req.user.id,
            sent: false
        }).sort({ scheduledFor: 1 });

        res.json({ success: true, scheduled });
    } catch (error) {
        console.error('Get scheduled emails error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Cancel scheduled email
exports.cancelScheduledEmail = async (req, res) => {
    try {
        await ScheduledEmail.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
            sent: false
        });

        res.json({ success: true, message: 'Scheduled email cancelled' });
    } catch (error) {
        console.error('Cancel scheduled email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel scheduled email',
            error: error.message
        });
    }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const attachments = req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/email-attachments/${file.filename}`,
            size: file.size,
            type: file.mimetype
        }));

        res.json({ success: true, attachments });
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
    try {
        const email = await Email.findById(req.params.id);
        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found'
            });
        }

        // Implementation depends on where attachments are stored
        res.json({ success: true });
    } catch (error) {
        console.error('Download attachment error:', error);
        res.status(500).json({
            success: false,
            message: 'Download failed',
            error: error.message
        });
    }
};

// Bulk operations
exports.bulkOperations = async (req, res) => {
    try {
        const { action, emailIds } = req.body;

        switch (action) {
            case 'markRead':
                await Email.updateMany(
                    { _id: { $in: emailIds } },
                    { read: true }
                );
                break;
            case 'markUnread':
                await Email.updateMany(
                    { _id: { $in: emailIds } },
                    { read: false }
                );
                break;
            case 'delete':
                await Email.updateMany(
                    { _id: { $in: emailIds } },
                    { deleted: true }
                );
                break;
            case 'archive':
                await Email.updateMany(
                    { _id: { $in: emailIds } },
                    { archived: true }
                );
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        res.json({
            success: true,
            message: `Bulk ${action} completed`
        });
    } catch (error) {
        console.error('Bulk operations error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk operation failed',
            error: error.message
        });
    }
};

// Get email thread
exports.getEmailThread = async (req, res) => {
    try {
        const email = await Email.findById(req.params.id);
        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found'
            });
        }

        const thread = await Email.find({
            threadId: email.threadId
        }).sort({ timestamp: 1 });

        res.json({ success: true, thread });
    } catch (error) {
        console.error('Get thread error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Mark as spam
exports.markSpam = async (req, res) => {
    try {
        await Email.findByIdAndUpdate(
            req.params.id,
            { spam: true, folder: 'spam' }
        );

        res.json({ success: true, message: 'Marked as spam' });
    } catch (error) {
        console.error('Mark spam error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as spam',
            error: error.message
        });
    }
};

// Block sender
exports.blockSender = async (req, res) => {
    try {
        // Implementation depends on blocklist system
        res.json({ success: true, message: 'Sender blocked' });
    } catch (error) {
        console.error('Block sender error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to block sender',
            error: error.message
        });
    }
};

// Helper functions
function generateThreadId(subject) {
    return subject.replace(/^(Re:|Fwd:)\s*/gi, '').toLowerCase().replace(/\s+/g, '-');
}

function formatEmailHTML(text) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${text.replace(/\n/g, '<br>')}
            </div>
        </body>
        </html>
    `;
}