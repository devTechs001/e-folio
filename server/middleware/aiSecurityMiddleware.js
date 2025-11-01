// middleware/aiSecurityMiddleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

/**
 * Rate limiter for AI requests (more restrictive)
 */
exports.aiRequestLimiter = rateLimit({
    store: redis ? new RedisStore({
        client: redis,
        prefix: 'rl:ai:'
    }) : undefined,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: async (req) => {
        // Different limits based on user tier
        if (req.user?.subscription === 'premium') {
            return 1000; // 1000 requests per hour
        } else if (req.user?.subscription === 'pro') {
            return 500;
        }
        return 100; // Free tier
    },
    message: 'AI request limit exceeded. Please upgrade your plan or try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Token usage limiter
 */
exports.tokenLimiter = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const cacheKey = `token_usage:${userId}:${new Date().toISOString().split('T')[0]}`;
        
        // Get current usage
        let usage = 0;
        if (redis) {
            usage = parseInt(await redis.get(cacheKey)) || 0;
        }

        // Check limits based on tier
        const limits = {
            free: 10000,      // 10K tokens per day
            pro: 100000,      // 100K tokens per day
            premium: 1000000  // 1M tokens per day
        };

        const userLimit = limits[req.user?.subscription || 'free'];

        if (usage >= userLimit) {
            return res.status(429).json({
                success: false,
                message: 'Daily token limit exceeded',
                usage,
                limit: userLimit
            });
        }

        // Attach usage info to request
        req.tokenUsage = { current: usage, limit: userLimit };
        next();
    } catch (error) {
        console.error('Token limiter error:', error);
        next();
    }
};

/**
 * Update token usage after request
 */
exports.updateTokenUsage = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Track token usage
        if (data.message?.tokens && redis) {
            const userId = req.user.id;
            const cacheKey = `token_usage:${userId}:${new Date().toISOString().split('T')[0]}`;
            const tokens = data.message.tokens.total;
            
            redis.incrby(cacheKey, tokens)
                .then(() => redis.expire(cacheKey, 86400)) // 24 hours
                .catch(err => console.error('Token tracking error:', err));
        }
        
        originalJson.call(this, data);
    };
    
    next();
};

/**
 * Content moderation middleware
 */
exports.moderateContent = async (req, res, next) => {
    const { message } = req.body;
    
    if (!message) {
        return next();
    }

    // Check for prohibited content
    const prohibitedPatterns = [
        /\b(kill|bomb|attack|terrorism)\b/i,
        /\b(hack|crack|exploit)\s+(password|system|database)/i,
        // Add more patterns as needed
    ];

    for (const pattern of prohibitedPatterns) {
        if (pattern.test(message)) {
            return res.status(400).json({
                success: false,
                message: 'Message contains prohibited content'
            });
        }
    }

    next();
};

/**
 * Spam detection
 */
exports.detectSpam = async (req, res, next) => {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !redis) {
        return next();
    }

    try {
        // Check for repeated messages
        const messageHash = require('crypto').createHash('md5').update(message).digest('hex');
        const cacheKey = `spam:${userId}:${messageHash}`;
        
        const count = await redis.incr(cacheKey);
        await redis.expire(cacheKey, 300); // 5 minutes

        if (count > 3) {
            return res.status(429).json({
                success: false,
                message: 'Duplicate messages detected. Please wait before sending the same message again.'
            });
        }

        next();
    } catch (error) {
        console.error('Spam detection error:', error);
        next();
    }
};

/**
 * Log AI usage for analytics
 */
exports.logAIUsage = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Log to analytics
        if (data.success && data.message) {
            const AIUsageLog = require('../models/AIUsageLog');
            
            AIUsageLog.create({
                userId: req.user.id,
                conversationId: data.conversation?._id,
                model: data.message.model,
                tokens: data.message.tokens,
                cost: data.message.cost,
                responseTime: data.message.responseTime,
                endpoint: req.path,
                ip: req.ip,
                userAgent: req.get('user-agent')
            }).catch(err => console.error('Usage log error:', err));
        }
        
        originalJson.call(this, data);
    };
    
    next();
};