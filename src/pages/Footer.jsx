import React, { useState, useEffect } from 'react';
import '../styles/Footer.css';

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-social" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <a href="https://github.com/devTechs001" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #333, #000)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fab fa-github" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </a>
                    <a href="https://www.linkedin.com/in/daniel-mukula" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0077b5, #005582)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0, 119, 181, 0.4)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fab fa-linkedin-in" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </a>
                    <a href="https://www.instagram.com/king_wisdom_ndk/" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(225, 48, 108, 0.4)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fab fa-instagram" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </a>
                    <a href="https://wa.me/254758175275" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #25d366, #128c7e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(37, 211, 102, 0.4)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fab fa-whatsapp" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </a>
                </div>
                
                <div className="footer-text">
                    <p>&copy; {currentYear} Danie Tech. All rights reserved.</p>
                    <p>Crafted with <span className="dot dot-heart"></span> by Daniel Mukula</p>
                </div>

                <div className="footer-links">
                    <a href="#about">About</a>
                    <a href="#skills">Skills</a>
                    <a href="#projects">Projects</a>
                    <a href="#contact">Contact</a>
                </div>
            </div>

            {showScrollTop && (
                <div className="scroll-dots" onClick={scrollToTop}>
                    <span className="dot dot-scroll"></span>
                    <span className="dot dot-scroll"></span>
                    <span className="dot dot-scroll"></span>
                </div>
            )}
        </footer>
    );
};

export default Footer;
