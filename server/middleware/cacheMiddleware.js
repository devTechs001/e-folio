// middleware/cacheMiddleware.js
const CacheService = require('../services/CacheService');

/**
 * Cache middleware for GET requests
 */
exports.cacheMiddleware = (duration = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const key = `cache:${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

        try {
            // Check cache
            const cached = await CacheService.get(key);

            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }

            // Store original send function
            const originalSend = res.json;

            // Override send function
            res.json = function(data) {
                // Cache the response
                CacheService.set(key, data, duration).catch(console.error);

                // Set cache header
                res.set('X-Cache', 'MISS');

                // Call original send
                originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Invalidate cache on mutations
 */
exports.invalidateCache = (pattern) => {
    return async (req, res, next) => {
        // Store original send
        const originalSend = res.send;

        res.send = function(data) {
            // Invalidate cache
            CacheService.invalidatePattern(pattern).catch(console.error);

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};