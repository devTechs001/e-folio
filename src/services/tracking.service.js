import apiService from './api.service';

class TrackingService {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.isTracking = false;
        this.currentPage = null;
        this.pageStartTime = null;
    }

    // Generate unique session ID
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('visitor_session_id', sessionId);
        }
        return sessionId;
    }

    // Generate browser fingerprint
    async generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        const canvasData = canvas.toDataURL();
        
        const fingerprint = {
            canvas: canvasData.substring(0, 100),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        return btoa(JSON.stringify(fingerprint)).substring(0, 50);
    }

    // Get device information
    getDeviceInfo() {
        const ua = navigator.userAgent;
        return {
            type: /mobile/i.test(ua) ? 'mobile' : 'desktop',
            browser: this.getBrowserName(ua),
            os: this.getOS(ua),
            isMobile: /mobile/i.test(ua),
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        };
    }

    getBrowserName(ua) {
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    getOS(ua) {
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'MacOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }

    // Get location (simplified - in production use IP geolocation API)
    async getLocation() {
        try {
            // In production, call a geolocation API
            return {
                country: 'Unknown',
                city: 'Unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        } catch (error) {
            return null;
        }
    }

    // Get referrer information
    getReferrer() {
        const referrer = document.referrer;
        if (!referrer) return { source: 'direct', url: '' };

        const url = new URL(referrer);
        return {
            source: url.hostname,
            url: referrer,
            medium: url.searchParams.get('utm_medium') || 'organic',
            campaign: url.searchParams.get('utm_campaign') || ''
        };
    }

    // Initialize tracking
    async init() {
        if (this.isTracking) return;

        try {
            const fingerprint = await this.generateFingerprint();
            const device = this.getDeviceInfo();
            const location = await this.getLocation();
            const referrer = this.getReferrer();

            await apiService.request('/tracking/session/init', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    fingerprint,
                    device,
                    location,
                    referrer
                })
            });

            this.isTracking = true;
            this.startActivityTracking();
            console.log('✅ Tracking initialized');
        } catch (error) {
            console.error('Tracking init error:', error);
        }
    }

    // Track page view
    async trackPageView(path, title) {
        if (!this.isTracking) await this.init();

        // End previous page timing
        if (this.currentPage) {
            const timeSpent = Date.now() - this.pageStartTime;
            // Time will be calculated on backend
        }

        this.currentPage = path;
        this.pageStartTime = Date.now();

        try {
            await apiService.request('/tracking/page', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    page: {
                        path,
                        title: title || document.title
                    }
                })
            });
        } catch (error) {
            console.error('Track page error:', error);
        }
    }

    // Track event
    async trackEvent(type, element, data = {}) {
        if (!this.isTracking) return;

        try {
            await apiService.request('/tracking/event', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    event: {
                        type,
                        element,
                        elementId: data.id || '',
                        elementClass: data.className || '',
                        page: this.currentPage,
                        data
                    }
                })
            });
        } catch (error) {
            // Silent fail for tracking
        }
    }

    // Start activity tracking
    startActivityTracking() {
        // Track scrolling
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );
                this.trackEvent('scroll', 'page', { depth: scrollDepth });
            }, 1000);
        });

        // Track clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            this.trackEvent('click', target.tagName, {
                id: target.id,
                className: target.className,
                text: target.innerText?.substring(0, 50)
            });
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.trackEvent('form_submit', 'form', {
                id: form.id,
                action: form.action
            });
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', 'document');
            } else {
                this.trackEvent('page_visible', 'document');
            }
        });
    }

    // Submit review
    async submitReview(reviewData) {
        try {
            const response = await apiService.request('/tracking/review', {
                method: 'POST',
                body: JSON.stringify({
                    ...reviewData,
                    sessionId: this.sessionId
                })
            });
            return response;
        } catch (error) {
            console.error('Submit review error:', error);
            throw error;
        }
    }

    // Get reviews
    async getReviews(status = 'approved', limit = 10) {
        try {
            const response = await apiService.request(`/tracking/reviews?status=${status}&limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Get reviews error:', error);
            return { reviews: [], stats: {} };
        }
    }
}

export default new TrackingService();
