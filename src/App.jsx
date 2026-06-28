import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AuthProvider from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPageThemeProvider } from './contexts/LandingPageThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { SettingsProvider } from './contexts/SettingsContext';
import NotificationProvider from './components/NotificationSystem';
import ProtectedRoute from './components/ProtectedRoute';
import MobileBottomNav from './components/MobileBottomNav';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PublicReviews = lazy(() => import('./components/PublicReviews'));
const CollaborationRequest = lazy(() => import('./components/CollaborationRequestStyled'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Sitemap = lazy(() => import('./pages/Sitemap'));
const CVPage = lazy(() => import('./pages/CVPage'));
const CollaboratorWorkspace = lazy(() => import('./components/CollaboratorWorkspace'));

// Component to handle hash navigation
const HashNavigationHandler = () => {
    const location = useLocation();

    useEffect(() => {
        // Handle hash navigation for landing page sections
        if (location.hash) {
            const element = document.getElementById(location.hash.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return null;
};

const AppContent = () => {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard');
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    return (
        <div className="App min-h-screen">
            <HashNavigationHandler />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={
                    <LandingPageThemeProvider>
                        <LandingPage />
                    </LandingPageThemeProvider>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/collaborator" element={<LoginPage collaborator={true} />} />
                <Route path="/collaborate" element={<CollaborationRequest />} />
                <Route path="/reviews" element={<PublicReviews />} />
                <Route path="/workspace" element={
                    <ProtectedRoute>
                        <CollaboratorWorkspace />
                    </ProtectedRoute>
                } />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/cv" element={<CVPage />} />
                <Route 
                    path="/dashboard/*" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                {/* Catch-all route for 404 */}
                <Route path="*" element={
                    <LandingPageThemeProvider>
                        <LandingPage />
                    </LandingPageThemeProvider>
                } />
              </Routes>
            </Suspense>
            {isDashboard && <MobileBottomNav />}
        </div>
    );
};

const App = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true
        });
        
        // Global settings listener for real-time updates
        const handleSettingsChange = (event) => {
            const settings = event.detail;
            console.log('Global settings change:', settings);
            
            // Apply global settings
            if (settings.appearance?.fontSize) {
                const root = document.documentElement;
                const fontSizes = {
                    small: '14px',
                    medium: '16px',
                    large: '18px',
                    xlarge: '20px'
                };
                root.style.setProperty('--base-font-size', fontSizes[settings.appearance.fontSize] || '16px');
            }
            
            // Apply theme changes
            if (settings.appearance?.theme) {
                document.body.className = `theme-${settings.appearance.theme}`;
            }
            
            // Apply language
            if (settings.appearance?.language) {
                document.documentElement.lang = settings.appearance.language;
            }
            
            // Update page title with user name if available
            if (settings.profile?.name) {
                document.title = `${settings.profile.name} - E-Folio`;
            }
        };
        
        window.addEventListener('settingsChanged', handleSettingsChange);
        
        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
        };
    }, []);

    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <SocketProvider>
                        <SettingsProvider>
                            <Router basename={import.meta.env.BASE_URL}>
                                <AppContent />
                            </Router>
                        </SettingsProvider>
                    </SocketProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;

