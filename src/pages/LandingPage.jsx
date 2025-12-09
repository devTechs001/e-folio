import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import trackingService from '../services/tracking.service';
import Header from './Header';
import About from './About';
import Skills from './Skills';
import Education from './Education';
import Interests from './Interests';
import Projects from './Projects';
import Testimonials from './Testimonials';
import Contact from './Contact';
import Footer from './Footer';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ReviewFloatingButton from '../components/ReviewFloatingButton';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const { isOwner } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [showBanner, setShowBanner] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        // Initialize visitor tracking
        trackingService.init();
        trackingService.trackPageView('/', 'Home - E-Folio Portfolio');

        // Simulate page load
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        // Track scroll progress
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const features = [
        {
            icon: 'fas fa-rocket',
            title: 'Innovative Projects',
            description: 'Cutting-edge solutions'
        },
        {
            icon: 'fas fa-users',
            title: 'Team Collaboration',
            description: 'Work together seamlessly'
        },
        {
            icon: 'fas fa-code',
            title: 'Clean Code',
            description: 'Best practices always'
        },
        {
            icon: 'fas fa-clock',
            title: '24/7 Support',
            description: 'Always available'
        }
    ];

    if (isLoading) {
        return (
            <div className="landing-loader">
                <div className="loader-content">
                    <div className="loader-logo">
                        <i className="fas fa-code"></i>
                        <div className="loader-logo-glow"></div>
                    </div>
                    <h2 className="loader-text">
                        Danie<span className="text-mainColor">Tech</span>
                    </h2>
                    <div className="loader-bar">
                        <div className="loader-progress"></div>
                    </div>
                    <p className="loader-status">Loading amazing portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page relative">
            {/* Scroll Progress Bar */}
            <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

            {/* Header */}
            <Header />

            {/* Hero Collaboration Banner */}
            {showBanner && (
                <section className="collaboration-hero" data-aos="fade-down">
                    {/* Background Effects */}
                    <div className="hero-blob hero-blob-1"></div>
                    <div className="hero-blob hero-blob-2"></div>
                    <div className="hero-particles">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="hero-particle" style={{ '--i': i }}></div>
                        ))}
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10">
                        <button
                            onClick={() => setShowBanner(false)}
                            className="banner-close-btn"
                            aria-label="Close banner"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-mainColor/10 to-mainColor/5 border border-mainColor/30 rounded-full backdrop-blur-sm" data-aos="zoom-in">
                                <span className="w-2 h-2 bg-mainColor rounded-full animate-pulse"></span>
                                <span className="text-mainColor text-sm font-medium tracking-wide">
                                    NEW OPPORTUNITIES AVAILABLE
                                </span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor mb-6 leading-tight" data-aos="fade-up">
                                Ready to Build Something
                                <span className="block mt-2">
                                    <span className="hero-gradient-text">Amazing Together?</span>
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg md:text-xl text-textColor/80 max-w-3xl mx-auto mb-8 leading-relaxed" data-aos="fade-up" data-aos-delay="100">
                                Join me to explore innovative projects, collaborative opportunities, 
                                and cutting-edge solutions. Let's create something extraordinary!
                            </p>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="feature-card"
                                        data-aos="zoom-in"
                                        data-aos-delay={index * 100}
                                    >
                                        <div className="feature-icon">
                                            <i className={feature.icon}></i>
                                        </div>
                                        <h3 className="text-textColor font-semibold text-sm mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-textColor/60 text-xs">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <Link
                                to="/collaborate"
                                className="hero-cta-btn group"
                                data-aos="zoom-in"
                                data-aos-delay="200"
                            >
                                <div className="btn-glow"></div>
                                <i className="fas fa-rocket text-2xl group-hover:animate-bounce"></i>
                                <span className="font-black text-lg tracking-wide">
                                    Collaborate with Me
                                </span>
                                <i className="fas fa-sparkles sparkle-1"></i>
                                <i className="fas fa-sparkles sparkle-2"></i>
                                <i className="fas fa-arrow-right arrow-icon"></i>
                                <div className="btn-shine"></div>
                            </Link>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-textColor/60" data-aos="fade-up" data-aos-delay="300">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                    <span>100+ Projects</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                    <span>50+ Happy Clients</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                    <span>5+ Years Experience</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                    <span>24/7 Support</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Animated Wave Divider */}
                    <div className="wave-divider">
                        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="wave-path"></path>
                        </svg>
                    </div>
                </section>
            )}

            {/* Main Content Sections */}
            <main className="relative">
                {/* Section Divider */}
                <div className="section-transition"></div>

                <About />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Skills />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Education />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Interests />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Projects />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Testimonials />
                
                <div className="section-divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                </div>

                <Contact />
            </main>

            {/* Footer */}
            <Footer />

            {/* Floating Elements */}
            <ReviewFloatingButton />
            <ThemeSwitcher />

            {/* Back to Top - Quick Access */}
            <div className="quick-access-menu">
                <a href="#about" className="quick-access-item" aria-label="Jump to About">
                    <i className="fas fa-user"></i>
                    <span className="quick-access-tooltip">About</span>
                </a>
                <a href="#skills" className="quick-access-item" aria-label="Jump to Skills">
                    <i className="fas fa-cogs"></i>
                    <span className="quick-access-tooltip">Skills</span>
                </a>
                <a href="#projects" className="quick-access-item" aria-label="Jump to Projects">
                    <i className="fas fa-project-diagram"></i>
                    <span className="quick-access-tooltip">Projects</span>
                </a>
                <a href="#contact" className="quick-access-item" aria-label="Jump to Contact">
                    <i className="fas fa-envelope"></i>
                    <span className="quick-access-tooltip">Contact</span>
                </a>
            </div>

            {/* Notification Toast (if needed) */}
            {isOwner && (
                <div className="owner-badge" data-aos="fade-left">
                    <i className="fas fa-crown"></i>
                    <span>Admin View</span>
                </div>
            )}
        </div>
    );
};

export default LandingPage;