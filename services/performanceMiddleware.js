// middleware/performanceMiddleware.js
const PerformanceMonitoringService = require('../services/PerformanceMonitoringService');

/**
 * Middleware to track request performance
 */
exports.trackPerformance = (req, res, next) => {
    const startTime = Date.now();

    // Capture the original send function
    const originalSend = res.send;

    res.send = function(data) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        PerformanceMonitoringService.trackRequest(duration, success);

        // Add performance headers
        res.set('X-Response-Time', `${duration}ms`);

        // Call original send
        originalSend.call(this, data);
    };

    next();
};