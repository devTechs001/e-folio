import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Typed from 'typed.js';
import { useAuth } from '../contexts/AuthContext';
import { useSettingsListener } from '../hooks/useSettingsListener';
import {
    ABOUT_WELCOME, ABOUT_AVAILABILITY, ABOUT_CV_HREF, ABOUT_ROLES,
    ABOUT_IMAGES, ABOUT_BIO_FALLBACK, ABOUT_SECOND_PARAGRAPH,
    buildAboutProfile, aboutNameParts
} from '../utils/aboutPageData';
import '../styles/About.css';

const About = () => {
    const typedRef = useRef(null);
    const { user } = useAuth();
    const settings = useSettingsListener();
    
    // Same real data model as the dashboard Profile page: /api/settings
    // (dispatched through SettingsProvider) with the auth user as fallback.
    const aboutProfile = buildAboutProfile(settings?.profile, user);
    const { first, second } = aboutNameParts(aboutProfile.name);
    const [socialLinks, setSocialLinks] = useState(aboutProfile.socialLinks);

    // Keep the public links in sync when the owner edits them in Settings.
    useEffect(() => {
        setSocialLinks(buildAboutProfile(settings?.profile, user).socialLinks);
    }, [settings?.profile, user]);

    // Initialize Typed.js
    useEffect(() => {
        const options = {
            strings: ABOUT_ROLES,
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

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            // Pause background-tab work: a hidden carousel only burns CPU.
            if (typeof document !== 'undefined' && document.hidden) return;
            setCurrentImageIndex(prev => (prev + 1) % ABOUT_IMAGES.length);
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
                                {ABOUT_WELCOME}
                            </span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="main-heading text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-textColor mb-4 leading-tight">
                            {first} <span className="gradient-text-animated">{second}</span>
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
                                {aboutProfile.bio || ABOUT_BIO_FALLBACK}
                            </p>
                            <p className="text-base md:text-lg text-textColor/80 leading-relaxed">
                                {ABOUT_SECOND_PARAGRAPH}
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
                                href={ABOUT_CV_HREF}
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
                                            src={ABOUT_IMAGES[currentImageIndex].src}
                                            alt={ABOUT_IMAGES[currentImageIndex].alt}
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
                                        <span className="status-text">{aboutProfile.availability || ABOUT_AVAILABILITY}</span>
                                    </div>
                                </div>
                                
                                {/* Image Navigation Dots */}
                                <div className="flex justify-center gap-2 mt-6">
                                    {ABOUT_IMAGES.map((_, idx) => (
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