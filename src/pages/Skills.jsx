import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import '../styles/Skills.css';

const Skills = () => {
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSkills = useCallback(async () => {
        try {
            const cached = cacheService.get('public_skills');
            if (cached) {
                setTechnicalSkills(cached.technical);
                setProfessionalSkills(cached.professional);
                setLoading(false);
                return;
            }

            console.log('Fetching skills from API...');
            const response = await apiService.request('/public/skills');
            console.log('Skills API response:', response);
            
            if (response.success && response.skills && response.skills.length > 0) {
                console.log(`Loaded ${response.skills.length} skills from database`);
                const technical = response.skills.filter(s => s.type === 'technical');
                const professional = response.skills.filter(s => s.type === 'professional');
                
                cacheService.set('public_skills', { technical, professional }, CACHE_TTL.TEN_MINUTES);
                setTechnicalSkills(technical);
                setProfessionalSkills(professional);
            } else {
                console.log('No skills from API, using fallback data');
                setTechnicalSkills(getFallbackTechnicalSkills());
                setProfessionalSkills(getFallbackProfessionalSkills());
            }
        } catch (error) {
            console.error('Error loading skills:', error);
            console.log('Using fallback skills due to error');
            setTechnicalSkills(getFallbackTechnicalSkills());
            setProfessionalSkills(getFallbackProfessionalSkills());
        } finally {
            setLoading(false);
        }
    }, [setTechnicalSkills, setProfessionalSkills, setLoading]);

    useEffect(() => {
        loadSkills();
    }, [loadSkills]);

    useEffect(() => {
        const handleSettingsChange = (e) => {
            console.log('[Skills] Settings changed, refreshing data...');
            cacheService.delete('public_skills');
            loadSkills();
        };
        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, [loadSkills]);

    const getFallbackTechnicalSkills = () => [
        { name: "HTML5", level: 90, icon: "fa-brands fa-html5" },
        { name: "CSS3", level: 85, icon: "fa-brands fa-css3-alt" },
        { name: "JavaScript", level: 80, icon: "fa-brands fa-js" },
        { name: "React", level: 75, icon: "fa-brands fa-react" },
        { name: "Python", level: 70, icon: "fa-brands fa-python" },
        { name: "Node.js", level: 65, icon: "fa-brands fa-node-js" },
        { name: "Git", level: 85, icon: "fa-brands fa-git-alt" },
        { name: "Database", level: 60, icon: "fa-solid fa-database" },
        { name: "TypeScript", level: 72, icon: "fa-brands fa-js" },
        { name: "Docker", level: 68, icon: "fa-brands fa-docker" },
        { name: "MongoDB", level: 75, icon: "fa-solid fa-database" },
        { name: "Vue.js", level: 70, icon: "fa-brands fa-vuejs" }
    ];

    const getFallbackProfessionalSkills = () => [
        { name: "Problem Solving", level: 90 },
        { name: "Creativity", level: 85 },
        { name: "Team Work", level: 95 },
        { name: "Communication", level: 85 },
        { name: "Leadership", level: 80 },
        { name: "Time Management", level: 88 },
        { name: "Adaptability", level: 92 },
        { name: "Critical Thinking", level: 87 }
    ];

    if (loading) {
        return (
            <section 
                className="relative min-h-screen bg-[var(--sbgColor)] px-[9%] py-20 overflow-hidden"
                id="skills"
            >
                <div className="absolute inset-0 skills-bg-effect pointer-events-none" />
                
                <div className="relative z-10">
                    {/* Decorated Heading */}
                    <div className="heading-container text-center mb-20">
                        <div className="heading-decoration-top"></div>
                        <h2 className="heading-main inline-block relative">
                            <span className="heading-text">My</span>
                            <span className="heading-text-accent"> Skills</span>
                            <div className="heading-underline"></div>
                        </h2>
                        <div className="heading-decoration-bottom"></div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="loading-spinner">
                            <i className="fas fa-spinner fa-spin text-5xl text-[var(--mainColor)]"></i>
                        </div>
                        <p className="mt-4 text-[var(--textColor)] text-lg">Loading skills...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section 
            className="relative min-h-screen bg-[var(--sbgColor)] px-[5%] md:px-[7%] lg:px-[9%] py-20 overflow-hidden"
            id="skills"
        >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 skills-bg-effect pointer-events-none" />
            
            {/* Main Decorated Heading */}
            <div className="relative z-10">
                <div className="heading-container text-center mb-12 md:mb-16 lg:mb-20">
                    <div className="heading-decoration-top"></div>
                    <h2 className="heading-main inline-block relative">
                        <span className="heading-text">My</span>
                        <span className="heading-text-accent"> Skills</span>
                        <div className="heading-underline"></div>
                        <div className="heading-glow"></div>
                    </h2>
                    <div className="heading-decoration-bottom"></div>
                    <p className="text-[var(--textColor)] text-base md:text-lg lg:text-xl mt-4 opacity-80 max-w-2xl mx-auto">
                        A comprehensive overview of my technical expertise and professional competencies
                    </p>
                </div>
            </div>
            
            {/* Skills Container */}
            <div className="relative z-10 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                    
                    {/* Technical Skills Section */}
                    <div 
                        className="technical-skills-container group"
                        data-aos="fade-right"
                    >
                        <div className="skill-card-wrapper">
                            
                            {/* Section Heading */}
                            <div className="skill-card-header">
                                <h3 className="skill-card-title">
                                    <i className="fas fa-code mr-3"></i>
                                    Technical Skills
                                    <span className="skill-count">({technicalSkills.length})</span>
                                </h3>
                                <div className="skill-card-divider"></div>
                            </div>
                            
                            {/* Technical Skills List - Scrollable */}
                            <div className="skill-card-content custom-scrollbar">
                                {technicalSkills.map((skill, index) => (
                                    <div 
                                        key={index}
                                        className="technical-bar"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* Skill Info with Percentage */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <i className={`${skill.icon} text-2xl md:text-3xl skill-icon transition-all duration-300`}></i>
                                                <span className="text-base md:text-lg lg:text-xl font-semibold text-[var(--textColor)]">
                                                    {skill.name}
                                                </span>
                                            </div>
                                            {/* Percentage Badge */}
                                            <span className="percentage-badge">
                                                {skill.level}%
                                            </span>
                                        </div>
                                        
                                        {/* Progress Bar with Range Indicators */}
                                        <div className="relative w-full">
                                            {/* Range Indicators */}
                                            <div className="flex justify-between text-xs text-[var(--textColor)] opacity-50 mb-1">
                                                <span>0%</span>
                                                <span>25%</span>
                                                <span>50%</span>
                                                <span>75%</span>
                                                <span>100%</span>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="relative w-full h-3 md:h-4 bg-[var(--sbgColor)] 
                                                          rounded-full overflow-hidden progress-line border border-[rgba(0,239,255,0.1)]">
                                                <div 
                                                    className="progress-bar h-full rounded-full relative"
                                                    style={{ width: `${skill.level}%` }}
                                                >
                                                    <span className="progress-shimmer"></span>
                                                </div>
                                            </div>
                                            
                                            {/* Range Markers */}
                                            <div className="absolute top-0 w-full h-3 md:h-4 pointer-events-none mt-6">
                                                <div className="relative w-full h-full">
                                                    {[0, 25, 50, 75, 100].map((mark) => (
                                                        <div 
                                                            key={mark}
                                                            className="range-marker"
                                                            style={{ left: `${mark}%` }}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Empty State */}
                                {technicalSkills.length === 0 && (
                                    <div className="text-center py-12 text-[var(--textColor)] opacity-50">
                                        <i className="fas fa-inbox text-4xl mb-4"></i>
                                        <p>No technical skills added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Professional Skills Section */}
                    <div 
                        className="professional-skills-container group"
                        data-aos="fade-left"
                    >
                        <div className="skill-card-wrapper">
                            
                            {/* Section Heading */}
                            <div className="skill-card-header">
                                <h3 className="skill-card-title">
                                    <i className="fas fa-user-tie mr-3"></i>
                                    Professional Skills
                                    <span className="skill-count">({professionalSkills.length})</span>
                                </h3>
                                <div className="skill-card-divider"></div>
                            </div>
                            
                            {/* Professional Skills Grid - Scrollable */}
                            <div className="skill-card-content custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                                    {professionalSkills.map((skill, index) => (
                                        <div 
                                            key={index}
                                            className="radial-skill-item flex flex-col items-center w-full"
                                            style={{ animationDelay: `${index * 0.15}s` }}
                                        >
                                            {/* Radial Progress Circle */}
                                            <div className="radial-bar-wrapper relative w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44">
                                                <svg 
                                                    className="w-full h-full -rotate-90"
                                                    viewBox="0 0 200 200"
                                                >
                                                    <defs>
                                                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" style={{ stopColor: '#00efff', stopOpacity: 1 }} />
                                                            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                                                        </linearGradient>
                                                    </defs>
                                                    
                                                    {/* Background Circle */}
                                                    <circle 
                                                        className="progress-bg"
                                                        cx="100" 
                                                        cy="100" 
                                                        r="80"
                                                        fill="none"
                                                        stroke="var(--sbgColor)"
                                                        strokeWidth="12"
                                                    />
                                                    
                                                    {/* Range Circles (25%, 50%, 75%) */}
                                                    <circle 
                                                        cx="100" 
                                                        cy="100" 
                                                        r="80"
                                                        fill="none"
                                                        stroke="rgba(0, 239, 255, 0.1)"
                                                        strokeWidth="1"
                                                        strokeDasharray="4 4"
                                                        className="range-circle"
                                                        style={{ strokeDashoffset: 502.4 * 0.75 }}
                                                    />
                                                    <circle 
                                                        cx="100" 
                                                        cy="100" 
                                                        r="80"
                                                        fill="none"
                                                        stroke="rgba(0, 239, 255, 0.1)"
                                                        strokeWidth="1"
                                                        strokeDasharray="4 4"
                                                        className="range-circle"
                                                        style={{ strokeDashoffset: 502.4 * 0.5 }}
                                                    />
                                                    <circle 
                                                        cx="100" 
                                                        cy="100" 
                                                        r="80"
                                                        fill="none"
                                                        stroke="rgba(0, 239, 255, 0.1)"
                                                        strokeWidth="1"
                                                        strokeDasharray="4 4"
                                                        className="range-circle"
                                                        style={{ strokeDashoffset: 502.4 * 0.25 }}
                                                    />
                                                    
                                                    {/* Progress Circle */}
                                                    <circle 
                                                        className="progress-circle"
                                                        cx="100" 
                                                        cy="100" 
                                                        r="80"
                                                        fill="none"
                                                        stroke={`url(#gradient-${index})`}
                                                        strokeWidth="12"
                                                        strokeLinecap="round"
                                                        strokeDasharray="502.4"
                                                        strokeDashoffset={502.4 - (502.4 * skill.level) / 100}
                                                    />
                                                </svg>
                                                
                                                {/* Percentage Text */}
                                                <div className="skill-percentage">
                                                    {skill.level}%
                                                </div>
                                                
                                                {/* Range Labels */}
                                                <div className="radial-range-labels">
                                                    <span className="range-label range-label-top">100</span>
                                                    <span className="range-label range-label-right">75</span>
                                                    <span className="range-label range-label-bottom">50</span>
                                                    <span className="range-label range-label-left">25</span>
                                                </div>
                                            </div>
                                            
                                            {/* Skill Name */}
                                            <div className="skill-name text-center mt-4 md:mt-5 mb-3 md:mb-4 
                                                          text-sm md:text-base lg:text-lg font-semibold 
                                                          text-[var(--textColor)] transition-all duration-300">
                                                {skill.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Empty State */}
                                {professionalSkills.length === 0 && (
                                    <div className="text-center py-12 text-[var(--textColor)] opacity-50">
                                        <i className="fas fa-inbox text-4xl mb-4"></i>
                                        <p>No professional skills added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Skills;