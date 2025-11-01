// components/ReviewForm.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, Send, X, CheckCircle, Upload, Trash2, Image as ImageIcon,
    AlertCircle, Smile, ThumbsUp, Award, Zap, Sparkles, Heart,
    FileText, Camera, Paperclip, User, Mail, MessageSquare
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/api.service';

const ReviewForm = ({ onClose, onSuccess, projectId = null }) => {
    const { theme } = useTheme();
    const { success: showSuccess, error: showError } = useNotifications();
    
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
        },
        recommend: true,
        projectId: projectId
    });

    const [hoveredRating, setHoveredRating] = useState(0);
    const [hoveredCategory, setHoveredCategory] = useState({ category: '', value: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [attachments, setAttachments] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const fileInputRef = useRef(null);
    const totalSteps = 3;

    const emojis = ['😊', '😃', '😍', '👍', '👏', '🎉', '💯', '⭐', '🔥', '💪', '✨', '🚀'];

    // Validation
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                }
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Please enter a valid email';
                }
                break;
            case 'rating':
                if (!value || value < 1) {
                    error = 'Please select a rating';
                }
                break;
            case 'comment':
                if (!value || value.trim().length < 10) {
                    error = 'Review must be at least 10 characters';
                }
                break;
            default:
                break;
        }

        return error;
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name]);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showError(`${file.name} is too large. Maximum size is 5MB`);
                continue;
            }

            // Validate file type (images only)
            if (!file.type.startsWith('image/')) {
                showError(`${file.name} is not a valid image`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await apiService.uploadReviewAttachment(formData, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                });

                if (response.success) {
                    setAttachments(prev => [...prev, {
                        name: file.name,
                        url: response.url,
                        size: file.size
                    }]);
                    showSuccess(`${file.name} uploaded`);
                }
            } catch (err) {
                showError(`Failed to upload ${file.name}`);
            } finally {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[file.name];
                    return newProgress;
                });
            }
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (step) => {
        const stepErrors = {};
        
        if (step === 1) {
            const nameError = validateField('name', formData.name);
            const emailError = validateField('email', formData.email);
            const ratingError = validateField('rating', formData.rating);
            
            if (nameError) stepErrors.name = nameError;
            if (emailError) stepErrors.email = emailError;
            if (ratingError) stepErrors.rating = ratingError;
        } else if (step === 2) {
            const commentError = validateField('comment', formData.comment);
            if (commentError) stepErrors.comment = commentError;
        }

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all steps
        const allValid = validateStep(1) && validateStep(2);
        if (!allValid) {
            showError('Please fill in all required fields correctly');
            setCurrentStep(1);
            return;
        }

        try {
            setSubmitting(true);
            const response = await apiService.submitReview({
                ...formData,
                attachments
            });
            
            if (response.success) {
                setSubmitted(true);
                showSuccess('Review submitted successfully!');
                
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 2000);
            } else {
                showError(response.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Review submission error:', error);
            showError(error.message || 'Error submitting review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const insertEmoji = (emoji) => {
        setFormData(prev => ({
            ...prev,
            comment: prev.comment + emoji
        }));
        setShowEmojiPicker(false);
    };

    const StarRating = ({ value, onChange, size = 32, label = '', category = null }) => (
        <div className="flex items-center gap-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const currentHovered = category 
                        ? (hoveredCategory.category === category ? hoveredCategory.value : 0)
                        : hoveredRating;
                    
                    return (
                        <Star
                            key={star}
                            size={size}
                            className={`cursor-pointer transition-all transform hover:scale-110 ${
                                star <= (currentHovered || value)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                            onMouseEnter={() => {
                                if (category) {
                                    setHoveredCategory({ category, value: star });
                                } else {
                                    setHoveredRating(star);
                                }
                            }}
                            onMouseLeave={() => {
                                if (category) {
                                    setHoveredCategory({ category: '', value: 0 });
                                } else {
                                    setHoveredRating(0);
                                }
                            }}
                            onClick={() => onChange(star)}
                        />
                    );
                })}
            </div>
            {label && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {value > 0 ? `${value}/5` : 'Not rated'}
                </span>
            )}
        </div>
    );

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStepTitle = (step) => {
        switch (step) {
            case 1: return 'Basic Information';
            case 2: return 'Your Review';
            case 3: return 'Details & Submit';
            default: return '';
        }
    };

    // Success Screen
    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center max-w-md shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    >
                        <CheckCircle size={48} className="text-green-500" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Thank You! 🎉
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Your review has been submitted successfully!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        It will be published after moderation.
                    </p>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-yellow-500" size={24} />
                                Leave a Review
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pt-4">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Basic Info */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Name & Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <User size={16} className="inline mr-1" />
                                                Your Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                                onBlur={() => handleBlur('name')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all ${
                                                    errors.name && touched.name
                                                        ? 'border-red-500'
                                                        : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                                placeholder="John Doe"
                                            />
                                            {errors.name && touched.name && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Mail size={16} className="inline mr-1" />
                                                Email (Optional)
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                                onBlur={() => handleBlur('email')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all ${
                                                    errors.email && touched.email
                                                        ? 'border-red-500'
                                                        : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && touched.email && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overall Rating */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            <Award size={16} className="inline mr-1" />
                                            Overall Rating *
                                        </label>
                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <StarRating
                                                value={formData.rating}
                                                onChange={(rating) => handleFieldChange('rating', rating)}
                                                size={40}
                                            />
                                            {formData.rating > 0 && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    {formData.rating === 5 && '🎉 Excellent!'}
                                                    {formData.rating === 4 && '😊 Great!'}
                                                    {formData.rating === 3 && '👍 Good'}
                                                    {formData.rating === 2 && '😐 Fair'}
                                                    {formData.rating === 1 && '😔 Poor'}
                                                </motion.p>
                                            )}
                                        </div>
                                        {errors.rating && touched.rating && (
                                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {errors.rating}
                                            </p>
                                        )}
                                    </div>

                                    {/* Recommend */}
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <input
                                            type="checkbox"
                                            id="recommend"
                                            checked={formData.recommend}
                                            onChange={(e) => handleFieldChange('recommend', e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="recommend" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
                                            <ThumbsUp size={16} className="text-blue-600" />
                                            I would recommend this to others
                                        </label>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Review Content */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <MessageSquare size={16} className="inline mr-1" />
                                            Review Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleFieldChange('title', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            placeholder="Sum up your experience in a few words"
                                        />
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                <FileText size={16} className="inline mr-1" />
                                                Your Review *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <Smile size={18} className="text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Emoji Picker */}
                                        {showEmojiPicker && (
                                            <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex flex-wrap gap-2">
                                                    {emojis.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            onClick={() => insertEmoji(emoji)}
                                                            className="text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <textarea
                                            value={formData.comment}
                                            onChange={(e) => handleFieldChange('comment', e.target.value)}
                                            onBlur={() => handleBlur('comment')}
                                            rows={6}
                                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none transition-all ${
                                                errors.comment && touched.comment
                                                    ? 'border-red-500'
                                                    : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                            placeholder="Share your detailed thoughts about the portfolio... What did you like? What could be improved?"
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            {errors.comment && touched.comment ? (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {errors.comment}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Minimum 10 characters
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formData.comment.length} characters
                                            </p>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <ImageIcon size={16} className="inline mr-1" />
                                            Attachments (Optional)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e.target.files)}
                                                className="hidden"
                                            />
                                            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                Click to upload images
                                            </button>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </div>

                                        {/* Upload Progress */}
                                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                                            <div key={fileName} className="mt-3">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-700 dark:text-gray-300">{fileName}</span>
                                                    <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Uploaded Files */}
                                        {attachments.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {attachments.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <ImageIcon size={20} className="text-blue-600" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatFileSize(file.size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(index)}
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        >
                                                            <Trash2 size={16} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Category Ratings */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                            <Zap size={16} className="inline mr-1" />
                                            Detailed Ratings (Optional)
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Help us improve by rating specific aspects
                                        </p>
                                        <div className="space-y-4">
                                            {Object.entries(formData.categories).map(([category, value]) => (
                                                <div
                                                    key={category}
                                                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                            {category}
                                                        </span>
                                                        {value > 0 && (
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                {value}/5
                                                            </span>
                                                        )}
                                                    </div>
                                                    <StarRating
                                                        value={value}
                                                        onChange={(rating) => setFormData({
                                                            ...formData,
                                                            categories: { ...formData.categories, [category]: rating }
                                                        })}
                                                        size={24}
                                                        category={category}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Summary */}
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Heart className="text-red-500" size={16} />
                                            Review Summary
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <strong>Name:</strong> {formData.name}
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <strong>Rating:</strong> {'⭐'.repeat(formData.rating)}
                                            </p>
                                            {formData.title && (
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    <strong>Title:</strong> {formData.title}
                                                </p>
                                            )}
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <strong>Review:</strong> {formData.comment.substring(0, 100)}
                                                {formData.comment.length > 100 && '...'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                            >
                                Back
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <Sparkles size={18} />
                                            </motion.div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReviewForm;