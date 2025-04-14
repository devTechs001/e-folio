import React, { useState, useEffect } from 'react';
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
                <a href="#about" className="logo">
                    <i className="fas fa-code"></i> 
                    Danie<span>Tech</span>
                </a>

                <nav className={`navbar ${isMenuOpen ? 'active' : ''} ${isMobile && !visible ? 'hidden' : 'visible'}`}>
                    <a href="#about" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-user"></i>
                        <span>About</span>
                    </a>
                    <a href="#skills" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-cogs"></i>
                        <span>Skills</span>
                    </a>
                    <a href="#education" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-graduation-cap"></i>
                        <span>Education</span>
                    </a>
                    <a href="#interests" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-heart"></i>
                        <span>Interests</span>
                    </a>
                    <a href="#projects" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-project-diagram"></i>
                        <span>Projects</span>
                    </a>
                    <a href="#contact" className="nav-link" onClick={closeMenu}>
                        <i className="fas fa-envelope"></i>
                        <span>Contact</span>
                    </a>
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
