// services/api.service.js - Add these methods

class ApiService {
    // ... existing methods ...

    // Collaborators
    async getCollaborators(params = {}) {
        return this.get('/api/collaborators', { params });
    }

    async getCollaboratorStats() {
        return this.get('/api/collaborators/stats');
    }

    async inviteCollaborator(data) {
        return this.post('/api/collaborators/invite', data);
    }

    async generateInviteLink(data) {
        return this.post('/api/collaborators/invite/link', data);
    }

    async getPendingInvites() {
        return this.get('/api/collaborators/invites/pending');
    }

    async resendInvite(inviteId) {
        return this.post(`/api/collaborators/invites/${inviteId}/resend`);
    }

    async cancelInvite(inviteId) {
        return this.delete(`/api/collaborators/invites/${inviteId}`);
    }

    async updateCollaboratorRole(collaboratorId, role) {
        return this.put(`/api/collaborators/${collaboratorId}/role`, { role });
    }

    async updateCollaboratorPermissions(collaboratorId, permissions) {
        return this.put(`/api/collaborators/${collaboratorId}/permissions`, { permissions });
    }

    async removeCollaborator(collaboratorId) {
        return this.delete(`/api/collaborators/${collaboratorId}`);
    }

    async suspendCollaborator(collaboratorId) {
        return this.post(`/api/collaborators/${collaboratorId}/suspend`);
    }

    async reactivateCollaborator(collaboratorId) {
        return this.post(`/api/collaborators/${collaboratorId}/reactivate`);
    }

    async bulkRemoveCollaborators(collaboratorIds) {
        return this.post('/api/collaborators/bulk/remove', { collaboratorIds });
    }

    async bulkSuspendCollaborators(collaboratorIds) {
        return this.post('/api/collaborators/bulk/suspend', { collaboratorIds });
    }

    async bulkActivateCollaborators(collaboratorIds) {
        return this.post('/api/collaborators/bulk/activate', { collaboratorIds });
    }

    async exportCollaborators() {
        return this.get('/api/collaborators/export/csv', {
            responseType: 'blob'
        });
    }

    async getCollaboratorActivity(params = {}) {
        return this.get('/api/collaborators/activity', { params });
    }

    async getCollaboratorDetails(collaboratorId) {
        return this.get(`/api/collaborators/${collaboratorId}`);
    }

    async validateInviteToken(token) {
        return this.get(`/api/collaborators/invite/validate/${token}`);
    }

    async acceptInvite(token, data) {
        return this.post(`/api/collaborators/invite/accept/${token}`, data);
    }
}// services/api.service.js - Add these methods

class ApiService {
    // ... existing methods ...

    // Email methods
    async getEmails(params = {}) {
        return this.get('/api/emails', { params });
    }

    async getEmailById(id) {
        return this.get(`/api/emails/${id}`);
    }

    async sendEmail(data) {
        return this.post('/api/emails/send', data);
    }

    async replyToEmail(id, data) {
        return this.post(`/api/emails/${id}/reply`, data);
    }

    async forwardEmail(id, data) {
        return this.post(`/api/emails/${id}/forward`, data);
    }

    async deleteEmails(ids) {
        return this.delete('/api/emails/bulk', { data: { ids } });
    }

    async archiveEmails(ids) {
        return this.post('/api/emails/bulk/archive', { ids });
    }

    async markEmailsAsRead(ids) {
        return this.post('/api/emails/bulk', { ids, action: 'markRead' });
    }

    async markEmailsAsUnread(ids) {
        return this.post('/api/emails/bulk', { ids, action: 'markUnread' });
    }

    async toggleEmailStar(id) {
        return this.post(`/api/emails/${id}/star`);
    }

    async getEmailStats() {
        return this.get('/api/emails/stats');
    }

    async searchEmails(query) {
        return this.get('/api/emails/search', { params: { q: query } });
    }

    async getEmailLabels() {
        return this.get('/api/emails/labels/all');
    }

    async createEmailLabel(data) {
        return this.post('/api/emails/labels', data);
    }

