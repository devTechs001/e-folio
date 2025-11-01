// client/src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../components/NotificationSystem';
import DashboardProvider, { useDashboard } from '../contexts/DashboardContext';

// Dashboard Layout Components
import DashboardSideNavbar from '../components/dashboard/DashboardSideNavbar';
import DashboardTopNavbar from '../components/dashboard/DashboardTopNavbar';
import LoadingScreen from '../components/LoadingScreen';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load dashboard components for better performance
const DashboardHome = lazy(() => import('../components/dashboard/DashboardHomeStyled'));
const ProjectManager = lazy(() => import('../components/dashboard/ProjectManagerEnhanced'));
const SkillsEditor = lazy(() => import('../components/dashboard/SkillsEditorEnhanced'));
const ThemeManager = lazy(() => import('../components/dashboard/ThemeManagerStyled'));
const Analytics = lazy(() => import('../components/dashboard/Analytics'));
const Settings = lazy(() => import('../components/dashboard/SettingsStyled'));
const ChatSystem = lazy(() => import('../components/dashboard/ChatSystemStyled'));
const AIAssistant = lazy(() => import('../components/dashboard/AIAssistantStyled'));
const PortfolioEditor = lazy(() => import('../components/dashboard/PortfolioEditorStyled'));
const Collaborators = lazy(() => import('../components/dashboard/CollaboratorsStyled'));
const MediaManager = lazy(() => import('../components/dashboard/MediaManagerStyled'));
const VisitorsAnalytics = lazy(() => import('../components/dashboard/VisitorsAnalyticsStyled'));
const AITrackingSystem = lazy(() => import('../components/dashboard/AITrackingSystem'));
const ReviewsManager = lazy(() => import('../components/dashboard/ReviewsManager'));
const EmailManager = lazy(() => import('../components/dashboard/EmailManagerEnhanced'));
const CollaborationRequests = lazy(() => import('../components/dashboard/CollaborationRequestsStyled'));
const LearningCenter = lazy(() => import('../components/dashboard/LearningCenterStyled'));
const Profile = lazy(() => import('../components/dashboard/Profile'));

const Dashboard = () => {
    return (
        <DashboardProvider>
            <ErrorBoundary>
                <DashboardContent />
            </ErrorBoundary>
        </DashboardProvider>
    );
};

