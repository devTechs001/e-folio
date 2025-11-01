// utils/advancedFilters.js
class AdvancedFilters {
    /**
     * Build MongoDB query from filter options
     */
    static buildQuery(filters = {}) {
        const query = {};

        // Date range
        if (filters.dateRange) {
            query.startTime = this.parseDateRange(filters.dateRange);
        } else if (filters.startDate || filters.endDate) {
            query.startTime = {};
            if (filters.startDate) {
                query.startTime.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.startTime.$lte = new Date(filters.endDate);
            }
        }

        // Location filters
        if (filters.country) {
            query['location.country'] = filters.country;
        }
        if (filters.city) {
            query['location.city'] = filters.city;
        }

        // Device filters
        if (filters.deviceType) {
            switch (filters.deviceType) {
                case 'mobile':
                    query['device.isMobile'] = true;
                    break;
                case 'tablet':
                    query['device.isTablet'] = true;
                    break;
                case 'desktop':
                    query['device.isMobile'] = false;
                    query['device.isTablet'] = false;
                    break;
            }
        }

        if (filters.browser) {
            query.browser = new RegExp(filters.browser, 'i');
        }

        if (filters.os) {
            query['device.os'] = new RegExp(filters.os, 'i');
        }

        // Engagement filters
        if (filters.engagementLevel) {
            query['aiInsights.engagementLevel'] = filters.engagementLevel;
        }

        if (filters.minEngagement || filters.maxEngagement) {
            query['aiInsights.intentScore'] = {};
            if (filters.minEngagement) {
                query['aiInsights.intentScore'].$gte = parseInt(filters.minEngagement);
            }
            if (filters.maxEngagement) {
                query['aiInsights.intentScore'].$lte = parseInt(filters.maxEngagement);
            }
        }

        // Session metrics
        if (filters.minDuration || filters.maxDuration) {
            query.duration = {};
            if (filters.minDuration) {
                query.duration.$gte = parseInt(filters.minDuration) * 1000;
            }
            if (filters.maxDuration) {
                query.duration.$lte = parseInt(filters.maxDuration) * 1000;
            }
        }

        if (filters.minPages || filters.maxPages) {
            query.pagesViewed = {};
            if (filters.minPages) {
                query.pagesViewed.$gte = parseInt(filters.minPages);
            }
            if (filters.maxPages) {
                query.pagesViewed.$lte = parseInt(filters.maxPages);
            }
        }

        // Conversion filters
        if (filters.converted !== undefined) {
            query.converted = filters.converted === 'true' || filters.converted === true;
        }

        if (filters.conversionType) {
            query.conversionType = filters.conversionType;
        }

        // Traffic source
        if (filters.source) {
            if (filters.source === 'direct') {
                query['source.referrer'] = { $exists: false };
            } else if (filters.source === 'search') {
                query['source.referrer'] = /google|bing|yahoo/i;
            } else if (filters.source === 'social') {
                query['source.referrer'] = /facebook|twitter|linkedin|instagram/i;
            } else {
                query['source.source'] = filters.source;
            }
        }

        // Page filters
        if (filters.page) {
            query['pageJourney.path'] = new RegExp(filters.page, 'i');
        }

        // Active/inactive
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive === 'true' || filters.isActive === true;
        }

        // Custom field filters
        if (filters.customFilters) {
            Object.assign(query, filters.customFilters);
        }

        return query;
    }

    /**
     * Parse date range string
     */
    static parseDateRange(range) {
        const now = new Date();
        let startDate;

        switch (range) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'yesterday':
                startDate = new Date(now.setDate(now.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'last30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case 'last90days':
                startDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                return { $gte: startDate, $lte: endDate };
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        return { $gte: startDate };
    }

    /**
     * Build sort options
     */
    static buildSort(sortOptions = {}) {
        const { sortBy = 'startTime', order = 'desc' } = sortOptions;
        const sortOrder = order === 'asc' ? 1 : -1;

        const sortMap = {
            date: { startTime: sortOrder },
            duration: { duration: sortOrder },
            pages: { pagesViewed: sortOrder },
            engagement: { 'aiInsights.intentScore': sortOrder },
            conversion: { converted: sortOrder, startTime: sortOrder }
        };

        return sortMap[sortBy] || { startTime: sortOrder };
    }

    /**
     * Build pagination options
     */
    static buildPagination(paginationOptions = {}) {
        const page = parseInt(paginationOptions.page) || 1;
        const limit = parseInt(paginationOptions.limit) || 20;
        const skip = (page - 1) * limit;

        return {
            skip,
            limit: Math.min(limit, 100) // Max 100 items per page
        };
    }

    /**
     * Apply filters to query builder
     */
    static applyFilters(queryBuilder, filters) {
        const query = this.buildQuery(filters);
        const sort = this.buildSort(filters);
        const pagination = this.buildPagination(filters);

        return queryBuilder
            .find(query)
            .sort(sort)
            .skip(pagination.skip)
            .limit(pagination.limit);
    }
}

module.exports = AdvancedFilters;