const TrackingSession = require('../models/TrackingSession');
const PageAnalytics = require('../models/PageAnalytics');
const asyncHandler = require('express-async-handler');

// In-memory analytics storage for basic tracking
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

// Enhanced Analytics Controller
class AnalyticsController {
    // Track visitor
    trackVisitor = asyncHandler(async (req, res) => {
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

    // Get basic analytics data
    getBasicAnalytics = asyncHandler(async (req, res) => {
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
    // Get overview analytics
    getOverview = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);
        
        // Mock data for overview - structured to match frontend expectations
        const overviewData = {
            overview: {
                summary: {
                    totalViews: 1247,
                    uniqueVisitors: 842,
                    avgSessionDuration: 125,
                    bounceRate: 42.5,
                    conversionRate: 3.2,
                    pageviewsPerSession: 2.8,
                    totalRevenue: 12450,
                    realtimeUsers: 12,
                    goalCompletions: 42,
                    newVsReturning: {
                        new: 60,
                        returning: 40
                    }
                },
                trends: {
                    viewsChange: 0.125,
                    visitorsChange: 0.085,
                    engagementChange: 0.052,
                    conversionChange: 0.021,
                    revenueChange: 0.157
                },
                trafficSources: {
                    direct: 45,
                    search: 30,
                    social: 15,
                    referral: 10
                },
                topPages: [
                    { path: '/', views: 342, title: 'Home' },
                    { path: '/projects', views: 287, title: 'Projects' },
                    { path: '/contact', views: 198, title: 'Contact' },
                    { path: '/about', views: 176, title: 'About' }
                ],
                trafficTrend: [
                    { date: '2024-01-01', views: 50 },
                    { date: '2024-01-02', views: 75 },
                    { date: '2024-01-03', views: 89 },
                    { date: '2024-01-04', views: 120 },
                    { date: '2024-01-05', views: 156 },
                    { date: '2024-01-06', views: 201 },
                    { date: '2024-01-07', views: 234 }
                ]
            }
        };

        res.json({
            success: true,
            data: overviewData
        });
    });

    // Get traffic analytics
    getTrafficAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d', device = 'all', country = 'all', source = 'all', page = 'all' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const trafficData = {
            traffic: {
                sources: [
                    { source: 'Direct', visits: 560, percentage: 45, bounce: 35, avgDuration: '2m 30s' },
                    { source: 'Organic Search', visits: 375, percentage: 30, bounce: 42, avgDuration: '3m 45s' },
                    { source: 'Social Media', visits: 187, percentage: 15, bounce: 55, avgDuration: '1m 45s' },
                    { source: 'Referral', visits: 125, percentage: 10, bounce: 28, avgDuration: '4m 20s' }
                ],
                referrers: [
                    { url: 'google.com', visits: 287, change: 12.5 },
                    { url: 'github.com', visits: 123, change: -5.2 },
                    { url: 'linkedin.com', visits: 98, change: 8.3 },
                    { url: 'twitter.com', visits: 76, change: 15.7 },
                    { url: 'facebook.com', visits: 45, change: -2.1 }
                ],
                campaigns: [
                    { name: 'Summer Campaign', roi: 15.2, clicks: 124, conversions: 8 },
                    { name: 'Portfolio Showcase', roi: 12.7, clicks: 89, conversions: 6 },
                    { name: 'Developer Focus', roi: 8.3, clicks: 67, conversions: 3 },
                    { name: 'React Promotion', roi: 22.1, clicks: 45, conversions: 5 }
                ],
                keywords: [
                    { keyword: 'portfolio developer', position: 3, traffic: 124, change: 12.5 },
                    { keyword: 'react developer', position: 8, traffic: 89, change: -3.2 },
                    { keyword: 'javascript portfolio', position: 12, traffic: 76, change: 8.7 },
                    { keyword: 'web developer', position: 15, traffic: 65, change: 5.3 }
                ],
                totalVisitors: 1247,
                uniqueVisitors: 842,
                pageViews: 2103,
                avgSessionDuration: 125,
                bounceRate: 42.5,
                pagesPerSession: 2.8,
                devices: {
                    desktop: 65,
                    mobile: 30,
                    tablet: 5
                },
                countries: [
                    { name: 'United States', visitors: 321, percentage: 38.2 },
                    { name: 'Canada', visitors: 187, percentage: 22.3 },
                    { name: 'United Kingdom', visitors: 156, percentage: 18.5 },
                    { name: 'Germany', visitors: 132, percentage: 15.7 },
                    { name: 'Australia', visitors: 45, percentage: 5.3 }
                ],
                topPages: [
                    { path: '/', views: 342, title: 'Home' },
                    { path: '/projects', views: 287, title: 'Projects' },
                    { path: '/contact', views: 198, title: 'Contact' },
                    { path: '/about', views: 176, title: 'About' }
                ],
                trafficTrend: [
                    { date: '2024-01-01', visitors: 100 },
                    { date: '2024-01-02', visitors: 115 },
                    { date: '2024-01-03', visitors: 129 },
                    { date: '2024-01-04', visitors: 150 },
                    { date: '2024-01-05', visitors: 176 },
                    { date: '2024-01-06', visitors: 201 },
                    { date: '2024-01-07', visitors: 234 }
                ]
            }
        };

