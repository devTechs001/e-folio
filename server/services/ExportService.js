// services/ExportService.js
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const TrackingSession = require('../models/TrackingSession');
const AdvancedFilters = require('../utils/advancedFilters');

class ExportService {
    /**
     * Export data in specified format
     */
    async exportData(filters = {}, format = 'csv') {
        const query = AdvancedFilters.buildQuery(filters);
        const sessions = await TrackingSession.find(query)
            .sort({ startTime: -1 })
            .limit(10000)
            .lean();

        switch (format.toLowerCase()) {
            case 'csv':
                return this.exportToCSV(sessions);
            case 'excel':
                return await this.exportToExcel(sessions);
            case 'json':
                return this.exportToJSON(sessions);
            case 'pdf':
                return await this.exportToPDF(sessions);
            default:
                throw new Error('Unsupported export format');
        }
    }

    /**
     * Export to CSV
     */
    exportToCSV(sessions) {
        const fields = [
            { label: 'Session ID', value: 'sessionId' },
            { label: 'Start Time', value: 'startTime' },
            { label: 'Duration (s)', value: row => Math.round((row.duration || 0) / 1000) },
            { label: 'Pages Viewed', value: 'pagesViewed' },
            { label: 'Clicks', value: 'clicks' },
            { label: 'Scroll Depth', value: 'scrollDepth' },
            { label: 'Device', value: row => row.device?.isMobile ? 'Mobile' : 'Desktop' },
            { label: 'Browser', value: 'browser' },
            { label: 'Country', value: 'location.country' },
            { label: 'City', value: 'location.city' },
            { label: 'Engagement Level', value: 'aiInsights.engagementLevel' },
            { label: 'Intent Score', value: 'aiInsights.intentScore' },
            { label: 'Converted', value: row => row.converted ? 'Yes' : 'No' },
            { label: 'Conversion Type', value: 'conversionType' },
            { label: 'Source', value: 'source.referrer' }
        ];

        const parser = new Parser({ fields });
        return parser.parse(sessions);
    }

    /**
     * Export to Excel
     */
    async exportToExcel(sessions) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analytics Data');

        // Add headers
        worksheet.columns = [
            { header: 'Session ID', key: 'sessionId', width: 25 },
            { header: 'Start Time', key: 'startTime', width: 20 },
            { header: 'Duration (s)', key: 'duration', width: 15 },
            { header: 'Pages Viewed', key: 'pagesViewed', width: 15 },
            { header: 'Clicks', key: 'clicks', width: 10 },
            { header: 'Scroll Depth', key: 'scrollDepth', width: 15 },
            { header: 'Device', key: 'device', width: 15 },
            { header: 'Browser', key: 'browser', width: 15 },
            { header: 'Country', key: 'country', width: 20 },
            { header: 'City', key: 'city', width: 20 },
            { header: 'Engagement', key: 'engagement', width: 15 },
            { header: 'Intent Score', key: 'intentScore', width: 15 },
            { header: 'Converted', key: 'converted', width: 12 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        // Add data
        sessions.forEach(session => {
            worksheet.addRow({
                sessionId: session.sessionId,
                startTime: new Date(session.startTime).toLocaleString(),
                duration: Math.round((session.duration || 0) / 1000),
                pagesViewed: session.pagesViewed,
                clicks: session.clicks,
                scrollDepth: session.scrollDepth,
                device: session.device?.isMobile ? 'Mobile' : 'Desktop',
                browser: session.browser,
                country: session.location?.country,
                city: session.location?.city,
                engagement: session.aiInsights?.engagementLevel,
                intentScore: session.aiInsights?.intentScore,
                converted: session.converted ? 'Yes' : 'No'
            });
        });

        // Add summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        const totalSessions = sessions.length;
        const totalConversions = sessions.filter(s => s.converted).length;
        const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions / 1000;

        summarySheet.addRow({ metric: 'Total Sessions', value: totalSessions });
        summarySheet.addRow({ metric: 'Total Conversions', value: totalConversions });
        summarySheet.addRow({ metric: 'Conversion Rate', value: `${((totalConversions / totalSessions) * 100).toFixed(2)}%` });
        summarySheet.addRow({ metric: 'Avg Duration (s)', value: Math.round(avgDuration) });

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export to JSON
     */
    exportToJSON(sessions) {
        return JSON.stringify(sessions, null, 2);
    }

    /**
     * Export to PDF
     */
    async exportToPDF(sessions) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            // Add title
            doc.fontSize(20).text('Analytics Report', { align: 'center' });
            doc.moveDown();

            // Add summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Sessions: ${sessions.length}`);
            doc.text(`Conversions: ${sessions.filter(s => s.converted).length}`);
            doc.text(`Conversion Rate: ${((sessions.filter(s => s.converted).length / sessions.length) * 100).toFixed(2)}%`);
            doc.moveDown();

            // Add table header
            doc.fontSize(12).text('Session Details', { underline: true });
            doc.moveDown(0.5);

            // Add sessions (limit to first 100 for PDF)
            sessions.slice(0, 100).forEach((session, idx) => {
                if (idx > 0 && idx % 20 === 0) {
                    doc.addPage();
                }

                doc.fontSize(8);
                doc.text(`${idx + 1}. ${session.sessionId.substring(0, 8)}... | ${new Date(session.startTime).toLocaleDateString()} | ${session.location?.country || 'Unknown'} | ${session.converted ? 'Converted' : 'Not converted'}`, {
                    width: 500
                });
            });

            if (sessions.length > 100) {
                doc.moveDown();
                doc.text(`... and ${sessions.length - 100} more sessions`, { align: 'center' });
            }

            doc.end();
        });
    }

    /**
     * Schedule automatic exports
     */
    async scheduleExport(schedule, format, filters, destination) {
        // This would integrate with a job scheduler like node-cron
        // For now, return configuration
        return {
            schedule,
            format,
            filters,
            destination,
            nextRun: this.calculateNextRun(schedule)
        };
    }

    /**
     * Calculate next run time for scheduled export
     */
    calculateNextRun(schedule) {
        // Simple implementation for common schedules
        const now = new Date();
        
        switch (schedule) {
            case 'daily':
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                return tomorrow;
            case 'weekly':
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(0, 0, 0, 0);
                return nextWeek;
            case 'monthly':
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
                nextMonth.setHours(0, 0, 0, 0);
                return nextMonth;
            default:
                return null;
        }
    }
}

module.exports = new ExportService();