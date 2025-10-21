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
                                        className="collaborate-btn"
                        style={{
                            background: 'linear-gradient(135deg,rgb(28, 105, 110),rgb(44, 101, 112))',
                            border: 'none',
                            color: '#034c79', // Change to dark blue for contrast
                            padding: '16px 40px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '18px',
                            fontFamily: "'Poppins', sans-serif",
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 8px 24px rgba(0, 239, 255, 0.4)',
                            transform: 'scale(1)'
                        }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 239, 255, 0.6)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 239, 255, 0.4)';
                    }}
                >
                    <i className="fas fa-handshake" style={{ fontSize: '22px' }}></i> 
                    <span>Collaborate with Me</span>
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
        </div>
    );
};

export default LandingPage;
