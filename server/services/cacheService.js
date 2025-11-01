// services/CacheService.js
const redis = require('redis');
const { promisify } = require('util');

class CacheService {
    constructor() {
        this.enabled = !!process.env.REDIS_URL;
        
        if (this.enabled) {
            this.client = redis.createClient({
                url: process.env.REDIS_URL
            });

            this.client.connect().catch(err => {
                console.error('Redis connection error:', err);
                this.enabled = false;
            });

            this.client.on('error', (err) => {
                console.error('Redis error:', err);
            });
        }

        this.memoryCache = new Map();
        this.maxMemoryCacheSize = 1000;
    }

    /**
     * Get cached value
     */
    async get(key) {
        if (this.enabled && this.client.isOpen) {
            try {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            } catch (error) {
                console.error('Cache get error:', error);
                return this.memoryCache.get(key);
            }
        }

        return this.memoryCache.get(key);
    }

    /**
     * Set cached value
     */
    async set(key, value, ttl = 3600) {
        const stringValue = JSON.stringify(value);

        if (this.enabled && this.client.isOpen) {
            try {
                await this.client.setEx(key, ttl, stringValue);
            } catch (error) {
                console.error('Cache set error:', error);
            }
        }

        // Also set in memory cache
        this.memoryCache.set(key, value);

        // Cleanup memory cache if too large
        if (this.memoryCache.size > this.maxMemoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        // Set timeout for memory cache
        setTimeout(() => {
            this.memoryCache.delete(key);
        }, ttl * 1000);
    }

    /**
     * Delete cached value
     */
    async delete(key) {
        if (this.enabled && this.client.isOpen) {
            try {
                await this.client.del(key);
            } catch (error) {
                console.error('Cache delete error:', error);
            }
        }

        this.memoryCache.delete(key);
    }

    /**
     * Clear all cache
     */
    async clear(pattern = '*') {
        if (this.enabled && this.client.isOpen) {
            try {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(keys);
                }
            } catch (error) {
                console.error('Cache clear error:', error);
            }
        }

        if (pattern === '*') {
            this.memoryCache.clear();
        }
    }

    /**
     * Wrap function with caching
     */
    async wrap(key, fn, ttl = 3600) {
        // Check cache first
        const cached = await this.get(key);
        if (cached !== null && cached !== undefined) {
            return cached;
        }

        // Execute function
        const result = await fn();

        // Cache result
        await this.set(key, result, ttl);

        return result;
    }

    /**
     * Invalidate related caches
     */
    async invalidatePattern(pattern) {
        if (this.enabled && this.client.isOpen) {
            try {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(keys);
                }
            } catch (error) {
                console.error('Cache invalidate error:', error);
            }
        }

        // Invalidate memory cache
        for (const key of this.memoryCache.keys()) {
            if (this.matchPattern(key, pattern)) {
                this.memoryCache.delete(key);
            }
        }
    }

    /**
     * Match key against pattern
     */
    matchPattern(key, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(key);
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        const stats = {
            memoryCache: {
                size: this.memoryCache.size,
                maxSize: this.maxMemoryCacheSize
            },
            redis: {
                enabled: this.enabled,
                connected: this.enabled && this.client.isOpen
            }
        };

        if (this.enabled && this.client.isOpen) {
            try {
                const info = await this.client.info('stats');
                stats.redis.info = info;
            } catch (error) {
                console.error('Cache stats error:', error);
            }
        }

        return stats;
    }
}

module.exports = new CacheService();