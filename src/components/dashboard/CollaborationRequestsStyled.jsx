import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Mail, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const CollaborationRequests = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { on, off } = useSocket();
    const { success, error } = useNotifications();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
        
        // Listen for real-time new collaboration requests
        const handleNewRequest = (request) => {
            setRequests(prev => [request, ...prev]);
        };
        
        on('new_collaboration_request', handleNewRequest);
        
        return () => {
            off('new_collaboration_request', handleNewRequest);
        };
    }, [on, off]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaborationRequests();
            setRequests(response.requests || []);
        } catch (err) {
            console.error('Error loading requests:', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        try {
            const response = await apiService.approveRequest(id);
            if (response.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
                success(`✅ Approved ${name}! Invite link: ${response.inviteLink}`);
            } else {
                error(response.message || 'Failed to approve request');
            }
        } catch (err) {
            console.error('Error approving request:', err);
            error('Failed to approve request. Please try again.');
        }
    };

    const handleReject = async (id, name) => {
        try {
            const response = await apiService.rejectRequest(id);
            if (response.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
                success(`Rejected collaboration request from ${name}`);
            } else {
                error(response.message || 'Failed to reject request');
            }
        } catch (err) {
            console.error('Error rejecting request:', err);
            error('Failed to reject request. Please try again.');
        }
    };

    if (!isOwner()) {
        return <DashboardLayout><div style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>Access Restricted</div></DashboardLayout>;
    }

    return (
        <DashboardLayout title="Collaboration Requests" subtitle="Review and manage collaboration requests">
            <div style={{ padding: '24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: theme.textSecondary }}>
                        <Clock size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} className="animate-spin" />
                        <p>Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
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
                                }}>{request.name ? request.name.charAt(0).toUpperCase() : '?'}</div>
                                <div>
                                    <h4 style={{ color: theme.text, margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>{request.name}</h4>
                                    <p style={{ color: theme.textSecondary, margin: '0 0 8px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={14} /> {request.email}
                                    </p>
                                    <p style={{ color: theme.text, margin: 0, fontSize: '14px' }}>{request.message}</p>
                                    <p style={{ color: theme.textSecondary, margin: '8px 0 0 0', fontSize: '12px' }}>
                                        Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                                    </p>
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
