const Visitor = require('../models/Visitor.model');
const Review = require('../models/Review.model');

class TrackingController {
    // Initialize visitor session
    async initSession(req, res) {
        try {
            const {
                sessionId,
                fingerprint,
                device,
                location,
                referrer
            } = req.body;

            // Check if session exists
            let visitor = await Visitor.findOne({ sessionId });

            if (!visitor) {
                visitor = new Visitor({
                    sessionId,
                    fingerprint,
                    ip: req.ip,
                    device,
                    location,
                    referrer,
                    status: 'active'
                });
                await visitor.save();
            } else {
                visitor.status = 'active';
                visitor.lastActivity = new Date();
                await visitor.save();
            }

            res.json({
                success: true,
                sessionId: visitor.sessionId,
                visitorId: visitor._id
            });
        } catch (error) {
            console.error('Init session error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Track page view
    async trackPageView(req, res) {
        try {
            const { sessionId, page } = req.body;

            const visitor = await Visitor.findOne({ sessionId });
            if (!visitor) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            // End previous page if exists
            if (visitor.pages.length > 0) {
                const lastPage = visitor.pages[visitor.pages.length - 1];
                if (!lastPage.exitedAt) {
                    lastPage.exitedAt = new Date();
                    lastPage.timeSpent = lastPage.exitedAt - lastPage.enteredAt;
                }
            }

            // Add new page
            visitor.pages.push({
                path: page.path,
                title: page.title,
                enteredAt: new Date(),
                scrollDepth: 0,
                interactions: {
                    clicks: 0,
                    hovers: 0,
                    formSubmissions: 0
                }
            });

            visitor.engagement.pagesViewed = visitor.pages.length;
            visitor.lastActivity = new Date();

            await visitor.save();
            await this.analyzeEngagement(visitor);

            res.json({ success: true });
        } catch (error) {
            console.error('Track page error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Track event (click, scroll, etc.)
    async trackEvent(req, res) {
        try {
            const { sessionId, event } = req.body;

            const visitor = await Visitor.findOne({ sessionId });
            if (!visitor) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            // Add event
            visitor.events.push({
                type: event.type,
                element: event.element,
                elementId: event.elementId,
                elementClass: event.elementClass,
                page: event.page,
                timestamp: new Date(),
                data: event.data
            });

            // Update current page interactions
            if (visitor.pages.length > 0) {
                const currentPage = visitor.pages[visitor.pages.length - 1];
                
                if (event.type === 'click') {
                    currentPage.interactions.clicks++;
                } else if (event.type === 'hover') {
                    currentPage.interactions.hovers++;
                } else if (event.type === 'form_submit') {
                    currentPage.interactions.formSubmissions++;
                } else if (event.type === 'scroll') {
                    currentPage.scrollDepth = Math.max(currentPage.scrollDepth, event.data?.depth || 0);
                }
            }

            visitor.engagement.interactions = visitor.events.length;
            visitor.lastActivity = new Date();

            await visitor.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Track event error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // AI Analysis of visitor behavior
    async analyzeEngagement(visitor) {
        try {
            const insights = {
                intentScore: 0,
                engagementLevel: 'low',
                interests: [],
                likelyNextAction: '',
                conversionProbability: 0,
                behaviorPattern: ''
            };

            // Calculate intent score based on engagement
            const totalTime = visitor.engagement.totalTimeSpent / 1000; // in seconds
            const pagesViewed = visitor.engagement.pagesViewed;
            const interactions = visitor.engagement.interactions;
            
            let score = 0;
            score += Math.min(totalTime / 60, 10) * 10; // Time: max 100 points
            score += Math.min(pagesViewed * 5, 30); // Pages: max 30 points
            score += Math.min(interactions * 2, 60); // Interactions: max 60 points

            insights.intentScore = Math.min(Math.round(score), 100);

            // Engagement level
            if (insights.intentScore >= 80) {
                insights.engagementLevel = 'very_high';
            } else if (insights.intentScore >= 60) {
                insights.engagementLevel = 'high';
            } else if (insights.intentScore >= 30) {
                insights.engagementLevel = 'medium';
            } else {
                insights.engagementLevel = 'low';
            }

            // Detect interests from pages visited
            const pages = visitor.pages.map(p => p.path);
            if (pages.filter(p => p.includes('project')).length >= 2) {
                insights.interests.push('Projects');
            }
            if (pages.filter(p => p.includes('skill')).length >= 1) {
                insights.interests.push('Skills');
            }
            if (pages.filter(p => p.includes('contact')).length >= 1) {
                insights.interests.push('Contact');
            }
            if (pages.filter(p => p.includes('collaborate')).length >= 1) {
                insights.interests.push('Collaboration');
            }

            // Predict next action
            if (insights.engagementLevel === 'very_high' && !pages.includes('/contact')) {
                insights.likelyNextAction = 'Contact Form';
                insights.conversionProbability = 75;
            } else if (insights.interests.includes('Projects')) {
                insights.likelyNextAction = 'View More Projects';
                insights.conversionProbability = 45;
            } else {
                insights.likelyNextAction = 'Continue Browsing';
                insights.conversionProbability = 20;
            }

            // Behavior pattern
            if (totalTime > 300 && pagesViewed > 5) {
                insights.behaviorPattern = 'Explorer - Thoroughly reviewing content';
            } else if (interactions > 20) {
                insights.behaviorPattern = 'Active - Highly interactive user';
            } else if (pagesViewed <= 2 && totalTime < 30) {
                insights.behaviorPattern = 'Quick Visitor - Brief overview';
            } else {
                insights.behaviorPattern = 'Casual - Normal browsing';
            }

            visitor.aiInsights = insights;
            await visitor.save();

            return insights;
        } catch (error) {
            console.error('AI analysis error:', error);
            return null;
        }
    }

    // Get real-time analytics
    async getRealTimeAnalytics(req, res) {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            const [
                activeVisitors,
                recentVisitors,
                totalToday,
                topPages,
                locations,
                devices
            ] = await Promise.all([
                Visitor.countDocuments({ 
                    status: 'active', 
                    lastActivity: { $gte: fiveMinutesAgo } 
                }),
                Visitor.find({ 
                    lastActivity: { $gte: fiveMinutesAgo } 
                })
                    .select('sessionId location device engagement aiInsights pages lastActivity')
                    .sort({ lastActivity: -1 })
                    .limit(20),
                Visitor.countDocuments({
                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }),
                Visitor.aggregate([
                    { $unwind: '$pages' },
                    { $group: { _id: '$pages.path', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]),
                Visitor.aggregate([
                    { $match: { 'location.country': { $exists: true } } },
                    { $group: { _id: '$location.country', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]),
                Visitor.aggregate([
                    { $group: { 
                        _id: null,
                        mobile: { $sum: { $cond: ['$device.isMobile', 1, 0] } },
                        desktop: { $sum: { $cond: ['$device.isMobile', 0, 1] } }
                    }}
                ])
            ]);

            res.json({
                success: true,
                analytics: {
                    activeNow: activeVisitors,
                    todayTotal: totalToday,
                    recentVisitors,
                    topPages,
                    locations,
                    devices: devices[0] || { mobile: 0, desktop: 0 }
                }
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Submit review
    async submitReview(req, res) {
        try {
            const {
                sessionId,
                name,
                email,
                rating,
                title,
                comment,
                categories,
                projectReviewed
            } = req.body;

            if (!name || !rating || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, rating, and comment are required'
                });
            }

            const visitor = await Visitor.findOne({ sessionId });

            const review = new Review({
                visitorId: visitor?._id,
                name,
                email,
                rating,
                title,
                comment,
                categories,
                projectReviewed,
                metadata: {
                    userAgent: req.headers['user-agent'],
                    ip: req.ip,
                    location: visitor?.location?.country
                }
            });

            await review.save();

            // Mark visitor as converted
            if (visitor) {
                visitor.engagement.converted = true;
                await visitor.save();
            }

            res.json({
                success: true,
                message: 'Thank you for your review!',
                review: {
                    id: review._id,
                    rating: review.rating
                }
            });
        } catch (error) {
            console.error('Submit review error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get reviews
    async getReviews(req, res) {
        try {
            const { status = 'approved', limit = 10 } = req.query;

            const reviews = await Review.find({ status })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            const stats = await Review.aggregate([
                { $match: { status: 'approved' } },
                { $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }}
            ]);

            res.json({
                success: true,
                reviews,
                stats: stats[0] || { avgRating: 0, totalReviews: 0 }
            });
        } catch (error) {
            console.error('Get reviews error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Approve/reject review
    async moderateReview(req, res) {
        try {
            const { id } = req.params;
            const { status, response } = req.body;

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }

            review.status = status;
            if (response) {
                review.response = {
                    text: response,
                    respondedBy: req.user?.id,
                    respondedAt: new Date()
                };
            }

            await review.save();

            res.json({ success: true, review });
        } catch (error) {
            console.error('Moderate review error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new TrackingController();
