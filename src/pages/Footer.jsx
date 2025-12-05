import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState({ message: '', type: '' });
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        // Simulate API call
        setSubscribeStatus({ message: 'Subscribing...', type: 'loading' });
        
        setTimeout(() => {
            setSubscribeStatus({ 
                message: 'Thanks for subscribing! 🎉', 
                type: 'success' 
            });
            setEmail('');
            
            setTimeout(() => {
                setSubscribeStatus({ message: '', type: '' });
            }, 3000);
        }, 1000);
    };

    const footerLinks = {
        quickLinks: [
            { name: 'About', href: '#about', icon: 'fas fa-user' },
            { name: 'Skills', href: '#skills', icon: 'fas fa-cogs' },
            { name: 'Education', href: '#education', icon: 'fas fa-graduation-cap' },
            { name: 'Projects', href: '#projects', icon: 'fas fa-project-diagram' },
            { name: 'Contact', href: '#contact', icon: 'fas fa-envelope' }
        ],
        services: [
            { name: 'Web Development', icon: 'fas fa-code' },
            { name: 'UI/UX Design', icon: 'fas fa-palette' },
            { name: 'Mobile Apps', icon: 'fas fa-mobile-alt' },
            { name: 'Consulting', icon: 'fas fa-handshake' }
        ],
        resources: [
            { name: 'Blog', href: '/blog', icon: 'fas fa-blog' },
            { name: 'Portfolio', href: '#projects', icon: 'fas fa-briefcase' },
            { name: 'Resume', href: '/assets/cv/CV2.pdf', icon: 'fas fa-file-pdf', download: true },
            { name: 'Collaborate', href: '/collaborate', icon: 'fas fa-users' }
        ]
    };

    const socialLinks = [
        { 
            name: 'GitHub', 
            icon: 'fab fa-github', 
            url: 'https://github.com/devTechs001',
            color: 'github',
            gradient: 'linear-gradient(135deg, #333, #000)'
        },
        { 
            name: 'LinkedIn', 
            icon: 'fab fa-linkedin-in', 
            url: 'https://www.linkedin.com/in/daniel-mukula',
            color: 'linkedin',
            gradient: 'linear-gradient(135deg, #0077b5, #005582)'
        },
        { 
            name: 'Facebook', 
            icon: 'fab fa-facebook-f', 
            url: 'https://www.facebook.com/profile.php?id=100089960419104',
            color: 'facebook',
            gradient: 'linear-gradient(135deg, #1877f2, #0c63d4)'
        },
        { 
            name: 'Instagram', 
            icon: 'fab fa-instagram', 
            url: 'https://www.instagram.com/king_wisdom_ndk/',
            color: 'instagram',
            gradient: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
        },
        { 
            name: 'Telegram', 
            icon: 'fab fa-telegram-plane', 
            url: 'https://t.me/+254758175275',
            color: 'telegram',
            gradient: 'linear-gradient(135deg, #26A5E4, #0088cc)'
        },
        { 
            name: 'WhatsApp', 
            icon: 'fab fa-whatsapp', 
            url: 'https://wa.me/254758175275',
            color: 'whatsapp',
            gradient: 'linear-gradient(135deg, #25d366, #128c7e)'
        }
    ];

    const stats = [
        { value: '100+', label: 'Projects Completed', icon: 'fas fa-project-diagram' },
        { value: '50+', label: 'Happy Clients', icon: 'fas fa-smile' },
        { value: '5+', label: 'Years Experience', icon: 'fas fa-award' },
        { value: '24/7', label: 'Support Available', icon: 'fas fa-headset' }
    ];

    const contactInfo = [
        { 
            icon: 'fas fa-envelope', 
            text: 'devtechs842@gmail.com',
            href: 'mailto:devtechs842@gmail.com'
        },
        { 
            icon: 'fas fa-phone', 
            text: '+254 758 175 275',
            href: 'tel:+254758175275'
        },
        { 
            icon: 'fas fa-map-marker-alt', 
            text: 'Nairobi, Kenya',
            href: null
        }
    ];

    return (
        <footer className="footer-wrapper bg-bgColor border-t border-mainColor/10 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="footer-blob footer-blob-1"></div>
            <div className="footer-blob footer-blob-2"></div>
            <div className="footer-grid-pattern"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Main Footer Content */}
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {/* Brand Section */}
                        <div className="lg:col-span-1" data-aos="fade-up">
                            <div className="mb-6">
                                <a href="#about" className="footer-logo-link">
                                    <div className="footer-logo-icon">
                                        <i className="fas fa-code"></i>
                                        <div className="footer-logo-glow"></div>
                                    </div>
                                    <span className="footer-logo-text">
                                        Danie<span className="text-mainColor">Tech</span>
                                    </span>
                                </a>
                            </div>
                            <p className="text-textColor/70 text-sm leading-relaxed mb-6">
                                Crafting digital experiences with passion and precision. 
                                Transforming ideas into innovative solutions.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                {contactInfo.map((contact, index) => (
                                    <div key={index} className="footer-contact-item">
                                        <i className={contact.icon}></i>
                                        {contact.href ? (
                                            <a href={contact.href} className="footer-contact-link">
                                                {contact.text}
                                            </a>
                                        ) : (
                                            <span className="text-textColor/70 text-sm">
                                                {contact.text}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div data-aos="fade-up" data-aos-delay="100">
                            <h3 className="footer-section-title">
                                <i className="fas fa-link mr-2"></i>
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                {footerLinks.quickLinks.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="footer-link">
                                            <i className={link.icon}></i>
                                            <span>{link.name}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Services */}
                        <div data-aos="fade-up" data-aos-delay="200">
                            <h3 className="footer-section-title">
                                <i className="fas fa-briefcase mr-2"></i>
                                Services
                            </h3>
                            <ul className="space-y-3">
                                {footerLinks.services.map((service, index) => (
                                    <li key={index} className="footer-service-item">
                                        <i className={service.icon}></i>
                                        <span>{service.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div data-aos="fade-up" data-aos-delay="300">
                            <h3 className="footer-section-title">
                                <i className="fas fa-envelope-open-text mr-2"></i>
                                Newsletter
                            </h3>
                            <p className="text-textColor/70 text-sm mb-4">
                                Subscribe to get updates on latest projects and tech insights.
                            </p>
                            <form onSubmit={handleSubscribe} className="space-y-3">
                                <div className="newsletter-input-wrapper">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="newsletter-input"
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        className="newsletter-btn"
                                        disabled={subscribeStatus.type === 'loading'}
                                    >
                                        {subscribeStatus.type === 'loading' ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-paper-plane"></i>
                                        )}
                                    </button>
                                </div>
                                {subscribeStatus.message && (
                                    <p className={`newsletter-status ${subscribeStatus.type}`}>
                                        {subscribeStatus.message}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12" data-aos="fade-up">
                        {stats.map((stat, index) => (
                            <div key={index} className="footer-stat-card">
                                <div className="footer-stat-icon">
                                    <i className={stat.icon}></i>
                                </div>
                                <div className="footer-stat-value">{stat.value}</div>
                                <div className="footer-stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="footer-divider"></div>

                {/* Bottom Footer */}
                <div className="py-8">
                    <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-6">
                        {/* Copyright */}
                        <div className="text-center md:text-left">
                            <p className="text-textColor/80 text-sm md:text-base lg:text-lg mb-2">
                                &copy; {currentYear} DanieTech. All rights reserved.
                            </p>
                            <p className="text-textColor/70 text-xs md:text-sm lg:text-base flex items-center justify-center md:justify-start gap-2">
                                Crafted with 
                                <span className="heart-beat">❤️</span> 
                                by Danie Tech
                            </p>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`footer-social-icon footer-social-${social.color}`}
                                    style={{ background: social.gradient }}
                                    aria-label={social.name}
                                >
                                    <i className={social.icon}></i>
                                    <span className="footer-social-tooltip">{social.name}</span>
                                </a>
                            ))}
                        </div>

                        {/* Legal Links */}
                        <div className="flex items-center gap-4 text-xs md:text-sm lg:text-base">
                            <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
                            <span className="text-textColor/30">•</span>
                            <a href="#terms" className="footer-legal-link">Terms of Service</a>
                            <span className="text-textColor/30">•</span>
                            <a href="#sitemap" className="footer-legal-link">Sitemap</a>
                        </div>
                    </div>
                </div>

                {/* Made With Badge */}
                <div className="text-center py-4">
                    <div className="made-with-badge">
                        <i className="fas fa-code mr-2"></i>
                        Made with React, Tailwind & lots of ☕
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="scroll-to-top-btn"
                    aria-label="Scroll to top"
                >
                    <div className="scroll-arrow-wrapper">
                        <i className="fas fa-arrow-up scroll-arrow"></i>
                        <i className="fas fa-arrow-up scroll-arrow scroll-arrow-2"></i>
                        <i className="fas fa-arrow-up scroll-arrow scroll-arrow-3"></i>
                    </div>
                    <span className="scroll-to-top-text">Top</span>
                    <div className="scroll-to-top-pulse"></div>
                </button>
            )}
        </footer>
    );
};

export default Footer;