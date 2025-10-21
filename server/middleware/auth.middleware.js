const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'efolio_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Check if user is owner
const isOwner = (req, res, next) => {
    if (req.user?.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner only.'
        });
    }
    next();
};

// Check if user is owner or collaborator
const isAuthorized = (req, res, next) => {
    if (!['owner', 'collaborator'].includes(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isOwner,
    isAuthorized
};
