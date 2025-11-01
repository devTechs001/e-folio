// tests/services/AIAnalysisService.test.js
const AIAnalysisService = require('../../services/AIAnalysisService');
const TestHelpers = require('../utils/testHelpers');

describe('AI Analysis Service', () => {
    describe('analyzeSession', () => {
        it('should calculate engagement level correctly', async () => {
            const session = TestHelpers.generateMockSession({
                duration: 300000, // 5 minutes
                pagesViewed: 5,
                clicks: 10,
                scrollDepth: 80
            });

            const insights = await AIAnalysisService.analyzeSession(session);

            expect(insights.engagementLevel).toBeDefined();
            expect(['low', 'medium', 'high', 'very_high']).toContain(insights.engagementLevel);
        });

        it('should calculate intent score', async () => {
            const session = TestHelpers.generateMockSession();
            const insights = await AIAnalysisService.analyzeSession(session);

            expect(insights.intentScore).toBeGreaterThanOrEqual(0);
            expect(insights.intentScore).toBeLessThanOrEqual(100);
        });

        it('should predict conversion probability', async () => {
            const session = TestHelpers.generateMockSession({
                pageJourney: [
                    { path: '/', timeSpent: 30000 },
                    { path: '/projects', timeSpent: 60000 },
                    { path: '/contact', timeSpent: 30000 }
                ]
            });

            const insights = await AIAnalysisService.analyzeSession(session);

            expect(insights.conversionProbability).toBeGreaterThan(0);
        });
    });

    describe('calculateEngagementLevel', () => {
        it('should return very_high for highly engaged users', () => {
            const session = {
                duration: 600000, // 10 minutes
                pagesViewed: 10,
                clicks: 20,
                scrollDepth: 95,
                timeOnPage: [
                    { duration: 120000 }
                ]
            };

            const level = AIAnalysisService.calculateEngagementLevel(session);
            expect(level).toBe('very_high');
        });

        it('should return low for brief visits', () => {
            const session = {
                duration: 10000, // 10 seconds
                pagesViewed: 1,
                clicks: 0,
                scrollDepth: 20,
                timeOnPage: []
            };

            const level = AIAnalysisService.calculateEngagementLevel(session);
            expect(level).toBe('low');
        });
    });
});