// services/MachineLearningService.js
const tf = require('@tensorflow/tfjs-node');
const TrackingSession = require('../models/TrackingSession');

class MachineLearningService {
    constructor() {
        this.models = {
            conversionPrediction: null,
            engagementPrediction: null,
            churnPrediction: null
        };
        this.isInitialized = false;
    }

    /**
     * Initialize and load ML models
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Train or load pre-trained models
            await this.trainConversionModel();
            await this.trainEngagementModel();
            await this.trainChurnModel();
            
            this.isInitialized = true;
            console.log('ML models initialized successfully');
        } catch (error) {
            console.error('ML initialization error:', error);
        }
    }

    /**
     * Train conversion prediction model
     */
    async trainConversionModel() {
        const trainingData = await this.getTrainingData();
        
        if (trainingData.length < 100) {
            console.log('Not enough data for ML training');
            return;
        }

        // Feature extraction
        const features = trainingData.map(session => [
            session.duration / 1000, // Duration in seconds
            session.pagesViewed,
            session.clicks,
            session.scrollDepth,
            session.aiInsights?.intentScore || 0,
            this.encodeSource(session.source),
            this.encodeDevice(session.device),
            this.encodeTimeOfDay(session.startTime),
            this.encodeDayOfWeek(session.startTime)
        ]);

        const labels = trainingData.map(session => session.converted ? 1 : 0);

        // Normalize features
        const normalizedFeatures = this.normalizeFeatures(features);

        // Create tensors
        const xs = tf.tensor2d(normalizedFeatures);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        // Define model architecture
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [9], units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        // Compile model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Train model
        await model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    }
                }
            }
        });

        this.models.conversionPrediction = model;

        // Save model
        await model.save('file://./ml-models/conversion-model');

        // Cleanup tensors
        xs.dispose();
        ys.dispose();
    }

    /**
     * Predict conversion probability
     */
    async predictConversion(session) {
        if (!this.models.conversionPrediction) {
            return this.fallbackConversionPrediction(session);
        }

        try {
            const features = [
                session.duration / 1000,
                session.pagesViewed,
                session.clicks,
                session.scrollDepth,
                session.aiInsights?.intentScore || 0,
                this.encodeSource(session.source),
                this.encodeDevice(session.device),
                this.encodeTimeOfDay(session.startTime),
                this.encodeDayOfWeek(session.startTime)
            ];

            const normalizedFeatures = this.normalizeFeatures([features])[0];
            const input = tf.tensor2d([normalizedFeatures]);
            
            const prediction = this.models.conversionPrediction.predict(input);
            const probability = (await prediction.data())[0] * 100;

            input.dispose();
            prediction.dispose();

            return Math.round(probability);
        } catch (error) {
            console.error('Prediction error:', error);
            return this.fallbackConversionPrediction(session);
        }
    }

    /**
     * Train engagement prediction model
     */
    async trainEngagementModel() {
        const trainingData = await this.getTrainingData();
        
        if (trainingData.length < 100) return;

        const features = trainingData.map(session => [
            session.pagesViewed,
            session.clicks,
            session.scrollDepth,
            session.duration / 1000,
            this.encodeSource(session.source),
            this.encodeDevice(session.device)
        ]);

        const labels = trainingData.map(session => 
            this.encodeEngagementLevel(session.aiInsights?.engagementLevel)
        );

        const normalizedFeatures = this.normalizeFeatures(features);

        const xs = tf.tensor2d(normalizedFeatures);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [6], units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'linear' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        await model.fit(xs, ys, {
            epochs: 30,
            batchSize: 32,
            validationSplit: 0.2
        });

        this.models.engagementPrediction = model;
        await model.save('file://./ml-models/engagement-model');

        xs.dispose();
        ys.dispose();
    }

    /**
     * Train churn prediction model
     */
    async trainChurnModel() {
        const sessions = await TrackingSession.find({
            userId: { $exists: true },
            startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        }).sort({ startTime: 1 });

        if (sessions.length < 100) return;

        // Group by user and calculate features
        const userSessions = sessions.reduce((acc, session) => {
            const userId = session.userId.toString();
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push(session);
            return acc;
        }, {});

        const trainingData = [];
        
        Object.entries(userSessions).forEach(([userId, sessions]) => {
            if (sessions.length < 2) return;

            // Calculate time between sessions
            const sessionGaps = [];
            for (let i = 1; i < sessions.length; i++) {
                const gap = (sessions[i].startTime - sessions[i-1].startTime) / (1000 * 60 * 60 * 24); // days
                sessionGaps.push(gap);
            }

            const avgGap = sessionGaps.reduce((a, b) => a + b, 0) / sessionGaps.length;
            const lastSession = sessions[sessions.length - 1];
            const daysSinceLastVisit = (Date.now() - lastSession.startTime) / (1000 * 60 * 60 * 24);

            // Churned if no visit in 2x average gap
            const churned = daysSinceLastVisit > (avgGap * 2) ? 1 : 0;

            trainingData.push({
                features: [
                    sessions.length, // Total sessions
                    avgGap, // Average days between sessions
                    daysSinceLastVisit, // Days since last visit
                    sessions.reduce((sum, s) => sum + s.pagesViewed, 0) / sessions.length, // Avg pages
                    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length / 1000, // Avg duration
                    sessions.filter(s => s.converted).length // Total conversions
                ],
                label: churned
            });
        });

        if (trainingData.length < 50) return;

        const features = trainingData.map(d => d.features);
        const labels = trainingData.map(d => d.label);

        const normalizedFeatures = this.normalizeFeatures(features);

        const xs = tf.tensor2d(normalizedFeatures);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [6], units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        await model.fit(xs, ys, {
            epochs: 40,
            batchSize: 16,
            validationSplit: 0.2
        });

        this.models.churnPrediction = model;
        await model.save('file://./ml-models/churn-model');

        xs.dispose();
        ys.dispose();
    }

    /**
     * Predict churn risk for a user
     */
    async predictChurnRisk(userId) {
        if (!this.models.churnPrediction) {
            return 50; // Default risk
        }

        const sessions = await TrackingSession.find({ userId })
            .sort({ startTime: 1 })
            .limit(100);

        if (sessions.length < 2) return 50;

        // Calculate features
        const sessionGaps = [];
        for (let i = 1; i < sessions.length; i++) {
            const gap = (sessions[i].startTime - sessions[i-1].startTime) / (1000 * 60 * 60 * 24);
            sessionGaps.push(gap);
        }

        const avgGap = sessionGaps.reduce((a, b) => a + b, 0) / sessionGaps.length;
        const lastSession = sessions[sessions.length - 1];
        const daysSinceLastVisit = (Date.now() - lastSession.startTime) / (1000 * 60 * 60 * 24);

        const features = [
            sessions.length,
            avgGap,
            daysSinceLastVisit,
            sessions.reduce((sum, s) => sum + s.pagesViewed, 0) / sessions.length,
            sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length / 1000,
            sessions.filter(s => s.converted).length
        ];

        const normalizedFeatures = this.normalizeFeatures([features])[0];
        const input = tf.tensor2d([normalizedFeatures]);
        
        const prediction = this.models.churnPrediction.predict(input);
        const probability = (await prediction.data())[0] * 100;

        input.dispose();
        prediction.dispose();

        return Math.round(probability);
    }

    /**
     * Get training data
     */
    async getTrainingData() {
        return await TrackingSession.find({
            duration: { $gt: 0 },
            pagesViewed: { $gt: 0 },
            startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        }).limit(10000).lean();
    }

    /**
     * Feature encoding helpers
     */
    encodeSource(source) {
        if (!source?.referrer) return 0;
        if (/google|bing|yahoo/i.test(source.referrer)) return 1;
        if (/facebook|twitter|linkedin|instagram/i.test(source.referrer)) return 2;
        return 3;
    }

    encodeDevice(device) {
        if (device?.isMobile) return 1;
        if (device?.isTablet) return 2;
        return 0;
    }

    encodeTimeOfDay(date) {
        const hour = new Date(date).getHours();
        if (hour >= 6 && hour < 12) return 0; // Morning
        if (hour >= 12 && hour < 18) return 1; // Afternoon
        if (hour >= 18 && hour < 24) return 2; // Evening
        return 3; // Night
    }

    encodeDayOfWeek(date) {
        return new Date(date).getDay();
    }

    encodeEngagementLevel(level) {
        const levels = { low: 0, medium: 1, high: 2, very_high: 3 };
        return levels[level] || 0;
    }

    /**
     * Normalize features
     */
    normalizeFeatures(features) {
        if (features.length === 0) return [];

        const numFeatures = features[0].length;
        const normalized = [];

        // Calculate min and max for each feature
        const mins = new Array(numFeatures).fill(Infinity);
        const maxs = new Array(numFeatures).fill(-Infinity);

        features.forEach(row => {
            row.forEach((val, idx) => {
                mins[idx] = Math.min(mins[idx], val);
                maxs[idx] = Math.max(maxs[idx], val);
            });
        });

        // Normalize
        features.forEach(row => {
            const normalizedRow = row.map((val, idx) => {
                const range = maxs[idx] - mins[idx];
                return range === 0 ? 0 : (val - mins[idx]) / range;
            });
            normalized.push(normalizedRow);
        });

        return normalized;
    }

    /**
     * Fallback conversion prediction
     */
    fallbackConversionPrediction(session) {
        let score = 0;

        // Duration-based
        const duration = session.duration || 0;
        if (duration > 300000) score += 30; // 5+ minutes
        else if (duration > 120000) score += 20; // 2+ minutes
        else if (duration > 60000) score += 10; // 1+ minute

        // Pages viewed
        score += Math.min(session.pagesViewed * 10, 30);

        // Clicks
        score += Math.min(session.clicks * 5, 20);

        // Scroll depth
        score += Math.min(session.scrollDepth / 5, 20);

        return Math.min(score, 100);
    }

    /**
     * Get model performance metrics
     */
    async getModelMetrics() {
        const testData = await this.getTrainingData();
        const testSize = Math.min(100, Math.floor(testData.length * 0.2));
        const testSessions = testData.slice(0, testSize);

        let correctPredictions = 0;

        for (const session of testSessions) {
            const prediction = await this.predictConversion(session);
            const actual = session.converted ? 100 : 0;
            
            if ((prediction > 50 && actual > 50) || (prediction <= 50 && actual <= 50)) {
                correctPredictions++;
            }
        }

        const accuracy = (correctPredictions / testSize) * 100;

        return {
            accuracy: accuracy.toFixed(2),
            testSize,
            correctPredictions,
            modelVersion: '1.0.0',
            lastTrained: new Date().toISOString()
        };
    }
}

module.exports = new MachineLearningService();