import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Inbox, Send, Star, Archive, Trash2, Search, 
    Plus, Reply, Forward, MoreVertical, Clock, Paperclip,
    Eye, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const EmailManagerEnhanced = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: ''
    });

    useEffect(() => {
        if (isOwner()) {
            fetchEmails();
            const interval = setInterval(fetchEmails, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [activeTab, isOwner]);

    const fetchEmails = async () => {
        try {
            // TODO: Replace with actual API call
            // const response = await apiService.request(`/emails/${activeTab}`);
            
            // Demo data for now
            const demoEmails = [
                {
                    id: 1,
                    from: { name: 'John Developer', email: 'john@example.com' },
                    subject: 'Collaboration Opportunity',
                    preview: 'I\'m interested in collaborating on your latest project. Would love to discuss...',
                    body: 'Hi there,\n\nI came across your portfolio and was really impressed with your work. I\'m working on a similar project and think we could create something amazing together.\n\nWould you be available for a quick call this week?\n\nBest regards,\nJohn',
                    timestamp: new Date(Date.now() - 3600000),
                    starred: true,
                    unread: true,
                    hasAttachment: false,
                    labels: ['work', 'collaboration']
                },
                {
                    id: 2,
                    from: { name: 'Sarah Designer', email: 'sarah@example.com' },
                    subject: 'Portfolio Feedback',
                    preview: 'Your portfolio design is stunning! I especially love the color scheme and animations...',
                    body: 'Hello,\n\nI just wanted to reach out and say your portfolio is absolutely beautiful. The attention to detail is remarkable.\n\nI\'d love to feature it in our design showcase if you\'re interested.\n\nCheers,\nSarah',
                    timestamp: new Date(Date.now() - 86400000),
                    starred: false,
                    unread: false,
                    hasAttachment: false,
                    labels: ['feedback']
                },
                {
                    id: 3,
                    from: { name: 'Tech Recruiter', email: 'recruiter@company.com' },
                    subject: 'Job Opportunity - Senior Developer',
                    preview: 'We have an exciting opportunity that matches your skillset...',
                    body: 'Hi,\n\nWe\'re reaching out because your profile caught our attention. We have a senior developer position that I think would be a great fit.\n\nAre you open to new opportunities?\n\nBest,\nRecruiter',
                    timestamp: new Date(Date.now() - 172800000),
                    starred: true,
                    unread: false,
                    hasAttachment: true,
                    labels: ['job', 'opportunity']
                }
            ];
            
            setEmails(demoEmails);
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            // TODO: Implement actual send functionality
            console.log('Sending email:', composeData);
            setComposing(false);
            setComposeData({ to: '', subject: '', body: '' });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    const handleMarkAsRead = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId ? { ...email, unread: false } : email
        ));
    };

    const handleToggleStar = (emailId) => {
        setEmails(prev => prev.map(email => 
            email.id === emailId ? { ...email, starred: !email.starred } : email
        ));
    };

    const handleDeleteEmail = (emailId) => {
        setEmails(prev => prev.filter(email => email.id !== emailId));
        setSelectedEmail(null);
    };

    const getTabIcon = (tab) => {
        const icons = {
            inbox: Inbox,
            starred: Star,
            sent: Send,
            archived: Archive,
            trash: Trash2
        };
        return icons[tab] || Mail;
    };

    const getTabCount = (tab) => {
        if (tab === 'inbox') return emails.filter(e => e.unread).length;
        if (tab === 'starred') return emails.filter(e => e.starred).length;
        return 0;
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        return `${days}d ago`;
    };

    const filteredEmails = emails.filter(email => 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { id: 'inbox', label: 'Inbox' },
        { id: 'starred', label: 'Starred' },
        { id: 'sent', label: 'Sent' },
        { id: 'archived', label: 'Archived' },
        { id: 'trash', label: 'Trash' }
    ];

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '40px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        background: `${theme.surface}90`,
                        borderRadius: '16px',
                        border: `1px solid rgba(239, 68, 68, 0.3)`,
                        maxWidth: '500px'
                    }}>
                        <Mail size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px',
                            fontFamily: theme.fontHeading
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: '250px 350px 1fr',
                height: 'calc(100vh - 200px)',
                gap: '0',
                background: theme.background
            }}>
                {/* Sidebar */}
                <div style={{
                    background: `${theme.surface}40`,
                    borderRight: `1px solid ${theme.border}`,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => setComposing(true)}
                        style={{
                            padding: '14px 20px',
                            background: theme.gradient,
                            color: theme.background,
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        <Plus size={20} />
                        Compose
                    </button>

                    {tabs.map(tab => {
                        const Icon = getTabIcon(tab.id);
                        const count = getTabCount(tab.id);
                        const isActive = activeTab === tab.id;

                        return (
                            <motion.div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                whileHover={{ x: 4 }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: isActive ? `${theme.primary}20` : 'transparent',
                                    color: isActive ? theme.primary : theme.text,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontWeight: isActive ? '600' : '500',
                                    fontSize: '15px',
                                    border: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Icon size={18} />
                                    <span style={{ textTransform: 'capitalize' }}>{tab.label}</span>
                                </div>
                                {count > 0 && (
                                    <span style={{
                                        background: theme.primary,
                                        color: theme.background,
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Email List */}
                <div style={{
                    borderRight: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Search */}
                    <div style={{
                        padding: '20px',
                        borderBottom: `1px solid ${theme.border}`
                    }}>
                        <div style={{
                            position: 'relative'
                        }}>
                            <Search size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: theme.textSecondary
                            }} />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 42px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '10px',
                                    color: theme.text,
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Email Items */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        background: theme.background
                    }}>
                        {loading ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px',
                                color: theme.textSecondary
                            }}>
                                <RefreshCw size={24} className="spin" />
                            </div>
                        ) : filteredEmails.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: theme.textSecondary
                            }}>
                                <Mail size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
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
                                    style={{
                                        padding: '16px 20px',
                                        borderBottom: `1px solid ${theme.border}`,
                                        background: selectedEmail?.id === email.id ? `${theme.primary}10` : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        borderLeft: selectedEmail?.id === email.id ? `3px solid ${theme.primary}` : '3px solid transparent'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{
                                            color: theme.text,
                                            fontWeight: email.unread ? '700' : '500',
                                            fontSize: '14px'
                                        }}>
                                            {email.from.name}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {email.hasAttachment && <Paperclip size={14} color={theme.textSecondary} />}
                                            {email.starred && <Star size={14} fill={theme.primary} color={theme.primary} />}
                                            <span style={{
                                                color: theme.textSecondary,
                                                fontSize: '12px'
                                            }}>
                                                {formatTime(email.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 style={{
                                        color: theme.text,
                                        margin: '0 0 6px 0',
                                        fontSize: '13px',
                                        fontWeight: email.unread ? '600' : '500'
                                    }}>
                                        {email.subject}
                                    </h4>
                                    <p style={{
                                        color: theme.textSecondary,
                                        margin: 0,
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {email.preview}
                                    </p>
                                    {email.unread && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            background: theme.primary,
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            right: '20px',
                                            top: '20px'
                                        }} />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Email Content */}
                <div style={{
                    background: theme.background,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {composing ? (
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <h3 style={{ color: theme.text, margin: 0 }}>New Message</h3>
                                <button
                                    onClick={() => setComposing(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: theme.textSecondary,
                                        cursor: 'pointer',
                                        fontSize: '20px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <input
                                type="email"
                                placeholder="To"
                                value={composeData.to}
                                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                style={{
                                    padding: '12px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '8px',
                                    color: theme.text,
                                    fontSize: '14px'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Subject"
                                value={composeData.subject}
                                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                style={{
                                    padding: '12px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '8px',
                                    color: theme.text,
                                    fontSize: '14px'
                                }}
                            />
                            <textarea
                                placeholder="Message"
                                value={composeData.body}
                                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                rows={15}
                                style={{
                                    padding: '12px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '8px',
                                    color: theme.text,
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <button
                                onClick={handleSendEmail}
                                style={{
                                    padding: '12px 24px',
                                    background: theme.gradient,
                                    color: theme.background,
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    alignSelf: 'flex-start'
                                }}
                            >
                                <Send size={16} />
                                Send Email
                            </button>
                        </div>
                    ) : selectedEmail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Email Header */}
                            <div style={{
                                padding: '24px',
                                borderBottom: `1px solid ${theme.border}`,
                                background: `${theme.surface}40`
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '16px'
                                }}>
                                    <h2 style={{
                                        color: theme.text,
                                        margin: 0,
                                        fontSize: '20px',
                                        fontWeight: '600'
                                    }}>
                                        {selectedEmail.subject}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleToggleStar(selectedEmail.id)}
                                            style={{
                                                background: 'transparent',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                color: theme.text
                                            }}
                                        >
                                            <Star size={18} fill={selectedEmail.starred ? theme.primary : 'none'} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmail(selectedEmail.id)}
                                            style={{
                                                background: 'transparent',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '8px',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                color: '#ef4444'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: theme.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: theme.background,
                                        fontWeight: '600',
                                        fontSize: '16px'
                                    }}>
                                        {selectedEmail.from.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{
                                            color: theme.text,
                                            fontWeight: '600',
                                            fontSize: '15px'
                                        }}>
                                            {selectedEmail.from.name}
                                        </div>
                                        <div style={{
                                            color: theme.textSecondary,
                                            fontSize: '13px'
                                        }}>
                                            {selectedEmail.from.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div style={{
                                flex: 1,
                                padding: '24px',
                                overflowY: 'auto'
                            }}>
                                <p style={{
                                    color: theme.text,
                                    lineHeight: '1.8',
                                    fontSize: '15px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {selectedEmail.body}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{
                                padding: '20px 24px',
                                borderTop: `1px solid ${theme.border}`,
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <button style={{
                                    padding: '10px 20px',
                                    background: theme.gradient,
                                    color: theme.background,
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '600'
                                }}>
                                    <Reply size={16} />
                                    Reply
                                </button>
                                <button style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    color: theme.text,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '600'
                                }}>
                                    <Forward size={16} />
                                    Forward
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            color: theme.textSecondary
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <Mail size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p>Select an email to read</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default EmailManagerEnhanced;
