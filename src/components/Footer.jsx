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
                <div className="footer-social">
                    <a href="https://github.com/devTechs001" target="_blank" rel="noopener noreferrer">
                        <span className="dot dot-github"></span>
                    </a>
                    <a href="https://www.linkedin.com/in/daniel-mukula" target="_blank" rel="noopener noreferrer">
                        <span className="dot dot-linkedin"></span>
                    </a>
                    <a href="https://www.instagram.com/king_wisdom_ndk/" target="_blank" rel="noopener noreferrer">
                        <span className="dot dot-instagram"></span>
                    </a>
                    <a href="https://wa.me/254758175275" target="_blank" rel="noopener noreferrer">
                        <span className="dot dot-whatsapp"></span>
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
