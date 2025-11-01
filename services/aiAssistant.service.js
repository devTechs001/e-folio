// src/services/aiAssistant.service.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AIAssistantService {
    constructor() {
        this.api = axios.create({
            baseURL: `${API_URL}/ai`,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.api.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // Conversations
    async getConversations(params = {}) {
        const response = await this.api.get('/conversations', { params });
        return response.data;
    }

    async getConversation(id) {
        const response = await this.api.get(`/conversations/${id}`);
        return response.data;
    }

    async createConversation(data) {
        const response = await this.api.post('/conversations', data);
        return response.data;
    }

    async updateConversation(id, data) {
        const response = await this.api.put(`/conversations/${id}`, data);
        return response.data;
    }

    async deleteConversation(id) {
        const response = await this.api.delete(`/conversations/${id}`);
        return response.data;
    }

    // Messages
    async sendMessage(conversationId, data) {
        const formData = new FormData();
        formData.append('message', data.message);
        
        if (data.files) {
            data.files.forEach(file => {
                formData.append('files', file);
            });
        }

        if (data.stream) {
            formData.append('stream', 'true');
            
            // Return fetch for streaming
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_URL}/ai/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );

            return response.body;
        }

        const response = await this.api.post(
            `/conversations/${conversationId}/messages`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return response.data;
    }

    async regenerateMessage(messageId) {
        const response = await this.api.post(`/messages/${messageId}/regenerate`);
        return response.data;
    }

    async rateMessage(messageId, rating, feedback) {
        const response = await this.api.post(`/messages/${messageId}/rate`, {
            rating,
            feedback
        });
        return response.data;
    }

    async toggleBookmark(messageId) {
        const response = await this.api.post(`/messages/${messageId}/bookmark`);
        return response.data;
    }

    // Utility
    async getBookmarks() {
        const response = await this.api.get('/bookmarks');
        return response.data;
    }

    async searchMessages(query, page = 1) {
        const response = await this.api.get('/search', {
            params: { query, page }
        });
        return response.data;
    }

    async getStats() {
        const response = await this.api.get('/stats');
        return response.data;
    }

    async exportConversation(conversationId, format = 'json') {
        const response = await this.api.get(
            `/conversations/${conversationId}/export`,
            {
                params: { format },
                responseType: format === 'json' ? 'json' : 'blob'
            }
        );

        if (format === 'markdown') {
            const blob = new Blob([response.data], { type: 'text/markdown' });
            return URL.createObjectURL(blob);
        }

        return response.data;
    }
}

export default new AIAssistantService();