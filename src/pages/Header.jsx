import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Header.css';

const NAV_SECTIONS = [
    { id: 'about', label: 'About', icon: 'fas fa-user' },
    { id: 'skills', label: 'Skills', icon: 'fas fa-cogs' },
    { id: 'education', label: 'Education', icon: 'fas fa-graduation-cap' },
    { id: 'interests', label: 'Interests', icon: 'fas fa-heart' },
    { id: 'projects', label: 'Projects', icon: 'fas fa-project-diagram' },
    { id: 'contact', label: 'Contact', icon: 'fas fa-envelope' }
];

const getIsMobile = () => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

const Header = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobile, setIsMobile] = useState(getIsMobile);
    const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(getIsMobile());
            if (!getIsMobile() && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        const handleScroll = () => {
            if (typeof window === 'undefined') return;
            const currentScrollY = window.scrollY;

            setIsScrolled(currentScrollY > 20);

            if (isMobile) {
                setVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
            }

            setLastScrollY(currentScrollY);
            setScrollPosition(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobile, lastScrollY, isMenuOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visibleEntry?.target?.id) {
                    setActiveSection(visibleEntry.target.id);
                }
            },
            {
                threshold: 0.35,
                rootMargin: '0px 0px -40% 0px'
            }
        );

        NAV_SECTIONS.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event) => {
            if (!event.target.closest('.navbar') && !event.target.closest('.nav-toggle')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen, isMobile]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleSectionClick = (event, sectionId) => {
        event.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        setActiveSection(sectionId);
        closeMenu();
    };

    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    const isCollaborateRoute = location.pathname === '/collaborate';

    return (
        <>
            {/* Mobile Menu Overlay */}
            {isMenuOpen && isMobile && (
                <div 
                    className="menu-overlay"
                    onClick={closeMenu}
                ></div>
            )}

            <header className={`
                header-wrapper
                ${isScrolled ? 'header-scrolled' : ''}
                ${isMobile && !visible ? 'header-hidden' : ''}
            `}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <a 
                            href="#about" 
                            className="logo-link group"
                            onClick={(e) => handleSectionClick(e, 'about')}
                        >
                            <div className="logo-icon-wrapper">
                                <i className="fas fa-code logo-icon"></i>
                                <div className="logo-icon-glow"></div>
                            </div>
                            <span className="logo-text">
                                Danie<span className="logo-highlight">Tech</span>
                            </span>
                        </a>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {NAV_SECTIONS.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className={`nav-link-desktop ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={(event) => handleSectionClick(event, section.id)}
                                    aria-current={activeSection === section.id ? 'true' : undefined}
                                >
                                    <i className={section.icon}></i>
                                    <span>{section.label}</span>
                                    <div className="nav-link-indicator"></div>
                                </a>
                            ))}

                            {/* Dashboard Button */}
                            <Link
                                to="/dashboard"
                                className={`dashboard-btn ${isDashboardRoute ? 'active' : ''}`}
                                aria-current={isDashboardRoute ? 'page' : undefined}
                            >
                                <i className="fas fa-grip-horizontal"></i>
                                <span className="dashboard-tooltip">Dashboard</span>
                                <div className="btn-shine-effect"></div>
                            </Link>

                            {/* Collaborate Button */}
                            <Link
                                to="/collaborate"
                                className={`collaborate-btn ${isCollaborateRoute ? 'active' : ''}`}
                                aria-current={isCollaborateRoute ? 'page' : undefined}
                            >
                                <i className="fas fa-handshake"></i>
                                <span className="font-bold">Collaborate</span>
                                <i className="fas fa-sparkles sparkle-icon"></i>
                                <div className="collaborate-pulse"></div>
                                <div className="btn-shine-effect"></div>
                            </Link>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="theme-toggle-btn"
                                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                            >
                                <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
                                <div className="theme-toggle-glow"></div>
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden menu-toggle-btn"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                            aria-expanded={isMenuOpen}
                        >
                            <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
                    <div className="mobile-nav-content">
                        {/* Mobile Theme Toggle */}
                        <div className="mobile-theme-toggle">
                            <button
                                onClick={toggleTheme}
                                className="mobile-theme-btn"
                            >
                                <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
                                <span>{isDarkMode ? 'Light' : 'Dark'} Mode</span>
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="mobile-nav-links">
                            {NAV_SECTIONS.map((section, index) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className={`mobile-nav-link ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={(event) => handleSectionClick(event, section.id)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="mobile-link-icon">
                                        <i className={section.icon}></i>
                                    </div>
                                    <span className="mobile-link-text">{section.label}</span>
                                    {activeSection === section.id && (
                                        <div className="mobile-link-active-indicator">
                                            <i className="fas fa-circle"></i>
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>

                        {/* Special Links */}
                        <div className="mobile-special-links">
                            <Link
                                to="/dashboard"
                                className={`mobile-dashboard-btn ${isDashboardRoute ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <i className="fas fa-grip-horizontal"></i>
                                <span>Dashboard</span>
                                <i className="fas fa-arrow-right"></i>
                            </Link>

                            <Link
                                to="/collaborate"
                                className={`mobile-collaborate-btn ${isCollaborateRoute ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <i className="fas fa-handshake"></i>
                                <span>Let's Collaborate</span>
                                <i className="fas fa-sparkles"></i>
                            </Link>
                        </div>

                        {/* Mobile Footer */}
                        <div className="mobile-nav-footer">
                            <p className="text-textColor/50 text-sm">
                                © 2024 DanieTech. All rights reserved.
                            </p>
                        </div>
                    </div>
                </nav>
            </header>
        </>
    );
};

export default Header;