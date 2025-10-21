const express = require('express');
const router = express.Router();

// In-memory analytics storage
let analytics = {
    visitors: 0,
    pageViews: 0,
    uniqueVisitors: new Set(),
    topPages: {},
    topCountries: {},
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    browsers: {},
    recentVisitors: []
};

// Track visitor
router.post('/track', (req, res) => {
    try {
        const { page, country, device, browser, ip } = req.body;

        // Increment page views
        analytics.pageViews++;

        // Track unique visitor
        if (ip) {
            if (!analytics.uniqueVisitors.has(ip)) {
                analytics.uniqueVisitors.add(ip);
                analytics.visitors = analytics.uniqueVisitors.size;
            }
        }

        // Track page
        if (page) {
            analytics.topPages[page] = (analytics.topPages[page] || 0) + 1;
        }

        // Track country
        if (country) {
            analytics.topCountries[country] = (analytics.topCountries[country] || 0) + 1;
        }

        // Track device
        if (device && analytics.devices[device] !== undefined) {
            analytics.devices[device]++;
        }

        // Track browser
        if (browser) {
            analytics.browsers[browser] = (analytics.browsers[browser] || 0) + 1;
        }

        // Add to recent visitors
        analytics.recentVisitors.unshift({
            page,
            country,
            device,
            browser,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 visitors
        if (analytics.recentVisitors.length > 100) {
            analytics.recentVisitors.pop();
        }

        res.json({ success: true, message: 'Analytics tracked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get analytics data
router.get('/', (req, res) => {
    try {
        const topPages = Object.entries(analytics.topPages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([page, views]) => ({ page, views }));

        const topCountries = Object.entries(analytics.topCountries)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([country, visitors]) => ({ country, visitors }));

        const browsers = Object.entries(analytics.browsers)
            .sort(([, a], [, b]) => b - a)
            .map(([browser, count]) => ({ browser, count }));

        res.json({
            success: true,
            analytics: {
                totalVisitors: analytics.visitors,
                pageViews: analytics.pageViews,
                topPages,
                topCountries,
                devices: analytics.devices,
                browsers,
                recentVisitors: analytics.recentVisitors.slice(0, 20)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
