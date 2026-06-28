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
    Moon, Wifi, WifiOff, Volume2, VolumeX, Menu, PanelLeftClose,
    Loader
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const EmailManagerEnhanced = () => {
    const [emails, setEmails] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [emailView, setEmailView] = useState('list');
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
    const [showFilters, setShowFilters] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
        { id: 'work', name: 'Work', color: '#22D3EE' },
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
                    folder: 'inbox',
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

    const handleSendEmail = () => {
        if (!composeData.to) {
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
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = composeData.scheduledFor ? 'Email scheduled!' : 'Email sent successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

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
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Draft saved successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    const handleToggleStar = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId 
                ? { ...email, starred: !email.starred }
                : email
        ));
    };

    const handleArchiveEmail = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId 
                ? { ...email, archived: !email.archived, folder: email.archived ? 'inbox' : 'archived' }
                : email
        ));
    };

    const handleDeleteEmail = (emailId) => {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        confirmDialog.innerHTML = `
            <div class="bg-slate-900 rounded-lg p-6 max-w-sm mx-4 border border-slate-700/50">
                <h3 class="text-lg font-semibold text-slate-100 mb-2">Delete Email</h3>
                <p class="text-slate-400 mb-4">Move this email to trash? This action can be undone.</p>
                <div class="flex gap-3 justify-end">
                    <button id="cancel-delete" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Cancel</button>
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

    const getFilteredEmails = () => {
        return emails.filter(email => {
            if (activeTab === 'inbox' && email.folder !== 'inbox') return false;
            if (activeTab === 'starred' && !email.starred) return false;
            if (activeTab === 'sent' && email.folder !== 'sent') return false;
            if (activeTab === 'drafts' && email.folder !== 'drafts') return false;
            if (activeTab === 'archived' && email.folder !== 'archived') return false;
            if (activeTab === 'trash' && email.folder !== 'trash') return false;
            if (activeTab === 'spam' && email.folder !== 'spam') return false;

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
                    <div className="text-center p-10 bg-red-900/20 rounded-2xl border border-red-800 max-w-md">
                        <Mail size={64} className="text-red-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-red-400 mb-3">
                            Access Restricted
                        </h2>
                        <p className="text-slate-400">
                            Email management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Email Manager" subtitle="Manage portfolio inquiries and communications">
            <div className="flex flex-1 flex-col md:flex-row h-[calc(100vh-8rem)] bg-slate-950 overflow-hidden">
                {/* Mobile sidebar backdrop */}
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Folder Sidebar */}
                <div className={`${mobileSidebarOpen ? 'fixed left-0 top-0 bottom-0 z-50 flex' : 'hidden'} md:flex md:w-56 lg:w-64 flex-shrink-0 flex-col border-r border-slate-700/50 bg-slate-950 overflow-y-auto`}>
                    {/* Mobile sidebar header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50 md:hidden">
                        <h2 className="text-lg font-bold text-slate-100">Folders</h2>
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="overflow-x-auto flex-nowrap">
                        <div className="p-4 space-y-1 min-w-max">
                            {tabs.map(tab => {
                                const tabCount = tab.id === 'inbox' ? stats.unread :
                                               tab.id === 'sent' ? stats.sent :
                                               tab.id === 'drafts' ? stats.drafts : null;
                                
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setMobileSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 shadow-sm border border-cyan-500/20'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                                        }`}
                                    >
                                        <tab.icon size={20} />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {tabCount > 0 && (
                                            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full font-bold shadow-lg shadow-red-500/25">
                                                {tabCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            <div className="pt-4 mt-4 border-t border-slate-700/50">
                                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Labels
                                </p>
                                {labels.map(label => (
                                    <button
                                        key={label.id}
                                        onClick={() => setFilters({...filters, label: label.id})}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                            filters.label === label.id
                                                ? 'bg-slate-800/60 shadow-sm border border-slate-600/30'
                                                : 'hover:bg-slate-800/40 border border-transparent'
                                        }`}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="flex-1 text-left text-sm text-slate-300">
                                            {label.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-slate-700/50 bg-slate-950">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => setMobileSidebarOpen(true)}
                                    className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Menu size={22} className="text-slate-300" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-100">Email Manager</h1>
                                    <p className="text-slate-400 text-sm">Manage portfolio inquiries and communications</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setComposing(true)}
                                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <Plus size={20} />
                                <span className="hidden sm:inline">Compose</span>
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:w-auto pl-10 pr-4 py-2 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 placeholder-slate-500 transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 sm:p-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                    showFilters 
                                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Filter size={20} />
                            </button>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.unread}
                                            onChange={(e) => setFilters({...filters, unread: e.target.checked})}
                                            className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800"
                                        />
                                        <span className="text-sm text-slate-300">Unread</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.starred}
                                            onChange={(e) => setFilters({...filters, starred: e.target.checked})}
                                            className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800"
                                        />
                                        <span className="text-sm text-slate-300">Starred</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.hasAttachment}
                                            onChange={(e) => setFilters({...filters, hasAttachment: e.target.checked})}
                                            className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800"
                                        />
                                        <span className="text-sm text-slate-300">Has Attachment</span>
                                    </label>

                                    <select
                                        value={filters.priority}
                                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                        className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
                                    >
                                        <option value="all">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>

                                    <select
                                        value={filters.label}
                                        onChange={(e) => setFilters({...filters, label: e.target.value})}
                                        className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200"
                                    >
                                        <option value="all">All Labels</option>
                                        {labels.map(label => (
                                            <option key={label.id} value={label.id}>{label.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setFilters({ unread: false, starred: false, hasAttachment: false, priority: 'all', label: 'all' })}
                                    className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                                >
                                    Clear all filters
                                </button>
                            </motion.div>
                        )}

                        {/* Bulk Actions Bar */}
                        {selectedEmails.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2"
                            >
                                <span className="text-sm font-medium text-cyan-300">
                                    {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} selected
                                </span>
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleBulkAction('read')}
                                        className="p-2 sm:px-3 sm:py-1.5 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-300"
                                        title="Mark as read"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('unread')}
                                        className="p-2 sm:px-3 sm:py-1.5 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-300"
                                        title="Mark as unread"
                                    >
                                        <EyeOff size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('star')}
                                        className="p-2 sm:px-3 sm:py-1.5 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-300"
                                        title="Star all"
                                    >
                                        <Star size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('archive')}
                                        className="p-2 sm:px-3 sm:py-1.5 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-300"
                                        title="Archive all"
                                    >
                                        <Archive size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('delete')}
                                        className="p-2 sm:px-3 sm:py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                        title="Delete all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedEmails([])}
                                        className="px-2 sm:px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* List + Detail area */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Email List */}
                        <div className={`${emailView === 'detail' ? 'hidden md:block' : 'w-full'} md:w-96 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/50 overflow-y-auto`}>
                            <div className="p-3 sm:p-4 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-slate-900/50 backdrop-blur-sm z-10">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                                        onChange={selectAllEmails}
                                        className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800"
                                    />
                                    <span className="text-sm text-slate-300">
                                        Select all
                                    </span>
                                </label>
                                <span className="text-sm text-slate-500">
                                    {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-800/50">
                                {filteredEmails.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-12 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                                            <MailOpen size={32} className="text-slate-600" />
                                        </div>
                                        <p className="text-slate-400 font-medium">No emails found</p>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {searchQuery ? 'Try a different search term' : activeTab === 'inbox' ? 'Your inbox is empty' : `No emails in ${activeTab}`}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence>
                                        {filteredEmails.map((email, index) => (
                                            <motion.div
                                                key={email.id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ 
                                                    delay: index * 0.03,
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 25
                                                }}
                                                className={`group relative py-4 sm:py-3 px-3 sm:px-4 cursor-pointer transition-all duration-200 ${
                                                    selectedEmail?.id === email.id 
                                                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border-l-4 border-cyan-500' 
                                                        : 'border-l-4 border-transparent hover:bg-slate-800/40'
                                                } ${
                                                    email.unread 
                                                        ? 'bg-slate-800/30' 
                                                        : ''
                                                }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                
                                                <div className="flex items-start gap-3 relative z-10">
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
                                                            className="mt-1 w-4 h-4 rounded border-2 border-slate-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200 bg-slate-800"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </motion.div>
                                                    
                                                    <div 
                                                        className="flex-1 min-w-0"
                                                        onClick={() => {
                                                            setSelectedEmail(email);
                                                            setEmailView('detail');
                                                            setComposing(false);
                                                            if (email.unread) {
                                                                handleToggleRead(email.id);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {email.unread && (
                                                                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 shadow-sm shadow-cyan-400/50" />
                                                                )}
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex-shrink-0">
                                                                    {email.from?.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <h4 className={`text-sm truncate transition-all duration-200 ${
                                                                    email.unread 
                                                                        ? 'font-bold text-slate-100' 
                                                                        : 'font-medium text-slate-300'
                                                                }`}>
                                                                    {email.from?.name || 'Unknown'}
                                                                </h4>
                                                                {email.priority === 'high' && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300"
                                                                    >
                                                                        <Flag size={10} className="mr-1" />
                                                                        High
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                                    {formatTime(email.timestamp)}
                                                                </span>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.2 }}
                                                                        whileTap={{ scale: 0.8 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleStar(email.id);
                                                                        }}
                                                                        className="p-1 hover:bg-yellow-500/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    >
                                                                        <Star size={14} className={email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'} />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className={`text-sm truncate mb-0.5 sm:mb-1 transition-all duration-200 ${
                                                            email.unread 
                                                                ? 'font-semibold text-slate-200' 
                                                                : 'text-slate-400'
                                                        }`}>
                                                            {email.subject}
                                                        </p>
                                                        
                                                        <p className="text-xs text-slate-500 truncate mb-1 sm:mb-2">
                                                            {email.preview}
                                                        </p>
                                                        
                                                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                                            {email.starred && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                                                                    <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1" />
                                                                    Starred
                                                                </span>
                                                            )}
                                                            {email.hasAttachment && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300">
                                                                    <Paperclip size={10} className="mr-1" />
                                                                    Attachment
                                                                </span>
                                                            )}
                                                            {email.priority === 'high' && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                                                                    <Flag size={10} className="mr-1" />
                                                                    High Priority
                                                                </span>
                                                            )}
                                                            {email.labels?.map(labelId => {
                                                                const label = labels.find(l => l.id === labelId);
                                                                return label ? (
                                                                    <motion.span
                                                                        key={labelId}
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        whileHover={{ scale: 1.1 }}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                                        style={{ 
                                                                            backgroundColor: `${label.color}20`,
                                                                            color: label.color,
                                                                            border: `1px solid ${label.color}40`
                                                                        }}
                                                                        title={label.name}
                                                                    >
                                                                        {label.name}
                                                                    </motion.span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        {/* Email Content / Compose / Empty State */}
                        <div className={`${emailView === 'list' || (!selectedEmail && emailView === 'list') ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden bg-slate-950`}>
                            {/* Email View */}
                            {selectedEmail && !composing ? (
                                <motion.div
                                    key={selectedEmail.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="flex flex-col h-full overflow-hidden"
                                >
                                    <div className="p-4 sm:p-6 border-b border-slate-700/50 bg-slate-900/30">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <button
                                                    onClick={() => setEmailView('list')}
                                                    className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Back to list"
                                                >
                                                    <ChevronLeft size={20} className="text-slate-400" />
                                                </button>
                                                <h2 className="text-lg sm:text-xl font-semibold text-slate-100 truncate">
                                                    {selectedEmail.subject}
                                                </h2>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleToggleRead(selectedEmail.id)}
                                                    className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title={selectedEmail.unread ? 'Mark as read' : 'Mark as unread'}
                                                >
                                                    {selectedEmail.unread ? (
                                                        <Eye size={18} className="text-slate-400" />
                                                    ) : (
                                                        <EyeOff size={18} className="text-slate-400" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleToggleStar(selectedEmail.id)}
                                                    className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                >
                                                    <Star 
                                                        size={18} 
                                                        className={selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'} 
                                                    />
                                                </button>

                                                <button
                                                    onClick={() => setShowLabels(!showLabels)}
                                                    className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Add label"
                                                >
                                                    <Tag size={18} className="text-slate-400" />
                                                </button>

                                                <button
                                                    onClick={() => handleArchiveEmail(selectedEmail.id)}
                                                    className="hidden sm:block p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Archive"
                                                >
                                                    <Archive size={18} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmail(selectedEmail.id)}
                                                    className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} className="text-red-400" />
                                                </button>
                                                <button
                                                    onClick={() => window.print()}
                                                    className="hidden sm:block p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Print"
                                                >
                                                    <Printer size={18} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                                    className="hidden sm:block p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                >
                                                    {isFullscreen ? (
                                                        <Minimize2 size={18} className="text-slate-400" />
                                                    ) : (
                                                        <Maximize2 size={18} className="text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Label dropdown */}
                                        {showLabels && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute right-6 mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl p-2 z-20"
                                            >
                                                {labels.map(label => (
                                                    <button
                                                        key={label.id}
                                                        onClick={() => {
                                                            handleToggleLabel(selectedEmail.id, label.id);
                                                            setShowLabels(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    >
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span className="text-sm text-slate-300">
                                                            {label.name}
                                                        </span>
                                                        {selectedEmail.labels?.includes(label.id) && (
                                                            <Check size={16} className="ml-auto text-cyan-400" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}

                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0 shadow-lg shadow-cyan-500/20">
                                                {selectedEmail.from?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-100 truncate">
                                                            {selectedEmail.from?.name || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-slate-400 truncate">
                                                            {selectedEmail.from?.email || 'No email'}
                                                        </p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-sm text-slate-400">
                                                            {selectedEmail.timestamp ? new Date(selectedEmail.timestamp).toLocaleString() : 'Unknown date'}
                                                        </p>
                                                        {selectedEmail.priority === 'high' && (
                                                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-400 font-medium">
                                                                <Flag size={12} />
                                                                High Priority
                                                            </span>
                                                        )}
                                                        {selectedEmail.priority === 'low' && (
                                                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
                                                                Low Priority
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
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${label.color}20`,
                                                                color: label.color,
                                                                border: `1px solid ${label.color}40`
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
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                        <div className="max-w-none">
                                            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-base">
                                                {selectedEmail.body || 'No content'}
                                            </p>
                                        </div>

                                        {/* Attachments */}
                                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-slate-700/50">
                                                <p className="text-sm font-semibold text-slate-300 mb-3">
                                                    Attachments ({selectedEmail.attachments.length})
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {selectedEmail.attachments.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors group"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                                                                <Paperclip size={18} className="text-slate-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {formatFileSize(file.size)}
                                                                </p>
                                                            </div>
                                                            <a
                                                                href={file.url || '#'}
                                                                download
                                                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            >
                                                                <Download size={16} className="text-slate-400" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Email Actions */}
                                    <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-900/30 flex items-center gap-2 sm:gap-3">
                                        <button
                                            onClick={() => handleReply(selectedEmail)}
                                            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            <Reply size={18} />
                                            Reply
                                        </button>
                                        <button
                                            onClick={() => handleForward(selectedEmail)}
                                            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            <Forward size={18} />
                                            Forward
                                        </button>
                                    </div>
                                </motion.div>
                            ) : composing ? (
                                /* Compose View - Glass Modal */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
                                >
                                    <div className="w-full h-full sm:w-auto sm:min-w-[600px] sm:max-w-2xl sm:max-h-[90vh] bg-slate-900/95 backdrop-blur-xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-700/50 flex flex-col overflow-hidden">
                                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 sm:p-4 flex items-center justify-between">
                                            <h3 className="text-base sm:text-lg font-semibold">
                                                {replying ? 'Reply' : forwarding ? 'Forward' : 'New Message'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowTemplates(true)}
                                                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                                    title="Use template"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={resetCompose}
                                                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                                            {/* To Field */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <label className="text-sm font-medium text-slate-300 w-full sm:w-16">
                                                    To:
                                                </label>
                                                <div className="flex-1 flex flex-wrap gap-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all">
                                                    {composeData.to && composeData.to.includes('@') && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm">
                                                            {composeData.to}
                                                            <button onClick={() => setComposeData({...composeData, to: ''})} className="hover:text-cyan-200">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    )}
                                                    <input
                                                        type="email"
                                                        value={composeData.to}
                                                        onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                                                        placeholder="recipient@example.com"
                                                        className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-slate-200 placeholder-slate-500"
                                                    />
                                                </div>
                                                <div className="flex gap-2 sm:gap-0">
                                                    <button
                                                        onClick={() => setShowCc(!showCc)}
                                                        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2"
                                                    >
                                                        Cc
                                                    </button>
                                                    <button
                                                        onClick={() => setShowBcc(!showBcc)}
                                                        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2"
                                                    >
                                                        Bcc
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Cc Field */}
                                            {showCc && (
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                    <label className="text-sm font-medium text-slate-300 w-full sm:w-16">
                                                        Cc:
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={composeData.cc}
                                                        onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                                                        placeholder="cc@example.com"
                                                        className="w-full flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 placeholder-slate-500 transition-all"
                                                    />
                                                </div>
                                            )}

                                            {/* Bcc Field */}
                                            {showBcc && (
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                    <label className="text-sm font-medium text-slate-300 w-full sm:w-16">
                                                        Bcc:
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={composeData.bcc}
                                                        onChange={(e) => setComposeData({...composeData, bcc: e.target.value})}
                                                        placeholder="bcc@example.com"
                                                        className="w-full flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 placeholder-slate-500 transition-all"
                                                    />
                                                </div>
                                            )}

                                            {/* Subject Field */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <label className="text-sm font-medium text-slate-300 w-full sm:w-16">
                                                    Subject:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={composeData.subject}
                                                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                                                    placeholder="Email subject"
                                                    className="w-full flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 placeholder-slate-500 transition-all"
                                                />
                                            </div>

                                            {/* Priority */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <label className="text-sm font-medium text-slate-300 w-full sm:w-16">
                                                    Priority:
                                                </label>
                                                <select
                                                    value={composeData.priority}
                                                    onChange={(e) => setComposeData({...composeData, priority: e.target.value})}
                                                    className="w-full sm:w-auto px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 transition-all"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                </select>
                                            </div>

                                            {/* Body */}
                                            <div className="border-t border-slate-700/50 pt-3">
                                                <textarea
                                                    ref={editorRef}
                                                    value={composeData.body}
                                                    onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                                                    onKeyDown={(e) => {
                                                        if (e.ctrlKey && e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSendEmail();
                                                        }
                                                        if (e.ctrlKey && e.key === 's') {
                                                            e.preventDefault();
                                                            saveDraft();
                                                        }
                                                        if (e.key === 'Escape') {
                                                            resetCompose();
                                                        }
                                                    }}
                                                    placeholder="Write your message... (Ctrl+Enter to send, Ctrl+S to save draft, Escape to cancel)"
                                                    rows={10}
                                                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 placeholder-slate-500 resize-none transition-all min-h-[200px]"
                                                />
                                            </div>

                                            {/* Attachments */}
                                            {composeData.attachments.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-slate-300">
                                                        Attachments ({composeData.attachments.length})
                                                    </p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {composeData.attachments.map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                                                                        <Paperclip size={14} className="text-slate-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-slate-200 truncate">
                                                                            {file.name}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500">
                                                                            {formatFileSize(file.size)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeAttachment(index)}
                                                                    className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                >
                                                                    <X size={16} className="text-slate-400" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compose Actions */}
                                        <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                                <button
                                                    onClick={handleSendEmail}
                                                    className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Attach file"
                                                >
                                                    <Paperclip size={18} className="text-slate-400" />
                                                </button>

                                                <button
                                                    onClick={() => setShowQuickResponses(!showQuickResponses)}
                                                    className="hidden sm:flex p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Quick responses"
                                                >
                                                    <Zap size={18} className="text-slate-400" />
                                                </button>

                                                <button
                                                    onClick={() => setShowScheduler(!showScheduler)}
                                                    className="hidden sm:flex p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    title="Schedule send"
                                                >
                                                    <Clock3 size={18} className="text-slate-400" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={saveDraft}
                                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <Save size={18} />
                                                Save Draft
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Empty State */
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center h-full"
                                >
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                                            <Mail size={40} className="text-slate-600" />
                                        </div>
                                        <p className="text-lg text-slate-400 font-medium">Select an email to read</p>
                                        <p className="text-sm text-slate-500 mt-2">or</p>
                                        <button
                                            onClick={() => setComposing(true)}
                                            className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            Compose new email
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Responses Modal */}
            <AnimatePresence>
                {showQuickResponses && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQuickResponses(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-full sm:max-w-lg mx-4 sm:mx-auto border border-slate-700/50"
                        >
                            <div className="p-4 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                                    Quick Responses
                                </h3>
                                <button
                                    onClick={() => setShowQuickResponses(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {quickResponses.map(response => (
                                    <button
                                        key={response.id}
                                        onClick={() => applyQuickResponse(response)}
                                        className="w-full p-4 text-left bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <h4 className="font-semibold text-slate-100 mb-1">
                                            {response.name}
                                        </h4>
                                        <p className="text-sm text-slate-400">
                                            {response.body}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scheduler Modal */}
            <AnimatePresence>
                {showScheduler && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowScheduler(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-full sm:max-w-lg mx-4 sm:mx-auto border border-slate-700/50"
                        >
                            <div className="p-4 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                                    Schedule Email
                                </h3>
                                <button
                                    onClick={() => setShowScheduler(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Send at:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={composeData.scheduledFor ? new Date(composeData.scheduledFor).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setComposeData({
                                            ...composeData, 
                                            scheduledFor: new Date(e.target.value).getTime()
                                        })}
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-200 transition-all"
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowScheduler(false);
                                            handleSendEmail();
                                        }}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        Schedule
                                    </button>
                                    <button
                                        onClick={() => {
                                            setComposeData({...composeData, scheduledFor: null});
                                            setShowScheduler(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-full sm:max-w-2xl mx-4 sm:mx-auto max-h-[80vh] overflow-y-auto border border-slate-700/50"
                        >
                            <div className="p-4 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                                    Email Templates
                                </h3>
                                <button
                                    onClick={() => setShowTemplates(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => applyTemplate(template)}
                                        className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <h4 className="font-semibold text-slate-100 mb-1">
                                            {template.name}
                                        </h4>
                                        <p className="text-sm text-slate-400 mb-2">
                                            {template.description}
                                        </p>
                                        <p className="text-xs text-slate-500">
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
