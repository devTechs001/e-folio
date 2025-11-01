// src/services/tracking.service.js
class TrackingService {
    constructor() {
        this.sessionId = null;
        this.startTime = Date.now();
        this.currentPage = null;
        this.pageStartTime = null;
        this.scrollDepth = 0;
        this.clicks = 0;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Get referrer and URL params
            const urlParams = new URLSearchParams(window.location.search);
            const referrer = document.referrer;
            const campaign = urlParams.get('utm_campaign');
            const medium = urlParams.get('utm_medium');
            const source = urlParams.get('utm_source');

            // Initialize session
            const response = await fetch('/api/tracking/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referrer, campaign, medium, source })
            });

            const data = await response.json();
            this.sessionId = data.sessionId;

            // Setup event listeners
            this.setupListeners();
            
            // Track initial page view
            this.trackPageView(window.location.pathname);

            this.isInitialized = true;
        } catch (error) {
            console.error('Tracking init error:', error);
        }
    }

    setupListeners() {
        // Track clicks
        document.addEventListener('click', (e) => {
            this.clicks++;
            this.trackEvent('click', {
                element: e.target.tagName,
                x: e.clientX,
                y: e.clientY
            });
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercentage > maxScrollDepth) {
                maxScrollDepth = scrollPercentage;
                this.scrollDepth = Math.round(scrollPercentage);
            }
        });

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackPageEnd();
            }
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    trackPageView(page) {
        // End previous page tracking
        if (this.currentPage) {
            this.trackPageEnd();
        }

        this.currentPage = page;
        this.pageStartTime = Date.now();
        this.scrollDepth = 0;
        this.clicks = 0;
    }

    async trackPageEnd() {
        if (!this.currentPage || !this.pageStartTime) return;

        const timeSpent = Date.now() - this.pageStartTime;

        try {
            await fetch('/api/tracking/pageview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    page: this.currentPage,
                    title: document.title,
                    timeSpent,
                    scrollDepth: this.scrollDepth,
                    interactions: this.clicks
                })
            });
        } catch (error) {
            console.error('Page tracking error:', error);
        }
    }

    async trackEvent(eventType, eventData) {
        if (!this.sessionId) return;

        try {
            await fetch('/api/tracking/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    eventType,
                    eventData
                })
            });
        } catch (error) {
            console.error('Event tracking error:', error);
        }
    }

    async trackConversion(type, value) {
        await this.trackEvent('conversion', { type, value });
    }

    async endSession() {
        if (!this.sessionId) return;

        this.trackPageEnd();

        try {
            await fetch('/api/tracking/session/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
        } catch (error) {
            console.error('Session end error:', error);
        }
    }
}

export default new TrackingService();