import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api.service';
import '../styles/Interests.css';

const Interests = () => {
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const cardRefs = useRef([]);

    useEffect(() => {
        loadInterests();
    }, []);

    const loadInterests = async () => {
        try {
            const response = await apiService.getInterests();
            if (response.success && response.interests) {
                setInterests(response.interests);
            } else {
                setInterests(getFallbackInterests());
            }
        } catch (error) {
            console.error('Error loading interests:', error);
            setInterests(getFallbackInterests());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackInterests = () => [
        {
            id: 1,
            icon: 'fas fa-code',
            title: 'Programming',
            description: 'Passionate about solving complex problems through code and building innovative solutions that make a difference.',
            category: 'technical',
            level: 95,
            color: 'blue',
            tags: ['Problem Solving', 'Algorithms', 'Best Practices'],
            relatedTech: ['JavaScript', 'Python', 'Java']
        },
        {
            id: 2,
            icon: 'fas fa-palette',
            title: 'Web Design',
            description: 'Creating visually appealing and user-friendly interfaces that enhance the digital experience.',
            category: 'creative',
            level: 90,
            color: 'purple',
            tags: ['UI/UX', 'Visual Design', 'Typography'],
            relatedTech: ['Figma', 'Adobe XD', 'CSS']
        },
        {
            id: 3,
            icon: 'fas fa-mobile-alt',
            title: 'Mobile Development',
            description: 'Exploring the world of mobile applications and creating responsive solutions for various platforms.',
            category: 'technical',
            level: 85,
            color: 'cyan',
            tags: ['iOS', 'Android', 'Cross-platform'],
            relatedTech: ['React Native', 'Flutter', 'Swift']
        },
        {
            id: 4,
            icon: 'fas fa-robot',
            title: 'AI & Machine Learning',
            description: 'Fascinated by the potential of artificial intelligence and its applications in solving real-world problems.',
            category: 'technical',
            level: 80,
            color: 'green',
            tags: ['Neural Networks', 'Deep Learning', 'Data Science'],
            relatedTech: ['TensorFlow', 'PyTorch', 'Scikit-learn']
        },
        {
            id: 5,
            icon: 'fas fa-link',
            title: 'Blockchain Technology',
            description: 'Interested in decentralized systems and their potential to revolutionize digital transactions.',
            category: 'technical',
            level: 75,
            color: 'orange',
            tags: ['Smart Contracts', 'DeFi', 'Web3'],
            relatedTech: ['Ethereum', 'Solidity', 'Web3.js']
        },
        {
            id: 6,
            icon: 'fas fa-book-reader',
            title: 'Continuous Learning',
            description: 'Committed to staying updated with the latest technologies and industry best practices.',
            category: 'personal',
            level: 100,
            color: 'indigo',
            tags: ['Self-improvement', 'Documentation', 'Research'],
            relatedTech: ['Online Courses', 'Books', 'Blogs']
        },
        {
            id: 7,
            icon: 'fas fa-users',
            title: 'Community Building',
            description: 'Enjoy participating in tech communities and sharing knowledge with fellow developers.',
            category: 'social',
            level: 88,
            color: 'pink',
            tags: ['Mentorship', 'Open Source', 'Networking'],
            relatedTech: ['GitHub', 'Stack Overflow', 'Discord']
        },
        {
            id: 8,
            icon: 'fas fa-lightbulb',
            title: 'Innovation',
            description: 'Passionate about creating new solutions and pushing the boundaries of what\'s possible with technology.',
            category: 'creative',
            level: 92,
            color: 'yellow',
            tags: ['Creativity', 'Problem Solving', 'Ideation'],
            relatedTech: ['Prototyping', 'MVPs', 'Research']
        },
        {
            id: 9,
            icon: 'fas fa-gamepad',
            title: 'Game Development',
            description: 'Creating interactive experiences and exploring game mechanics and storytelling through code.',
            category: 'creative',
            level: 70,
            color: 'red',
            tags: ['Game Design', '3D Graphics', 'Physics'],
            relatedTech: ['Unity', 'Unreal Engine', 'WebGL']
        },
        {
            id: 10,
            icon: 'fas fa-cloud',
            title: 'Cloud Computing',
            description: 'Building scalable cloud-based solutions and understanding modern infrastructure.',
            category: 'technical',
            level: 82,
            color: 'teal',
            tags: ['DevOps', 'Serverless', 'Microservices'],
            relatedTech: ['AWS', 'Azure', 'Docker']
        },
        {
            id: 11,
            icon: 'fas fa-shield-alt',
            title: 'Cybersecurity',
            description: 'Ensuring digital safety and understanding security best practices in application development.',
            category: 'technical',
            level: 78,
            color: 'gray',
            tags: ['Encryption', 'Penetration Testing', 'Security Audits'],
            relatedTech: ['OWASP', 'Ethical Hacking', 'Security Protocols']
        },
        {
            id: 12,
            icon: 'fas fa-video',
            title: 'Content Creation',
            description: 'Sharing knowledge through tutorials, blogs, and video content to help others learn.',
            category: 'social',
            level: 85,
            color: 'rose',
            tags: ['Video Editing', 'Writing', 'Teaching'],
            relatedTech: ['YouTube', 'Medium', 'Dev.to']
        }
    ];

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
                        <p className="text-textColor/50 text-xl">No interests found in this category.</p>
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