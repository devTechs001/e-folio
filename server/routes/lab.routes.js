// routes/lab.routes.js
/**
 * Phase 42 — Lab routes. A separate module from /api/projects.
 *
 * Mounted twice in server.js:
 *   /api/lab         → owner-authenticated management
 *   /api/public/lab  → public read-only listing
 *
 * Nothing here reads or writes the Project collection.
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth: protect, isOwner } = require('../middleware/auth.middleware');
const {
    getLabEntries,
    getPublicLabEntries,
    getLabStats,
    getLabEntry,
    createLabEntry,
    updateLabEntry,
    deleteLabEntry,
    viewLabEntry,
    likeLabEntry
} = require('../controllers/lab.controller');
const { LAB_STATUSES, LAB_DOMAINS } = require('../models/LabEntry.model');

const entryValidation = [
    body('title').trim().isLength({ min: 1, max: 120 }).withMessage('Title is required'),
    body('summary').trim().isLength({ min: 1, max: 240 }).withMessage('A short summary is required'),
    body('domain').optional().isIn(LAB_DOMAINS),
    body('status').optional().isIn(LAB_STATUSES),
    body('difficulty').optional().isIn(['introductory', 'intermediate', 'advanced']),
    body('visibility').optional().isIn(['public', 'private', 'unlisted'])
];

/* ------------------------------------------------------------- public --- */

// Public grid. Declared on both mounts so either prefix serves it.
router.get('/public', getPublicLabEntries);

/* ---------------------------------------------------------- dashboard --- */

router.get('/', protect, getLabEntries);
router.get('/stats', protect, getLabStats);
router.post('/:id/view', viewLabEntry);
router.post('/:id/like', protect, likeLabEntry);

router.post('/', protect, isOwner, entryValidation, createLabEntry);
router.put('/:id', protect, isOwner, entryValidation, updateLabEntry);
router.delete('/:id', protect, isOwner, deleteLabEntry);
router.get('/:id', protect, getLabEntry);

module.exports = router;
