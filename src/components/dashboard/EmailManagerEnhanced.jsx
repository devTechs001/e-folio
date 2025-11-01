import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Inbox, Send, Star, Archive, Trash2, Search, 
    Plus, Reply, Forward, MoreVertical, Clock, Paperclip,
    Eye, RefreshCw, CheckCircle, AlertCircle, Download,
    Filter, Tag, Calendar, Users, FileText, Image as ImageIcon,
    Edit3, Save, X, ChevronDown, ChevronUp, Printer, ExternalLink,
    Flag, Bookmark, ChevronLeft, ChevronRight, Maximize2,
    Minimize2, Bold, Italic, Underline, Link2, List, AlignLeft,
    Code, Smile, AtSign, Hash, Settings, Bell, BellOff, Upload,
    Zap, Clock3, UserPlus, Copy, CheckCheck, XCircle, AlertTriangle,
    TrendingUp, BarChart, PieChart, Activity, Folder, FolderPlus,
    MessageSquare, Phone, Video, MapPin, Globe, Shield, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const EmailManagerEnhanced = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { on, off } = useSocket();
    const { success, error, info } = useNotifications();
    
    // State Management
    const [activeTab, setActiveTab] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);
    const [replying, setReplying] = useState(false);
    const [forwarding, setForwarding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        priority: 'normal',
        scheduledFor: null,
        attachments: [],
        templateId: null,
        signature: true
    });
    const [filters, setFilters] = useState({
        unread: false,
        starred: false,
        hasAttachment: false,
        priority: 'all',
        label: 'all',
        dateRange: { start: '', end: '' }
    });
    const [labels, setLabels] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [folders, setFolders] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        sent: 0,
        drafts: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [emailsPerPage] = useState(20);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('comfortable'); // compact, comfortable, expanded
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [autoSaveInterval, setAutoSaveInterval] = useState(null);
    const [emailThreads, setEmailThreads] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [emailSettings, setEmailSettings] = useState({
        autoReply: false,
        autoReplyMessage: '',
        signature: '',
        readReceipts: true,
        notifications: true
    });
    const [quickResponses, setQuickResponses] = useState([]);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showScheduler, setShowScheduler] = useState(false);
    
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

    // Load data on mount
    useEffect(() => {
        if (isOwner()) {
            loadEmails();
            loadLabels();
            loadTemplates();
            loadFolders();
            loadStats();
            loadDrafts();
            loadSettings();
            loadQuickResponses();

            // Setup real-time updates
            const handleNewEmail = (email) => {
                setEmails(prev => [email, ...prev]);
                loadStats();
                if (emailSettings.notifications) {
                    info(`New email from ${email.from.name}`);
                }
            };

            on('new_email', handleNewEmail);

            // Auto-refresh
            const interval = setInterval(loadEmails, 60000);

            return () => {
                off('new_email', handleNewEmail);
                clearInterval(interval);
            };
        }
    }, [isOwner, on, off]);

    // Auto-save draft
    useEffect(() => {
        if (composing && composeData.body) {
            const timeout = setTimeout(() => {
                saveDraft();
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [composeData, composing]);

    // API Functions
    const loadEmails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getEmails({
                folder: activeTab,
                page: currentPage,
                limit: emailsPerPage,
                sortBy,
                sortOrder,
                ...filters
            });
            setEmails(response.emails || []);
        } catch (err) {
            console.error('Error loading emails:', err);
            error('Failed to load emails');
        } finally {
            setLoading(false);
        }
    };

    const loadLabels = async () => {
        try {
            const response = await apiService.getEmailLabels();
            setLabels(response.labels || []);
        } catch (err) {
            console.error('Error loading labels:', err);
        }
    };

    const loadTemplates = async () => {
        try {
            const response = await apiService.getEmailTemplates();
            setTemplates(response.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };

    const loadFolders = async () => {
        try {
            const response = await apiService.getEmailFolders();
            setFolders(response.folders || []);
        } catch (err) {
            console.error('Error loading folders:', err);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getEmailStats();
            setStats(response.stats || stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const loadDrafts = async () => {
        try {
            const response = await apiService.getEmailDrafts();
            setDrafts(response.drafts || []);
        } catch (err) {
            console.error('Error loading drafts:', err);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await apiService.getEmailSettings();
            setEmailSettings(response.settings || emailSettings);
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const loadQuickResponses = async () => {
        try {
            const response = await apiService.getQuickResponses();
            setQuickResponses(response.responses || []);
        } catch (err) {
            console.error('Error loading quick responses:', err);
        }
    };

    const handleSendEmail = async () => {
        try {
            if (!composeData.to || !composeData.subject) {
                error('Please fill in recipient and subject');
                return;
            }

            const response = await apiService.sendEmail({
                ...composeData,
                replyTo: replying ? selectedEmail?.id : null,
                forwardFrom: forwarding ? selectedEmail?.id : null
            });

            if (response.success) {
                success('Email sent successfully');
                resetCompose();
                loadEmails();
            }
        } catch (err) {
            console.error('Error sending email:', err);
            error('Failed to send email');
        }
    };

    const saveDraft = async () => {
        try {
            await apiService.saveDraft(composeData);
            info('Draft saved');
        } catch (err) {
            console.error('Error saving draft:', err);
        }
    };

    const handleMarkAsRead = async (emailIds) => {
        const ids = Array.isArray(emailIds) ? emailIds : [emailIds];
        try {
            await apiService.markEmailsAsRead(ids);
            setEmails(prev => prev.map(email => 
                ids.includes(email.id) ? { ...email, unread: false } : email
            ));
            loadStats();
        } catch (err) {
            error('Failed to mark as read');
        }
    };

    const handleMarkAsUnread = async (emailIds) => {
        const ids = Array.isArray(emailIds) ? emailIds : [emailIds];
        try {
            await apiService.markEmailsAsUnread(ids);
            setEmails(prev => prev.map(email => 
                ids.includes(email.id) ? { ...email, unread: true } : email
            ));
            loadStats();
        } catch (err) {
            error('Failed to mark as unread');
        }
    };

    const handleToggleStar = async (emailId) => {
        try {
            const email = emails.find(e => e.id === emailId);
            await apiService.toggleEmailStar(emailId);
            setEmails(prev => prev.map(e => 
                e.id === emailId ? { ...e, starred: !e.starred } : e
            ));
            success(email.starred ? 'Removed from starred' : 'Added to starred');
        } catch (err) {
            error('Failed to toggle star');
        }
    };

    const handleDeleteEmail = async (emailIds) => {
        const ids = Array.isArray(emailIds) ? emailIds : [emailIds];
        if (!confirm(`Delete ${ids.length} email(s)?`)) return;

        try {
            await apiService.deleteEmails(ids);
            setEmails(prev => prev.filter(e => !ids.includes(e.id)));
            setSelectedEmail(null);
            setSelectedEmails([]);
            success('Email(s) deleted');
            loadStats();
        } catch (err) {
            error('Failed to delete email(s)');
        }
    };

    const handleArchiveEmail = async (emailIds) => {
        const ids = Array.isArray(emailIds) ? emailIds : [emailIds];
        try {
            await apiService.archiveEmails(ids);
            setEmails(prev => prev.filter(e => !ids.includes(e.id)));
            setSelectedEmail(null);
            setSelectedEmails([]);
            success('Email(s) archived');
        } catch (err) {
            error('Failed to archive email(s)');
        }
    };

    const handleAddLabel = async (emailId, labelId) => {
        try {
            await apiService.addEmailLabel(emailId, labelId);
            setEmails(prev => prev.map(e => 
                e.id === emailId 
                    ? { ...e, labels: [...(e.labels || []), labelId] }
                    : e
            ));
            success('Label added');
        } catch (err) {
            error('Failed to add label');
        }
    };

    const handleRemoveLabel = async (emailId, labelId) => {
        try {
            await apiService.removeEmailLabel(emailId, labelId);
            setEmails(prev => prev.map(e => 
                e.id === emailId 
                    ? { ...e, labels: (e.labels || []).filter(l => l !== labelId) }
                    : e
            ));
            success('Label removed');
        } catch (err) {
            error('Failed to remove label');
        }
    };

    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await apiService.uploadEmailAttachment(formData, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                });

                setComposeData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, {
                        name: file.name,
                        size: file.size,
                        url: response.url,
                        type: file.type
                    }]
                }));

                success(`${file.name} uploaded`);
            } catch (err) {
                error(`Failed to upload ${file.name}`);
            }
        }
    };

    const removeAttachment = (index) => {
        setComposeData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const applyTemplate = (template) => {
        setComposeData(prev => ({
            ...prev,
            subject: template.subject || prev.subject,
            body: template.body || prev.body,
            templateId: template.id
        }));
        setShowTemplates(false);
    };

    const insertQuickResponse = (response) => {
        setComposeData(prev => ({
            ...prev,
            body: prev.body + '\n\n' + response.content
        }));
        setShowQuickResponses(false);
    };

    const handleReply = (email) => {
        setSelectedEmail(email);
        setReplying(true);
        setComposing(true);
        setComposeData({
            to: email.from.email,
            cc: '',
            bcc: '',
            subject: `Re: ${email.subject}`,
            body: `\n\n---\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.from.name} wrote:\n${email.body}`,
            priority: 'normal',
            scheduledFor: null,
            attachments: [],
            templateId: null,
            signature: true
        });
    };

    const handleForward = (email) => {
        setSelectedEmail(email);
        setForwarding(true);
        setComposing(true);
        setComposeData({
            to: '',
            cc: '',
            bcc: '',
            subject: `Fwd: ${email.subject}`,
            body: `\n\n---\nForwarded message:\nFrom: ${email.from.name} <${email.from.email}>\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
            priority: 'normal',
            scheduledFor: null,
            attachments: email.attachments || [],
            templateId: null,
            signature: true
        });
    };

    const resetCompose = () => {
        setComposing(false);
        setReplying(false);
        setForwarding(false);
        setComposeData({
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            body: '',
            priority: 'normal',
            scheduledFor: null,
            attachments: [],
            templateId: null,
            signature: true
        });
        setShowCc(false);
        setShowBcc(false);
    };

    const toggleSelectEmail = (emailId) => {
        setSelectedEmails(prev =>
            prev.includes(emailId)
                ? prev.filter(id => id !== emailId)
                : [...prev, emailId]
        );
    };

    const selectAllEmails = () => {
        if (selectedEmails.length === emails.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(emails.map(e => e.id));
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const emailDate = new Date(date);
        const diff = now - emailDate;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return emailDate.toLocaleDateString();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const filteredEmails = emails.filter(email => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
                !email.subject.toLowerCase().includes(query) &&
                !email.from.name.toLowerCase().includes(query) &&
                !email.preview.toLowerCase().includes(query)
            ) {
                return false;
            }
        }

        if (filters.unread && !email.unread) return false;
        if (filters.starred && !email.starred) return false;
        if (filters.hasAttachment && !email.hasAttachment) return false;
        if (filters.priority !== 'all' && email.priority !== filters.priority) return false;
        if (filters.label !== 'all' && !email.labels?.includes(filters.label)) return false;

        return true;
    });

    const tabs = [
        { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.unread },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'sent', label: 'Sent', icon: Send, count: stats.sent },
        { id: 'drafts', label: 'Drafts', icon: Edit3, count: stats.drafts },
        { id: 'archived', label: 'Archived', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
        { id: 'spam', label: 'Spam', icon: AlertTriangle }
    ];

    // Access check
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 max-w-md">
                        <Mail size={64} className="text-red-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-3">
                            Access Restricted
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Email management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="Email Manager" 
            subtitle="Manage portfolio inquiries and communications"
        >
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Emails</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                        </div>
                        <Mail className="text-blue-600 dark:text-blue-400" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Unread</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.unread}</p>
                        </div>
                        <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Sent</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.sent}</p>
                        </div>
                        <Send className="text-green-600 dark:text-green-400" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Drafts</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.drafts}</p>
                        </div>
                        <Edit3 className="text-purple-600 dark:text-purple-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Main Email Interface */}
            <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-[250px_400px_1fr]'} h-[calc(100vh-320px)] gap-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
                
                {/* Sidebar */}
                {!isFullscreen && (
                    <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 overflow-y-auto">
                        {/* Compose Button */}
                        <button
                            onClick={() => {
                                setComposing(true);
                                resetCompose();
                            }}
                            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mb-4"
                        >
                            <Plus size={20} />
                            Compose
                        </button>

                        {/* Tabs */}
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} />
                                        <span>{tab.label}</span>
                                    </div>
                                    {tab.count > 0 && (
                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                            {tab.count}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}

                        {/* Custom Folders */}
                        {folders.length > 0 && (
                            <>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 mb-2">
                                    Folders
                                </p>
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                    >
                                        <Folder size={16} />
                                        <span className="text-sm">{folder.name}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        {/* Labels */}
                        {labels.length > 0 && (
                            <>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 mb-2">
                                    Labels
                                </p>
                                {labels.map(label => (
                                    <button
                                        key={label.id}
                                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="text-sm">{label.name}</span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Email List */}
                {!isFullscreen && (
                    <div className="flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                        {/* Search & Actions */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                                />
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAllEmails}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Select all"
                                >
                                    {selectedEmails.length === emails.length ? (
                                        <CheckCheck size={18} className="text-blue-600" />
                                    ) : (
                                        <CheckCircle size={18} className="text-gray-600 dark:text-gray-400" />
                                    )}
                                </button>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Filter"
                                >
                                    <Filter size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>

                                <button
                                    onClick={loadEmails}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>

                                <div className="flex-1" />

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="date">Date</option>
                                    <option value="sender">Sender</option>
                                    <option value="subject">Subject</option>
                                </select>

                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    {sortOrder === 'desc' ? (
                                        <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
                                    ) : (
                                        <ChevronUp size={18} className="text-gray-600 dark:text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {/* Filters Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.unread}
                                                    onChange={(e) => setFilters({...filters, unread: e.target.checked})}
                                                    className="rounded"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">Unread only</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.starred}
                                                    onChange={(e) => setFilters({...filters, starred: e.target.checked})}
                                                    className="rounded"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">Starred only</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.hasAttachment}
                                                    onChange={(e) => setFilters({...filters, hasAttachment: e.target.checked})}
                                                    className="rounded"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">Has attachments</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bulk Actions */}
                        <AnimatePresence>
                            {selectedEmails.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center gap-2"
                                >
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {selectedEmails.length} selected
                                    </span>
                                    <button
                                        onClick={() => handleMarkAsRead(selectedEmails)}
                                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                        title="Mark as read"
                                    >
                                        <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                    <button
                                        onClick={() => handleArchiveEmail(selectedEmails)}
                                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                        title="Archive"
                                    >
                                        <Archive size={16} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmail(selectedEmails)}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedEmails([])}
                                        className="ml-auto p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                    >
                                        <X size={16} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Items */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-10">
                                    <RefreshCw size={32} className="text-blue-500 animate-spin" />
                                </div>
                            ) : filteredEmails.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                                    <Mail size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No emails found</p>
                                </div>
                            ) : (
                                filteredEmails.map(email => (
                                    <motion.div
                                        key={email.id}
                                        onClick={() => {
                                            setSelectedEmail(email);
                                            handleMarkAsRead(email.id);
                                        }}
                                        whileHover={{ x: 4 }}
                                        className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${
                                            selectedEmail?.id === email.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selectedEmails.includes(email.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelectEmail(email.id);
                                                }}
                                                className="mt-1"
                                            />

                                            {/* Email Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm ${email.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                        {email.from.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {email.hasAttachment && (
                                                            <Paperclip size={14} className="text-gray-400" />
                                                        )}
                                                        {email.priority === 'high' && (
                                                            <Flag size={14} className="text-red-500" />
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleStar(email.id);
                                                            }}
                                                        >
                                                            <Star 
                                                                size={14} 
                                                                className={email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} 
                                                            />
                                                        </button>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTime(email.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h4 className={`text-sm mb-1 truncate ${email.unread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {email.subject}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {email.preview}
                                                </p>

                                                {/* Labels */}
                                                {email.labels && email.labels.length > 0 && (
                                                    <div className="flex gap-1 mt-2">
                                                        {email.labels.map(labelId => {
                                                            const label = labels.find(l => l.id === labelId);
                                                            return label ? (
                                                                <span
                                                                    key={labelId}
                                                                    className="px-2 py-0.5 text-xs rounded-full"
                                                                    style={{
                                                                        backgroundColor: `${label.color}20`,
                                                                        color: label.color
                                                                    }}
                                                                >
                                                                    {label.name}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Unread Indicator */}
                                            {email.unread && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Email Content / Compose */}
                <div className="flex flex-col bg-white dark:bg-gray-900">
                    {composing ? (
                        /* Compose View */
                        <div className="flex flex-col h-full">
                            {/* Compose Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {replying ? 'Reply' : forwarding ? 'Forward' : 'New Message'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowTemplates(!showTemplates)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Templates"
                                    >
                                        <FileText size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                    >
                                        {isFullscreen ? (
                                            <Minimize2 size={18} className="text-gray-600 dark:text-gray-400" />
                                        ) : (
                                            <Maximize2 size={18} className="text-gray-600 dark:text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={resetCompose}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Compose Form */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {/* To Field */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                        To:
                                    </label>
                                    <input
                                        type="email"
                                        value={composeData.to}
                                        onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                                        placeholder="recipient@example.com"
                                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                    <button
                                        onClick={() => setShowCc(!showCc)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Cc
                                    </button>
                                    <button
                                        onClick={() => setShowBcc(!showBcc)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Bcc
                                    </button>
                                </div>

                                {/* Cc Field */}
                                {showCc && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                            Cc:
                                        </label>
                                        <input
                                            type="email"
                                            value={composeData.cc}
                                            onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                                            placeholder="cc@example.com"
                                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                )}

                                {/* Bcc Field */}
                                {showBcc && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                            Bcc:
                                        </label>
                                        <input
                                            type="email"
                                            value={composeData.bcc}
                                            onChange={(e) => setComposeData({...composeData, bcc: e.target.value})}
                                            placeholder="bcc@example.com"
                                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        />
                                    </div>
                                )}

                                {/* Subject Field */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                        Subject:
                                    </label>
                                    <input
                                        type="text"
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                                        placeholder="Email subject"
                                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>

                                {/* Priority */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                        Priority:
                                    </label>
                                    <select
                                        value={composeData.priority}
                                        onChange={(e) => setComposeData({...composeData, priority: e.target.value})}
                                        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                {/* Body */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <textarea
                                        ref={editorRef}
                                        value={composeData.body}
                                        onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                                        placeholder="Write your message..."
                                        rows={15}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Attachments */}
                                {composeData.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Attachments ({composeData.attachments.length})
                                        </p>
                                        {composeData.attachments.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Paperclip size={16} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeAttachment(index)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <X size={16} className="text-gray-600 dark:text-gray-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Compose Actions */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSendEmail}
                                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Send size={18} />
                                        Send
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>

                                    <button
                                        onClick={() => setShowQuickResponses(!showQuickResponses)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Quick responses"
                                    >
                                        <Zap size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>

                                    <button
                                        onClick={() => setShowScheduler(!showScheduler)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Schedule send"
                                    >
                                        <Clock3 size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                <button
                                    onClick={saveDraft}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                                >
                                    <Save size={18} />
                                    Save Draft
                                </button>
                            </div>
                        </div>
                    ) : selectedEmail ? (
                        /* Email View */
                        <div className="flex flex-col h-full">
                            {/* Email Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 pr-4">
                                        {selectedEmail.subject}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleStar(selectedEmail.id)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Star 
                                                size={20} 
                                                className={selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 dark:text-gray-400'} 
                                            />
                                        </button>
                                        <button
                                            onClick={() => handleArchiveEmail(selectedEmail.id)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Archive"
                                        >
                                            <Archive size={20} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmail(selectedEmail.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Print"
                                        >
                                            <Printer size={20} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            {isFullscreen ? (
                                                <Minimize2 size={20} className="text-gray-600 dark:text-gray-400" />
                                            ) : (
                                                <Maximize2 size={20} className="text-gray-600 dark:text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                        {selectedEmail.from.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {selectedEmail.from.name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {selectedEmail.from.email}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(selectedEmail.timestamp).toLocaleString()}
                                                </p>
                                                {selectedEmail.priority === 'high' && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                                                        <Flag size={12} />
                                                        High Priority
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Labels */}
                                {selectedEmail.labels && selectedEmail.labels.length > 0 && (
                                    <div className="flex gap-2 mt-3">
                                        {selectedEmail.labels.map(labelId => {
                                            const label = labels.find(l => l.id === labelId);
                                            return label ? (
                                                <span
                                                    key={labelId}
                                                    className="px-3 py-1 text-xs rounded-full font-medium"
                                                    style={{
                                                        backgroundColor: `${label.color}20`,
                                                        color: label.color
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Email Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedEmail.body}
                                    </p>
                                </div>

                                {/* Attachments */}
                                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            Attachments ({selectedEmail.attachments.length})
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedEmail.attachments.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <Paperclip size={20} className="text-gray-400" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={file.url}
                                                        download
                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                    >
                                                        <Download size={16} className="text-gray-600 dark:text-gray-400" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Email Actions */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                <button
                                    onClick={() => handleReply(selectedEmail)}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Reply size={18} />
                                    Reply
                                </button>
                                <button
                                    onClick={() => handleForward(selectedEmail)}
                                    className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold transition-all"
                                >
                                    <Forward size={18} />
                                    Forward
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                                <Mail size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="text-lg">Select an email to read</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Templates Modal */}
            <AnimatePresence>
                {showTemplates && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTemplates(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Email Templates
                                </h3>
                                <button
                                    onClick={() => setShowTemplates(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => applyTemplate(template)}
                                        className="p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-gray-700"
                                    >
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {template.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {template.description}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Subject: {template.subject}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default EmailManagerEnhanced;