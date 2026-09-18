import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import '../styles/Education.css';

const Education = () => {
    const [educationData, setEducationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

    useEffect(() => {
        loadEducation();
    }, []);

    const loadEducation = async () => {
        try {
            const response = await apiService.getEducation();
            if (response.success && response.education) {
                setEducationData(response.education);
            } else {
                setEducationData(getFallbackEducation());
            }
        } catch (error) {
            console.error('Error loading education:', error);
            setEducationData(getFallbackEducation());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackEducation = () => [
        {
            id: 1,
            icon: 'fas fa-graduation-cap',
            period: '2023 - 2025',
            degree: 'Diploma in Computer Science',
            level: 'Level 6',
            institution: 'Bungoma National Polytechnic',
            location: 'Bungoma, Kenya',
            description: 'Specializing in software development, web technologies, and computer systems. Key focus on practical programming skills and modern development practices.',
            category: 'academic',
            grade: 'Ongoing',
            skills: ['Software Development', 'Web Technologies', 'Database Management', 'System Analysis'],
            color: 'blue'
        },
        {
            id: 2,
            icon: 'fas fa-laptop-code',
            period: 'March 2023 - July 2023',
            degree: 'ICT Essentials',
            level: 'Office Automation Specialist',
            institution: 'Ayes Consults Ltd.',
            location: 'Nairobi, Kenya',
            description: 'Comprehensive training in Microsoft Office Suite, computer maintenance, and essential IT skills for modern workplace efficiency.',
            category: 'professional',
            grade: 'Distinction',
            skills: ['MS Office Suite', 'IT Support', 'Hardware Maintenance', 'Technical Documentation'],
            color: 'green'
        },
        {
            id: 3,
            icon: 'fas fa-certificate',
            period: 'Jan 2023 - March 2023',
            degree: 'Digital Skills Training',
            level: 'Google Digital Skills Certificate',
            institution: 'Google Africa',
            location: 'Online',
            description: 'Mastered digital marketing, online presence management, and web analytics fundamentals for business growth.',
            category: 'certification',
            grade: 'Certified',
            skills: ['Digital Marketing', 'SEO', 'Analytics', 'Social Media Strategy'],
            color: 'purple'
        },
        {
            id: 4,
            icon: 'fas fa-laptop-code',
            period: '2022 - 2023',
            degree: 'Certificate in Web Development',
            level: 'Level 5',
            institution: 'FreeCodeCamp',
            location: 'Online',
            description: 'Comprehensive training in full-stack web development. Covered HTML5, CSS3, JavaScript, React, and Node.js.',
            category: 'certification',
            grade: 'Certified',
            skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
            color: 'cyan'
        },
        {
            id: 5,
            icon: 'fas fa-code',
            period: '2022',
            degree: 'Python Programming Certification',
            level: 'Professional Certificate',
            institution: 'Coursera',
            location: 'Online',
            description: 'Advanced Python programming concepts including data structures, algorithms, and object-oriented programming.',
            category: 'certification',
            grade: 'Certified',
            skills: ['Python', 'OOP', 'Data Structures', 'Algorithms'],
            color: 'yellow'
        },
        {
            id: 6,
            icon: 'fas fa-school',
            period: '2019 - 2022',
            degree: 'Secondary Education',
            level: 'K.C.S.E Certificate',
            institution: 'Musingu High School',
            location: 'Kakamega, Kenya',
            description: 'Completed secondary education with excellent grades in Mathematics, Physics, and Computer Studies.',
            category: 'academic',
            grade: 'B+ (Plus)',
            skills: ['Mathematics', 'Physics', 'Computer Studies', 'Chemistry'],
            color: 'orange'
        }
    ];

    // Get unique categories
    const categories = ['all', ...new Set(educationData.map(edu => edu.category).filter(Boolean))];
    const [activeFilter, setActiveFilter] = useState('all');

    // Filter education data
    const filteredEducation = activeFilter === 'all' 
        ? educationData 
        : educationData.filter(edu => edu.category === activeFilter);

    if (loading) {
        return (
            <section className="min-h-screen bg-bgColor flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="education-loader"></div>
                    <p className="text-textColor text-lg animate-pulse">Loading education history...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="education-section bg-bgColor py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden" id="education">
            {/* Background Decorations */}
            <div className="education-blob education-blob-1"></div>
            <div className="education-blob education-blob-2"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor mb-4">
                        Education <span className="gradient-text">History</span>
                    </h2>
                    <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
                        My academic journey and professional certifications that shaped my expertise
                    </p>

                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                            aria-label="Grid View"
                        >
                            <i className="fas fa-th"></i>
                            <span className="ml-2 hidden sm:inline">Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`view-toggle ${viewMode === 'timeline' ? 'active' : ''}`}
                            aria-label="Timeline View"
                        >
                            <i className="fas fa-stream"></i>
                            <span className="ml-2 hidden sm:inline">Timeline</span>
                        </button>
                    </div>

                    {/* Category Filters */}
                    {categories.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`
                                        px-5 py-2 rounded-full font-medium text-sm
                                        transition-all duration-300 transform hover:scale-105
                                        ${activeFilter === category
                                            ? 'bg-gradient-to-r from-mainColor to-mainColor/80 text-bgColor shadow-glow'
                                            : 'bg-white/5 text-textColor border border-mainColor/20 hover:bg-mainColor/10'
                                        }
                                    `}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Education Content */}
                {viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredEducation.map((edu, index) => (
                            <div
                                key={edu.id || index}
                                className="education-card group"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                {/* Card Header */}
                                <div className="relative mb-6">
                                    <div className="education-icon-wrapper">
                                        <i className={`${edu.icon} text-4xl md:text-5xl`}></i>
                                        <div className="icon-glow"></div>
                                    </div>
                                    
                                    {/* Category Badge */}
                                    {edu.category && (
                                        <span className={`category-badge category-${edu.color || 'blue'}`}>
                                            {edu.category}
                                        </span>
                                    )}
                                </div>

                                {/* Period */}
                                <div className="education-period">
                                    <i className="fas fa-calendar-alt mr-2"></i>
                                    {edu.period}
                                </div>

                                {/* Degree */}
                                <h3 className="text-xl md:text-2xl font-bold text-textColor mb-2 group-hover:text-mainColor transition-colors duration-300">
                                    {edu.degree}
                                </h3>

                                {/* Level */}
                                <p className="text-mainColor font-semibold mb-2">
                                    {edu.level}
                                </p>

                                {/* Institution */}
                                <div className="flex items-start gap-2 mb-2">
                                    <i className="fas fa-university text-mainColor mt-1"></i>
                                    <div>
                                        <p className="text-textColor/90 font-medium">{edu.institution}</p>
                                        {edu.location && (
                                            <p className="text-textColor/60 text-sm flex items-center gap-1">
                                                <i className="fas fa-map-marker-alt"></i>
                                                {edu.location}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Grade */}
                                {edu.grade && (
                                    <div className="grade-badge">
                                        <i className="fas fa-medal mr-2"></i>
                                        {edu.grade}
                                    </div>
                                )}

                                {/* Description */}
                                <p className="text-textColor/70 text-sm md:text-base leading-relaxed mb-4 mt-4">
                                    {edu.description}
                                </p>

                                {/* Skills */}
                                {edu.skills && edu.skills.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-mainColor/20">
                                        <p className="text-xs text-textColor/60 mb-2 font-semibold">
                                            Key Skills:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {edu.skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="skill-tag"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Timeline View */
                    <div className="timeline-container">
                        <div className="timeline-line"></div>
                        {filteredEducation.map((edu, index) => (
                            <div
                                key={edu.id || index}
                                className={`timeline-item ${index % 2 === 0 ? 'timeline-left' : 'timeline-right'}`}
                                data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
                                data-aos-delay={index * 100}
                            >
                                {/* Timeline Dot */}
                                <div className="timeline-dot">
                                    <i className={edu.icon}></i>
                                    <div className="dot-pulse"></div>
                                </div>

                                {/* Timeline Card */}
                                <div className="timeline-card group">
                                    {/* Period Badge */}
                                    <div className="timeline-period">
                                        {edu.period}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-xl md:text-2xl font-bold text-textColor group-hover:text-mainColor transition-colors duration-300">
                                                {edu.degree}
                                            </h3>
                                            {edu.category && (
                                                <span className={`category-badge-sm category-${edu.color || 'blue'}`}>
                                                    {edu.category}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-mainColor font-semibold mb-3">
                                            {edu.level}
                                        </p>

                                        <div className="flex items-center gap-2 mb-2 text-textColor/80">
                                            <i className="fas fa-university text-mainColor"></i>
                                            <span className="font-medium">{edu.institution}</span>
                                        </div>

                                        {edu.location && (
                                            <div className="flex items-center gap-2 mb-3 text-textColor/60 text-sm">
                                                <i className="fas fa-map-marker-alt text-mainColor"></i>
                                                <span>{edu.location}</span>
                                            </div>
                                        )}

                                        {edu.grade && (
                                            <div className="grade-badge mb-3">
                                                <i className="fas fa-medal mr-2"></i>
                                                {edu.grade}
                                            </div>
                                        )}

                                        <p className="text-textColor/70 text-sm leading-relaxed mb-4">
                                            {edu.description}
                                        </p>

                                        {edu.skills && edu.skills.length > 0 && (
                                            <div className="pt-3 border-t border-mainColor/20">
                                                <div className="flex flex-wrap gap-2">
                                                    {edu.skills.map((skill, idx) => (
                                                        <span key={idx} className="skill-tag-sm">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredEducation.length === 0 && (
                    <div className="text-center py-20">
                        <i className="fas fa-book-open text-6xl text-textColor/30 mb-4"></i>
                        <p className="text-textColor/50 text-xl">No education records found in this category.</p>
                    </div>
                )}
            </div>

            {/* Bottom Stats */}
            <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="stat-box" data-aos="zoom-in" data-aos-delay="100">
                    <div className="stat-number">{educationData.length}</div>
                    <div className="stat-label">Qualifications</div>
                </div>
                <div className="stat-box" data-aos="zoom-in" data-aos-delay="200">
                    <div className="stat-number">
                        {educationData.filter(e => e.category === 'certification').length}
                    </div>
                    <div className="stat-label">Certifications</div>
                </div>
                <div className="stat-box" data-aos="zoom-in" data-aos-delay="300">
                    <div className="stat-number">
                        {new Set(educationData.flatMap(e => e.skills || [])).size}
                    </div>
                    <div className="stat-label">Skills Acquired</div>
                </div>
                <div className="stat-box" data-aos="zoom-in" data-aos-delay="400">
                    <div className="stat-number">5+</div>
                    <div className="stat-label">Years Learning</div>
                </div>
            </div>
        </section>
    );
};

export default Education;