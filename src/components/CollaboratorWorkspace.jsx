import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen, Square as TaskSquare, Users, FileText, BarChart, Settings,
    Clock, CheckCircle, AlertCircle, TrendingUp, Calendar, Mail,
    MessageSquare, Upload, Download, ExternalLink, Plus, X,
    ChevronDown, ChevronUp, Star, Lock, Unlock, Activity, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/api.service';
import DashboardLayout from './dashboard/DashboardLayout';

const CollaboratorWorkspace = () => {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const { success, error, info } = useNotifications();

    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, tasks, files, collaborators, analytics
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
    });

    // Load collaborator's workspaces
    const loadWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaboratorWorkspaces();
            if (response.success) {
                setWorkspaces(response.workspaces || []);
                if (response.workspaces.length === 1) {
                    setSelectedWorkspace(response.workspaces[0]);
                }
            }
        } catch (err) {
            console.error('Error loading workspaces:', err);
            error('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        if (isAuthenticated && user) {
            loadWorkspaces();
        }
    }, [isAuthenticated, user, loadWorkspaces]);

    // Check permissions
    const hasPermission = useCallback((permission) => {
        if (!selectedWorkspace) return false;
        
        const collaborator = selectedWorkspace.collaborators?.find(
            c => c.userId?._id === user.id || c.userId === user.id
        );
        
        if (!collaborator) return false;
        
        return collaborator.permissions?.[permission] || false;
    }, [selectedWorkspace, user]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!selectedWorkspace) return;

        try {
            const response = await apiService.addTask(selectedWorkspace._id, {
                ...newTask,
                assignedTo: user.id
            });
            
            if (response.success) {
                success('Task created successfully!');
                setShowTaskModal(false);
                loadWorkspaces();
                setNewTask({
                    title: '',
                    description: '',
                    priority: 'medium',
                    dueDate: ''
                });
            }
        } catch (err) {
            console.error('Add task error:', err);
            error('Failed to create task');
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        if (!selectedWorkspace) return;

        try {
            const response = await apiService.updateTaskStatus(selectedWorkspace._id, taskId, status);
            if (response.success) {
                success('Task status updated!');
                loadWorkspaces();
            }
        } catch (err) {
            error('Failed to update task status');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'review': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (!isAuthenticated) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center p-10 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 max-w-md">
                        <FolderOpen size={64} className="text-blue-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                            Please Login
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            You need to be logged in to access your workspace
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (workspaces.length === 0) {
        return (
            <DashboardLayout
                title="My Workspace"
                subtitle="Your collaborative workspace"
            >
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <FolderOpen size={80} className="text-gray-400 mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        No Workspaces Yet
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                        You haven't been added to any workspace yet. The owner will invite you to a workspace soon.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 max-w-md text-center">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            💡 <strong>Tip:</strong> Check your email for workspace invitations!
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="My Workspace"
            subtitle="Your collaborative workspace"
        >
            {/* Workspace Selector */}
            {workspaces.length > 1 && (
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Select Workspace
                    </label>
                    <select
                        value={selectedWorkspace?._id || ''}
                        onChange={(e) => {
                            const workspace = workspaces.find(w => w._id === e.target.value);
                            setSelectedWorkspace(workspace);
                        }}
                        className="w-full max-w-md px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                        {workspaces.map(workspace => (
                            <option key={workspace._id} value={workspace._id}>
                                {workspace.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedWorkspace && (
                <>
                    {/* Workspace Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{selectedWorkspace.name}</h2>
                                <p className="text-blue-100 mb-4">{selectedWorkspace.description || 'No description'}</p>
                                <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-2">
                                        <Users size={16} />
                                        {selectedWorkspace.collaborators?.length || 0} Collaborators
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <TaskSquare size={16} />
                                        {selectedWorkspace.tasks?.length || 0} Tasks
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        Created {new Date(selectedWorkspace.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-6xl opacity-50">
                                {selectedWorkspace.workspaceType === 'development' && '💻'}
                                {selectedWorkspace.workspaceType === 'design' && '🎨'}
                                {selectedWorkspace.workspaceType === 'marketing' && '📈'}
                                {selectedWorkspace.workspaceType === 'content' && '📝'}
                                {selectedWorkspace.workspaceType === 'research' && '🔬'}
                                {selectedWorkspace.workspaceType === 'custom' && '⚙️'}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
                        <div className="flex overflow-x-auto">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart },
                                { id: 'tasks', label: 'Tasks', icon: TaskSquare },
                                { id: 'files', label: 'Files', icon: FileText },
                                { id: 'collaborators', label: 'Team', icon: Users },
                                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {/* Quick Stats */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white">My Tasks</h3>
                                        <TaskSquare className="text-blue-500" size={24} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {selectedWorkspace.tasks?.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id).length || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                                            <span className="font-bold text-blue-600">
                                                {selectedWorkspace.tasks?.filter(t => t.status === 'in_progress' && (t.assignedTo?._id === user.id || t.assignedTo === user.id)).length || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                                            <span className="font-bold text-green-600">
                                                {selectedWorkspace.tasks?.filter(t => t.status === 'completed' && (t.assignedTo?._id === user.id || t.assignedTo === user.id)).length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 md:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                                        <Activity className="text-purple-500" size={24} />
                                    </div>
                                    <div className="space-y-3">
                                        {selectedWorkspace.activity?.slice(0, 5).map((activity, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900 dark:text-white">{activity.details}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )) || (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 md:col-span-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {hasPermission('manage_tasks') && (
                                            <button
                                                onClick={() => setShowTaskModal(true)}
                                                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                                            >
                                                <Plus size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Add Task</p>
                                            </button>
                                        )}
                                        {hasPermission('manage_files') && (
                                            <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all">
                                                <Upload size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Upload File</p>
                                            </button>
                                        )}
                                        {selectedWorkspace.settings?.enableChat && (
                                            <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all">
                                                <MessageSquare size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Send Message</p>
                                            </button>
                                        )}
                                        <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all">
                                            <ExternalLink size={24} className="mb-2" />
                                            <p className="text-sm font-medium">View Projects</p>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tasks' && (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Tasks</h3>
                                    {hasPermission('manage_tasks') && (
                                        <button
                                            onClick={() => setShowTaskModal(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Add Task
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {selectedWorkspace.tasks?.map((task) => (
                                        <div
                                            key={task._id}
                                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                                        {task.title}
                                                    </h4>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {task.description || 'No description'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                                                    </span>
                                                    {task.assignedTo && (
                                                        <span className="flex items-center gap-2">
                                                            <Users size={14} />
                                                            Assigned to: {task.assignedTo.name || 'Unassigned'}
                                                        </span>
                                                    )}
                                                </div>

                                                {hasPermission('manage_tasks') && (
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                                                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="review">Review</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    )) || (
                                        <div className="text-center py-20">
                                            <TaskSquare size={64} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-600 dark:text-gray-400">No tasks yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'files' && (
                            <motion.div
                                key="files"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-20"
                            >
                                {hasPermission('manage_files') ? (
                                    <>
                                        <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            File Sharing
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                            Upload and share files with your team
                                        </p>
                                        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                                            Upload File
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={64} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            No Access
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            You don't have permission to access files
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'collaborators' && (
                            <motion.div
                                key="collaborators"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Team Members</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Owner */}
                                    {selectedWorkspace.ownerId && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {selectedWorkspace.ownerId.name?.charAt(0) || 'O'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                        {selectedWorkspace.ownerId.name || 'Owner'}
                                                    </h4>
                                                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                                        Owner
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {selectedWorkspace.ownerId.email || 'owner@workspace.com'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Collaborators */}
                                    {selectedWorkspace.collaborators?.map((collaborator, index) => (
                                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {collaborator.name?.charAt(0) || collaborator.email?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                        {collaborator.name || 'Collaborator'}
                                                    </h4>
                                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full capitalize">
                                                        {collaborator.role}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                {collaborator.email}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {collaborator.permissions?.read && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Read</span>
                                                )}
                                                {collaborator.permissions?.write && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Write</span>
                                                )}
                                                {collaborator.permissions?.manage_tasks && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Tasks</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {selectedWorkspace.settings?.enableAnalytics ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 dark:text-white">Task Completion</h3>
                                                <CheckCircle className="text-green-500" size={24} />
                                            </div>
                                            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                {selectedWorkspace.analytics?.completedTasks || 0}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                of {selectedWorkspace.analytics?.totalTasks || 0} total tasks
                                            </p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 dark:text-white">Team Size</h3>
                                                <Users className="text-blue-500" size={24} />
                                            </div>
                                            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                {selectedWorkspace.collaborators?.length || 0}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                active collaborators
                                            </p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 dark:text-white">Last Activity</h3>
                                                <Activity className="text-purple-500" size={24} />
                                            </div>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                {selectedWorkspace.analytics?.lastActivity 
                                                    ? new Date(selectedWorkspace.analytics.lastActivity).toLocaleDateString()
                                                    : 'No activity'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                on the workspace
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <Lock size={64} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Analytics Disabled
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            The owner has disabled analytics for this workspace
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Add Task Modal */}
                    <AnimatePresence>
                        {showTaskModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
                                onClick={() => setShowTaskModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Add New Task
                                        </h2>
                                        <button
                                            onClick={() => setShowTaskModal(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <X size={24} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddTask} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Task Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={newTask.title}
                                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                placeholder="Enter task title"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={newTask.description}
                                                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                placeholder="Describe the task..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Priority
                                                </label>
                                                <select
                                                    value={newTask.priority}
                                                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Due Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={newTask.dueDate}
                                                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowTaskModal(false)}
                                                className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                            >
                                                Create Task
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </DashboardLayout>
    );
};

export default CollaboratorWorkspace;
