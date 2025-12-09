import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff,
    MessageSquare, User, Briefcase, Calendar, ExternalLink,
    Search, Filter, Grid, List, ChevronUp, ChevronDown,
    Save, X, Upload, Award, Download, RefreshCw, Check,
    Clock, TrendingUp, Users, Shield, Mail, Linkedin,
    Globe, Tag, BarChart2, AlertCircle, CheckCircle
} from 'lucide-react';
import apiService from '../../services/api.service';
import '../../styles/TestimonialManager.css';

const TestimonialManager = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [stats, setStats] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        loadTestimonials();
        loadStats();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadTestimonials = async () => {
        try {
            setLoading(true);
            const response = await apiService.getTestimonials();
            if (response.success) {
                setTestimonials(response.testimonials);
            }
        } catch (error) {
            console.error('Error loading testimonials:', error);
            showNotification('Failed to load testimonials', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getTestimonialStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleAddTestimonial = async (testimonialData) => {
        try {
            const response = await apiService.createTestimonial(testimonialData);
            if (response.success) {
                setTestimonials([response.testimonial, ...testimonials]);
                setShowAddModal(false);
                showNotification('Testimonial added successfully');
                loadStats();
            }
        } catch (error) {
            console.error('Error adding testimonial:', error);
            showNotification('Failed to add testimonial', 'error');
        }
    };

    const handleUpdateTestimonial = async (id, testimonialData) => {
        try {
            const response = await apiService.updateTestimonial(id, testimonialData);
            if (response.success) {
                setTestimonials(testimonials.map(t => 
                    t._id === id ? response.testimonial : t
                ));
                setShowEditModal(false);
                setEditingTestimonial(null);
                showNotification('Testimonial updated successfully');
                loadStats();
            }
        } catch (error) {
            console.error('Error updating testimonial:', error);
            showNotification('Failed to update testimonial', 'error');
        }
    };

    const handleDeleteTestimonial = async (id) => {
        if (window.confirm('Are you sure you want to delete this testimonial?')) {
            try {
                const response = await apiService.deleteTestimonial(id);
                if (response.success) {
                    setTestimonials(testimonials.filter(t => t._id !== id));
                    showNotification('Testimonial deleted successfully');
                    loadStats();
                }
            } catch (error) {
                console.error('Error deleting testimonial:', error);
                showNotification('Failed to delete testimonial', 'error');
            }
        }
    };

    const handleToggleVisibility = async (id) => {
        try {
            const response = await apiService.toggleTestimonialVisibility(id);
            if (response.success) {
                setTestimonials(testimonials.map(t => 
                    t._id === id ? response.testimonial : t
                ));
                showNotification(`Testimonial ${response.testimonial.visible ? 'shown' : 'hidden'}`);
            }
        } catch (error) {
            console.error('Error toggling visibility:', error);
            showNotification('Failed to toggle visibility', 'error');
        }
    };

    const handleToggleFeatured = async (id) => {
        try {
            const response = await apiService.toggleTestimonialFeatured(id);
            if (response.success) {
                setTestimonials(testimonials.map(t => 
                    t._id === id ? response.testimonial : t
                ));
                showNotification(`Testimonial ${response.testimonial.featured ? 'featured' : 'unfeatured'}`);
                loadStats();
            }
        } catch (error) {
            console.error('Error toggling featured:', error);
            showNotification('Failed to toggle featured', 'error');
        }
    };

    const handleToggleVerified = async (id) => {
        try {
            const response = await apiService.toggleTestimonialVerified(id);
            if (response.success) {
                setTestimonials(testimonials.map(t => 
                    t._id === id ? response.testimonial : t
                ));
                showNotification(`Testimonial ${response.testimonial.verified ? 'verified' : 'unverified'}`);
            }
        } catch (error) {
            console.error('Error toggling verified:', error);
            showNotification('Failed to toggle verified', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Delete ${selectedItems.length} testimonial(s)?`)) {
            try {
                const response = await apiService.bulkDeleteTestimonials(selectedItems);
                if (response.success) {
                    setTestimonials(testimonials.filter(t => !selectedItems.includes(t._id)));
                    setSelectedItems([]);
                    setShowBulkActions(false);
                    showNotification(`${response.deletedCount} testimonial(s) deleted`);
                    loadStats();
                }
            } catch (error) {
                console.error('Error bulk deleting:', error);
                showNotification('Failed to delete testimonials', 'error');
            }
        }
    };

    const handleBulkUpdate = async (updates) => {
        try {
            const response = await apiService.bulkUpdateTestimonials(selectedItems, updates);
            if (response.success) {
                loadTestimonials();
                setSelectedItems([]);
                setShowBulkActions(false);
                showNotification(`${response.modifiedCount} testimonial(s) updated`);
                loadStats();
            }
        } catch (error) {
            console.error('Error bulk updating:', error);
            showNotification('Failed to update testimonials', 'error');
        }
    };

    const handleExportJSON = async () => {
        try {
            const response = await apiService.exportTestimonialsJSON();
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `testimonials_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNotification('Testimonials exported as JSON');
        } catch (error) {
            console.error('Error exporting JSON:', error);
            showNotification('Failed to export', 'error');
        }
    };

    const handleExportCSV = async () => {
        try {
            const blob = await apiService.exportTestimonialsCSV();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `testimonials_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
            
            showNotification('Testimonials exported as CSV');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            showNotification('Failed to export', 'error');
        }
    };

    const toggleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredAndSortedTestimonials.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredAndSortedTestimonials.map(t => t._id));
        }
    };

    const filteredAndSortedTestimonials = testimonials
        .filter(testimonial => {
            const matchesSearch = testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               testimonial.position?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = filterStatus === 'all' ||
                               (filterStatus === 'visible' && testimonial.visible) ||
                               (filterStatus === 'hidden' && !testimonial.visible) ||
                               (filterStatus === 'featured' && testimonial.featured) ||
                               (filterStatus === 'verified' && testimonial.verified);
            
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'rating':
                    comparison = b.rating - a.rating;
                    break;
                case 'date':
                    comparison = new Date(b.date) - new Date(a.date);
                    break;
                case 'company':
                    comparison = (a.company || '').localeCompare(b.company || '');
                    break;
                case 'createdAt':
                    comparison = new Date(b.createdAt) - new Date(a.createdAt);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    if (loading) {
        return (
            <div className="testimonial-manager-loading">
                <div className="loader-spinner"></div>
                <p>Loading testimonials...</p>
            </div>
        );
    }

    return (
        <div className="testimonial-manager">
            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`notification-toast ${notification.type}`}
                    >
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span>{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="manager-header">
                <div className="header-left">
                    <h1>Testimonials Management</h1>
                    <p className="header-subtitle">Manage client testimonials and reviews</p>
                </div>
                <div className="header-actions">
                    <button
                        onClick={loadTestimonials}
                        className="btn-icon"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={handleExportJSON}
                        className="btn-secondary"
                        title="Export JSON"
                    >
                        <Download size={20} />
                        <span>JSON</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="btn-secondary"
                        title="Export CSV"
                    >
                        <Download size={20} />
                        <span>CSV</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                    >
                        <Plus size={20} />
                        <span>Add Testimonial</span>
                    </button>
                </div>
            </div>

            {/* Statistics Dashboard */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">
                            <MessageSquare size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Testimonials</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-visible">
                        <div className="stat-icon">
                            <Eye size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Visible</div>
                            <div className="stat-value">{stats.visible}</div>
                            <div className="stat-trend">
                                {((stats.visible / stats.total) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-featured">
                        <div className="stat-icon">
                            <Star size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Featured</div>
                            <div className="stat-value">{stats.featured}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-verified">
                        <div className="stat-icon">
                            <Shield size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Verified</div>
                            <div className="stat-value">{stats.verified}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-rating">
                        <div className="stat-icon">
                            <Award size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Average Rating</div>
                            <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
                            <div className="stat-stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        className={i < Math.round(stats.averageRating) ? 'filled' : 'empty'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-recent">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">This Month</div>
                            <div className="stat-value">{stats.recentCount}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className="controls-bar">
                <div className="controls-left">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search testimonials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="clear-search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="visible">Visible Only</option>
                        <option value="hidden">Hidden Only</option>
                        <option value="featured">Featured Only</option>
                        <option value="verified">Verified Only</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="createdAt">Created Date</option>
                        <option value="date">Testimonial Date</option>
                        <option value="name">Name</option>
                        <option value="rating">Rating</option>
                        <option value="company">Company</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="btn-icon"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                <div className="controls-right">
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'active' : ''}
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'active' : ''}
                        >
                            <List size={20} />
                        </button>
                    </div>

                    {selectedItems.length > 0 && (
                        <button
                            onClick={() => setShowBulkActions(!showBulkActions)}
                            className="btn-secondary"
                        >
                            Bulk Actions ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Actions Panel */}
            <AnimatePresence>
                {showBulkActions && selectedItems.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bulk-actions-panel"
                    >
                        <div className="bulk-actions-content">
                            <span className="bulk-label">
                                {selectedItems.length} item(s) selected
                            </span>
                            <div className="bulk-buttons">
                                <button
                                    onClick={() => handleBulkUpdate({ visible: true })}
                                    className="bulk-btn"
                                >
                                    <Eye size={16} />
                                    Show All
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate({ visible: false })}
                                    className="bulk-btn"
                                >
                                    <EyeOff size={16} />
                                    Hide All
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate({ featured: true })}
                                    className="bulk-btn"
                                >
                                    <Star size={16} />
                                    Feature All
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate({ verified: true })}
                                    className="bulk-btn"
                                >
                                    <Shield size={16} />
                                    Verify All
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="bulk-btn danger"
                                >
                                    <Trash2 size={16} />
                                    Delete All
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedItems([]);
                                    setShowBulkActions(false);
                                }}
                                className="bulk-close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Info */}
            <div className="results-info">
                <div className="results-count">
                    Showing {filteredAndSortedTestimonials.length} of {testimonials.length} testimonial(s)
                </div>
                {filteredAndSortedTestimonials.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="select-all-btn"
                    >
                        {selectedItems.length === filteredAndSortedTestimonials.length ? (
                            <>
                                <Check size={16} />
                                Deselect All
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                Select All
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Testimonials Grid/List */}
            {filteredAndSortedTestimonials.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare size={64} />
                    <h3>No testimonials found</h3>
                    <p>
                        {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first testimonial'}
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                    >
                        <Plus size={20} />
                        Add Testimonial
                    </button>
                </div>
            ) : (
                <div className={`testimonials-container ${viewMode}`}>
                    <AnimatePresence>
                        {filteredAndSortedTestimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className={`testimonial-item ${selectedItems.includes(testimonial._id) ? 'selected' : ''}`}
                            >
                                {/* Selection Checkbox */}
                                <div className="selection-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(testimonial._id)}
                                        onChange={() => toggleSelectItem(testimonial._id)}
                                    />
                                </div>

                                {/* Content */}
                                <div className="testimonial-content">
                                    {/* Header */}
                                    <div className="testimonial-header">
                                        <img
                                            src={testimonial.avatar || 'https://ui-avatars.com/api/?name=' + testimonial.name}
                                            alt={testimonial.name}
                                            className="testimonial-avatar"
                                        />
                                        <div className="testimonial-info">
                                            <h3 className="testimonial-name">
                                                {testimonial.name}
                                                {testimonial.verified && (
                                                    <span className="verified-badge" title="Verified">
                                                        <Shield size={14} />
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="testimonial-position">
                                                {testimonial.position}
                                                {testimonial.company && ` @ ${testimonial.company}`}
                                            </p>
                                        </div>
                                        <div className="testimonial-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={i < testimonial.rating ? 'filled' : 'empty'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Testimonial Text */}
                                    <blockquote className="testimonial-text">
                                        "{testimonial.content}"
                                    </blockquote>

                                    {/* Tags */}
                                    {testimonial.tags && testimonial.tags.length > 0 && (
                                        <div className="testimonial-tags">
                                            {testimonial.tags.map((tag, i) => (
                                                <span key={i} className="tag">
                                                    <Tag size={12} />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Project Info */}
                                    {testimonial.project && (
                                        <div className="testimonial-project">
                                            <Briefcase size={14} />
                                            <span>{testimonial.project}</span>
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="testimonial-meta">
                                        <div className="meta-left">
                                            <span className="meta-date">
                                                <Calendar size={14} />
                                                {new Date(testimonial.date || testimonial.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            {testimonial.views > 0 && (
                                                <span className="meta-views">
                                                    <Eye size={14} />
                                                    {testimonial.views} views
                                                </span>
                                            )}
                                        </div>
                                        <div className="meta-badges">
                                            {testimonial.featured && (
                                                <span className="badge badge-featured">
                                                    <Star size={12} />
                                                    Featured
                                                </span>
                                            )}
                                            {!testimonial.visible && (
                                                <span className="badge badge-hidden">
                                                    <EyeOff size={12} />
                                                    Hidden
                                                </span>
                                            )}
                                            {testimonial.source && (
                                                <span className="badge badge-source">
                                                    {testimonial.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    {(testimonial.email || testimonial.website || testimonial.linkedin) && (
                                        <div className="testimonial-social">
                                            {testimonial.email && (
                                                <a href={`mailto:${testimonial.email}`} title="Email">
                                                    <Mail size={16} />
                                                </a>
                                            )}
                                            {testimonial.website && (
                                                <a href={testimonial.website} target="_blank" rel="noopener noreferrer" title="Website">
                                                    <Globe size={16} />
                                                </a>
                                            )}
                                            {testimonial.linkedin && (
                                                <a href={testimonial.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                                    <Linkedin size={16} />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="testimonial-actions">
                                    <button
                                        onClick={() => handleToggleVisibility(testimonial._id)}
                                        className={`action-btn ${testimonial.visible ? 'active' : ''}`}
                                        title={testimonial.visible ? 'Hide' : 'Show'}
                                    >
                                        {testimonial.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleToggleFeatured(testimonial._id)}
                                        className={`action-btn ${testimonial.featured ? 'active' : ''}`}
                                        title={testimonial.featured ? 'Unfeature' : 'Feature'}
                                    >
                                        <Star size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleVerified(testimonial._id)}
                                        className={`action-btn ${testimonial.verified ? 'active' : ''}`}
                                        title={testimonial.verified ? 'Unverify' : 'Verify'}
                                    >
                                        <Shield size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingTestimonial(testimonial);
                                            setShowEditModal(true);
                                        }}
                                        className="action-btn edit"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTestimonial(testimonial._id)}
                                        className="action-btn delete"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Modal */}
            <TestimonialModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddTestimonial}
                title="Add New Testimonial"
            />

            {/* Edit Modal */}
            <TestimonialModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingTestimonial(null);
                }}
                onSave={(data) => handleUpdateTestimonial(editingTestimonial._id, data)}
                title="Edit Testimonial"
                testimonial={editingTestimonial}
            />
        </div>
    );
};

// =============================================
// TESTIMONIAL MODAL COMPONENT
// =============================================

const TestimonialModal = ({ show, onClose, onSave, title, testimonial }) => {
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        company: '',
        avatar: '',
        rating: 5,
        content: '',
        featured: false,
        visible: true,
        verified: false,
        email: '',
        website: '',
        linkedin: '',
        project: '',
        tags: [],
        date: new Date().toISOString().split('T')[0]
    });

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (testimonial) {
            setFormData({
                name: testimonial.name || '',
                position: testimonial.position || '',
                company: testimonial.company || '',
                avatar: testimonial.avatar || '',
                rating: testimonial.rating || 5,
                content: testimonial.content || '',
                featured: testimonial.featured || false,
                visible: testimonial.visible !== undefined ? testimonial.visible : true,
                verified: testimonial.verified || false,
                email: testimonial.email || '',
                website: testimonial.website || '',
                linkedin: testimonial.linkedin || '',
                project: testimonial.project || '',
                tags: testimonial.tags || [],
                date: testimonial.date ? new Date(testimonial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            setFormData({
                name: '',
                position: '',
                company: '',
                avatar: '',
                rating: 5,
                content: '',
                featured: false,
                visible: true,
                verified: false,
                email: '',
                website: '',
                linkedin: '',
                project: '',
                tags: [],
                date: new Date().toISOString().split('T')[0]
            });
        }
        setErrors({});
    }, [testimonial, show]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.position.trim()) {
            newErrors.position = 'Position is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Testimonial content is required';
        } else if (formData.content.length < 10) {
            newErrors.content = 'Content must be at least 10 characters';
        }

        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()]
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        {/* Name */}
                        <div className="form-group">
                            <label>
                                Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={errors.name ? 'error' : ''}
                                placeholder="John Doe"
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        {/* Position */}
                        <div className="form-group">
                            <label>
                                Position <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className={errors.position ? 'error' : ''}
                                placeholder="CEO"
                            />
                            {errors.position && <span className="error-message">{errors.position}</span>}
                        </div>

                        {/* Company */}
                        <div className="form-group">
                            <label>Company</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Acme Inc."
                            />
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        {/* Avatar URL */}
                        <div className="form-group full-width">
                            <label>Avatar URL</label>
                            <input
                                type="url"
                                value={formData.avatar}
                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                placeholder="https://example.com/avatar.jpg"
                            />
                            {formData.avatar && (
                                <div className="avatar-preview">
                                    <img src={formData.avatar} alt="Preview" />
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={errors.email ? 'error' : ''}
                                placeholder="john@example.com"
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        {/* Website */}
                        <div className="form-group">
                            <label>Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>

                        {/* LinkedIn */}
                        <div className="form-group full-width">
                            <label>LinkedIn Profile</label>
                            <input
                                type="url"
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/johndoe"
                            />
                        </div>

                        {/* Project */}
                        <div className="form-group full-width">
                            <label>Project Name</label>
                            <input
                                type="text"
                                value={formData.project}
                                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                placeholder="E-commerce Platform"
                            />
                        </div>

                        {/* Rating */}
                        <div className="form-group full-width">
                            <label>
                                Rating <span className="required">*</span>
                            </label>
                            <div className="rating-selector">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        className="rating-star"
                                    >
                                        <Star
                                            size={32}
                                            className={star <= formData.rating ? 'filled' : 'empty'}
                                        />
                                    </button>
                                ))}
                                <span className="rating-text">({formData.rating} stars)</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="form-group full-width">
                            <label>
                                Testimonial Content <span className="required">*</span>
                            </label>
                            <textarea
                                rows={5}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className={errors.content ? 'error' : ''}
                                placeholder="Write the testimonial content here..."
                            />
                            <div className="char-counter">
                                {formData.content.length} / 1000 characters
                            </div>
                            {errors.content && <span className="error-message">{errors.content}</span>}
                        </div>

                        {/* Tags */}
                        <div className="form-group full-width">
                            <label>Tags (Technologies, Skills, etc.)</label>
                            <div className="tag-input-container">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Type and press Enter"
                                />
                                <button type="button" onClick={addTag} className="add-tag-btn">
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="tags-list">
                                    {formData.tags.map((tag, i) => (
                                        <span key={i} className="tag-item">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="remove-tag"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Checkboxes */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.visible}
                                        onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                                    />
                                    <span>Visible on public page</span>
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    />
                                    <span>Featured testimonial</span>
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.verified}
                                        onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                                    />
                                    <span>Verified testimonial</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                        >
                            <Save size={18} />
                            {testimonial ? 'Update' : 'Create'} Testimonial
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default TestimonialManager;