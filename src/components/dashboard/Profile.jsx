import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, MapPin, Briefcase, Link as LinkIcon, Calendar, Edit, Camera, Save,
    Shield, Award, TrendingUp, Share2, Download, Copy, Check, X, ExternalLink,
    Globe, Github, Linkedin, Twitter, Code, BookOpen, Clock, Activity, Star,
    Users, Eye, MessageSquare, Zap, Target, FileText, Settings, Lock, Phone,
    Building, Hash, AtSign, Heart, Coffee, Sparkles, Trophy, Flag, Rocket,
    BarChart2, PieChart as PieChartIcon, Layers, Package, Inbox, Bell, CheckCircle, XCircle,
    AlertCircle, TrendingDown, DollarSign, ChevronRight, Plus, Minus, Search,
    Filter, MoreVertical, Upload, Image, Video, Music, Headphones, Mic, Radio,
    Wifi, Battery, Bluetooth, Cast, Volume2, Volume, VolumeX, Play, Pause,
    SkipBack, SkipForward, Repeat, Shuffle, List, Grid, Maximize, Minimize,
    ZoomIn, ZoomOut, RotateCw, RotateCcw, Trash2, Archive, Bookmark, Tag,
    Paperclip, Send, Smile, Meh, Frown, ThumbsUp, ThumbsDown, MessageCircle,
    Folder, FolderOpen, File, FilePlus, FileText as FileTextIcon, Database,
    Server, HardDrive, Cpu, Monitor, Smartphone, Tablet, Watch, Speaker,
    Printer, Keyboard, Mouse, Gamepad, CloudLightning, CloudRain, CloudSnow,
    Sun, Moon, Sunrise, Sunset, Wind, CloudDrizzle, Droplets, Umbrella,
    Navigation, Compass, Map, MapPinned, Route, Car, Truck, Bus, Train, Plane,
    Ship, Anchor, Home, Hotel, Store, ShoppingCart, ShoppingBag, CreditCard,
    Wallet, Gift, PercentCircle, Receipt, Calculator, PiggyBank, TrendingUpIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import QRCode from 'qrcode';
