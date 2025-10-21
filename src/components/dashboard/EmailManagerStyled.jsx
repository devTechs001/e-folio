import React, { useState } from 'react';
import { Mail, Inbox, Star, Archive, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardLayout from './DashboardLayout';

const EmailManager = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('inbox');

    const emails = [
        { id: 1, from: 'John Doe', subject: 'Project Collaboration Request', preview: 'Hi, I would like to collaborate...', time: '10:30 AM', starred: true, unread: true },
        { id: 2, from: 'Sarah Smith', subject: 'Portfolio Feedback', preview: 'Your portfolio looks amazing...', time: 'Yesterday', starred: false, unread: false }
    ];

    if (!isOwner()) {
        return <DashboardLayout><div style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>Access Restricted</div></DashboardLayout>;
    }

    return (
        <DashboardLayout title="Email Manager" subtitle="Manage your portfolio inquiries">
            <div style={{ display: 'flex', height: 'calc(100vh - 200px)' }}>
                <div style={{ width: '250px', padding: '20px', borderRight: `1px solid ${theme.border}`, background: `${theme.surface}60` }}>
                    {['inbox', 'starred', 'sent', 'archived'].map(tab => (
                        <div key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '12px 16px', marginBottom: '8px', borderRadius: '10px',
                            background: activeTab === tab ? theme.gradient : 'transparent',
                            color: activeTab === tab ? theme.background : theme.text,
                            cursor: 'pointer', textTransform: 'capitalize', fontWeight: '500'
                        }}>{tab}</div>
                    ))}
                </div>
                <div style={{ flex: 1, padding: '24px' }}>
                    {emails.map(email => (
                        <div key={email.id} style={{
                            padding: '20px', marginBottom: '12px', background: `${theme.surface}80`,
                            borderRadius: '12px', border: `1px solid ${theme.border}`, cursor: 'pointer'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: theme.text, fontWeight: '600' }}>{email.from}</span>
                                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>{email.time}</span>
                            </div>
                            <h4 style={{ color: theme.text, margin: '0 0 8px 0' }}>{email.subject}</h4>
                            <p style={{ color: theme.textSecondary, margin: 0, fontSize: '14px' }}>{email.preview}</p>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmailManager;
