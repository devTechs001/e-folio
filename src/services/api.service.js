// API Service for Frontend-Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper method to get auth headers
    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Helper method to get token
    getToken() {
        return localStorage.getItem('token');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            // Check if response is HTML (indicates error page)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                console.warn(`Server returned HTML for ${endpoint}, likely an error page`);
                throw new Error(`Server error: ${response.status} for ${endpoint}`);
            }

            const data = await response.json();

            if (!response.ok) {
                console.warn(`API request failed: ${response.status} for ${endpoint}`);
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Provide more specific error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                throw new Error('Unable to connect to the server. Please ensure the backend is running.');
            }
            
            throw error;
        }
    }

    // Auth APIs
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async verifyToken() {
        return this.request('/auth/verify');
    }

    // Skills APIs
    async getSkills() {
        return this.request('/skills');
    }

    async addSkill(skillData) {
        return this.request('/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    }

    async updateSkill(id, skillData) {
        return this.request(`/skills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(skillData)
        });
    }

    async deleteSkill(id) {
        return this.request(`/skills/${id}`, {
            method: 'DELETE'
        });
    }

    // Projects APIs
    async getProjects() {
        try {
            const response = await this.request('/projects');
            if (response.success && Array.isArray(response.data)) {
                // Process images for all projects
                response.data = response.data.map(project => this.processProjectImages(project));
            }
            return response;
        } catch (error) {
            console.error('Error fetching projects:', error);
            // Return mock project data if backend is unavailable
            return {
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Sample Project',
                        description: 'This is a sample project',
                        thumbnail: '/placeholder-project.jpg',
                        images: ['/placeholder-project.jpg'],
                        views: 0,
                        likes: 0
                    }
                ]
            };
        }
    }

    async getProject(id) {
        try {
            const response = await this.request(`/projects/${id}`);
            if (response.success && response.data) {
                response.data = this.processProjectImages(response.data);
            }
            return response;
        } catch (error) {
            console.error('Error fetching project:', error);
            // Return mock project data if backend is unavailable
            return {
                success: true,
                data: {
                    id: id,
                    name: 'Project Unavailable',
                    description: 'Project details are temporarily unavailable',
                    thumbnail: '/placeholder-project.jpg',
                    images: ['/placeholder-project.jpg']
                }
            };
        }
    }

    // Helper method to process project images consistently
    processProjectImages = (project) => {
        // Handle various image field names - according to component expectations
        // The component looks for imageUrl and images[0].url
        
        if (project.imageUrl) {
            // If it's just an image URL string, process it
            project.imageUrl = this.processImageUrl(project.imageUrl, '/placeholder-project.jpg');
        } else if (project.thumbnail) {
            project.imageUrl = this.processImageUrl(project.thumbnail, '/placeholder-project.jpg');
        } else if (project.image) {
            project.imageUrl = this.processImageUrl(project.image, '/placeholder-project.jpg');
        } else if (project.images && project.images.length > 0) {
            // If images exists as array, use first one for imageUrl
            project.imageUrl = this.processImageUrl(
                project.images[0].url || project.images[0], 
                '/placeholder-project.jpg'
            );
        } else {
            project.imageUrl = '/placeholder-project.jpg';
        }
        
        // Process gallery images array for multiple images
        if (project.images && Array.isArray(project.images)) {
            if (typeof project.images[0] === 'string' || typeof project.images[0] === 'object') {
                project.images = project.images.map(img => {
                    if (typeof img === 'string') {
                        // If image is just a URL string
                        return { url: this.processImageUrl(img, '/placeholder-project.jpg') };
                    } else if (typeof img === 'object' && img.url) {
                        // If image is an object with url property
                        return { ...img, url: this.processImageUrl(img.url, '/placeholder-project.jpg') };
                    } else {
                        // Fallback
                        return { url: '/placeholder-project.jpg' };
                    }
                });
            }
        } else if (project.imageUrl) {
            // If there's no images array but there is an imageUrl, create one
            project.images = [{ url: project.imageUrl }];
        } else {
            project.images = [{ url: '/placeholder-project.jpg' }];
        }
        
        // Handle other potential image fields
        if (project.coverImage) {
            project.coverImage = this.processImageUrl(project.coverImage, '/placeholder-project.jpg');
        }
        if (project.gallery && Array.isArray(project.gallery)) {
            project.gallery = project.gallery.map(img => 
                this.processImageUrl(img, '/placeholder-project.jpg')
            );
        }
        
        return project;
    };

    async createProject(projectData) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    // Webhooks APIs
    async getWebhooks() {
        return this.request('/webhooks');
    }

    async createWebhook(webhookData) {
        return this.request('/webhooks', {
            method: 'POST',
            body: JSON.stringify(webhookData)
        });
    }

    async updateWebhook(id, webhookData) {
        return this.request(`/webhooks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(webhookData)
        });
    }

    async deleteWebhook(id) {
        return this.request(`/webhooks/${id}`, {
            method: 'DELETE'
        });
    }

    async testWebhook(id) {
        return this.request(`/webhooks/${id}/test`, {
            method: 'POST'
        });
    }

    // Collaboration APIs
    async submitCollaborationRequest(requestData) {
        return this.request('/collaboration-requests/submit', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    async getCollaborationRequests() {
        return this.request('/collaboration-requests/requests');
    }

    async approveRequest(requestId, data = {}) {
        return this.request(`/collaboration-requests/requests/${requestId}/approve`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async rejectRequest(requestId, data = {}) {
        return this.request(`/collaboration-requests/requests/${requestId}/reject`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getCollaborationStats() {
        return this.request('/collaboration-requests/stats');
    }

    async getRequestDetails(requestId) {
        return this.request(`/collaboration-requests/requests/${requestId}`);
    }

    async addRequestNote(requestId, note) {
        return this.request(`/collaboration-requests/requests/${requestId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ note })
        });
    }

    async archiveRequest(requestId) {
        return this.request(`/collaboration-requests/requests/${requestId}/archive`, {
            method: 'POST'
        });
    }

    async bulkApproveRequests(requestIds) {
        return this.request('/collaboration-requests/bulk/approve', {
            method: 'POST',
            body: JSON.stringify({ requestIds })
        });
    }

    async bulkRejectRequests(requestIds) {
        return this.request('/collaboration-requests/bulk/reject', {
            method: 'POST',
            body: JSON.stringify({ requestIds })
        });
    }

    async exportRequests(filters = {}) {
        return this.request('/collaboration-requests/export?' + new URLSearchParams(filters));
    }

    async getCollaborators() {
        return this.request('/collaboration-requests/collaborators');
    }

    async getPendingInvites() {
        return this.request('/collaboration-requests/invites/pending');
    }

    async getCollaboratorActivity() {
        return this.request('/collaboration-requests/activity');
    }

    // Analytics APIs
    async trackVisitor(data) {
        return this.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getAnalytics() {
        return this.request('/analytics');
    }

    // AI APIs
    async generateContent(prompt, type, context = {}) {
        return this.request('/ai/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt, type, context })
        });
    }

    async improveContent(content, instructions = '') {
        return this.request('/ai/improve', {
            method: 'POST',
            body: JSON.stringify({ content, instructions })
        });
    }

    async getSuggestions(category, current = []) {
        return this.request('/ai/suggestions', {
            method: 'POST',
            body: JSON.stringify({ category, current })
        });
    }

    async analyzeContent(content, type) {
        return this.request('/ai/analyze', {
            method: 'POST',
            body: JSON.stringify({ content, type })
        });
    }

    async generateCode(description, language = 'javascript') {
        return this.request('/ai/code', {
            method: 'POST',
            body: JSON.stringify({ description, language })
        });
    }

    // Chat APIs
    async getMessages(room, limit = 50, before = null) {
        const query = new URLSearchParams({ limit, ...(before && { before }) });
        return this.request(`/chat/rooms/${room}/messages?${query}`);
    }

    async sendMessage(messageData) {
        return this.request('/chat/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    // Profile methods
    async getProfile() {
        return this.request('/profile');
    }

    async updateProfile(formData) {
        return this.request('/profile', {
            method: 'PUT',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData, browser will set it with boundary
            }
        });
    }

    async getProfileStats() {
        return this.request('/profile/stats');
    }

    async getRecentActivity(limit = 10) {
        try {
            return await this.request(`/profile/activity?limit=${limit}`);
        } catch (error) {
            console.warn('Recent activity unavailable');
            return { success: false, message: 'Failed to fetch recent activity' };
        }
    }

    async getTopProjects(limit = 4) {
        return this.request(`/profile/projects/top?limit=${limit}`);
    }

    async getUserSkills() {
        return this.request('/profile/skills');
    }

    async updateSkill(skillData) {
        return this.request('/profile/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    }

    async deleteSkill(skillId) {
        return this.request(`/profile/skills/${skillId}`, {
            method: 'DELETE'
        });
    }

    async getPublicProfile(username) {
        return this.request(`/profile/public/${username}`);
    }

    // Dashboard APIs
    async getDashboardStats() {
        try {
            return await this.request('/dashboard/stats');
        } catch (error) {
            console.warn('Dashboard stats unavailable');
            return {
                success: false,
                message: 'Failed to fetch dashboard stats'
            };
        }
    }

    async getRecentProjects(limit = 5) {
        try {
            return await this.request(`/dashboard/projects/recent?limit=${limit}`);
        } catch (error) {
            console.warn('Recent projects unavailable');
            return { success: false, message: 'Failed to fetch recent projects' };
        }
    }

    async getPerformanceData(period = '7d') {
        try {
            return await this.request(`/dashboard/performance?period=${period}`);
        } catch (error) {
            console.warn('Performance data unavailable');
            return { success: false, message: 'Failed to fetch performance data' };
        }
    }

    async getQuickStats() {
        try {
            return await this.request('/dashboard/quick-stats');
        } catch (error) {
            console.warn('Quick stats unavailable');
            return { success: false, message: 'Failed to fetch quick stats' };
        }
    }

    async getUpcomingEvents() {
        try {
            return await this.request('/dashboard/events/upcoming');
        } catch (error) {
            console.warn('Upcoming events unavailable');
            return { success: false, message: 'Failed to fetch upcoming events' };
        }
    }

    async getTasks() {
        try {
            return await this.request('/dashboard/tasks');
        } catch (error) {
            console.warn('Tasks unavailable');
            return { success: false, message: 'Failed to fetch tasks' };
        }
    }

    async getNotifications(limit = 10) {
        try {
            return await this.request(`/dashboard/notifications?limit=${limit}`);
        } catch (error) {
            console.warn('Notifications unavailable');
            return { success: false, message: 'Failed to fetch notifications' };
        }
    }

    async getTopSkills(limit = 5) {
        try {
            return await this.request(`/dashboard/skills/top?limit=${limit}`);
        } catch (error) {
            console.warn('Top skills unavailable');
            return { success: false, message: 'Failed to fetch top skills' };
        }
    }

    async getDeviceStats() {
        try {
            return await this.request('/dashboard/devices');
        } catch (error) {
            console.warn('Device stats unavailable');
            return { success: false, message: 'Failed to fetch device stats' };
        }
    }

    async connectToDashboard() {
        // This is handled by Socket.io, no API call needed
        return { success: true };
    }

    async uploadCollaborationFile(formData, config) {
        try {
            return await this.request('/collaboration/upload', {
                method: 'POST',
                body: formData,
                headers: {},
                ...config
            });
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    // Media APIs
    async uploadMedia(formData) {
        return this.request('/media/upload', {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }

    async getMedia(filters = {}) {
        const query = new URLSearchParams(filters);
        return this.request(`/media?${query}`);
    }

    async deleteMedia(id) {
        return this.request(`/media/${id}`, {
            method: 'DELETE'
        });
    }

    // Email APIs
    async getEmails(filters = {}) {
        const query = new URLSearchParams(filters);
        return this.request(`/email?${query}`);
    }

    async sendEmail(emailData) {
        return this.request('/email/send', {
            method: 'POST',
            body: JSON.stringify(emailData)
        });
    }

    async deleteEmail(id) {
        return this.request(`/email/${id}`, {
            method: 'DELETE'
        });
    }

    // Education APIs
    async getEducation() {
        return this.request('/education');
    }

    async addEducation(educationData) {
        return this.request('/education', {
            method: 'POST',
            body: JSON.stringify(educationData)
        });
    }

    async updateEducation(id, educationData) {
        return this.request(`/education/${id}`, {
            method: 'PUT',
            body: JSON.stringify(educationData)
        });
    }

    async deleteEducation(id) {
        return this.request(`/education/${id}`, {
            method: 'DELETE'
        });
    }

    // Interests APIs
    async getInterests() {
        return this.request('/interests');
    }

    async addInterest(interestData) {
        return this.request('/interests', {
            method: 'POST',
            body: JSON.stringify(interestData)
        });
    }

    async updateInterest(id, interestData) {
        return this.request(`/interests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(interestData)
        });
    }

    async deleteInterest(id) {
        return this.request(`/interests/${id}`, {
            method: 'DELETE'
        });
    }

    // Skill Analytics APIs
    async getSkillAnalytics() {
        return this.request('/skills/analytics');
    }

    async getSkillGroups() {
        return this.request('/skills/groups');
    }

    // Reviews APIs
    async getReviews() {
        return this.request('/reviews');
    }

    async approveReview(id) {
        return this.request(`/reviews/${id}/approve`, {
            method: 'POST'
        });
    }

    async deleteReview(id) {
        return this.request(`/reviews/${id}`, {
            method: 'DELETE'
        });
    }

    // Settings APIs
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Collaborators APIs
    async getCollaboratorsList(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/collaborators?${query}`);
    }

    async getCollaboratorStats() {
        return this.request('/collaborators/stats');
    }

    async inviteCollaborator(data) {
        return this.request('/collaborators/invite', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async removeCollaborator(id) {
        return this.request(`/collaborators/${id}`, {
            method: 'DELETE'
        });
    }

    async updateCollaboratorRole(id, role) {
        return this.request(`/collaborators/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    }

    // Collaboration Requests APIs
    async getCollaborationRequestsList(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/collaboration/requests?${query}`);
    }

    async approveCollaborationRequest(id) {
        return this.request(`/collaboration/requests/${id}/approve`, {
            method: 'POST'
        });
    }

    async rejectCollaborationRequest(id) {
        return this.request(`/collaboration/requests/${id}/reject`, {
            method: 'POST'
        });
    }

    // Media Manager APIs
    async getMediaFiles(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/media/files?${query}`);
    }

    async getFolders(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/media/folders?${query}`);
    }

    async uploadFile(formData, onUploadProgress = null) {
        return this.request('/media/files/upload', {
            method: 'POST',
            body: formData,
            headers: {},
            onUploadProgress // Note: This might need special handling for fetch API
        });
    }

    async deleteFiles(fileIds) {
        return this.request('/media/files', {
            method: 'DELETE',
            body: JSON.stringify({ fileIds })
        });
    }

    async downloadFile(fileId) {
        // For download, we may need to return the actual file blob rather than json
        const response = await fetch(`${this.baseURL}/media/files/${fileId}/download`, {
            headers: this.getHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
        }
        
        return response.blob();
    }

    async createFolder(folderData) {
        return this.request('/media/folders', {
            method: 'POST',
            body: JSON.stringify(folderData)
        });
    }

    async renameFile(fileId, newName) {
        return this.request(`/media/files/${fileId}/rename`, {
            method: 'PUT',
            body: JSON.stringify({ newName })
        });
    }

    async shareFile(fileId, settings) {
        return this.request(`/media/files/${fileId}/share`, {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }

    async uploadMediaFile(formData) {
        return this.request('/media/files/upload', {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }

    async deleteMediaFiles(fileIds) {
        return this.request('/media/files', {
            method: 'DELETE',
            body: JSON.stringify({ fileIds })
        });
    }

    async getMediaFolders() {
        return this.request('/media/folders');
    }

    async createMediaFolder(name, parentId = null) {
        return this.request('/media/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId })
        });
    }

    async getStorageInfo() {
        try {
            return await this.request('/media/storage');
        } catch (error) {
            console.warn('Media storage API unavailable, using mock data');
            // Return mock storage data when backend is unavailable
            return {
                success: true,
                data: {
                    total: 1073741824, // 1GB in bytes
                    used: 268435456,   // 256MB in bytes
                    available: 805306368, // Remaining space
                    files: 24,
                    folders: 5
                }
            };
        }
    }

    // Email Manager APIs
    async getEmailsList(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/email?${query}`);
    }

    async getEmailById(id) {
        return this.request(`/email/${id}`);
    }

    async sendEmailMessage(emailData) {
        return this.request('/email/send', {
            method: 'POST',
            body: JSON.stringify(emailData)
        });
    }

    async replyToEmail(id, replyData) {
        return this.request(`/email/${id}/reply`, {
            method: 'POST',
            body: JSON.stringify(replyData)
        });
    }

    async markEmailAsRead(id) {
        return this.request(`/email/${id}/read`, {
            method: 'POST'
        });
    }

    async deleteEmails(ids) {
        return this.request('/email/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    async getEmailStats() {
        return this.request('/email/stats');
    }

    async getQuickResponses() {
        return this.request('/email/quick-responses/all');
    }

    // Learning Center APIs
    async getTutorials(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/learning/tutorials?${query}`);
    }

    async getVideos(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/learning/videos?${query}`);
    }

    // Reviews Manager APIs (Note: These endpoints may not be fully implemented in backend)
    async getReviewsList(params = {}) {
        const query = new URLSearchParams(params);
        // Using the same endpoint as getReviews since backend reviews route may handle filtering
        return this.request(`/reviews?${query}`);
    }

    async createReview(reviewData) {
        // Use public endpoint for unauthenticated users
        const endpoint = '/reviews/submit';
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async getPublicReviews(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/reviews/public?${query}`);
    }

    async getFeaturedReviews() {
        try {
            return await this.request('/reviews/featured');
        } catch (error) {
            console.warn('Featured reviews unavailable');
            return { success: true, data: [] };
        }
    }

    async uploadReviewAttachment(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(`${this.baseURL}/reviews/upload-attachment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: formData
        }).then(res => res.json());
    }

    async updateReview(id, reviewData) {
        // This endpoint may not be implemented in backend yet
        return this.request(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
    }

    async moderateReview(id, status) {
        // This endpoint may not be implemented in backend yet
        return this.request(`/reviews/${id}/moderate`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async likeReview(id) {
        return this.request(`/reviews/${id}/like`, {
            method: 'POST'
        });
    }

    async unlikeReview(id) {
        return this.request(`/reviews/${id}/like`, {
            method: 'DELETE'
        });
    }

    // Learning Center APIs
    async getLearningVideos(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/learning/videos?${query}`);
    }

    async getLearningTutorials(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/learning/tutorials?${query}`);
    }

    async getFAQs(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/learning/faqs?${query}`);
    }

    async getLearningProgress() {
        return this.request('/learning/progress');
    }

    async updateLearningProgress(data) {
        return this.request('/learning/progress', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getLearningStats() {
        return this.request('/learning/stats');
    }

    // AI Assistant APIs
    async getAIConversations() {
        return this.request('/ai/conversations');
    }

    async createAIConversation(data) {
        return this.request('/ai/conversations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async sendAIMessage(conversationId, message) {
        return this.request(`/ai/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getAIStats() {
        return this.request('/ai/stats');
    }

    // AI Tracking APIs
    async getRealtimeAnalytics() {
        return this.request('/tracking/analytics/realtime');
    }

    async getHeatmapData(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/tracking/heatmap?${query}`);
    }

    async getConversionFunnel() {
        return this.request('/tracking/funnel');
    }

    async getBehaviorPatterns() {
        return this.request('/tracking/patterns');
    }

    async getPredictiveAnalytics() {
        return this.request('/tracking/predictive');
    }

    // Visitors Analytics APIs
    async getVisitorAnalytics(params = {}) {
        const query = new URLSearchParams(params);
        return this.request(`/analytics?${query}`);
    }

    async getVisitorDetails(id) {
        return this.request(`/analytics/visitors/${id}`);
    }

    // Settings APIs (Enhanced)
    async getUserSettings() {
        return this.request('/settings');
    }

    async updateUserSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    async changePassword(data) {
        return this.request('/settings/password/change', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getApiKeys() {
        return this.request('/settings/api-keys');
    }

    async generateApiKey(data) {
        return this.request('/settings/api-keys', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Portfolio Editor APIs
    async getPortfolioConfig() {
        try {
            const response = await this.request('/portfolio/config');
            if (response && typeof response === 'object') {
                return response;
            } else {
                console.warn('Portfolio config returned unexpected data, using mock data');
                return {
                    success: true,
                    data: {
                        enabled: true,
                        themes: ['light', 'dark', 'professional', 'modern'],
                        sections: ['about', 'projects', 'skills', 'contact', 'testimonials'],
                        settings: {
                            analytics: true,
                            seo: true,
                            socialLinks: true,
                            contactForm: true
                        }
                    }
                };
            }
        } catch (error) {
            console.warn('Portfolio config API unavailable, using mock data');
            // Return mock configuration when backend is unavailable
            return {
                success: true,
                data: {
                    enabled: true,
                    themes: ['light', 'dark', 'professional', 'modern'],
                    sections: ['about', 'projects', 'skills', 'contact', 'testimonials'],
                    settings: {
                        analytics: true,
                        seo: true,
                        socialLinks: true,
                        contactForm: true
                    }
                }
            };
        }
    }

    async savePortfolioConfig(data) {
        try {
            return await this.request('/portfolio/config', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.warn('Portfolio save unavailable');
            return { success: false, error: error.message };
        }
    }

    async getPortfolioVersions() {
        try {
            return await this.request('/portfolio/versions');
        } catch (error) {
            console.warn('Portfolio versions unavailable');
            return { success: false, message: 'Failed to fetch portfolio versions' };
        }
    }

    async getCustomTemplates() {
        try {
            const response = await this.request('/portfolio/templates/custom');
            if (response && typeof response === 'object') {
                return response;
            } else {
                console.warn('Custom templates returned unexpected data, using mock data');
                return {
                    success: true,
                    data: [
                        { id: 1, name: 'Modern Portfolio', category: 'professional', preview: '/placeholder-template1.jpg' },
                        { id: 2, name: 'Creative Showcase', category: 'design', preview: '/placeholder-template2.jpg' },
                        { id: 3, name: 'Minimal Resume', category: 'simple', preview: '/placeholder-template3.jpg' }
                    ]
                };
            }
        } catch (error) {
            console.warn('Custom templates API unavailable, using mock data');
            // Return mock templates when backend is unavailable
            return {
                success: true,
                data: [
                    { id: 1, name: 'Modern Portfolio', category: 'professional', preview: '/placeholder-template1.jpg' },
                    { id: 2, name: 'Creative Showcase', category: 'design', preview: '/placeholder-template2.jpg' },
                    { id: 3, name: 'Minimal Resume', category: 'simple', preview: '/placeholder-template3.jpg' }
                ]
            };
        }
    }

    // Analytics APIs
    async getAnalyticsOverview() {
        try {
            return await this.request('/analytics/overview');
        } catch (error) {
            console.warn('Analytics overview unavailable');
            return { success: false, message: 'Failed to fetch analytics overview' };
        }
    }

    async getBookmarks() {
        try {
            return await this.request('/learning/bookmarks');
        } catch (error) {
            console.warn('Bookmarks unavailable');
            return { success: true, data: [] };
        }
    }

    // Learning Center APIs
    async getCommunities() {
        try {
            return await this.request('/learning/communities');
        } catch (error) {
            console.warn('Communities unavailable');
            return { success: true, data: [] };
        }
    }

    async getLearningResources() {
        try {
            return await this.request('/learning/resources');
        } catch (error) {
            console.warn('Learning resources unavailable');
            return { success: true, data: [] };
        }
    }

    // Collaboration Requests APIs
    async getCollaborationStats() {
        try {
            return await this.request('/collaboration/stats');
        } catch (error) {
            console.warn('Collaboration stats unavailable');
            return { success: false, message: 'Failed to fetch collaboration stats' };
        }
    }

    async getCollaborationRequests() {
        try {
            return await this.request('/collaboration/requests');
        } catch (error) {
            console.warn('Collaboration requests unavailable');
            return { success: true, data: [] };
        }
    }

    // Export Analytics API
    async exportAnalytics(params) {
        try {
            const query = new URLSearchParams(params);
            return await this.request(`/tracking/analytics/export?${query}`);
        } catch (error) {
            console.warn('Analytics export unavailable');
            return { success: false, message: 'Failed to export analytics' };
        }
    }

    // Reviews APIs
    async getReviewAnalytics() {
        try {
            return await this.request('/reviews/analytics');
        } catch (error) {
            console.warn('Review analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getFeaturedReviews() {
        try {
            return await this.request('/reviews/featured');
        } catch (error) {
            console.warn('Featured reviews unavailable');
            return { success: true, data: [] };
        }
    }

    // Analytics APIs
    async getAnalyticsOverview(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/overview?${query}`);
        } catch (error) {
            console.warn('Analytics overview unavailable');
            return { success: true, data: {} };
        }
    }

    async getTrafficAnalytics(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/traffic?${query}`);
        } catch (error) {
            console.warn('Traffic analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getBehaviorAnalytics(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/behavior?${query}`);
        } catch (error) {
            console.warn('Behavior analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getConversionAnalytics(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/conversion?${query}`);
        } catch (error) {
            console.warn('Conversion analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getTechnicalAnalytics(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/technical?${query}`);
        } catch (error) {
            console.warn('Technical analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getSocialMediaAnalytics(timeRange = '7d') {
        try {
            const query = new URLSearchParams({ timeRange });
            return await this.request(`/analytics/social?${query}`);
        } catch (error) {
            console.warn('Social media analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getSEOAnalytics(timeRange = '7d') {
        try {
            const query = new URLSearchParams({ timeRange });
            return await this.request(`/analytics/seo?${query}`);
        } catch (error) {
            console.warn('SEO analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getCompetitorAnalytics(timeRange = '7d') {
        try {
            const query = new URLSearchParams({ timeRange });
            return await this.request(`/analytics/competitor?${query}`);
        } catch (error) {
            console.warn('Competitor analytics unavailable');
            return { success: true, data: {} };
        }
    }

    async getGoalsProgress() {
        try {
            return await this.request('/analytics/goals');
        } catch (error) {
            console.warn('Goals progress unavailable');
            return { success: true, data: [] };
        }
    }

    async getCustomEvents(timeRange = '7d', filters = {}) {
        try {
            const query = new URLSearchParams({ timeRange, ...filters });
            return await this.request(`/analytics/events?${query}`);
        } catch (error) {
            console.warn('Custom events unavailable');
            return { success: true, data: [] };
        }
    }

    async getHeatmapData(page) {
        try {
            const query = new URLSearchParams({ page });
            return await this.request(`/analytics/heatmap?${query}`);
        } catch (error) {
            console.warn('Heatmap data unavailable');
            return { success: true, data: [] };
        }
    }

    async getABTestResults() {
        try {
            return await this.request('/analytics/ab-tests');
        } catch (error) {
            console.warn('A/B test results unavailable');
            return { success: true, data: [] };
        }
    }

    // ========== TESTIMONIALS ==========

    async getTestimonials(params = {}) {
        try {
            const query = new URLSearchParams(params);
            return await this.request(`/testimonials?${query}`);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return { success: false, message: error.message };
        }
    }

    async createTestimonial(testimonialData) {
        try {
            return await this.request('/testimonials', {
                method: 'POST',
                body: JSON.stringify(testimonialData)
            });
        } catch (error) {
            console.error('Error creating testimonial:', error);
            return { success: false, message: error.message };
        }
    }

    async updateTestimonial(id, testimonialData) {
        try {
            return await this.request(`/testimonials/${id}`, {
                method: 'PUT',
                body: JSON.stringify(testimonialData)
            });
        } catch (error) {
            console.error('Error updating testimonial:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteTestimonial(id) {
        try {
            return await this.request(`/testimonials/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            return { success: false, message: error.message };
        }
    }

    async toggleTestimonialVisibility(id) {
        try {
            return await this.request(`/testimonials/${id}/toggle-visibility`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error toggling testimonial visibility:', error);
            return { success: false, message: error.message };
        }
    }

    async toggleTestimonialFeatured(id) {
        try {
            return await this.request(`/testimonials/${id}/toggle-featured`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error toggling testimonial featured:', error);
            return { success: false, message: error.message };
        }
    }

    async reorderTestimonials(testimonials) {
        try {
            return await this.request('/testimonials/reorder', {
                method: 'PUT',
                body: JSON.stringify({ testimonials })
            });
        } catch (error) {
            console.error('Error reordering testimonials:', error);
            return { success: false, message: error.message };
        }
    }

    async getTestimonialStats() {
        try {
            return await this.request('/testimonials/stats');
        } catch (error) {
            console.error('Error fetching testimonial stats:', error);
            return { success: false, message: error.message };
        }
    }

    async getTestimonialPublicStats() {
        try {
            return await this.request('/public/testimonials/stats');
        } catch (error) {
            console.error('Error fetching public testimonial stats:', error);
            return { success: false, message: error.message };
        }
    }

    async submitTestimonial(testimonialData) {
        try {
            return await this.request('/public/testimonials/submit', {
                method: 'POST',
                body: JSON.stringify(testimonialData)
            });
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            return { success: false, message: error.message };
        }
    }

    async exportTestimonialsJSON() {
        try {
            return await this.request('/testimonials/export/json');
        } catch (error) {
            console.error('Error exporting testimonials:', error);
            return { success: false, message: error.message };
        }
    }

    async exportTestimonialsCSV() {
        try {
            const response = await fetch(`${this.baseURL}/testimonials/export/csv`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Export failed');
            }
            
            return response.blob();
        } catch (error) {
            console.error('Error exporting testimonials as CSV:', error);
            throw error;
        }
    }

    async bulkDeleteTestimonials(ids) {
        try {
            return await this.request('/testimonials/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids })
            });
        } catch (error) {
            console.error('Error bulk deleting testimonials:', error);
            return { success: false, message: error.message };
        }
    }

    async bulkUpdateTestimonials(ids, updates) {
        try {
            return await this.request('/testimonials/bulk-update', {
                method: 'POST',
                body: JSON.stringify({ ids, updates })
            });
        } catch (error) {
            console.error('Error bulk updating testimonials:', error);
            return { success: false, message: error.message };
        }
    }

    async toggleTestimonialVerified(id) {
        try {
            return await this.request(`/testimonials/${id}/toggle-verified`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error toggling testimonial verified:', error);
            return { success: false, message: error.message };
        }
    }

    async getUserRetention(timeRange = '7d') {
        try {
            const query = new URLSearchParams({ timeRange });
            return await this.request(`/analytics/retention?${query}`);
        } catch (error) {
            console.warn('User retention data unavailable');
            return { success: true, data: {} };
        }
    }

    async getConversionFunnel(timeRange = '7d') {
        try {
            const query = new URLSearchParams({ timeRange });
            return await this.request(`/analytics/funnel?${query}`);
        } catch (error) {
            console.warn('Conversion funnel unavailable');
            return { success: true, data: [] };
        }
    }

    // Project Analytics API
    async getProjectAnalytics(projectId, timeframe = '30d') {
        try {
            const query = new URLSearchParams({ timeframe });
            return await this.request(`/projects/${projectId}/analytics?${query}`);
        } catch (error) {
            console.error('Error fetching project analytics:', error);
            return { success: false, message: error.message };
        }
    }

    // Image handling methods
    async getProjectImage(projectId, imagePath) {
        try {
            // Try to construct image URL from relative path
            if (imagePath && typeof imagePath === 'string') {
                if (imagePath.startsWith('http')) {
                    return imagePath; // Already absolute URL
                } else if (imagePath.startsWith('/')) {
                    // Add base URL to absolute path
                    return `${this.baseURL}${imagePath}`;
                } else {
                    // Add base URL to relative path
                    return `${this.baseURL}/${imagePath}`;
                }
            }
            // Return placeholder if no image path
            return '/placeholder-project.jpg';
        } catch (error) {
            console.warn('Error processing project image path:', error);
            return '/placeholder-project.jpg';
        }
    }

    // Utility method to ensure image URLs are valid
    ensureValidImageUrl = (url, fallback = '/placeholder-image.jpg') => {
        if (!url) return fallback;
        
        // If it's already a full URL, return as is
        try {
            new URL(url);
            return url;
        } catch {
            // If it's a relative path, construct with base URL
            if (url.startsWith('/')) {
                return `${this.baseURL}${url}`;
            }
            return `${this.baseURL}/${url}`;
        }
    };

    // Media upload methods for projects
    async uploadProjectImage(projectId, imageData) {
        try {
            return await this.request(`/projects/${projectId}/upload-image`, {
                method: 'POST',
                body: imageData,
                headers: {} // Don't set Content-Type so browser sets it with boundary
            });
        } catch (error) {
            console.error('Error uploading project image:', error);
            return { success: false, message: error.message };
        }
    }

    async getProjectMedia(projectId, filters = {}) {
        try {
            const query = new URLSearchParams(filters);
            return await this.request(`/projects/${projectId}/media?${query}`);
        } catch (error) {
            console.error('Error fetching project media:', error);
            return { success: false, data: [] };
        }
    }

    // Method to handle project images with fallback - enhanced to properly handle different image formats
    async getProjectWithImages(projectId) {
        try {
            const projectResponse = await this.getProject(projectId);
            
            if (projectResponse.success && projectResponse.data) {
                const project = projectResponse.data;
                
                // Process image URLs to ensure they're valid with multiple fallback options
                if (project.thumbnail) {
                    project.thumbnail = this.processImageUrl(project.thumbnail, '/placeholder-project.jpg');
                } else if (project.image) {
                    project.thumbnail = this.processImageUrl(project.image, '/placeholder-project.jpg');
                } else if (project.images && project.images.length > 0) {
                    project.thumbnail = this.processImageUrl(project.images[0], '/placeholder-project.jpg');
                } else {
                    project.thumbnail = '/placeholder-project.jpg';
                }
                
                // Process gallery images if they exist
                if (project.images && Array.isArray(project.images)) {
                    project.images = project.images.map(img => 
                        this.processImageUrl(img, '/placeholder-image.jpg')
                    );
                } else {
                    project.images = [project.thumbnail];
                }
                
                // Also handle other image fields that might exist
                if (project.coverImage) {
                    project.coverImage = this.processImageUrl(project.coverImage, '/placeholder-project.jpg');
                }
                if (project.gallery && Array.isArray(project.gallery)) {
                    project.gallery = project.gallery.map(img => 
                        this.processImageUrl(img, '/placeholder-image.jpg')
                    );
                }
                
                return { success: true, data: project };
            } else {
                // If the project data is not valid, return with placeholders
                return {
                    success: true,
                    data: {
                        ...projectResponse.data,
                        thumbnail: '/placeholder-project.jpg',
                        images: ['/placeholder-project.jpg'],
                        name: 'Project Name',
                        description: 'Project Description'
                    }
                };
            }
        } catch (error) {
            console.error('Error fetching project with images:', error);
            // Return project data with placeholder images
            return {
                success: true,
                data: {
                    thumbnail: '/placeholder-project.jpg',
                    images: ['/placeholder-project.jpg'],
                    name: 'Project Name',
                    description: 'Project data unavailable',
                    id: projectId
                }
            };
        }
    }
    
    // Helper method to process image URLs with various formats
    processImageUrl = (url, fallback = '/placeholder-image.jpg') => {
        if (!url) return fallback;
        
        // Handle various URL formats
        if (typeof url !== 'string') return fallback;
        
        // If it's already a complete URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // If it's a data URL (base64 image)
        if (url.startsWith('data:image/')) {
            return url;
        }
        
        // If it's a relative path starting with /
        if (url.startsWith('/')) {
            // Avoid double slashes
            if (this.baseURL.endsWith('/') && url.startsWith('/')) {
                return this.baseURL.slice(0, -1) + url;
            }
            return this.baseURL + url;
        }
        
        // If it's a relative path (not starting with /)
        if (!url.startsWith('/')) {
            return this.baseURL + '/' + url;
        }
        
        return fallback;
    };

    async getAnalyticsAlerts() {
        try {
            return await this.request('/analytics/alerts');
        } catch (error) {
            console.warn('Analytics alerts unavailable');
            return { success: true, data: [] };
        }
    }

    async exportAnalytics(params) {
        try {
            const query = new URLSearchParams(params);
            return await this.request(`/analytics/export?${query}`);
        } catch (error) {
            console.warn('Analytics export unavailable');
            return { success: true, data: {} };
        }
    }
}

export default new ApiService();
