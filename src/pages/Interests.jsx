import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api.service';
import '../styles/Interests.css';

const Interests = () => {
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const cardRefs = useRef([]);

    useEffect(() => {
        loadInterests();
    }, []);

    const loadInterests = async () => {
        try {
            setLoadError('');
            const response = await apiService.getInterests();
            const real = Array.isArray(response.interests) ? response.interests
                : Array.isArray(response.data) ? response.data : [];
            if (response.success) {
                setInterests(real);
            } else {
                setInterests([]);
                setLoadError(response.message || 'Hobbies are temporarily unavailable.');
            }
        } catch (error) {
            console.error('Error loading interests:', error);
            setInterests([]);
            setLoadError('Hobbies are temporarily unavailable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };


    // 3D tilt effect handler
    const handleMouseMove = (e, index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px) scale(1.02)`;
    };

    const handleMouseLeave = (index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        card.style.transform = '';
    };

    // Get unique categories
    const categories = ['all', ...new Set(interests.map(int => int.category).filter(Boolean))];

    // Filter interests based on active category
    const filteredInterests = activeCategory === 'all' 
        ? interests 
        : interests.filter(int => int.category === activeCategory);

    // Calculate average skill level
    const averageLevel = interests.length > 0
        ? Math.round(interests.reduce((sum, int) => sum + (int.level || 0), 0) / interests.length)
        : 0;

    if (loading) {
        return (
            <section className="min-h-screen bg-sbgColor flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="interests-loader"></div>
                    <p className="text-textColor text-lg animate-pulse">Loading interests...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="interests-section bg-sbgColor py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden" id="interests">
            {/* Animated Background */}
            <div className="interests-bg-blob interests-bg-blob-1"></div>
            <div className="interests-bg-blob interests-bg-blob-2"></div>
            <div className="interests-bg-blob interests-bg-blob-3"></div>
            
            {/* Floating Particles */}
            <div className="particles-container">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{ '--i': i }}></div>
                ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-4 mb-6" data-aos="fade-down">
                        <i className="fas fa-star text-3xl md:text-4xl text-mainColor animate-pulse-star"></i>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor">
                            Hobbies & <span className="gradient-text-interests">Interests</span>
                        </h2>
                        <i className="fas fa-star text-3xl md:text-4xl text-mainColor animate-pulse-star delay-500"></i>
                    </div>
                    
                    <div className="title-decoration">
                        <div className="decoration-line"></div>
                        <div className="decoration-dot decoration-dot-left"></div>
                        <div className="decoration-dot decoration-dot-right"></div>
                    </div>

                    <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto mt-6" data-aos="fade-up">
                        Exploring passions and cultivating skills that drive innovation and creativity
                    </p>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
                        <div className="stat-mini" data-aos="zoom-in" data-aos-delay="100">
                            <div className="stat-mini-value">{interests.length}</div>
                            <div className="stat-mini-label">Interests</div>
                        </div>
                        <div className="stat-mini" data-aos="zoom-in" data-aos-delay="200">
                            <div className="stat-mini-value">{categories.length - 1}</div>
                            <div className="stat-mini-label">Categories</div>
                        </div>
                        <div className="stat-mini" data-aos="zoom-in" data-aos-delay="300">
                            <div className="stat-mini-value">{averageLevel}%</div>
                            <div className="stat-mini-label">Avg. Level</div>
                        </div>
                        <div className="stat-mini" data-aos="zoom-in" data-aos-delay="400">
                            <div className="stat-mini-value">
                                {new Set(interests.flatMap(i => i.relatedTech || [])).size}
                            </div>
                            <div className="stat-mini-label">Technologies</div>
                        </div>
                    </div>
                </div>

                {/* Category Filter */}
                {categories.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-12" data-aos="fade-up">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`
                                    category-filter-btn
                                    ${activeCategory === category ? 'active' : ''}
                                `}
                            >
                                <i className={`fas fa-${getCategoryIcon(category)} mr-2`}></i>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Interests Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {filteredInterests.map((interest, index) => (
                        <div
                            key={interest.id || index}
                            className="interest-card-wrapper"
                            data-aos="fade-up"
                            data-aos-delay={index * 50}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => { setHoveredIndex(null); handleMouseLeave(index); }}
                            onMouseMove={(e) => handleMouseMove(e, index)}
                        >
                            <div
                                ref={el => cardRefs.current[index] = el}
                                className={`interest-card interest-card-${interest.color || 'blue'}`}
                            >
                                {/* Shine Effect */}
                                <div className="card-shine"></div>

                                {/* Hover Particle Burst */}
                                <div className="hover-particles">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="hover-particle"></div>
                                    ))}
                                </div>

                                {/* Category Badge */}
                                {interest.category && (
                                    <div className={`interest-badge interest-badge-${interest.color || 'blue'}`}>
                                        {interest.category}
                                    </div>
                                )}

                                {/* Level Badge */}
                                {interest.level >= 90 && (
                                    <div className="interest-badge interest-badge-top" style={{ top: '1rem', left: '1rem', right: 'auto' }}>
                                        <i className="fas fa-crown mr-1"></i> Top
                                    </div>
                                )}

                                {/* Icon Container */}
                                <div className="icon-container">
                                    <div className="icon-wrapper">
                                        <i className={`${interest.icon} icon-3d`}></i>
                                        <div className="icon-glow-effect"></div>
                                    </div>
                                    <div className="icon-circle icon-circle-1"></div>
                                    <div className="icon-circle icon-circle-2"></div>
                                    <div className="icon-circle icon-circle-3"></div>
                                </div>

                                {/* Content */}
                                <div className="card-content">
                                    <h3 className="text-xl md:text-2xl font-bold text-textColor mb-3 transition-colors duration-300"
                                        style={{ color: hoveredIndex === index ? `var(--mainColor)` : '' }}>
                                        {interest.title}
                                    </h3>

                                    <p className="text-textColor/80 text-sm md:text-base leading-relaxed mb-4">
                                        {interest.description}
                                    </p>

                                    {/* Skill Level */}
                                    {interest.level && (
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-textColor/60 font-semibold uppercase tracking-wider">
                                                    Proficiency
                                                </span>
                                                <span className="text-sm font-bold"
                                                    style={{ color: `var(--mainColor)` }}>
                                                    {interest.level}%
                                                </span>
                                            </div>
                                            <div className="skill-progress-bar">
                                                <div 
                                                    className="skill-progress-fill"
                                                    style={{ 
                                                        width: hoveredIndex === index ? `${interest.level}%` : '0%',
                                                        transitionDelay: `${index * 0.05}s`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {interest.tags && interest.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {interest.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="interest-tag"
                                                    style={{ 
                                                        transitionDelay: hoveredIndex === index ? `${idx * 0.05}s` : '0s',
                                                        transform: hoveredIndex === index ? 'translateY(-2px)' : ''
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Related Technologies */}
                                    {interest.relatedTech && interest.relatedTech.length > 0 && (
                                        <div className="pt-4 border-t border-mainColor/20">
                                            <p className="text-xs text-textColor/50 mb-2 font-semibold uppercase tracking-wider">
                                                Tech Stack
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {interest.relatedTech.map((tech, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="tech-pill"
                                                        style={{ 
                                                            transitionDelay: hoveredIndex === index ? `${idx * 0.03}s` : '0s'
                                                        }}
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="card-overlay"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredInterests.length === 0 && (
                    <div className="text-center py-20">
                        <i className="fas fa-heart-broken text-6xl text-textColor/30 mb-4"></i>
                        <p className="text-textColor/50 text-xl">{loadError || (activeCategory === 'all' ? 'No hobbies have been added yet.' : 'No interests found in this category.')}</p>
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="text-center mt-16" data-aos="fade-up">
                    <p className="text-textColor/70 text-lg mb-6">
                        Interested in collaborating on exciting projects?
                    </p>
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-mainColor to-mainColor/80 text-bgColor font-semibold rounded-full hover-lift shadow-glow-main transition-all duration-300"
                    >
                        <i className="fas fa-paper-plane"></i>
                        <span>Let's Connect</span>
                        <i className="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </section>
    );
};

// Helper function for category icons
const getCategoryIcon = (category) => {
    const icons = {
        all: 'th',
        technical: 'laptop-code',
        creative: 'paint-brush',
        personal: 'user',
        social: 'users'
    };
    return icons[category] || 'heart';
};

export default Interests;