import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AuthProvider from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import NotificationProvider from './components/NotificationSystem';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import CollaborationRequest from './components/CollaborationRequestStyled';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

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

const App = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true
        });
    }, []);

    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <SocketProvider>
                        <Router>
                            <div className="App min-h-screen">
                                <HashNavigationHandler />
                                <Routes>
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/collaborate" element={<CollaborationRequest />} />
                                    <Route 
                                        path="/dashboard/*" 
                                        element={
                                            <ProtectedRoute>
                                                <Dashboard />
                                            </ProtectedRoute>
                                        } 
                                    />
                                    {/* Catch-all route for 404 */}
                                    <Route path="*" element={<LandingPage />} />
                                </Routes>
                            </div>
                        </Router>
                    </SocketProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;

