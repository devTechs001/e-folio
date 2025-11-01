import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, User, Mail, Briefcase, MessageSquare, CheckCircle, ArrowLeft,
    Link2, Calendar, DollarSign, FileText, Upload, X, Github, Linkedin,
    Twitter, Globe, Phone, MapPin, Clock, Star, Award, Target,
    TrendingUp, Code, Palette, Settings, Users, Zap, Shield,
    Eye, ChevronRight, ChevronLeft, AlertCircle, Check, Plus,
    Trash2, Download, ExternalLink, Instagram, Facebook, Youtube,
    Smartphone, Monitor, Server, Database, Cloud, Cpu, Layout,
    PenTool, Film, Music, BookOpen, Bookmark, Hash, AtSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/api.service';

const CollaborationRequest = () => {
    const { theme } = useTheme();
    const { success, error, info } = useNotifications();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState({});
    
    const [formData, setFormData] = useState({
        // Personal Info
        name: '',
        email: '',
        phone: '',
        location: '',
        timezone: '',
        
        // Professional Info
        role: '',
        company: '',
        experience: '',
        skills: [],
        skillLevels: {},
        
        // Online Presence
        portfolio: '',
        github: '',
        linkedin: '',
        twitter: '',
        instagram: '',
        website: '',
        
        // Project Details
        projectType: [],
        budget: '',
        timeline: '',
        availability: '',
        preferredContact: 'email',
        
        // Additional Info
        message: '',
        references: [],
        attachments: [],
        interests: [],
        languages: [],
        
        // Preferences
        remoteWork: true,
        willingToRelocate: false,
        newsletter: true,
        terms: false
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const steps = [
        { id: 1, title: 'Personal Info', icon: User, fields: ['name', 'email', 'phone', 'location'] },
        { id: 2, title: 'Professional', icon: Briefcase, fields: ['role', 'company', 'experience', 'skills'] },
        { id: 3, title: 'Online Presence', icon: Link2, fields: ['portfolio', 'github', 'linkedin'] },
        { id: 4, title: 'Project Details', icon: Target, fields: ['projectType', 'budget', 'timeline'] },
        { id: 5, title: 'Final Details', icon: MessageSquare, fields: ['message', 'terms'] }
    ];

    const skillOptions = {
        'Frontend': ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'HTML/CSS', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'SASS', 'Bootstrap'],
        'Backend': ['Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'PHP', 'Laravel', 'Ruby on Rails', 'Java', 'Spring Boot', '.NET', 'Go'],
        'Mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin'],
        'Database': ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'DynamoDB', 'Oracle', 'SQL Server'],
        'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform'],
        'Design': ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Prototyping', 'Wireframing'],
        'Other': ['GraphQL', 'REST API', 'WebSocket', 'Testing', 'Git', 'Agile', 'Scrum', 'Project Management']
    };

    const roleOptions = [
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
        'UI/UX Designer', 'Product Designer', 'DevOps Engineer', 'Data Scientist',
        'Machine Learning Engineer', 'QA Engineer', 'Project Manager', 'Product Manager',
        'Technical Writer', 'Business Analyst', 'System Architect', 'Security Engineer'
    ];

    const projectTypeOptions = [
        'Web Application', 'Mobile App', 'E-commerce', 'SaaS Product', 'API Development',
        'UI/UX Design', 'Consulting', 'Code Review', 'MVP Development', 'Maintenance',
        'Performance Optimization', 'Migration', 'Integration', 'Custom Solution'
    ];

    const budgetRanges = [
        'Less than $1,000', '$1,000 - $5,000', '$5,000 - $10,000',
        '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+', 'To be discussed'
    ];

    const timelineOptions = [
        'Less than 1 month', '1-3 months', '3-6 months',
        '6-12 months', 'More than 1 year', 'Ongoing', 'Flexible'
    ];

    const availabilityOptions = [
        'Immediately', 'Within 2 weeks', 'Within 1 month',
        'Within 3 months', 'Not sure yet', 'Just exploring'
    ];

    const experienceLevels = [
        'Less than 1 year', '1-3 years', '3-5 years',
        '5-10 years', '10+ years'
    ];

    const languageOptions = [
        'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
        'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Italian', 'Korean'
    ];

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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value || !emailRegex.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'phone':
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (value && !phoneRegex.test(value)) {
                    error = 'Please enter a valid phone number';
                }
                break;
            case 'portfolio':
            case 'github':
            case 'linkedin':
            case 'website':
                const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                if (value && !urlRegex.test(value)) {
                    error = 'Please enter a valid URL';
                }
                break;
            case 'message':
                if (!value || value.trim().length < 20) {
                    error = 'Message must be at least 20 characters';
                }
                break;
            case 'terms':
                if (!value) {
                    error = 'You must accept the terms and conditions';
                }
                break;
            default:
                break;
        }

        return error;
    };

    const validateStep = (stepId) => {
        const step = steps.find(s => s.id === stepId);
        if (!step) return true;

        const stepErrors = {};
        step.fields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                stepErrors[field] = error;
            }
        });

        setErrors(prev => ({ ...prev, ...stepErrors }));
        return Object.keys(stepErrors).length === 0;
    };

    const handleFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name]);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleSkill = (skill) => {
        const isSelected = formData.skills.includes(skill);
        handleFieldChange(
            'skills',
            isSelected
                ? formData.skills.filter(s => s !== skill)
                : [...formData.skills, skill]
        );

        // Initialize skill level if adding
        if (!isSelected) {
            setFormData(prev => ({
                ...prev,
                skillLevels: { ...prev.skillLevels, [skill]: 'intermediate' }
            }));
        }
    };

    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);
        
        for (const file of fileArray) {
            // File size check (10MB)
            if (file.size > 10 * 1024 * 1024) {
                error(`${file.name} is too large. Maximum size is 10MB`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await apiService.uploadCollaborationFile(formData, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                });

                if (response.success) {
                    setFormData(prev => ({
                        ...prev,
                        attachments: [...prev.attachments, {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: response.url
                        }]
                    }));
                    success(`${file.name} uploaded successfully`);
                }
            } catch (err) {
                error(`Failed to upload ${file.name}`);
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
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const addReference = () => {
        setFormData(prev => ({
            ...prev,
            references: [...prev.references, { name: '', email: '', relationship: '' }]
        }));
    };

    const updateReference = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            references: prev.references.map((ref, i) =>
                i === index ? { ...ref, [field]: value } : ref
            )
        }));
    };

    const removeReference = (index) => {
        setFormData(prev => ({
            ...prev,
            references: prev.references.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all steps
        let allValid = true;
        for (let i = 1; i <= steps.length; i++) {
            if (!validateStep(i)) {
                allValid = false;
                setCurrentStep(i);
                break;
            }
        }

        if (!allValid) {
            error('Please complete all required fields');
            return;
        }

        if (!formData.terms) {
            error('Please accept the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.submitCollaborationRequest(formData);
            
            if (response.success) {
                setSubmitted(true);
                success('Request submitted successfully! We will review it and get back to you soon.');
                
                // Track submission analytics
                if (window.gtag) {
                    window.gtag('event', 'collaboration_request_submit', {
                        role: formData.role,
                        project_type: formData.projectType.join(','),
                        budget: formData.budget
                    });
                }
            } else {
                error(response.message || 'Failed to submit request');
            }
        } catch (err) {
            console.error('Submission error:', err);
            error(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getProgressPercentage = () => {
        const totalSteps = steps.length;
        return (currentStep / totalSteps) * 100;
    };

    // Success Screen
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-2xl w-full"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center"
                        >
                            <CheckCircle size={48} className="text-white" />
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                        >
                            Request Submitted Successfully! 🎉
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed"
                        >
                            Thank you for your interest in collaborating! We've received your request and will review it carefully. 
                            You'll receive an email with further instructions once approved.
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                                <Clock className="text-blue-600" size={20} />
                                What happens next?
                            </h3>
                            <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <Check className="text-green-500 mt-1 flex-shrink-0" size={16} />
                                    <span>We'll review your request within 24-48 hours</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="text-green-500 mt-1 flex-shrink-0" size={16} />
                                    <span>You'll receive an invite link via email if approved</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="text-green-500 mt-1 flex-shrink-0" size={16} />
                                    <span>Check your spam folder if you don't see our email</span>
                                </li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                <ArrowLeft size={20} />
                                Back to Portfolio
                            </Link>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({
                                        name: '', email: '', phone: '', location: '', timezone: '',
                                        role: '', company: '', experience: '', skills: [], skillLevels: {},
                                        portfolio: '', github: '', linkedin: '', twitter: '', instagram: '', website: '',
                                        projectType: [], budget: '', timeline: '', availability: '', preferredContact: 'email',
                                        message: '', references: [], attachments: [], interests: [], languages: [],
                                        remoteWork: true, willingToRelocate: false, newsletter: true, terms: false
                                    });
                                    setCurrentStep(1);
                                }}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold transition-all"
                            >
                                <Plus size={20} />
                                Submit Another Request
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                        Let's Collaborate! 🤝
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                        Fill out this form to request collaboration access. I'll review your request and get back to you soon.
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center flex-1">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                                            currentStep > step.id
                                                ? 'bg-green-500 text-white'
                                                : currentStep === step.id
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check size={24} />
                                        ) : (
                                            <step.icon size={24} />
                                        )}
                                    </motion.div>
                                    <span className={`text-xs mt-2 font-medium text-center hidden sm:block ${
                                        currentStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage()}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                        />
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8"
                >
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {/* Step 1: Personal Info */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Personal Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <User size={16} className="inline mr-2" />
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                                onBlur={() => handleBlur('name')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all ${
                                                    errors.name && touched.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
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

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Mail size={16} className="inline mr-2" />
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                                onBlur={() => handleBlur('email')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all ${
                                                    errors.email && touched.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
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

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Phone size={16} className="inline mr-2" />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                                onBlur={() => handleBlur('phone')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all ${
                                                    errors.phone && touched.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                            {errors.phone && touched.phone && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <MapPin size={16} className="inline mr-2" />
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>

                                    {/* Timezone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Clock size={16} className="inline mr-2" />
                                            Timezone
                                        </label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => handleFieldChange('timezone', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        >
                                            <option value="">Select timezone</option>
                                            <option value="America/New_York">Eastern Time (ET)</option>
                                            <option value="America/Chicago">Central Time (CT)</option>
                                            <option value="America/Denver">Mountain Time (MT)</option>
                                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="Europe/Paris">Central European Time (CET)</option>
                                            <option value="Asia/Dubai">Dubai (GST)</option>
                                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                                            <option value="Australia/Sydney">Sydney (AEDT)</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Professional Info */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Professional Background
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Briefcase size={16} className="inline mr-2" />
                                                Your Role
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => handleFieldChange('role', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            >
                                                <option value="">Select your role</option>
                                                {roleOptions.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Company */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Building size={16} className="inline mr-2" />
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.company}
                                                onChange={(e) => handleFieldChange('company', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                placeholder="Company name"
                                            />
                                        </div>
                                    </div>

                                    {/* Experience */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Award size={16} className="inline mr-2" />
                                            Years of Experience
                                        </label>
                                        <select
                                            value={formData.experience}
                                            onChange={(e) => handleFieldChange('experience', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        >
                                            <option value="">Select experience level</option>
                                            {experienceLevels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            <Code size={16} className="inline mr-2" />
                                            Skills & Technologies
                                        </label>
                                        
                                        {Object.entries(skillOptions).map(([category, skills]) => (
                                            <div key={category} className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    {category}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map(skill => {
                                                        const isSelected = formData.skills.includes(skill);
                                                        return (
                                                            <button
                                                                key={skill}
                                                                type="button"
                                                                onClick={() => toggleSkill(skill)}
                                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                                    isSelected
                                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                {skill}
                                                                {isSelected && <Check size={14} className="inline ml-1" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                                            {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} selected
                                        </p>
                                    </div>

                                    {/* Skill Levels for Selected Skills */}
                                    {formData.skills.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                <Star size={16} className="inline mr-2" />
                                                Proficiency Levels
                                            </label>
                                            <div className="space-y-3">
                                                {formData.skills.map(skill => (
                                                    <div key={skill} className="flex items-center gap-4">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                                                            {skill}
                                                        </span>
                                                        <div className="flex gap-2 flex-1">
                                                            {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                                                                <button
                                                                    key={level}
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({
                                                                        ...prev,
                                                                        skillLevels: { ...prev.skillLevels, [skill]: level }
                                                                    }))}
                                                                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                                                                        formData.skillLevels[skill] === level
                                                                            ? 'bg-blue-500 text-white'
                                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                    }`}
                                                                >
                                                                    {level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Languages */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Globe size={16} className="inline mr-2" />
                                            Languages
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {languageOptions.map(language => {
                                                const isSelected = formData.languages.includes(language);
                                                return (
                                                    <button
                                                        key={language}
                                                        type="button"
                                                        onClick={() => handleFieldChange(
                                                            'languages',
                                                            isSelected
                                                                ? formData.languages.filter(l => l !== language)
                                                                : [...formData.languages, language]
                                                        )}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {language}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Online Presence */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Online Presence
                                    </h3>

                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Portfolio */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Briefcase size={16} className="inline mr-2" />
                                                Portfolio URL
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.portfolio}
                                                onChange={(e) => handleFieldChange('portfolio', e.target.value)}
                                                onBlur={() => handleBlur('portfolio')}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white ${
                                                    errors.portfolio && touched.portfolio ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                                placeholder="https://yourportfolio.com"
                                            />
                                            {errors.portfolio && touched.portfolio && (
                                                <p className="mt-1 text-sm text-red-500">{errors.portfolio}</p>
                                            )}
                                        </div>

                                        {/* Social Links */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    <Github size={16} className="inline mr-2" />
                                                    GitHub
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.github}
                                                    onChange={(e) => handleFieldChange('github', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                    placeholder="https://github.com/username"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    <Linkedin size={16} className="inline mr-2" />
                                                    LinkedIn
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.linkedin}
                                                    onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                    placeholder="https://linkedin.com/in/username"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    <Twitter size={16} className="inline mr-2" />
                                                    Twitter/X
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.twitter}
                                                    onChange={(e) => handleFieldChange('twitter', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                    placeholder="https://twitter.com/username"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    <Globe size={16} className="inline mr-2" />
                                                    Website
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.website}
                                                    onChange={(e) => handleFieldChange('website', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                    placeholder="https://yourwebsite.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Project Details */}
                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Project Details
                                    </h3>

                                    {/* Project Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            <Target size={16} className="inline mr-2" />
                                            Project Type (Select all that apply)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {projectTypeOptions.map(type => {
                                                const isSelected = formData.projectType.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => handleFieldChange(
                                                            'projectType',
                                                            isSelected
                                                                ? formData.projectType.filter(t => t !== type)
                                                                : [...formData.projectType, type]
                                                        )}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Budget */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <DollarSign size={16} className="inline mr-2" />
                                                Budget Range
                                            </label>
                                            <select
                                                value={formData.budget}
                                                onChange={(e) => handleFieldChange('budget', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            >
                                                <option value="">Select budget range</option>
                                                {budgetRanges.map(range => (
                                                    <option key={range} value={range}>{range}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Timeline */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Calendar size={16} className="inline mr-2" />
                                                Project Timeline
                                            </label>
                                            <select
                                                value={formData.timeline}
                                                onChange={(e) => handleFieldChange('timeline', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            >
                                                <option value="">Select timeline</option>
                                                {timelineOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Availability */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <Clock size={16} className="inline mr-2" />
                                                When can you start?
                                            </label>
                                            <select
                                                value={formData.availability}
                                                onChange={(e) => handleFieldChange('availability', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            >
                                                <option value="">Select availability</option>
                                                {availabilityOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Preferred Contact */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                <MessageSquare size={16} className="inline mr-2" />
                                                Preferred Contact Method
                                            </label>
                                            <select
                                                value={formData.preferredContact}
                                                onChange={(e) => handleFieldChange('preferredContact', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            >
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="any">Any method</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Work Preferences */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Work Preferences
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.remoteWork}
                                                onChange={(e) => handleFieldChange('remoteWork', e.target.checked)}
                                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Open to remote work</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.willingToRelocate}
                                                onChange={(e) => handleFieldChange('willingToRelocate', e.target.checked)}
                                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Willing to relocate</span>
                                        </label>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Final Details */}
                            {currentStep === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Final Details
                                    </h3>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <MessageSquare size={16} className="inline mr-2" />
                                            Tell me about yourself and your project *
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => handleFieldChange('message', e.target.value)}
                                            onBlur={() => handleBlur('message')}
                                            rows={6}
                                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none ${
                                                errors.message && touched.message ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                            placeholder="Describe your project, goals, and what you're looking for in a collaboration..."
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            {errors.message && touched.message ? (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {errors.message}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Minimum 20 characters
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formData.message.length} characters
                                            </p>
                                        </div>
                                    </div>

                                    {/* File Attachments */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Upload size={16} className="inline mr-2" />
                                            Attachments (Optional)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                onChange={(e) => handleFileUpload(e.target.files)}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            />
                                            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                Click to upload
                                            </button>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                PDF, DOC, TXT, JPG, PNG (Max 10MB)
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
                                        {formData.attachments.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {formData.attachments.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <FileText size={20} className="text-blue-600" />
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
                                                            <X size={18} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* References */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                <Users size={16} className="inline mr-2" />
                                                References (Optional)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addReference}
                                                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                <Plus size={16} />
                                                Add Reference
                                            </button>
                                        </div>

                                        {formData.references.length > 0 && (
                                            <div className="space-y-4">
                                                {formData.references.map((ref, index) => (
                                                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Reference {index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeReference(index)}
                                                                className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <input
                                                                type="text"
                                                                value={ref.name}
                                                                onChange={(e) => updateReference(index, 'name', e.target.value)}
                                                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                                                                placeholder="Name"
                                                            />
                                                            <input
                                                                type="email"
                                                                value={ref.email}
                                                                onChange={(e) => updateReference(index, 'email', e.target.value)}
                                                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                                                                placeholder="Email"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={ref.relationship}
                                                                onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                                                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                                                                placeholder="Relationship"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Newsletter & Terms */}
                                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.newsletter}
                                                onChange={(e) => handleFieldChange('newsletter', e.target.checked)}
                                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Send me updates about new projects and opportunities
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.terms}
                                                onChange={(e) => handleFieldChange('terms', e.target.checked)}
                                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                I agree to the{' '}
                                                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">
                                                    terms and conditions
                                                </a>
                                                {' '}and{' '}
                                                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">
                                                    privacy policy
                                                </a>
                                                {' '}*
                                            </span>
                                        </label>
                                        {errors.terms && touched.terms && (
                                            <p className="text-sm text-red-500 flex items-center gap-1 ml-8">
                                                <AlertCircle size={14} />
                                                {errors.terms}
                                            </p>
                                        )}
                                    </div>

                                    {/* Preview Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(true)}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                                    >
                                        <Eye size={20} />
                                        Preview Application
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl font-semibold transition-all"
                                >
                                    <ChevronLeft size={20} />
                                    Previous
                                </button>
                            ) : (
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Back to Portfolio
                                </Link>
                            )}

                            {currentStep < steps.length ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Next
                                    <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={20} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPreview(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8"
                        >
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Application Preview
                                </h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Personal Info */}
                                {formData.name && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {formData.name && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Name</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.name}</p>
                                                </div>
                                            )}
                                            {formData.email && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Email</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.email}</p>
                                                </div>
                                            )}
                                            {formData.phone && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Phone</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.phone}</p>
                                                </div>
                                            )}
                                            {formData.location && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Location</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.location}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Professional */}
                                {(formData.role || formData.company || formData.skills.length > 0) && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Professional Background</h4>
                                        <div className="space-y-3 text-sm">
                                            {formData.role && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Role</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.role}</p>
                                                </div>
                                            )}
                                            {formData.skills.length > 0 && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 mb-2">Skills</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.skills.map(skill => (
                                                            <span key={skill} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Project Details */}
                                {(formData.projectType.length > 0 || formData.budget || formData.timeline) && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Project Details</h4>
                                        <div className="space-y-3 text-sm">
                                            {formData.projectType.length > 0 && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Project Types</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.projectType.join(', ')}</p>
                                                </div>
                                            )}
                                            {formData.budget && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Budget</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.budget}</p>
                                                </div>
                                            )}
                                            {formData.timeline && (
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Timeline</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">{formData.timeline}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Message */}
                                {formData.message && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Message</h4>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {formData.message}
                                        </p>
                                    </div>
                                )}

                                {/* Attachments */}
                                {formData.attachments.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Attachments</h4>
                                        <div className="space-y-2">
                                            {formData.attachments.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 text-sm">
                                                    <FileText size={16} className="text-blue-600" />
                                                    <span className="text-gray-900 dark:text-white">{file.name}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">({formatFileSize(file.size)})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-4">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl font-semibold transition-all"
                                >
                                    Continue Editing
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        handleSubmit({ preventDefault: () => {} });
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Send size={20} />
                                    Submit Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CollaborationRequest;