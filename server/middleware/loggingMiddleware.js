// middleware/loggingMiddleware.js
const morgan = require('morgan');
const logger = require('../config/logger');

// Custom Morgan token for response time in ms
morgan.token('response-time-ms', (req, res) => {
    if (!req._startAt || !res._startAt) {
        return '';
    }
    const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
               (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(3);
});

// Custom Morgan format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// HTTP request logger
exports.httpLogger = morgan(morganFormat, {
    stream: logger.stream,
    skip: (req, res) => {
        // Skip health check endpoints
        return req.url.startsWith('/health') || req.url.startsWith('/metrics');
    }
});

// Request details logger
exports.requestLogger = (req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req.id
    });
    next();
};

// Error logger
exports.errorLogger = (err, req, res, next) => {
    logger.error('Request error', {
        error: {
            message: err.message,
            stack: err.stack,
            code: err.code
        },
        request: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent')
        }
    });
    next(err);
};