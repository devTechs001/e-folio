// services/AIAnalysisService.js
const TrackingSession = require('../models/TrackingSession');
const tf = require('@tensorflow/tfjs-node'); // Optional: for ML models

class AIAnalysisService {
    /**
     * Analyze session and generate AI insights
     */
    static async analyzeSession(session) {
        const insights = {
            engagementLevel: 'low',
            intentScore: 0,
            conversionProbability: 0,
            behaviorType: 'explorer',
            predictedActions: [],
            riskOfLeaving: 50
        };

        // Calculate engagement level
        insights.engagementLevel = this.calculateEngagementLevel(session);
        
        // Calculate intent score
        insights.intentScore = this.calculateIntentScore(session);
        
        // Calculate conversion probability
        insights.conversionProbability = this.calculateConversionProbability(session);
        
        // Determine behavior type
        insights.behaviorType = this.determineBehaviorType(session);
        
        // Predict next actions
        insights.predictedActions = this.predictNextActions(session);
        
        // Calculate risk of leaving
        insights.riskOfLeaving = this.calculateLeaveRisk(session);

        return insights;
    }

    /**
     * Calculate engagement level based on multiple factors
     */
    static calculateEngagementLevel(session) {
        let score = 0;
        const duration = session.duration || (Date.now() - session.startTime);

        // Duration scoring (0-30 points)
        if (duration > 5 * 60 * 1000) score += 30; // > 5 min
        else if (duration > 2 * 60 * 1000) score += 20; // > 2 min
        else if (duration > 1 * 60 * 1000) score += 10; // > 1 min
        else score += 5;

        // Pages viewed (0-25 points)
        score += Math.min(session.pagesViewed * 5, 25);

        // Clicks (0-20 points)
        score += Math.min(session.clicks * 2, 20);

        // Scroll depth (0-15 points)
        score += Math.min((session.scrollDepth / 100) * 15, 15);

        // Time on individual pages (0-10 points)
        const avgTimePerPage = session.timeOnPage?.length > 0
            ? session.timeOnPage.reduce((sum, p) => sum + p.duration, 0) / session.timeOnPage.length
            : 0;
        if (avgTimePerPage > 60000) score += 10; // > 1 min avg
        else if (avgTimePerPage > 30000) score += 5; // > 30s avg

        // Map score to engagement level
        if (score >= 80) return 'very_high';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Calculate intent score (0-100)
     */
    static calculateIntentScore(session) {
        let score = 0;

        // Base engagement score
        const engagementScores = { very_high: 40, high: 30, medium: 20, low: 10 };
        score += engagementScores[this.calculateEngagementLevel(session)] || 10;

        // Visited key pages
        const keyPages = ['/projects', '/contact', '/about', '/skills'];
        const visitedKeyPages = session.pageJourney?.filter(p => 
            keyPages.some(kp => p.path.includes(kp))
        ).length || 0;
        score += Math.min(visitedKeyPages * 10, 30);

        // Return visitor bonus
        if (session.userId) {
            score += 15;
        }

        // Traffic source quality
        if (session.source?.referrer) {
            if (/linkedin|github|behance/i.test(session.source.referrer)) {
                score += 10; // High-quality professional sources
            }
        }

        // Time-based factor
        const duration = session.duration || (Date.now() - session.startTime);
        if (duration > 3 * 60 * 1000) score += 5; // > 3 minutes

        return Math.min(score, 100);
    }

    /**
     * Calculate conversion probability
     */
    static calculateConversionProbability(session) {
        const intentScore = this.calculateIntentScore(session);
        let probability = intentScore * 0.5; // Base from intent

        // Visited contact page
        const visitedContact = session.pageJourney?.some(p => 
            p.path.includes('contact') || p.path.includes('hire')
        );
        if (visitedContact) probability += 20;

        // Viewed multiple projects
        const projectViews = session.pageJourney?.filter(p => 
            p.path.includes('project')
        ).length || 0;
        if (projectViews >= 3) probability += 15;

        // High engagement
        if (this.calculateEngagementLevel(session) === 'very_high') {
            probability += 10;
        }

        // Professional referrer
        if (session.source?.referrer && /linkedin|github/i.test(session.source.referrer)) {
            probability += 10;
        }

        return Math.min(probability, 100);
    }

    /**
     * Determine user behavior type
     */
    static determineBehaviorType(session) {
        const pagesViewed = session.pagesViewed || 0;
        const duration = session.duration || (Date.now() - session.startTime);
        const avgTimePerPage = pagesViewed > 0 ? duration / pagesViewed : 0;

        // Researcher: Few pages, long time per page
        if (pagesViewed <= 3 && avgTimePerPage > 90000) {
            return 'researcher';
        }

        // Explorer: Many pages, medium time
        if (pagesViewed >= 5 && avgTimePerPage > 30000 && avgTimePerPage < 90000) {
            return 'explorer';
        }

        // Buyer: Visited key pages, high intent
        if (this.calculateIntentScore(session) > 70) {
            return 'buyer';
        }

        // Searcher: Quick visits, looking for something specific
        if (pagesViewed >= 3 && avgTimePerPage < 30000) {
            return 'searcher';
        }

        return 'explorer';
    }

    /**
     * Predict next likely actions
     */
    static predictNextActions(session) {
        const predictions = [];
        const lastPage = session.pageJourney?.[session.pageJourney.length - 1]?.path || '/';

        // Based on current page
        if (lastPage.includes('project')) {
            predictions.push('View more projects', 'Visit contact page', 'Check GitHub');
        } else if (lastPage.includes('about') || lastPage === '/') {
            predictions.push('View projects', 'Check skills', 'Visit contact');
        } else if (lastPage.includes('skills')) {
            predictions.push('View projects', 'Download resume', 'Contact');
        } else if (lastPage.includes('contact')) {
            predictions.push('Submit form', 'Check social links', 'View projects again');
        }

        // Based on behavior type
        const behaviorType = this.determineBehaviorType(session);
        if (behaviorType === 'buyer' && !predictions.includes('Submit form')) {
            predictions.unshift('Submit contact form');
        }

        return predictions.slice(0, 3);
    }

    /**
     * Calculate risk of leaving (0-100)
     */
    static calculateLeaveRisk(session) {
        let risk = 50; // Base risk

        const duration = session.duration || (Date.now() - session.startTime);
        const timeSinceLastAction = Date.now() - (session.pageJourney?.[session.pageJourney.length - 1]?.timestamp || session.startTime);

        // Time since last action
        if (timeSinceLastAction > 2 * 60 * 1000) risk += 30; // 2+ min idle
        else if (timeSinceLastAction > 1 * 60 * 1000) risk += 15; // 1+ min idle
        else risk -= 10; // Active

        // Engagement level
        const engagement = this.calculateEngagementLevel(session);
        if (engagement === 'very_high') risk -= 30;
        else if (engagement === 'high') risk -= 15;
        else if (engagement === 'low') risk += 20;

        // Bounce risk (single page)
        if (session.pagesViewed === 1 && duration < 30000) {
            risk += 25;
        }

        // Scroll depth
        if (session.scrollDepth < 30) risk += 15;
        else if (session.scrollDepth > 70) risk -= 10;

        return Math.max(0, Math.min(risk, 100));
    }

    /**
     * Generate traffic predictions
     */
    static async generatePredictions() {
        // Get historical data
        const last30Days = await TrackingSession.aggregate([
            {
                $match: {
                    startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Simple moving average prediction
        const recentData = last30Days.slice(-7);
        const average = recentData.reduce((sum, d) => sum + d.count, 0) / recentData.length;

        // Trend calculation
        const trend = recentData.length >= 2
            ? (recentData[recentData.length - 1].count - recentData[0].count) / recentData.length
            : 0;

        const predictions = {
            nextHourPrediction: Math.round(average / 24),
            tomorrowPrediction: Math.round(average + trend),
            weekPrediction: Math.round((average + trend * 7) * 7),
            confidence: this.calculatePredictionConfidence(last30Days),
            historical: last30Days.map(d => ({ label: d._id, value: d.count })),
            forecast: this.generateForecast(average, trend, 7),
            recommendations: this.generateRecommendations(average, trend)
        };

        return predictions;
    }

    static calculatePredictionConfidence(historicalData) {
        if (historicalData.length < 7) return 60;
        if (historicalData.length < 14) return 75;
        if (historicalData.length < 21) return 85;
        return 92;
    }

    static generateForecast(average, trend, days) {
        const forecast = [];
        const today = new Date();

        for (let i = 1; i <= days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            forecast.push({
                label: date.toISOString().split('T')[0],
                value: Math.round(average + trend * i)
            });
        }

        return forecast;
    }

    static generateRecommendations(average, trend) {
        const recommendations = [];

        if (trend > 5) {
            recommendations.push('Traffic is growing! Consider increasing server capacity.');
            recommendations.push('Great time to launch new content or features.');
        } else if (trend < -5) {
            recommendations.push('Traffic is declining. Review recent changes and SEO.');
            recommendations.push('Consider running a marketing campaign.');
        }

        if (average > 100) {
            recommendations.push('High traffic volume. Ensure optimal performance.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Traffic is stable. Focus on conversion optimization.');
        }

        return recommendations;
    }
}

module.exports = AIAnalysisService;