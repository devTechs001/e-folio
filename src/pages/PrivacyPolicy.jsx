import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Database, Eye, Mail, Lock, Users, FileText, CheckCircle, AlertTriangle, Info, UserCheck, Cookie, Search, Download, ExternalLink, Clock, MapPin, Phone } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PrivacyPolicy = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('overview');
    const [referrer, setReferrer] = useState('/');

    useEffect(() => {
        // Store the referrer when component mounts
        const storedReferrer = sessionStorage.getItem('lastVisitedPage');
        
        if (location.state?.from) {
            setReferrer(location.state.from);
        } else if (storedReferrer && storedReferrer !== location.pathname) {
            setReferrer(storedReferrer);
        } else {
            // Check if we came from the collaboration form
            const fromCollaboration = document.referrer.includes('/collaborate') || 
                                    storedReferrer === '/collaborate';
            setReferrer(fromCollaboration ? '/collaborate' : '/');
        }
        
        // Store current page for future navigation
        sessionStorage.setItem('lastVisitedPage', location.pathname);
    }, [location.state, location.pathname]);

    const handleBack = () => {
        // Try to go back in history first
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            // Fallback to known referrer or home
            navigate(referrer);
        }
    };

    const sections = [
        { id: 'overview', title: 'Overview', icon: FileText },
        { id: 'collection', title: 'Data Collection', icon: Database },
        { id: 'usage', title: 'Data Usage', icon: Users },
        { id: 'protection', title: 'Data Protection', icon: Shield },
        { id: 'cookies', title: 'Cookies & Tracking', icon: Eye },
        { id: 'rights', title: 'Your Rights', icon: Lock },
        { id: 'contact', title: 'Contact', icon: Mail }
    ];

    const content = {
        overview: {
            title: 'Privacy Overview',
            content: `
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-shield-alt text-blue-500"></i>
                        <strong class="text-blue-700 dark:text-blue-300">Your Privacy Matters</strong>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300">We are committed to protecting your personal information and ensuring transparency in our data practices.</p>
                </div>
                
                <p class="mb-4">This Privacy Policy explains how we collect, use, and protect your information when you use our collaboration services and website.</p>
                <p class="mb-4">We are committed to protecting your privacy and ensuring transparency in our data practices.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-check-circle text-green-500"></i>
                            What We Do
                        </h3>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-shield-alt text-green-500 mt-1"></i>
                                <span>Protect your personal information</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-lock text-green-500 mt-1"></i>
                                <span>Use data only for legitimate purposes</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-eye text-green-500 mt-1"></i>
                                <span>Be transparent about data practices</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-info-circle text-purple-500"></i>
                            What We Don't Do
                        </h3>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-ban text-red-500 mt-1"></i>
                                <span>Sell your personal information</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-user-slash text-red-500 mt-1"></i>
                                <span>Share data without consent</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-search text-red-500 mt-1"></i>
                                <span>Track you across websites</span>
                            </div>
                        </ul>
                    </div>
                </div>
            `
        },
        collection: {
            title: 'Data Collection',
            content: `
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-database text-blue-600 dark:text-blue-400"></i>
                        Personal Information We Collect
                    </h3>
                    <p class="mb-4">We may collect the following personal information:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-user text-blue-500"></i>
                            <span>Name and contact details</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-envelope text-blue-500"></i>
                            <span>Email and phone numbers</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-briefcase text-blue-500"></i>
                            <span>Professional information</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-map-marker-alt text-blue-500"></i>
                            <span>Location and timezone</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-link text-blue-500"></i>
                            <span>Portfolio and social links</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-project-diagram text-blue-500"></i>
                            <span>Project requirements</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-laptop-code text-green-600 dark:text-green-400"></i>
                        Technical Information
                    </h3>
                    <p class="mb-4">We automatically collect:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-globe text-green-500"></i>
                            <span>IP address and browser info</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-desktop text-green-500"></i>
                            <span>Device and OS details</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-history text-green-500"></i>
                            <span>Pages visited and time spent</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-sign-in-alt text-green-500"></i>
                            <span>Referral sources</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-tools text-orange-600 dark:text-orange-400"></i>
                        Collection Methods
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-edit text-orange-500"></i>
                            <span>Forms you complete</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-cookie text-orange-500"></i>
                            <span>Cookies and tracking</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-server text-orange-500"></i>
                            <span>Server logs and analytics</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-envelope-open text-orange-500"></i>
                            <span>Email communications</span>
                        </div>
                    </div>
                </div>
            `
        },
        usage: {
            title: 'Data Usage',
            content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-cogs text-blue-600 dark:text-blue-400"></i>
                            Service Delivery
                        </h3>
                        <p class="mb-4">We use your information to:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Process collaboration requests</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Communicate about projects</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Provide technical support</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Schedule meetings</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-chart-line text-green-600 dark:text-green-400"></i>
                            Service Improvement
                        </h3>
                        <p class="mb-4">Information helps us:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Analyze usage patterns</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Improve functionality</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Develop new features</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Optimize user experience</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-bullhorn text-purple-600 dark:text-purple-400"></i>
                            Communication
                        </h3>
                        <p class="mb-4">We may use your info to:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Send project updates</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Provide announcements</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Respond to inquiries</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Send newsletters (with consent)</span>
                            </div>
                        </ul>
                    </div>
                </div>
            `
        },
        protection: {
            title: 'Data Protection',
            content: `
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-shield-alt text-green-600 dark:text-green-400"></i>
                        Security Measures
                    </h3>
                    <p class="mb-4">We implement industry-standard security measures:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-lock text-green-500"></i>
                            <span>SSL/TLS encryption for data transmission</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-server text-green-500"></i>
                            <span>Secure server infrastructure</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-clipboard-check text-green-500"></i>
                            <span>Regular security audits</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-key text-green-500"></i>
                            <span>Access controls and authentication</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-database text-green-500"></i>
                            <span>Regular data backups</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-eye-slash text-green-500"></i>
                            <span>Data anonymization where possible</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-hdd text-blue-600 dark:text-blue-400"></i>
                        Data Storage
                    </h3>
                    <p class="mb-4">Your information is stored on:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-cloud text-blue-500"></i>
                            <span>Secure cloud servers</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-globe text-blue-500"></i>
                            <span>Geographically appropriate data centers</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-lock text-blue-500"></i>
                            <span>Encrypted databases</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-copy text-blue-500"></i>
                            <span>Redundant storage systems</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-clock text-orange-600 dark:text-orange-400"></i>
                        Data Retention
                    </h3>
                    <p class="mb-4">We retain information only as long as necessary for:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-cogs text-orange-500"></i>
                            <span>Service delivery</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-balance-scale text-orange-500"></i>
                            <span>Legal compliance</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-handshake text-orange-500"></i>
                            <span>Legitimate business purposes</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-check-circle text-orange-500"></i>
                            <span>With your consent</span>
                        </div>
                    </div>
                </div>
            `
        },
        cookies: {
            title: 'Cookies & Tracking',
            content: `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-cookie text-yellow-600 dark:text-yellow-400"></i>
                        What Are Cookies
                    </h3>
                    <p class="mb-4">Cookies are small text files stored on your device that help us provide better services and improve your experience.</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-list text-blue-600 dark:text-blue-400"></i>
                            Types of Cookies We Use
                        </h3>
                        <div class="space-y-3">
                            <div class="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                                <h4 class="font-semibold mb-1 text-blue-600 dark:text-blue-400">Essential Cookies</h4>
                                <p class="text-sm">Required for basic site functionality</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                                <h4 class="font-semibold mb-1 text-blue-600 dark:text-blue-400">Performance Cookies</h4>
                                <p class="text-sm">Help us understand site usage</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                                <h4 class="font-semibold mb-1 text-blue-600 dark:text-blue-400">Functional Cookies</h4>
                                <p class="text-sm">Remember your preferences</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                                <h4 class="font-semibold mb-1 text-blue-600 dark:text-blue-400">Marketing Cookies</h4>
                                <p class="text-sm">Used for personalized content (with consent)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-sliders-h text-green-600 dark:text-green-400"></i>
                            Cookie Control
                        </h3>
                        <p class="mb-4">You can:</p>
                        <div class="space-y-2">
                            <div class="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Accept or reject cookies via our cookie banner</span>
                            </div>
                            <div class="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Configure browser settings to block cookies</span>
                            </div>
                            <div class="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Delete existing cookies from your browser</span>
                            </div>
                            <div class="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Opt out of targeted advertising</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-chart-bar text-purple-600 dark:text-purple-400"></i>
                        Third-Party Tracking
                    </h3>
                    <p class="mb-4">We may use third-party analytics services that collect anonymous usage data to help us improve our services.</p>
                </div>
            `
        },
        rights: {
            title: 'Your Rights',
            content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-eye text-blue-600 dark:text-blue-400"></i>
                            Access Rights
                        </h3>
                        <p class="mb-4">You have the right to:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Know what data we hold</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Request copies of your data</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Verify data accuracy</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Request corrections</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-cog text-green-600 dark:text-green-400"></i>
                            Control Rights
                        </h3>
                        <p class="mb-4">You can:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Withdraw consent</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Request data deletion</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Restrict data processing</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Object to processing</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-download text-purple-600 dark:text-purple-400"></i>
                            Additional Rights
                        </h3>
                        <p class="mb-4">You also have:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Data portability</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Complaint rights</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Right to be informed</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-purple-500 mt-1"></i>
                                <span>Right to object</span>
                            </div>
                        </ul>
                    </div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-gavel text-orange-600 dark:text-orange-400"></i>
                        How to Exercise Your Rights
                    </h3>
                    <p class="mb-4">To exercise your rights, contact us using the information in the Contact section. We will respond within 30 days.</p>
                </div>
            `
        },
        contact: {
            title: 'Contact Information',
            content: `
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-envelope text-green-600 dark:text-green-400"></i>
                        Privacy Questions
                    </h3>
                    <p class="mb-4">For privacy-related questions or to exercise your rights, contact us at:</p>
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-envelope text-green-500"></i>
                                <div>
                                    <strong>Privacy Email:</strong> privacy@example.com
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fas fa-envelope text-green-500"></i>
                                <div>
                                    <strong>General Email:</strong> contact@example.com
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fas fa-phone text-green-500"></i>
                                <div>
                                    <strong>Phone:</strong> +1 (555) 123-4567
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fas fa-map-marker-alt text-green-500"></i>
                                <div>
                                    <strong>Address:</strong> 123 Privacy St, Suite 200
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-clock text-blue-600 dark:text-blue-400"></i>
                        Response Time
                    </h3>
                    <p class="mb-4">We will respond to privacy inquiries within 30 days.</p>
                </div>
                
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-user-shield text-purple-600 dark:text-purple-400"></i>
                        Data Protection Officer
                    </h3>
                    <p class="mb-4">Our Data Protection Officer oversees compliance with privacy regulations.</p>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-sync text-orange-600 dark:text-orange-400"></i>
                        Policy Updates
                    </h3>
                    <p class="mb-4">We will notify you of significant changes to this privacy policy.</p>
                </div>
            `
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <Link
                        to="/terms"
                        state={{ from: location.pathname }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        <FileText size={20} />
                        View Terms & Conditions
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <h2 className="text-xl font-bold mb-4">Sections</h2>
                            <nav className="space-y-2">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-500 text-white'
                                                    : theme === 'dark'
                                                    ? 'bg-gray-800 hover:bg-gray-700'
                                                    : 'bg-white hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon size={18} />
                                            {section.title}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`rounded-xl p-8 ${
                                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                            }`}
                        >
                            <h1 className="text-3xl font-bold mb-6">
                                {content[activeSection].title}
                            </h1>
                            <div 
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: content[activeSection].content }}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
