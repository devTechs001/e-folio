import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Inbox, Star, Send, Edit3, Archive, Trash2, AlertTriangle,
    Search, Filter, Plus, Paperclip, X, Clock3, Zap, Save, Reply, 
    Forward, Printer, Minimize2, Maximize2, Download, Flag
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const EmailManagerEnhanced = () => {
    const [emails, setEmails] = useState([]);
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
    const stats = {
        unread: 5,
        sent: 12,
        drafts: 3
    };

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
        }
    ];

    // Seed some mock emails for local UI testing when none exist
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
                    labels: []
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
                    attachments: [],
                    priority: 'high',
                    labels: ['work']
                }
            ]);
        }
    }, []);

    // Mock function - replace with actual implementation
    const isOwner = () => true;

    const handleSendEmail = () => {
        // Simple local send - add to emails list and mark as selected
        const newEmail = {
            id: `e_${Date.now()}`,
            subject: composeData.subject || '(no subject)',
            from: { name: 'You', email: 'me@local' },
            preview: composeData.body?.substring(0, 100) || '',
            body: composeData.body,
            timestamp: Date.now(),
            unread: false,
            starred: false,
            attachments: composeData.attachments || [],
            priority: composeData.priority || 'normal',
            labels: []
        };

        setEmails(prev => [newEmail, ...prev]);
        setSelectedEmail(newEmail);
        resetCompose();
        // feedback
        console.log('Email sent (local):', newEmail);
    };

    const saveDraft = () => {
        // Save draft locally by creating/updating a draft entry
        const draft = {
            id: `d_${Date.now()}`,
            subject: composeData.subject || '(draft)',
            body: composeData.body,
            timestamp: Date.now(),
            attachments: composeData.attachments || []
        };

        setDrafts(prev => [draft, ...prev]);
        console.log('Draft saved (local):', draft);
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

    const tabs = [
        { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.unread },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'sent', label: 'Sent', icon: Send, count: stats.sent },
        { id: 'drafts', label: 'Drafts', icon: Edit3, count: stats.drafts },
        { id: 'archived', label: 'Archived', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
        { id: 'spam', label: 'Spam', icon: AlertTriangle }
    ];

    // Mock functions - replace with actual implementations
    const handleToggleStar = (emailId) => console.log('Toggle star:', emailId);
    const handleArchiveEmail = (emailId) => console.log('Archive:', emailId);
    const handleDeleteEmail = (emailId) => console.log('Delete:', emailId);

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
                        <button className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="p-4 space-y-1">
                            {tabs.map(tab => (
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
                                    {tab.count && (
                                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                            {/* Email list */}
                            <div className="mt-4 overflow-y-auto h-[calc(100vh-260px)] p-2 space-y-2">
                                {emails.length === 0 ? (
                                    <div className="text-sm text-gray-500">No emails</div>
                                ) : (
                                    emails.map(email => (
                                        <button
                                            key={email.id}
                                            onClick={() => { setSelectedEmail(email); setComposing(false); }}
                                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${selectedEmail?.id === email.id ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white dark:hover:bg-gray-800'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {email.from?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-sm truncate">{email.subject}</h4>
                                                    <span className="text-xs text-gray-400">{formatTime(email.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-1">{email.preview}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 flex flex-col">
                        {composing ? (
                            /* Compose View */
                            <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-lg">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {replying ? 'Reply' : forwarding ? 'Forward' : 'New Message'}
                                    </h3>
                                    <button
                                        onClick={resetCompose}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                                    </button>
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