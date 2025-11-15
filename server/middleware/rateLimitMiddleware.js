// middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
exports.generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Tracking endpoint rate limiter (more permissive)
 */
exports.trackingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Rate limit exceeded for tracking requests.',
    skipSuccessfulRequests: false,
});

/**
 * Analytics endpoint rate limiter (more restrictive)
 */
exports.analyticsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Rate limit exceeded for analytics requests.',
});

/**
 * Export endpoint rate limiter (very restrictive)
 */
exports.exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 exports per hour
    message: 'Export rate limit exceeded. Please try again later.',
});

/**
 * Custom rate limiter with dynamic limits
 */
exports.dynamicLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: async (req) => {
            // Authenticated users get higher limits
            if (req.user) {
                return options.authenticatedMax || 200;
            }
            return options.max || 100;
        },
        message: options.message || 'Rate limit exceeded',
    });
};

/**
 * Simple rate limiter factory function
 */
exports.rateLimiter = (maxRequests = 5) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: maxRequests,
        message: 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    });
};