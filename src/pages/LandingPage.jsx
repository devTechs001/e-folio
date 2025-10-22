import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import trackingService from '../services/tracking.service';
import Header from './Header';
import About from './About';
import Skills from './Skills';
import Education from './Education';
import Interests from './Interests';
import Projects from './Projects';
import Contact from './Contact';
import Footer from './Footer';
import ReviewFloatingButton from '../components/ReviewFloatingButton';
import ThemeSwitcher from '../components/ThemeSwitcher';
import '../styles/landing-page-fixes.css';

const LandingPage = () => {
    const { isOwner } = useAuth();

    useEffect(() => {
        // Initialize visitor tracking
        trackingService.init();
        trackingService.trackPageView('/', 'Home - E-Folio Portfolio');

        return () => {
            // Cleanup if needed
        };
    }, []);

    return (
        <div className="landing-page">
            <Header />

            {/* Collaboration Invitation Section */}
            <div className="collaboration-banner" style={{
                background: 'linear-gradient(135deg, rgba(8, 27, 41, 0.9), rgba(0, 212, 255, 0.1))',
                padding: '20px',
                textAlign: 'center',
                borderBottom: '2px solid #0ef',
                marginTop: '80px'
            }}>
                <h3 style={{ color: '#0ef', marginBottom: '10px' }}>
                    Interested in Collaboration?
                </h3>
                <p style={{ color: '#ededed', marginBottom: '15px' }}>
                    Join me to explore more features, projects, and collaborative opportunities!
                </p>
                <Link 
                    to="/collaborate" 
                    className="collaborate-btn-landing"
                    style={{
                        background: 'linear-gradient(135deg, #00efff, #7c3aed, #00efff)',
                        backgroundSize: '200% 200%',
                        animation: 'gradientShift 3s ease infinite, float 3s ease-in-out infinite',
                        border: '3px solid rgba(0, 239, 255, 0.8)',
                        color: '#ffffff',
                        padding: '18px 48px',
                        borderRadius: '16px',
                        textDecoration: 'none',
                        fontWeight: '900',
                        fontSize: '20px',
                        fontFamily: "'Poppins', sans-serif",
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '14px',
                        boxShadow: '0 0 30px rgba(0, 239, 255, 0.6), 0 0 60px rgba(124, 58, 237, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)',
                        transform: 'scale(1)',
                        position: 'relative',
                        overflow: 'hidden',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08) translateY(-4px) rotate(1deg)';
                        e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 239, 255, 0.9), 0 0 80px rgba(124, 58, 237, 0.6), 0 15px 50px rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0) rotate(0deg)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 239, 255, 0.6), 0 0 60px rgba(124, 58, 237, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)';
                    }}
                >
                    <i className="fas fa-rocket" style={{ fontSize: '24px', animation: 'bounce 1s ease-in-out infinite' }}></i> 
                    <span style={{ letterSpacing: '0.5px' }}>Collaborate with Me</span>
                    <i className="fas fa-sparkles" style={{ fontSize: '18px', animation: 'twinkle 1.5s ease-in-out infinite' }}></i>
                </Link>
            </div>

            <main>
                <About />
                <Skills />
                <Education />
                <Interests />
                <Projects />
                <Contact />
            </main>
            
            <Footer />
            
            {/* Review Floating Button */}
            <ReviewFloatingButton />
            
            {/* Theme Switcher */}
            <ThemeSwitcher />
        </div>
    );
};

export default LandingPage;