    async addEmailLabel(emailId, labelId) {
        return this.post(`/api/emails/${emailId}/labels/${labelId}`);
    }

    async removeEmailLabel(emailId, labelId) {
        return this.delete(`/api/emails/${emailId}/labels/${labelId}`);
    }

    async getEmailTemplates() {
        return this.get('/api/emails/templates/all');
    }

    async createEmailTemplate(data) {
        return this.post('/api/emails/templates', data);
    }

    async getEmailFolders() {
        return this.get('/api/emails/folders/all');
    }

    async getEmailDrafts() {
        return this.get('/api/emails/drafts/all');
    }

    async saveDraft(data) {
        return this.post('/api/emails/drafts', data);
    }

    async getEmailSettings() {
        return this.get('/api/emails/settings');
    }

    async updateEmailSettings(data) {
        return this.put('/api/emails/settings', data);
    }

    async getQuickResponses() {
        return this.get('/api/emails/quick-responses/all');
    }

    async uploadEmailAttachment(formData, config = {}) {
        return this.post('/api/emails/attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...config
        });
    }

    async scheduleEmail(data) {
        return this.post('/api/emails/scheduled', data);
    }

    async getScheduledEmails() {
        return this.get('/api/emails/scheduled/all');
    }

    async getEmailThread(id) {
        return this.get(`/api/emails/${id}/thread`);
    }
}

// services/api.service.js - Add these methods

class ApiService {
    // ... existing methods ...

    // Collaboration Request (Public)
    async submitCollaborationRequest(data) {
        return this.post('/api/collaboration/submit', data);
    }

    async uploadCollaborationFile(formData, config = {}) {
        return this.post('/api/collaboration/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...config
        });
    }

    // Owner methods (already exist in previous code)
    // These are called from the CollaborationRequests dashboard component
    async getCollaborationRequests(params = {}) {
        return this.get('/api/collaboration/requests', { params });
    }

    async getCollaborationStats() {
        return this.get('/api/collaboration/stats');
    }

    async approveRequest(id, data = {}) {
        return this.post(`/api/collaboration/requests/${id}/approve`, data);
    }

    async rejectRequest(id, data = {}) {
        return this.post(`/api/collaboration/requests/${id}/reject`, data);
    }

    async bulkApproveRequests(requestIds) {
        return this.post('/api/collaboration/bulk/approve', { requestIds });
    }

    async bulkRejectRequests(requestIds, reason = '') {
        return this.post('/api/collaboration/bulk/reject', { requestIds, reason });
    }

    async archiveRequest(id) {
        return this.post(`/api/collaboration/requests/${id}/archive`);
    }

    async exportCollaborationRequests(params = {}) {
        return this.get('/api/collaboration/export', {
            params,
            responseType: 'blob'
        });
    }
}

// services/api.service.js - Add these methods

class ApiService {
    // ... existing methods ...

    // Reviews (Owner)
    async getReviews(params = {}) {
        return this.get('/api/reviews', { params });
    }

    async getReviewById(id) {
        return this.get(`/api/reviews/${id}`);
    }

    async getReviewStats() {
        return this.get('/api/reviews/stats');
    }

    async getReviewAnalytics() {
        return this.get('/api/reviews/analytics');
    }

    async getFeaturedReviews() {
        return this.get('/api/reviews/featured');
    }

    async getPublicReviews(params = {}) {
        return this.get('/api/reviews/public', { params });
    }

    async moderateReview(id, data) {
        return this.patch(`/api/reviews/${id}/moderate`, data);
    }

    async replyToReview(id, data) {
        return this.post(`/api/reviews/${id}/reply`, data);
    }

    async bulkModerateReviews(reviewIds, status) {
        return this.post('/api/reviews/bulk/moderate', { reviewIds, status });
    }

    async bulkDeleteReviews(reviewIds) {
        return this.post('/api/reviews/bulk/delete', { reviewIds });
    }

    async toggleFeaturedReview(id, featured) {
        return this.patch(`/api/reviews/${id}/featured`, { featured });
    }

