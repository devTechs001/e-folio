import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Filter, MoreVertical, Edit, Trash2, Archive,
    CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, Mail,
    Shield, Settings, Eye, Download, ExternalLink, X, ChevronDown,
    ChevronUp, UserPlus, Shield as TaskSquare, FolderOpen, BarChart, Zap,
    Lock, Unlock, Star, MessageSquare, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const WorkspaceManager = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { success, error, info } = useNotifications();

    // State Management
    const [workspaces, setWorkspaces] = useState([]);
    const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, archived: 0, totalCollaborators: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    // Form states
    const [createData, setCreateData] = useState({
        name: '',
        description: '',
        workspaceType: 'custom',
        settings: {
            allowCollaboratorInteraction: false,
            enableChat: false,
            enableTaskBoard: true,
            enableFileSharing: true,
            enableAnalytics: true,
            visibility: 'private'
        }
    });

    const [addCollaboratorData, setAddCollaboratorData] = useState({
        email: '',
        name: '',
        role: 'contributor',
        permissions: {
            read: true,
            write: false,
            delete: false,
            manage_tasks: false,
            manage_files: false,
            view_analytics: false,
            collaborate_with_others: false
        }
    });

    // Workspace types
    const workspaceTypes = [
        { value: 'development', label: 'Development', icon: '💻' },
        { value: 'design', label: 'Design', icon: '🎨' },
        { value: 'marketing', label: 'Marketing', icon: '📈' },
        { value: 'content', label: 'Content', icon: '📝' },
        { value: 'research', label: 'Research', icon: '🔬' },
        { value: 'custom', label: 'Custom', icon: '⚙️' }
    ];

    const roleOptions = [
        { value: 'admin', label: 'Admin', color: 'purple' },
        { value: 'editor', label: 'Editor', color: 'blue' },
        { value: 'viewer', label: 'Viewer', color: 'gray' },
        { value: 'contributor', label: 'Contributor', color: 'green' }
    ];

    // Load workspaces
    const loadWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getWorkspaces();
            if (response.success) {
                setWorkspaces(response.workspaces || []);
                setStats(response.stats || stats);
            } else {
                // Handle API errors gracefully
                console.warn('Workspace API returned non-success:', response);
                setWorkspaces([]);
                // Don't show error for 404 - workspaces might not be set up yet
                if (response.message && !response.message.includes('404')) {
                    error('Failed to load workspaces');
                }
            }
        } catch (err) {
            console.error('Error loading workspaces:', err);
            // Don't show error for 404 - workspaces might not be set up yet
            if (err.message && !err.message.includes('404')) {
                error('Failed to load workspaces');
            }
            setWorkspaces([]); // Set empty array to prevent crashes
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        if (isOwner()) {
            loadWorkspaces();
        }
    }, [isOwner, loadWorkspaces]);

    // Filter and search
    useEffect(() => {
        let filtered = [...workspaces];

        if (filterStatus !== 'all') {
            filtered = filtered.filter(w => w.status === filterStatus);
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(w => w.workspaceType === filterType);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(w =>
                w.name.toLowerCase().includes(query) ||
                w.description?.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a[sortBy] || 0);
            const dateB = new Date(b[sortBy] || 0);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        setFilteredWorkspaces(filtered);
    }, [workspaces, searchQuery, filterStatus, filterType, sortBy, sortOrder]);

    // Handlers
    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        try {
            const response = await apiService.createWorkspace(createData);
            if (response.success) {
                success('Workspace created successfully!');
                setShowCreateModal(false);
                loadWorkspaces();
                setCreateData({
                    name: '',
                    description: '',
                    workspaceType: 'custom',
                    settings: {
                        allowCollaboratorInteraction: false,
                        enableChat: false,
                        enableTaskBoard: true,
                        enableFileSharing: true,
                        enableAnalytics: true,
                        visibility: 'private'
                    }
                });
            }
        } catch (err) {
            console.error('Create workspace error:', err);
            error('Failed to create workspace');
        }
    };

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        if (!selectedWorkspace) return;

        try {
            const response = await apiService.addCollaborator(selectedWorkspace._id, addCollaboratorData);
            if (response.success) {
                success('Collaborator added successfully!');
                setShowAddCollaboratorModal(false);
                loadWorkspaces();
                setAddCollaboratorData({
                    email: '',
                    name: '',
                    role: 'contributor',
                    permissions: {
                        read: true,
                        write: false,
                        delete: false,
                        manage_tasks: false,
                        manage_files: false,
                        view_analytics: false,
                        collaborate_with_others: false
                    }
                });
            }
        } catch (err) {
            console.error('Add collaborator error:', err);
            error(err.response?.data?.message || 'Failed to add collaborator');
        }
    };

    const handleArchiveWorkspace = async (workspaceId) => {
        if (!confirm('Are you sure you want to archive this workspace?')) return;

        try {
            const response = await apiService.archiveWorkspace(workspaceId);
            if (response.success) {
                success('Workspace archived');
                loadWorkspaces();
            }
        } catch (err) {
            error('Failed to archive workspace');
        }
    };

    const handleDeleteWorkspace = async (workspaceId) => {
        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;

        try {
            const response = await apiService.deleteWorkspace(workspaceId);
            if (response.success) {
                success('Workspace deleted');
                loadWorkspaces();
            }
        } catch (err) {
            error('Failed to delete workspace');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'archived': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
            case 'suspended': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeIcon = (type) => {
        const found = workspaceTypes.find(t => t.value === type);
        return found?.icon || '⚙️';
    };

    // Access check
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 max-w-md">
                        <Users size={64} className="text-red-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-3">
                            Access Restricted
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Workspace management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Workspace Manager"
            subtitle="Manage collaborator workspaces and access"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total Workspaces</span>
                        <FolderOpen className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.total}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-green-700 dark:text-green-300">Active</span>
                        <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-blue-100">
                        {stats.active}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Collaborators</span>
                        <Users className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.totalCollaborators}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Archived</span>
                        <Archive className="text-amber-600 dark:text-amber-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                        {stats.archived}
                    </div>
                </motion.div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search workspaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            {workspaceTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Workspace
                        </button>
                    </div>
                </div>
            </div>

            {/* Workspaces Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse border border-gray-200 dark:border-gray-700">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filteredWorkspaces.length === 0 ? (
                <div className="text-center py-20">
                    <FolderOpen size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No workspaces found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first workspace to get started
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                        Create Workspace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkspaces.map((workspace) => (
                        <motion.div
                            key={workspace._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getTypeIcon(workspace.workspaceType)}</span>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {workspace.name}
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workspace.status)}`}>
                                            {workspace.status}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedWorkspace(workspace);
                                        setShowDetailsModal(true);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {workspace.description || 'No description'}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Users size={14} />
                                        Collaborators
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {workspace.collaborators?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <TaskSquare size={14} />
                                        Tasks
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {workspace.tasks?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Calendar size={14} />
                                        Created
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(workspace.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setSelectedWorkspace(workspace);
                                        setShowAddCollaboratorModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={14} />
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedWorkspace(workspace);
                                        setShowSettingsModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Settings size={14} />
                                    Settings
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Workspace Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Create New Workspace
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateWorkspace} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Workspace Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.name}
                                        onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        placeholder="e.g., Project Alpha Development"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={createData.description}
                                        onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        placeholder="Describe the workspace purpose..."
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Workspace Type
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {workspaceTypes.map(type => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setCreateData(prev => ({ ...prev, workspaceType: type.value }))}
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    createData.workspaceType === type.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="text-2xl mb-1 block">{type.icon}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {type.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Settings
                                    </label>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'allowCollaboratorInteraction', label: 'Allow Collaborator Interaction', desc: 'Collaborators can see and interact with each other' },
                                            { key: 'enableChat', label: 'Enable Chat', desc: 'Allow real-time messaging' },
                                            { key: 'enableTaskBoard', label: 'Enable Task Board', desc: 'Show task management features' },
                                            { key: 'enableFileSharing', label: 'Enable File Sharing', desc: 'Allow file uploads and sharing' },
                                            { key: 'enableAnalytics', label: 'Enable Analytics', desc: 'Show workspace analytics' }
                                        ].map(setting => (
                                            <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{setting.label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{setting.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={createData.settings[setting.key]}
                                                        onChange={(e) => setCreateData(prev => ({
                                                            ...prev,
                                                            settings: { ...prev.settings, [setting.key]: e.target.checked }
                                                        }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                    >
                                        Create Workspace
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Collaborator Modal */}
            <AnimatePresence>
                {showAddCollaboratorModal && selectedWorkspace && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto"
                        onClick={() => setShowAddCollaboratorModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Add Collaborator to {selectedWorkspace.name}
                                </h2>
                                <button
                                    onClick={() => setShowAddCollaboratorModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddCollaborator} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={addCollaboratorData.name}
                                            onChange={(e) => setAddCollaboratorData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={addCollaboratorData.email}
                                            onChange={(e) => setAddCollaboratorData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Role
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {roleOptions.map(role => (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => setAddCollaboratorData(prev => ({ ...prev, role: role.value }))}
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    addCollaboratorData.role === role.value
                                                        ? `border-${role.color}-500 bg-${role.color}-50 dark:bg-${role.color}-900/20`
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {role.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Permissions
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'write', label: 'Write Access', desc: 'Can create and edit content' },
                                            { key: 'delete', label: 'Delete Access', desc: 'Can delete content' },
                                            { key: 'manage_tasks', label: 'Manage Tasks', desc: 'Can create and assign tasks' },
                                            { key: 'manage_files', label: 'Manage Files', desc: 'Can upload and manage files' },
                                            { key: 'view_analytics', label: 'View Analytics', desc: 'Can see workspace analytics' },
                                            { key: 'collaborate_with_others', label: 'Collaborate with Others', desc: 'Can interact with other collaborators' }
                                        ].map(perm => (
                                            <div key={perm.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{perm.label}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{perm.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={addCollaboratorData.permissions[perm.key]}
                                                        onChange={(e) => setAddCollaboratorData(prev => ({
                                                            ...prev,
                                                            permissions: { ...prev.permissions, [perm.key]: e.target.checked }
                                                        }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCollaboratorModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                    >
                                        Add Collaborator
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Details Modal and other modals would go here */}
        </DashboardLayout>
    );
};

export default WorkspaceManager;
