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
                className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 
                           border-none cursor-pointer flex items-center justify-center 
                           shadow-[0_8px_32px_rgba(0,239,255,0.6)] z-[1000]
                           hover:shadow-[0_12px_40px_rgba(0,239,255,0.8)] transition-shadow duration-300"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                    <Star size={28} className="text-slate-900 fill-slate-900" />
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center 
                                   z-[1001] p-4 sm:p-6 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-3xl p-6 sm:p-8 max-w-lg w-full 
                                       shadow-2xl shadow-black/50 border"
                            style={{
                                background: theme.surface || '#0f2438',
                                borderColor: theme.border || 'rgba(0, 239, 255, 0.2)'
                            }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 
                                    className="text-2xl md:text-3xl font-bold m-0 font-['Orbitron']"
                                    style={{ color: theme.text || '#ededed' }}
                                >
                                    Leave a Review
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="bg-transparent border-none cursor-pointer p-1 
                                             hover:opacity-70 transition-opacity duration-200"
                                    style={{ color: theme.textSecondary || '#b0b0b0' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Rating */}
                                <div className="text-center">
                                    <p 
                                        className="mb-3 text-sm md:text-base"
                                        style={{ color: theme.textSecondary || '#b0b0b0' }}
                                    >
                                        Rate your experience
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                type="button"
                                                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="bg-transparent border-none cursor-pointer p-1 
                                                         transition-transform duration-200"
                                            >
                                                <Star
                                                    size={32}
                                                    className={`transition-all duration-200 ${
                                                        (hoverRating || rating) >= star 
                                                            ? 'fill-yellow-400 stroke-yellow-400' 
                                                            : 'fill-none'
                                                    }`}
                                                    style={{ 
                                                        stroke: (hoverRating || rating) >= star 
                                                            ? '#ffd700' 
                                                            : theme.textSecondary || '#b0b0b0' 
                                                    }}
                                                    strokeWidth={2}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label 
                                        className="block text-sm font-semibold mb-2"
                                        style={{ color: theme.textSecondary || '#b0b0b0' }}
                                    >
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-xl text-base outline-none 
                                                 transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50
                                                 placeholder:text-gray-500"
                                        style={{
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            color: theme.text || '#ededed'
                                        }}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label 
                                        className="block text-sm font-semibold mb-2"
                                        style={{ color: theme.textSecondary || '#b0b0b0' }}
                                    >
                                        Email <span className="text-xs opacity-75">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3 rounded-xl text-base outline-none 
                                                 transition-all duration-200 focus:ring-2 focus:ring-cyan-400/50
                                                 placeholder:text-gray-500"
                                        style={{
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            color: theme.text || '#ededed'
                                        }}
                                    />
                                </div>

                                {/* Comment */}
                                <div>
                                    <label 
                                        className="block text-sm font-semibold mb-2"
                                        style={{ color: theme.textSecondary || '#b0b0b0' }}
                                    >
                                        Your Review
                                    </label>
                                    <textarea
                                        required
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        placeholder="Share your thoughts..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl text-base outline-none 
                                                 resize-y font-['Poppins'] transition-all duration-200 
                                                 focus:ring-2 focus:ring-cyan-400/50 placeholder:text-gray-500
                                                 min-h-[100px]"
                                        style={{
                                            background: theme.background || '#081b29',
                                            border: `1px solid ${theme.border || 'rgba(0, 239, 255, 0.2)'}`,
                                            color: theme.text || '#ededed'
                                        }}
                                    />
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                                    className={`w-full py-3.5 rounded-xl border-none text-slate-900 
                                              text-base font-bold flex items-center justify-center gap-2 
                                              shadow-lg shadow-cyan-400/40 transition-all duration-300
                                              ${submitting 
                                                  ? 'bg-gray-500 cursor-not-allowed opacity-70' 
                                                  : 'bg-gradient-to-r from-cyan-400 to-cyan-500 cursor-pointer hover:shadow-xl hover:shadow-cyan-400/60'
                                              }`}
                                >
                                    <Send size={18} /> 
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </motion.button>

                                {/* Additional Actions */}
                                <div 
                                    className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t"
                                    style={{ borderColor: theme.border || 'rgba(0, 239, 255, 0.2)' }}
                                >
                                    <motion.button 
                                        type="button" 
                                        onClick={() => success('Thanks for liking this portfolio!')}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 py-2.5 rounded-lg border-none text-sm font-semibold 
                                                 cursor-pointer flex items-center justify-center gap-2 
                                                 transition-all duration-300"
                                        style={{
                                            background: `${theme.primary || '#00efff'}15`,
                                            color: theme.primary || '#00efff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}30`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}15`;
                                        }}
                                    >
                                        <ThumbsUp size={16} /> Like Portfolio
                                    </motion.button>
                                    
                                    <motion.button 
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
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 py-2.5 rounded-lg border-none text-sm font-semibold 
                                                 cursor-pointer flex items-center justify-center gap-2 
                                                 transition-all duration-300"
                                        style={{
                                            background: `${theme.primary || '#00efff'}15`,
                                            color: theme.primary || '#00efff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}30`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${theme.primary || '#00efff'}15`;
                                        }}
                                    >
                                        <Share2 size={16} /> Share
                                    </motion.button>
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