import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Trash2, Shield, Edit, Check, X, Lock, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const Collaborators = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('collaborator');
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState([]);

    useEffect(() => {
        loadCollaborators();
    }, []);

    const loadCollaborators = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCollaborators();
            setCollaborators(response.collaborators || getDemoCollaborators());
        } catch (err) {
            console.error('Error loading collaborators:', err);
            setCollaborators(getDemoCollaborators());
        } finally {
            setLoading(false);
        }
    };

    const getDemoCollaborators = () => [
        {
            id: 1,
            name: 'John Developer',
            email: 'john@example.com',
            role: 'collaborator',
            avatar: 'JD',
            joinedDate: '2024-01-15',
            lastActive: '2 hours ago',
            permissions: ['edit-projects', 'view-analytics']
        },
        {
            id: 2,
            name: 'Sarah Designer',
            email: 'sarah@example.com',
            role: 'viewer',
            avatar: 'SD',
            joinedDate: '2024-01-20',
            lastActive: '1 day ago',
            permissions: ['view-projects']
        }
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
                        <Lock size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px',
                            fontFamily: theme.fontHeading
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
                            Collaborator management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const handleInvite = async () => {
        if (!inviteEmail) {
            error('Please enter an email address');
            return;
        }

        try {
            const response = await apiService.submitCollaborationRequest({
                email: inviteEmail,
                role: inviteRole
            });
            
            if (response.success) {
                success('Invitation sent successfully!');
                setShowInviteForm(false);
                setInviteEmail('');
                loadCollaborators();
            } else {
                error(response.message || 'Failed to send invitation');
            }
        } catch (err) {
            console.error('Error sending invitation:', err);
            error('Failed to send invitation. Please try again.');
        }
    };

    const handleInviteDemo = () => {
        if (!inviteEmail) {
            error('Please enter an email address');
            return;
        }

        success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setShowInviteForm(false);
    };

    const handleRemoveCollaborator = (id, name) => {
        setCollaborators(prev => prev.filter(c => c.id !== id));
        success(`Removed ${name} from collaborators`);
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'owner': return theme.primary;
            case 'collaborator': return '#3b82f6';
            case 'viewer': return '#10b981';
            default: return theme.textSecondary;
        }
    };

    return (
        <DashboardLayout
            title="Collaborators"
            subtitle="Manage team members and their permissions"
            actions={
                <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    style={{
                        padding: '12px 24px',
                        background: theme.gradient,
                        color: theme.background,
                        borderRadius: '10px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 4px 15px ${theme.primary}40`
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px ${theme.primary}60`;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 15px ${theme.primary}40`;
                    }}
                >
                    <UserPlus size={18} />
                    <span>Invite Collaborator</span>
                </button>
            }
        >
            <div style={{ padding: '24px' }}>
                {/* Invite Form */}
                {showInviteForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: `${theme.surface}90`,
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px',
                            border: `1px solid ${theme.border}`,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontFamily: theme.fontHeading
                        }}>Invite New Collaborator</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: theme.textSecondary,
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="collaborator@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: `${theme.background}80`,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '10px',
                                        color: theme.text,
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: theme.textSecondary,
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: `${theme.background}80`,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '10px',
                                        color: theme.text,
                                        fontSize: '15px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="collaborator">Collaborator</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleInvite}
                                style={{
                                    padding: '12px 24px',
                                    background: theme.gradient,
                                    color: theme.background,
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Check size={18} />
                                Send Invitation
                            </button>
                            <button
                                onClick={() => setShowInviteForm(false)}
                                style={{
                                    padding: '12px 24px',
                                    background: `${theme.surface}80`,
                                    color: theme.text,
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    border: `1px solid ${theme.border}`,
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '20px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Total Collaborators</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: theme.primary }}>{collaborators.length}</p>
                            </div>
                            <Users size={40} style={{ color: `${theme.primary}80` }} />
                        </div>
                    </div>
                    <div style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '20px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Active Members</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{collaborators.length}</p>
                            </div>
                            <Shield size={40} style={{ color: '#10b98180' }} />
                        </div>
                    </div>
                </div>

                {/* Collaborators List */}
                <div style={{
                    background: `${theme.surface}60`,
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)'
                }}>
                    {collaborators.map((collaborator, index) => (
                        <motion.div
                            key={collaborator.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{
                                padding: '24px',
                                borderBottom: index < collaborators.length - 1 ? `1px solid ${theme.border}` : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: `${theme.background}20`,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}08`}
                            onMouseOut={(e) => e.currentTarget.style.background = `${theme.background}20`}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: theme.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: theme.background,
                                    fontWeight: '700',
                                    fontSize: '20px',
                                    boxShadow: `0 4px 12px ${theme.primary}40`
                                }}>{collaborator.avatar}</div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{
                                        color: theme.text,
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        margin: '0 0 4px 0'
                                    }}>{collaborator.name}</h4>
                                    <p style={{
                                        color: theme.textSecondary,
                                        fontSize: '14px',
                                        margin: '0 0 8px 0'
                                    }}>{collaborator.email}</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: `${getRoleColor(collaborator.role)}20`,
                                            color: getRoleColor(collaborator.role),
                                            textTransform: 'capitalize'
                                        }}>{collaborator.role}</span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: theme.textSecondary,
                                            background: `${theme.surface}80`
                                        }}>Joined: {collaborator.joinedDate}</span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: theme.textSecondary,
                                            background: `${theme.surface}80`
                                        }}>Last active: {collaborator.lastActive}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{
                                    padding: '10px',
                                    background: `${theme.primary}15`,
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: theme.primary,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                                onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                                >
                                    <Mail size={18} />
                                </button>
                                <button style={{
                                    padding: '10px',
                                    background: `${theme.primary}15`,
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: theme.primary,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                                onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.name)}
                                    style={{
                                        padding: '10px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Collaborators;
