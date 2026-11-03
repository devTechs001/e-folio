/**
 * Shared multer configuration for user-supplied files.
 *
 * Keeping one definition avoids the two collaboration routers drifting apart
 * (one of them previously registered /upload with no multer at all, so the
 * controller always saw an empty req.files). Destination directories are
 * created lazily: diskStorage fails with ENOENT when the folder is absent in a
 * fresh deployment.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Public assets (review images) live under /uploads. Anything containing
// applicant PII goes to a directory that is NOT mounted by express.static and
// is only reachable through the owner-authenticated file route.
const UPLOAD_ROOT = path.resolve(__dirname, '..', 'uploads');
const PRIVATE_ROOT = path.resolve(__dirname, '..', 'private', 'uploads');

const destinationFor = (folder, root = UPLOAD_ROOT) => {
    const full = path.join(root, folder);
    fs.mkdirSync(full, { recursive: true });
    return full;
};

const safeExtension = (originalName) =>
    path.extname(originalName || '').replace(/[^.a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase();

const storageFor = (folder, root = UPLOAD_ROOT) => multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            cb(null, destinationFor(folder, root));
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const suffix = crypto.randomBytes(12).toString('hex');
        cb(null, `${Date.now()}-${suffix}${safeExtension(file.originalname)}`);
    }
});

// Allow-list MIME types and extensions together. Matching a regex against the
// MIME string alone (the old implementation) accepted e.g. "application/pdf"
// for a .exe renamed to .pdf.
const REQUEST_FILES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const REVIEW_IMAGES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif']
};

const filterFor = (allowed) => (req, file, cb) => {
    const ext = safeExtension(file.originalname);
    const exts = allowed[file.mimetype];
    if (exts && exts.includes(ext)) return cb(null, true);
    cb(new Error('Unsupported file type'));
};

const collaborationUpload = multer({
    storage: storageFor('collaboration-requests', PRIVATE_ROOT),
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    fileFilter: filterFor(REQUEST_FILES)
});

const reviewUpload = multer({
    storage: storageFor('reviews'),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: filterFor(REVIEW_IMAGES)
});

module.exports = { collaborationUpload, reviewUpload, UPLOAD_ROOT, PRIVATE_ROOT };
