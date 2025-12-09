import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.request('/public/projects');
      
      if (response.success && response.projects) {
        setProjects(response.projects);
      } else {
        throw new Error('Failed to load projects');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback((projectId, updates) => {
    setProjects(prev => 
      prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
    );
  }, []);

  const incrementViews = useCallback(async (projectId) => {
    try {
      await apiService.request(`/public/projects/${projectId}/view`, {
        method: 'POST'
      });
      updateProject(projectId, { 
        views: (projects.find(p => p.id === projectId)?.views || 0) + 1 
      });
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  }, [projects, updateProject]);

  const toggleLike = useCallback(async (projectId) => {
    try {
      const response = await apiService.request(`/public/projects/${projectId}/like`, {
        method: 'POST'
      });
      updateProject(projectId, { likes: response.likes });
      return response.likes;
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [updateProject]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    reloadProjects: loadProjects,
    incrementViews,
    toggleLike,
    updateProject
  };
};