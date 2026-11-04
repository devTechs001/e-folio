import React, { useState, useEffect, useCallback, useMemo } from 'react';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import ArchiveNote from '../components/ArchiveNote';
import { loadPublicSection, isLiveContent, PUBLIC_ENDPOINTS } from '../services/publicContent';
import { recordDevIssue, publicEmptyCopy } from '../utils/publicMessaging';
import '../styles/Skills.css';
import '../styles/SkillsModern.css';
import { CV_SKILL_SECTIONS, CV_GROUP_NAMES, CV_ITEM_COUNT } from '../data/cvSkills';

const Skills = () => {
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentSource, setContentSource] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [activeSection, setActiveSection] = useState('all');
    const [activeGroup, setActiveGroup] = useState('all');

    const loadSkills = useCallback(async () => {
        try {
            const cached = cacheService.get('public_skills');
            if (cached) {
                setTechnicalSkills(cached.technical);
                setProfessionalSkills(cached.professional);
                setContentSource('live');
                setLoading(false);
                return;
            }

            // Live API first, then the saved local copy. Visitors never see
            // technical error text; developers keep it in the dev diagnostics.
            const response = await loadPublicSection('skills');
            const skills = Array.isArray(response.skills) ? response.skills : [];
            const technical = skills.filter(item => item.type === 'technical');
            const professional = skills.filter(item => item.type === 'professional');
            setTechnicalSkills(technical);
            setProfessionalSkills(professional);
            setContentSource(response.source || '');
            if (isLiveContent(response)) {
                cacheService.set('public_skills', { technical, professional }, CACHE_TTL.TEN_MINUTES);
            }
        } catch (error) {
            recordDevIssue({ section: 'skills', endpoint: PUBLIC_ENDPOINTS.skills, error });
            setTechnicalSkills([]);
            setProfessionalSkills([]);
            setContentSource('');
        } finally {
            setLoading(false);
        }
    }, [setTechnicalSkills, setProfessionalSkills, setLoading]);

    useEffect(() => {
        loadSkills();
    }, [loadSkills]);

    useEffect(() => {
        const handleSettingsChange = () => {
            console.log('[Skills] Settings changed, refreshing data...');
            cacheService.delete('public_skills');
            loadSkills();
        };
        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, [loadSkills]);


    // Phase 25 — CV-aligned grouping. Scores are attached only when a real
    // published skill record matches a CV line; the CV itself states no
    // percentages, so no score is ever invented here.
    const publishedSkills = useMemo(
        () => [...technicalSkills, ...professionalSkills].filter(skill => Number.isFinite(Number(skill.level))),
        [technicalSkills, professionalSkills]
    );

    const scoresFor = useCallback(item => {
        const text = String(item).toLowerCase();
        return publishedSkills.filter(skill => {
            const name = String(skill.name || '').trim().toLowerCase();
            if (!name) return false;
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
        });
    }, [publishedSkills]);

    const sectionTabs = useMemo(() => [
        { id: 'all', label: 'All groups', count: CV_GROUP_NAMES.length },
        ...CV_SKILL_SECTIONS.map(section => ({
            id: section.id, label: section.label, count: section.groups.length
        }))
    ], []);

    const allGroups = useMemo(() => CV_SKILL_SECTIONS.flatMap(section =>
        section.groups.map(group => ({
            ...group,
            sectionId: section.id,
            sectionLabel: section.label,
            eyebrow: section.eyebrow
        }))
    ), []);

    const availableGroups = useMemo(
        () => allGroups.filter(group => activeSection === 'all' || group.sectionId === activeSection),
        [allGroups, activeSection]
    );

    const visibleGroups = useMemo(() => availableGroups.filter(group =>
        activeGroup === 'all' || group.name === activeGroup
    ), [availableGroups, activeGroup]);

    const visibleItemCount = useMemo(
        () => visibleGroups.reduce((total, group) => total + group.items.length, 0),
        [visibleGroups]
    );

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
                    <ArchiveNote source={contentSource} />
                </div>
            </div>
            
            {/* Phase 25 — modern, CV-aligned skill map */}
            <div className="sk-shell">
                <div className="sk-hero">
                    <div className="sk-hero-copy">
                        <span className="sk-eyebrow"><i className="fa-solid fa-layer-group" /> CV-aligned skill map</span>
                        <h3 className="sk-title">Skills at a glance</h3>
                        <p className="sk-lede">
                            Grouped the way they appear on the CV, with a score shown only where a
                            matching skill record provides one.
                        </p>
                    </div>
                    <div className="sk-stats">
                        <div className="sk-stat"><strong>{CV_GROUP_NAMES.length}</strong><span>CV groups</span></div>
                        <div className="sk-stat"><strong>{CV_ITEM_COUNT}</strong><span>Skills listed</span></div>
                        <div className="sk-stat"><strong>{publishedSkills.length}</strong><span>Scored skills</span></div>
                    </div>
                </div>

                <div className="sk-toolbar" role="group" aria-label="Filter skill sections">
                    {sectionTabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`sk-tab ${activeSection === tab.id ? 'is-active' : ''}`}
                            aria-pressed={activeSection === tab.id}
                            onClick={() => { setActiveSection(tab.id); setActiveGroup('all'); }}
                        >
                            {tab.label}<span className="sk-tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                <div className="sk-chipbar" role="group" aria-label="Filter by CV group">
                    <button
                        type="button"
                        className={`sk-chip ${activeGroup === 'all' ? 'is-active' : ''}`}
                        aria-pressed={activeGroup === 'all'}
                        onClick={() => setActiveGroup('all')}
                    >Every group</button>
                    {availableGroups.map(group => (
                        <button
                            key={group.name}
                            type="button"
                            className={`sk-chip ${activeGroup === group.name ? 'is-active' : ''}`}
                            aria-pressed={activeGroup === group.name}
                            onClick={() => setActiveGroup(group.name)}
                        >
                            <i className={group.icon} /> {group.name}
                        </button>
                    ))}
                </div>

                <p className="sk-result" aria-live="polite">
                    Showing {visibleGroups.length} group{visibleGroups.length === 1 ? '' : 's'} · {visibleItemCount} skill{visibleItemCount === 1 ? '' : 's'}
                </p>

                <div className="sk-grid">
                    {visibleGroups.map(group => (
                        <article className="sk-card" key={group.name}>
                            <header className="sk-card-head">
                                <span className="sk-card-icon"><i className={group.icon} /></span>
                                <div className="sk-card-heading">
                                    <span className="sk-card-eyebrow">{group.eyebrow} · {group.sectionLabel}</span>
                                    <h4>{group.name}</h4>
                                </div>
                                <span className="sk-card-count">{group.items.length}</span>
                            </header>
                            <ul className="sk-items">
                                {group.items.map(item => {
                                    const scores = scoresFor(item);
                                    return (
                                        <li className="sk-item" key={item}>
                                            <span className="sk-item-label">{item}</span>
                                            {scores.length > 0 && (
                                                <span className="sk-scores">
                                                    {scores.map(skill => (
                                                        <span className="sk-score" key={skill.name}>
                                                            <span className="sk-score-name">{skill.name}</span>
                                                            <span className="sk-score-track">
                                                                <span className="sk-score-fill" style={{ width: `${skill.level}%` }} />
                                                            </span>
                                                            <span className="sk-score-value">{skill.level}%</span>
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </article>
                    ))}
                </div>
                {visibleGroups.length === 0 && (
                    <p className="sk-empty">{publicEmptyCopy('emptySkills')}</p>
                )}
            </div>

            {/* Toggle Button */}
            <div className="text-center mb-8">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sk-detail-toggle inline-flex items-center gap-2 px-6 py-3 bg-[var(--mainColor)]/10 hover:bg-[var(--mainColor)]/20 text-[var(--mainColor)] rounded-full transition-all duration-300 font-medium"
                    aria-expanded={!isCollapsed}
                    aria-controls="sk-scorecards"
                >
                    <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} transition-transform duration-300`}></i>
                    {isCollapsed ? 'Show Technologies' : 'Hide Technologies'}
                </button>
            </div>

            {/* Skills Container */}
            <div id="sk-scorecards" className={`relative z-10 max-w-[1600px] mx-auto transition-all duration-500 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
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
                                        <p>{publicEmptyCopy('emptySkills')}</p>
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
                                        <p>{publicEmptyCopy('emptySkills')}</p>
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