import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Home, User, Briefcase, Code, Palette, Phone, Mail, MapPin, Shield, Users, BookOpen, Download, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Sitemap = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [referrer, setReferrer] = useState('/');

    useEffect(() => {
        // Store the referrer when component mounts
        const storedReferrer = sessionStorage.getItem('lastVisitedPage');
        
        if (location.state?.from) {
            setReferrer(location.state.from);
        } else if (storedReferrer && storedReferrer !== location.pathname) {
            setReferrer(storedReferrer);
        } else {
            setReferrer('/');
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

    const sitemapSections = [
        {
            title: 'Main Pages',
            icon: Home,
            links: [
                { name: 'Home', href: '/', description: 'Landing page with overview' },
                { name: 'Collaboration Request', href: '/collaborate', description: 'Submit collaboration proposals' },
                { name: 'Public Reviews', href: '/reviews', description: 'View client testimonials' },
                { name: 'Login', href: '/login', description: 'Access dashboard' }
            ]
        },
        {
            title: 'Dashboard',
            icon: Users,
            links: [
                { name: 'Dashboard Home', href: '/dashboard', description: 'Main dashboard interface' },
                { name: 'Portfolio Manager', href: '/dashboard/portfolio', description: 'Manage portfolio projects' },
                { name: 'Skills Editor', href: '/dashboard/skills', description: 'Edit technical skills' },
                { name: 'Project Manager', href: '/dashboard/projects', description: 'Manage development projects' },
                { name: 'Email Manager', href: '/dashboard/email', description: 'Handle email communications' },
                { name: 'Collaboration Requests', href: '/dashboard/collaboration-requests', description: 'Review collaboration proposals' },
                { name: 'Analytics', href: '/dashboard/analytics', description: 'View performance metrics' },
                { name: 'Settings', href: '/dashboard/settings', description: 'Account and system settings' }
            ]
        },
        {
            title: 'Legal & Information',
            icon: Shield,
            links: [
                { name: 'Terms and Conditions', href: '/terms', description: 'Service terms and conditions' },
                { name: 'Privacy Policy', href: '/privacy', description: 'Privacy and data protection' },
                { name: 'Sitemap', href: '/sitemap', description: 'Site structure and navigation' }
            ]
        },
        {
            title: 'Resources',
            icon: BookOpen,
            links: [
                { name: 'Resume/CV', href: '/assets/cv/CV2.pdf', description: 'Download professional resume', download: true },
                { name: 'GitHub Profile', href: 'https://github.com/devTechs001', description: 'View code repositories', external: true },
                { name: 'LinkedIn Profile', href: 'https://www.linkedin.com/in/daniel-mukula', description: 'Professional network profile', external: true },
                { name: 'Portfolio', href: '#projects', description: 'View project portfolio' }
            ]
        },
        {
            title: 'Contact',
            icon: Phone,
            links: [
                { name: 'Email Contact', href: 'mailto:devtechs842@gmail.com', description: 'Send email inquiry' },
                { name: 'Phone Contact', href: 'tel:+254758175275', description: 'Call directly' },
                { name: 'WhatsApp', href: 'https://wa.me/254758175275', description: 'Chat on WhatsApp', external: true },
                { name: 'Telegram', href: 'https://t.me/+254758175275', description: 'Message on Telegram', external: true }
            ]
        },
        {
            title: 'Social Media',
            icon: Users,
            links: [
                { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100089960419104', description: 'Facebook profile', external: true },
                { name: 'Instagram', href: 'https://www.instagram.com/king_wisdom_ndk/', description: 'Instagram profile', external: true },
                { name: 'Twitter/X', href: '#', description: 'Twitter profile (coming soon)', external: true }
            ]
        }
    ];

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
                    <div className="flex items-center gap-2">
                        <FileText size={24} className="text-blue-500" />
                        <h1 className="text-2xl font-bold">Site Map</h1>
                    </div>
                </div>

                {/* Introduction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-6 mb-8 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                >
                    <h2 className="text-xl font-semibold mb-3">Navigate the Site</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        This sitemap provides a comprehensive overview of all pages and sections available on the DanieTech website. 
                        Use it to quickly find specific content or understand the site structure.
                    </p>
                </motion.div>

                {/* Sitemap Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sitemapSections.map((section, sectionIndex) => {
                        const Icon = section.icon;
                        return (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: sectionIndex * 0.1 }}
                                className={`rounded-xl p-6 ${
                                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Icon size={20} className="text-blue-500" />
                                    <h3 className="text-lg font-semibold">{section.title}</h3>
                                </div>
                                <ul className="space-y-3">
                                    {section.links.map((link, linkIndex) => (
                                        <li key={linkIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                            {link.external ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-2 group"
                                                >
                                                    <ExternalLink size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                                            {link.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {link.description}
                                                        </div>
                                                    </div>
                                                </a>
                                            ) : link.download ? (
                                                <a
                                                    href={link.href}
                                                    download
                                                    className="flex items-start gap-2 group"
                                                >
                                                    <Download size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                                            {link.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {link.description}
                                                        </div>
                                                    </div>
                                                </a>
                                            ) : link.href.startsWith('/') ? (
                                                <Link
                                                    to={link.href}
                                                    state={{ from: location.pathname }}
                                                    className="flex items-start gap-2 group"
                                                >
                                                    <FileText size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                                            {link.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {link.description}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <a
                                                    href={link.href}
                                                    className="flex items-start gap-2 group"
                                                >
                                                    <FileText size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                                            {link.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {link.description}
                                                        </div>
                                                    </div>
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`rounded-xl p-6 mt-8 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                >
                    <h3 className="text-lg font-semibold mb-4">Site Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-500">
                                {sitemapSections.reduce((acc, section) => acc + section.links.length, 0)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pages</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">
                                {sitemapSections.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-500">
                                {sitemapSections.filter(section => section.links.some(link => link.external)).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">External Links</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-500">
                                {sitemapSections.filter(section => section.links.some(link => link.href.startsWith('/'))).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Internal Pages</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Sitemap;
