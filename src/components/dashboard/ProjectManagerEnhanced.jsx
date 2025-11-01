// src/components/Dashboard/ProjectManagerEnhanced.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Edit3, Trash2, Eye, ExternalLink, Github,
    Calendar, Tag, Users, Star, Image as ImageIcon, Upload, X,
    Download, Copy, MoreVertical, CheckSquare, Square, Archive,
    TrendingUp, Clock, Zap, AlertCircle, Check, Loader, Grid,
    List, SortAsc, RefreshCw, FileText, BarChart3, Settings,
    ChevronDown, ChevronUp, Maximize2, Link as LinkIcon, Video
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

// Simple Modal Component
const ProjectFormModal = ({ show, onClose, project, onSave, title }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <div className="text-slate-300 text-center py-8">
                    <p>Project form coming soon...</p>
                    <button
                        onClick={onClose}
                        className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ProjectManagerEnhanced = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { success, error, warning } = useNotifications();
    const fileInputRef = useRef(null);

    // State Management
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    
    // Filter/Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTags, setFilterTags] = useState([]);
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('grid');
    
    // Project States
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        technologies: [],
        status: 'in-progress',
        category: 'Web',
        links: { github: '', live: '', demo: '', documentation: '' },
        images: [],
        featured: false,
        tags: [],
        collaborators: [],
        startDate: '',
        endDate: '',
        priority: 'medium',
        visibility: 'public'
    });

    // Load Data
    useEffect(() => {
        loadProjects();
        loadAnalytics();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getProjects();
            setProjects(response.projects || []);
        } catch (err) {
            error('Failed to load projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await ApiService.getProjectAnalytics();
            setAnalytics(response.analytics);
        } catch (err) {
            console.error('Analytics error:', err);
        }
    };

    // Project CRUD Operations
    const handleAddProject = async () => {
        if (!newProject.title || !newProject.description) {
            error('Title and description are required');
            return;
        }

        try {
            const response = await ApiService.createProject(newProject);
            setProjects([response.project, ...projects]);
            resetForm();
            setShowAddModal(false);
            success('Project created successfully!');
            loadAnalytics();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to create project');
        }
    };

    const handleUpdateProject = async () => {
        if (!selectedProject?.id) return;

        try {
            const response = await ApiService.updateProject(selectedProject.id, selectedProject);
            setProjects(projects.map(p => p.id === selectedProject.id ? response.project : p));
            setShowEditModal(false);
            setSelectedProject(null);
            success('Project updated successfully!');
        } catch (err) {
            error('Failed to update project');
        }
    };

    const handleDeleteProject = async (id) => {
        try {
            await ApiService.deleteProject(id);
            setProjects(projects.filter(p => p.id !== id));
            setShowDeleteConfirm(false);
            setProjectToDelete(null);
            success('Project deleted');
            loadAnalytics();
        } catch (err) {
            error('Failed to delete project');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await ApiService.bulkDeleteProjects(selectedProjects);
            setProjects(projects.filter(p => !selectedProjects.includes(p.id)));
            setSelectedProjects([]);
            setShowBulkActions(false);
            success(`Deleted ${selectedProjects.length} projects`);
            loadAnalytics();
        } catch (err) {
            error('Failed to delete projects');
        }
    };

    const handleToggleFeatured = async (id) => {
        const project = projects.find(p => p.id === id);
        try {
            await ApiService.updateProject(id, { featured: !project.featured });
            setProjects(projects.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
            success(project.featured ? 'Removed from featured' : 'Added to featured');
        } catch (err) {
            error('Failed to update project');
        }
    };

    const handleDuplicateProject = async (project) => {
        try {
            const duplicated = {
                ...project,
                title: `${project.title} (Copy)`,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined
            };
            const response = await ApiService.createProject(duplicated);
            setProjects([response.project, ...projects]);
            success('Project duplicated');
        } catch (err) {
            error('Failed to duplicate project');
        }
    };

    // File Upload
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(file => ApiService.uploadImage(file));
            const uploadedImages = await Promise.all(uploadPromises);
            
            setNewProject({
                ...newProject,
                images: [...(newProject.images || []), ...uploadedImages.map(img => ({ url: img.url, caption: '' }))]
            });
            success(`Uploaded ${files.length} image(s)`);
        } catch (err) {
            error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    // Export/Import
    const handleExportProjects = () => {
        const dataStr = JSON.stringify(filteredProjects, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `projects-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        success('Projects exported');
    };

    const handleImportProjects = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedProjects = JSON.parse(text);
            
            const createPromises = importedProjects.map(p => {
                const { id, createdAt, updatedAt, ...projectData } = p;
                return ApiService.createProject(projectData);
            });
            
            await Promise.all(createPromises);
            await loadProjects();
            success(`Imported ${importedProjects.length} projects`);
        } catch (err) {
            error('Failed to import projects');
        }
    };

    // Helpers
    const resetForm = () => {
        setNewProject({
            title: '', description: '', technologies: [], status: 'in-progress',
            category: 'Web', links: { github: '', live: '', demo: '', documentation: '' },
            images: [], featured: false, tags: [], collaborators: [],
            startDate: '', endDate: '', priority: 'medium', visibility: 'public'
        });
        setImageUrl('');
    };

    const toggleProjectSelection = (id) => {
        setSelectedProjects(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const selectAllProjects = () => {
        if (selectedProjects.length === filteredProjects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredProjects.map(p => p.id));
        }
    };

    // Filter and Sort
    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.technologies?.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            const matchesTags = filterTags.length === 0 || filterTags.some(tag => p.tags?.includes(tag));
            return matchesSearch && matchesStatus && matchesCategory && matchesTags;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title': return a.title.localeCompare(b.title);
                case 'featured': return b.featured - a.featured;
                case 'updated': return new Date(b.updatedAt) - new Date(a.updatedAt);
                default: return 0;
            }
        });

    const allTags = [...new Set(projects.flatMap(p => p.tags || []))];
    const statusColors = {
        'in-progress': 'bg-amber-500/20 text-amber-500',
        'completed': 'bg-green-500/20 text-green-500',
        'archived': 'bg-gray-500/20 text-gray-500',
        'planning': 'bg-blue-500/20 text-blue-500'
    };

    const priorityColors = {
        'low': 'bg-gray-500/20 text-gray-500',
        'medium': 'bg-yellow-500/20 text-yellow-500',
        'high': 'bg-red-500/20 text-red-500'
    };

    return (
        <DashboardLayout
            title="Project Manager"
            subtitle={`Manage and showcase ${projects.length} portfolio projects`}
            actions={
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportProjects}
                        accept=".json"
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Upload size={16} /> Import
                    </button>

                    <button
                        onClick={handleExportProjects}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>

                    <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <BarChart3 size={16} /> Analytics
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                                 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg 
                                 shadow-blue-500/25 flex items-center gap-2"
                    >
                        <Plus size={18} /> New Project
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Projects', value: projects.length, icon: FileText, color: 'blue', change: '+12%' },
                        { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, icon: Clock, color: 'amber', change: '+5%' },
                        { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: Check, color: 'green', change: '+23%' },
                        { label: 'Featured', value: projects.filter(p => p.featured).length, icon: Star, color: 'purple', change: '+8%' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 
                                     border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium mb-1">{stat.label}</p>
                                    <h3 className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 
                                                   bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp size={14} className="text-green-500" />
                                        <span className="text-xs text-green-500 font-semibold">{stat.change}</span>
                                        <span className="text-xs text-gray-500">vs last month</span>
                                    </div>
                                </div>
                                <div className={`p-3 bg-${stat.color}-500/10 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`text-${stat.color}-500`} size={24} />
                                </div>
                            </div>
                            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600`} />
                        </motion.div>
                    ))}
                </div>

                {/* Filters & Actions */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {selectedProjects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckSquare className="text-blue-500" size={20} />
                                    <span className="font-semibold">{selectedProjects.length} selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {/* Bulk status update */}}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => {/* Bulk export */}}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Export Selected
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        onClick={() => setSelectedProjects([])}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative lg:col-span-2">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search projects, technologies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                                         focus:border-blue-500/50 transition-all placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="planning">Planning</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="Web">Web</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Desktop">Desktop</option>
                            <option value="AI/ML">AI/ML</option>
                            <option value="Blockchain">Blockchain</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="updated">Last Updated</option>
                                <option value="featured">Featured First</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'}`}
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                            <Tag size={16} className="text-gray-400" />
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTags(prev =>
                                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                    )}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                        filterTags.includes(tag)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            {filterTags.length > 0 && (
                                <button
                                    onClick={() => setFilterTags([])}
                                    className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all"
                                >
                                    Clear Tags
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Projects Display */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
                            <p className="text-gray-400">Loading projects...</p>
                        </div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <FileText size={64} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first project to get started'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold 
                                     hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={selectAllProjects}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 
                                         border border-white/10 rounded-lg text-sm font-medium transition-all"
                            >
                                {selectedProjects.length === filteredProjects.length ? (
                                    <><CheckSquare size={16} /> Deselect All</>
                                ) : (
                                    <><Square size={16} /> Select All</>
                                )}
                            </button>
                            <p className="text-sm text-gray-400">
                                Showing {filteredProjects.length} of {projects.length} projects
                            </p>
                        </div>

                        {/* Grid/List View */}
                        <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4'
                        }>
                            {filteredProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    viewMode={viewMode}
                                    isSelected={selectedProjects.includes(project.id)}
                                    onToggleSelect={() => toggleProjectSelection(project.id)}
                                    onEdit={() => {
                                        setSelectedProject(project);
                                        setShowEditModal(true);
                                    }}
                                    onDelete={() => {
                                        setProjectToDelete(project);
                                        setShowDeleteConfirm(true);
                                    }}
                                    onToggleFeatured={() => handleToggleFeatured(project.id)}
                                    onDuplicate={() => handleDuplicateProject(project)}
                                    onViewImages={() => {
                                        setSelectedProject(project);
                                        setShowImageModal(true);
                                    }}
                                    statusColors={statusColors}
                                    priorityColors={priorityColors}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Modals */}
                <ProjectFormModal
                    show={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    project={newProject}
                    setProject={setNewProject}
                    onSave={handleAddProject}
                    title="Create New Project"
                    uploading={uploading}
                    onImageUpload={handleImageUpload}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                />

                <ProjectFormModal
                    show={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    setProject={setSelectedProject}
                    onSave={handleUpdateProject}
                    title="Edit Project"
                    uploading={uploading}
                    onImageUpload={handleImageUpload}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                />

                <ImageGalleryModal
                    show={showImageModal}
                    onClose={() => {
                        setShowImageModal(false);
                        setSelectedProject(null);
                        setCurrentImageIndex(0);
                    }}
                    project={selectedProject}
                    currentIndex={currentImageIndex}
                    setCurrentIndex={setCurrentImageIndex}
                />

                <DeleteConfirmModal
                    show={showDeleteConfirm}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setProjectToDelete(null);
                    }}
                    onConfirm={() => handleDeleteProject(projectToDelete?.id)}
                    project={projectToDelete}
                />

                <AnalyticsModal
                    show={showAnalyticsModal}
                    onClose={() => setShowAnalyticsModal(false)}
                    analytics={analytics}
                    projects={projects}
                />
            </div>
        </DashboardLayout>
    );
};

