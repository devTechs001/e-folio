/**
 * Analytics response normalisation (frontend).
 *
 * The advanced analytics dashboard expects a single flat object, while the
 * server returns one response per section, each wrapped as
 * `{ success, data: { <section>: ... }, meta }`. Historically the component
 * bridged that gap by falling back to a 280-line hard-coded demo object with
 * `Math.random()` values — so an outage looked exactly like a busy site.
 *
 * This module maps real API responses into the shape the charts expect and
 * guarantees an honest, empty skeleton when a section is unavailable.
 */

const PAGE_SPEED = {
    mobile: { score: 0, fcp: 0, lcp: 0, cls: 0, tti: 0 },
    desktop: { score: 0, fcp: 0, lcp: 0, cls: 0, tti: 0 }
};

export const EMPTY_ANALYTICS = {
    overview: {
        summary: {
            totalViews: 0, uniqueVisitors: 0, avgSessionDuration: 0,
            bounceRate: 0, conversionRate: 0, pageviewsPerSession: 0,
            totalRevenue: 0, realtimeUsers: 0, goalCompletions: 0,
            newVsReturning: { new: 0, returning: 0 }
        },
        trends: {
            viewsChange: 0, visitorsChange: 0, engagementChange: 0,
            conversionChange: 0, revenueChange: 0
        },
        trafficSources: {}, topPages: [], trafficTrend: [],
        chartData: [], hourlyData: []
    },
    traffic: {
        sources: [], referrers: [], campaigns: [], keywords: [],
        totalVisitors: 0, uniqueVisitors: 0, pageViews: 0,
        avgSessionDuration: 0, bounceRate: 0, pagesPerSession: 0,
        devices: {}, countries: [], topPages: [], trafficTrend: []
    },
    behavior: {
        pageViews: [], userFlow: [], eventTracking: [], searchTerms: [],
        avgTimeOnPage: 0, avgPagesPerSession: 0, bounceRate: 0, exitRate: 0,
        topExitPages: [], scrollDepth: { avgDepth: 0, deepScrolls: 0, mediumScrolls: 0 },
        popularPaths: [], recentActivity: []
    },
    conversion: {
        goals: [], funnel: [], attribution: [], cohortAnalysis: [],
        conversionRate: 0, totalConversions: 0, revenue: 0,
        topConvertingPages: [], conversionBySource: {}, conversionTrend: []
    },
    technical: {
        avgLoadTime: 0, pageSpeed: 0, errorRate: 0, uptime: 0,
        topPerformingPages: [], slowestPages: [],
        browsers: [], devices: [],
        loadTimes: { avg: 0, median: 0, p95: 0, p99: 0, byPage: [] },
        errors: []
    },
    seo: {
        organicTraffic: 0, searchRankings: 0, backlinks: 0, impressions: 0,
        clickThroughRate: 0, topKeywords: [], rankings: [], backlinksList: [],
        indexedPages: 0, crawlErrors: 0, mobileFriendly: false,
        pageSpeed: PAGE_SPEED, coreWebVitals: { lcp: 0, fcp: 0, cls: 0, ttfb: 0 },
        seoScore: 0
    },
    social: {
        totalReferrals: 0, engagementRate: 0, topPosts: [],
        sharesByPlatform: {}, referralSources: {}, shares: [], followers: {},
        socialTrend: []
    },
    competitor: { topCompetitors: [], marketShare: [], keywords: [], gapAnalysis: [] },
    topProjects: [],
    realtimeActivity: [],
    realtimeUsers: 0,
    goals: [],
    abTests: [],
    notifications: [],
    populated: false,
    unavailable: []
};

const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

/** Unwrap a `{ success, data, meta }` response, honouring explicit failures. */
function section(response, key) {
    if (!response || response.success === false) return {};
    const data = response.data ?? response;
    if (key && isObject(data) && isObject(data[key])) return data[key];
    return isObject(data) ? data : (Array.isArray(data) ? data : {});
}

function list(value) {
    return Array.isArray(value) ? value : [];
}

