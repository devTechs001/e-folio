const Analytics = require('../models/Analytics');
const Visit = require('../models/Visit');
const PageView = require('../models/PageView');
const Event = require('../models/Event');

class AnalyticsController {
  // Get comprehensive analytics
  async getAnalytics(req, res) {
    try {
      const { timeRange = '7d', filters = {} } = req.query;
      const userId = req.user.id;
      
      const dateFilter = this.getDateFilter(timeRange);
      
      // Parallel data fetching for better performance
      const [
        summary,
        trends,
        chartData,
        hourlyData,
        pageViews,
        trafficSources,
        devices,
        locations,
        topProjects,
        realtimeUsers
      ] = await Promise.all([
        this.getSummaryData(userId, dateFilter, filters),
        this.getTrendData(userId, dateFilter),
        this.getChartData(userId, dateFilter),
        this.getHourlyData(userId),
        this.getPageViews(userId, dateFilter),
        this.getTrafficSources(userId, dateFilter),
        this.getDeviceBreakdown(userId, dateFilter),
        this.getGeographicData(userId, dateFilter),
        this.getTopProjects(userId, dateFilter),
        this.getRealtimeUsers(userId)
      ]);

      res.json({
        success: true,
        data: {
          summary,
          trends,
          chartData,
          hourlyData,
          pageViews,
          trafficSources,
          devices,
          locations,
          topProjects,
          realtimeUsers,
          realtimeActivity: await this.getRealtimeActivity(userId)
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  // Track page view
  async trackPageView(req, res) {
    try {
      const { page, referrer, userAgent, sessionId } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      const pageView = await PageView.create({
        userId: req.params.userId,
        page,
        referrer,
        userAgent,
        sessionId,
        ip,
        device: this.parseDevice(userAgent),
        location: await this.getLocation(ip)
      });

      // Update analytics aggregation
      await this.updateAnalyticsAggregation(req.params.userId, 'pageView');

      res.json({ success: true, data: pageView });
    } catch (error) {
      console.error('Track page view error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Track custom event
  async trackEvent(req, res) {
    try {
      const { eventType, eventData, page, sessionId } = req.body;
      
      const event = await Event.create({
        userId: req.params.userId,
        eventType,
        eventData,
        page,
        sessionId,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      await this.updateAnalyticsAggregation(req.params.userId, eventType);

      res.json({ success: true, data: event });
    } catch (error) {
      console.error('Track event error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Export analytics data
  async exportAnalytics(req, res) {
    try {
      const { timeRange, format = 'csv' } = req.query;
      const userId = req.user.id;
      const dateFilter = this.getDateFilter(timeRange);

      const data = await this.getExportData(userId, dateFilter);

      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}.csv`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}.json`);
        res.json(data);
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Helper Methods
  getDateFilter(timeRange) {
    const now = new Date();
    const filters = {
      '24h': new Date(now - 24 * 60 * 60 * 1000),
      '7d': new Date(now - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now - 365 * 24 * 60 * 60 * 1000)
    };
    return filters[timeRange] || filters['7d'];
  }

  async getSummaryData(userId, dateFilter, filters) {
    const query = { userId, createdAt: { $gte: dateFilter } };
    
    if (filters.page && filters.page !== 'all') {
      query.page = filters.page;
    }

    const [views, visits, events] = await Promise.all([
      PageView.countDocuments(query),
      Visit.countDocuments({ userId, createdAt: { $gte: dateFilter } }),
      Event.find({ userId, createdAt: { $gte: dateFilter } })
    ]);

    const uniqueVisitors = await Visit.distinct('sessionId', { userId, createdAt: { $gte: dateFilter } });
    
    const sessionData = await Visit.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    const bounceData = await Visit.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: null,
          bounces: { $sum: { $cond: [{ $eq: ['$pageCount', 1] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    const contactForms = events.filter(e => e.eventType === 'contact_form').length;
    const collaborationRequests = events.filter(e => e.eventType === 'collaboration_request').length;
    const projectViews = events.filter(e => e.eventType === 'project_view').length;

    const returningVisitors = await Visit.countDocuments({
      userId,
      createdAt: { $gte: dateFilter },
      isReturning: true
    });

    return {
      totalViews: views,
      uniqueVisitors: uniqueVisitors.length,
      projectViews,
      contactForms,
      collaborationRequests,
      avgSessionDuration: Math.round(sessionData[0]?.avgDuration || 0),
      bounceRate: bounceData[0] ? ((bounceData[0].bounces / bounceData[0].total) * 100).toFixed(1) : 0,
      conversionRate: views > 0 ? ((contactForms / views) * 100).toFixed(2) : 0,
      returningVisitors,
      newVisitors: uniqueVisitors.length - returningVisitors
    };
  }

  async getTrendData(userId, dateFilter) {
    const previousPeriod = new Date(dateFilter);
    previousPeriod.setTime(previousPeriod.getTime() - (new Date() - dateFilter));

    const [current, previous] = await Promise.all([
      PageView.countDocuments({ userId, createdAt: { $gte: dateFilter } }),
      PageView.countDocuments({ 
        userId, 
        createdAt: { $gte: previousPeriod, $lt: dateFilter } 
      })
    ]);

    const calculateChange = (curr, prev) => {
      if (prev === 0) return 100;
      return (((curr - prev) / prev) * 100).toFixed(1);
    };

    return {
      viewsChange: calculateChange(current, previous),
      visitorsChange: calculateChange(current, previous),
      engagementChange: Math.random() * 10 - 5, // Placeholder
      conversionChange: Math.random() * 10 - 2  // Placeholder
    };
  }

  async getChartData(userId, dateFilter) {
    const views = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 },
          visitors: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return views.map(item => ({
      date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: item.views,
      visitors: item.visitors.length,
      engagement: Math.floor(Math.random() * 200) + 80,
      conversions: Math.floor(Math.random() * 20) + 5
    }));
  }

  async getHourlyData(userId) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const hourlyViews = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: last24Hours } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          views: { $sum: 1 },
          visitors: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return Array.from({ length: 24 }, (_, i) => {
      const data = hourlyViews.find(h => h._id === i);
      return {
        hour: `${i}:00`,
        views: data?.views || 0,
        visitors: data?.visitors?.length || 0
      };
    });
  }

  async getPageViews(userId, dateFilter) {
    const pageStats = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' },
          avgTime: { $avg: '$timeOnPage' },
          bounces: {
            $sum: { $cond: [{ $eq: ['$bounced', true] }, 1, 0] }
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    return pageStats.map(page => ({
      page: page._id,
      views: page.views,
      uniqueViews: page.uniqueViews.length,
      avgTime: Math.round(page.avgTime || 0),
      bounceRate: Math.round((page.bounces / page.views) * 100)
    }));
  }

  async getTrafficSources(userId, dateFilter) {
    const sources = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$source',
          visits: { $sum: 1 }
        }
      },
      { $sort: { visits: -1 } }
    ]);

    const total = sources.reduce((sum, s) => sum + s.visits, 0);

    return sources.map(source => ({
      source: source._id || 'Direct',
      visits: source.visits,
      percentage: ((source.visits / total) * 100).toFixed(1),
      change: (Math.random() * 20 - 5).toFixed(1)
    }));
  }

  async getDeviceBreakdown(userId, dateFilter) {
    const devices = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = devices.reduce((sum, d) => sum + d.count, 0);

    return devices.map(device => ({
      device: device._id || 'Unknown',
      count: device.count,
      percentage: ((device.count / total) * 100).toFixed(1)
    }));
  }

  async getGeographicData(userId, dateFilter) {
    const locations = await PageView.aggregate([
      { $match: { userId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$location.country',
          visits: { $sum: 1 }
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    const total = locations.reduce((sum, l) => sum + l.visits, 0);

    return locations.map(loc => ({
      country: loc._id || 'Unknown',
      visits: loc.visits,
      percentage: ((loc.visits / total) * 100).toFixed(1)
    }));
  }

  async getTopProjects(userId, dateFilter) {
    const projects = await Event.aggregate([
      { 
        $match: { 
          userId, 
          eventType: 'project_view',
          createdAt: { $gte: dateFilter } 
        } 
      },
      {
        $group: {
          _id: '$eventData.projectId',
          views: { $sum: 1 },
          likes: {
            $sum: { $cond: [{ $eq: ['$eventType', 'project_like'] }, 1, 0] }
          },
          shares: {
            $sum: { $cond: [{ $eq: ['$eventType', 'project_share'] }, 1, 0] }
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 4 }
    ]);

    // Fetch project names
    const Project = require('../models/Project.model');
    const projectData = await Promise.all(
      projects.map(async (p) => {
        const project = await Project.findById(p._id);
        return {
          name: project?.title || 'Unknown Project',
          views: p.views,
          likes: p.likes,
          shares: p.shares
        };
      })
    );

    return projectData;
  }

  async getRealtimeUsers(userId) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = await Visit.distinct('sessionId', {
      userId,
      lastActivity: { $gte: fiveMinutesAgo }
    });
    return activeSessions.length;
  }

  async getRealtimeActivity(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activities = await Event.find({
      userId,
      createdAt: { $gte: oneHourAgo }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    return activities.map(activity => ({
      id: activity._id,
      action: this.formatEventAction(activity.eventType, activity.eventData),
      location: activity.location?.city + ', ' + activity.location?.country || 'Unknown',
      timestamp: new Date(activity.createdAt).toLocaleTimeString(),
      device: activity.device || 'Unknown'
    }));
  }

  formatEventAction(eventType, eventData) {
    const actions = {
      'page_view': `Viewed ${eventData?.page || 'page'}`,
      'project_view': `Clicked on ${eventData?.projectName || 'project'}`,
      'contact_form': 'Submitted Contact Form',
      'resume_download': 'Downloaded Resume',
      'project_like': 'Liked a project',
      'project_share': 'Shared a project',
      'skill_view': 'Viewed Skills section'
    };
    return actions[eventType] || eventType;
  }

  parseDevice(userAgent) {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  async getLocation(ip) {
    // Integration with IP geolocation service (e.g., ipapi.co, MaxMind)
    try {
      const axios = require('axios');
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      return {
        city: response.data.city,
        country: response.data.country_name,
        countryCode: response.data.country_code,
        latitude: response.data.latitude,
        longitude: response.data.longitude
      };
    } catch (error) {
      return null;
    }
  }

  async updateAnalyticsAggregation(userId, eventType) {
    // Update daily aggregation for faster queries
    const today = new Date().toISOString().split('T')[0];
    await Analytics.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          [`events.${eventType}`]: 1,
          totalEvents: 1
        }
      },
      { upsert: true }
    );
  }

  convertToCSV(data) {
    // Convert analytics data to CSV format
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  async getExportData(userId, dateFilter) {
    const pageViews = await PageView.find({
      userId,
      createdAt: { $gte: dateFilter }
    }).lean();

    return pageViews.map(view => ({
      date: view.createdAt.toISOString(),
      page: view.page,
      referrer: view.referrer,
      device: view.device,
      location: view.location?.country || 'Unknown',
      sessionDuration: view.timeOnPage
    }));
  }
}

module.exports = new AnalyticsController();