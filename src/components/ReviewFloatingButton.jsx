import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, ThumbsUp, Share2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';
import trackingService from '../services/tracking.service';

const ReviewFloatingButton = () => {
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [formData, setFormData] = useState({ name: '', email: '', comment: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!rating) {
            error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            const response = await trackingService.submitReview({
                name: formData.name,
                email: formData.email,
                rating,
                comment: formData.comment
            });

            if (response.success) {
                success('Thank you for your review!');
                setIsOpen(false);
                setRating(0);
                setFormData({ name: '', email: '', comment: '' });
            } else {
                error('Failed to submit review. Please try again.');
            }
        } catch (err) {
            console.error('Review submission error:', err);
            error('Error submitting review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 360] }}
                transition={{ delay: 1, duration: 0.6 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00efff, #00d4ff)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0, 239, 255, 0.6)',
                    zIndex: 1000
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                    <Star size={28} style={{ color: '#081b29' }} fill="#081b29" />
                </motion.div>
            </motion.button>

            {/* Review Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1001,
                            padding: '20px',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: theme.surface || '#0f2438',
                                borderRadius: '24px',
                                padding: '32px',
                                maxWidth: '500px',
                                width: '100%',
                                border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{
                                    color: theme.text || '#ededed',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    margin: 0,
                                    fontFamily: "'Orbitron', 'Poppins', sans-serif"
                                }}>
                                    Leave a Review
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: theme.textSecondary || '#b0b0b0',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Rating */}
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <p style={{ color: theme.textSecondary || '#b0b0b0', marginBottom: '12px', fontSize: '14px' }}>
                                        Rate your experience
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                type="button"
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                <Star
                                                    size={32}
                                                    fill={(hoverRating || rating) >= star ? '#ffd700' : 'none'}
                                                    stroke={(hoverRating || rating) >= star ? '#ffd700' : theme.textSecondary || '#b0b0b0'}
                                                    strokeWidth={2}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: theme.textSecondary || '#b0b0b0',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        fontWeight: '600'
                                    }}>
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            borderRadius: '10px',
                                            color: theme.text || '#ededed',
                                            fontSize: '15px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: theme.textSecondary || '#b0b0b0',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        fontWeight: '600'
                                    }}>
                                        Email (optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            borderRadius: '10px',
                                            color: theme.text || '#ededed',
                                            fontSize: '15px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Comment */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: theme.textSecondary || '#b0b0b0',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        fontWeight: '600'
                                    }}>
                                        Your Review
                                    </label>
                                    <textarea
                                        required
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        placeholder="Share your thoughts..."
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            borderRadius: '10px',
                                            color: theme.text || '#ededed',
                                            fontSize: '15px',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: "'Poppins', sans-serif"
                                        }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <motion.button
                                        type="submit"
                                        disabled={submitting}
                                        whileHover={{ scale: submitting ? 1 : 1.02 }}
                                        whileTap={{ scale: submitting ? 1 : 0.98 }}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            background: submitting ? '#6b7280' : 'linear-gradient(135deg, #00efff, #00d4ff)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: '#081b29',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 15px rgba(0, 239, 255, 0.4)',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Review'}
                                    </motion.button>
                                </div>

                                {/* Additional Actions */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    marginTop: '16px',
                                    paddingTop: '16px',
                                    borderTop: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`
                                }}>
                                    <button 
                                        type="button" 
                                        onClick={() => success('Thanks for liking this portfolio!')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: `${theme.primary || '#00efff'}15`,
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: theme.primary || '#00efff',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}30`;
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}15`;
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <ThumbsUp size={16} /> Like Portfolio
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'Check out this portfolio!',
                                                    text: 'Amazing developer portfolio',
                                                    url: window.location.href
                                                }).then(() => success('Thanks for sharing!'))
                                                .catch(err => console.log('Share cancelled'));
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                success('Link copied to clipboard!');
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: `${theme.primary || '#00efff'}15`,
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: theme.primary || '#00efff',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}30`;
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}15`;
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <Share2 size={16} /> Share
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ReviewFloatingButton;
