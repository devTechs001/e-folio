const jwt = require('jsonwebtoken');
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        let user;

        // Handle legacy hardcoded owner ID token
        if (decoded.role === 'owner' && decoded.id === 'owner_001') {
            // Try the fixed ObjectId first, then fall back to role-based lookup
            try {
                user = await User.findById(new ObjectId('507f1f77bcf86cd799439011'));
            } catch (e) {
                // ignore cast error
            }
            if (!user) {
                user = await User.findOne({ role: 'owner' }).select('-password');
            }
        } else {
            // For other users, look up by decoded.id
            user = await User.findById(decoded.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        req.user = user;

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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
