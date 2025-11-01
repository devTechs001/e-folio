// routes/collaboration-request.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, isOwner } = require('../middleware/auth.middleware');
const {
    submitCollaborationRequest,
    getCollaborationRequests,
    getCollaborationStats,
    getRequestById,
    approveRequest,
    rejectRequest,
    bulkApproveRequests,
    bulkRejectRequests,
    archiveRequest,
    exportRequests,
    uploadRequestFile,
    addRequestNote,
    updateRequestStatus,
    resendInvite,
    getRequestActivity
} = require('../controllers/collaboration.controller');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/collaboration-requests');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only documents and images are allowed'));
    }
});

// Public routes
router.post('/submit', submitCollaborationRequest);
router.post('/upload', upload.array('files', 5), uploadRequestFile);

// Protected routes (owner only)
router.get('/requests', auth, isOwner, getCollaborationRequests);
router.get('/stats', auth, isOwner, getCollaborationStats);
router.get('/requests/:id', auth, isOwner, getRequestById);
router.get('/requests/:id/activity', auth, isOwner, getRequestActivity);

// Request actions
router.post('/requests/:id/approve', auth, isOwner, approveRequest);
router.post('/requests/:id/reject', auth, isOwner, rejectRequest);
router.post('/requests/:id/archive', auth, isOwner, archiveRequest);
router.post('/requests/:id/notes', auth, isOwner, addRequestNote);
router.put('/requests/:id/status', auth, isOwner, updateRequestStatus);
router.post('/requests/:id/resend', auth, isOwner, resendInvite);

// Bulk actions
router.post('/bulk/approve', auth, isOwner, bulkApproveRequests);
router.post('/bulk/reject', auth, isOwner, bulkRejectRequests);

// Export
router.get('/export', auth, isOwner, exportRequests);

module.exports = router;