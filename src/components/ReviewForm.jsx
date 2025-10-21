import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, X, CheckCircle } from 'lucide-react';
import trackingService from '../services/tracking.service';

const ReviewForm = ({ onClose, theme }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rating: 0,
        title: '',
        comment: '',
        categories: {
            design: 0,
            functionality: 0,
            performance: 0,
            content: 0
        }
    });
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.rating || !formData.comment) {
            alert('Please fill in required fields: Name, Rating, and Comment');
            return;
        }

        try {
            setSubmitting(true);
            const response = await trackingService.submitReview(formData);
            
            if (response.success) {
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                alert('Failed to submit review. Please try again.');
            }
        } catch (error) {
            console.error('Review submission error:', error);
            alert('Error submitting review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({ value, onChange, size = 32 }) => (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    fill={star <= (hoveredRating || value) ? '#fbbf24' : 'none'}
                    stroke={star <= (hoveredRating || value) ? '#fbbf24' : '#6b7280'}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => onChange(star)}
                />
            ))}
        </div>
    );

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <div style={{
                    background: theme?.surface || '#1a1a1a',
                    padding: '40px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '20px' }} />
                    <h2 style={{ color: theme?.text || '#fff', marginBottom: '12px' }}>Thank You!</h2>
                    <p style={{ color: theme?.textSecondary || '#aaa' }}>
                        Your review has been submitted and will be reviewed shortly.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px',
                    overflowY: 'auto'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: theme?.surface || '#1a1a1a',
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: `2px solid ${theme?.border || 'rgba(255,255,255,0.1)'}`
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <h2 style={{
                            color: theme?.text || '#fff',
                            fontSize: '24px',
                            fontWeight: '700',
                            margin: 0
                        }}>
                            Leave a Review
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme?.textSecondary || '#aaa',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Name & Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{
                                    color: theme?.text || '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'block',
                                    marginBottom: '8px'
                                }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: theme?.background || '#0a0a0a',
                                        border: `2px solid ${theme?.border || 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '10px',
                                        color: theme?.text || '#fff',
                                        fontSize: '14px'
                                    }}
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label style={{
                                    color: theme?.text || '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'block',
                                    marginBottom: '8px'
                                }}>
                                    Email (optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: theme?.background || '#0a0a0a',
                                        border: `2px solid ${theme?.border || 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '10px',
                                        color: theme?.text || '#fff',
                                        fontSize: '14px'
                                    }}
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        {/* Overall Rating */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                color: theme?.text || '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '12px'
                            }}>
                                Overall Rating *
                            </label>
                            <StarRating
                                value={formData.rating}
                                onChange={(rating) => setFormData({ ...formData, rating })}
                            />
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                color: theme?.text || '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '8px'
                            }}>
                                Review Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: theme?.background || '#0a0a0a',
                                    border: `2px solid ${theme?.border || 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '10px',
                                    color: theme?.text || '#fff',
                                    fontSize: '14px'
                                }}
                                placeholder="Sum up your experience"
                            />
                        </div>

                        {/* Comment */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                color: theme?.text || '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '8px'
                            }}>
                                Your Review *
                            </label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                required
                                rows={5}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: theme?.background || '#0a0a0a',
                                    border: `2px solid ${theme?.border || 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '10px',
                                    color: theme?.text || '#fff',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="Share your thoughts about the portfolio..."
                            />
                        </div>

                        {/* Category Ratings */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                color: theme?.text || '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '16px'
                            }}>
                                Detailed Ratings (Optional)
                            </label>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {Object.keys(formData.categories).map((category) => (
                                    <div key={category} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: theme?.background || '#0a0a0a',
                                        borderRadius: '10px'
                                    }}>
                                        <span style={{
                                            color: theme?.text || '#fff',
                                            fontSize: '14px',
                                            textTransform: 'capitalize',
                                            fontWeight: '500'
                                        }}>
                                            {category}
                                        </span>
                                        <StarRating
                                            value={formData.categories[category]}
                                            onChange={(rating) => setFormData({
                                                ...formData,
                                                categories: { ...formData.categories, [category]: rating }
                                            })}
                                            size={20}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: submitting ? '#6b7280' : (theme?.gradient || 'linear-gradient(135deg, #0ef, #00d4ff)'),
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.3s'
                            }}
                        >
                            {submitting ? (
                                'Submitting...'
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReviewForm;
