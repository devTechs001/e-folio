import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Inbox, Star, Send, Edit3, Archive, Trash2, AlertTriangle,
    Search, Filter, Plus, Paperclip, X, Clock3, Zap, Save, Reply, 
    Forward, Printer, Minimize2, Maximize2, Download, Flag, 
    Check, Tag, Eye, EyeOff, RefreshCw, BarChart, TrendingUp,
    Calendar, Users, Target, Sparkles, Brain, Bot, Settings,
    Bell, Shield, Award, Globe, Headphones, MessageCircle,
    FileText, Database, Activity, PieChart, LineChart, MailOpen,
    AtSign, Hash, Link, Smile, Frown, Meh, Heart,
    Bookmark, MoreHorizontal, ChevronLeft, ChevronRight,
    CheckSquare, Square, User, Lock, Unlock, Cloud, Sun,
    Moon, Wifi, WifiOff, Volume2, VolumeX
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const EmailManagerEnhanced = () => {
    const [emails, setEmails] = useState([]);
    const [drafts, setDrafts] = useState([]); // ✅ ADDED
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [composing, setComposing] = useState(false);
    const [replying, setReplying] = useState(false);
    const [forwarding, setForwarding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('inbox');
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
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showFilters, setShowFilters] = useState(false); // ✅ ADDED
    const [showLabels, setShowLabels] = useState(false); // ✅ ADDED
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [filters, setFilters] = useState({
        unread: false,
        starred: false,
        hasAttachment: false,
        priority: 'all',
        label: 'all'
    });

    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

    // Mock data
    const [stats, setStats] = useState({
        unread: 5,
        sent: 12,
        drafts: 3
    });

    const labels = [
        { id: 'work', name: 'Work', color: '#3B82F6' },
        { id: 'personal', name: 'Personal', color: '#10B981' },
        { id: 'important', name: 'Important', color: '#EF4444' }
    ];

    const templates = [
        {
            id: 1,
            name: 'Project Inquiry',
            description: 'Template for responding to project inquiries',
            subject: 'Re: Project Inquiry',
            body: 'Thank you for your interest in working together...'
        },
        {
            id: 2,
            name: 'Meeting Follow-up',
            description: 'Template for following up after meetings',
            subject: 'Following up on our meeting',
            body: 'It was great meeting with you today. Here are the key points we discussed...'
        }
    ];

    // ✅ ADDED: Quick responses
    const quickResponses = [
        { id: 1, name: 'Thank You', body: 'Thank you for reaching out. I appreciate your message.' },
        { id: 2, name: 'Will Reply Soon', body: 'Thank you for your email. I will get back to you shortly.' },
        { id: 3, name: 'Received', body: 'I have received your email and will review it carefully.' }
    ];

    // Seed mock emails
    useEffect(() => {
        if (emails.length === 0) {
            setEmails([
                {
                    id: 'e_1',
                    subject: 'Welcome to E-Folio',
                    from: { name: 'E-Folio Team', email: 'hello@efolio.dev' },
                    preview: 'Thanks for joining E-Folio! Here are some tips to get started...',
                    body: 'Thanks for joining E-Folio! We\'re excited to have you. Start by customizing your portfolio...',
                    timestamp: Date.now() - 1000 * 60 * 60 * 24,
                    unread: true,
                    starred: false,
                    attachments: [],
                    priority: 'normal',
                    labels: [],
                    folder: 'inbox', // ✅ ADDED
                    archived: false
                },
                {
                    id: 'e_2',
                    subject: 'Project inquiry from Alice',
                    from: { name: 'Alice Johnson', email: 'alice@example.com' },
                    preview: 'Hi, I saw your portfolio and would love to discuss a project...',
                    body: 'Hi, I saw your portfolio and would love to discuss a project. Are you available next week?',
                    timestamp: Date.now() - 1000 * 60 * 60 * 5,
                    unread: false,
                    starred: true,
                    attachments: [{ name: 'brief.pdf', size: 245000, type: 'application/pdf' }],
                    priority: 'high',
                    labels: ['work'],
                    folder: 'inbox',
                    archived: false,
                    hasAttachment: true
                },
                {
                    id: 'e_3',
                    subject: 'Newsletter: Design Trends 2024',
                    from: { name: 'Design Weekly', email: 'news@designweekly.com' },
                    preview: 'Check out the latest design trends for 2024...',
                    body: 'Here are the top design trends to watch in 2024...',
                    timestamp: Date.now() - 1000 * 60 * 60 * 48,
                    unread: false,
                    starred: false,
                    attachments: [],
                    priority: 'low',
                    labels: ['personal'],
                    folder: 'inbox',
                    archived: false
                }
            ]);
        }
    }, []);

    const isOwner = () => true;

    // ✅ UPDATED: Actual send functionality
    const handleSendEmail = () => {
        if (!composeData.to) {
            // Create a simple notification instead of alert
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
            notification.textContent = 'Please enter a recipient';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
            return;
        }

        const newEmail = {
            id: `e_${Date.now()}`,
            subject: composeData.subject || '(no subject)',
            from: { name: 'You', email: 'me@local' },
            to: composeData.to,
            cc: composeData.cc,
            bcc: composeData.bcc,
            preview: composeData.body?.substring(0, 100) || '',
            body: composeData.body,
            timestamp: composeData.scheduledFor || Date.now(),
            unread: false,
            starred: false,
            attachments: composeData.attachments || [],
            priority: composeData.priority || 'normal',
            labels: [],
            folder: 'sent',
            archived: false
        };

        setEmails(prev => [newEmail, ...prev]);
        setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
        resetCompose();
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = composeData.scheduledFor ? 'Email scheduled!' : 'Email sent successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // ✅ UPDATED: Save draft functionality
    const saveDraft = () => {
        const draft = {
            id: `d_${Date.now()}`,
            subject: composeData.subject || '(no subject)',
            from: { name: 'You', email: 'me@local' },
            to: composeData.to,
            preview: composeData.body?.substring(0, 100) || '',
            body: composeData.body,
            timestamp: Date.now(),
            attachments: composeData.attachments || [],
            priority: composeData.priority,
            folder: 'drafts',
            unread: false,
            starred: false,
            labels: [],
            archived: false
        };

        setEmails(prev => [draft, ...prev]);
        setStats(prev => ({ ...prev, drafts: prev.drafts + 1 }));
        resetCompose();
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Draft saved successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    // ✅ UPDATED: Toggle star functionality
    const handleToggleStar = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId 
                ? { ...email, starred: !email.starred }
                : email
        ));
    };

    // ✅ UPDATED: Archive functionality
    const handleArchiveEmail = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId 
                ? { ...email, archived: !email.archived, folder: email.archived ? 'inbox' : 'archived' }
                : email
        ));
    };

    // ✅ UPDATED: Delete functionality
    const handleDeleteEmail = (emailId) => {
        // Create confirmation dialog instead of window.confirm
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        confirmDialog.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Email</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Move this email to trash? This action can be undone.</p>
                <div class="flex gap-3 justify-end">
                    <button id="cancel-delete" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                    <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmDialog);
        
        const handleConfirm = () => {
            setEmails(prev => prev.map(email => 
                email.id === emailId 
                    ? { ...email, folder: 'trash' }
                    : email
            ));
            setSelectedEmail(null);
            
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            notification.textContent = 'Email moved to trash';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
            
            document.body.removeChild(confirmDialog);
        };
        
        const handleCancel = () => {
            document.body.removeChild(confirmDialog);
        };
        
        document.getElementById('confirm-delete').addEventListener('click', handleConfirm);
        document.getElementById('cancel-delete').addEventListener('click', handleCancel);
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) handleCancel();
        });
    };

    // ✅ ADDED: Mark as read/unread
    const handleToggleRead = (emailId) => {
        setEmails(prev => prev.map(email => {
            if (email.id === emailId) {
                const newUnread = !email.unread;
                setStats(s => ({ 
                    ...s, 
                    unread: newUnread ? s.unread + 1 : Math.max(0, s.unread - 1)
                }));
                return { ...email, unread: newUnread };
            }
            return email;
        }));
    };

    // ✅ ADDED: Add/remove labels
    const handleToggleLabel = (emailId, labelId) => {
        setEmails(prev => prev.map(email => {
            if (email.id === emailId) {
                const labels = email.labels || [];
                const hasLabel = labels.includes(labelId);
                return {
                    ...email,
                    labels: hasLabel 
                        ? labels.filter(l => l !== labelId)
                        : [...labels, labelId]
                };
            }
            return email;
        }));
    };

    // ✅ ADDED: Bulk actions
    const handleBulkAction = (action) => {
        if (selectedEmails.length === 0) return;

        switch (action) {
            case 'delete':
                if (window.confirm(`Move ${selectedEmails.length} emails to trash?`)) {
                    setEmails(prev => prev.map(email => 
                        selectedEmails.includes(email.id) 
                            ? { ...email, folder: 'trash' }
                            : email
                    ));
                }
                break;
            case 'archive':
                setEmails(prev => prev.map(email => 
                    selectedEmails.includes(email.id) 
                        ? { ...email, archived: true, folder: 'archived' }
                        : email
                ));
                break;
            case 'read':
                setEmails(prev => prev.map(email => 
                    selectedEmails.includes(email.id) 
                        ? { ...email, unread: false }
                        : email
                ));
                break;
            case 'unread':
                setEmails(prev => prev.map(email => 
                    selectedEmails.includes(email.id) 
                        ? { ...email, unread: true }
                        : email
                ));
                break;
            case 'star':
                setEmails(prev => prev.map(email => 
                    selectedEmails.includes(email.id) 
                        ? { ...email, starred: true }
                        : email
                ));
                break;
        }
        setSelectedEmails([]);
    };

    const handleFileUpload = (files) => {
        const newAttachments = Array.from(files).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
        }));
        setComposeData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...newAttachments]
        }));
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
            subject: template.subject,
            body: template.body,
            templateId: template.id
        }));
        setShowTemplates(false);
    };

    // ✅ ADDED: Apply quick response
    const applyQuickResponse = (response) => {
        setComposeData(prev => ({
            ...prev,
            body: prev.body + '\n\n' + response.body
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
            body: `\n\n---\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.from.name} wrote:\n\n${email.body}`,
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
        const visibleEmails = getFilteredEmails();
        if (selectedEmails.length === visibleEmails.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(visibleEmails.map(e => e.id));
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

    // ✅ UPDATED: Filter emails by search, filters, and active tab
    const getFilteredEmails = () => {
        return emails.filter(email => {
            // Tab filtering
            if (activeTab === 'inbox' && email.folder !== 'inbox') return false;
            if (activeTab === 'starred' && !email.starred) return false;
            if (activeTab === 'sent' && email.folder !== 'sent') return false;
            if (activeTab === 'drafts' && email.folder !== 'drafts') return false;
            if (activeTab === 'archived' && email.folder !== 'archived') return false;
            if (activeTab === 'trash' && email.folder !== 'trash') return false;
            if (activeTab === 'spam' && email.folder !== 'spam') return false;

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !email.subject?.toLowerCase().includes(query) &&
                    !email.from?.name.toLowerCase().includes(query) &&
                    !email.preview?.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Filters
            if (filters.unread && !email.unread) return false;
            if (filters.starred && !email.starred) return false;
            if (filters.hasAttachment && !email.hasAttachment) return false;
            if (filters.priority !== 'all' && email.priority !== filters.priority) return false;
            if (filters.label !== 'all' && !email.labels?.includes(filters.label)) return false;

            return true;
        });
    };

    const filteredEmails = getFilteredEmails();

    const tabs = [
        { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.unread },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'sent', label: 'Sent', icon: Send, count: stats.sent },
        { id: 'drafts', label: 'Drafts', icon: Edit3, count: stats.drafts },
        { id: 'archived', label: 'Archived', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
        { id: 'spam', label: 'Spam', icon: AlertTriangle }
    ];

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
        <DashboardLayout title="Email Manager" subtitle="Manage portfolio inquiries and communications">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Manager</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage portfolio inquiries and communications</p>
                        </div>
                        <button
                            onClick={() => setComposing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus size={20} />
                            Compose
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 border rounded-lg transition-colors ${
                                showFilters 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' 
                                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <Filter size={20} className={showFilters ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} />
                        </button>
                    </div>

                    {/* ✅ ADDED: Filter Panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.unread}
                                        onChange={(e) => setFilters({...filters, unread: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Unread</span>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.starred}
                                        onChange={(e) => setFilters({...filters, starred: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Starred</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.hasAttachment}
                                        onChange={(e) => setFilters({...filters, hasAttachment: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Has Attachment</span>
                                </label>

                                <select
                                    value={filters.priority}
                                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                    className="px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>

                                <select
                                    value={filters.label}
                                    onChange={(e) => setFilters({...filters, label: e.target.value})}
                                    className="px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="all">All Labels</option>
                                    {labels.map(label => (
                                        <option key={label.id} value={label.id}>{label.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => setFilters({ unread: false, starred: false, hasAttachment: false, priority: 'all', label: 'all' })}
                                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Clear all filters
                            </button>
                        </motion.div>
                    )}

                    {/* ✅ ADDED: Bulk Actions Bar */}
                    {selectedEmails.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between"
                        >
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkAction('read')}
                                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                                    title="Mark as read"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={() => handleBulkAction('unread')}
                                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                                    title="Mark as unread"
                                >
                                    <EyeOff size={16} />
                                </button>
                                <button
                                    onClick={() => handleBulkAction('star')}
                                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                                    title="Star all"
                                >
                                    <Star size={16} />
                                </button>
                                <button
                                    onClick={() => handleBulkAction('archive')}
                                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                                    title="Archive all"
                                >
                                    <Archive size={16} />
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                                    title="Delete all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => setSelectedEmails([])}
                                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
                        <div className="p-4 space-y-1">
                            {tabs.map(tab => {
                                const tabCount = tab.id === 'inbox' ? stats.unread :
                                               tab.id === 'sent' ? stats.sent :
                                               tab.id === 'drafts' ? stats.drafts : null;
                                
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <tab.icon size={20} />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {tabCount > 0 && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                                                {tabCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    Labels
                                </p>
                                {labels.map(label => (
                                    <button
                                        key={label.id}
                                        onClick={() => setFilters({...filters, label: label.id})}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                            filters.label === label.id
                                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                                : 'hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300">
                                            {label.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Email List */}
                    <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
                        {/* ✅ ADDED: Select All Checkbox */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                                    onChange={selectAllEmails}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Select all
                                </span>
                            </label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEmails.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Mail size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No emails found</p>
                                </div>
                            ) : (
                                filteredEmails.map((email, index) => (
                                    <motion.div
                                        key={email.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        className={`group relative p-4 cursor-pointer transition-all duration-200 ${
                                            selectedEmail?.id === email.id 
                                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-l-4 border-blue-500 shadow-sm' 
                                                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700'
                                        } ${
                                            email.unread 
                                                ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-2 border-blue-400' 
                                                : ''
                                        }`}
                                    >
                                        {/* Animated gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <div className="flex items-start gap-3 relative z-10">
                                            {/* Enhanced Checkbox */}
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmails.includes(email.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelectEmail(email.id);
                                                    }}
                                                    className="mt-1 w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </motion.div>
                                            
                                            <div 
                                                className="flex-1 min-w-0"
                                                onClick={() => {
                                                    setSelectedEmail(email);
                                                    setComposing(false);
                                                    if (email.unread) {
                                                        handleToggleRead(email.id);
                                                    }
                                                }}
                                            >
                                                {/* Email Header */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {/* Avatar */}
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                            {email.from?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <h4 className={`text-sm truncate transition-all duration-200 ${
                                                            email.unread 
                                                                ? 'font-bold text-gray-900 dark:text-white' 
                                                                : 'font-medium text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                            {email.from?.name || 'Unknown'}
                                                        </h4>
                                                        {/* Status indicators */}
                                                        {email.priority === 'high' && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="w-2 h-2 bg-red-500 rounded-full"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                            {formatTime(email.timestamp)}
                                                        </span>
                                                        {/* Quick actions */}
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                                                            <motion.button
                                                                whileHover={{ scale: 1.2 }}
                                                                whileTap={{ scale: 0.8 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleStar(email.id);
                                                                }}
                                                                className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
                                                            >
                                                                <Star size={14} className={email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Subject */}
                                                <p className={`text-sm truncate mb-1 transition-all duration-200 ${
                                                    email.unread 
                                                        ? 'font-semibold text-gray-800 dark:text-gray-100' 
                                                        : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {email.subject}
                                                </p>
                                                
                                                {/* Preview */}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2 line-clamp-2">
                                                    {email.preview}
                                                </p>
                                                
                                                {/* Enhanced Labels and indicators */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {email.starred && (
                                                        <motion.div
                                                            initial={{ rotate: -180 }}
                                                            animate={{ rotate: 0 }}
                                                            className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"
                                                        >
                                                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                                            <span className="text-xs text-yellow-700 dark:text-yellow-300">Starred</span>
                                                        </motion.div>
                                                    )}
                                                    {email.hasAttachment && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                            <Paperclip size={10} className="text-gray-500 dark:text-gray-400" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-300">Attachment</span>
                                                        </div>
                                                    )}
                                                    {email.priority === 'high' && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full"
                                                        >
                                                            <Flag size={10} className="text-red-500" />
                                                            <span className="text-xs text-red-700 dark:text-red-300">High Priority</span>
                                                        </motion.div>
                                                    )}
                                                    {email.labels?.map(labelId => {
                                                        const label = labels.find(l => l.id === labelId);
                                                        return label ? (
                                                            <motion.div
                                                                key={labelId}
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                whileHover={{ scale: 1.1 }}
                                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                                style={{ 
                                                                    backgroundColor: `${label.color}20`,
                                                                    color: label.color,
                                                                    border: `1px solid ${label.color}40`
                                                                }}
                                                                title={label.name}
                                                            >
                                                                {label.name}
                                                            </motion.div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Hover effect border */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {composing ? (
                            /* Compose View */
                            <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-lg">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {replying ? 'Reply' : forwarding ? 'Forward' : 'New Message'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowTemplates(true)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Use template"
                                        >
                                            <Edit3 size={18} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={resetCompose}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <X size={20} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                                            onKeyDown={(e) => {
                                                // Ctrl+Enter to send
                                                if (e.ctrlKey && e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSendEmail();
                                                }
                                                // Ctrl+S to save draft
                                                if (e.ctrlKey && e.key === 's') {
                                                    e.preventDefault();
                                                    saveDraft();
                                                }
                                                // Escape to cancel
                                                if (e.key === 'Escape') {
                                                    resetCompose();
                                                }
                                            }}
                                            placeholder="Write your message... (Ctrl+Enter to send, Ctrl+S to save draft, Escape to cancel)"
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
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Email Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 pr-4">
                                            {selectedEmail.subject}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            {/* ✅ ADDED: Mark as read/unread */}
                                            <button
                                                onClick={() => handleToggleRead(selectedEmail.id)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title={selectedEmail.unread ? 'Mark as read' : 'Mark as unread'}
                                            >
                                                {selectedEmail.unread ? (
                                                    <Eye size={20} className="text-gray-600 dark:text-gray-400" />
                                                ) : (
                                                    <EyeOff size={20} className="text-gray-600 dark:text-gray-400" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleToggleStar(selectedEmail.id)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Star 
                                                    size={20} 
                                                    className={selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 dark:text-gray-400'} 
                                                />
                                            </button>

                                            {/* ✅ ADDED: Label button */}
                                            <button
                                                onClick={() => setShowLabels(!showLabels)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                                                title="Add label"
                                            >
                                                <Tag size={20} className="text-gray-600 dark:text-gray-400" />
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

                                    {/* ✅ ADDED: Label dropdown */}
                                    {showLabels && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute right-6 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-20"
                                        >
                                            {labels.map(label => (
                                                <button
                                                    key={label.id}
                                                    onClick={() => {
                                                        handleToggleLabel(selectedEmail.id, label.id);
                                                        setShowLabels(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: label.color }}
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {label.name}
                                                    </span>
                                                    {selectedEmail.labels?.includes(label.id) && (
                                                        <Check size={16} className="ml-auto text-blue-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                            {selectedEmail.from?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedEmail.from?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {selectedEmail.from?.email || 'No email'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {selectedEmail.timestamp ? new Date(selectedEmail.timestamp).toLocaleString() : 'Unknown date'}
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
                                            {selectedEmail.body || 'No content'}
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
                                                            href={file.url || '#'}
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
                            (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <div className="text-center">
                                        <Mail size={64} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">Select an email to read</p>
                                        <p className="text-sm mt-2">or</p>
                                        <button
                                            onClick={() => setComposing(true)}
                                            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            Compose new email
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ ADDED: Quick Responses Modal */}
            <AnimatePresence>
                {showQuickResponses && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQuickResponses(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Quick Responses
                                </h3>
                                <button
                                    onClick={() => setShowQuickResponses(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {quickResponses.map(response => (
                                    <button
                                        key={response.id}
                                        onClick={() => applyQuickResponse(response)}
                                        className="w-full p-4 text-left bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                                    >
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {response.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {response.body}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ ADDED: Scheduler Modal */}
            <AnimatePresence>
                {showScheduler && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowScheduler(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Schedule Email
                                </h3>
                                <button
                                    onClick={() => setShowScheduler(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Send at:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={composeData.scheduledFor ? new Date(composeData.scheduledFor).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setComposeData({
                                            ...composeData, 
                                            scheduledFor: new Date(e.target.value).getTime()
                                        })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowScheduler(false);
                                            handleSendEmail();
                                        }}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                                    >
                                        Schedule
                                    </button>
                                    <button
                                        onClick={() => {
                                            setComposeData({...composeData, scheduledFor: null});
                                            setShowScheduler(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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