export function normalizeAnalytics(raw = {}) {
    const unavailable = Object.entries(raw)
        .filter(([, response]) => response && response.success === false)
        .map(([key]) => key);
    const hasRealResponse = Object.values(raw).some(
        response => response && response.success !== false && response.meta?.populated !== false
    );

    const overview = section(raw.overview, 'overview');
    const traffic = section(raw.traffic, 'traffic');
    const behavior = section(raw.behavior, 'behavior');
    const conversion = section(raw.conversion, 'conversion');
    const technical = section(raw.technical, 'technical');
    const seo = section(raw.seo, 'seo');
    const social = section(raw.social, 'social');
    const competitor = section(raw.competitor, 'competitors');

    const realtimeActivity = list(behavior.recentActivity).map(event => ({
        ...event,
        action: event.action || event.name || event.type || 'Event',
        timestamp: event.timestamp
            ? new Date(event.timestamp).toLocaleTimeString()
            : ''
    }));

    return {
        ...EMPTY_ANALYTICS,
        overview: {
            ...EMPTY_ANALYTICS.overview,
            ...overview,
            summary: { ...EMPTY_ANALYTICS.overview.summary, ...(overview.summary || {}) },
            trends: { ...EMPTY_ANALYTICS.overview.trends, ...(overview.trends || {}) },
            chartData: list(overview.chartData),
            hourlyData: list(overview.hourlyData),
            topPages: list(overview.topPages),
            trafficTrend: list(overview.trafficTrend)
        },
        traffic: {
            ...EMPTY_ANALYTICS.traffic,
            ...traffic,
            sources: list(traffic.sources), referrers: list(traffic.referrers),
            campaigns: list(traffic.campaigns), keywords: list(traffic.keywords),
            countries: list(traffic.countries), topPages: list(traffic.topPages),
            trafficTrend: list(traffic.trafficTrend)
        },
        behavior: {
            ...EMPTY_ANALYTICS.behavior,
            ...behavior,
            pageViews: list(behavior.pageViews), userFlow: list(behavior.userFlow),
            eventTracking: list(behavior.eventTracking), searchTerms: list(behavior.searchTerms),
            topExitPages: list(behavior.topExitPages), popularPaths: list(behavior.popularPaths)
        },
        conversion: {
            ...EMPTY_ANALYTICS.conversion,
            ...conversion,
            goals: list(conversion.goals), funnel: list(conversion.funnel),
            attribution: list(conversion.attribution),
            cohortAnalysis: list(conversion.cohortAnalysis),
            conversionTrend: list(conversion.conversionTrend)
        },
        technical: {
            ...EMPTY_ANALYTICS.technical,
            ...technical,
            browsers: list(technical.browsers), devices: list(technical.devices),
            errors: list(technical.errors),
            loadTimes: { ...EMPTY_ANALYTICS.technical.loadTimes, ...(technical.loadTimes || {}) }
        },
        seo: {
            ...EMPTY_ANALYTICS.seo,
            ...seo,
            pageSpeed: { ...PAGE_SPEED, ...(seo.pageSpeed || {}) },
            rankings: list(seo.rankings), backlinksList: list(seo.backlinksList),
            topKeywords: list(seo.topKeywords)
        },
        social: {
            ...EMPTY_ANALYTICS.social,
            ...social,
            followers: isObject(social.followers) ? social.followers : {},
            shares: list(social.shares), topPosts: list(social.topPosts)
        },
        competitor: { ...EMPTY_ANALYTICS.competitor, ...competitor },
        topProjects: Array.isArray(raw.topProjects?.data)
            ? raw.topProjects.data
            : (Array.isArray(raw.topProjects) ? raw.topProjects : list(section(raw.topProjects))),
        realtimeActivity,
        realtimeUsers: Number(overview.summary?.realtimeUsers ?? raw.realtime?.analytics?.activeNow ?? 0) || 0,
        goals: list(raw.goals?.data),
        abTests: list(raw.abTests?.data),
        notifications: list(raw.alerts?.data),
        populated: unavailable.length === 0 && hasRealResponse,
        unavailable
    };
}

export default normalizeAnalytics;
