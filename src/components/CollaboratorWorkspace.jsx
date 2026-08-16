import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen, Square as TaskSquare, Users, FileText, BarChart, Settings,
    Clock, CheckCircle, AlertCircle, TrendingUp, Calendar, Mail,
    MessageSquare, GitBranch, Rocket, Image as ImageIcon, Link2, StickyNote,
    Trash2, Send, Server, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/api.service';
import DashboardLayout from './dashboard/DashboardLayout';

const isDevWorkspace = (w) => w?.workspaceType === 'development';

const CollaboratorWorkspace = () => {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const { socket, connected } = useSocket();
    const { success, error, info } = useNotifications();

    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
    });

    // Chat state
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Resources state (files + links + notes)
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [newResource, setNewResource] = useState({ name: '', type: 'link', url: '' });

    // Commits state
    const [commits, setCommits] = useState([]);
    const [commitForm, setCommitForm] = useState({ message: '', branch: 'main', filesChanged: 0, additions: 0, deletions: 0 });

    // Builds state
    const [builds, setBuilds] = useState([]);
    const [building, setBuilding] = useState(false);
    const buildTimersRef = useRef([]);

    // Load collaborator's workspaces
    const loadWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaboratorWorkspaces();
            if (response.success) {
                setWorkspaces(response.workspaces || []);
                if (response.workspaces.length === 1) {
                    setSelectedWorkspace(response.workspaces[0]);
                    setActiveTab('overview');
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

    // Load chat / commits / builds whenever the selected workspace changes
    useEffect(() => {
        if (!selectedWorkspace || !selectedWorkspace._id) return;

        // Chat
        if (selectedWorkspace.settings?.enableChat) {
            setChatLoading(true);
            apiService.getWorkspaceMessages(selectedWorkspace._id)
                .then(resp => {
                    if (resp.success) setMessages(resp.messages || []);
                })
                .catch(() => {})
                .finally(() => setChatLoading(false));
        }

        // Commits (dev workspaces)
        if (isDevWorkspace(selectedWorkspace)) {
            apiService.getWorkspaceCommits(selectedWorkspace._id)
                .then(resp => { if (resp.success) setCommits(resp.commits || []); })
                .catch(() => {});

            apiService.getWorkspaceBuilds(selectedWorkspace._id)
                .then(resp => { if (resp.success) setBuilds(resp.builds || []); })
                .catch(() => {});
        }
    }, [selectedWorkspace?._id]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, activeTab]);

    // Cleanup build timers
    useEffect(() => {
        return () => {
            buildTimersRef.current.forEach(clearTimeout);
        };
    }, []);

    // Real-time socket listeners
    useEffect(() => {
        if (!connected || !socket) return;

        const workspaceId = selectedWorkspace?._id;

        const handleMessage = (data) => {
            if (!data || data.workspaceId !== workspaceId) return;
            setMessages(prev => [...prev, data.message]);
        };
        const handleResource = (data) => {
            if (!data || data.workspaceId !== workspaceId) return;
            success('New resource shared in workspace!');
        };
        const handleCommit = (data) => {
            if (!data || data.workspaceId !== workspaceId) return;
            setCommits(prev => [data.commit, ...prev]);
            info(`New commit: ${data.commit?.message || 'Update'}`);
        };
        const handleBuild = (data) => {
            if (!data || data.workspaceId !== workspaceId) return;
            setBuilds(prev => [data.build, ...prev.filter(b => b._id !== data.build?._id)]);
        };
        const handleBuildUpdated = (data) => {
            if (!data || data.workspaceId !== workspaceId) return;
            setBuilds(prev => prev.map(b => b._id === data.buildId ? data.build : b));
        };

        socket.on('workspace:message', handleMessage);
        socket.on('workspace:resource', handleResource);
        socket.on('workspace:commit', handleCommit);
        socket.on('workspace:build', handleBuild);
        socket.on('workspace:build-updated', handleBuildUpdated);

        return () => {
            socket.off('workspace:message', handleMessage);
            socket.off('workspace:resource', handleResource);
            socket.off('workspace:commit', handleCommit);
            socket.off('workspace:build', handleBuild);
            socket.off('workspace:build-updated', handleBuildUpdated);
        };
    }, [connected, socket, selectedWorkspace?._id]);

    // Check permissions
    const hasPermission = useCallback((permission) => {
        if (!selectedWorkspace) return false;

        const collaborator = selectedWorkspace.collaborators?.find(
            c => c.userId?._id === user.id || c.userId === user.id
        );

        if (!collaborator) return false;

        return collaborator.permissions?.[permission] || false;
    }, [selectedWorkspace, user]);

    const isCurrentUserOwner = () =>
        selectedWorkspace && String(selectedWorkspace.ownerId?._id || selectedWorkspace.ownerId) === String(user.id);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = messageText.trim();
        if (!text || !selectedWorkspace) return;

        const optimistic = {
            _id: `temp-${Date.now()}`,
            name: user.name || user.username || 'You',
            content: text,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimistic]);
        setMessageText('');

        try {
            const response = await apiService.sendWorkspaceMessage(selectedWorkspace._id, text);
            if (response.success && response.data) {
                setMessages(prev =>
                    prev.map(m => (m._id === optimistic._id ? response.data : m))
                );
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m._id !== optimistic._id));
            error('Failed to send message');
            setMessageText(text);
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        if (!selectedWorkspace || !newResource.name.trim()) return;

        try {
            const response = await apiService.addWorkspaceResource(selectedWorkspace._id, {
                name: newResource.name.trim(),
                type: newResource.type,
                url: newResource.url.trim()
            });
            if (response.success) {
                success('Resource added!');
                setShowResourceModal(false);
                setNewResource({ name: '', type: 'link', url: '' });
                loadWorkspaces();
            }
        } catch (err) {
            error(err?.message || 'Failed to add resource');
        }
    };

    const handleDeleteResource = async (resourceId) => {
        if (!selectedWorkspace) return;
        try {
            const response = await apiService.deleteWorkspaceResource(selectedWorkspace._id, resourceId);
            if (response.success) {
                success('Resource deleted');
                loadWorkspaces();
            }
        } catch (err) {
            error(err?.message || 'Failed to delete resource');
        }
    };

    const handleAddCommit = async (e) => {
        e.preventDefault();
        if (!selectedWorkspace || !commitForm.message.trim()) return;

        const sha = Array.from({ length: 8 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        const optimistic = {
            _id: `temp-commit-${Date.now()}`,
            message: commitForm.message.trim(),
            author: user.name || 'You',
            branch: commitForm.branch || 'main',
            filesChanged: Number(commitForm.filesChanged) || 0,
            additions: Number(commitForm.additions) || 0,
            deletions: Number(commitForm.deletions) || 0,
            sha,
            timestamp: new Date().toISOString()
        };
        setCommits(prev => [optimistic, ...prev]);
        setCommitForm({ message: '', branch: 'main', filesChanged: 0, additions: 0, deletions: 0 });

        try {
            const response = await apiService.addWorkspaceCommit(selectedWorkspace._id, {
                message: optimistic.message,
                branch: optimistic.branch,
                filesChanged: optimistic.filesChanged,
                additions: optimistic.additions,
                deletions: optimistic.deletions
            });
            if (response.success) {
                success('Commit recorded!');
                setCommits(prev => prev.map(c => c._id === optimistic._id ? response.commit : c));
            }
        } catch (err) {
            error('Failed to record commit');
        }
    };

    const runBuildPipeline = async (buildId) => {
        const logs = [];
        const pushLog = (line) => setBuilds(prev => prev.map(b => {
            if (b._id !== buildId) return b;
            return { ...b, status: 'running', logs: [...(b.logs || []), line] };
        }));

        const stage = (log, ms) => new Promise(resolve => {
            const t = setTimeout(async () => {
                pushLog(log);
                await apiService.updateWorkspaceBuild(selectedWorkspace._id, buildId, {
                    status: 'running',
                    logs: [...logs, log]
                });
                resolve();
            }, ms);
            buildTimersRef.current.push(t);
        });

        try {
            await stage('$ npm ci', 800);
            await stage('$ npm run build', 1200);
            await stage('> Building production bundle...', 800);
            await stage('$ npm run test -- --ci', 900);
            const outcome = Math.random() > 0.15 ? 'passed' : 'failed';
            const duration = Math.round(3 + Math.random() * 6);
            const finalLogs = [...logs, outcome === 'passed'
                ? '✓ Build passed in ' + duration + 's'
                : '✗ Build failed — see logs for details'];
            await apiService.updateWorkspaceBuild(selectedWorkspace._id, buildId, {
                status: outcome,
                logs: finalLogs,
                duration
            });
            setBuilds(prev => prev.map(b => b._id === buildId
                ? { ...b, status: outcome, logs: finalLogs, duration }
                : b));
            success(outcome === 'passed' ? 'Build passed!' : 'Build failed');
        } catch (err) {
            error('Build pipeline error');
        }
    };

    const handleTriggerBuild = async () => {
        if (!selectedWorkspace) return;
        setBuilding(true);
        try {
            const latest = commits[0] || null;
            const response = await apiService.triggerWorkspaceBuild(selectedWorkspace._id, {
                branch: commitForm.branch || latest?.branch || 'main',
                commitMessage: latest?.message || 'Manual build',
                commitSha: latest?.sha || null
            });
            if (response.success && response.build) {
                const newBuild = response.build;
                setBuilds(prev => [newBuild, ...prev]);
                info('Build queued — running pipeline...');
                setTimeout(() => runBuildPipeline(newBuild._id), 300);
            }
        } catch (err) {
            error('Failed to trigger build');
        } finally {
            setBuilding(false);
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

    const getBuildStatusColor = (status) => {
        switch (status) {
            case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'queued': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
            case 'cancelled': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'image': return ImageIcon;
            case 'link': return Link2;
            case 'note': return StickyNote;
            case 'file': return FileText;
            default: return FileText;
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

    const tabList = [
        { id: 'overview', label: 'Overview', icon: BarChart },
        { id: 'tasks', label: 'Tasks', icon: TaskSquare },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'files', label: 'Files', icon: FileText },
        { id: 'media', label: 'Media', icon: ImageIcon },
        { id: 'team', label: 'Team', icon: Users },
        ...(isDevWorkspace(selectedWorkspace)
            ? [
                { id: 'commits', label: 'Commits', icon: GitBranch },
                { id: 'builds', label: 'Builds', icon: Rocket }
            ]
            : []),
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    const chatDisabled = selectedWorkspace && selectedWorkspace.settings?.enableChat === false;
    const imageResources = selectedWorkspace?.resources?.filter(r => r.type === 'image' || /\.(png|jpe?g|gif|webp|svg|mp4|webm)$/i.test(r.url || '')) || [];
    const otherResources = selectedWorkspace?.resources?.filter(r => r.type !== 'image') || [];

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
                            setMessages([]);
                            setCommits([]);
                            setBuilds([]);
                            setActiveTab('overview');
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
                                <div className="flex gap-4 text-sm flex-wrap">
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
                                    {isDevWorkspace(selectedWorkspace) && (
                                        <span className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                                            <GitBranch size={14} />
                                            {commits.length} commits · {builds.length} builds
                                        </span>
                                    )}
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
                            {tabList.map(tab => (
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
                                    {tab.id === 'chat' && chatDisabled && <Lock size={12} className="opacity-50" />}
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
                                        {(selectedWorkspace.activity?.slice(0, 5).map((activity, index) => (
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
                                        ))}
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
                                            <button
                                                onClick={() => setShowResourceModal(true)}
                                                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                                            >
                                                <Upload size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Share Resource</p>
                                            </button>
                                        )}
                                        {!chatDisabled && (
                                            <button
                                                onClick={() => setActiveTab('chat')}
                                                className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
                                            >
                                                <MessageSquare size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Open Chat</p>
                                            </button>
                                        )}
                                        {isDevWorkspace(selectedWorkspace) && (
                                            <button
                                                onClick={() => setActiveTab('builds')}
                                                className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all"
                                            >
                                                <Rocket size={24} className="mb-2" />
                                                <p className="text-sm font-medium">Run Build</p>
                                            </button>
                                        )}
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

                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {chatDisabled ? (
                                    <div className="text-center py-20">
                                        <Lock size={64} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Chat Disabled
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            The owner has disabled chat for this workspace
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <MessageSquare size={18} className="text-green-500" />
                                                Workspace Chat
                                                {connected && (
                                                    <span className="text-xs font-normal text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
                                                    </span>
                                                )}
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {messages.length} messages
                                            </span>
                                        </div>

                                        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                                            {chatLoading && (
                                                <div className="text-center text-sm text-gray-500">
                                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                                                    Loading messages...
                                                </div>
                                            )}
                                            {!chatLoading && messages.length === 0 && (
                                                <div className="text-center py-16">
                                                    <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                        No messages yet. Start the conversation!
                                                    </p>
                                                </div>
                                            )}
                                            {messages.map((msg, idx) => {
                                                const mine = String(msg.userId) === String(user.id);
                                                return (
                                                    <div key={msg._id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] ${mine ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'} rounded-2xl px-4 py-3 shadow-sm`}>
                                                            {!mine && (
                                                                <div className="text-xs font-semibold mb-1 text-blue-500 dark:text-blue-400">
                                                                    {msg.name}
                                                                </div>
                                                            )}
                                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                            <div className={`text-[11px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={chatEndRef} />
                                        </div>

                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-800">
                                            <input
                                                type="text"
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!messageText.trim()}
                                                className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-2"
                                            >
                                                <Send size={18} />
                                                Send
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'files' && (
                            <motion.div
                                key="files"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shared Resources</h3>
                                    {hasPermission('manage_files') && (
                                        <button
                                            onClick={() => setShowResourceModal(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Share Resource
                                        </button>
                                    )}
                                </div>

                                {hasPermission('manage_files') || selectedWorkspace?.resources?.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedWorkspace?.resources?.length === 0 && (
                                            <div className="text-center py-20">
                                                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400">No resources shared yet</p>
                                            </div>
                                        )}
                                        {selectedWorkspace?.resources?.map((resource) => {
                                            const Icon = getResourceIcon(resource.type);
                                            const isImage = resource.type === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(resource.url || '');
                                            const mine = String(resource.uploadedBy?._id || resource.uploadedBy) === String(user.id);
                                            const canDelete = mine || isCurrentUserOwner();
                                            return (
                                                <div key={resource._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                                                        {isImage ? <ImageIcon size={22} /> : <Icon size={22} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{resource.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {resource.type === 'link' ? (
                                                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate inline-block max-w-full">
                                                                    {resource.url}
                                                                </a>
                                                            ) : (
                                                                resource.url || 'note'
                                                            )}
                                                            <span className="mx-2">·</span>
                                                            Shared {new Date(resource.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        {resource.type === 'link' && resource.url && (
                                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                <ExternalLink size={18} />
                                                            </a>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDeleteResource(resource._id)}
                                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <Lock size={64} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            No Access
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            You don't have permission to manage files
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'media' && (
                            <motion.div
                                key="media"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Media Gallery</h3>
                                    {hasPermission('manage_files') && (
                                        <button
                                            onClick={() => setShowResourceModal(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Add Media
                                        </button>
                                    )}
                                </div>

                                {imageResources.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {imageResources.map((resource) => (
                                            <div key={resource._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
                                                <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                                    {(/\.(png|jpe?g|gif|webp|svg)$/i.test(resource.url || '')) ? (
                                                        <img src={resource.url} alt={resource.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                                                    ) : (
                                                        <ImageIcon size={40} className="text-gray-300 dark:text-gray-600" />
                                                    )}
                                                </div>
                                                <div className="p-3 flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{resource.name}</p>
                                                    {resource.url && (
                                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 ml-2 shrink-0">
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <ImageIcon size={64} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            No media shared yet. Share image or video links in the Files tab to see them here.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'team' && (
                            <motion.div
                                key="team"
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
                                                {collaborator.permissions?.manage_files && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Files</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'commits' && isDevWorkspace(selectedWorkspace) && (
                            <motion.div
                                key="commits"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Commit form */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-fit">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <GitBranch size={18} className="text-orange-500" />
                                            Record Commit
                                        </h3>
                                        <form onSubmit={handleAddCommit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Branch
                                                </label>
                                                <input
                                                    type="text"
                                                    value={commitForm.branch}
                                                    onChange={(e) => setCommitForm(prev => ({ ...prev, branch: e.target.value || 'main' }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                                                    placeholder="main"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Commit Message *
                                                </label>
                                                <textarea
                                                    value={commitForm.message}
                                                    onChange={(e) => setCommitForm(prev => ({ ...prev, message: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                                                    placeholder="feat: add real-time chat"
                                                    rows={3}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Files</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={commitForm.filesChanged}
                                                        onChange={(e) => setCommitForm(prev => ({ ...prev, filesChanged: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 text-green-600">+ Additions</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={commitForm.additions}
                                                        onChange={(e) => setCommitForm(prev => ({ ...prev, additions: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 text-red-600">− Deletions</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={commitForm.deletions}
                                                        onChange={(e) => setCommitForm(prev => ({ ...prev, deletions: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!commitForm.message.trim()}
                                                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                                            >
                                                <GitBranch size={18} />
                                                Commit
                                            </button>
                                        </form>
                                    </div>

                                    {/* Commit history */}
                                    <div className="lg:col-span-2 space-y-3">
                                        {commits.length === 0 && (
                                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                                <GitBranch size={64} className="mx-auto text-gray-400 mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400">No commits yet. Record your first commit!</p>
                                            </div>
                                        )}
                                        {commits.map((commit) => (
                                            <div key={commit._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                            {commit.author?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{commit.message}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {commit.author} · <span className="font-mono text-orange-500">{commit.sha}</span> · on {commit.branch}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-right shrink-0">
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            {new Date(commit.timestamp).toLocaleString()}
                                                        </p>
                                                        <p className="mt-1">
                                                            <span className="text-green-600 font-mono">+{commit.additions || 0}</span>
                                                            <span className="mx-1 text-gray-400">/</span>
                                                            <span className="text-red-600 font-mono">-{commit.deletions || 0}</span>
                                                            <span className="ml-2 text-gray-500">({commit.filesChanged || 0} files)</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'builds' && isDevWorkspace(selectedWorkspace) && (
                            <motion.div
                                key="builds"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Build Pipeline</h3>
                                    <button
                                        onClick={handleTriggerBuild}
                                        disabled={building}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-2"
                                    >
                                        {building ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                                Triggering...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket size={18} />
                                                Run Build
                                            </>
                                        )}
                                    </button>
                                </div>

                                {builds.length === 0 && (
                                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <Rocket size={64} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">No builds yet. Run your first build!</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {builds.map((build) => (
                                        <div key={build._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="p-5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {build.status === 'passed' ? (
                                                        <CheckCircle size={28} className="text-green-500 shrink-0" />
                                                    ) : build.status === 'failed' ? (
                                                        <AlertCircle size={28} className="text-red-500 shrink-0" />
                                                    ) : build.status === 'running' ? (
                                                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                                                    ) : (
                                                        <Clock size={28} className="text-gray-400 shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            Build #{build._id?.toString().slice(-6) || '#'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {build.commitSha && <span className="font-mono text-orange-500 mr-2">{build.commitSha}</span>}
                                                            {build.commitMessage || 'Manual build'} · branch {build.branch}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className={`text-xs px-3 py-1 rounded-full ${getBuildStatusColor(build.status)}`}>
                                                        {build.status}
                                                    </span>
                                                    {build.duration != null && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{build.duration}s</span>
                                                    )}
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(build.startedAt || build.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {build.logs && build.logs.length > 0 && (
                                                <div className="px-5 pb-4">
                                                    <div className="bg-gray-900 dark:bg-black rounded-lg p-3 font-mono text-xs text-green-400 space-y-1 max-h-40 overflow-y-auto">
                                                        {build.logs.map((line, i) => (
                                                            <div key={i}>{line}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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

                                        {isDevWorkspace(selectedWorkspace) && (
                                            <>
                                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-bold text-gray-900 dark:text-white">Commits</h3>
                                                        <GitBranch className="text-orange-500" size={24} />
                                                    </div>
                                                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                        {commits.length}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        total commits
                                                    </p>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-bold text-gray-900 dark:text-white">Builds Passed</h3>
                                                        <Rocket className="text-green-500" size={24} />
                                                    </div>
                                                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                        {builds.filter(b => b.status === 'passed').length}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        of {builds.length} builds
                                                    </p>
                                                </div>
                                            </>
                                        )}
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

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                {/* My membership */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Users size={18} className="text-blue-500" />
                                        My Membership
                                    </h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {(user.name || user.username || 'Y').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{user.name || user.username}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isCurrentUserOwner()
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                {isCurrentUserOwner() ? 'Owner' : 'Collaborator'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Workspace settings */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Settings size={18} className="text-gray-500" />
                                        Workspace Settings
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                                            <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedWorkspace.workspaceType}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">Visibility</span>
                                            <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedWorkspace.settings?.visibility || 'private'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">Chat</span>
                                            <span className={`font-medium ${selectedWorkspace.settings?.enableChat ? 'text-green-600' : 'text-red-500'}`}>
                                                {selectedWorkspace.settings?.enableChat ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">Task Board</span>
                                            <span className={`font-medium ${selectedWorkspace.settings?.enableTaskBoard !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                {selectedWorkspace.settings?.enableTaskBoard !== false ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400">File Sharing</span>
                                            <span className={`font-medium ${selectedWorkspace.settings?.enableFileSharing !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                {selectedWorkspace.settings?.enableFileSharing !== false ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Analytics</span>
                                            <span className={`font-medium ${selectedWorkspace.settings?.enableAnalytics !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                {selectedWorkspace.settings?.enableAnalytics !== false ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                    {!isCurrentUserOwner() && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                                            Only the workspace owner can change these settings.
                                        </p>
                                    )}
                                </div>

                                {/* Newest updates feed */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-purple-500" />
                                        Latest Updates
                                    </h3>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {selectedWorkspace.activity?.slice(0, 10).map((activity, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                                                <div>
                                                    <p className="text-sm text-gray-900 dark:text-white">{activity.details}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedWorkspace.activity || selectedWorkspace.activity.length === 0) && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
                                        )}
                                    </div>
                                </div>
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
                                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
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

                    {/* Share Resource Modal */}
                    <AnimatePresence>
                        {showResourceModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
                                onClick={() => setShowResourceModal(false)}
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
                                            Share Resource
                                        </h2>
                                        <button
                                            onClick={() => setShowResourceModal(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <X size={24} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddResource} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Type
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { type: 'link', label: 'Link', icon: Link2 },
                                                    { type: 'image', label: 'Image / Video', icon: ImageIcon },
                                                    { type: 'note', label: 'Note', icon: StickyNote }
                                                ].map((opt) => (
                                                    <button
                                                        type="button"
                                                        key={opt.type}
                                                        onClick={() => setNewResource(prev => ({ ...prev, type: opt.type }))}
                                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                                            newResource.type === opt.type
                                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <opt.icon size={20} />
                                                        <span className="text-xs font-medium">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={newResource.name}
                                                onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                                placeholder={newResource.type === 'note' ? 'Note title' : 'Resource name'}
                                                required
                                            />
                                        </div>

                                        {(newResource.type === 'link' || newResource.type === 'image') && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    URL
                                                </label>
                                                <input
                                                    type="url"
                                                    value={newResource.url}
                                                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}

                                        {newResource.type === 'note' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Note Content
                                                </label>
                                                <textarea
                                                    value={newResource.url}
                                                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                                    rows={4}
                                                    placeholder="Write your note..."
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowResourceModal(false)}
                                                className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                            >
                                                Share
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