const DashboardContent = () => {
    const { user, userRole } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { success, error: showError } = useNotifications();
    
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Get from localStorage or default based on screen size
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) return JSON.parse(saved);
        return window.innerWidth < 1024;
    });
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Menu configuration with categories
    const menuItems = useMemo(() => [
        {
            path: '/dashboard',
            icon: 'fas fa-tachometer-alt',
            label: 'Overview',
            component: DashboardHome,
            roles: ['owner', 'collaborator'],
            badge: null,
            category: 'Main',
            description: 'Dashboard home and statistics'
        },
        {
            path: '/dashboard/projects',
            icon: 'fas fa-project-diagram',
            label: 'Projects',
            component: ProjectManager,
            roles: ['owner', 'collaborator'],
            badge: '12',
            category: 'Main',
            description: 'Manage your projects'
        },
        {
            path: '/dashboard/analytics',
            icon: 'fas fa-chart-bar',
            label: 'Analytics',
            component: Analytics,
            roles: ['owner'],
            badge: null,
            category: 'Main',
            description: 'View detailed analytics'
        },
        {
            path: '/dashboard/visitors',
            icon: 'fas fa-user-friends',
            label: 'Visitors',
            component: VisitorsAnalytics,
            roles: ['owner'],
            badge: null,
            category: 'Main',
            description: 'Visitor insights and tracking'
        },
        {
            path: '/dashboard/portfolio-editor',
            icon: 'fas fa-edit',
            label: 'Portfolio Editor',
            component: PortfolioEditor,
            roles: ['owner'],
            badge: null,
            category: 'Content',
            description: 'Edit your portfolio content'
        },
        {
            path: '/dashboard/skills',
            icon: 'fas fa-cogs',
            label: 'Skills',
            component: SkillsEditor,
            roles: ['owner'],
            badge: null,
            category: 'Content',
            description: 'Manage your skills'
        },
        {
            path: '/dashboard/media',
            icon: 'fas fa-images',
            label: 'Media',
            component: MediaManager,
            roles: ['owner'],
            badge: null,
            category: 'Content',
            description: 'Upload and manage media files'
        },
        {
            path: '/dashboard/reviews',
            icon: 'fas fa-star',
            label: 'Reviews',
            component: ReviewsManager,
            roles: ['owner'],
            badge: '3',
            category: 'Content',
            description: 'Manage testimonials and reviews'
        },
        {
            path: '/dashboard/emails',
            icon: 'fas fa-envelope',
            label: 'Emails',
            component: EmailManager,
            roles: ['owner'],
            badge: '5',
            category: 'Communication',
            description: 'Manage email communications'
        },
        {
            path: '/dashboard/chat',
            icon: 'fas fa-comments',
            label: 'Chat',
            component: ChatSystem,
            roles: ['owner', 'collaborator'],
            badge: '2',
            category: 'Communication',
            description: 'Team chat and collaboration'
        },
        {
            path: '/dashboard/ai-assistant',
            icon: 'fas fa-robot',
            label: 'AI Assistant',
            component: AIAssistant,
            roles: ['owner', 'collaborator'],
            badge: 'New',
            category: 'Communication',
            description: 'AI-powered help and suggestions'
        },
        {
            path: '/dashboard/collaborators',
            icon: 'fas fa-users',
            label: 'Collaborators',
            component: Collaborators,
            roles: ['owner'],
            badge: null,
            category: 'Team',
            description: 'Manage team members'
        },
        {
            path: '/dashboard/collaboration-requests',
            icon: 'fas fa-user-plus',
            label: 'Collab Requests',
            component: CollaborationRequests,
            roles: ['owner'],
            badge: '1',
            category: 'Team',
            description: 'Pending collaboration requests'
        },
        {
            path: '/dashboard/ai-tracking',
            icon: 'fas fa-activity',
            label: 'AI Tracking',
            component: AITrackingSystem,
            roles: ['owner'],
            badge: null,
            category: 'Advanced',
            description: 'AI-powered visitor tracking'
        },
        {
            path: '/dashboard/theme',
            icon: 'fas fa-palette',
            label: 'Themes',
            component: ThemeManager,
            roles: ['owner'],
            badge: null,
            category: 'Advanced',
            description: 'Customize your portfolio theme'
        },
        {
            path: '/dashboard/learning',
            icon: 'fas fa-graduation-cap',
            label: 'Learning Center',
            component: LearningCenter,
            roles: ['owner', 'collaborator'],
            badge: null,
            category: 'Advanced',
            description: 'Tutorials and learning resources'
        },
        {
            path: '/dashboard/profile',
            icon: 'fas fa-user',
            label: 'Profile',
            component: Profile,
            roles: ['owner', 'collaborator'],
            badge: null,
            category: 'Account',
            description: 'Manage your profile'
        },
        {
            path: '/dashboard/settings',
            icon: 'fas fa-cog',
            label: 'Settings',
            component: Settings,
            roles: ['owner', 'collaborator'],
            badge: null,
            category: 'Account',
            description: 'Application settings'
        }
    ], []);

    // Filter menu items by role
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter(item => item.roles.includes(userRole));
    }, [menuItems, userRole]);

    // Use filtered items directly for routing
    const flatMenuItems = filteredMenuItems;

    // Get current page info
    const currentPage = useMemo(() => {
        return flatMenuItems.find(item => item.path === location.pathname);
    }, [flatMenuItems, location.pathname]);

    // Generate breadcrumbs
    const breadcrumbs = useMemo(() => {
        if (location.pathname === '/dashboard') {
            return [];
        }
        
        const crumbs = [];
        
        if (currentPage) {
            // Add category breadcrumb if not Main
            if (currentPage.category && currentPage.category !== 'Main') {
                crumbs.push({ label: currentPage.category });
            }
            
            crumbs.push({ label: currentPage.label });
        }
        
        return crumbs;
    }, [currentPage, location.pathname]);

    // Handle sidebar toggle
    const handleSidebarToggle = () => {
        setSidebarCollapsed(prev => {
            const newValue = !prev;
            localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
            return newValue;
        });
    };

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 1024;
            
            if (isMobile && !sidebarCollapsed) {
                setSidebarCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarCollapsed]);

    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Page transition variants
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Sidebar */}
            <DashboardSideNavbar
                collapsed={sidebarCollapsed}
                setCollapsed={handleSidebarToggle}
                menuItems={filteredMenuItems}
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
                sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'
            }`}>
                {/* Top Navbar */}
                <DashboardTopNavbar
                    onToggleSidebar={handleSidebarToggle}
                    sidebarCollapsed={sidebarCollapsed}
                    breadcrumbs={breadcrumbs}
                    showBreadcrumbs={true}
                    showSearch={true}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center min-h-[60vh]">
                                    <div className="text-center">
                                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-slate-400">Loading...</p>
                                    </div>
                                </div>
                            }
                        >
                            <Routes location={location} key={location.pathname}>
                                {flatMenuItems.map((item, index) => (
                                    <Route
                                        key={index}
                                        path={item.path.replace('/dashboard', '') || '/'}
                                        element={
                                            <motion.div
                                                variants={pageVariants}
                                                initial="initial"
                                                animate="animate"
                                                exit="exit"
                                                transition={{ duration: 0.3 }}
                                                className="h-full"
                                            >
                                                <item.component />
                                            </motion.div>
                                        }
                                    />
                                ))}
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Suspense>
                    </AnimatePresence>
                </main>

                {/* Footer - Optional */}
                <DashboardFooter />
            </div>

            {/* Mobile Menu Backdrop */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>

            {/* Quick Access Button (Mobile) */}
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl shadow-cyan-500/50 flex items-center justify-center z-40 active:scale-95 transition-transform"
            >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Scroll to Top Button */}
            <ScrollToTopButton />
        </div>
    );
};

// Dashboard Footer Component
const DashboardFooter = () => {
    return (
        <footer className="border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                        <span>© 2024 Portfolio Dashboard</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">All rights reserved</span>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                        <a 
                            href="/privacy" 
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            Privacy
                        </a>
                        <a 
                            href="/terms" 
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            Terms
                        </a>
                        <a 
                            href="/support" 
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            Support
                        </a>
                        <a 
                            href="/docs" 
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            Docs
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Scroll to Top Button Component
const ScrollToTopButton = () => {
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        const checkScrollTop = () => {
            if (!showScroll && window.pageYOffset > 400) {
                setShowScroll(true);
            } else if (showScroll && window.pageYOffset <= 400) {
                setShowScroll(false);
            }
        };

        window.addEventListener('scroll', checkScrollTop);
        return () => window.removeEventListener('scroll', checkScrollTop);
    }, [showScroll]);

    const scrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {showScroll && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={scrollTop}
                    className="fixed bottom-6 left-6 w-12 h-12 bg-slate-800 border border-slate-700 rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-slate-700 transition-colors group"
                    title="Scroll to top"
                >
                    <svg 
                        className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default Dashboard;