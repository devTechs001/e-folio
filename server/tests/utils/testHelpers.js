// tests/utils/testHelpers.js
const TrackingSession = require('../../models/TrackingSession');
const { v4: uuidv4 } = require('uuid');

class TestHelpers {
    /**
     * Generate mock session data
     */
    static generateMockSession(overrides = {}) {
        return {
            sessionId: uuidv4(),
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            browser: 'Chrome',
            device: {
                type: 'desktop',
                isMobile: false,
                isTablet: false,
                os: 'Windows'
            },
            location: {
                country: 'United States',
                city: 'New York',
                region: 'NY',
                latitude: 40.7128,
                longitude: -74.0060
            },
            startTime: new Date(),
            pagesViewed: 3,
            clicks: 5,
            scrollDepth: 75,
            duration: 120000,
            pageJourney: [
                { path: '/', timestamp: new Date(), timeSpent: 30000 },
                { path: '/projects', timestamp: new Date(), timeSpent: 60000 },
                { path: '/contact', timestamp: new Date(), timeSpent: 30000 }
            ],
            source: {
                referrer: 'https://google.com'
            },
            aiInsights: {
                engagementLevel: 'high',
                intentScore: 75,
                conversionProbability: 60,
                behaviorType: 'explorer'
            },
            converted: false,
            isActive: true,
            ...overrides
        };
    }

    /**
     * Create test sessions in database
     */
    static async createTestSessions(count = 10, overrides = {}) {
        const sessions = [];

        for (let i = 0; i < count; i++) {
            const session = await TrackingSession.create(
                this.generateMockSession(overrides)
            );
            sessions.push(session);
        }

        return sessions;
    }

    /**
     * Clean up test data
     */
    static async cleanupTestData() {
        await TrackingSession.deleteMany({
            sessionId: { $regex: /^test-/ }
        });
    }

    /**
     * Mock WebSocket connection
     */
    static mockWebSocket() {
        return {
            send: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
            isOpen: true
        };
    }

    /**
     * Generate random date within range
     */
    static randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    /**
     * Wait for async operations
     */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TestHelpers;