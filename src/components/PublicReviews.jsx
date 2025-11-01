// components/PublicReviews.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, ThumbsUp, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api.service';
import ReviewForm from './ReviewForm';

const PublicReviews = ({ limit = 6, showWriteButton = true }) => {
    const { theme } = useTheme();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const reviewsPerPage = 3;

    useEffect(() => {
        loadReviews();
    }, [limit]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPublicReviews({ limit, featured: false });
            if (response.success) {
                setReviews(response.reviews || []);
                setAvgRating(response.avgRating || 0);
                setTotalReviews(response.totalReviews || 0);
            }
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                />
            ))}
        </div>
    );

    const paginatedReviews = reviews.slice(
        currentPage * reviewsPerPage,
        (currentPage + 1) * reviewsPerPage
    );

    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    return (
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Client Reviews
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-6">
                        See what people are saying about my work
                    </p>

                    {/* Average Rating */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                {avgRating.toFixed(1)}
                            </div>
                            <div className="flex gap-1 mb-2">
                                {renderStars(Math.round(avgRating))}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Based on {totalReviews} reviews
                            </p>
                        </div>
                    </div>

                    {showWriteButton && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowReviewForm(true)}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                        >
                            <MessageSquare size={20} />
                            Write a Review
                        </motion.button>
                    )}
                </motion.div>

                {/* Reviews Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {paginatedReviews.map((review, index) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 relative"
                                >
                                    <Quote className="absolute top-4 right-4 text-blue-500 opacity-20" size={32} />
                                    
                                    <div className="mb-4">
                                        {renderStars(review.rating)}
                                    </div>

                                    {review.title && (
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            {review.title}
                                        </h4>
                                    )}

                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                        "{review.comment}"
                                    </p>

                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {review.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {review.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Page {currentPage + 1} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
                <ReviewForm
                    onClose={() => setShowReviewForm(false)}
                    onSuccess={loadReviews}
                />
            )}
        </section>
    );
};

export default PublicReviews;