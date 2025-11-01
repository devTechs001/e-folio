// src/services/googleAnalyticsIntegration.js
class GoogleAnalyticsIntegration {
    constructor() {
        this.isInitialized = false;
        this.gaId = process.env.REACT_APP_GA_ID;
    }

    /**
     * Initialize Google Analytics
     */
    initialize() {
        if (this.isInitialized || !this.gaId) return;

        // Load GA script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', this.gaId, {
            send_page_view: false // We'll send manually
        });

        this.isInitialized = true;
    }

    /**
     * Track page view
     */
    trackPageView(path, title) {
        if (!this.isInitialized) return;

        window.gtag('config', this.gaId, {
            page_path: path,
            page_title: title
        });
    }

    /**
     * Track event
     */
    trackEvent(category, action, label, value) {
        if (!this.isInitialized) return;

        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }

    /**
     * Track conversion
     */
    trackConversion(conversionId, value = 0) {
        if (!this.isInitialized) return;

        window.gtag('event', 'conversion', {
            send_to: `${this.gaId}/${conversionId}`,
            value: value,
            currency: 'USD'
        });
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.isInitialized) return;

        window.gtag('set', 'user_properties', properties);
    }

    /**
     * Track timing
     */
    trackTiming(category, variable, value, label) {
        if (!this.isInitialized) return;

        window.gtag('event', 'timing_complete', {
            name: variable,
            value: value,
            event_category: category,
            event_label: label
        });
    }
}

export default new GoogleAnalyticsIntegration();