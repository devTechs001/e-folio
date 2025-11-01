// routes/email.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, isOwner } = require('../middleware/auth.middleware');
const {
    getEmails,
    getEmailById,
    sendEmail,
    replyToEmail,
    forwardEmail,
    deleteEmails,
    archiveEmails,
    markAsRead,
    markAsUnread,
    toggleStar,
    addLabel,
    removeLabel,
    getEmailStats,
    searchEmails,
    getDrafts,
    saveDraft,
    deleteDraft,
    getLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getFolders,
    createFolder,
    moveToFolder,
    getEmailSettings,
    updateEmailSettings,
    getQuickResponses,
    createQuickResponse,
    scheduleEmail,
    cancelScheduledEmail,
    getScheduledEmails,
    uploadAttachment,
    downloadAttachment,
    bulkOperations,
    getEmailThread,
    markSpam,
    blockSender
} = require('../controllers/email.controller');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/email-attachments');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
        // Allow most file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|mp3|mp4|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (extname || true) { // Allow all for now
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

// All routes require authentication and owner role
router.use(auth, isOwner);

// Email CRUD
router.get('/', getEmails);
router.get('/stats', getEmailStats);
router.get('/search', searchEmails);
router.get('/:id', getEmailById);
router.post('/send', sendEmail);
router.post('/:id/reply', replyToEmail);
router.post('/:id/forward', forwardEmail);
router.delete('/bulk', deleteEmails);
router.post('/bulk/archive', archiveEmails);
router.post('/bulk', bulkOperations);

// Email actions
router.post('/:id/read', markAsRead);
router.post('/:id/unread', markAsUnread);
router.post('/:id/star', toggleStar);
router.post('/:id/archive', archiveEmails);
router.delete('/:id', deleteEmails);
router.post('/:id/spam', markSpam);

// Labels
router.get('/labels/all', getLabels);
router.post('/labels', createLabel);
router.put('/labels/:id', updateLabel);
router.delete('/labels/:id', deleteLabel);
router.post('/:id/labels/:labelId', addLabel);
router.delete('/:id/labels/:labelId', removeLabel);

// Templates
router.get('/templates/all', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// Folders
router.get('/folders/all', getFolders);
router.post('/folders', createFolder);
router.post('/:id/move', moveToFolder);

// Drafts
router.get('/drafts/all', getDrafts);
router.post('/drafts', saveDraft);
router.put('/drafts/:id', saveDraft);
router.delete('/drafts/:id', deleteDraft);

// Quick Responses
router.get('/quick-responses/all', getQuickResponses);
router.post('/quick-responses', createQuickResponse);

// Scheduled Emails
router.get('/scheduled/all', getScheduledEmails);
router.post('/scheduled', scheduleEmail);
router.delete('/scheduled/:id', cancelScheduledEmail);

// Settings
router.get('/settings', getEmailSettings);
router.put('/settings', updateEmailSettings);

// Attachments
router.post('/attachments/upload', upload.array('files', 10), uploadAttachment);
router.get('/attachments/:id/download', downloadAttachment);

// Threads
router.get('/:id/thread', getEmailThread);

// Block
router.post('/block/:email', blockSender);

module.exports = router;