import '../../styles/ActionButtons.css';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie
} from 'recharts';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError } = useNotifications();
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeSection, setActiveSection] = useState('profile');
    const [qrCode, setQrCode] = useState('');
    const [profileStats, setProfileStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [topProjects, setTopProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [workExperience, setWorkExperience] = useState([]);
    const [education, setEducation] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [interests, setInterests] = useState([]);
    const [availability, setAvailability] = useState('available');
    const [showExportModal, setShowExportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('default');
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || '',
        bio: user?.bio || '',
        tagline: user?.tagline || '',
        location: user?.location || '',
        role: user?.role || '',
        company: user?.company || '',
        website: user?.website || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        coverImage: user?.coverImage || '',
        hourlyRate: user?.hourlyRate || '',
        yearsOfExperience: user?.yearsOfExperience || '',
        availability: user?.availability || 'available',
        timezone: user?.timezone || '',
        socialLinks: {
            github: user?.socialLinks?.github || '',
            linkedin: user?.socialLinks?.linkedin || '',
            twitter: user?.socialLinks?.twitter || '',
            facebook: user?.socialLinks?.facebook || '',
            instagram: user?.socialLinks?.instagram || '',
            telegram: user?.socialLinks?.telegram || '',
            whatsapp: user?.socialLinks?.whatsapp || '',
            dribbble: user?.socialLinks?.dribbble || '',
            behance: user?.socialLinks?.behance || '',
            medium: user?.socialLinks?.medium || '',
            stackoverflow: user?.socialLinks?.stackoverflow || '',
            youtube: user?.socialLinks?.youtube || ''
        },
        preferences: {
            publicEmail: user?.preferences?.publicEmail || false,
            publicPhone: user?.preferences?.publicPhone || false,
            showActivity: user?.preferences?.showActivity || true,
            showStats: user?.preferences?.showStats || true,
            allowMessages: user?.preferences?.allowMessages || true,
            showAvailability: user?.preferences?.showAvailability || true,
            emailNotifications: user?.preferences?.emailNotifications || true,
            collaborationRequests: user?.preferences?.collaborationRequests || true
        }
    });

    const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(profile.coverImage);
    const [coverFile, setCoverFile] = useState(null);

    useEffect(() => {
        loadProfileData();
        
        // Listen for settings changes
        const handleSettingsChange = (event) => {
            const newSettings = event.detail;
            console.log('Settings changed in Profile:', newSettings);
            
            // Apply appearance changes
            if (newSettings.appearance?.fontSize) {
                const root = document.documentElement;
                const fontSizes = {
                    small: '14px',
                    medium: '16px',
                    large: '18px',
                    xlarge: '20px'
                };
                root.style.setProperty('--base-font-size', fontSizes[newSettings.appearance.fontSize] || '16px');
            }
            
            // Update profile data if changed
            if (newSettings.profile) {
                setProfile(prev => ({
                    ...prev,
                    ...newSettings.profile
                }));
            }
        };
        
        window.addEventListener('settingsChanged', handleSettingsChange);
        
        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
        };
    }, []);

    useEffect(() => {
        generateQRCode();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const [
                statsRes, activityRes, projectsRes, skillsRes,
                achievementsRes, certsRes, experienceRes, educationRes,
                testimonialsRes, languagesRes, interestsRes
            ] = await Promise.all([
                apiService.getProfileStats(),
                apiService.getRecentActivity(),
                apiService.getTopProjects(),
                apiService.getUserSkills(),
                apiService.getAchievements(),
                apiService.getCertifications(),
                apiService.getWorkExperience(),
                apiService.getEducation(),
                apiService.getTestimonials(),
                apiService.getLanguages(),
                apiService.getInterests()
            ]);

            if (statsRes.success) setProfileStats(statsRes.data);
            if (activityRes.success) setRecentActivity(activityRes.data);
            if (projectsRes.success) setTopProjects(projectsRes.data);
            if (skillsRes.success) setSkills(skillsRes.data);
            if (achievementsRes.success) setAchievements(achievementsRes.data);
            if (certsRes.success) setCertifications(certsRes.data);
            if (experienceRes.success) setWorkExperience(experienceRes.data);
            if (educationRes.success) setEducation(educationRes.data);
            if (testimonialsRes.success) setTestimonials(testimonialsRes.data);
            if (languagesRes.success) setLanguages(languagesRes.data);
            if (interestsRes.success) setInterests(interestsRes.data);
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

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showError('Image size must be less than 10MB');
                return;
            }
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('profile', JSON.stringify(profile));
            
            if (avatarFile) formData.append('avatar', avatarFile);
            if (coverFile) formData.append('cover', coverFile);

            const response = await apiService.updateProfile(formData);

            if (response.success) {
                success('Profile updated successfully!');
                updateUser(response.user);
                setProfile(prev => ({
                    ...prev,
                    avatar: response.user.avatar,
                    coverImage: response.user.coverImage
                }));
                setAvatarPreview(response.user.avatar);
                setCoverPreview(response.user.coverImage);
                
                // Emit settings change event for other components
                window.dispatchEvent(new CustomEvent('settingsChanged', { 
                    detail: { 
                        profile: profile,
                        user: response.user 
                    } 
                }));
                setCoverPreview(response.user.coverImage);
                setIsEditing(false);
                setAvatarFile(null);
                setCoverFile(null);
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
            tagline: user?.tagline || '',
            location: user?.location || '',
            role: user?.role || '',
            company: user?.company || '',
            website: user?.website || '',
            phone: user?.phone || '',
            avatar: user?.avatar || '',
            coverImage: user?.coverImage || '',
            hourlyRate: user?.hourlyRate || '',
            yearsOfExperience: user?.yearsOfExperience || '',
            availability: user?.availability || 'available',
            timezone: user?.timezone || '',
            socialLinks: user?.socialLinks || {},
            preferences: user?.preferences || {}
        });
        setAvatarPreview(user?.avatar);
        setCoverPreview(user?.coverImage);
        setAvatarFile(null);
        setCoverFile(null);
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
            setShowShareModal(true);
        }
    };

    const downloadQRCode = () => {
        const link = document.createElement('a');
        link.download = 'profile-qr-code.png';
        link.href = qrCode;
        link.click();
    };

    const exportResume = async (format) => {
        try {
            const response = await apiService.exportResume(format);
            if (response.success) {
                const link = document.createElement('a');
                link.href = response.downloadUrl;
                link.download = `resume_${user?.username}.${format}`;
                link.click();
                success(`Resume exported as ${format.toUpperCase()}!`);
            }
        } catch (err) {
            showError('Failed to export resume');
        }
    };

    const getProfileCompleteness = () => {
        const fields = [
            profile.name,
            profile.email,
            profile.username,
            profile.bio,
            profile.tagline,
            profile.location,
            profile.role,
            profile.avatar,
            profile.coverImage,
            profile.website,
            profile.socialLinks.github || profile.socialLinks.linkedin,
            skills.length > 0,
            topProjects.length > 0,
            workExperience.length > 0,
            education.length > 0,
            certifications.length > 0
        ];
        
        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    };

    // Enhanced Stats with more metrics
    const stats = [
        {
            label: 'Profile Views',
            value: profileStats?.totalViews || 0,
            change: '+23%',
            changeType: 'increase',
            icon: Eye,
            color: '#06b6d4',
            bgColor: 'bg-cyan-500/10',
            chartData: profileStats?.viewsChart || []
        },
        {
            label: 'Projects',
            value: profileStats?.totalProjects || 0,
            change: '+12%',
            changeType: 'increase',
            icon: Code,
            color: '#8b5cf6',
            bgColor: 'bg-purple-500/10',
            chartData: profileStats?.projectsChart || []
        },
        {
            label: 'Collaborators',
            value: profileStats?.collaborators || 0,
            change: '+8',
            changeType: 'increase',
            icon: Users,
            color: '#ec4899',
            bgColor: 'bg-pink-500/10',
            chartData: profileStats?.collaboratorsChart || []
        },
        {
            label: 'Engagement Rate',
            value: profileStats?.engagementRate || '0%',
            change: '+15%',
            changeType: 'increase',
            icon: TrendingUp,
            color: '#10b981',
            bgColor: 'bg-green-500/10',
            chartData: profileStats?.engagementChart || []
        },
        {
            label: 'Completed Projects',
            value: profileStats?.completedProjects || 0,
            change: '+5',
            changeType: 'increase',
            icon: CheckCircle,
            color: '#f59e0b',
            bgColor: 'bg-amber-500/10',
            chartData: profileStats?.completedChart || []
        },
        {
            label: 'Total Likes',
            value: profileStats?.totalLikes || 0,
            change: '+34%',
            changeType: 'increase',
            icon: Heart,
            color: '#ef4444',
            bgColor: 'bg-red-500/10',
            chartData: profileStats?.likesChart || []
        },
        {
            label: 'Messages',
            value: profileStats?.messages || 0,
            change: '+18',
            changeType: 'increase',
            icon: MessageSquare,
            color: '#3b82f6',
            bgColor: 'bg-blue-500/10',
            chartData: profileStats?.messagesChart || []
        },
        {
            label: 'Achievements',
            value: achievements.length || 0,
            change: '+2',
            changeType: 'increase',
            icon: Trophy,
            color: '#eab308',
            bgColor: 'bg-yellow-500/10',
            chartData: []
        }
    ];

    const availabilityOptions = [
        { value: 'available', label: 'Available for work', color: '#10b981', icon: CheckCircle },
        { value: 'busy', label: 'Busy', color: '#f59e0b', icon: Clock },
        { value: 'unavailable', label: 'Not available', color: '#ef4444', icon: XCircle },
        { value: 'open', label: 'Open to offers', color: '#06b6d4', icon: Inbox }
    ];

    const socialPlatforms = [
        { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username', color: '#333' },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username', color: '#0077b5' },
        { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username', color: '#1da1f2' },
        { key: 'facebook', label: 'Facebook', icon: Users, placeholder: 'https://facebook.com/profile', color: '#1877f2' },
        { key: 'instagram', label: 'Instagram', icon: Camera, placeholder: 'https://instagram.com/username', color: '#e4405f' },
        { key: 'telegram', label: 'Telegram', icon: Send, placeholder: 'https://t.me/username', color: '#0088cc' },
        { key: 'whatsapp', label: 'WhatsApp', icon: Phone, placeholder: 'https://wa.me/phonenumber', color: '#25d366' },
        { key: 'dribbble', label: 'Dribbble', icon: Target, placeholder: 'https://dribbble.com/username', color: '#ea4c89' },
        { key: 'behance', label: 'Behance', icon: Layers, placeholder: 'https://behance.net/username', color: '#1769ff' },
        { key: 'medium', label: 'Medium', icon: BookOpen, placeholder: 'https://medium.com/@username', color: '#00ab6c' },
        { key: 'stackoverflow', label: 'Stack Overflow', icon: Code, placeholder: 'https://stackoverflow.com/users/...', color: '#f48024' },
        { key: 'youtube', label: 'YouTube', icon: Video, placeholder: 'https://youtube.com/@username', color: '#ff0000' }
    ];

    const completeness = getProfileCompleteness();

    const sections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'about', label: 'About', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'experience', label: 'Experience', icon: Building },
        { id: 'skills', label: 'Skills', icon: Zap },
        { id: 'achievements', label: 'Achievements', icon: Trophy },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'projects', label: 'Projects', icon: Code },
        { id: 'testimonials', label: 'Testimonials', icon: MessageCircle }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto mb-4"
                        />
                        <p className="text-slate-400">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Hero Section with Cover */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative h-80 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 overflow-hidden"
                >
                    {/* Cover Image */}
                    {coverPreview ? (
                        <img
                            src={coverPreview}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNmI2ZDQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHptLTI0LTI0aDEydjEySDM2em0yNCAwaDEydjEySDYwem0tMjQtMjRoMTJ2MTJIMzZ6bTI0IDBoMTJ2MTJINjB6bS0yNC0yNGgxMnYxMkgzNnptMjQgMGgxMnYxMkg2MHptLTI0LTI0aDEydjEySDM2em0yNCAwaDEydjEySDYwem0tMjQtMjRoMTJ2MTJIMzZ6bTI0IDBoMTJ2MTJINjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                        </div>
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                    
                    {/* Edit Cover Button */}
                    {isEditing && (
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute top-6 right-6 px-4 py-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-700"
                        >
                            <Camera size={18} />
                            Change Cover
                        </button>
                    )}
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                    />

                    {/* Profile Actions - Floating */}
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={shareProfile}
                                    className="p-3 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-800 transition-all border border-slate-700"
                                >
                                    <Share2 size={20} />
                                </button>
                                <button
                                    onClick={() => setShowExportModal(true)}
                                    className="p-3 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-800 transition-all border border-slate-700"
                                >
                                    <Download size={20} />
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
                                    className="px-4 py-3 bg-slate-900/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-800 transition-all border border-slate-700"
                                >
                                    <X size={18} />
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

                    {/* Profile Info - Overlaying */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="max-w-7xl mx-auto flex items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-500 p-1 shadow-2xl shadow-cyan-500/30">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={profile.name}
                                            className="w-full h-full rounded-xl object-cover bg-slate-900"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-5xl font-bold text-white">
                                            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 transition-colors"
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
                                
                                {/* Availability Indicator */}
                                {!isEditing && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border shadow-lg`}
                                            style={{
                                                backgroundColor: `${availabilityOptions.find(a => a.value === profile.availability)?.color}20`,
                                                borderColor: availabilityOptions.find(a => a.value === profile.availability)?.color,
                                                color: availabilityOptions.find(a => a.value === profile.availability)?.color
                                            }}
                                        >
                                            {React.createElement(availabilityOptions.find(a => a.value === profile.availability)?.icon, { size: 12 })}
                                            {availabilityOptions.find(a => a.value === profile.availability)?.label}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Details */}
                            <div className="flex-1 pb-4">
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4 bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Your Name"
                                        />
                                        <input
                                            type="text"
                                            value={profile.tagline}
                                            onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                                            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Your tagline"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h1 className="text-5xl font-bold text-white mb-2 flex items-center gap-3">
                                                    {profile.name}
                                                    {/* Verification Badges */}
                                                    {user?.emailVerified && (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                                                            <Shield size={16} className="text-green-400" />
                                                            <span className="text-green-400 text-sm font-medium">Verified</span>
                                                        </div>
                                                    )}
                                                    {profileStats?.isPremium && (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                                            <Star size={16} className="text-yellow-400" />
                                                            <span className="text-yellow-400 text-sm font-medium">Premium</span>
                                                        </div>
                                                    )}
                                                </h1>
                                                <p className="text-xl text-cyan-400 font-semibold mb-3">{profile.tagline}</p>
                                                <div className="flex items-center gap-4 text-slate-300 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase size={18} className="text-cyan-400" />
                                                        <span>{profile.role}</span>
                                                    </div>
                                                    {profile.company && (
                                                        <>
                                                            <span className="text-slate-600">•</span>
                                                            <div className="flex items-center gap-2">
                                                                <Building size={18} className="text-cyan-400" />
                                                                <span>{profile.company}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {profile.location && (
                                                        <>
                                                            <span className="text-slate-600">•</span>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={18} className="text-cyan-400" />
                                                                <span>{profile.location}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Quick Stats */}
                                            <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-sm px-8 py-4 rounded-xl border border-slate-700">
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-white">{profileStats?.totalProjects || 0}</div>
                                                    <div className="text-xs text-slate-400 mt-1">Projects</div>
                                                </div>
                                                <div className="w-px h-12 bg-slate-700"></div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-white">{profileStats?.collaborators || 0}</div>
                                                    <div className="text-xs text-slate-400 mt-1">Collaborators</div>
                                                </div>
                                                <div className="w-px h-12 bg-slate-700"></div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-white">{achievements.length || 0}</div>
                                                    <div className="text-xs text-slate-400 mt-1">Achievements</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="flex gap-8">
                        {/* Sidebar Navigation */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-64 flex-shrink-0 space-y-2"
                        >
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 sticky top-8">
                                <nav className="space-y-1">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                activeSection === section.id
                                                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <section.icon size={20} />
                                            <span className="font-medium">{section.label}</span>
                                            {activeSection === section.id && (
                                                <ChevronRight size={16} className="ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </nav>

                                {/* Quick Actions */}
                                <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-2">
                                    <button
                                        onClick={copyProfileLink}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all text-sm"
                                    >
                                        <Copy size={16} />
                                        Copy Profile Link
                                    </button>
                                    <button
                                        onClick={downloadQRCode}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all text-sm"
                                    >
                                        <Download size={16} />
                                        Download QR Code
                                    </button>
                                </div>

                                {/* Profile Completeness */}
                                <div className="mt-6 pt-6 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-sm font-medium">Profile Strength</span>
                                        <span className="text-cyan-400 font-bold text-lg">{completeness}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completeness}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
                                        />
                                    </div>
                                    {completeness < 100 && (
                                        <p className="text-slate-500 text-xs mt-3">
                                            {completeness < 50 ? 'Complete your profile to stand out!' :
                                             completeness < 80 ? 'Almost there! Keep going!' :
                                             'Just a few more steps!'}
                                        </p>
                                    )}
                                </div>

                                {/* QR Code */}
                                {qrCode && (
                                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                                        <h4 className="text-white font-semibold mb-3 text-sm">Share via QR</h4>
                                        <div className="bg-white p-3 rounded-xl">
                                            <img src={qrCode} alt="Profile QR Code" className="w-full rounded-lg" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Main Content Area */}
                        <div className="flex-1 space-y-8">
                            <AnimatePresence mode="wait">
                                {/* PROFILE SECTION */}
                                {activeSection === 'profile' && (
                                    <motion.div
                                        key="profile"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Bio Card */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
                                            {isEditing ? (
                                                <textarea
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    rows={5}
                                                    maxLength={500}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                                    placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                                                />
                                            ) : (
                                                <p className="text-slate-300 text-lg leading-relaxed">{profile.bio || 'No bio added yet.'}</p>
                                            )}
                                            {isEditing && (
                                                <p className="text-slate-500 text-sm mt-2">
                                                    {profile.bio?.length || 0}/500 characters
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact & Social */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">Contact & Social</h3>
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Email</label>
                                                            <div className="relative">
                                                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="email"
                                                                    value={profile.email}
                                                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Phone</label>
                                                            <div className="relative">
                                                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="tel"
                                                                    value={profile.phone}
                                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Website</label>
                                                            <div className="relative">
                                                                <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="url"
                                                                    value={profile.website}
                                                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder="https://yourwebsite.com"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Location</label>
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
                                                    </div>

                                                    {/* Social Links Grid */}
                                                    <div>
                                                        <h4 className="text-white font-semibold mb-3">Social Profiles</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {socialPlatforms.map((platform) => (
                                                                <div key={platform.key}>
                                                                    <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                                                        <platform.icon size={16} style={{ color: platform.color }} />
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
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Contact Info */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {profile.email && (profile.preferences.publicEmail || isEditing) && (
                                                            <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg">
                                                                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                                                    <Mail size={20} className="text-cyan-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-400 text-xs">Email</p>
                                                                    <a href={`mailto:${profile.email}`} className="text-white hover:text-cyan-400 transition-colors">
                                                                        {profile.email}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {profile.phone && (profile.preferences.publicPhone || isEditing) && (
                                                            <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg">
                                                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                                    <Phone size={20} className="text-green-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-400 text-xs">Phone</p>
                                                                    <a href={`tel:${profile.phone}`} className="text-white hover:text-green-400 transition-colors">
                                                                        {profile.phone}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {profile.website && (
                                                            <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                    <Globe size={20} className="text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-400 text-xs">Website</p>
                                                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400 transition-colors flex items-center gap-1">
                                                                        {profile.website.replace(/^https?:\/\//, '')}
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {profile.location && (
                                                            <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg">
                                                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                    <MapPin size={20} className="text-purple-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-400 text-xs">Location</p>
                                                                    <p className="text-white">{profile.location}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Social Links */}
                                                    <div>
                                                        <h4 className="text-white font-semibold mb-3">Connect With Me</h4>
                                                        <div className="flex flex-wrap gap-3">
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
                                                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all group"
                                                                    >
                                                                        <platform.icon size={18} style={{ color: platform.color }} />
                                                                        <span className="text-white group-hover:text-cyan-400 transition-colors">{platform.label}</span>
                                                                        <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Professional Info */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">Professional Information</h3>
                                            {isEditing ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Role/Title</label>
                                                        <input
                                                            type="text"
                                                            value={profile.role}
                                                            onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Senior Developer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Company</label>
                                                        <input
                                                            type="text"
                                                            value={profile.company}
                                                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="Tech Corp"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Years of Experience</label>
                                                        <input
                                                            type="number"
                                                            value={profile.yearsOfExperience}
                                                            onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
                                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="5"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Hourly Rate (USD)</label>
                                                        <div className="relative">
                                                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="number"
                                                                value={profile.hourlyRate}
                                                                onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                                                                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                placeholder="150"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Timezone</label>
                                                        <select
                                                            value={profile.timezone}
                                                            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        >
                                                            <option value="">Select timezone</option>
                                                            <option value="America/New_York">Eastern Time (ET)</option>
                                                            <option value="America/Chicago">Central Time (CT)</option>
                                                            <option value="America/Denver">Mountain Time (MT)</option>
                                                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                                            <option value="Europe/London">London (GMT)</option>
                                                            <option value="Europe/Paris">Paris (CET)</option>
                                                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-slate-400 text-sm font-medium mb-2">Availability Status</label>
                                                        <select
                                                            value={profile.availability}
                                                            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        >
                                                            {availabilityOptions.map(option => (
                                                                <option key={option.value} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-4">
                                                    {profile.yearsOfExperience && (
                                                        <div className="p-4 bg-slate-900/30 rounded-lg">
                                                            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                                                <Clock size={18} />
                                                                <span className="text-sm font-medium">Experience</span>
                                                            </div>
                                                            <p className="text-2xl font-bold text-white">{profile.yearsOfExperience}+ years</p>
                                                        </div>
                                                    )}
                                                    {profile.hourlyRate && (
                                                        <div className="p-4 bg-slate-900/30 rounded-lg">
                                                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                                                <DollarSign size={18} />
                                                                <span className="text-sm font-medium">Hourly Rate</span>
                                                            </div>
                                                            <p className="text-2xl font-bold text-white">${profile.hourlyRate}/hr</p>
                                                        </div>
                                                    )}
                                                    {profile.timezone && (
                                                        <div className="p-4 bg-slate-900/30 rounded-lg">
                                                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                                                <Globe size={18} />
                                                                <span className="text-sm font-medium">Timezone</span>
                                                            </div>
                                                            <p className="text-lg font-semibold text-white">{profile.timezone.split('/')[1]}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ABOUT SECTION */}
                                {activeSection === 'about' && (
                                    <motion.div
                                        key="about"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Detailed About Information */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
                                            {isEditing ? (
                                                <textarea
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    rows={8}
                                                    maxLength={1000}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                                    placeholder="Tell us about yourself, your experience, your passions, and what drives you..."
                                                />
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-slate-300 text-lg leading-relaxed">
                                                        {profile.bio || 'No detailed bio added yet. Share your story and experience with visitors.'}
                                                    </p>
                                                    
                                                    {/* Professional Summary */}
                                                    <div className="border-l-4 border-cyan-500 pl-4">
                                                        <h4 className="text-cyan-400 font-semibold mb-2">Professional Summary</h4>
                                                        <p className="text-slate-300">
                                                            {profile.tagline || 'Add a professional tagline to highlight your expertise.'}
                                                        </p>
                                                    </div>

                                                    {/* Key Stats */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                                        <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                                            <div className="text-2xl font-bold text-cyan-400">{profile.yearsOfExperience || '0+'}</div>
                                                            <div className="text-slate-400 text-sm">Years Experience</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                                            <div className="text-2xl font-bold text-cyan-400">{skills.length || '0'}</div>
                                                            <div className="text-slate-400 text-sm">Skills</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                                            <div className="text-2xl font-bold text-cyan-400">{topProjects.length || '0'}</div>
                                                            <div className="text-slate-400 text-sm">Projects</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                                                            <div className="text-2xl font-bold text-cyan-400">{achievements.length || '0'}</div>
                                                            <div className="text-slate-400 text-sm">Achievements</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isEditing && (
                                                <p className="text-slate-500 text-sm mt-2">
                                                    {profile.bio?.length || 0}/1000 characters
                                                </p>
                                            )}
                                        </div>

                                        {/* Personal Information */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Location</label>
                                                            <div className="relative">
                                                                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    value={profile.location}
                                                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder="City, Country"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Role</label>
                                                            <div className="relative">
                                                                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    value={profile.role}
                                                                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder="e.g. Full Stack Developer"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Company</label>
                                                            <div className="relative">
                                                                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    value={profile.company}
                                                                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder="Company Name"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">Website</label>
                                                            <div className="relative">
                                                                <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="url"
                                                                    value={profile.website}
                                                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder="https://yourwebsite.com"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin size={18} className="text-cyan-400" />
                                                        <span className="text-slate-300">{profile.location || 'Location not set'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Briefcase size={18} className="text-cyan-400" />
                                                        <span className="text-slate-300">{profile.role || 'Role not specified'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Building size={18} className="text-cyan-400" />
                                                        <span className="text-slate-300">{profile.company || 'Company not specified'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Globe size={18} className="text-cyan-400" />
                                                        <span className="text-slate-300">
                                                            {profile.website ? (
                                                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                                                    {profile.website}
                                                                </a>
                                                            ) : 'Website not set'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Social Links */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-4">Social Links</h3>
                                            {isEditing ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {socialPlatforms.map(platform => (
                                                        <div key={platform.key}>
                                                            <label className="block text-slate-400 text-sm font-medium mb-2">{platform.label}</label>
                                                            <div className="relative">
                                                                <platform.icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    type="url"
                                                                    value={profile.socialLinks[platform.key]}
                                                                    onChange={(e) => setProfile(prev => ({
                                                                        ...prev,
                                                                        socialLinks: {
                                                                            ...prev.socialLinks,
                                                                            [platform.key]: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    placeholder={platform.placeholder}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {socialPlatforms.map(platform => (
                                                        profile.socialLinks[platform.key] && (
                                                            <a
                                                                key={platform.key}
                                                                href={profile.socialLinks[platform.key]}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors group"
                                                                style={{ borderColor: platform.color + '30', borderWidth: '1px' }}
                                                            >
                                                                <platform.icon size={18} style={{ color: platform.color }} />
                                                                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                                                                    {platform.label}
                                                                </span>
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ANALYTICS SECTION */}
                                {activeSection === 'analytics' && (
                                    <motion.div
                                        key="analytics"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {stats.map((stat, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all group"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                            <stat.icon size={24} style={{ color: stat.color }} />
                                                        </div>
                                                        <div className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                                            stat.changeType === 'increase' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {stat.changeType === 'increase' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {stat.change}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                                                    <h3 className="text-3xl font-bold text-white mb-4">
                                                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                                    </h3>
                                                    
                                                    {/* Mini chart */}
                                                    {stat.chartData && stat.chartData.length > 0 && (
                                                        <ResponsiveContainer width="100%" height={40}>
                                                            <AreaChart data={stat.chartData}>
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="value"
                                                                    stroke={stat.color}
                                                                    fill={stat.color}
                                                                    fillOpacity={0.2}
                                                                    strokeWidth={2}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Performance Chart */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Performance Overview</h3>
                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1.5 text-sm bg-cyan-500/20 text-cyan-400 rounded-lg font-medium">30 Days</button>
                                                    <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg font-medium transition-colors">90 Days</button>
                                                    <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg font-medium transition-colors">1 Year</button>
                                                </div>
                                            </div>
                                            <ResponsiveContainer width="100%" height={350}>
                                                <AreaChart data={profileStats?.performanceData || []}>
                                                    <defs>
                                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid #334155',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                                                        }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="views"
                                                        stroke="#06b6d4"
                                                        fillOpacity={1}
                                                        fill="url(#colorViews)"
                                                        strokeWidth={2}
                                                        name="Profile Views"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="engagement"
                                                        stroke="#8b5cf6"
                                                        fillOpacity={1}
                                                        fill="url(#colorEngagement)"
                                                        strokeWidth={2}
                                                        name="Engagement"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Engagement Breakdown */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Traffic Sources */}
                                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                                <h3 className="text-xl font-semibold text-white mb-6">Traffic Sources</h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <PieChart>
                                                        <Pie
                                                            data={profileStats?.trafficSources || []}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            label
                                                        >
                                                            {(profileStats?.trafficSources || []).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#1e293b',
                                                                border: '1px solid #334155',
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Engagement Metrics */}
                                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                                <h3 className="text-xl font-semibold text-white mb-6">Engagement Metrics</h3>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: 'Average Time on Profile', value: '2m 34s', icon: Clock, color: '#06b6d4', percentage: 85 },
                                                        { label: 'Project Click Rate', value: '68%', icon: Target, color: '#8b5cf6', percentage: 68 },
                                                        { label: 'Message Response Time', value: '< 1 hour', icon: MessageSquare, color: '#10b981', percentage: 92 },
                                                        { label: 'Profile Shares', value: '127', icon: Share2, color: '#f59e0b', percentage: 45 }
                                                    ].map((metric, index) => (
                                                        <div key={index}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${metric.color}20` }}>
                                                                        <metric.icon size={16} style={{ color: metric.color }} />
                                                                    </div>
                                                                    <span className="text-slate-300 text-sm">{metric.label}</span>
                                                                </div>
                                                                <span className="text-white font-semibold">{metric.value}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${metric.percentage}%` }}
                                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                                    className="h-full rounded-full"
                                                                    style={{ backgroundColor: metric.color }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* PORTFOLIO SECTION */}
                                {activeSection === 'portfolio' && (
                                    <motion.div
                                        key="portfolio"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Top Projects */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Featured Projects</h3>
                                                <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                    <Plus size={18} />
                                                    Add Project
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {topProjects.map((project, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/30 hover:border-cyan-500/30 transition-all"
                                                    >
                                                        {/* Project Image */}
                                                        {project.image && (
                                                            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                                                                <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="p-6">
                                                            <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                                                {project.title}
                                                            </h4>
                                                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                                                {project.description}
                                                            </p>
                                                            
                                                            {/* Tags */}
                                                            {project.tags && (
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {project.tags.map((tag, i) => (
                                                                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Stats */}
                                                            <div className="flex items-center gap-6 text-sm pt-4 border-t border-slate-700/50">
                                                                <span className="flex items-center gap-2 text-slate-400">
                                                                    <Eye size={16} />
                                                                    {project.views}
                                                                </span>
                                                                <span className="flex items-center gap-2 text-slate-400">
                                                                    <Heart size={16} />
                                                                    {project.likes}
                                                                </span>
                                                                <span className="flex items-center gap-2 text-slate-400">
                                                                    <MessageCircle size={16} />
                                                                    {project.comments || 0}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* EXPERIENCE SECTION */}
                                {activeSection === 'experience' && (
                                    <motion.div
                                        key="experience"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Work Experience */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Work Experience</h3>
                                                {isEditing && (
                                                    <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                        <Plus size={18} />
                                                        Add Experience
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-6">
                                                {workExperience.map((exp, index) => (
                                                    <div key={index} className="relative pl-8 pb-8 border-l-2 border-cyan-500/30 last:pb-0">
                                                        <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-cyan-500 ring-4 ring-slate-800"></div>
                                                        <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <h4 className="text-lg font-semibold text-white">{exp.title}</h4>
                                                                    <p className="text-cyan-400 font-medium">{exp.company}</p>
                                                                </div>
                                                                <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm">
                                                                    {exp.duration}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-400 text-sm mb-3">{exp.description}</p>
                                                            {exp.achievements && exp.achievements.length > 0 && (
                                                                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                                                                    {exp.achievements.map((achievement, i) => (
                                                                        <li key={i}>{achievement}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Education */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Education</h3>
                                                {isEditing && (
                                                    <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                        <Plus size={18} />
                                                        Add Education
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {education.map((edu, index) => (
                                                    <div key={index} className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                                <BookOpen size={24} className="text-cyan-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-white font-semibold mb-1">{edu.degree}</h4>
                                                                <p className="text-cyan-400 text-sm font-medium mb-2">{edu.institution}</p>
                                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar size={12} />
                                                                        {edu.year}
                                                                    </span>
                                                                    {edu.gpa && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Star size={12} />
                                                                            GPA: {edu.gpa}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Certifications */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Certifications</h3>
                                                {isEditing && (
                                                    <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                        <Plus size={18} />
                                                        Add Certification
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {certifications.map((cert, index) => (
                                                    <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                                <Award size={20} className="text-yellow-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-white font-semibold text-sm">{cert.name}</h4>
                                                                <p className="text-slate-400 text-xs">{cert.issuer}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">{cert.date}</span>
                                                            {cert.verifyUrl && (
                                                                <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                                                    Verify <ExternalLink size={12} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SKILLS SECTION */}
                                {activeSection === 'skills' && (
                                    <motion.div
                                        key="skills"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Skills */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Technical Skills</h3>
                                                {isEditing && (
                                                    <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                        <Plus size={18} />
                                                        Add Skill
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {skills.map((skill, index) => (
                                                    <div key={index}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                                                    <Zap size={16} className="text-cyan-400" />
                                                                </div>
                                                                <span className="text-white font-medium">{skill.name}</span>
                                                            </div>
                                                            <span className="text-cyan-400 font-semibold">{skill.level}%</span>
                                                        </div>
                                                        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${skill.level}%` }}
                                                                transition={{ duration: 1, delay: index * 0.1 }}
                                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                                            />
                                                        </div>
                                                        {skill.endorsements && (
                                                            <p className="text-slate-500 text-xs mt-2">{skill.endorsements} endorsements</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Languages */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-white">Languages</h3>
                                                {isEditing && (
                                                    <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
                                                        <Plus size={18} />
                                                        Add Language
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {languages.map((language, index) => (
                                                    <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 text-center">
                                                        <h4 className="text-white font-semibold mb-1">{language.name}</h4>
                                                        <p className="text-cyan-400 text-sm">{language.proficiency}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Interests */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-6">Interests</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {interests.map((interest, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-full text-slate-300 hover:text-cyan-400 transition-all cursor-pointer flex items-center gap-2"
                                                    >
                                                        <Hash size={14} />
                                                        {interest}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ACHIEVEMENTS SECTION */}
                                {activeSection === 'achievements' && (
                                    <motion.div
                                        key="achievements"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Achievements Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {achievements.map((achievement, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-yellow-500/30 transition-all group"
                                                >
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${achievement.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                            <Trophy size={32} className="text-yellow-400" />
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-white mb-2">{achievement.title}</h4>
                                                        <p className="text-slate-400 text-sm mb-4">{achievement.description}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <Calendar size={12} />
                                                            <span>{achievement.date}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Testimonials */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-6">Testimonials</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {testimonials.map((testimonial, index) => (
                                                    <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <img
                                                                src={testimonial.avatar}
                                                                alt={testimonial.name}
                                                                className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/30"
                                                            />
                                                            <div>
                                                                <h4 className="text-white font-semibold">{testimonial.name}</h4>
                                                                <p className="text-slate-400 text-sm">{testimonial.role}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-300 text-sm italic">"{testimonial.message}"</p>
                                                        <div className="flex items-center gap-1 mt-4">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={16}
                                                                    className={i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SETTINGS SECTION */}
                                {activeSection === 'settings' && (
                                    <motion.div
                                        key="settings"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Privacy Settings */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-6">Privacy Settings</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { key: 'publicEmail', label: 'Show email on public profile', description: 'Your email will be visible to anyone viewing your profile' },
                                                    { key: 'publicPhone', label: 'Show phone on public profile', description: 'Your phone number will be visible to anyone viewing your profile' },
                                                    { key: 'showActivity', label: 'Show recent activity', description: 'Display your recent actions and updates on your profile' },
                                                    { key: 'showStats', label: 'Show profile statistics', description: 'Display views, likes, and other metrics publicly' },
                                                    { key: 'allowMessages', label: 'Allow messages from anyone', description: 'Anyone can send you direct messages' },
                                                    { key: 'showAvailability', label: 'Show availability status', description: 'Display whether you\'re available for work' },
                                                    { key: 'emailNotifications', label: 'Email notifications', description: 'Receive email updates about activity on your profile' },
                                                    { key: 'collaborationRequests', label: 'Accept collaboration requests', description: 'Allow others to send you collaboration invitations' }
                                                ].map((pref) => (
                                                    <div
                                                        key={pref.key}
                                                        className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-white font-medium">{pref.label}</span>
                                                                {!profile.preferences[pref.key] && <Lock size={14} className="text-slate-500" />}
                                                            </div>
                                                            <p className="text-slate-400 text-sm">{pref.description}</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer ml-4">
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

                                        {/* Theme Customization */}
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                            <h3 className="text-xl font-semibold text-white mb-6">Profile Theme</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'default', name: 'Default', colors: ['#06b6d4', '#3b82f6', '#8b5cf6'] },
                                                    { id: 'sunset', name: 'Sunset', colors: ['#f59e0b', '#ef4444', '#ec4899'] },
                                                    { id: 'forest', name: 'Forest', colors: ['#10b981', '#059669', '#047857'] },
                                                    { id: 'ocean', name: 'Ocean', colors: ['#0ea5e9', '#0284c7', '#0369a1'] },
                                                    { id: 'purple', name: 'Purple Dream', colors: ['#a855f7', '#9333ea', '#7c3aed'] },
                                                    { id: 'monochrome', name: 'Monochrome', colors: ['#64748b', '#475569', '#334155'] }
                                                ].map((themeOption) => (
                                                    <button
                                                        key={themeOption.id}
                                                        onClick={() => setSelectedTheme(themeOption.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${
                                                            selectedTheme === themeOption.id
                                                                ? 'border-cyan-500 bg-cyan-500/10'
                                                                : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                                                        }`}
                                                    >
                                                        <div className="flex gap-1 mb-3">
                                                            {themeOption.colors.map((color, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex-1 h-8 rounded"
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="text-white text-sm font-medium">{themeOption.name}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="bg-red-500/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
                                            <h3 className="text-xl font-semibold text-red-400 mb-6">Danger Zone</h3>
                                            <div className="space-y-4">
                                                <button className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-all flex items-center justify-between">
                                                    <span>Delete all projects</span>
                                                    <Trash2 size={18} />
                                                </button>
                                                <button className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-all flex items-center justify-between">
                                                    <span>Deactivate account</span>
                                                    <XCircle size={18} />
                                                </button>
                                                <button className="w-full px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-between font-semibold">
                                                    <span>Delete account permanently</span>
                                                    <AlertCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Export Modal */}
                <AnimatePresence>
                    {showExportModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowExportModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6">Export Profile</h3>
                                <div className="space-y-3">
                                    {[
                                        { format: 'pdf', label: 'PDF Resume', icon: FileText, color: '#ef4444' },
                                        { format: 'json', label: 'JSON Data', icon: Code, color: '#3b82f6' },
                                        { format: 'html', label: 'HTML Portfolio', icon: Globe, color: '#10b981' },
                                        { format: 'markdown', label: 'Markdown', icon: FileTextIcon, color: '#f59e0b' }
                                        ].map((option) => (
                                        <button
                                            key={option.format}
                                            onClick={() => {
                                                exportResume(option.format);
                                                setShowExportModal(false);
                                            }}
                                            className="w-full flex items-center gap-4 p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-all group btn-cv"
                                        >
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center icon" style={{ backgroundColor: `${option.color}20` }}>
                                                <option.icon size={24} style={{ color: option.color }} />
                                            </div>
                                            <span className="flex-1 text-left text-white font-medium group-hover:text-cyan-400 transition-colors">{option.label}</span>
                                            <Download size={18} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="w-full mt-6 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Share Modal */}
                <AnimatePresence>
                    {showShareModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowShareModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6">Share Profile</h3>
                                
                                {/* Profile Link */}
                                <div className="mb-6">
                                    <label className="block text-slate-400 text-sm mb-2">Profile Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={`${window.location.origin}/portfolio/${user?.username || user?.id}`}
                                            readOnly
                                            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                                        />
                                        <button
                                            onClick={copyProfileLink}
                                            className="px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Social Share */}
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {[
                                        { name: 'Twitter', icon: Twitter, color: '#1da1f2' },
                                        { name: 'LinkedIn', icon: Linkedin, color: '#0077b5' },
                                        { name: 'Facebook', icon: Share2, color: '#1877f2' },
                                        { name: 'Email', icon: Mail, color: '#ea4335' }
                                    ].map((platform) => (
                                        <button
                                            key={platform.name}
                                            className="flex flex-col items-center gap-2 p-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                                        >
                                            <platform.icon size={24} style={{ color: platform.color }} />
                                            <span className="text-xs text-slate-400">{platform.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* QR Code */}
                                {qrCode && (
                                    <div className="mb-6">
                                        <label className="block text-slate-400 text-sm mb-3">QR Code</label>
                                        <div className="bg-white p-4 rounded-xl inline-block">
                                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default Profile;