import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Bell, Shield, Eye, Globe, Palette, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const Settings = () => {
    const { user } = useAuth();
    const { theme, themes, changeTheme, currentTheme } = useTheme();
    const { success } = useNotifications();

    const [settings, setSettings] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: 'Full-stack developer and creative problem solver',
        notifications: {
            email: true,
            push: true,
            collaboratorRequests: true,
            comments: false
        },
        privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showActivity: true
        },
        appearance: {
            theme: currentTheme,
            fontSize: 'medium',
            language: 'en'
        }
    });

    const handleSave = () => {
        // Save settings logic here
        success('Settings saved successfully!');
    };

    const handleThemeChange = (themeId) => {
        changeTheme(themeId);
        setSettings(prev => ({
            ...prev,
            appearance: { ...prev.appearance, theme: themeId }
        }));
    };

    return (
        <DashboardLayout
            title="Settings"
            subtitle="Manage your account preferences and configuration"
            actions={
                <button
                    onClick={handleSave}
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
                    <Save size={18} />
                    <span>Save Changes</span>
                </button>
            }
        >
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Profile Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <User size={24} style={{ color: theme.primary }} />
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: 0,
                            fontFamily: theme.fontHeading
                        }}>Profile Information</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: theme.textSecondary,
                                fontSize: '14px',
                                marginBottom: '8px',
                                fontWeight: '500'
                            }}>Full Name</label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
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
                            }}>Email Address</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
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
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: theme.textSecondary,
                            fontSize: '14px',
                            marginBottom: '8px',
                            fontWeight: '500'
                        }}>Bio</label>
                        <textarea
                            value={settings.bio}
                            onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                color: theme.text,
                                fontSize: '15px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: theme.fontBody
                            }}
                        />
                    </div>
                </motion.div>

                {/* Appearance Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <Palette size={24} style={{ color: theme.primary }} />
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: 0,
                            fontFamily: theme.fontHeading
                        }}>Appearance</h3>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: theme.textSecondary,
                            fontSize: '14px',
                            marginBottom: '12px',
                            fontWeight: '500'
                        }}>Theme</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '12px'
                        }}>
                            {themes.map((themeOption) => (
                                <motion.div
                                    key={themeOption.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleThemeChange(themeOption.id)}
                                    style={{
                                        padding: '16px',
                                        background: currentTheme === themeOption.id ? themeOption.gradient : `${theme.background}80`,
                                        borderRadius: '10px',
                                        border: `2px solid ${currentTheme === themeOption.id ? themeOption.primary : theme.border}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '60px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: themeOption.gradient,
                                        margin: '0 auto 12px',
                                        boxShadow: `0 4px 12px ${themeOption.primary}40`
                                    }}></div>
                                    <p style={{
                                        color: currentTheme === themeOption.id ? theme.background : theme.text,
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        margin: 0
                                    }}>{themeOption.name}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Notification Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <Bell size={24} style={{ color: theme.primary }} />
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: 0,
                            fontFamily: theme.fontHeading
                        }}>Notifications</h3>
                    </div>
                    {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            marginBottom: '12px',
                            background: `${theme.background}40`,
                            borderRadius: '10px',
                            border: `1px solid ${theme.border}`
                        }}>
                            <span style={{
                                color: theme.text,
                                fontSize: '15px',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                            }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        notifications: { ...prev.notifications, [key]: e.target.checked }
                                    }))}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: value ? theme.gradient : `${theme.textSecondary}40`,
                                    borderRadius: '26px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '',
                                        height: '20px',
                                        width: '20px',
                                        left: value ? '27px' : '3px',
                                        bottom: '3px',
                                        background: theme.background,
                                        borderRadius: '50%',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}></span>
                                </span>
                            </label>
                        </div>
                    ))}
                </motion.div>

                {/* Privacy Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: `${theme.surface}60`,
                        borderRadius: '12px',
                        padding: '24px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <Shield size={24} style={{ color: theme.primary }} />
                        <h3 style={{
                            color: theme.text,
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: 0,
                            fontFamily: theme.fontHeading
                        }}>Privacy & Security</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: theme.textSecondary,
                                fontSize: '14px',
                                marginBottom: '8px',
                                fontWeight: '500'
                            }}>Profile Visibility</label>
                            <select
                                value={settings.privacy.profileVisibility}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    privacy: { ...prev.privacy, profileVisibility: e.target.value }
                                }))}
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
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="collaborators">Collaborators Only</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
