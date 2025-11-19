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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(getIsMobile());
        };

        const handleScroll = () => {
            if (typeof window === 'undefined') return;
            const currentScrollY = window.scrollY;

            if (isMobile) {
                setVisible(currentScrollY <= lastScrollY);
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
    }, [isMobile, lastScrollY]);

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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMobile) {
            setVisible(true);
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleSectionClick = (event, sectionId) => {
        event.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setActiveSection(sectionId);
        closeMenu();
    };

    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    const isCollaborateRoute = location.pathname === '/collaborate';

    return (
        <header className={`header ${scrollPosition > 20 ? 'sticky' : ''}`}>
            <div className="header-container">
                <a href="#about" className="logo" style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="fas fa-code" style={{ fontSize: '28px' }}></i> 
                    Danie<span style={{ color: '#0ef' }}>Tech</span>
                </a>

                <nav className={`navbar ${isMenuOpen ? 'active' : ''} ${isMobile && !visible ? 'hidden' : 'visible'}`}>
                    {NAV_SECTIONS.map((section) => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
                            onClick={(event) => handleSectionClick(event, section.id)}
                            aria-current={activeSection === section.id ? 'true' : undefined}
                            style={{ fontSize: '17px' }}
                        >
                            <i className={section.icon} style={{ fontSize: '19px' }}></i>
                            <span>{section.label}</span>
                        </a>
                    ))}
                    <Link
                        to="/dashboard"
                        className={`nav-link nav-link-special dashboard-icon-btn ${isDashboardRoute ? 'active' : ''}`}
                        onClick={closeMenu}
                        aria-current={isDashboardRoute ? 'page' : undefined}
                        style={{
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
                    }}
                    >
                        <i className="fas fa-grip-horizontal" style={{ 
                            fontSize: '20px',
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        }}></i>
                    </Link>
                    <Link
                        to="/collaborate"
                        className={`nav-link nav-link-special collaborate-btn-header ${isCollaborateRoute ? 'active' : ''}`}
                        onClick={closeMenu}
                        aria-current={isCollaborateRoute ? 'page' : undefined}
                        style={{
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
                    }}
                    >
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
