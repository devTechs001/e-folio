// API Service for Frontend-Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper method to get auth headers
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
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
        return this.request('/projects');
    }

    async getProject(id) {
        return this.request(`/projects/${id}`);
    }

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

    // Collaboration APIs
    async submitCollaborationRequest(requestData) {
        return this.request('/collaboration/request', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    async getCollaborationRequests() {
        return this.request('/collaboration/requests');
    }

    async approveRequest(requestId) {
        return this.request(`/collaboration/approve/${requestId}`, {
            method: 'POST'
        });
    }

    async rejectRequest(requestId) {
        return this.request(`/collaboration/reject/${requestId}`, {
            method: 'POST'
        });
    }

    async getCollaborators() {
        return this.request('/collaboration/collaborators');
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
}

export default new ApiService();
