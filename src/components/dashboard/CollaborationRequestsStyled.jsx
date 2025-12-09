import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Check, X, Mail, Clock, Search, Filter, MoreVertical,
    Download, Eye, AlertCircle, CheckCircle, XCircle, TrendingUp,
    Calendar, Users, MessageSquare, FileText, Star, Archive,
    RefreshCw, Send, Edit, Trash2, ChevronDown, ChevronUp,
    ExternalLink, Copy, CheckCheck, User, Building, Briefcase,
    Shield, Award, Globe, MapPin, Phone, Video, MessageCircle,
    Settings, BarChart, Activity, Zap, Target, Crown, Code, Palette
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const CollaborationRequests = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { on, off } = useSocket();
    const { success, error, info } = useNotifications();

    // Enhanced State Management
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [filterRole, setFilterRole] = useState('all');
    const [filterExperience, setFilterExperience] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showTeamBuilder, setShowTeamBuilder] = useState(false);
    const [collaborationHistory, setCollaborationHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        thisMonth: 0,
        responseRate: 0,
        avgResponseTime: 0,
        topRoles: [],
        topSkills: [],
        geographicalDistribution: []
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [notes, setNotes] = useState({});
    const [emailTemplate, setEmailTemplate] = useState('default');
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [processingIds, setProcessingIds] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [customRoles, setCustomRoles] = useState([]);
    const [collaborationTypes] = useState([
        'Development', 'Design', 'Marketing', 'Content', 'Research',
        'Consulting', 'Partnership', 'Investment', 'Mentorship'
    ]);
    const [experienceLevels] = useState([
        'Entry Level', 'Mid Level', 'Senior Level', 'Expert', 'Leadership'
    ]);

    // Load requests on mount
    useEffect(() => {
        loadRequests();
        loadStats();

        // Listen for real-time updates
        const handleNewRequest = (request) => {
            setRequests(prev => [request, ...prev]);
            info(`📬 New collaboration request from ${request.name}`);
            loadStats();
        };

        const handleRequestUpdated = (updatedRequest) => {
            setRequests(prev => prev.map(r => 
                r.id === updatedRequest.id ? updatedRequest : r
            ));
            loadStats();
        };

        on('new_collaboration_request', handleNewRequest);
        on('collaboration_request_updated', handleRequestUpdated);

        return () => {
            off('new_collaboration_request', handleNewRequest);
            off('collaboration_request_updated', handleRequestUpdated);
        };
    }, [on, off]);

    // Filter and search
    useEffect(() => {
        let filtered = Array.isArray(requests) ? [...requests] : [];

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(r => r && r.status === filterStatus);
        }

        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r && (
                    (r.name && r.name.toLowerCase().includes(query)) ||
                    (r.email && r.email.toLowerCase().includes(query)) ||
                    (r.company && r.company.toLowerCase().includes(query)) ||
                    (r.role && r.role.toLowerCase().includes(query)) ||
                    (r.message && r.message.toLowerCase().includes(query))
                )
            );
        }

        // Date range filter
        if (dateRange.start && dateRange.end) {
            filtered = filtered.filter(r => {
                if (!r || !r.submittedAt) return false;
                const requestDate = new Date(r.submittedAt);
                return requestDate >= new Date(dateRange.start) && requestDate <= new Date(dateRange.end);
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (!a || !b) return 0;
            
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'email':
                    comparison = (a.email || '').localeCompare(b.email || '');
                    break;
                case 'date':
                default:
                    const dateA = new Date(a.submittedAt || 0);
                    const dateB = new Date(b.submittedAt || 0);
                    comparison = dateA - dateB;
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        setFilteredRequests(filtered);
    }, [requests, searchQuery, filterStatus, sortBy, sortOrder, dateRange]);

    // API Functions
    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaborationRequests();
            const requestsData = response?.requests || [];
            setRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (err) {
            console.error('Error loading requests:', err);
            error('Failed to load requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getCollaborationStats();
            setStats(response.stats || stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleApprove = async (id, name, customMessage = '') => {
        if (processingIds.includes(id)) return;
        
        setProcessingIds(prev => [...prev, id]);
        try {
            const response = await apiService.approveRequest(id, {
                emailTemplate,
                customMessage,
                note: notes[id]
            });
            
            if (response.success) {
                setRequests(prev => prev.map(r => 
                    r.id === id ? { ...r, status: 'approved' } : r
                ));
                success(`✅ Approved ${name}! Invite link: ${response.inviteLink}`);
                
                // Copy invite link to clipboard
                if (response.inviteLink) {
                    navigator.clipboard.writeText(response.inviteLink);
                    info('📋 Invite link copied to clipboard');
                }
            } else {
                error(response.message || 'Failed to approve request');
            }
        } catch (err) {
            console.error('Error approving request:', err);
            error('Failed to approve request. Please try again.');
        } finally {
            setProcessingIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleReject = async (id, name, reason = '') => {
        if (processingIds.includes(id)) return;
        
        setProcessingIds(prev => [...prev, id]);
        try {
            const response = await apiService.rejectRequest(id, {
                reason,
                note: notes[id]
            });
            
            if (response.success) {
                setRequests(prev => prev.map(r => 
                    r.id === id ? { ...r, status: 'rejected' } : r
                ));
                success(`Rejected collaboration request from ${name}`);
            } else {
                error(response.message || 'Failed to reject request');
            }
        } catch (err) {
            console.error('Error rejecting request:', err);
            error('Failed to reject request. Please try again.');
        } finally {
            setProcessingIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedRequests.length === 0) return;
        
        try {
            const response = await apiService.bulkApproveRequests(selectedRequests);
            if (response.success) {
                setRequests(prev => prev.map(r => 
                    selectedRequests.includes(r.id) ? { ...r, status: 'approved' } : r
                ));
                success(`Approved ${selectedRequests.length} requests`);
                setSelectedRequests([]);
            }
        } catch (err) {
            error('Failed to bulk approve requests');
        }
    };

    const handleBulkReject = async () => {
        if (selectedRequests.length === 0) return;
        
        try {
            const response = await apiService.bulkRejectRequests(selectedRequests);
            if (response.success) {
                setRequests(prev => prev.map(r => 
                    selectedRequests.includes(r.id) ? { ...r, status: 'rejected' } : r
                ));
                success(`Rejected ${selectedRequests.length} requests`);
                setSelectedRequests([]);
            }
        } catch (err) {
            error('Failed to bulk reject requests');
        }
    };

    const handleArchive = async (id) => {
        try {
            const response = await apiService.archiveRequest(id);
            if (response.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
                success('Request archived');
            }
        } catch (err) {
            error('Failed to archive request');
        }
    };

    const exportRequests = async () => {
        try {
            const response = await apiService.exportCollaborationRequests({
                status: filterStatus,
                dateRange
            });
            
            // Create download link
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collaboration-requests-${Date.now()}.csv`;
            a.click();
            
            success('Exported successfully');
        } catch (err) {
            error('Failed to export requests');
        }
    };

    const toggleSelectRequest = (id) => {
        setSelectedRequests(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedRequests.length === filteredRequests.length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(filteredRequests.map(r => r.id));
        }
    };

    const addNote = (requestId, note) => {
        setNotes(prev => ({ ...prev, [requestId]: note }));
    };

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Access check
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96">
                    <AlertCircle size={64} className="text-red-500 mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Access Restricted
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Only platform owners can view collaboration requests
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="Collaboration Requests" 
            subtitle="Review and manage collaboration requests"
        >
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {/* Total Requests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/25 border border-blue-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-blue-100 text-sm font-medium">Total Requests</span>
                            <div className="bg-blue-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <Users className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.total}</p>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-blue-200" size={14} />
                            <p className="text-xs text-blue-100">All collaboration requests</p>
                        </div>
                    </div>
                </motion.div>

                {/* Pending */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-amber-500/25 border border-amber-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-amber-100 text-sm font-medium">Pending</span>
                            <div className="bg-amber-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <Clock className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.pending}</p>
                        <div className="flex items-center gap-2">
                            <Activity className="text-amber-200" size={14} />
                            <p className="text-xs text-amber-100">Awaiting review</p>
                        </div>
                    </div>
                </motion.div>

                {/* Approved */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-lg shadow-emerald-500/25 border border-emerald-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-emerald-100 text-sm font-medium">Approved</span>
                            <div className="bg-emerald-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <CheckCircle className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.approved}</p>
                        <div className="flex items-center gap-2">
                            <Zap className="text-emerald-200" size={14} />
                            <p className="text-xs text-emerald-100">Active collaborations</p>
                        </div>
                    </div>
                </motion.div>

                {/* Response Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 shadow-lg shadow-purple-500/25 border border-purple-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-purple-100 text-sm font-medium">Response Rate</span>
                            <div className="bg-purple-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <Target className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.responseRate}%</p>
                        <div className="flex items-center gap-2">
                            <BarChart className="text-purple-200" size={14} />
                            <p className="text-xs text-purple-100">Engagement rate</p>
                        </div>
                    </div>
                </motion.div>

                {/* Avg Response Time */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 shadow-lg shadow-rose-500/25 border border-rose-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-rose-100 text-sm font-medium">Avg Response</span>
                            <div className="bg-rose-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <Clock className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.avgResponseTime}h</p>
                        <div className="flex items-center gap-2">
                            <Activity className="text-rose-200" size={14} />
                            <p className="text-xs text-rose-100">Response time</p>
                        </div>
                    </div>
                </motion.div>

                {/* This Month */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-cyan-500/25 border border-cyan-400/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-cyan-100 text-sm font-medium">This Month</span>
                            <div className="bg-cyan-400/20 p-2 rounded-lg backdrop-blur-sm">
                                <Calendar className="text-white" size={18} />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{stats.thisMonth}</p>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-cyan-200" size={14} />
                            <p className="text-xs text-cyan-100">Recent requests</p>
                        </div>
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
                            placeholder="Search by name, email, company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {/* Filter Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="email">Sort by Email</option>
                        </select>

                        {/* Sort Order */}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>

                        {/* Advanced Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <Filter size={18} />
                            Filters
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportRequests}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <Download size={18} />
                            Export
                        </button>

                        {/* Refresh */}
                        <motion.button
                            onClick={loadRequests}
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </motion.button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Template
                                    </label>
                                    <select
                                        value={emailTemplate}
                                        onChange={(e) => setEmailTemplate(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    >
                                        <option value="default">Default Template</option>
                                        <option value="welcome">Welcome Template</option>
                                        <option value="custom">Custom Template</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {selectedRequests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkApprove}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <CheckCheck size={18} />
                                    Approve All
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <X size={18} />
                                    Reject All
                                </button>
                                <button
                                    onClick={() => setSelectedRequests([])}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Requests List */}
            <div className="space-y-4 mb-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Clock size={64} className="text-blue-500 opacity-50" />
                        </motion.div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <UserPlus size={64} className="text-gray-400 mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No requests found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery ? 'Try adjusting your search or filters' : 'No pending collaboration requests'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        {paginatedRequests.length > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={selectedRequests.length === filteredRequests.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Select all {filteredRequests.length} requests
                                </span>
                            </div>
                        )}

                        {/* Request Cards */}
                        <AnimatePresence>
                            {paginatedRequests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedRequests.includes(request.id)}
                                            onChange={() => toggleSelectRequest(request.id)}
                                            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />

                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                                            {request.name ? request.name.charAt(0).toUpperCase() : '?'}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {request.name}
                                                        {request.isPriority && (
                                                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                                        )}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <Mail size={14} />
                                                            {request.email}
                                                        </span>
                                                        {request.company && (
                                                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                                <Building size={14} />
                                                                {request.company}
                                                            </span>
                                                        )}
                                                        {request.role && (
                                                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                                <Briefcase size={14} />
                                                                {request.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        request.status === 'approved'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : request.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                        {request.status}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {request.message}
                                                </p>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(request.submittedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {request.source && (
                                                    <span className="flex items-center gap-1">
                                                        <ExternalLink size={12} />
                                                        From: {request.source}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Notes Input */}
                                            <div className="mb-4">
                                                <textarea
                                                    placeholder="Add internal notes..."
                                                    value={notes[request.id] || ''}
                                                    onChange={(e) => addNote(request.id, e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                                                    rows="2"
                                                />
                                            </div>

                                            {/* Actions */}
                                            {request.status === 'pending' && (
                                                <div className="flex flex-wrap gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleApprove(request.id, request.name)}
                                                        disabled={processingIds.includes(request.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingIds.includes(request.id) ? (
                                                            <RefreshCw size={18} className="animate-spin" />
                                                        ) : (
                                                            <Check size={18} />
                                                        )}
                                                        Approve
                                                    </motion.button>

                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleReject(request.id, request.name)}
                                                        disabled={processingIds.includes(request.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingIds.includes(request.id) ? (
                                                            <RefreshCw size={18} className="animate-spin" />
                                                        ) : (
                                                            <X size={18} />
                                                        )}
                                                        Reject
                                                    </motion.button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Eye size={18} />
                                                        View Details
                                                    </button>

                                                    <button
                                                        onClick={() => setShowEmailPreview(true)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Send size={18} />
                                                        Preview Email
                                                    </button>
                                                </div>
                                            )}

                                            {request.status !== 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleArchive(request.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Archive size={18} />
                                                        Archive
                                                    </button>
                                                    {request.inviteLink && (
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(request.inviteLink);
                                                                success('Invite link copied!');
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <Copy size={18} />
                                                            Copy Invite Link
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
                            {filteredRequests.length} requests
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="5">5 per page</option>
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {showDetailsModal && selectedRequest && (
                    <RequestDetailsModal
                        request={selectedRequest}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedRequest(null);
                        }}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Enhanced Request Details Modal Component
const RequestDetailsModal = ({ request, onClose, onApprove, onReject }) => {
    const [showApprovalSettings, setShowApprovalSettings] = useState(false);
    const [approvalConfig, setApprovalConfig] = useState({
        role: 'collaborator',
        accessLevel: 'limited',
        engagementLimits: {
            maxProjects: 5,
            maxStorage: '1GB',
            maxTeamMembers: 3,
            apiAccess: false,
            analyticsAccess: true,
            contentCreation: true
        },
        permissions: {
            canEditProjects: true,
            canCreateContent: true,
            canViewAnalytics: true,
            canManageTeam: false,
            canAccessSettings: false
        },
        collaborationType: 'development',
        duration: '3_months',
        autoRenew: false,
        customPermissions: []
    });

    const accessLevels = [
        { id: 'limited', name: 'Limited Access', description: 'Basic collaboration features' },
        { id: 'standard', name: 'Standard Access', description: 'Full collaboration features' },
        { id: 'advanced', name: 'Advanced Access', description: 'Enhanced features and analytics' },
        { id: 'admin', name: 'Admin Access', description: 'Full administrative privileges' }
    ];

    const roles = [
        { id: 'collaborator', name: 'Collaborator', icon: Users, color: '#3B82F6' },
        { id: 'developer', name: 'Developer', icon: Code, color: '#10B981' },
        { id: 'designer', name: 'Designer', icon: Palette, color: '#8B5CF6' },
        { id: 'content_creator', name: 'Content Creator', icon: FileText, color: '#F59E0B' },
        { id: 'project_manager', name: 'Project Manager', icon: Briefcase, color: '#EF4444' },
        { id: 'analyst', name: 'Analyst', icon: BarChart, color: '#06B6D4' }
    ];

    const durations = [
        { id: '1_month', name: '1 Month', days: 30 },
        { id: '3_months', name: '3 Months', days: 90 },
        { id: '6_months', name: '6 Months', days: 180 },
        { id: '1_year', name: '1 Year', days: 365 },
        { id: 'permanent', name: 'Permanent', days: null }
    ];

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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {request.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Collaboration Request
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Configure access and permissions for {request.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* User Info Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {request.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                        {request.name}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400">{request.email}</p>
                                    {request.company && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {request.role} at {request.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    request.status === 'approved'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : request.status === 'rejected'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                    {request.status}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Submitted {new Date(request.submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Request Message */}
                    <div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <MessageCircle size={20} />
                            Collaboration Message
                        </h5>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {request.message}
                            </p>
                        </div>
                    </div>

                    {/* Approval Configuration */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Settings size={20} />
                                Approval Configuration
                            </h5>
                            <button
                                onClick={() => setShowApprovalSettings(!showApprovalSettings)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Settings size={16} />
                                {showApprovalSettings ? 'Hide' : 'Show'} Settings
                            </button>
                        </div>

                        {showApprovalSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                            >
                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Assign Role
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {roles.map(role => {
                                            const Icon = role.icon;
                                            return (
                                                <button
                                                    key={role.id}
                                                    onClick={() => setApprovalConfig(prev => ({ ...prev, role: role.id }))}
                                                    className={`p-3 rounded-lg border-2 transition-all ${
                                                        approvalConfig.role === role.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: role.color + '20', color: role.color }}>
                                                            <Icon size={16} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-white text-sm">{role.name}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Access Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Access Level
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {accessLevels.map(level => (
                                            <button
                                                key={level.id}
                                                onClick={() => setApprovalConfig(prev => ({ ...prev, accessLevel: level.id }))}
                                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                    approvalConfig.accessLevel === level.id
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">{level.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Engagement Limits */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Engagement Limits
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Projects</label>
                                            <input
                                                type="number"
                                                value={approvalConfig.engagementLimits.maxProjects}
                                                onChange={(e) => setApprovalConfig(prev => ({
                                                    ...prev,
                                                    engagementLimits: { ...prev.engagementLimits, maxProjects: parseInt(e.target.value) }
                                                }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                min="1"
                                                max="50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Storage Limit</label>
                                            <select
                                                value={approvalConfig.engagementLimits.maxStorage}
                                                onChange={(e) => setApprovalConfig(prev => ({
                                                    ...prev,
                                                    engagementLimits: { ...prev.engagementLimits, maxStorage: e.target.value }
                                                }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                            >
                                                <option value="100MB">100 MB</option>
                                                <option value="500MB">500 MB</option>
                                                <option value="1GB">1 GB</option>
                                                <option value="5GB">5 GB</option>
                                                <option value="10GB">10 GB</option>
                                                <option value="unlimited">Unlimited</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Team Members</label>
                                            <input
                                                type="number"
                                                value={approvalConfig.engagementLimits.maxTeamMembers}
                                                onChange={(e) => setApprovalConfig(prev => ({
                                                    ...prev,
                                                    engagementLimits: { ...prev.engagementLimits, maxTeamMembers: parseInt(e.target.value) }
                                                }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                                min="1"
                                                max="20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Collaboration Duration</label>
                                            <select
                                                value={approvalConfig.duration}
                                                onChange={(e) => setApprovalConfig(prev => ({ ...prev, duration: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                            >
                                                {durations.map(duration => (
                                                    <option key={duration.id} value={duration.id}>{duration.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Permissions
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(approvalConfig.permissions).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setApprovalConfig(prev => ({
                                                        ...prev,
                                                        permissions: { ...prev.permissions, [key]: e.target.checked }
                                                    }))}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Approval Actions */}
                    {request.status === 'pending' && (
                        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    onApprove(request.id, request.name, approvalConfig);
                                    onClose();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                <Check size={20} />
                                Approve with Configuration
                            </button>
                            <button
                                onClick={() => {
                                    onReject(request.id, request.name);
                                    onClose();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <X size={20} />
                                Reject Request
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CollaborationRequests;