    async toggleReviewVisibility(id, isPublic) {
        return this.patch(`/api/reviews/${id}/visibility`, { isPublic });
    }

    async deleteReview(id) {
        return this.delete(`/api/reviews/${id}`);
    }

    async exportReviews(params = {}) {
        return this.get('/api/reviews/export', {
            params,
            responseType: 'blob'
        });
    }

    // Public review submission
    async submitReview(data) {
        return this.post('/api/reviews/submit', data);
    }
}
// services/api.service.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add auth token to requests
        this.api.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // Projects
    async getProjects(params = {}) {
        const response = await this.api.get('/projects', { params });
        return response.data;
    }

    async getProject(id) {
        const response = await this.api.get(`/projects/${id}`);
        return response.data;
    }

    async createProject(data) {
        const response = await this.api.post('/projects', data);
        return response.data;
    }

    async updateProject(id, data) {
        const response = await this.api.put(`/projects/${id}`, data);
        return response.data;
    }

    async deleteProject(id) {
        const response = await this.api.delete(`/projects/${id}`);
        return response.data;
    }

    async bulkDeleteProjects(ids) {
        const response = await this.api.post('/projects/bulk-delete', { ids });
        return response.data;
    }

    async getProjectAnalytics() {
        const response = await this.api.get('/projects/analytics');
        return response.data;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await this.api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    async syncGitHubMetrics(id) {
        const response = await this.api.post(`/projects/${id}/sync-github`);
        return response.data;
    }
}

// services/api.service.js (Skills Section)
class ApiService {
    // ... existing code ...

    // Skills
    async getSkills(params = {}) {
        const response = await this.api.get('/skills', { params });
        return response.data;
    }

    async getSkill(id) {
        const response = await this.api.get(`/skills/${id}`);
        return response.data;
    }

    async addSkill(data) {
        const response = await this.api.post('/skills', data);
        return response.data;
    }

    async updateSkill(id, data) {
        const response = await this.api.put(`/skills/${id}`, data);
        return response.data;
    }

    async deleteSkill(id) {
        const response = await this.api.delete(`/skills/${id}`);
        return response.data;
    }

    async bulkDeleteSkills(ids) {
        const response = await this.api.post('/skills/bulk-delete', { ids });
        return response.data;
    }

    async reorderSkills(skills) {
        const response = await this.api.post('/skills/reorder', { skills });
        return response.data;
    }

    async getSkillAnalytics() {
        const response = await this.api.get('/skills/analytics');
        return response.data;
    }

    // Skill Groups
    async getSkillGroups() {
        const response = await this.api.get('/skills/groups');
        return response.data;
    }

    async createSkillGroup(data) {
        const response = await this.api.post('/skills/groups', data);
        return response.data;
    }

    async updateSkillGroup(id, data) {
        const response = await this.api.put(`/skills/groups/${id}`, data);
        return response.data;
    }

    async deleteSkillGroup(id) {
        const response = await this.api.delete(`/skills/groups/${id}`);
        return response.data;
    }
}

// Add these methods to your existing ApiService class

class ApiService {
    // ... existing methods ...

    // Settings
    async getUserSettings() {
        const response = await this.api.get('/settings');
        return response.data;
    }

