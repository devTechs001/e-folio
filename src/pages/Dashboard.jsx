import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Dashboard Layout Components
import DashboardSideNavbar from '../components/dashboard/DashboardSideNavbar';
import DashboardTopNavbar from '../components/dashboard/DashboardTopNavbar';
import Profile from '../components/dashboard/Profile';

// Dashboard Components
import DashboardHome from '../components/dashboard/DashboardHomeStyled';
import ProjectManager from '../components/dashboard/ProjectManagerEnhanced';
import SkillsEditor from '../components/dashboard/SkillsEditorEnhanced';
import ThemeManager from '../components/dashboard/ThemeManagerStyled';
import Analytics from '../components/dashboard/Analytics';
import Settings from '../components/dashboard/SettingsStyled';
import ChatSystem from '../components/dashboard/ChatSystemStyled';
import AIAssistant from '../components/dashboard/AIAssistantStyled';
import PortfolioEditor from '../components/dashboard/PortfolioEditorStyled';
import Collaborators from '../components/dashboard/CollaboratorsStyled';
import MediaManager from '../components/dashboard/MediaManagerStyled';
import VisitorsAnalytics from '../components/dashboard/VisitorsAnalyticsStyled';
import EmailManager from '../components/dashboard/EmailManagerStyled';
import CollaborationRequests from '../components/dashboard/CollaborationRequestsStyled';
import LearningCenter from '../components/dashboard/LearningCenterStyled';

const Dashboard = () => {
    const { userRole } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Auto-collapse on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        {
            path: '/dashboard',
            icon: 'fas fa-tachometer-alt',
            label: 'Overview',
            component: DashboardHome,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/projects',
            icon: 'fas fa-project-diagram',
            label: 'Projects',
            component: ProjectManager,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/skills',
            icon: 'fas fa-cogs',
            label: 'Skills',
            component: SkillsEditor,
            roles: ['owner']
        },
        {
            path: '/dashboard/theme',
            icon: 'fas fa-palette',
            label: 'Themes',
            component: ThemeManager,
            roles: ['owner']
        },
        {
            path: '/dashboard/analytics',
            icon: 'fas fa-chart-bar',
            label: 'Analytics',
            component: Analytics,
            roles: ['owner']
        },
        {
            path: '/dashboard/visitors',
            icon: 'fas fa-user-friends',
            label: 'Visitors',
            component: VisitorsAnalytics,
            roles: ['owner']
        },
        {
            path: '/dashboard/media',
            icon: 'fas fa-images',
            label: 'Media',
            component: MediaManager,
            roles: ['owner']
        },
        {
            path: '/dashboard/emails',
            icon: 'fas fa-envelope',
            label: 'Emails',
            component: EmailManager,
            roles: ['owner']
        },
        {
            path: '/dashboard/collaborators',
            icon: 'fas fa-users',
            label: 'Collaborators',
            component: Collaborators,
            roles: ['owner']
        },
        {
            path: '/dashboard/collaboration-requests',
            icon: 'fas fa-user-plus',
            label: 'Collab Requests',
            component: CollaborationRequests,
            roles: ['owner']
        },
        {
            path: '/dashboard/chat',
            icon: 'fas fa-comments',
            label: 'Collaboration Chat',
            component: ChatSystem,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/ai-assistant',
            icon: 'fas fa-robot',
            label: 'AI Assistant',
            component: AIAssistant,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/portfolio-editor',
            icon: 'fas fa-edit',
            label: 'Portfolio Editor',
            component: PortfolioEditor,
            roles: ['owner']
        },
        {
            path: '/dashboard/settings',
            icon: 'fas fa-cog',
            label: 'Settings',
            component: Settings,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/profile',
            icon: 'fas fa-user',
            label: 'Profile',
            component: Profile,
            roles: ['owner', 'collaborator']
        },
        {
            path: '/dashboard/learning',
            icon: 'fas fa-graduation-cap',
            label: 'Learning Center',
            component: LearningCenter,
            roles: ['owner', 'collaborator']
        }
    ];

    const filteredMenuItems = menuItems.filter(item => 
        item.roles.includes(userRole)
    );

    return (
        <div className="dashboard" style={{
            display: 'flex',
            minHeight: '100vh',
            background: theme.background,
            position: 'relative'
        }}>
            {/* Sidebar */}
            <DashboardSideNavbar 
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                menuItems={filteredMenuItems}
            />

            {/* Main Content */}
            <div className="main-content" style={{
                marginLeft: sidebarCollapsed ? '80px' : '280px',
                flex: 1,
                background: theme.background,
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease',
                width: `calc(100% - ${sidebarCollapsed ? '80px' : '280px'})`
            }}>
                <DashboardTopNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <Routes>
                    {filteredMenuItems.map((item, index) => (
                        <Route
                            key={index}
                            path={item.path.replace('/dashboard', '') || '/'}
                            element={<item.component />}
                        />
                    ))}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
