// services/SessionReplayService.js
const SessionReplay = require('../models/SessionReplay');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class SessionReplayService {
    /**
     * Start recording session
     */
    static async startRecording(sessionId) {
        await SessionReplay.create({
            sessionId,
            events: [],
            snapshots: [],
            recordingStarted: new Date()
        });

        return { success: true, sessionId };
    }

    /**
     * Record event
     */
    static async recordEvent(sessionId, event) {
        const replay = await SessionReplay.findOne({ sessionId });
        
        if (!replay) {
            throw new Error('Session recording not found');
        }

        replay.events.push({
            type: event.type,
            timestamp: event.timestamp,
            data: event.data
        });

        // Limit events to prevent memory issues
        if (replay.events.length > 10000) {
            replay.events.shift();
        }

        await replay.save();

        return { success: true };
    }

    /**
     * Record snapshot
     */
    static async recordSnapshot(sessionId, snapshot) {
        const replay = await SessionReplay.findOne({ sessionId });
        
        if (!replay) {
            throw new Error('Session recording not found');
        }

        // Compress HTML
        const compressedHtml = await gzip(snapshot.html);

        replay.snapshots.push({
            timestamp: snapshot.timestamp,
            html: compressedHtml.toString('base64'),
            viewport: snapshot.viewport
        });

        // Keep only last 10 snapshots
        if (replay.snapshots.length > 10) {
            replay.snapshots = replay.snapshots.slice(-10);
        }

        await replay.save();

        return { success: true };
    }

    /**
     * End recording
     */
    static async endRecording(sessionId) {
        const replay = await SessionReplay.findOne({ sessionId });
        
        if (!replay) {
            throw new Error('Session recording not found');
        }

        replay.recordingEnded = new Date();
        replay.duration = replay.recordingEnded - replay.recordingStarted;

        // Compress events
        const eventsJson = JSON.stringify(replay.events);
        const compressedEvents = await gzip(eventsJson);
        
        replay.events = [{ compressed: compressedEvents.toString('base64') }];
        replay.compressed = true;

        await replay.save();

        return { success: true, duration: replay.duration };
    }

    /**
     * Get replay data
     */
    static async getReplay(sessionId) {
        const replay = await SessionReplay.findOne({ sessionId });
        
        if (!replay) {
            throw new Error('Session recording not found');
        }

        let events = replay.events;

        // Decompress if compressed
        if (replay.compressed && events[0]?.compressed) {
            const buffer = Buffer.from(events[0].compressed, 'base64');
            const decompressed = await gunzip(buffer);
            events = JSON.parse(decompressed.toString());
        }

        // Decompress snapshots
        const snapshots = await Promise.all(
            replay.snapshots.map(async snapshot => {
                const buffer = Buffer.from(snapshot.html, 'base64');
                const html = (await gunzip(buffer)).toString();
                return {
                    ...snapshot.toObject(),
                    html
                };
            })
        );

        return {
            sessionId: replay.sessionId,
            events,
            snapshots,
            duration: replay.duration,
            recordingStarted: replay.recordingStarted,
            recordingEnded: replay.recordingEnded
        };
    }

    /**
     * Delete old replays
     */
    static async cleanupOldReplays(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        
        const result = await SessionReplay.deleteMany({
            recordingStarted: { $lt: cutoffDate }
        });

        return { deleted: result.deletedCount };
    }
}

module.exports = SessionReplayService;