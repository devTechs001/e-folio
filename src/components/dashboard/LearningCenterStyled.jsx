import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Book,
    Users,
    MessageCircle,
    HelpCircle,
    Search,
    Video,
    FileText,
    Award,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    Star,
    Download,
    CheckCircle,
    Clock,
    TrendingUp,
    Filter,
    ChevronRight,
    ThumbsUp,
    Share2,
    Send,
    X,
    PlayCircle,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Settings,
    List,
    Grid,
    Trophy,
    Target,
    Zap,
    MessageSquare,
    Eye,
    Calendar,
    ArrowRight,
    Code,
    Palette,
    Layout,
    Database,
    Shield,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import ReactPlayer from 'react-player';

const LearningCenter = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError } = useNotifications();

    const [activeTab, setActiveTab] = useState('videos');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [videos, setVideos] = useState([]);
    const [tutorials, setTutorials] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [progress, setProgress] = useState({});
    const [bookmarks, setBookmarks] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({
        videosWatched: 0,
        tutorialsCompleted: 0,
        totalPoints: 0,
        certificatesEarned: 0
    });

    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [selectedTutorial, setSelectedTutorial] = useState(null);
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');

    const categories = [
        { id: 'all', name: 'All Topics', icon: Grid, color: '#06b6d4' },
        { id: 'getting-started', name: 'Getting Started', icon: Play, color: '#3b82f6' },
        { id: 'customization', name: 'Customization', icon: Palette, color: '#8b5cf6' },
        { id: 'collaboration', name: 'Collaboration', icon: Users, color: '#ec4899' },
        { id: 'analytics', name: 'Analytics', icon: TrendingUp, color: '#10b981' },
        { id: 'advanced', name: 'Advanced', icon: Code, color: '#f59e0b' }
    ];

    const difficulties = [
        { id: 'all', name: 'All Levels' },
        { id: 'beginner', name: 'Beginner' },
        { id: 'intermediate', name: 'Intermediate' },
        { id: 'advanced', name: 'Advanced' }
    ];

    useEffect(() => {
        loadLearningData();
    }, [activeTab, selectedCategory, selectedDifficulty]);

    const loadLearningData = async () => {
        try {
            setLoading(true);
            
            const [
                videosRes,
                tutorialsRes,
                faqsRes,
                communitiesRes,
                progressRes,
                bookmarksRes,
                achievementsRes,
                statsRes
            ] = await Promise.all([
                apiService.getLearningVideos({ category: selectedCategory, difficulty: selectedDifficulty }),
                apiService.getTutorials({ category: selectedCategory, difficulty: selectedDifficulty }),
                apiService.getFAQs({ category: selectedCategory }),
                apiService.getCommunities(),
                apiService.getLearningProgress(),
                apiService.getBookmarks(),
                apiService.getAchievements(),
                apiService.getLearningStats()
            ]);

            if (videosRes.success) setVideos(videosRes.data);
            if (tutorialsRes.success) setTutorials(tutorialsRes.data);
            if (faqsRes.success) setFaqs(faqsRes.data);
            if (communitiesRes.success) setCommunities(communitiesRes.data);
            if (progressRes.success) setProgress(progressRes.data);
            if (bookmarksRes.success) setBookmarks(bookmarksRes.data);
            if (achievementsRes.success) setAchievements(achievementsRes.data);
            if (statsRes.success) setStats(statsRes.data);

        } catch (err) {
            console.error('Failed to load learning data:', err);
            showError('Failed to load learning resources');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadLearningData();
        setRefreshing(false);
        success('Content refreshed');
    };

    const toggleBookmark = async (resourceId, type) => {
        try {
            const isBookmarked = bookmarks.some(b => b.resourceId === resourceId);
            
            if (isBookmarked) {
                await apiService.removeBookmark(resourceId);
                setBookmarks(bookmarks.filter(b => b.resourceId !== resourceId));
                success('Bookmark removed');
            } else {
                await apiService.addBookmark({ resourceId, type });
                setBookmarks([...bookmarks, { resourceId, type }]);
                success('Bookmark added');
            }
        } catch (err) {
            showError('Failed to update bookmark');
        }
    };

    const updateProgress = async (resourceId, progressData) => {
        try {
            await apiService.updateProgress({
                resourceId,
                ...progressData
            });
            setProgress(prev => ({
                ...prev,
                [resourceId]: progressData
            }));
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const handleVideoComplete = async (videoId) => {
        await updateProgress(videoId, { completed: true, completedAt: new Date() });
        success('Video completed! +10 points');
    };

    const handleTutorialComplete = async (tutorialId) => {
        await updateProgress(tutorialId, { completed: true, completedAt: new Date() });
        success('Tutorial completed! +20 points');
    };

    const submitComment = async (resourceId, type) => {
        if (!newComment.trim()) return;

        try {
            const response = await apiService.addComment({
                resourceId,
                type,
                content: newComment
            });

            if (response.success) {
                setComments(prev => ({
                    ...prev,
                    [resourceId]: [...(prev[resourceId] || []), response.data]
                }));
                setNewComment('');
                success('Comment added');
            }
        } catch (err) {
            showError('Failed to add comment');
        }
    };

    const rateResource = async (resourceId, rating) => {
        try {
            await apiService.rateResource({ resourceId, rating });
            success('Thank you for your rating!');
        } catch (err) {
            showError('Failed to submit rating');
        }
    };

    const filteredContent = {
        videos: videos.filter(v => 
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        tutorials: tutorials.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        faqs: faqs.filter(f => 
            f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading learning resources...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="Learning Center" 
            subtitle="Tutorials, resources, and community support"
            actions={
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            }
        >
            <div className="p-6 space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        {
                            label: 'Videos Watched',
                            value: stats.videosWatched,
                            icon: Video,
                            color: 'cyan',
                            change: '+12 this week'
                        },
                        {
                            label: 'Tutorials Completed',
                            value: stats.tutorialsCompleted,
                            icon: CheckCircle,
                            color: 'green',
                            change: '+5 this week'
                        },
                        {
                            label: 'Learning Points',
                            value: stats.totalPoints,
                            icon: Trophy,
                            color: 'yellow',
                            change: '+150 points'
                        },
                        {
                            label: 'Certificates',
                            value: stats.certificatesEarned,
                            icon: Award,
                            color: 'purple',
                            change: 'Next at 500pts'
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                                    <stat.icon size={24} className={`text-${stat.color}-400`} />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                            <h3 className={`text-3xl font-bold text-${stat.color}-400 mb-1`}>
                                {stat.value}
                            </h3>
                            <p className="text-slate-500 text-xs">{stat.change}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tutorials, videos, FAQs..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* View Mode */}
                        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                                    selectedCategory === cat.id
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                        : 'bg-slate-900/50 text-slate-400 hover:text-white'
                                }`}
                            >
                                <cat.icon size={16} />
                                <span className="font-medium">{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex gap-2 mt-4">
                        {difficulties.map((diff) => (
                            <button
                                key={diff.id}
                                onClick={() => setSelectedDifficulty(diff.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDifficulty === diff.id
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-slate-900/50 text-slate-400 hover:text-white'
                                }`}
                            >
                                {diff.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-700">
                    {[
                        { id: 'videos', icon: Video, label: 'Video Tutorials', count: videos.length },
                        { id: 'tutorials', icon: Book, label: 'Written Guides', count: tutorials.length },
                        { id: 'community', icon: Users, label: 'Community', count: communities.length },
                        { id: 'faq', icon: HelpCircle, label: 'FAQ', count: faqs.length }
                    ].map((tab) => (
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
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                                {tab.count}
                            </span>
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
                    {/* Videos Tab */}
                    {activeTab === 'videos' && (
                        <motion.div
                            key="videos"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {filteredContent.videos.length === 0 ? (
                                <EmptyState
                                    icon={Video}
                                    title="No videos found"
                                    description="Try adjusting your filters or search query"
                                />
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredContent.videos.map((video) => (
                                        <VideoCard
                                            key={video._id}
                                            video={video}
                                            progress={progress[video._id]}
                                            isBookmarked={bookmarks.some(b => b.resourceId === video._id)}
                                            onPlay={() => {
                                                setSelectedVideo(video);
                                                setShowVideoModal(true);
                                            }}
                                            onBookmark={() => toggleBookmark(video._id, 'video')}
                                            onComplete={() => handleVideoComplete(video._id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredContent.videos.map((video) => (
                                        <VideoListItem
                                            key={video._id}
                                            video={video}
                                            progress={progress[video._id]}
                                            isBookmarked={bookmarks.some(b => b.resourceId === video._id)}
                                            onPlay={() => {
                                                setSelectedVideo(video);
                                                setShowVideoModal(true);
                                            }}
                                            onBookmark={() => toggleBookmark(video._id, 'video')}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Tutorials Tab */}
                    {activeTab === 'tutorials' && (
                        <motion.div
                            key="tutorials"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {filteredContent.tutorials.map((tutorial, index) => (
                                <TutorialCard
                                    key={tutorial._id}
                                    tutorial={tutorial}
                                    index={index}
                                    progress={progress[tutorial._id]}
                                    isBookmarked={bookmarks.some(b => b.resourceId === tutorial._id)}
                                    onStart={() => setSelectedTutorial(tutorial)}
                                    onBookmark={() => toggleBookmark(tutorial._id, 'tutorial')}
                                    onComplete={() => handleTutorialComplete(tutorial._id)}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Community Tab */}
                    {activeTab === 'community' && (
                        <motion.div
                            key="community"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {communities.map((community) => (
                                    <CommunityCard key={community._id} community={community} />
                                ))}
                            </div>

                            {/* Live Chat Section */}
                            <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <MessageSquare size={24} className="text-cyan-400" />
                                    Live Support Chat
                                </h3>
                                <div className="bg-slate-900/50 rounded-lg p-6 text-center">
                                    <MessageCircle size={48} className="text-cyan-400 mx-auto mb-4" />
                                    <p className="text-slate-400 mb-4">
                                        Get instant help from our community and support team
                                    </p>
                                    <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                                        Start Chat
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <motion.div
                            key="faq"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {filteredContent.faqs.map((faq) => (
                                <FAQCard
                                    key={faq._id}
                                    faq={faq}
                                    isExpanded={expandedFAQ === faq._id}
                                    onToggle={() => setExpandedFAQ(expandedFAQ === faq._id ? null : faq._id)}
                                    onRate={(rating) => rateResource(faq._id, rating)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Achievements Section */}
                {achievements.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Trophy size={24} className="text-yellow-400" />
                            Your Achievements
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {achievements.map((achievement) => (
                                <div
                                    key={achievement._id}
                                    className="bg-slate-900/50 rounded-lg p-4 text-center hover:bg-slate-900/70 transition-all cursor-pointer"
                                    title={achievement.description}
                                >
                                    <div className="text-4xl mb-2">{achievement.icon}</div>
                                    <p className="text-white text-sm font-medium">{achievement.name}</p>
                                    <p className="text-slate-400 text-xs mt-1">{achievement.points} pts</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {showVideoModal && selectedVideo && (
                    <VideoPlayerModal
                        video={selectedVideo}
                        onClose={() => {
                            setShowVideoModal(false);
                            setSelectedVideo(null);
                        }}
                        onComplete={() => handleVideoComplete(selectedVideo._id)}
                    />
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(100, 116, 139, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
            `}</style>
        </DashboardLayout>
    );
};

// Video Card Component
const VideoCard = ({ video, progress, isBookmarked, onPlay, onBookmark, onComplete }) => {
    const progressPercentage = progress?.progress || 0;
    const isCompleted = progress?.completed || false;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all group"
        >
            {/* Thumbnail */}
            <div className="relative h-48 bg-slate-900/50 cursor-pointer" onClick={onPlay}>
                {video.thumbnail ? (
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                        📹
                    </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={32} className="text-white ml-1" />
                    </div>
                </div>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                )}

                {/* Bookmark Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBookmark();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-slate-800/80 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
                >
                    {isBookmarked ? (
                        <BookmarkCheck size={16} className="text-cyan-400" />
                    ) : (
                        <Bookmark size={16} className="text-slate-400" />
                    )}
                </button>

                {/* Completed Badge */}
                {isCompleted && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-green-400 text-xs font-semibold">Completed</span>
                    </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium">
                    {video.duration}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        video.difficulty === 'beginner'
                            ? 'bg-green-500/20 text-green-400'
                            : video.difficulty === 'intermediate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {video.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-semibold">
                        {video.category}
                    </span>
                </div>

                <h4 className="text-white font-semibold mb-2 line-clamp-2">
                    {video.title}
                </h4>

                <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                    {video.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-slate-400">
                        <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {video.views?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <ThumbsUp size={14} />
                            {video.likes?.toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={onPlay}
                        className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                        Watch Now
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Video List Item Component
const VideoListItem = ({ video, progress, isBookmarked, onPlay, onBookmark }) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
            <div className="flex gap-4">
                {/* Thumbnail */}
                <div
                    className="w-48 h-28 bg-slate-900/50 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer relative group"
                    onClick={onPlay}
                >
                    {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📹</div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={24} className="text-white" />
                    </div>
                    <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/80 rounded text-white text-xs">
                        {video.duration}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    video.difficulty === 'beginner'
                                        ? 'bg-green-500/20 text-green-400'
                                        : video.difficulty === 'intermediate'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {video.difficulty}
                                </span>
                            </div>
                            <h4 className="text-white font-semibold mb-2">{video.title}</h4>
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Eye size={14} />
                                    {video.views?.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ThumbsUp size={14} />
                                    {video.likes?.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(video.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={onBookmark}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {isBookmarked ? (
                                    <BookmarkCheck size={18} className="text-cyan-400" />
                                ) : (
                                    <Bookmark size={18} className="text-slate-400" />
                                )}
                            </button>
                            <button
                                onClick={onPlay}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                            >
                                Watch
                            </button>
                        </div>
                    </div>

                    {progress?.progress > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{progress.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                    style={{ width: `${progress.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Tutorial Card Component
const TutorialCard = ({ tutorial, index, progress, isBookmarked, onStart, onBookmark, onComplete }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        progress?.completed
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : 'bg-cyan-500/20'
                    }`}>
                        {progress?.completed ? (
                            <CheckCircle size={28} className="text-green-400" />
                        ) : (
                            <FileText size={28} className="text-cyan-400" />
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                tutorial.difficulty === 'easy'
                                    ? 'bg-green-500/20 text-green-400'
                                    : tutorial.difficulty === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                {tutorial.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 text-sm">
                                <Clock size={14} />
                                {tutorial.estimatedTime}
                            </span>
                        </div>

                        <h4 className="text-white font-semibold text-lg mb-2">
                            {tutorial.title}
                        </h4>

                        <p className="text-slate-400 text-sm mb-4">
                            {tutorial.description}
                        </p>

                        {tutorial.steps && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Target size={14} className="text-cyan-400" />
                                <span>{tutorial.steps.length} steps</span>
                            </div>
                        )}

                        {progress?.progress > 0 && !progress?.completed && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>Progress</span>
                                    <span>{progress.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                        style={{ width: `${progress.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={onBookmark}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {isBookmarked ? (
                            <BookmarkCheck size={18} className="text-cyan-400" />
                        ) : (
                            <Bookmark size={18} className="text-slate-400" />
                        )}
                    </button>
                    
                    {progress?.completed ? (
                        <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold border border-green-500/30">
                            Completed ✓
                        </button>
                    ) : (
                        <button
                            onClick={onStart}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
                        >
                            {progress?.progress > 0 ? 'Continue' : 'Start'}
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Community Card Component
const CommunityCard = ({ community }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-center"
        >
            <div className="text-5xl mb-4">{community.icon}</div>
            <h4 className="text-white font-semibold text-lg mb-2">{community.name}</h4>
            <p className="text-slate-400 text-sm mb-4">{community.members} members</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-4 ${
                community.active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-slate-400'
            }`}>
                <div className={`w-2 h-2 rounded-full ${community.active ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm font-medium">
                    {community.active ? `${community.activeNow} online` : 'Offline'}
                </span>
            </div>
            <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                Join Community
            </button>
        </motion.div>
    );
};

// FAQ Card Component
const FAQCard = ({ faq, isExpanded, onToggle, onRate }) => {
    const [rating, setRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);

    const handleRate = (value) => {
        setRating(value);
        setHasRated(true);
        onRate(value);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
        >
            <button
                onClick={onToggle}
                className="w-full p-6 text-left hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-start gap-4">
                    <HelpCircle size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-2">
                            {faq.question}
                        </h4>
                        {!isExpanded && (
                            <p className="text-slate-400 text-sm line-clamp-2">
                                {faq.answer}
                            </p>
                        )}
                    </div>
                    <ChevronRight
                        size={20}
                        className={`text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                        }`}
                    />
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700/50"
                    >
                        <div className="p-6 pl-16">
                            <p className="text-slate-300 leading-relaxed mb-6">
                                {faq.answer}
                            </p>

                            {faq.relatedLinks && faq.relatedLinks.length > 0 && (
                                <div className="mb-6">
                                    <h5 className="text-white font-medium mb-3">Related Resources:</h5>
                                    <div className="space-y-2">
                                        {faq.relatedLinks.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                            >
                                                <ExternalLink size={14} />
                                                {link.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-700/50">
                                <p className="text-slate-400 text-sm mb-3">Was this helpful?</p>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => handleRate(value)}
                                            disabled={hasRated}
                                            className={`p-2 rounded transition-all ${
                                                hasRated
                                                    ? value <= rating
                                                        ? 'text-yellow-400'
                                                        : 'text-slate-600'
                                                    : 'text-slate-400 hover:text-yellow-400'
                                            }`}
                                        >
                                            <Star
                                                size={20}
                                                fill={hasRated && value <= rating ? 'currentColor' : 'none'}
                                            />
                                        </button>
                                    ))}
                                    {hasRated && (
                                        <span className="text-green-400 text-sm ml-2">
                                            Thank you for your feedback!
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Video Player Modal Component
const VideoPlayerModal = ({ video, onClose, onComplete }) => {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasCompleted, setHasCompleted] = useState(false);

    const handleProgress = (state) => {
        setProgress(state.played * 100);
        
        // Mark as completed at 90%
        if (state.played >= 0.9 && !hasCompleted) {
            setHasCompleted(true);
            onComplete();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-6xl bg-slate-800 rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div>
                        <h3 className="text-white font-semibold text-lg">{video.title}</h3>
                        <p className="text-slate-400 text-sm">{video.duration}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Video Player */}
                <div className="relative bg-black aspect-video">
                    <ReactPlayer
                        url={video.videoUrl}
                        playing={playing}
                        controls
                        width="100%"
                        height="100%"
                        onProgress={handleProgress}
                        config={{
                            youtube: {
                                playerVars: { showinfo: 1 }
                            }
                        }}
                    />
                </div>

                {/* Description */}
                <div className="p-6">
                    <p className="text-slate-300 leading-relaxed">
                        {video.description}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description }) => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <Icon size={64} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">{title}</h3>
                <p className="text-slate-500">{description}</p>
            </div>
        </div>
    );
};

export default LearningCenter;