// Cache Service - In-memory Cache Manager with TTL Support

const isDev = import.meta.env.DEV;

export const CACHE_TTL = {
    FIVE_MINUTES: 5 * 60 * 1000,
    TEN_MINUTES: 10 * 60 * 1000,
    THIRTY_MINUTES: 30 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    NO_CACHE: 0,
};

const CLEANUP_INTERVAL_MS = 60 * 1000;

class CacheService {
    constructor() {
        this._cache = new Map();
        this._hits = 0;
        this._misses = 0;
        this._cleanupTimer = null;
        this._startCleanup();
    }

    _startCleanup() {
        if (this._cleanupTimer) return;
        this._cleanupTimer = setInterval(() => {
            this._removeExpired();
        }, CLEANUP_INTERVAL_MS);
        if (typeof this._cleanupTimer.unref === 'function') {
            this._cleanupTimer.unref();
        }
    }

    _stopCleanup() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
    }

    _isExpired(entry) {
        return entry.expiry !== null && Date.now() >= entry.expiry;
    }

    _removeExpired() {
        const now = Date.now();
        for (const [key, entry] of this._cache) {
            if (entry.expiry !== null && now >= entry.expiry) {
                this._cache.delete(key);
                if (isDev) {
                    console.log(`[Cache] Expired key removed: ${key}`);
                }
            }
        }
    }

    get(key) {
        if (typeof key !== 'string' && typeof key !== 'number') {
            return null;
        }
        const entry = this._cache.get(key);
        if (entry === undefined) {
            this._misses++;
            return null;
        }
        if (this._isExpired(entry)) {
            this._cache.delete(key);
            this._misses++;
            return null;
        }
        this._hits++;
        if (isDev) {
            console.log(`[Cache] Hit: ${key}`);
        }
        return entry.value;
    }

    set(key, value, ttlMs = CACHE_TTL.FIVE_MINUTES) {
        try {
            const expiry = ttlMs === CACHE_TTL.NO_CACHE ? 0 : Date.now() + ttlMs;
            this._cache.set(key, { value, expiry });
            if (isDev) {
                console.log(`[Cache] Set: ${key} (TTL: ${ttlMs}ms)`);
            }
            return true;
        } catch (error) {
            console.error(`[Cache] Failed to set key "${key}":`, error);
            return false;
        }
    }

    delete(key) {
        return this._cache.delete(key);
    }

    clear() {
        this._cache.clear();
        this._hits = 0;
        this._misses = 0;
        if (isDev) {
            console.log('[Cache] Cleared');
        }
    }

    clearByPrefix(prefix) {
        if (typeof prefix !== 'string') return 0;
        let removed = 0;
        for (const key of this._cache.keys()) {
            if (key.startsWith(prefix)) {
                this._cache.delete(key);
                removed++;
            }
        }
        if (isDev && removed > 0) {
            console.log(`[Cache] Cleared ${removed} keys with prefix "${prefix}"`);
        }
        return removed;
    }

    has(key) {
        const entry = this._cache.get(key);
        if (entry === undefined) return false;
        if (this._isExpired(entry)) {
            this._cache.delete(key);
            return false;
        }
        return true;
    }

    async remember(key, ttlMs, fetchFn) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        try {
            const value = await fetchFn();
            this.set(key, value, ttlMs);
            return value;
        } catch (error) {
            console.error(`[Cache] Failed to remember key "${key}":`, error);
            throw error;
        }
    }

    getOrSet(key, ttlMs, fetchFn) {
        return this.remember(key, ttlMs, fetchFn);
    }

    stats() {
        return {
            size: this._cache.size,
            hits: this._hits,
            misses: this._misses,
            hitRate: this._hits + this._misses === 0
                ? 0
                : this._hits / (this._hits + this._misses),
            keys: Array.from(this._cache.keys()),
        };
    }

    destroy() {
        this._stopCleanup();
        this.clear();
    }
}

const cacheService = new CacheService();

export default cacheService;
