// src/services/customEventTracking.js
import TrackingService from './tracking.service';

class CustomEventTracking {
    constructor() {
        this.eventQueue = [];
        this.flushInterval = 5000; // Flush every 5 seconds
        this.setupAutoFlush();
    }

    /**
     * Track custom event
     */
    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: Date.now(),
                url: window.location.href,
                referrer: document.referrer
            }
        };

        this.eventQueue.push(event);

        // Flush immediately for important events
        if (this.isImportantEvent(eventName)) {
            this.flush();
        }
    }

    /**
     * Track page engagement
     */
    trackEngagement(element, action) {
        this.track('engagement', {
            element,
            action,
            elementText: element.textContent?.substring(0, 100),
            elementId: element.id,
            elementClass: element.className
        });
    }

    /**
     * Track form interactions
     */
    trackFormInteraction(formName, field, action) {
        this.track('form_interaction', {
            form: formName,
            field,
            action // focus, blur, change, submit
        });
    }

    /**
     * Track button clicks
     */
    trackButtonClick(buttonName, location) {
        this.track('button_click', {
            button: buttonName,
            location
        });
    }

    /**
     * Track video engagement
     */
    trackVideo(action, videoId, properties = {}) {
        this.track('video', {
            action, // play, pause, ended, progress
            videoId,
            ...properties
        });
    }

    /**
     * Track downloads
     */
    trackDownload(fileName, fileType, fileSize) {
        this.track('download', {
            fileName,
            fileType,
            fileSize
        });
    }

    /**
     * Track social shares
     */
    trackSocialShare(platform, url) {
        this.track('social_share', {
            platform,
            url
        });
    }

    /**
     * Track errors
     */
    trackError(error, context = {}) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            ...context
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance() {
        if (!window.performance) return;

        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;

        this.track('performance', {
            pageLoadTime,
            connectTime,
            renderTime,
            url: window.location.href
        });
    }

    /**
     * Track user journey
     */
    trackJourney(step, data = {}) {
        this.track('journey', {
            step,
            ...data
        });
    }

    /**
     * Track A/B test variant
     */
    trackABTest(testId, variant) {
        this.track('ab_test', {
            testId,
            variant
        });
    }

    /**
     * Check if event is important (should flush immediately)
     */
    isImportantEvent(eventName) {
        const importantEvents = [
            'conversion',
            'purchase',
            'signup',
            'error',
            'form_submit'
        ];
        return importantEvents.includes(eventName);
    }

    /**
     * Flush events to server
     */
    async flush() {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await Promise.all(
                events.map(event =>
                    TrackingService.trackEvent(event.name, event.properties)
                )
            );
        } catch (error) {
            console.error('Failed to flush events:', error);
            // Re-add failed events
            this.eventQueue.unshift(...events);
        }
    }

    /**
     * Setup auto-flush
     */
    setupAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    /**
     * Setup automatic tracking
     */
    setupAutoTracking() {
        // Track all clicks
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (target) {
                this.trackEngagement(target, 'click');
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.track('form_submit', {
                formId: form.id,
                formName: form.name
            });
        });

        // Track outbound links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
                this.track('outbound_link', {
                    url: link.href,
                    text: link.textContent
                });
            }
        });

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            this.track('visibility_change', {
                hidden: document.hidden
            });
        });

        // Track performance on load
        window.addEventListener('load', () => {
            setTimeout(() => this.trackPerformance(), 0);
        });

        // Track errors
        window.addEventListener('error', (e) => {
            this.trackError(e.error || new Error(e.message), {
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError(new Error(e.reason), {
                type: 'unhandled_promise_rejection'
            });
        });
    }
}

export default new CustomEventTracking();