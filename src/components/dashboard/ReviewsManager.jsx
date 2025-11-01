import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, Check, X, Eye, MessageSquare, ThumbsUp, Filter, Search, 
    RefreshCw, Calendar, User, MoreVertical, Reply, Trash2, Edit2,
    Download, TrendingUp, BarChart, PieChart, Award, AlertCircle,
    CheckCircle, XCircle, Clock, Send, Copy, ChevronDown, ChevronUp,
    ExternalLink, Mail, Heart, Flag, Archive, Bookmark, Settings,
    Users, Activity, TrendingDown, Zap, Target, Shield, Globe,
    Lock, Unlock, Pin, Smile, ThumbsDown, Share2, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const ReviewsManager = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { on, off } = useSocket();
    const { success, error, info } = useNotifications();

    // State Management
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(10);
    const [selectedReviews, setSelectedReviews] = useState([]);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const [ratingFilter, setRatingFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [replyTemplates, setReplyTemplates] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [featuredReviews, setFeaturedReviews] = useState([]);

    const replyTemplatesData = [
        {
            id: 1,
            title: 'Thank You',
            content: 'Thank you so much for your wonderful review! We\'re thrilled to hear about your positive experience. Your feedback means a lot to us!'
        },
        {
            id: 2,
            title: 'Appreciation',
            content: 'We truly appreciate you taking the time to share your experience. Your kind words motivate us to keep delivering excellent work!'
        },
        {
            id: 3,
            title: 'Constructive Feedback',
            content: 'Thank you for your honest feedback. We value your input and will use it to improve our services. We appreciate your patience and understanding.'
        },
        {
            id: 4,
            title: 'Follow-up',
            content: 'Thank you for your review! We\'d love to stay in touch. Feel free to reach out if you have any questions or need further assistance.'
        }
    ];

    // Load data
    useEffect(() => {
        if (isOwner()) {
            loadReviews();
            loadAnalytics();
            loadFeaturedReviews();

            // Socket listeners
            const handleNewReview = (review) => {
                setReviews(prev => [review, ...prev]);
                info(`New review from ${review.name}`);
                loadAnalytics();
            };

            on('new_review', handleNewReview);

            return () => {
                off('new_review', handleNewReview);
            };
        }
    }, [filter, sortBy, sortOrder, currentPage, isOwner, on, off]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await apiService.getReviews({
                status: filter,
                sortBy,
                sortOrder,
                page: currentPage,
                limit: reviewsPerPage,
                search: searchQuery,
                rating: ratingFilter,
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            
            if (response.success) {
                setReviews(response.reviews || []);
                setStats(response.stats || {});
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await apiService.getReviewAnalytics();
            if (response.success) {
                setAnalytics(response.analytics);
            }
        } catch (err) {
            console.error('Error loading analytics:', err);
        }
    };

    const loadFeaturedReviews = async () => {
        try {
            const response = await apiService.getFeaturedReviews();
            if (response.success) {
                setFeaturedReviews(response.reviews || []);
            }
        } catch (err) {
            console.error('Error loading featured reviews:', err);
        }
    };

    const handleModerate = async (reviewId, status, responseText = '') => {
        try {
            const response = await apiService.moderateReview(reviewId, {
                status,
                response: responseText
            });
            
            if (response.success) {
                setReviews(prev => prev.map(r => 
                    r._id === reviewId ? { ...r, status, response: responseText } : r
                ));
                success(`Review ${status}`);
                loadAnalytics();
            }
        } catch (err) {
            console.error('Error moderating review:', err);
            error('Failed to moderate review');
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) {
            error('Please enter a reply');
            return;
        }

        try {
            const response = await apiService.replyToReview(selectedReview._id, {
                response: replyText
            });

            if (response.success) {
                setReviews(prev => prev.map(r => 
                    r._id === selectedReview._id ? { ...r, response: replyText } : r
                ));
                success('Reply sent successfully');
                setShowReplyModal(false);
                setReplyText('');
                setSelectedReview(null);
            }
        } catch (err) {
            error('Failed to send reply');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedReviews.length === 0) {
            error('No reviews selected');
            return;
        }

        try {
            let response;
            switch (action) {
                case 'approve':
                    response = await apiService.bulkModerateReviews(selectedReviews, 'approved');
                    break;
                case 'reject':
                    response = await apiService.bulkModerateReviews(selectedReviews, 'rejected');
                    break;
                case 'delete':
                    if (!confirm(`Delete ${selectedReviews.length} reviews?`)) return;
                    response = await apiService.bulkDeleteReviews(selectedReviews);
                    break;
                default:
                    return;
            }

            if (response.success) {
                success(`Bulk ${action} completed`);
                setSelectedReviews([]);
                loadReviews();
            }
        } catch (err) {
            error(`Bulk ${action} failed`);
        }
    };

    const handleToggleFeatured = async (reviewId, isFeatured) => {
        try {
            const response = await apiService.toggleFeaturedReview(reviewId, !isFeatured);
            if (response.success) {
                setReviews(prev => prev.map(r => 
                    r._id === reviewId ? { ...r, featured: !isFeatured } : r
                ));
                success(isFeatured ? 'Removed from featured' : 'Added to featured');
                loadFeaturedReviews();
            }
        } catch (err) {
            error('Failed to update featured status');
        }
    };

    const handleTogglePublic = async (reviewId, isPublic) => {
        try {
            const response = await apiService.toggleReviewVisibility(reviewId, !isPublic);
            if (response.success) {
                setReviews(prev => prev.map(r => 
                    r._id === reviewId ? { ...r, isPublic: !isPublic } : r
                ));
                success(isPublic ? 'Made private' : 'Made public');
            }
        } catch (err) {
            error('Failed to update visibility');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const response = await apiService.deleteReview(reviewId);
            if (response.success) {
                setReviews(prev => prev.filter(r => r._id !== reviewId));
                success('Review deleted');
                loadAnalytics();
            }
        } catch (err) {
            error('Failed to delete review');
        }
    };

    const exportReviews = async () => {
        try {
            const response = await apiService.exportReviews({
                status: filter,
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reviews-${Date.now()}.csv`;
            a.click();
            success('Reviews exported successfully');
        } catch (err) {
            error('Export failed');
        }
    };

    const renderStars = (rating) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={`${
                        star <= rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleSelectReview = (reviewId) => {
        setSelectedReviews(prev =>
            prev.includes(reviewId)
                ? prev.filter(id => id !== reviewId)
                : [...prev, reviewId]
        );
    };

    const selectAllReviews = () => {
        if (selectedReviews.length === reviews.length) {
            setSelectedReviews([]);
        } else {
            setSelectedReviews(reviews.map(r => r._id));
        }
    };

    const applyTemplate = (template) => {
        setReplyText(template.content);
        setShowTemplates(false);
    };

    // Filtered and sorted reviews
    const filteredReviews = reviews.filter(review => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
                !review.name.toLowerCase().includes(query) &&
                !review.comment.toLowerCase().includes(query) &&
                !review.email?.toLowerCase().includes(query)
            ) {
                return false;
            }
        }

        if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) {
            return false;
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    const paginatedReviews = filteredReviews.slice(
        (currentPage - 1) * reviewsPerPage,
        currentPage * reviewsPerPage
    );

    // Access check
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 max-w-md">
                        <MessageSquare size={64} className="text-red-500 mx-auto mb-5" />
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-3">
                            Access Restricted
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Review management is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout 
            title="Reviews Manager" 
            subtitle="Manage and moderate portfolio reviews"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Average Rating</span>
                        <Star className="text-yellow-600 dark:text-yellow-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                        {stats?.avgRating?.toFixed(1) || '0.0'}
                    </div>
                    {renderStars(Math.round(stats?.avgRating || 0))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total Reviews</span>
                        <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {stats?.totalReviews || 0}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">All time</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-green-700 dark:text-green-300">Approved</span>
                        <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {reviews.filter(r => r.status === 'approved').length}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Published</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Pending</span>
                        <Clock className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {reviews.filter(r => r.status === 'pending').length}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Awaiting review</p>
                </motion.div>
            </div>

            {/* Analytics Toggle */}
            <div className="mb-6">
                <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                    <BarChart size={18} />
                    {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    {showAnalytics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Analytics Section */}
            <AnimatePresence>
                {showAnalytics && analytics && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Rating Distribution */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <PieChart size={20} />
                                    Rating Distribution
                                </h3>
                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map(rating => {
                                        const count = analytics.ratingDistribution?.[rating] || 0;
                                        const percentage = stats?.totalReviews 
                                            ? (count / stats.totalReviews * 100).toFixed(1)
                                            : 0;

                                        return (
                                            <div key={rating} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-20">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {rating}
                                                    </span>
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                </div>
                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-yellow-400 h-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                                                    {count} ({percentage}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Trends */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Recent Trends
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {analytics.thisMonth || 0}
                                            </p>
                                        </div>
                                        <TrendingUp className="text-green-600" size={32} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Last Month</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {analytics.lastMonth || 0}
                                            </p>
                                        </div>
                                        <Activity className="text-blue-600" size={32} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {analytics.responseRate || 0}%
                                            </p>
                                        </div>
                                        <Target className="text-purple-600" size={32} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {/* Status Filter */}
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                            {['pending', 'approved', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        filter === status
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        >
                            <option value="createdAt">Date</option>
                            <option value="rating">Rating</option>
                            <option value="name">Name</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>

                        <button
                            onClick={exportReviews}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
                        >
                            <Download size={18} />
                            Export
                        </button>

                        <button
                            onClick={loadReviews}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {selectedReviews.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedReviews.length} review{selectedReviews.length !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkAction('approve')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Check size={16} />
                                    Approve All
                                </button>
                                <button
                                    onClick={() => handleBulkAction('reject')}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <X size={16} />
                                    Reject All
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedReviews([])}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="space-y-4 mb-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
                    </div>
                ) : paginatedReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <MessageSquare size={64} className="text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No reviews found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery ? 'Try adjusting your search' : 'No reviews to display'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <input
                                type="checkbox"
                                checked={selectedReviews.length === reviews.length}
                                onChange={selectAllReviews}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Select all {reviews.length} reviews
                            </span>
                        </div>

                        {/* Review Cards */}
                        <AnimatePresence>
                            {paginatedReviews.map((review, index) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedReviews.includes(review._id)}
                                            onChange={() => toggleSelectReview(review._id)}
                                            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />

                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                            {review.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                        {review.name}
                                                    </h4>
                                                    {review.email && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            {review.email}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {renderStars(review.rating)}
                                                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <Calendar size={14} />
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status & Actions */}
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        review.status === 'approved'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : review.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {review.status}
                                                    </span>

                                                    {review.featured && (
                                                        <Star className="text-yellow-500 fill-yellow-500" size={16} />
                                                    )}

                                                    {review.isPublic ? (
                                                        <Globe className="text-green-500" size={16} />
                                                    ) : (
                                                        <Lock className="text-gray-400" size={16} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Review Title */}
                                            {review.title && (
                                                <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                                    {review.title}
                                                </h5>
                                            )}

                                            {/* Review Comment */}
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                                {review.comment}
                                            </p>

                                            {/* Category Ratings */}
                                            {review.categories && Object.keys(review.categories).some(k => review.categories[k] > 0) && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    {Object.entries(review.categories).map(([key, value]) => 
                                                        value > 0 && (
                                                            <div key={key}>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                                                                    {key}
                                                                </p>
                                                                {renderStars(value)}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Response */}
                                            {review.response && (
                                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Reply size={16} className="text-blue-600" />
                                                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                                            Your Response
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {review.response}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {review.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleModerate(review._id, 'approved')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <Check size={16} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleModerate(review._id, 'rejected')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <X size={16} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setReplyText(review.response || '');
                                                        setShowReplyModal(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Reply size={16} />
                                                    {review.response ? 'Edit Reply' : 'Reply'}
                                                </button>

                                                <button
                                                    onClick={() => handleToggleFeatured(review._id, review.featured)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        review.featured
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <Star size={16} className={review.featured ? 'fill-current' : ''} />
                                                    {review.featured ? 'Unfeature' : 'Feature'}
                                                </button>

                                                <button
                                                    onClick={() => handleTogglePublic(review._id, review.isPublic)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    {review.isPublic ? <Lock size={16} /> : <Unlock size={16} />}
                                                    {review.isPublic ? 'Make Private' : 'Make Public'}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteReview(review._id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(currentPage - 1) * reviewsPerPage + 1} to{' '}
                        {Math.min(currentPage * reviewsPerPage, filteredReviews.length)} of{' '}
                        {filteredReviews.length} reviews
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && selectedReview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowReplyModal(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Reply to Review
                                </h3>
                                <button
                                    onClick={() => setShowReplyModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Review Preview */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {selectedReview.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedReview.name}
                                            </p>
                                            {renderStars(selectedReview.rating)}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {selectedReview.comment}
                                    </p>
                                </div>

                                {/* Templates */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => setShowTemplates(!showTemplates)}
                                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        <FileText size={16} />
                                        {showTemplates ? 'Hide' : 'Use'} Templates
                                    </button>
                                </div>

                                {showTemplates && (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {replyTemplatesData.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => applyTemplate(template)}
                                                className="p-3 text-left bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                    {template.title}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {template.content}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Text */}
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={6}
                                    placeholder="Write your reply..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                                />

                                {/* Actions */}
                                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={20} />
                                        Send Reply
                                    </button>
                                    <button
                                        onClick={() => setShowReplyModal(false)}
                                        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default ReviewsManager;