        res.json({
            success: true,
            data: trafficData
        });
    });

    // Get behavior analytics
    getBehaviorAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d', device = 'all', country = 'all', source = 'all', page = 'all' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const behaviorData = {
            behavior: {
                pageViews: [
                    { page: '/', views: 1247, uniqueViews: 842, bounceRate: 42.5, exitRate: 65.2 },
                    { page: '/projects', views: 876, uniqueViews: 654, bounceRate: 38.2, exitRate: 52.1 },
                    { page: '/contact', views: 543, uniqueViews: 421, bounceRate: 28.7, exitRate: 42.3 },
                    { page: '/about', views: 432, uniqueViews: 321, bounceRate: 35.1, exitRate: 58.7 },
                    { page: '/services', views: 321, uniqueViews: 234, bounceRate: 45.2, exitRate: 62.3 }
                ],
                userFlow: [
                    { from: '/', to: '/projects', users: 421 },
                    { from: '/projects', to: '/contact', users: 234 },
                    { from: '/', to: '/about', users: 189 },
                    { from: '/contact', to: '/services', users: 123 }
                ],
                eventTracking: [
                    { name: 'Contact Form Submit', category: 'Forms', count: 142, conversionRate: 8.5 },
                    { name: 'Project Click', category: 'Engagement', count: 890, conversionRate: 2.3 },
                    { name: 'Download CV', category: 'Downloads', count: 67, conversionRate: 12.1 },
                    { name: 'Social Link Click', category: 'Social', count: 234, conversionRate: 0.8 }
                ],
                searchTerms: [
                    { term: 'portfolio developer', count: 124, clicks: 12 },
                    { term: 'react developer', count: 89, clicks: 8 },
                    { term: 'javascript portfolio', count: 76, clicks: 6 },
                    { term: 'web developer', count: 65, clicks: 5 }
                ],
                avgTimeOnPage: 85,
                avgPagesPerSession: 2.8,
                bounceRate: 42.5,
                exitRate: 65.2,
                topExitPages: [
                    { path: '/contact', exitRate: 78.5 },
                    { path: '/projects', exitRate: 65.2 },
                    { path: '/about', exitRate: 58.3 }
                ],
                scrollDepth: {
                    avgDepth: 65,
                    deepScrolls: 32,
                    mediumScrolls: 45
                },
                popularPaths: [
                    { path: '/', next: '/projects', count: 142 },
                    { path: '/projects', next: '/contact', count: 89 },
                    { path: '/', next: '/about', count: 76 }
                ]
            }
        };

        res.json({
            success: true,
            data: behaviorData
        });
    });

    // Get conversion analytics
    getConversionAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d', device = 'all', country = 'all', source = 'all', page = 'all' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const conversionData = {
            conversion: {
                goals: [
                    { id: 1, name: 'Increase Traffic', target: 2000, current: 1247, progress: 62.35, deadline: '2024-06-30', status: 'in_progress' },
                    { id: 2, name: 'Improve Conversion', target: 5, current: 3.2, progress: 64, deadline: '2024-06-30', status: 'in_progress' },
                    { id: 3, name: 'Reduce Bounce Rate', target: 35, current: 42.5, progress: 35.5, deadline: '2024-06-30', status: 'progressing' },
                    { id: 4, name: 'Page Speed', target: 90, current: 85, progress: 94.44, deadline: '2024-06-30', status: 'in_progress' }
                ],
                funnel: [
                    { stage: 'Visitors', users: 1247, conversion: 100.0 },
                    { stage: 'Viewed Projects', users: 342, conversion: 27.4 },
                    { stage: 'Contact Page', users: 198, conversion: 15.9 },
                    { stage: 'Contact Form', users: 125, conversion: 10.0 },
                    { stage: 'Submitted', users: 42, conversion: 3.4 }
                ],
                attribution: [
                    { channel: 'Organic Search', firstClick: '42%', lastClick: '52%', linear: '38%' },
                    { channel: 'Direct', firstClick: '28%', lastClick: '22%', linear: '35%' },
                    { channel: 'Social Media', firstClick: '15%', lastClick: '18%', linear: '17%' },
                    { channel: 'Email', firstClick: '8%', lastClick: '5%', linear: '7%' },
                    { channel: 'Referral', firstClick: '7%', lastClick: '3%', linear: '3%' }
                ],
                cohortAnalysis: [
                    { week: 'Week 1', users: 1000, retention1: 65, retention2: 42, retention3: 28, retention4: 18 },
                    { week: 'Week 2', users: 1100, retention1: 68, retention2: 45, retention3: 31, retention4: 21 },
                    { week: 'Week 3', users: 950, retention1: 62, retention2: 39, retention3: 25, retention4: 15 }
                ],
                conversionRate: 3.2,
                totalConversions: 42,
                revenue: 12450,
                topConvertingPages: [
                    { path: '/contact', conversionRate: 8.5 },
                    { path: '/projects', conversionRate: 5.2 },
                    { path: '/', conversionRate: 2.1 }
                ],
                conversionBySource: {
                    direct: 3.1,
                    search: 4.2,
                    social: 2.8,
                    referral: 5.1
                },
                conversionTrend: [
                    { date: '2024-01-01', conversions: 3 },
                    { date: '2024-01-02', conversions: 5 },
                    { date: '2024-01-03', conversions: 4 },
                    { date: '2024-01-04', conversions: 7 },
                    { date: '2024-01-05', conversions: 9 },
                    { date: '2024-01-06', conversions: 8 },
                    { date: '2024-01-07', conversions: 6 }
                ]
            }
        };

        res.json({
            success: true,
            data: conversionData
        });
    });

    // Get technical analytics
    getTechnicalAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d', device = 'all', country = 'all', source = 'all', page = 'all' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const technical = {
            avgLoadTime: 2.3,
            pageSpeed: 85,
            errorRate: 0.8,
            uptime: 99.9,
            topPerformingPages: [
                { path: '/', loadTime: 1.2, score: 95 },
                { path: '/about', loadTime: 1.5, score: 92 },
                { path: '/projects', loadTime: 2.1, score: 88 }
            ],
            slowestPages: [
                { path: '/assets/hero-video.mp4', loadTime: 8.7, score: 45 },
                { path: '/contact', loadTime: 3.4, score: 76 }
            ],
            browserCompatibility: {
                chrome: 85,
                firefox: 82,
                safari: 78,
                edge: 80
            },
            devicePerformance: {
                desktop: 89,
                mobile: 76,
                tablet: 82
            }
        };

        res.json({
            success: true,
            data: technical
        });
    });

    // Get social media analytics
    getSocialMediaAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const social = {
            totalReferrals: 187,
            engagementRate: 4.2,
            topPosts: [
                { title: 'New Portfolio Design', platform: 'LinkedIn', interactions: 45 },
                { title: 'Project Showcase', platform: 'Twitter', interactions: 32 },
                { title: 'Tech Article', platform: 'Facebook', interactions: 28 }
            ],
            sharesByPlatform: {
                linkedin: 45,
                twitter: 38,
                facebook: 32,
                instagram: 28,
                whatsapp: 22,
                other: 22
            },
            referralSources: {
                linkedin: 45,
                twitter: 38,
                facebook: 32,
                reddit: 28,
                github: 22,
                other: 22
            },
            socialTrend: [
                { date: '2024-01-01', referrals: 12 },
                { date: '2024-01-02', referrals: 15 },
                { date: '2024-01-03', referrals: 18 },
                { date: '2024-01-04', referrals: 22 },
                { date: '2024-01-05', referrals: 25 },
                { date: '2024-01-06', referrals: 32 },
                { date: '2024-01-07', referrals: 43 }
            ]
        };

        res.json({
            success: true,
            data: social
        });
    });

    // Get SEO analytics
    getSEOAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const seo = {
            organicTraffic: 842,
            searchRankings: 12,
            backlinks: 45,
            impressions: 12456,
            clickThroughRate: 3.2,
            topKeywords: [
                { keyword: 'portfolio', position: 3, traffic: 420 },
                { keyword: 'developer', position: 5, traffic: 320 },
                { keyword: 'react', position: 8, traffic: 180 }
            ],
            indexedPages: 24,
            crawlErrors: 2,
            mobileFriendly: true,
            pageSpeed: 85,
            coreWebVitals: {
                lcp: 2.3,
                fcp: 1.2,
                cls: 0.05,
                ttfb: 0.3
            },
            seoScore: 89
        };

        res.json({
            success: true,
            data: seo
        });
    });

    // Get competitor analytics
    getCompetitorAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;
        const dateFilter = this.getDateFilter(timeRange);

        const competitors = {
            topCompetitors: [
                { name: 'Competitor A', traffic: 2450, growth: 12.5 },
                { name: 'Competitor B', traffic: 1890, growth: 8.3 },
                { name: 'Competitor C', traffic: 1560, growth: 5.7 }
            ],
            marketShare: [
                { name: 'You', share: 25 },
                { name: 'Competitor A', share: 35 },
                { name: 'Competitor B', share: 20 },
                { name: 'Others', share: 20 }
            ],
            keywordOverlap: [
                { keyword: 'portfolio', competitors: 3, overlap: 78 },
                { keyword: 'developer', competitors: 4, overlap: 65 },
                { keyword: 'react', competitors: 2, overlap: 55 }
            ],
            contentComparison: {
                contentLength: 1200,
                updateFrequency: 'weekly',
                contentQuality: 85
            }
        };

        res.json({
            success: true,
            data: competitors
        });
    });

    // Get goals progress
    getGoalsProgress = asyncHandler(async (req, res) => {
        const goals = [
            { 
                id: 1,
                name: 'Increase Traffic', 
                target: 2000, 
                current: 1247, 
                progress: 62.35,
                deadline: '2024-06-30',
                status: 'in_progress'
            },
            { 
                id: 2,
                name: 'Improve Conversion', 
                target: 5, 
                current: 3.2, 
                progress: 64,
                deadline: '2024-06-30',
                status: 'in_progress'
            },
            { 
                id: 3,
                name: 'Reduce Bounce Rate', 
                target: 35, 
                current: 42.5, 
                progress: 35.5, // This represents how far along we are toward the goal
                deadline: '2024-06-30',
                status: 'progressing'
            },
            { 
                id: 4,
                name: 'Page Speed', 
                target: 90, 
                current: 85, 
                progress: 94.44,
                deadline: '2024-06-30',
                status: 'in_progress'
            }
        ];

        res.json({
            success: true,
            data: goals
        });
    });

    // Get heatmap data
    getHeatmapData = asyncHandler(async (req, res) => {
        const { page = 'all' } = req.query;

        const heatmap = {
            clicks: [
                { x: 15, y: 25, count: 45 },
                { x: 45, y: 60, count: 32 },
                { x: 75, y: 100, count: 28 },
                { x: 30, y: 80, count: 22 },
                { x: 60, y: 120, count: 18 }
            ],
            scrollDepth: [
                { depth: 25, count: 1247 },
                { depth: 50, count: 1089 },
                { depth: 75, count: 890 },
                { depth: 100, count: 567 }
            ],
            hotspots: [
                { element: 'CTA Button', interactions: 45, conversionRate: 8.2 },
                { element: 'Hero Image', interactions: 32, conversionRate: 2.1 },
                { element: 'Project Cards', interactions: 78, conversionRate: 5.6 }
            ]
        };

        res.json({
            success: true,
            data: heatmap
        });
    });

    // Get A/B test results
    getABTestResults = asyncHandler(async (req, res) => {
        const tests = [
            {
                id: 1,
                name: 'Hero CTA Button',
                variantA: { name: 'Original', conversion: 2.5, sample: 1200 },
                variantB: { name: 'New', conversion: 3.8, sample: 1180 },
                winner: 'B',
                confidence: 95.2,
                status: 'completed'
            },
            {
                id: 2,
                name: 'Contact Form',
                variantA: { name: '4 Fields', conversion: 4.2, sample: 800 },
                variantB: { name: '3 Fields', conversion: 5.1, sample: 780 },
                winner: 'B',
                confidence: 92.8,
                status: 'running'
            },
            {
                id: 3,
                name: 'Navigation',
                variantA: { name: 'Top', conversion: 3.1, sample: 900 },
                variantB: { name: 'Side', conversion: 2.9, sample: 890 },
                winner: null,
                confidence: 52.3,
                status: 'running'
            }
        ];

        res.json({
            success: true,
            data: tests
        });
    });

    // Get user retention
    getUserRetention = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;

        const retention = {
            day1: 65.3,
            day7: 42.1,
            day14: 28.7,
            day30: 18.2,
            day90: 12.5,
            trend: [
                { day: 1, rate: 65.3 },
                { day: 7, rate: 42.1 },
                { day: 14, rate: 28.7 },
                { day: 30, rate: 18.2 }
            ],
            cohortAnalysis: [
                { cohort: 'Jan 2024', day1: 72.5, day7: 48.2 },
                { cohort: 'Feb 2024', day1: 68.3, day7: 45.1 },
                { cohort: 'Mar 2024', day1: 65.2, day7: 42.1 }
            ]
        };

        res.json({
            success: true,
            data: retention
        });
    });

    // Get conversion funnel
    getConversionFunnel = asyncHandler(async (req, res) => {
        const { timeRange = '7d' } = req.query;

        const funnel = [
            { step: 'Visitors', count: 1247, conversion: 100.0 },
            { step: 'Viewed Projects', count: 342, conversion: 27.4 },
            { step: 'Contact Page', count: 198, conversion: 15.9 },
            { step: 'Contact Form', count: 125, conversion: 10.0 },
            { step: 'Submitted', count: 42, conversion: 3.4 }
        ];

        res.json({
            success: true,
            data: funnel
        });
    });

    // Get analytics alerts
    getAnalyticsAlerts = asyncHandler(async (req, res) => {
        const alerts = [
            { 
                id: 1, 
                type: 'performance', 
                severity: 'high', 
                message: 'Page load time increased by 45%', 
                timestamp: new Date(Date.now() - 3600000),
                resolved: false
            },
            { 
                id: 2, 
                type: 'conversion', 
                severity: 'medium', 
                message: 'Conversion rate dropped by 15%', 
                timestamp: new Date(Date.now() - 7200000),
                resolved: false
            },
            { 
                id: 3, 
                type: 'traffic', 
                severity: 'low', 
                message: 'Traffic from social media increased by 25%', 
                timestamp: new Date(Date.now() - 10800000),
                resolved: true
            },
            { 
                id: 4, 
                type: 'technical', 
                severity: 'high', 
                message: 'Error rate increased to 2.3%', 
                timestamp: new Date(Date.now() - 14400000),
                resolved: false
            }
        ];

        res.json({
            success: true,
            data: alerts
        });
    });

    // Helper method to get date filter
    getDateFilter(timeRange) {
        const now = new Date();
        let startTime;

        switch (timeRange) {
            case 'realtime':
                startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes
                break;
            case 'today':
                startTime = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.setHours(0, 0, 0, 0));
        }

        return { startTime: { $gte: startTime } };
    }
}

module.exports = new AnalyticsController();