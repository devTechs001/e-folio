import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    Link as LinkIcon,
    Calendar,
    Edit,
    Camera,
    Save,
    Shield,
    Award,
    TrendingUp,
    Share2,
    Download,
    Copy,
    Check,
    X,
    ExternalLink,
    Globe,
    Github,
    Linkedin,
    Twitter,
    Code,
    BookOpen,
    Clock,
    Activity,
    Star,
    Users,
    Eye,
    MessageSquare,
    Zap,
    Target,
    FileText,
    Settings,
    Lock,
    Phone,
    Building,
    Hash,
    AtSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import QRCode from 'qrcode';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError } = useNotifications();
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [qrCode, setQrCode] = useState('');
    const [profileStats, setProfileStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [topProjects, setTopProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || '',
        bio: user?.bio || '',
        location: user?.location || '',
        role: user?.role || '',
        company: user?.company || '',
        website: user?.website || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        socialLinks: {
            github: user?.socialLinks?.github || '',
            linkedin: user?.socialLinks?.linkedin || '',
            twitter: user?.socialLinks?.twitter || ''
        },
        preferences: {
            publicEmail: user?.preferences?.publicEmail || false,
            publicPhone: user?.preferences?.publicPhone || false,
            showActivity: user?.preferences?.showActivity || true
        }
    });

    const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        loadProfileData();
        generateQRCode();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes, projectsRes, skillsRes] = await Promise.all([
                apiService.getProfileStats(),
                apiService.getRecentActivity(),
                apiService.getTopProjects(),
                apiService.getUserSkills()
            ]);

            if (statsRes.success) {
                setProfileStats(statsRes.data);
            }
            if (activityRes.success) {
                setRecentActivity(activityRes.data);
            }
            if (projectsRes.success) {
                setTopProjects(projectsRes.data);
            }
            if (skillsRes.success) {
                setSkills(skillsRes.data);
            }
        } catch (err) {
            console.error('Failed to load profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async () => {
        try {
            const profileUrl = `${window.location.origin}/portfolio/${user?.username || user?.id}`;
            const qr = await QRCode.toDataURL(profileUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: theme.primary,
                    light: '#ffffff'
                }
            });
            setQrCode(qr);
        } catch (err) {
            console.error('QR generation failed:', err);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showError('Image size must be less than 5MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const formData = new FormData();
            formData.append('profile', JSON.stringify(profile));
            
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await apiService.updateProfile(formData);

            if (response.success) {
                success('Profile updated successfully!');
                updateUser(response.user);
                setProfile(prev => ({ ...prev, avatar: response.user.avatar }));
                setAvatarPreview(response.user.avatar);
                setIsEditing(false);
                setAvatarFile(null);
            } else {
                showError(response.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Save error:', err);
            showError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setProfile({
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
            bio: user?.bio || '',
            location: user?.location || '',
            role: user?.role || '',
            company: user?.company || '',
            website: user?.website || '',
            phone: user?.phone || '',
            avatar: user?.avatar || '',
            socialLinks: user?.socialLinks || {},
            preferences: user?.preferences || {}
        });
        setAvatarPreview(user?.avatar);
        setAvatarFile(null);
        setIsEditing(false);
    };

    const copyProfileLink = () => {
        const profileUrl = `${window.location.origin}/portfolio/${user?.username || user?.id}`;
        navigator.clipboard.writeText(profileUrl);
        success('Profile link copied to clipboard!');
    };

    const shareProfile = async () => {
        const profileUrl = `${window.location.origin}/portfolio/${user?.username || user?.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.name}'s Portfolio`,
                    text: profile.bio,
                    url: profileUrl
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            copyProfileLink();
        }
    };

    const downloadQRCode = () => {
        const link = document.createElement('a');
        link.download = 'profile-qr-code.png';
        link.href = qrCode;
        link.click();
    };

    const getProfileCompleteness = () => {
        const fields = [
            profile.name,
            profile.email,
            profile.username,
            profile.bio,
            profile.location,
            profile.role,
            profile.avatar,
            profile.website,
            profile.socialLinks.github || profile.socialLinks.linkedin,
            skills.length > 0,
            topProjects.length > 0
        ];
        
        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    };

    const stats = [
        {
            label: 'Projects',
            value: profileStats?.totalProjects || 0,
            change: '+12%',
            icon: Code,
            color: theme.primary,
            trend: 'up'
        },
        {
            label: 'Total Views',
            value: profileStats?.totalViews || 0,
            change: '+23%',
            icon: Eye,
            color: '#3b82f6',
            trend: 'up'
        },
        {
            label: 'Collaborators',
            value: profileStats?.collaborators || 0,
            change: '+8',
            icon: Users,
            color: '#8b5cf6',
            trend: 'up'
        },
        {
            label: 'Messages',
            value: profileStats?.messages || 0,
            change: '+15',
            icon: MessageSquare,
            color: '#ec4899',
            trend: 'up'
        }
    ];

    const socialPlatforms = [
        { 
            key: 'github', 
            label: 'GitHub', 
            icon: Github, 
            placeholder: 'https://github.com/username',
            color: '#333'
        },
        { 
            key: 'linkedin', 
            label: 'LinkedIn', 
            icon: Linkedin, 
            placeholder: 'https://linkedin.com/in/username',
            color: '#0077b5'
        },
        { 
            key: 'twitter', 
            label: 'Twitter', 
            icon: Twitter, 
            placeholder: 'https://twitter.com/username',
            color: '#1da1f2'
        }
    ];

    const completeness = getProfileCompleteness();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'projects', label: 'Projects', icon: Code },
        { id: 'skills', label: 'Skills', icon: Zap }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="My Profile"
            subtitle="Manage your personal information and public presence"
            actions={
                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={shareProfile}
                                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                <Share2 size={18} />
                                Share
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
                            >
                                <Edit size={18} />
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50"
                >
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center lg:items-start gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-500 p-1">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={profile.name}
                                            className="w-full h-full rounded-xl object-cover bg-slate-900"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-4xl font-bold text-white">
                                            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 transition-colors"
                                    >
                                        <Camera size={20} className="text-white" />
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Verification Badges */}
                            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                {user?.emailVerified && (
                                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full flex items-center gap-2">
                                        <Shield size={14} className="text-green-400" />
                                        <span className="text-green-400 text-xs font-medium">Verified</span>
                                    </div>
                                )}
                                {profileStats?.isPremium && (
                                    <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center gap-2">
                                        <Star size={14} className="text-yellow-400" />
                                        <span className="text-yellow-400 text-xs font-medium">Premium</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Username *
                                            </label>
                                            <div className="relative">
                                                <AtSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={profile.username}
                                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    placeholder="johndoe"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Role / Title
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="Senior Developer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                                Company
                                            </label>
                                            <div className="relative">
                                                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={profile.company}
                                                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    placeholder="Tech Corp"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <p className="text-slate-500 text-sm mt-2">
                                            {profile.bio?.length || 0}/500 characters
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                                    <div className="flex items-center gap-2 text-lg text-cyan-400 font-semibold mb-4">
                                        <Briefcase size={20} />
                                        {profile.role}
                                        {profile.company && (
                                            <>
                                                <span className="text-slate-600">@</span>
                                                <span>{profile.company}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-slate-300 text-lg leading-relaxed mb-6">{profile.bio}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-slate-400">
                                        {profile.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={18} />
                                                <span>{profile.location}</span>
                                            </div>
                                        )}
                                        {profile.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={18} />
                                                <span>{profile.email}</span>
                                            </div>
                                        )}
                                        {profile.website && (
                                            <a
                                                href={profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                                            >
                                                <Globe size={18} />
                                                <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar size={18} />
                                            <span>Joined {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    <div className="flex items-center gap-3 mt-6">
                                        {Object.entries(profile.socialLinks || {}).map(([key, value]) => {
                                            if (!value) return null;
                                            const platform = socialPlatforms.find(p => p.key === key);
                                            if (!platform) return null;
                                            
                                            return (
                                                <a
                                                    key={key}
                                                    href={value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ color: platform.color }}
                                                >
                                                    <platform.icon size={20} />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profile Completeness & QR Code */}
                        {!isEditing && (
                            <div className="flex flex-col gap-4 lg:w-64">
                                {/* Completeness */}
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-sm font-medium">Profile Completeness</span>
                                        <span className="text-cyan-400 font-bold">{completeness}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completeness}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                        />
                                    </div>
                                    {completeness < 100 && (
                                        <p className="text-slate-500 text-xs mt-2">
                                            Complete your profile to get more visibility
                                        </p>
                                    )}
                                </div>

                                {/* QR Code */}
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                                    <h4 className="text-white font-semibold mb-3 text-sm">Share Profile</h4>
                                    {qrCode && (
                                        <div className="bg-white p-2 rounded-lg mb-3">
                                            <img src={qrCode} alt="Profile QR Code" className="w-full" />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={copyProfileLink}
                                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <Copy size={14} />
                                            Copy
                                        </button>
                                        <button
                                            onClick={downloadQRCode}
                                            className="flex-1 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <Download size={14} />
                                            QR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Edit Mode - Additional Fields */}
                    {isEditing && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-6">
                            {/* Contact Information */}
                            <div>
                                <h3 className="text-white font-semibold mb-4">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Phone
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Location
                                        </label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={profile.location}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="San Francisco, CA"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-medium mb-2">
                                            Website
                                        </label>
                                        <div className="relative">
                                            <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="url"
                                                value={profile.website}
                                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div>
                                <h3 className="text-white font-semibold mb-4">Social Links</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {socialPlatforms.map((platform) => (
                                        <div key={platform.key}>
                                            <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                                <platform.icon size={16} />
                                                {platform.label}
                                            </label>
                                            <input
                                                type="url"
                                                value={profile.socialLinks[platform.key]}
                                                onChange={(e) => setProfile({
                                                    ...profile,
                                                    socialLinks: {
                                                        ...profile.socialLinks,
                                                        [platform.key]: e.target.value
                                                    }
                                                })}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder={platform.placeholder}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Privacy Preferences */}
                            <div>
                                <h3 className="text-white font-semibold mb-4">Privacy Preferences</h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'publicEmail', label: 'Show email on public profile' },
                                        { key: 'publicPhone', label: 'Show phone on public profile' },
                                        { key: 'showActivity', label: 'Show recent activity' }
                                    ].map((pref) => (
                                        <div
                                            key={pref.key}
                                            className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30"
                                        >
                                            <span className="text-white">{pref.label}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.preferences[pref.key]}
                                                    onChange={(e) => setProfile({
                                                        ...profile,
                                                        preferences: {
                                                            ...profile.preferences,
                                                            [pref.key]: e.target.checked
                                                        }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-slate-700 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <stat.icon size={24} style={{ color: stat.color }} />
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                            </h3>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors relative ${
                                activeTab === tab.id
                                    ? 'text-cyan-400'
                                    : 'text-slate-400 hover:text-slate-300'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Performance Chart */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6">Profile Performance</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={profileStats?.performanceData || []}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#06b6d4"
                                            fillOpacity={1}
                                            fill="url(#colorViews)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top Projects */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6">Top Projects</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {topProjects.map((project, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-all group cursor-pointer"
                                        >
                                            <h4 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                                                {project.title}
                                            </h4>
                                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                                                {project.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-slate-400">
                                                    <Eye size={14} />
                                                    {project.views}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-400">
                                                    <Star size={14} />
                                                    {project.likes}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                        >
                            <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                                            style={{ backgroundColor: `${activity.color}20` }}
                                        >
                                            {activity.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-1">{activity.title}</p>
                                            <p className="text-slate-400 text-sm mb-2">{activity.description}</p>
                                            <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <Clock size={12} />
                                                {activity.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'skills' && (
                        <motion.div
                            key="skills"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                        >
                            <h3 className="text-xl font-semibold text-white mb-6">Skills & Expertise</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {skills.map((skill, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium">{skill.name}</span>
                                            <span className="text-cyan-400 font-semibold">{skill.level}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${skill.level}%` }}
                                                transition={{ duration: 1, delay: index * 0.1 }}
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default Profile;