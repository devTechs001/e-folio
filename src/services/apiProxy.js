// API Proxy Service for E-Folio Pro
// This file demonstrates how API calls should be proxied through the backend
// to protect sensitive keys and logic

import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints - all sensitive operations should go through backend proxy
export const apiService = {
  // Authentication
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    verifyToken: () => apiClient.get('/auth/verify'),
  },

  // Portfolio operations
  portfolio: {
    getAll: () => apiClient.get('/portfolio'),
    getById: (id) => apiClient.get(`/portfolio/${id}`),
    create: (data) => apiClient.post('/portfolio', data),
    update: (id, data) => apiClient.put(`/portfolio/${id}`, data),
    delete: (id) => apiClient.delete(`/portfolio/${id}`),
  },

  // User operations
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    updateProfile: (data) => apiClient.put('/user/profile', data),
    changePassword: (data) => apiClient.post('/user/change-password', data),
  },

  // File operations (all file uploads go through backend)
  files: {
    upload: (file, folder = 'uploads') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      return apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    delete: (filename) => apiClient.delete(`/files/${filename}`),
  },

  // Analytics (all analytics go through backend proxy)
  analytics: {
    getDashboard: () => apiClient.get('/analytics/dashboard'),
    getVisitors: (params) => apiClient.get('/analytics/visitors', { params }),
  },
};

// Function to handle file downloads securely
export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// Function to handle secure data fetching
export const secureFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Secure fetch failed:', error);
    throw error;
  }
};

export default apiClient;