// services/PerformanceMonitoringService.js
const os = require('os');
const TrackingSession = require('../models/TrackingSession');

class PerformanceMonitoringService {
    constructor() {
        this.metrics = {
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
            responseTimes: [],
            memoryUsage: [],
            cpuUsage: []
        };

        this.startMonitoring();
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        // Monitor system resources every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Clean old metrics every hour
        setInterval(() => {
            this.cleanOldMetrics();
        }, 3600000);
    }

    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss
        });

        this.metrics.cpuUsage.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });

        // Keep only last 1000 entries
        if (this.metrics.memoryUsage.length > 1000) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-1000);
        }
        if (this.metrics.cpuUsage.length > 1000) {
            this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-1000);
        }
    }

    /**
     * Track request
     */
    trackRequest(duration, success = true) {
        this.metrics.requests++;
        if (!success) this.metrics.errors++;

        this.metrics.responseTimes.push({
            timestamp: Date.now(),
            duration
        });

        // Keep only last 10000 response times
        if (this.metrics.responseTimes.length > 10000) {
            this.metrics.responseTimes = this.metrics.responseTimes.slice(-10000);
        }

        // Calculate average
        const total = this.metrics.responseTimes.reduce((sum, rt) => sum + rt.duration, 0);
        this.metrics.avgResponseTime = total / this.metrics.responseTimes.length;
    }

    /**
     * Get performance report
     */
    async getPerformanceReport() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        // Recent response times
        const recentResponses = this.metrics.responseTimes.filter(
            rt => rt.timestamp > oneHourAgo
        );

        const avgResponseTime = recentResponses.length > 0
            ? recentResponses.reduce((sum, rt) => sum + rt.duration, 0) / recentResponses.length
            : 0;

        const p95ResponseTime = this.calculatePercentile(
            recentResponses.map(rt => rt.duration),
            95
        );

        const p99ResponseTime = this.calculatePercentile(
            recentResponses.map(rt => rt.duration),
            99
        );

        // Memory usage
        const recentMemory = this.metrics.memoryUsage.filter(
            m => m.timestamp > oneHourAgo
        );

        const avgMemoryUsage = recentMemory.length > 0
            ? recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length
            : 0;

        // System info
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            uptime: os.uptime()
        };

        // Database performance
        const dbStats = await this.getDatabaseStats();

        return {
            timestamp: now,
            requests: {
                total: this.metrics.requests,
                errors: this.metrics.errors,
                errorRate: (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%',
                requestsPerMinute: (recentResponses.length / 60).toFixed(2)
            },
            responseTime: {
                avg: Math.round(avgResponseTime),
                p95: Math.round(p95ResponseTime),
                p99: Math.round(p99ResponseTime),
                unit: 'ms'
            },
            memory: {
                current: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                avg: Math.round(avgMemoryUsage / 1024 / 1024),
                unit: 'MB'
            },
            system: systemInfo,
            database: dbStats,
            health: this.getHealthStatus()
        };
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        try {
            const stats = await TrackingSession.db.db.stats();
            
            return {
                collections: stats.collections,
                dataSize: Math.round(stats.dataSize / 1024 / 1024) + ' MB',
                indexSize: Math.round(stats.indexSize / 1024 / 1024) + ' MB',
                avgObjSize: Math.round(stats.avgObjSize) + ' bytes'
            };
        } catch (error) {
            return { error: 'Unable to fetch database stats' };
        }
    }

    /**
     * Calculate percentile
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;

        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const errorRate = this.metrics.requests > 0
            ? (this.metrics.errors / this.metrics.requests) * 100
            : 0;

        const memUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;

        let status = 'healthy';
        const issues = [];

        if (errorRate > 5) {
            status = 'degraded';
            issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
        }

        if (errorRate > 10) {
            status = 'unhealthy';
        }

        if (memUsage > 90) {
            status = 'degraded';
            issues.push(`High memory usage: ${memUsage.toFixed(2)}%`);
        }

        if (this.metrics.avgResponseTime > 1000) {
            status = 'degraded';
            issues.push(`Slow response time: ${this.metrics.avgResponseTime.toFixed(2)}ms`);
        }

        return {
            status,
            issues,
            score: this.calculateHealthScore()
        };
    }

    /**
     * Calculate overall health score (0-100)
     */
    calculateHealthScore() {
        let score = 100;

        const errorRate = this.metrics.requests > 0
            ? (this.metrics.errors / this.metrics.requests) * 100
            : 0;

        const memUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;

        // Deduct for errors
        score -= errorRate * 2;

        // Deduct for high memory usage
        if (memUsage > 80) score -= (memUsage - 80) * 2;

        // Deduct for slow response times
        if (this.metrics.avgResponseTime > 500) {
            score -= (this.metrics.avgResponseTime - 500) / 10;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Clean old metrics
     */
    cleanOldMetrics() {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        this.metrics.responseTimes = this.metrics.responseTimes.filter(
            rt => rt.timestamp > oneHourAgo
        );

        this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
            m => m.timestamp > oneHourAgo
        );

        this.metrics.cpuUsage = this.metrics.cpuUsage.filter(
            c => c.timestamp > oneHourAgo
        );
    }

    /**
     * Get slow queries
     */
    async getSlowQueries(threshold = 1000) {
        // This would require MongoDB profiling to be enabled
        // For now, return placeholder
        return {
            message: 'Enable MongoDB profiling to track slow queries',
            threshold: `${threshold}ms`
        };
    }
}

module.exports = new PerformanceMonitoringService();