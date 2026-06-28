import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Typed from 'typed.js';
import { useAuth } from '../contexts/AuthContext';
import { useSettingsListener } from '../hooks/useSettingsListener';
import '../styles/About.css';

const About = () => {
    const typedRef = useRef(null);
    const { user } = useAuth();
    const settings = useSettingsListener();
    
    // Use profile data from settings if available, otherwise fallback to user data
    const profileData = settings?.profile || user || {};
    const [socialLinks, setSocialLinks] = useState([
        {
            name: 'Facebook',
            icon: 'fab fa-facebook-f',
            url: profileData.facebook || 'https://www.facebook.com/profile.php?id=100089960419104',
            color: 'facebook'
        },
        {
            name: 'Instagram',
            icon: 'fab fa-instagram',
            url: profileData.instagram || 'https://www.instagram.com/king_wisdom_ndk/',
            color: 'instagram'
        },
        {
            name: 'GitHub',
            icon: 'fab fa-github',
            url: profileData.github || 'https://github.com/devTechs001',
            color: 'github'
        },
        {
            name: 'Telegram',
            icon: 'fab fa-telegram-plane',
            url: profileData.telegram || 'https://t.me/+254758175275',
            color: 'telegram'
        },
        {
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            url: profileData.whatsapp || 'https://wa.me/254758175275',
            color: 'whatsapp'
        },
        {
            name: 'LinkedIn',
            icon: 'fab fa-linkedin-in',
            url: profileData.linkedin || '',
            color: 'linkedin'
        },
        {
            name: 'Twitter',
            icon: 'fab fa-twitter',
            url: profileData.twitter || '',
            color: 'twitter'
        },
        {
            name: 'Website',
            icon: 'fas fa-globe',
            url: profileData.website || '',
            color: 'website'
        }
    ].filter(link => link.url)); // Filter out empty URLs

    // Update social links when profile data changes
    useEffect(() => {
        if (settings?.profile) {
            const updatedLinks = [
                {
                    name: 'Facebook',
                    icon: 'fab fa-facebook-f',
                    url: settings.profile.facebook || 'https://www.facebook.com/profile.php?id=100089960419104',
                    color: 'facebook'
                },
                {
                    name: 'Instagram',
                    icon: 'fab fa-instagram',
                    url: settings.profile.instagram || 'https://www.instagram.com/king_wisdom_ndk/',
                    color: 'instagram'
                },
                {
                    name: 'GitHub',
                    icon: 'fab fa-github',
                    url: settings.profile.github || 'https://github.com/devTechs001',
                    color: 'github'
                },
                {
                    name: 'Telegram',
                    icon: 'fab fa-telegram-plane',
                    url: settings.profile.telegram || 'https://t.me/+254758175275',
                    color: 'telegram'
                },
                {
                    name: 'WhatsApp',
                    icon: 'fab fa-whatsapp',
                    url: settings.profile.whatsapp || 'https://wa.me/254758175275',
                    color: 'whatsapp'
                },
                {
                    name: 'LinkedIn',
                    icon: 'fab fa-linkedin-in',
                    url: settings.profile.linkedin || '',
                    color: 'linkedin'
                },
                {
                    name: 'Twitter',
                    icon: 'fab fa-twitter',
                    url: settings.profile.twitter || '',
                    color: 'twitter'
                },
                {
                    name: 'Website',
                    icon: 'fas fa-globe',
                    url: settings.profile.website || '',
                    color: 'website'
                }
            ].filter(link => link.url);
            
            setSocialLinks(updatedLinks);
        }
    }, [settings?.profile]);

    // Initialize Typed.js
    useEffect(() => {
        const options = {
            strings: [
                'Frontend Developer',
                'Web Designer',
                'UI/UX Designer',
                'Software Developer',
                'Full Stack Developer',
                'Creative Problem Solver'
            ],
            typeSpeed: 100,
            backSpeed: 50,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|',
        };

        let typedInstance = null;
        if (typedRef.current) {
            typedInstance = new Typed(typedRef.current, options);
        }

        return () => {
            if (typedInstance && typeof typedInstance.destroy === 'function') {
                typedInstance.destroy();
            }
        };
    }, []);

    const images = [
        { src: 'assets/images/profile-pic.jpg', alt: 'Daniel Mukula - Profile' },
        { src: 'assets/images/profile_pic.png', alt: 'Daniel Mukula - Portrait' },
        { src: 'assets/images/programmer.png', alt: 'Daniel Mukula - Developer' }
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { number: '5+', label: 'Years Experience' },
        { number: '100+', label: 'Projects Completed' },
        { number: '50+', label: 'Happy Clients' },
        { number: '15+', label: 'Technologies' }
    ];

    return (
        <section className="about-section" id="about">
            {/* Animated Background Blobs */}
            <div className="about-blob about-blob-1"></div>
            <div className="about-blob about-blob-2"></div>
            <div className="about-blob about-blob-3"></div>

            <div className="container mx-auto px-4 md:px-8 lg:px-16 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 min-h-screen py-20 lg:py-0">
                    
                    {/* Left Content */}
                    <div className="flex-1 max-w-3xl text-center lg:text-left order-2 lg:order-1" data-aos="fade-right">
                        {/* Welcome Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-mainColor/10 to-mainColor/5 border border-mainColor/30 rounded-full backdrop-blur-sm">
                            <span className="w-2 h-2 bg-mainColor rounded-full animate-pulse"></span>
                            <span className="welcome-badge-text gradient-text-animated">
                                WELCOME TO MY PORTFOLIO
                            </span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="main-heading text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-textColor mb-4 leading-tight">
                            {profileData.name ? profileData.name.split(' ')[0] : 'Danie'} <span className="gradient-text-animated">{profileData.name ? profileData.name.split(' ')[1] || 'Tech' : 'Tech'}</span>
                        </h1>

                        {/* Typed Text */}
                        <div className="mb-6">
                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-textColor/90">
                                    I'm a <span ref={typedRef} className="multiple-text text-mainColor"></span>
                                </h2>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 mb-8">
                            <p className="text-base md:text-lg text-textColor/80 leading-relaxed">
                                {profileData.bio || 
                                `I am a passionate and creative developer with a strong foundation in web development 
                                and software engineering. I specialize in creating responsive and user-friendly web 
                                applications using modern technologies and best practices.`}
                            </p>
                            <p className="text-base md:text-lg text-textColor/80 leading-relaxed">
                                My approach combines technical excellence with creative problem-solving, ensuring 
                                that each project not only functions flawlessly but also provides an exceptional 
                                user experience.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, index) => (
                                <div 
                                    key={index}
                                    className="stat-card group"
                                    data-aos="fade-up"
                                    data-aos-delay={index * 100}
                                >
                                    <div className="stat-number gradient-text-animated">
                                        {stat.number}
                                    </div>
                                    <div className="stat-label text-textColor/70 text-xs md:text-sm mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Social Media Icons */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.name}
                                    className={`social-icon social-icon-${social.color}`}
                                    data-aos="zoom-in"
                                    data-aos-delay={index * 100}
                                >
                                    <i className={social.icon}></i>
                                    <span className="social-tooltip">{social.name}</span>
                                </a>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <a 
                                href="/assets/cv/CV2.pdf" 
                                className="btn-primary group"
                                download
                                data-aos="fade-up"
                            >
                                <span className="btn-icon">
                                    <i className="fas fa-download"></i>
                                </span>
                                <span className="btn-text">Download CV</span>
                                <span className="btn-shine"></span>
                            </a>
                            
                            <a 
                                href="#contact" 
                                className="btn-secondary group"
                                data-aos="fade-up"
                                data-aos-delay="100"
                            >
                                <span className="btn-icon">
                                    <i className="fas fa-paper-plane"></i>
                                </span>
                                <span className="btn-text">Get In Touch</span>
                                <span className="btn-shine"></span>
                            </a>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="flex-shrink-0 order-1 lg:order-2" data-aos="fade-left">
                        <div className="about-image-container">
                            {/* Decorative Elements */}
                            <div className="image-decoration image-decoration-1"></div>
                            <div className="image-decoration image-decoration-2"></div>
                            <div className="image-decoration image-decoration-3"></div>
                            
                            {/* Main Image Wrapper */}
                            <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
                                {/* Additional Spinning Rings */}
                                <div className="circle-spin-3"></div>
                                <div className="circle-spin-2"></div>
                                {/* Spinning Border */}
                                <div className="circle-spin"></div>
                                
                                {/* Glow Effect */}
                                <div className="image-glow"></div>
                                
                                {/* Particle Effects */}
                                <div className="image-particle particle-1"></div>
                                <div className="image-particle particle-2"></div>
                                <div className="image-particle particle-3"></div>
                                <div className="image-particle particle-4"></div>
                                <div className="image-particle particle-5"></div>
                                
                                {/* Profile Image - Auto-switching */}
                                <div className="image-wrapper">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={currentImageIndex}
                                            src={images[currentImageIndex].src}
                                            alt={images[currentImageIndex].alt}
                                            className="w-full h-full object-cover rounded-full"
                                            loading="lazy"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </AnimatePresence>
                                    
                                    {/* Status Badge */}
                                    <div className="status-badge">
                                        <span className="status-dot"></span>
                                        <span className="status-text">Available for work</span>
                                    </div>
                                </div>
                                
                                {/* Image Navigation Dots */}
                                <div className="flex justify-center gap-2 mt-6">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                                idx === currentImageIndex
                                                    ? 'bg-mainColor w-6'
                                                    : 'bg-mainColor/30 hover:bg-mainColor/50'
                                            }`}
                                            aria-label={`Switch to image ${idx + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Floating Icons */}
                                <div className="floating-icon floating-icon-1">
                                    <i className="fab fa-react"></i>
                                </div>
                                <div className="floating-icon floating-icon-2">
                                    <i className="fab fa-node-js"></i>
                                </div>
                                <div className="floating-icon floating-icon-3">
                                    <i className="fab fa-js"></i>
                                </div>
                                <div className="floating-icon floating-icon-4">
                                    <i className="fab fa-css3-alt"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="scroll-indicator">
                <div className="scroll-mouse">
                    <div className="scroll-wheel"></div>
                </div>
                <p className="text-textColor/50 text-xs mt-2">Scroll Down</p>
            </div>
        </section>
    );
};

export default About;