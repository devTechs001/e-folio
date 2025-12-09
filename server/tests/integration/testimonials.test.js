const request = require('supertest');
const app = require('../server');
const Testimonial = require('../models/Testimonial.model');
const mongoose = require('mongoose');

describe('Testimonials API', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/efolio-test');
    });

    afterAll(async () => {
        // Clean up test data
        await Testimonial.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/public/testimonials/submit', () => {
        it('should submit a new testimonial successfully', async () => {
            const newTestimonial = {
                name: 'John Doe',
                position: 'Developer',
                company: 'ABC Corp',
                rating: 5,
                content: 'Great experience working with this developer!',
                email: 'john@example.com'
            };

            const response = await request(app)
                .post('/api/public/testimonials/submit')
                .send(newTestimonial)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.testimonial).toHaveProperty('_id');
            expect(response.body.testimonial.name).toBe('John Doe');
        });

        it('should return validation errors for invalid input', async () => {
            const invalidTestimonial = {
                name: '', // invalid - empty
                position: '', // invalid - empty
                rating: 6, // invalid - too high
                content: 'Hi' // invalid - too short
            };

            const response = await request(app)
                .post('/api/public/testimonials/submit')
                .send(invalidTestimonial)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(Array.isArray(response.body.errors)).toBe(true);
        });
    });

    describe('GET /api/public/testimonials', () => {
        it('should retrieve public testimonials', async () => {
            const response = await request(app)
                .get('/api/public/testimonials')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.testimonials)).toBe(true);
        });
    });

    describe('GET /api/public/testimonials/stats', () => {
        it('should retrieve public testimonial statistics', async () => {
            const response = await request(app)
                .get('/api/public/testimonials/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.stats).toHaveProperty('total');
            expect(response.body.stats).toHaveProperty('averageRating');
        });
    });
});