// Project Card Component
const ProjectCard = ({
    project, index, viewMode, isSelected, onToggleSelect, onEdit, onDelete,
    onToggleFeatured, onDuplicate, onViewImages, statusColors, priorityColors
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden 
                       hover:bg-white/10 hover:border-white/20 transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : ''
            } ${viewMode === 'list' ? 'flex' : ''}`}
        >
            {/* Selection Checkbox */}
            <button
                onClick={onToggleSelect}
                className="absolute top-4 left-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-lg 
                         opacity-0 group-hover:opacity-100 transition-all"
            >
                {isSelected ? (
                    <CheckSquare className="text-blue-500" size={18} />
                ) : (
                    <Square className="text-white" size={18} />
                )}
            </button>

            {/* Featured Badge */}
            {project.featured && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-purple-500 rounded-lg 
                              flex items-center gap-1.5 text-white text-xs font-bold shadow-lg">
                    <Star size={12} fill="white" />
                    Featured
                </div>
            )}

            {/* Image */}
            <div className={`relative overflow-hidden ${
                viewMode === 'grid' ? 'h-48' : 'w-64 h-full'
            }`}>
                {project.images?.length > 0 ? (
                    <div
                        onClick={onViewImages}
                        className="w-full h-full cursor-pointer group"
                    >
                        <img
                            src={project.images[0].url}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                                      opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <Maximize2 className="text-white" size={32} />
                        </div>
                        {project.images.length > 1 && (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm 
                                          rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                                <ImageIcon size={12} />
                                +{project.images.length - 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 
                                  flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-600" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${viewMode === 'grid' ? '' : 'flex flex-col'}`}>
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white line-clamp-1">{project.title}</h3>
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                            >
                                <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 
                                                 rounded-xl shadow-xl overflow-hidden z-20"
                                    >
                                        <button onClick={() => { onEdit(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        <button onClick={() => { onDuplicate(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Copy size={16} /> Duplicate
                                        </button>
                                        <button onClick={() => { onToggleFeatured(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Star size={16} /> {project.featured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <hr className="border-white/10" />
                                        <button onClick={() => { onDelete(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{project.description}</p>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusColors[project.status]}`}>
                            {project.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">
                            {project.category}
                        </span>
                        {project.priority && (
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${priorityColors[project.priority]}`}>
                                {project.priority.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Technologies */}
                {project.technologies?.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {project.technologies.slice(0, 5).map((tech, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium">
                                    {tech}
                                </span>
                            ))}
                            {project.technologies.length > 5 && (
                                <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-400">
                                    +{project.technologies.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {project.links?.github && (
                            <a
                                href={project.links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                title="View on GitHub"
                            >
                                <Github size={16} />
                            </a>
                        )}
                        {project.links?.live && (
                            <a
                                href={project.links.live}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                title="Live Demo"
                            >
                                <ExternalLink size={16} />
                            </a>
                        )}
                        {project.links?.demo && (
                            <a
                                href={project.links.demo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                title="Video Demo"
                            >
                                <Video size={16} />
                            </a>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={14} />
                        {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Modal Components
const ImageGalleryModal = ({ show, onClose, project, currentIndex, setCurrentIndex }) => {
    if (!show || !project) return null;
    
    const images = project.images || [];
    
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative max-w-5xl w-full"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg z-10"
                >
                    ✕
                </button>
                
                {images.length > 0 ? (
                    <div className="bg-slate-800 rounded-xl p-6">
                        <img
                            src={images[currentIndex]}
                            alt={`${project.title} - ${currentIndex + 1}`}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg"
                            >
                                Previous
                            </button>
                            <span className="text-white">{currentIndex + 1} / {images.length}</span>
                            <button
                                onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                                disabled={currentIndex === images.length - 1}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-400">
                        No images available
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const DeleteConfirmModal = ({ show, onClose, onConfirm, project }) => {
    if (!show || !project) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full"
            >
                <h3 className="text-2xl font-bold text-red-400 mb-4">Delete Project</h3>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const AnalyticsModal = ({ show, onClose, analytics, projects }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Project Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Projects</p>
                        <p className="text-3xl font-bold text-white">{projects.length}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Published</p>
                        <p className="text-3xl font-bold text-green-400">
                            {projects.filter(p => p.status === 'published').length}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">In Progress</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {projects.filter(p => p.status === 'in-progress').length}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Views</p>
                        <p className="text-3xl font-bold text-cyan-400">
                            {projects.reduce((acc, p) => acc + (p.views || 0), 0)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

export default ProjectManagerEnhanced;