import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save,
    User,
    Bell,
    Shield,
    Eye,
    Globe,
    Palette,
    Lock,
    Key,
    Trash2,
    Download,
    Upload,
    Link as LinkIcon,
    Mail,
    Smartphone,
    Check,
    X,
    AlertTriangle,
    RefreshCw,
    Copy,
    ExternalLink,
    Code,
    Webhook,
    Database,
    Settings as SettingsIcon,
    CreditCard,
    Users,
    FileText,
    Zap,
    Activity,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const Settings = () => {
    const { user, updateUser, logout } = useAuth();
    const { theme, themes, changeTheme, currentTheme } = useTheme();
    const { success, error: showError, warning } = useNotifications();

    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(user?.avatar || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [sessions, setSessions] = useState([]);

    const [settings, setSettings] = useState({
        profile: {
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
            bio: user?.bio || '',
            location: user?.location || '',
            website: user?.website || '',
            github: user?.github || '',
            linkedin: user?.linkedin || '',
            twitter: user?.twitter || '',
            phone: user?.phone || ''
        },
        notifications: {
            email: user?.settings?.notifications?.email ?? true,
            push: user?.settings?.notifications?.push ?? true,
            collaborationRequests: user?.settings?.notifications?.collaborationRequests ?? true,
            comments: user?.settings?.notifications?.comments ?? false,
            projectUpdates: user?.settings?.notifications?.projectUpdates ?? true,
            newsletter: user?.settings?.notifications?.newsletter ?? true,
            securityAlerts: user?.settings?.notifications?.securityAlerts ?? true,
            analytics: user?.settings?.notifications?.analytics ?? false
        },
        privacy: {
            profileVisibility: user?.settings?.privacy?.profileVisibility || 'public',
            showEmail: user?.settings?.privacy?.showEmail ?? false,
            showActivity: user?.settings?.privacy?.showActivity ?? true,
            showProjects: user?.settings?.privacy?.showProjects ?? true,
            allowComments: user?.settings?.privacy?.allowComments ?? true,
            allowCollaborations: user?.settings?.privacy?.allowCollaborations ?? true,
            indexProfile: user?.settings?.privacy?.indexProfile ?? true
        },
        appearance: {
            theme: currentTheme,
            fontSize: user?.settings?.appearance?.fontSize || 'medium',
            language: user?.settings?.appearance?.language || 'en',
            dateFormat: user?.settings?.appearance?.dateFormat || 'MM/DD/YYYY',
            timezone: user?.settings?.appearance?.timezone || 'UTC'
        },
        security: {
            twoFactorEnabled: user?.security?.twoFactorEnabled ?? false,
            emailVerified: user?.emailVerified ?? false,
            phoneVerified: user?.phoneVerified ?? false,
            sessionTimeout: user?.settings?.security?.sessionTimeout || 30,
            ipWhitelist: user?.settings?.security?.ipWhitelist || []
        }
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            setLoading(true);
            const [settingsRes, apiKeysRes, webhooksRes, sessionsRes] = await Promise.all([
                apiService.getUserSettings(),
                apiService.getApiKeys(),
                apiService.getWebhooks(),
                apiService.getActiveSessions()
            ]);

            if (settingsRes.success) {
                setSettings(prev => ({ ...prev, ...settingsRes.data }));
            }
            if (apiKeysRes.success) {
                setApiKeys(apiKeysRes.data);
            }
            if (webhooksRes.success) {
                setWebhooks(webhooksRes.data);
            }
            if (sessionsRes.success) {
                setSessions(sessionsRes.data);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (tab) => {
        const newErrors = {};

        if (tab === 'profile') {
            if (!settings.profile.name?.trim()) {
                newErrors.name = 'Name is required';
            }
            if (!settings.profile.email?.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(settings.profile.email)) {
                newErrors.email = 'Email is invalid';
            }
            if (settings.profile.website && !/^https?:\/\/.+/.test(settings.profile.website)) {
                newErrors.website = 'Website must be a valid URL';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm(activeTab)) {
            showError('Please fix the errors before saving');
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();
            formData.append('settings', JSON.stringify(settings));
            
            if (profileImage) {
                formData.append('avatar', profileImage);
            }

            const response = await apiService.updateUserSettings(formData);

            if (response.success) {
                success('Settings saved successfully!');
                updateUser(response.user);
            } else {
                showError(response.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Save error:', err);
            showError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showError('Image size must be less than 5MB');
                return;
            }
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleThemeChange = (themeId) => {
        changeTheme(themeId);
        setSettings(prev => ({
            ...prev,
            appearance: { ...prev.appearance, theme: themeId }
        }));
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            showError('All fields are required');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        try {
            const response = await apiService.changePassword(passwordData);
            if (response.success) {
                success('Password changed successfully!');
                setShowPasswordModal(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                showError(response.message || 'Failed to change password');
            }
        } catch (err) {
            showError('Failed to change password');
        }
    };

    const generateApiKey = async () => {
        try {
            const response = await apiService.generateApiKey({
                name: `API Key ${apiKeys.length + 1}`,
                permissions: ['read']
            });
            if (response.success) {
                setApiKeys([...apiKeys, response.apiKey]);
                success('API key generated successfully!');
            }
        } catch (err) {
            showError('Failed to generate API key');
        }
    };

    const deleteApiKey = async (keyId) => {
        try {
            const response = await apiService.deleteApiKey(keyId);
            if (response.success) {
                setApiKeys(apiKeys.filter(key => key._id !== keyId));
                success('API key deleted successfully!');
            }
        } catch (err) {
            showError('Failed to delete API key');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        success('Copied to clipboard!');
    };

    const addWebhook = async () => {
        const url = prompt('Enter webhook URL:');
        if (!url) return;

        try {
            const response = await apiService.createWebhook({
                url,
                events: ['project.created', 'collaboration.requested']
            });
            if (response.success) {
                setWebhooks([...webhooks, response.webhook]);
                success('Webhook added successfully!');
            }
        } catch (err) {
            showError('Failed to add webhook');
        }
    };

    const deleteWebhook = async (webhookId) => {
        try {
            const response = await apiService.deleteWebhook(webhookId);
            if (response.success) {
                setWebhooks(webhooks.filter(wh => wh._id !== webhookId));
                success('Webhook deleted successfully!');
            }
        } catch (err) {
            showError('Failed to delete webhook');
        }
    };

    const terminateSession = async (sessionId) => {
        try {
            const response = await apiService.terminateSession(sessionId);
            if (response.success) {
                setSessions(sessions.filter(s => s._id !== sessionId));
                success('Session terminated successfully!');
            }
        } catch (err) {
            showError('Failed to terminate session');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        if (confirmation !== 'DELETE') {
            warning('Account deletion cancelled');
            return;
        }

        try {
            const response = await apiService.deleteAccount();
            if (response.success) {
                success('Account deleted successfully');
                setTimeout(() => {
                    logout();
                }, 2000);
            }
        } catch (err) {
            showError('Failed to delete account');
        }
    };

    const exportData = async () => {
        try {
            const response = await apiService.exportUserData();
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${Date.now()}.json`;
            a.click();
            success('Data exported successfully!');
        } catch (err) {
            showError('Failed to export data');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'api', label: 'API & Webhooks', icon: Code },
        { id: 'sessions', label: 'Sessions', icon: Activity },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
    ];

    return (
        <DashboardLayout
            title="Settings"
            subtitle="Manage your account preferences and configuration"
            actions={
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Save Changes</span>
                        </>
                    )}
                </motion.button>
            }
        >
            <div className="flex flex-col lg:flex-row gap-6 p-6">
                {/* Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        {tabs.map((tab, index) => (
                            <motion.button
                                key={tab.id}
                                whileHover={{ x: 4 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-l-4 border-cyan-500'
                                        : 'text-slate-400 hover:bg-slate-700/30 border-l-4 border-transparent'
                                } ${index !== 0 ? 'border-t border-slate-700/30' : ''}`}
                            >
                                <tab.icon size={20} />
                                <span className="font-medium">{tab.label}</span>
                            </motion.button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Profile Picture */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <User size={24} className="text-cyan-400" />
                                        Profile Picture
                                    </h3>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <img
                                                src={imagePreview || 'https://via.placeholder.com/150'}
                                                alt="Profile"
                                                className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500/30"
                                            />
                                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-cyan-600 transition-colors shadow-lg">
                                                <Upload size={20} className="text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold text-lg mb-2">
                                                {settings.profile.name || 'Your Name'}
                                            </h4>
                                            <p className="text-slate-400 text-sm mb-4">
                                                JPG, PNG or GIF. Max size 5MB.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setProfileImage(null);
                                                    setImagePreview('');
                                                }}
                                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                            >
                                                Remove Picture
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.profile.name}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, name: e.target.value }
                                                }))}
                                                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                    errors.name ? 'border-red-500' : 'border-slate-700'
                                                }`}
                                                placeholder="John Doe"
                                            />
                                            {errors.name && (
                                                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.profile.username}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, username: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="johndoe"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.profile.email}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, email: e.target.value }
                                                }))}
                                                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                    errors.email ? 'border-red-500' : 'border-slate-700'
                                                }`}
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={settings.profile.phone}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, phone: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.profile.location}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, location: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="San Francisco, CA"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.profile.website}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, website: e.target.value }
                                                }))}
                                                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                    errors.website ? 'border-red-500' : 'border-slate-700'
                                                }`}
                                                placeholder="https://example.com"
                                            />
                                            {errors.website && (
                                                <p className="text-red-400 text-sm mt-1">{errors.website}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={settings.profile.bio}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                profile: { ...prev.profile, bio: e.target.value }
                                            }))}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <p className="text-slate-500 text-sm mt-2">
                                            {settings.profile.bio?.length || 0}/500 characters
                                        </p>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6">Social Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                                <LinkIcon size={16} />
                                                GitHub
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.profile.github}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, github: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="https://github.com/username"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                                <LinkIcon size={16} />
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.profile.linkedin}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, linkedin: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                                <LinkIcon size={16} />
                                                Twitter
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.profile.twitter}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    profile: { ...prev.profile, twitter: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="https://twitter.com/username"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <motion.div
                                key="appearance"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Theme Selection */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <Palette size={24} className="text-cyan-400" />
                                        Theme
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {themes.map((themeOption) => (
                                            <motion.div
                                                key={themeOption.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleThemeChange(themeOption.id)}
                                                className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                                                    currentTheme === themeOption.id
                                                        ? 'ring-2 ring-cyan-500 bg-slate-700/50'
                                                        : 'bg-slate-900/30 hover:bg-slate-900/50'
                                                }`}
                                            >
                                                <div
                                                    className="w-full h-20 rounded-lg mb-3 shadow-lg"
                                                    style={{ background: themeOption.gradient }}
                                                />
                                                <p className="text-white font-medium text-center text-sm">
                                                    {themeOption.name}
                                                </p>
                                                {currentTheme === themeOption.id && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Display Settings */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6">Display Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Font Size
                                            </label>
                                            <select
                                                value={settings.appearance.fontSize}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, fontSize: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="small">Small</option>
                                                <option value="medium">Medium</option>
                                                <option value="large">Large</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Language
                                            </label>
                                            <select
                                                value={settings.appearance.language}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, language: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="en">English</option>
                                                <option value="es">Spanish</option>
                                                <option value="fr">French</option>
                                                <option value="de">German</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Date Format
                                            </label>
                                            <select
                                                value={settings.appearance.dateFormat}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, dateFormat: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Timezone
                                            </label>
                                            <select
                                                value={settings.appearance.timezone}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, timezone: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="UTC">UTC</option>
                                                <option value="America/New_York">Eastern Time</option>
                                                <option value="America/Chicago">Central Time</option>
                                                <option value="America/Los_Angeles">Pacific Time</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                            >
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Bell size={24} className="text-cyan-400" />
                                    Notification Preferences
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(settings.notifications).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                        >
                                            <div>
                                                <p className="text-white font-medium capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    {getNotificationDescription(key)}
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, [key]: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-slate-700 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <motion.div
                                key="privacy"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <Shield size={24} className="text-cyan-400" />
                                        Privacy Settings
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Profile Visibility
                                            </label>
                                            <select
                                                value={settings.privacy.profileVisibility}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    privacy: { ...prev.privacy, profileVisibility: e.target.value }
                                                }))}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="public">Public</option>
                                                <option value="private">Private</option>
                                                <option value="collaborators">Collaborators Only</option>
                                            </select>
                                        </div>

                                        {Object.entries(settings.privacy)
                                            .filter(([key]) => key !== 'profileVisibility')
                                            .map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                                >
                                                    <div>
                                                        <p className="text-white font-medium capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </p>
                                                        <p className="text-slate-400 text-sm mt-1">
                                                            {getPrivacyDescription(key)}
                                                        </p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => setSettings(prev => ({
                                                                ...prev,
                                                                privacy: { ...prev.privacy, [key]: e.target.checked }
                                                            }))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-14 h-7 bg-slate-700 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                                                    </label>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Password */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <Lock size={24} className="text-cyan-400" />
                                        Password
                                    </h3>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
                                    >
                                        Change Password
                                    </button>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <Smartphone size={24} className="text-cyan-400" />
                                        Two-Factor Authentication
                                    </h3>
                                    <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                                        <div>
                                            <p className="text-white font-medium">
                                                2FA Status
                                            </p>
                                            <p className="text-slate-400 text-sm mt-1">
                                                {settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                        <button
                                            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                                                settings.security.twoFactorEnabled
                                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                            }`}
                                        >
                                            {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                                        </button>
                                    </div>
                                </div>

                                {/* Email & Phone Verification */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-6">Verification Status</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-3">
                                                <Mail size={20} className="text-cyan-400" />
                                                <div>
                                                    <p className="text-white font-medium">Email</p>
                                                    <p className="text-slate-400 text-sm">{settings.profile.email}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
                                                settings.security.emailVerified
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {settings.security.emailVerified ? (
                                                    <>
                                                        <Check size={14} />
                                                        Verified
                                                    </>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-3">
                                                <Smartphone size={20} className="text-cyan-400" />
                                                <div>
                                                    <p className="text-white font-medium">Phone</p>
                                                    <p className="text-slate-400 text-sm">
                                                        {settings.profile.phone || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
                                                settings.security.phoneVerified
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {settings.security.phoneVerified ? (
                                                    <>
                                                        <Check size={14} />
                                                        Verified
                                                    </>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* API & Webhooks Tab */}
                        {activeTab === 'api' && (
                            <motion.div
                                key="api"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* API Keys */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <Key size={24} className="text-cyan-400" />
                                            API Keys
                                        </h3>
                                        <button
                                            onClick={generateApiKey}
                                            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 flex items-center gap-2"
                                        >
                                            <Key size={16} />
                                            Generate New Key
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {apiKeys.map((key) => (
                                            <div
                                                key={key._id}
                                                className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{key.name}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <code className="text-slate-400 text-sm bg-slate-900/50 px-3 py-1 rounded">
                                                            {key.key ? key.key : '••••••••••••••••'}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(key.key)}
                                                            className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
                                                        >
                                                            <Copy size={16} className="text-cyan-400" />
                                                        </button>
                                                    </div>
                                                    <p className="text-slate-500 text-xs mt-2">
                                                        Created {new Date(key.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => deleteApiKey(key._id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} className="text-red-400" />
                                                </button>
                                            </div>
                                        ))}

                                        {apiKeys.length === 0 && (
                                            <div className="text-center py-8">
                                                <Key size={48} className="text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-400">No API keys generated yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Webhooks */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <Webhook size={24} className="text-cyan-400" />
                                            Webhooks
                                        </h3>
                                        <button
                                            onClick={addWebhook}
                                            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 flex items-center gap-2"
                                        >
                                            <Webhook size={16} />
                                            Add Webhook
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {webhooks.map((webhook) => (
                                            <div
                                                key={webhook._id}
                                                className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        {webhook.url}
                                                        <ExternalLink size={14} className="text-slate-400" />
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        {webhook.events.map((event, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs"
                                                            >
                                                                {event}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteWebhook(webhook._id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} className="text-red-400" />
                                                </button>
                                            </div>
                                        ))}

                                        {webhooks.length === 0 && (
                                            <div className="text-center py-8">
                                                <Webhook size={48} className="text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-400">No webhooks configured</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Sessions Tab */}
                        {activeTab === 'sessions' && (
                            <motion.div
                                key="sessions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                            >
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Activity size={24} className="text-cyan-400" />
                                    Active Sessions
                                </h3>

                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div
                                            key={session._id}
                                            className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                                    {session.device === 'Desktop' ? (
                                                        <Monitor size={24} className="text-cyan-400" />
                                                    ) : (
                                                        <Smartphone size={24} className="text-cyan-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        {session.device} • {session.browser}
                                                        {session.isCurrent && (
                                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                                                Current
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-slate-400 text-sm">
                                                        {session.location} • Last active {session.lastActive}
                                                    </p>
                                                </div>
                                            </div>
                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => terminateSession(session._id)}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                >
                                                    Terminate
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Danger Zone Tab */}
                        {activeTab === 'danger' && (
                            <motion.div
                                key="danger"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Export Data */}
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-xl font-semibold text-white mb-4">Export Data</h3>
                                    <p className="text-slate-400 mb-4">
                                        Download all your portfolio data in JSON format
                                    </p>
                                    <button
                                        onClick={exportData}
                                        className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Export My Data
                                    </button>
                                </div>

                                {/* Delete Account */}
                                <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border-2 border-red-500/30">
                                    <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={24} />
                                        Delete Account
                                    </h3>
                                    <p className="text-slate-300 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete My Account
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold text-white mb-6">Change Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handlePasswordChange}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                                >
                                    Change Password
                                </button>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Helper functions
const getNotificationDescription = (key) => {
    const descriptions = {
        email: 'Receive email notifications',
        push: 'Receive push notifications in browser',
        collaborationRequests: 'Get notified when someone requests to collaborate',
        comments: 'Get notified about new comments on your projects',
        projectUpdates: 'Receive updates about your projects',
        newsletter: 'Receive newsletter and updates',
        securityAlerts: 'Important security notifications',
        analytics: 'Weekly analytics reports'
    };
    return descriptions[key] || '';
};

const getPrivacyDescription = (key) => {
    const descriptions = {
        showEmail: 'Display your email on your public profile',
        showActivity: 'Show your activity status to others',
        showProjects: 'Make your projects visible to everyone',
        allowComments: 'Allow comments on your projects',
        allowCollaborations: 'Allow collaboration requests',
        indexProfile: 'Allow search engines to index your profile'
    };
    return descriptions[key] || '';
};

export default Settings;