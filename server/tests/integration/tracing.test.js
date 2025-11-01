// tests/integration/tracking.test.js
const request = require('supertest');
const app = require('../../server');
const TestHelpers = require('../utils/testHelpers');
const TrackingSession = require('../../models/TrackingSession');

describe('Tracking API', () => {
    beforeEach(async () => {
        await TestHelpers.cleanupTestData();
    });

    afterAll(async () => {
        await TestHelpers.cleanupTestData();
    });

    describe('POST /api/tracking/session', () => {
        it('should create a new tracking session', async () => {
            const response = await request(app)
                .post('/api/tracking/session')
                .send({
                    referrer: 'https://google.com'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.sessionId).toBeDefined();

            const session = await TrackingSession.findOne({ 
                sessionId: response.body.sessionId 
            });
            expect(session).toBeTruthy();
        });
    });

    describe('POST /api/tracking/pageview', () => {
        it('should track a page view', async () => {
            const session = await TrackingSession.create(
                TestHelpers.generateMockSession()
            );

            const response = await request(app)
                .post('/api/tracking/pageview')
                .send({
                    sessionId: session.sessionId,
                    page: '/projects',
                    title: 'Projects',
                    timeSpent: 30000,
                    scrollDepth: 75
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.aiInsights).toBeDefined();

            const updatedSession = await TrackingSession.findOne({ 
                sessionId: session.sessionId 
            });
            expect(updatedSession.pagesViewed).toBeGreaterThan(session.pagesViewed);
        });
    });

    describe('GET /api/tracking/analytics/realtime', () => {
        it('should return real-time analytics', async () => {
            await TestHelpers.createTestSessions(5);

            const token = 'valid-owner-token'; // Mock token

            const response = await request(app)
                .get('/api/tracking/analytics/realtime')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.analytics).toBeDefined();
            expect(response.body.analytics.todayTotal).toBeGreaterThan(0);
        });
    });
});