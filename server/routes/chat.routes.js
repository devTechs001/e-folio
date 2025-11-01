// routes/chat.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth.middleware');
const {
    getRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    // removeReaction,
    searchMessages,
    pinMessage,
    // unpinMessage,
    markAsRead,
    getOnlineUsers,
    getDirectMessages,
    // createDirectMessage,
    uploadFile
} = require('../controllers/chat.controller');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/chat');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|mp4/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

// Room routes
router.get('/rooms', auth, getRooms);
router.post('/rooms', auth, createRoom);
router.put('/rooms/:id', auth, updateRoom);
router.delete('/rooms/:id', auth, deleteRoom);
router.get('/rooms/:id/messages', auth, getRoomMessages);

// Message routes
router.post('/messages', auth, sendMessage);
router.put('/messages/:id', auth, updateMessage);
router.delete('/messages/:id', auth, deleteMessage);
router.post('/messages/:id/read', auth, markAsRead);
router.post('/messages/:id/pin', auth, pinMessage);
// router.delete('/messages/:id/pin', auth, unpinMessage); // TODO: Implement unpinMessage

// Reaction routes
router.post('/messages/:id/reactions', auth, addReaction);
// router.delete('/messages/:id/reactions/:emoji', auth, removeReaction); // TODO: Implement

// Search
router.get('/search', auth, searchMessages);

// Users
router.get('/users/online', auth, getOnlineUsers);

// Direct messages
router.get('/direct-messages', auth, getDirectMessages);
// router.post('/direct-messages', auth, createDirectMessage); // TODO: Implement

// File upload
router.post('/upload', auth, upload.single('file'), uploadFile);

module.exports = router;