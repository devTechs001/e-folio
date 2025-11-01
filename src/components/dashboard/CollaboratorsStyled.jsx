import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Mail, Trash2, Shield, Edit, Check, X, Lock, Users,
    Search, Filter, MoreVertical, Send, Copy, RefreshCw, Download,
    Calendar, Activity, AlertCircle, CheckCircle, Clock, Eye,
    Settings, Key, Award, TrendingUp, BarChart, Link2, UserX,
    UserCheck, ChevronDown, ChevronUp, Globe, FileText, Archive,
    Star, Ban, Unlock, RotateCcw, ExternalLink, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const Collaborators = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { on, off } = useSocket();
    const { success, error, info } = useNotifications();

    // State Management
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'collaborator',
        permissions: [],
        expiryDays: 7,
        customMessage: ''
    });
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('joinedDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0
    });
    const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
    const [generatedInviteLink, setGeneratedInviteLink] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [currentTab, setCurrentTab] = useState('active'); // active, pending, archived

    // Available Permissions
    const availablePermissions = [
        { id: 'read', name: 'View Content', description: 'Can view all content' },
        { id: 'write', name: 'Edit Content', description: 'Can create and edit content' },
        { id: 'delete', name: 'Delete Content', description: 'Can delete content' },
        { id: 'manage_users', name: 'Manage Users', description: 'Can invite and remove users' },
        { id: 'view_analytics', name: 'View Analytics', description: 'Can view analytics and reports' },
        { id: 'manage_settings', name: 'Manage Settings', description: 'Can modify platform settings' },
        { id: 'export_data', name: 'Export Data', description: 'Can export data and reports' },
        { id: 'manage_billing', name: 'Manage Billing', description: 'Can access billing information' }
    ];

    // Role Configurations
    const roleConfigs = {
        owner: {
            label: 'Owner',
            color: 'purple',
            permissions: 'all',
            description: 'Full access to everything'
        },
        admin: {
            label: 'Administrator',
            color: 'blue',
            permissions: ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'manage_settings'],
            description: 'Can manage users and settings'
        },
        collaborator: {
            label: 'Collaborator',
            color: 'green',
            permissions: ['read', 'write', 'view_analytics'],
            description: 'Can create and edit content'
        },
        viewer: {
            label: 'Viewer',
            color: 'gray',
            permissions: ['read'],
            description: 'Read-only access'
        }
    };

    // Load data
    useEffect(() => {
        loadCollaborators();
        loadPendingInvites();
        loadStats();
        loadActivityLogs();

        // Socket listeners
        const handleCollaboratorAdded = (data) => {
            setCollaborators(prev => [data.collaborator, ...prev]);
            info(`${data.collaborator.name} joined the team!`);
            loadStats();
        };

        const handleCollaboratorUpdated = (data) => {
            setCollaborators(prev => prev.map(c => 
                c.id === data.collaborator.id ? data.collaborator : c
            ));
        };

        const handleCollaboratorRemoved = (data) => {
            setCollaborators(prev => prev.filter(c => c.id !== data.collaboratorId));
            loadStats();
        };

        on('collaborator_added', handleCollaboratorAdded);
        on('collaborator_updated', handleCollaboratorUpdated);
        on('collaborator_removed', handleCollaboratorRemoved);

        return () => {
            off('collaborator_added', handleCollaboratorAdded);
            off('collaborator_updated', handleCollaboratorUpdated);
            off('collaborator_removed', handleCollaboratorRemoved);
        };
    }, [on, off]);

    // API Functions
    const loadCollaborators = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaborators();
            setCollaborators(response.collaborators || []);
        } catch (err) {
            console.error('Error loading collaborators:', err);
            error('Failed to load collaborators');
        } finally {
            setLoading(false);
        }
    };

    const loadPendingInvites = async () => {
        try {
            const response = await apiService.getPendingInvites();
            setPendingInvites(response.invites || []);
        } catch (err) {
            console.error('Error loading invites:', err);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getCollaboratorStats();
            setStats(response.stats || stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const loadActivityLogs = async () => {
        try {
            const response = await apiService.getCollaboratorActivity();
            setActivityLogs(response.logs || []);
        } catch (err) {
            console.error('Error loading activity:', err);
        }
    };

    const handleInvite = async () => {
        if (!inviteData.email) {
            error('Please enter an email address');
            return;
        }

        try {
            const response = await apiService.inviteCollaborator(inviteData);
            
            if (response.success) {
                success(`Invitation sent to ${inviteData.email}`);
                setShowInviteForm(false);
                setInviteData({
                    email: '',
                    role: 'collaborator',
                    permissions: [],
                    expiryDays: 7,
                    customMessage: ''
                });
                loadPendingInvites();
            } else {
                error(response.message || 'Failed to send invitation');
            }
        } catch (err) {
            console.error('Error sending invitation:', err);
            error('Failed to send invitation');
        }
    };

    const handleGenerateInviteLink = async () => {
        try {
            const response = await apiService.generateInviteLink({
                role: inviteData.role,
                expiryDays: inviteData.expiryDays,
                maxUses: 1
            });

            if (response.success) {
                setGeneratedInviteLink(response.inviteLink);
                setShowInviteLinkModal(true);
                success('Invite link generated!');
            }
        } catch (err) {
            error('Failed to generate invite link');
        }
    };

    const handleResendInvite = async (inviteId, email) => {
        try {
            const response = await apiService.resendInvite(inviteId);
            if (response.success) {
                success(`Invitation resent to ${email}`);
            }
        } catch (err) {
            error('Failed to resend invitation');
        }
    };

    const handleCancelInvite = async (inviteId) => {
        try {
            const response = await apiService.cancelInvite(inviteId);
            if (response.success) {
                setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
                success('Invitation cancelled');
            }
        } catch (err) {
            error('Failed to cancel invitation');
        }
    };

    const handleUpdateRole = async (collaboratorId, newRole) => {
        try {
            const response = await apiService.updateCollaboratorRole(collaboratorId, newRole);
            if (response.success) {
                setCollaborators(prev => prev.map(c => 
                    c.id === collaboratorId ? { ...c, role: newRole } : c
                ));
                success('Role updated successfully');
            }
        } catch (err) {
            error('Failed to update role');
        }
    };

    const handleUpdatePermissions = async (collaboratorId, permissions) => {
        try {
            const response = await apiService.updateCollaboratorPermissions(collaboratorId, permissions);
            if (response.success) {
                setCollaborators(prev => prev.map(c => 
                    c.id === collaboratorId ? { ...c, permissions } : c
                ));
                success('Permissions updated successfully');
                setShowPermissionsModal(false);
            }
        } catch (err) {
            error('Failed to update permissions');
        }
    };

    const handleRemoveCollaborator = async (id, name) => {
        if (!confirm(`Are you sure you want to remove ${name}?`)) return;

        try {
            const response = await apiService.removeCollaborator(id);
            if (response.success) {
                setCollaborators(prev => prev.filter(c => c.id !== id));
                success(`Removed ${name} from collaborators`);
                loadStats();
            }
        } catch (err) {
            error('Failed to remove collaborator');
        }
    };

    const handleSuspendCollaborator = async (id, name) => {
        try {
            const response = await apiService.suspendCollaborator(id);
            if (response.success) {
                setCollaborators(prev => prev.map(c => 
                    c.id === id ? { ...c, status: 'suspended' } : c
                ));
                success(`${name} has been suspended`);
            }
        } catch (err) {
            error('Failed to suspend collaborator');
        }
    };

    const handleReactivateCollaborator = async (id, name) => {
        try {
            const response = await apiService.reactivateCollaborator(id);
            if (response.success) {
                setCollaborators(prev => prev.map(c => 
                    c.id === id ? { ...c, status: 'active' } : c
                ));
                success(`${name} has been reactivated`);
            }
        } catch (err) {
            error('Failed to reactivate collaborator');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedCollaborators.length === 0) {
            error('No collaborators selected');
            return;
        }

        try {
            let response;
            switch (action) {
                case 'remove':
                    if (!confirm(`Remove ${selectedCollaborators.length} collaborators?`)) return;
                    response = await apiService.bulkRemoveCollaborators(selectedCollaborators);
                    break;
                case 'suspend':
                    response = await apiService.bulkSuspendCollaborators(selectedCollaborators);
                    break;
                case 'activate':
                    response = await apiService.bulkActivateCollaborators(selectedCollaborators);
                    break;
                default:
                    return;
            }

            if (response.success) {
                success(`${action} completed for ${selectedCollaborators.length} collaborators`);
                setSelectedCollaborators([]);
                loadCollaborators();
            }
        } catch (err) {
            error(`Failed to ${action} collaborators`);
        }
    };

    const exportCollaborators = async () => {
        try {
            const response = await apiService.exportCollaborators();
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collaborators-${Date.now()}.csv`;
            a.click();
            success('Exported successfully');
        } catch (err) {
            error('Export failed');
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(generatedInviteLink);
        success('Invite link copied to clipboard!');
    };

    // Filter and Sort
    const filteredCollaborators = collaborators
        .filter(c => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    c.name.toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter(c => filterRole === 'all' || c.role === filterRole)
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'email':
                    comparison = a.email.localeCompare(b.email);
                    break;
                case 'role':
                    comparison = a.role.localeCompare(b.role);
                    break;
                case 'joinedDate':
                    comparison = new Date(a.joinedDate) - new Date(b.joinedDate);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

    const getRoleColor = (role) => {
        const colors = {
            owner: 'purple',
            admin: 'blue',
            collaborator: 'green',
            viewer: 'gray'
        };
        return colors[role] || 'gray';
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'green',
            inactive: 'gray',
            suspended: 'red',
            pending: 'yellow'
        };
        return colors[status] || 'gray';
    };

    const toggleSelectCollaborator = (id) => {
        setSelectedCollaborators(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Access check
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 max-w-md">
                        <Lock size={64} className="text-red-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-3">
                            Access Restricted
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Collaborator management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Team Management"
            subtitle="Manage collaborators, roles, and permissions"
        >
            {/* Header Actions */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        <UserPlus size={18} />
                        Invite Collaborator
                    </button>
                    <button
                        onClick={handleGenerateInviteLink}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors"
                    >
                        <Link2 size={18} />
                        Generate Link
                    </button>
                    <button
                        onClick={exportCollaborators}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    <button
                        onClick={loadCollaborators}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                            viewMode === 'list'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total Collaborators</span>
                        <Users className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">All team members</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700 dark:text-green-300">Active Members</span>
                        <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Currently active</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Pending Invites</span>
                        <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Awaiting acceptance</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Inactive</span>
                        <AlertCircle className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.inactive}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Not recently active</p>
                </motion.div>
            </div>

            {/* Invite Form */}
            <AnimatePresence>
                {showInviteForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6"
                    >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Invite New Collaborator
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    placeholder="collaborator@example.com"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Role *
                                </label>
                                <select
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="admin">Administrator</option>
                                    <option value="collaborator">Collaborator</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Invite Expires In
                                </label>
                                <select
                                    value={inviteData.expiryDays}
                                    onChange={(e) => setInviteData({ ...inviteData, expiryDays: Number(e.target.value) })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="1">1 Day</option>
                                    <option value="3">3 Days</option>
                                    <option value="7">7 Days</option>
                                    <option value="14">14 Days</option>
                                    <option value="30">30 Days</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Custom Message (Optional)
                                </label>
                                <textarea
                                    value={inviteData.customMessage}
                                    onChange={(e) => setInviteData({ ...inviteData, customMessage: e.target.value })}
                                    placeholder="Add a personal message to the invitation..."
                                    rows="3"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleInvite}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                <Send size={18} />
                                Send Invitation
                            </button>
                            <button
                                onClick={() => setShowInviteForm(false)}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setCurrentTab('active')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        currentTab === 'active'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Active ({collaborators.filter(c => c.status === 'active').length})
                </button>
                <button
                    onClick={() => setCurrentTab('pending')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        currentTab === 'pending'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    Pending Invites ({pendingInvites.length})
                </button>
                <button
                    onClick={() => setCurrentTab('all')}
                    className={`px-6 py-3 font-medium transition-colors ${
                        currentTab === 'all'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    All
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>

                    {/* Filters */}
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="collaborator">Collaborator</option>
                        <option value="viewer">Viewer</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                        <option value="joinedDate">Sort by Join Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="email">Sort by Email</option>
                        <option value="role">Sort by Role</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {sortOrder === 'desc' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {selectedCollaborators.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedCollaborators.length} collaborator{selectedCollaborators.length !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkAction('suspend')}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Ban size={16} />
                                    Suspend
                                </button>
                                <button
                                    onClick={() => handleBulkAction('activate')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <CheckCircle size={16} />
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('remove')}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Remove
                                </button>
                                <button
                                    onClick={() => setSelectedCollaborators([])}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {currentTab === 'pending' ? (
                /* Pending Invites */
                <div className="space-y-4">
                    {pendingInvites.length === 0 ? (
                        <div className="text-center py-20">
                            <Mail size={64} className="text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No Pending Invites
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                All invitations have been accepted or expired
                            </p>
                        </div>
                    ) : (
                        pendingInvites.map((invite, index) => (
                            <motion.div
                                key={invite.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {invite.email}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-xs px-2 py-1 rounded-full bg-${getRoleColor(invite.role)}-100 text-${getRoleColor(invite.role)}-800 dark:bg-${getRoleColor(invite.role)}-900/30 dark:text-${getRoleColor(invite.role)}-400`}>
                                                    {roleConfigs[invite.role]?.label}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Sent: {new Date(invite.sentAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResendInvite(invite.id, invite.email)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <RotateCcw size={16} />
                                            Resend
                                        </button>
                                        <button
                                            onClick={() => handleCancelInvite(invite.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            ) : (
                /* Collaborators Grid/List */
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <RefreshCw size={48} className="text-blue-500 animate-spin" />
                        </div>
                    ) : filteredCollaborators.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <Users size={64} className="text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No Collaborators Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery ? 'Try adjusting your search or filters' : 'Start by inviting team members'}
                            </p>
                        </div>
                    ) : (
                        filteredCollaborators.map((collaborator, index) => (
                            viewMode === 'grid' ? (
                                /* Grid View */
                                <motion.div
                                    key={collaborator.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    {/* Checkbox */}
                                    <div className="flex items-start justify-between mb-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedCollaborators.includes(collaborator.id)}
                                            onChange={() => toggleSelectCollaborator(collaborator.id)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Avatar & Info */}
                                    <div className="text-center mb-4">
                                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
                                            {collaborator.avatar}
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {collaborator.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {collaborator.email}
                                        </p>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                                            <span className={`text-xs px-3 py-1 rounded-full bg-${getRoleColor(collaborator.role)}-100 text-${getRoleColor(collaborator.role)}-800 dark:bg-${getRoleColor(collaborator.role)}-900/30 dark:text-${getRoleColor(collaborator.role)}-400 font-semibold`}>
                                                {roleConfigs[collaborator.role]?.label}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full bg-${getStatusColor(collaborator.status)}-100 text-${getStatusColor(collaborator.status)}-800 dark:bg-${getStatusColor(collaborator.status)}-900/30 dark:text-${getStatusColor(collaborator.status)}-400`}>
                                                {collaborator.status}
                                            </span>
                                        </div>

                                        {/* Meta */}
                                        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                            <p>Joined: {collaborator.joinedDate}</p>
                                            <p>Last active: {collaborator.lastActive}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingCollaborator(collaborator);
                                                setSelectedPermissions(collaborator.permissions || []);
                                                setShowPermissionsModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.name)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* List View */
                                <motion.div
                                    key={collaborator.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedCollaborators.includes(collaborator.id)}
                                            onChange={() => toggleSelectCollaborator(collaborator.id)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />

                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                                            {collaborator.avatar}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                {collaborator.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {collaborator.email}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-full bg-${getRoleColor(collaborator.role)}-100 text-${getRoleColor(collaborator.role)}-800 dark:bg-${getRoleColor(collaborator.role)}-900/30 dark:text-${getRoleColor(collaborator.role)}-400 font-semibold`}>
                                                    {roleConfigs[collaborator.role]?.label}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full bg-${getStatusColor(collaborator.status)}-100 text-${getStatusColor(collaborator.status)}-800`}>
                                                    {collaborator.status}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Joined: {collaborator.joinedDate}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Last active: {collaborator.lastActive}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Mail size={18} className="text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCollaborator(collaborator);
                                                    setSelectedPermissions(collaborator.permissions || []);
                                                    setShowPermissionsModal(true);
                                                }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                                            </button>
                                            {collaborator.status === 'suspended' ? (
                                                <button
                                                    onClick={() => handleReactivateCollaborator(collaborator.id, collaborator.name)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Unlock size={18} className="text-green-600 dark:text-green-400" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSuspendCollaborator(collaborator.id, collaborator.name)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Ban size={18} className="text-yellow-600 dark:text-yellow-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.name)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        ))
                    )}
                </div>
            )}

            {/* Permissions Modal */}
            <AnimatePresence>
                {showPermissionsModal && editingCollaborator && (
                    <PermissionsModal
                        collaborator={editingCollaborator}
                        permissions={selectedPermissions}
                        availablePermissions={availablePermissions}
                        onUpdate={handleUpdatePermissions}
                        onClose={() => {
                            setShowPermissionsModal(false);
                            setEditingCollaborator(null);
                        }}
                    />
                )}

                {showInviteLinkModal && (
                    <InviteLinkModal
                        inviteLink={generatedInviteLink}
                        onClose={() => {
                            setShowInviteLinkModal(false);
                            setGeneratedInviteLink('');
                        }}
                        onCopy={copyInviteLink}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Permissions Modal Component
const PermissionsModal = ({ collaborator, permissions, availablePermissions, onUpdate, onClose }) => {
    const [selectedPerms, setSelectedPerms] = useState(permissions);

    const togglePermission = (permId) => {
        setSelectedPerms(prev =>
            prev.includes(permId)
                ? prev.filter(p => p !== permId)
                : [...prev, permId]
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Manage Permissions
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {collaborator.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">{collaborator.email}</p>
                    </div>

                    <div className="space-y-3">
                        {availablePermissions.map(perm => (
                            <label
                                key={perm.id}
                                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPerms.includes(perm.id)}
                                    onChange={() => togglePermission(perm.id)}
                                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {perm.name}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {perm.description}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => onUpdate(collaborator.id, selectedPerms)}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Invite Link Modal Component
const InviteLinkModal = ({ inviteLink, onClose, onCopy }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Invite Link Generated
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this link:</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none dark:text-white"
                        />
                        <button
                            onClick={onCopy}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <Copy size={18} />
                            Copy
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                    This link can be used once and will expire in 7 days.
                </p>
            </motion.div>
        </motion.div>
    );
};

export default Collaborators;