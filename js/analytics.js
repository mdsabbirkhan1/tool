// Analytics Manager - Handles user interaction tracking and analytics
class AnalyticsManager {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.isEnabled = this.checkAnalyticsConsent();
        
        this.init();
    }

    init() {
        if (!this.isEnabled) {
            console.log('Analytics disabled - no consent given');
            return;
        }
        
        this.setupSessionTracking();
        this.setupPerformanceTracking();
        this.setupErrorTracking();
        this.setupPageVisibility();
        
        // Track initial page load
        this.trackEvent('page_load', {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    checkAnalyticsConsent() {
        const cookiesAccepted = localStorage.getItem('cookies-accepted');
        return cookiesAccepted === 'true';
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    setupSessionTracking() {
        // Track session duration on page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                duration: Date.now() - this.startTime,
                eventsCount: this.events.length
            });
            this.sendPendingEvents();
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: Date.now() });
            } else {
                this.trackEvent('page_visible', { timestamp: Date.now() });
            }
        });
    }

    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent('performance', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        firstPaint: this.getFirstPaint(),
                        largestContentfulPaint: this.getLargestContentfulPaint()
                    });
                }
            }, 1000);
        });
    }

    setupErrorTracking() {
        // Track JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('unhandled_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    setupPageVisibility() {
        let visibilityStart = Date.now();
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const visibleTime = Date.now() - visibilityStart;
                this.trackEvent('visibility_hidden', { visibleTime });
            } else {
                visibilityStart = Date.now();
                this.trackEvent('visibility_visible');
            }
        });
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint?.startTime || null;
    }

    getLargestContentfulPaint() {
        return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry?.startTime || null);
            });
            
            try {
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Fallback timeout
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, 5000);
            } catch (error) {
                resolve(null);
            }
        });
    }

    trackEvent(eventName, properties = {}) {
        if (!this.isEnabled) return;

        const event = {
            name: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                url: window.location.href,
                referrer: document.referrer
            }
        };

        this.events.push(event);
        
        // Store in local storage for persistence
        this.storeEventLocally(event);
        
        // Log for development
        if (process?.env?.NODE_ENV === 'development') {
            console.log('Analytics Event:', event);
        }
        
        // Send events periodically
        this.maybeSendEvents();
    }

    storeEventLocally(event) {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics-events') || '[]');
            stored.push(event);
            
            // Keep only recent events (last 100)
            const recent = stored.slice(-100);
            localStorage.setItem('analytics-events', JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to store analytics event:', error);
        }
    }

    maybeSendEvents() {
        // Send events every 10 events or after 30 seconds
        if (this.events.length >= 10 || 
            (this.events.length > 0 && Date.now() - this.lastSend > 30000)) {
            this.sendEvents();
        }
    }

    sendEvents() {
        if (!this.isEnabled || this.events.length === 0) return;

        // In a real implementation, you would send to your analytics service
        // For this demo, we'll just log and clear the events
        
        const eventsToSend = [...this.events];
        this.events = [];
        this.lastSend = Date.now();
        
        // Simulate sending to analytics service
        this.simulateAnalyticsSend(eventsToSend);
    }

    simulateAnalyticsSend(events) {
        // This would be replaced with actual analytics service calls
        console.group('📊 Analytics Events Sent');
        events.forEach(event => {
            console.log(`${event.name}:`, event.properties);
        });
        console.groupEnd();
        
        // Store summary statistics
        this.updateAnalyticsSummary(events);
    }

    sendPendingEvents() {
        if (this.events.length > 0) {
            this.sendEvents();
        }
    }

    updateAnalyticsSummary(events) {
        const summary = JSON.parse(localStorage.getItem('analytics-summary') || '{}');
        
        events.forEach(event => {
            const key = event.name;
            summary[key] = (summary[key] || 0) + 1;
        });
        
        summary.lastUpdated = Date.now();
        summary.totalEvents = (summary.totalEvents || 0) + events.length;
        
        localStorage.setItem('analytics-summary', JSON.stringify(summary));
    }

    // User journey tracking
    trackUserJourney(step, metadata = {}) {
        this.trackEvent('user_journey', {
            step,
            ...metadata,
            sessionTime: Date.now() - this.startTime
        });
    }

    // Feature usage tracking
    trackFeatureUsage(feature, action = 'used', metadata = {}) {
        this.trackEvent('feature_usage', {
            feature,
            action,
            ...metadata
        });
    }

    // Tool interaction tracking
    trackToolInteraction(toolId, action, metadata = {}) {
        this.trackEvent('tool_interaction', {
            toolId,
            action,
            ...metadata
        });
    }

    // Search tracking
    trackSearch(query, resultCount, metadata = {}) {
        this.trackEvent('search', {
            query: this.hashString(query), // Hash for privacy
            resultCount,
            queryLength: query.length,
            ...metadata
        });
    }

    // Category tracking
    trackCategoryChange(category, metadata = {}) {
        this.trackEvent('category_change', {
            category,
            ...metadata
        });
    }

    // Theme tracking
    trackThemeChange(theme, metadata = {}) {
        this.trackEvent('theme_change', {
            theme,
            ...metadata
        });
    }

    // PWA tracking
    trackPWAEvent(action, metadata = {}) {
        this.trackEvent('pwa_event', {
            action,
            ...metadata
        });
    }

    // Get analytics summary
    getAnalyticsSummary() {
        const summary = JSON.parse(localStorage.getItem('analytics-summary') || '{}');
        const events = JSON.parse(localStorage.getItem('analytics-events') || '[]');
        
        return {
            summary,
            totalStoredEvents: events.length,
            currentSessionEvents: this.events.length,
            sessionDuration: Date.now() - this.startTime,
            sessionId: this.sessionId
        };
    }

    // Privacy-friendly string hashing
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return hash.toString(36);
    }

    // Enable/disable analytics
    setAnalyticsEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.trackEvent('analytics_enabled');
        } else {
            this.trackEvent('analytics_disabled');
            this.sendPendingEvents();
        }
    }

    // Clear analytics data
    clearAnalyticsData() {
        localStorage.removeItem('analytics-events');
        localStorage.removeItem('analytics-summary');
        this.events = [];
        
        this.trackEvent('analytics_data_cleared');
    }

    // Export analytics data for user
    exportAnalyticsData() {
        const summary = JSON.parse(localStorage.getItem('analytics-summary') || '{}');
        const events = JSON.parse(localStorage.getItem('analytics-events') || '[]');
        
        return {
            exportDate: new Date().toISOString(),
            summary,
            events: events.map(event => ({
                ...event,
                properties: {
                    ...event.properties,
                    // Remove sensitive data
                    sessionId: undefined,
                    url: undefined,
                    referrer: undefined
                }
            }))
        };
    }
}

// Make AnalyticsManager available globally
window.AnalyticsManager = AnalyticsManager;