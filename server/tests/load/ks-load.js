// tests/load/k6-load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const sessionDuration = new Trend('session_duration');
const pageviewCount = new Counter('pageviews');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 0 },    // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
        errors: ['rate<0.1'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
    // Setup code
    console.log('Starting load test...');
    return { timestamp: new Date().toISOString() };
}

export default function(data) {
    let sessionId;
    const startTime = new Date();

    group('User Session Flow', function() {
        // Initialize session
        group('Initialize Session', function() {
            const initResponse = http.post(`${BASE_URL}/api/tracking/session`, 
                JSON.stringify({
                    referrer: 'https://google.com',
                    campaign: 'load-test'
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const success = check(initResponse, {
                'session created': (r) => r.status === 200,
                'has session id': (r) => r.json('sessionId') !== null,
            });

            if (!success) {
                errorRate.add(1);
                return;
            }

            sessionId = initResponse.json('sessionId');
            errorRate.add(0);
        });

        sleep(1);

        // Track multiple pageviews
        group('Track Pageviews', function() {
            const pages = ['/', '/projects', '/about', '/contact'];
            
            pages.forEach((page, index) => {
                const pageviewResponse = http.post(`${BASE_URL}/api/tracking/pageview`,
                    JSON.stringify({
                        sessionId: sessionId,
                        page: page,
                        title: `Page ${page}`,
                        timeSpent: Math.random() * 60000,
                        scrollDepth: Math.random() * 100
                    }),
                    {
                        headers: { 'Content-Type': 'application/json' },
                    }
                );

                const success = check(pageviewResponse, {
                    'pageview tracked': (r) => r.status === 200,
                });

                if (success) {
                    pageviewCount.add(1);
                } else {
                    errorRate.add(1);
                }

                sleep(Math.random() * 3 + 1); // Random pause between pages
            });
        });

        // Track events
        group('Track Events', function() {
            const eventResponse = http.post(`${BASE_URL}/api/tracking/event`,
                JSON.stringify({
                    sessionId: sessionId,
                    eventType: 'click',
                    eventData: { button: 'cta-button', location: 'header' }
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            check(eventResponse, {
                'event tracked': (r) => r.status === 200,
            });
        });

        sleep(1);

        // End session
        group('End Session', function() {
            const endResponse = http.post(`${BASE_URL}/api/tracking/session/end`,
                JSON.stringify({ sessionId: sessionId }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            check(endResponse, {
                'session ended': (r) => r.status === 200,
            });
        });

        // Record session duration
        const duration = new Date() - startTime;
        sessionDuration.add(duration);
    });

    sleep(1);
}

export function teardown(data) {
    console.log('Load test completed');
    console.log('Start time:', data.timestamp);
    console.log('End time:', new Date().toISOString());
}