    async updateUserSettings(formData) {
        const response = await this.api.put('/settings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    async changePassword(data) {
        const response = await this.api.post('/settings/password/change', data);
        return response.data;
    }

    // API Keys
    async getApiKeys() {
        const response = await this.api.get('/settings/api-keys');
        return response.data;
    }

    async generateApiKey(data) {
        const response = await this.api.post('/settings/api-keys', data);
        return response.data;
    }

    async deleteApiKey(keyId) {
        const response = await this.api.delete(`/settings/api-keys/${keyId}`);
        return response.data;
    }

    // Webhooks
    async getWebhooks() {
        const response = await this.api.get('/settings/webhooks');
        return response.data;
    }

    async createWebhook(data) {
        const response = await this.api.post('/settings/webhooks', data);
        return response.data;
    }

    async deleteWebhook(webhookId) {
        const response = await this.api.delete(`/settings/webhooks/${webhookId}`);
        return response.data;
    }

    // Sessions
    async getActiveSessions() {
        const response = await this.api.get('/settings/sessions');
        return response.data;
    }

    async terminateSession(sessionId) {
        const response = await this.api.delete(`/settings/sessions/${sessionId}`);
        return response.data;
    }

    // 2FA
    async enable2FA() {
        const response = await this.api.post('/settings/2fa/enable');
        return response.data;
    }

    async verify2FA(token) {
        const response = await this.api.post('/settings/2fa/verify', { token });
        return response.data;
    }

    async disable2FA(password, token) {
        const response = await this.api.post('/settings/2fa/disable', { password, token });
        return response.data;
    }

    // Data & Account
    async exportUserData() {
        const response = await this.api.get('/settings/export');
        return response.data;
    }

    async deleteAccount(password, confirmation) {
        const response = await this.api.post('/settings/delete-account', { password, confirmation });
        return response.data;
    }
}

// Add these methods to your existing ApiService class

class ApiService {
    // ... existing methods ...

    // Portfolio Editor
    async getPortfolioConfig() {
        const response = await this.api.get('/portfolio-editor/config');
        return response.data;
    }

    async savePortfolioConfig(data) {
        const response = await this.api.post('/portfolio-editor/config', data);
        return response.data;
    }

    async getPortfolioVersions(limit) {
        const response = await this.api.get('/portfolio-editor/versions', {
            params: { limit }
        });
        return response.data;
    }

    async restorePortfolioVersion(versionId) {
        const response = await this.api.post(`/portfolio-editor/versions/${versionId}/restore`);
        return response.data;
    }

    async publishPortfolio() {
        const response = await this.api.post('/portfolio-editor/publish');
        return response.data;
    }

    async unpublishPortfolio() {
        const response = await this.api.post('/portfolio-editor/unpublish');
        return response.data;
    }

    async duplicatePortfolio(name) {
        const response = await this.api.post('/portfolio-editor/duplicate', { name });
        return response.data;
    }

    async getPortfolioTemplates() {
        const response = await this.api.get('/portfolio-editor/templates');
        return response.data;
    }

    async applyPortfolioTemplate(templateId) {
        const response = await this.api.post('/portfolio-editor/templates/apply', { templateId });
        return response.data;
    }
}

// Add these methods to your existing ApiService class

class ApiService {
    // ... existing methods ...

    // Media Manager
    async getMediaFiles(folderId, params = {}) {
        const response = await this.api.get('/media/files', {
            params: { folderId, ...params }
        });
        return response.data;
    }

    async uploadFile(formData, onProgress) {
        const response = await this.api.post('/media/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        });
        return response.data;
    }

    async deleteFiles(fileIds) {
        const response = await this.api.delete('/media/files', {
            data: { fileIds }
        });
        return response.data;
    }

    async downloadFile(fileId) {
        const response = await this.api.get(`/media/files/${fileId}/download`, {
            responseType: 'blob'
        });
        return response;
    }

    async renameFile(fileId, name) {
        const response = await this.api.put(`/media/files/${fileId}/rename`, { name });
        return response.data;
    }

    async moveFiles(fileIds, folderId) {
        const response = await this.api.put('/media/files/move', {
            fileIds,
            folderId
        });
        return response.data;
    }

    async shareFile(fileId, settings) {
        const response = await this.api.post(`/media/files/${fileId}/share`, settings);
        return response.data;
    }

    async optimizeImages(fileIds) {
        const response = await this.api.post('/media/files/optimize', { fileIds });
        return response.data;
    }

    async getFolders(parentId) {
        const response = await this.api.get('/media/folders', {
            params: { parentId }
        });
        return response.data;
    }

    async createFolder(data) {
        const response = await this.api.post('/media/folders', data);
        return response.data;
    }

    async deleteFolder(folderId, deleteFiles = false) {
        const response = await this.api.delete(`/media/folders/${folderId}`, {
            data: { deleteFiles }
        });
        return response.data;
    }

    async getStorageInfo() {
        const response = await this.api.get('/media/storage');
        return response.data;
    }
}

// Add these methods to your existing ApiService class

class ApiService {
    // ... existing methods ...

