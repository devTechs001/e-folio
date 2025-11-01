const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes
exports.auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'efolio_secret_key_2024');
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is suspended
        if (req.user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        // Update last active
        req.user.lastActive = Date.now();
        await req.user.save();

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// Check if user is owner
exports.isOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner privileges required.'
        });
    }
    next();
};

// Check if user is authorized (owner or collaborator)
exports.isAuthorized = (req, res, next) => {
    if (!['owner', 'collaborator'].includes(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
        });
    }
    next();
};

// Check permissions
exports.hasPermission = (...permissions) => {
    return (req, res, next) => {
        if (req.user.role === 'owner') {
            return next(); // Owner has all permissions
        }

        const hasRequiredPermission = permissions.some(permission =>
            req.user.permissions.includes(permission)
        );

        if (!hasRequiredPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

// Verify token (simple version for public routes)
exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'efolio_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
