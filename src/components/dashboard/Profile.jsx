import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Briefcase, Link as LinkIcon, Calendar, Edit, Camera, Save, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const Profile = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { success } = useNotifications();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || 'John Doe',
        email: user?.email || 'john@example.com',
        bio: 'Full-stack developer passionate about creating beautiful web experiences.',
        location: 'San Francisco, CA',
        role: 'Senior Developer',
        website: 'https://johndoe.dev',
        joinedDate: 'January 2024'
    });

    const stats = [
        { label: 'Projects', value: '24' },
        { label: 'Collaborators', value: '8' },
        { label: 'Total Views', value: '12.8K' },
        { label: 'Messages', value: '156' }
    ];

    const handleSave = () => {
        setIsEditing(false);
        success('Profile updated successfully!');
    };

    return (
        <DashboardLayout
            title="My Profile"
            subtitle="Manage your personal information"
            actions={
                !isEditing ? (
                    <button onClick={() => setIsEditing(true)} style={{
                        padding: '12px 24px', background: theme.gradient, color: theme.background,
                        borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'
                    }}>
                        <Edit size={18} /> Edit Profile
                    </button>
                ) : (
                    <button onClick={handleSave} style={{
                        padding: '12px 24px', background: theme.gradient, color: theme.background,
                        borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'
                    }}>
                        <Save size={18} /> Save Changes
                    </button>
                )
            }
        >
            <div style={{ padding: '24px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                    background: `${theme.surface}80`, borderRadius: '16px', padding: '32px',
                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)', marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '20px', background: theme.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme.background, fontSize: '48px', fontWeight: '700',
                            boxShadow: `0 8px 24px ${theme.primary}60`
                        }}>
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <>
                                    <input type="text" value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        style={{
                                            width: '100%', padding: '12px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px',
                                            color: theme.text, fontSize: '24px', fontWeight: '700', marginBottom: '12px'
                                        }}
                                    />
                                    <textarea value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%', padding: '12px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px',
                                            color: theme.text, fontSize: '15px', fontFamily: theme.fontBody
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <h2 style={{ color: theme.text, fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>{profile.name}</h2>
                                    <p style={{ color: theme.primary, fontSize: '16px', margin: '0 0 12px 0', fontWeight: '600' }}>{profile.role}</p>
                                    <p style={{ color: theme.textSecondary, fontSize: '15px', margin: 0 }}>{profile.bio}</p>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px', marginBottom: '24px'
                }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{
                            background: `${theme.surface}80`, borderRadius: '16px', padding: '24px',
                            border: `1px solid ${theme.border}`, textAlign: 'center'
                        }}>
                            <h3 style={{ color: theme.primary, fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0' }}>{stat.value}</h3>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div style={{ background: `${theme.surface}80`, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
                    <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Contact Information</h3>
                    {[
                        { icon: Mail, label: 'Email', value: profile.email, key: 'email' },
                        { icon: MapPin, label: 'Location', value: profile.location, key: 'location' },
                        { icon: LinkIcon, label: 'Website', value: profile.website, key: 'website' }
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '16px', marginBottom: '12px', background: `${theme.background}40`,
                            borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px', background: `${theme.primary}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <item.icon size={20} style={{ color: theme.primary }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: theme.textSecondary, fontSize: '12px', margin: '0 0 4px 0' }}>{item.label}</p>
                                {isEditing ? (
                                    <input type="text" value={item.value}
                                        onChange={(e) => setProfile({ ...profile, [item.key]: e.target.value })}
                                        style={{
                                            width: '100%', padding: '6px 8px', background: `${theme.background}60`,
                                            border: `1px solid ${theme.border}`, borderRadius: '6px',
                                            color: theme.text, fontSize: '14px'
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>{item.value}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