    // Learning Center
    async getLearningVideos(params) {
        const response = await this.api.get('/learning/videos', { params });
        return response.data;
    }

    async getVideo(videoId) {
        const response = await this.api.get(`/learning/videos/${videoId}`);
        return response.data;
    }

    async getTutorials(params) {
        const response = await this.api.get('/learning/tutorials', { params });
        return response.data;
    }

    async getTutorial(tutorialId) {
        const response = await this.api.get(`/learning/tutorials/${tutorialId}`);
        return response.data;
    }

    async getFAQs(params) {
        const response = await this.api.get('/learning/faqs', { params });
        return response.data;
    }

    async getCommunities() {
        const response = await this.api.get('/learning/communities');
        return response.data;
    }

    async getLearningProgress() {
        const response = await this.api.get('/learning/progress');
        return response.data;
    }

    async updateProgress(data) {
        const response = await this.api.post('/learning/progress', data);
        return response.data;
    }

    async getBookmarks() {
        const response = await this.api.get('/learning/bookmarks');
        return response.data;
    }

    async addBookmark(data) {
        const response = await this.api.post('/learning/bookmarks', data);
        return response.data;
    }

    async removeBookmark(resourceId) {
        const response = await this.api.delete(`/learning/bookmarks/${resourceId}`);
        return response.data;
    }

    async getAchievements() {
        const response = await this.api.get('/learning/achievements');
        return response.data;
    }

    async getLearningStats() {
        const response = await this.api.get('/learning/stats');
        return response.data;
    }

    async addComment(data) {
        const response = await this.api.post('/learning/comments', data);
        return response.data;
    }

    async getComments(resourceId, params) {
        const response = await this.api.get(`/learning/comments/${resourceId}`, { params });
        return response.data;
    }

    async rateResource(data) {
        const response = await this.api.post('/learning/ratings', data);
        return response.data;
    }
}

// client/src/services/api.service.js
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class APIService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add auth token to requests
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Handle response errors
        this.api.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // WebSocket connection
    connectToDashboard(userId, onUpdate) {
        const token = localStorage.getItem('token');
        
        const socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log('WebSocket connected');
            socket.emit('subscribe:dashboard', { userId });
        });

        socket.on('stats_update', onUpdate);
        socket.on('new_activity', onUpdate);
        socket.on('new_notification', onUpdate);
        socket.on('visitor_online', onUpdate);
        socket.on('new_message', onUpdate);

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        return socket;
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return await this.api.get('/dashboard/stats');
    }

    async getRecentActivity(params = {}) {
        return await this.api.get('/dashboard/activity', { params });
    }

    async getPerformanceData(params = {}) {
        return await this.api.get('/dashboard/performance', { params });
    }

    async getUpcomingEvents() {
        return await this.api.get('/dashboard/events');
    }

    async getTasks(params = {}) {
        return await this.api.get('/dashboard/tasks', { params });
    }

    async updateTask(taskId, data) {
        return await this.api.patch(`/dashboard/tasks/${taskId}`, data);
    }

    async getRecentProjects(params = {}) {
        return await this.api.get('/dashboard/projects/recent', { params });
    }

    async getNotifications(params = {}) {
        return await this.api.get('/dashboard/notifications', { params });
    }

    async dismissNotification(notificationId) {
        return await this.api.patch(`/dashboard/notifications/${notificationId}/dismiss`);
    }

    async getTopSkills(params = {}) {
        return await this.api.get('/dashboard/skills/top', { params });
    }

    async getDeviceStats() {
        return await this.api.get('/dashboard/device-stats');
    }

    async recalculateStats() {
        return await this.api.post('/dashboard/stats/recalculate');
    }
}


export default new ApiService();