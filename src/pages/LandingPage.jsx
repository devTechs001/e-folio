import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

    return (
        <div className="landing-page">
            <Header />
            
            {/* Owner Dashboard Access Button */}
            {isOwner() && (
                <div className="dashboard-access" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000
                }}>
                    <Link 
                        to="/dashboard" 
                        className="dashboard-btn"
                        style={{
                            background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                            color: '#081b29',
                            padding: '12px 24px',
                            borderRadius: '25px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(0, 239, 255, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-tachometer-alt"></i> Dashboard
                    </Link>
                </div>
            )}

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
                        background: 'linear-gradient(135deg, #00efff, #00d4ff)',
                        border: 'none',
                        color: '#081b29',
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
