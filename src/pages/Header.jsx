import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (isMobile) {
                if (currentScrollY > lastScrollY) {
                    setVisible(false); // Scrolling down
                } else {
                    setVisible(true);  // Scrolling up
                }
            }
            
            setLastScrollY(currentScrollY);
            setScrollPosition(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [lastScrollY, isMobile]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMobile) {
            setVisible(true);
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className={`header ${scrollPosition > 20 ? 'sticky' : ''}`}>
            <div className="header-container">
                <a href="#about" className="logo" style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="fas fa-code" style={{ fontSize: '32px' }}></i> 
                    Danie<span style={{ color: '#0ef' }}>Tech</span>
                </a>

                <nav className={`navbar ${isMenuOpen ? 'active' : ''} ${isMobile && !visible ? 'hidden' : 'visible'}`}>
                    <a href="#about" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-user" style={{ fontSize: '19px' }}></i>
                        <span>About</span>
                    </a>
                    <a href="#skills" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-cogs" style={{ fontSize: '19px' }}></i>
                        <span>Skills</span>
                    </a>
                    <a href="#education" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-graduation-cap" style={{ fontSize: '19px' }}></i>
                        <span>Education</span>
                    </a>
                    <a href="#interests" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-heart" style={{ fontSize: '19px' }}></i>
                        <span>Interests</span>
                    </a>
                    <a href="#projects" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-project-diagram" style={{ fontSize: '19px' }}></i>
                        <span>Projects</span>
                    </a>
                    <a href="#contact" className="nav-link" onClick={closeMenu} style={{ fontSize: '17px' }}>
                        <i className="fas fa-envelope" style={{ fontSize: '19px' }}></i>
                        <span>Contact</span>
                    </a>
                    <Link to="/dashboard" className="nav-link nav-link-special dashboard-icon-btn" onClick={closeMenu} style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#ffffff',
                        padding: '14px 14px',
                        borderRadius: '12px',
                        marginLeft: '20px',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)',
                        fontSize: '22px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <i className="fas fa-grip-horizontal" style={{ 
                            fontSize: '20px',
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        }}></i>
                    </Link>
                    <Link to="/collaborate" className="nav-link nav-link-special collaborate-btn-header" onClick={closeMenu} style={{
                        background: 'linear-gradient(135deg, #00efff, #7c3aed, #00efff)',
                        backgroundSize: '200% 200%',
                        color: '#ffffff',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        marginLeft: '8px',
                        boxShadow: '0 0 20px rgba(0, 239, 255, 0.6), 0 0 40px rgba(124, 58, 237, 0.4)',
                        fontSize: '17px',
                        fontWeight: '900',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                        border: '2px solid rgba(0, 239, 255, 0.5)',
                        animation: 'gradientShift 3s ease infinite, pulse 2s ease-in-out infinite',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-handshake" style={{ fontSize: '20px', fontWeight: '900', marginRight: '8px' }}></i>
                        <span style={{ position: 'relative', zIndex: 1 }}>Collaborate</span>
                        <i className="fas fa-sparkles" style={{ fontSize: '14px', marginLeft: '6px' }}></i>
                    </Link>
                </nav>

                <div className="nav-toggle" onClick={toggleMenu}>
                    <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
