import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Star, Check, X, Eye, MessageSquare, ThumbsUp, 
    Filter, Search, RefreshCw, Calendar, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const ReviewsManager = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOwner()) {
            fetchReviews();
        }
    }, [filter, isOwner]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await apiService.request(`/tracking/reviews?status=${filter}&limit=50`);
            
            if (response.success) {
                setReviews(response.reviews || []);
                setStats(response.stats || {});
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (reviewId, status, response = '') => {
        try {
            await apiService.request(`/tracking/review/${reviewId}/moderate`, {
                method: 'PATCH',
                body: JSON.stringify({ status, response })
            });
            
            fetchReviews();
        } catch (error) {
            console.error('Error moderating review:', error);
        }
    };

    const renderStars = (rating) => (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={16}
                    fill={star <= rating ? '#fbbf24' : 'none'}
                    stroke={star <= rating ? '#fbbf24' : '#6b7280'}
                />
            ))}
        </div>
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredReviews = reviews.filter(review =>
        review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <MessageSquare size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px'
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary }}>
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
            <div style={{ padding: '24px' }}>
                {/* Stats */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            padding: '24px',
                            background: `${theme.surface}60`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '12px'
                            }}>
                                <Star size={24} style={{ color: '#fbbf24' }} />
                                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
                                    Average Rating
                                </span>
                            </div>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: theme.text
                            }}>
                                {stats.avgRating?.toFixed(1) || '0.0'}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                {renderStars(Math.round(stats.avgRating || 0))}
                            </div>
                        </div>

                        <div style={{
                            padding: '24px',
                            background: `${theme.surface}60`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '12px'
                            }}>
                                <MessageSquare size={24} style={{ color: theme.primary }} />
                                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
                                    Total Reviews
                                </span>
                            </div>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: theme.text
                            }}>
                                {stats.totalReviews || 0}
                            </div>
                        </div>

                        <div style={{
                            padding: '24px',
                            background: `${theme.surface}60`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '12px'
                            }}>
                                <Eye size={24} style={{ color: '#f59e0b' }} />
                                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
                                    Pending
                                </span>
                            </div>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: theme.text
                            }}>
                                {reviews.filter(r => r.status === 'pending').length || 0}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: theme.textSecondary
                        }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search reviews..."
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 42px',
                                background: `${theme.surface}60`,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                color: theme.text,
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['pending', 'approved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                style={{
                                    padding: '12px 20px',
                                    background: filter === status ? theme.gradient : 'transparent',
                                    color: filter === status ? theme.background : theme.text,
                                    border: `1px solid ${filter === status ? 'transparent' : theme.border}`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchReviews}
                        style={{
                            padding: '12px 20px',
                            background: `${theme.primary}20`,
                            border: `1px solid ${theme.primary}`,
                            borderRadius: '10px',
                            color: theme.primary,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {/* Reviews List */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px',
                        color: theme.textSecondary
                    }}>
                        <RefreshCw size={48} className="spin" />
                        <p>Loading reviews...</p>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px',
                        color: theme.textSecondary
                    }}>
                        <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No reviews found</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredReviews.map((review) => (
                            <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '24px',
                                    background: `${theme.surface}60`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '16px'
                                }}
                            >
                                {/* Review Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: theme.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: theme.background,
                                                fontWeight: '600',
                                                fontSize: '16px'
                                            }}>
                                                {review.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{
                                                    color: theme.text,
                                                    fontWeight: '600',
                                                    fontSize: '16px'
                                                }}>
                                                    {review.name}
                                                </div>
                                                {review.email && (
                                                    <div style={{
                                                        color: theme.textSecondary,
                                                        fontSize: '13px'
                                                    }}>
                                                        {review.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            marginTop: '8px'
                                        }}>
                                            {renderStars(review.rating)}
                                            <span style={{
                                                color: theme.textSecondary,
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <Calendar size={14} />
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div style={{
                                        padding: '6px 12px',
                                        background: 
                                            review.status === 'approved' ? '#10b98120' :
                                            review.status === 'pending' ? '#f59e0b20' : '#ef444420',
                                        color:
                                            review.status === 'approved' ? '#10b981' :
                                            review.status === 'pending' ? '#f59e0b' : '#ef4444',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'capitalize'
                                    }}>
                                        {review.status}
                                    </div>
                                </div>

                                {/* Review Title */}
                                {review.title && (
                                    <h4 style={{
                                        color: theme.text,
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        margin: '0 0 12px 0'
                                    }}>
                                        {review.title}
                                    </h4>
                                )}

                                {/* Review Comment */}
                                <p style={{
                                    color: theme.text,
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    marginBottom: '16px'
                                }}>
                                    {review.comment}
                                </p>

                                {/* Category Ratings */}
                                {review.categories && Object.keys(review.categories).some(k => review.categories[k] > 0) && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '12px',
                                        marginBottom: '16px',
                                        padding: '16px',
                                        background: `${theme.background}40`,
                                        borderRadius: '10px'
                                    }}>
                                        {Object.entries(review.categories).map(([key, value]) => 
                                            value > 0 && (
                                                <div key={key}>
                                                    <div style={{
                                                        color: theme.textSecondary,
                                                        fontSize: '12px',
                                                        marginBottom: '6px',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {key}
                                                    </div>
                                                    {renderStars(value)}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                {review.status === 'pending' && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginTop: '16px'
                                    }}>
                                        <button
                                            onClick={() => handleModerate(review._id, 'approved')}
                                            style={{
                                                flex: 1,
                                                padding: '10px 20px',
                                                background: '#10b981',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Check size={16} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleModerate(review._id, 'rejected')}
                                            style={{
                                                flex: 1,
                                                padding: '10px 20px',
                                                background: '#ef4444',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <X size={16} />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default ReviewsManager;
