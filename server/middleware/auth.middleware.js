const security = require('../config/security');
const { ObjectId } = require('mongoose').Types;
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
        const decoded = security.verifyToken(token);
        
        let user;

        if (decoded.role === 'owner') {
            if (decoded.id && ObjectId.isValid(decoded.id)) {
                try {
                    user = await User.findById(decoded.id).select('-password');
                } catch (e) {}
            }
            if (!user && decoded.email) {
                user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
            }
            // Do NOT silently fall back to "any owner" or manufacture an owner
            // principal in production: that turns a stale/foreign token into
            // full admin access. Only local development gets a bootstrap owner.
            if (!user && !security.isProduction()) {
                const fixedId = new ObjectId('507f1f77bcf86cd799439011');
                user = {
                    _id: fixedId,
                    id: fixedId.toString(),
                    name: process.env.OWNER_NAME || 'Portfolio Owner',
                    email: decoded.email || security.getOwnerEmail(),
                    role: 'owner',
                    isActive: true,
                    permissions: ['*'],
                    save: async () => user
                };
            }
        } else {
            if (decoded.id && ObjectId.isValid(decoded.id)) {
                user = await User.findById(decoded.id).select('-password');
            } else if (decoded.email) {
                user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
            }
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is suspended/inactive
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        req.user = user;

        // Update last active (throttled to avoid a DB write on every request)
        if (user.save && typeof user.save === 'function' && user._id) {
            const now = Date.now();
            const lastSeen = user.lastLoginAt ? user.lastLoginAt.getTime() : 0;
            if (now - lastSeen > 2 * 60 * 1000) {
                req.user.lastLoginAt = new Date(now);
                req.user.save().catch(() => {});
            }
        }

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
    if (req.user?.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner privileges required.'
        });
    }
    next();
};

// Check if user is authorized (owner, collaborator, or user)
exports.isAuthorized = (req, res, next) => {
    if (!['owner', 'collaborator', 'user'].includes(req.user?.role)) {
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
        if (req.user?.role === 'owner') {
            return next(); // Owner has all permissions
        }

        const hasRequiredPermission = (req.user?.permissions || []).some(permission =>
            permissions.includes(permission)
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
        const decoded = security.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
