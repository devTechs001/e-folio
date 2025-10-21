import React, { useState } from 'react';
import { UserPlus, Check, X, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const CollaborationRequests = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success } = useNotifications();
    const [requests, setRequests] = useState([
        { id: 1, name: 'Alex Johnson', email: 'alex@example.com', message: 'Would love to collaborate on projects', date: '2024-01-20', avatar: 'AJ' },
        { id: 2, name: 'Emma Wilson', email: 'emma@example.com', message: 'Interested in contributing to your work', date: '2024-01-19', avatar: 'EW' }
    ]);

    const handleApprove = (id, name) => {
        setRequests(prev => prev.filter(r => r.id !== id));
        success(`Approved collaboration request from ${name}`);
    };

    const handleReject = (id, name) => {
        setRequests(prev => prev.filter(r => r.id !== id));
        success(`Rejected collaboration request from ${name}`);
    };

    if (!isOwner()) {
        return <DashboardLayout><div style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>Access Restricted</div></DashboardLayout>;
    }

    return (
        <DashboardLayout title="Collaboration Requests" subtitle="Review and manage collaboration requests">
            <div style={{ padding: '24px' }}>
                {requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: theme.textSecondary }}>
                        <UserPlus size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
                        <p>No pending requests</p>
                    </div>
                ) : (
                    requests.map(request => (
                        <div key={request.id} style={{
                            padding: '24px', marginBottom: '16px', background: `${theme.surface}80`,
                            borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '12px',
                                    background: theme.gradient, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: theme.background, fontWeight: '700',
                                    fontSize: '18px', boxShadow: `0 4px 12px ${theme.primary}40`
                                }}>{request.avatar}</div>
                                <div>
                                    <h4 style={{ color: theme.text, margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>{request.name}</h4>
                                    <p style={{ color: theme.textSecondary, margin: '0 0 8px 0', fontSize: '14px' }}>{request.email}</p>
                                    <p style={{ color: theme.text, margin: 0, fontSize: '14px' }}>{request.message}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleApprove(request.id, request.name)} style={{
                                    padding: '12px 24px', background: theme.gradient, border: 'none',
                                    borderRadius: '10px', color: theme.background, fontWeight: '600',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <Check size={18} /> Approve
                                </button>
                                <button onClick={() => handleReject(request.id, request.name)} style={{
                                    padding: '12px 24px', background: 'rgba(239, 68, 68, 0.15)', border: 'none',
                                    borderRadius: '10px', color: '#ef4444', fontWeight: '600',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <X size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
};

export default CollaborationRequests;
