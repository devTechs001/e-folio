import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import '../styles/Projects.css';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            console.log('Fetching projects from API...');
            const response = await apiService.getProjects();
            console.log('Projects API response:', response);
            
            if (response.success && response.projects && response.projects.length > 0) {
                console.log(`Loaded ${response.projects.length} projects from database`);
                setProjects(response.projects);
            } else {
                console.log('No projects from API, using fallback data');
                setProjects(getFallbackProjects());
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            console.log('Using fallback projects due to error');
            setProjects(getFallbackProjects());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackProjects = () => [
        {
            title: "E-Commerce Platform",
            description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
            imageUrl: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/ecommerce",
            demoUrl: "https://demo-ecommerce.com",
            technologies: ["React", "Node.js", "MongoDB", "Stripe"],
            category: "fullstack"
        },
        {
            title: "Portfolio Website",
            description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
            imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/portfolio",
            demoUrl: "https://yourusername.github.io/portfolio",
            technologies: ["React", "Tailwind CSS", "Framer Motion"],
            category: "frontend"
        },
        {
            title: "Task Management App",
            description: "React-based task management application with real-time updates and collaborative features.",
            imageUrl: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/taskmanager",
            demoUrl: "https://yourusername.github.io/taskmanager",
            technologies: ["React", "Firebase", "Redux"],
            category: "fullstack"
        },
        {
            title: "Social Media Dashboard",
            description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/dashboard",
            demoUrl: "https://yourusername.github.io/dashboard",
            technologies: ["React", "D3.js", "Chart.js"],
            category: "frontend"
        },
        {
            title: "Weather App",
            description: "Dynamic weather application with location-based forecasts and interactive maps.",
            imageUrl: "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/weather-app",
            demoUrl: "https://yourusername.github.io/weather-app",
            technologies: ["React", "OpenWeatherMap API", "Leaflet"],
            category: "frontend"
        },
        {
            title: "Chat Application",
            description: "Real-time chat application with WebSocket integration and file sharing capabilities.",
            imageUrl: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/chat-app",
            demoUrl: "https://yourusername.github.io/chat-app",
            technologies: ["React", "Socket.io", "Express", "MongoDB"],
            category: "fullstack"
        },
        {
            title: "AI Image Generator",
            description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
            imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/ai-image-generator",
            demoUrl: "https://yourusername.github.io/ai-image-generator",
            technologies: ["React", "TensorFlow.js", "Python", "FastAPI"],
            category: "ai"
        },
        {
            title: "Crypto Trading Bot",
            description: "Automated cryptocurrency trading bot with technical analysis and risk management features.",
            imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/crypto-bot",
            demoUrl: "https://yourusername.github.io/crypto-bot",
            technologies: ["Python", "TensorFlow", "Pandas", "Binance API"],
            category: "ai"
        },
        {
            title: "Virtual Reality Game",
            description: "Immersive VR game developed with Unity, featuring realistic physics and interactive environments.",
            imageUrl: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/vr-game",
            demoUrl: "https://yourusername.github.io/vr-game",
            technologies: ["Unity", "C#", "Oculus SDK"],
            category: "gamedev"
        }
    ];

    // Get unique categories from projects
    const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];

    // Filter projects based on selected category
    const filteredProjects = filter === 'all' 
        ? projects 
        : projects.filter(p => p.category === filter);

    // Get all unique technologies
    const allTechnologies = [...new Set(projects.flatMap(p => p.technologies || []))];

    if (loading) {
        return (
            <section className="min-h-screen bg-bgColor flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="project-loader"></div>
                    <p className="text-textColor text-lg animate-pulse">Loading amazing projects...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="projects-section bg-bgColor py-20 px-4 md:px-8 lg:px-16" id="projects">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-textColor mb-4">
                    Latest <span className="text-mainColor gradient-text">Projects</span>
                </h2>
                <p className="text-center text-textColor/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
                    Explore my portfolio of innovative solutions and creative implementations
                </p>

                {/* Category Filter */}
                {categories.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setFilter(category)}
                                className={`
                                    px-6 py-2.5 rounded-full font-medium text-sm md:text-base
                                    transition-all duration-300 transform hover:scale-105
                                    ${filter === category 
                                        ? 'filter-btn-active shadow-glow' 
                                        : 'filter-btn-inactive hover:bg-mainColor/10'
                                    }
                                `}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tech Stack Overview */}
                {allTechnologies.length > 0 && (
                    <div className="mb-12">
                        <h3 className="text-xl md:text-2xl font-semibold text-textColor text-center mb-6">
                            Technologies I Work With
                        </h3>
                        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                            {allTechnologies.map((tech, index) => (
                                <span
                                    key={index}
                                    className="tech-badge"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-textColor/50 text-xl">No projects found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredProjects.map((project, index) => (
                            <div
                                className="project-card group"
                                key={index}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                {/* Project Image Container */}
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-mainColor/20 to-mainColor/5">
                                    <img
                                        src={project.images?.[0]?.url || project.imageUrl}
                                        alt={project.title}
                                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    
                                    {/* Category Badge */}
                                    {project.category && (
                                        <div className="absolute top-4 right-4">
                                            <span className="category-badge">
                                                {project.category}
                                            </span>
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="project-overlay">
                                        <div className="flex flex-col h-full justify-between p-6">
                                            {/* Top Section */}
                                            <div>
                                                <h4 className="text-2xl md:text-3xl font-bold text-white mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    {project.title}
                                                </h4>
                                                <p className="text-white/90 text-sm md:text-base leading-relaxed transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                    {project.description}
                                                </p>
                                            </div>

                                            {/* Bottom Section */}
                                            <div className="space-y-4">
                                                {/* Technologies */}
                                                {project.technologies && project.technologies.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                                                        {project.technologies.map((tech, techIndex) => (
                                                            <span
                                                                key={techIndex}
                                                                className="tech-tag-overlay"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                                                    {(project.links?.github || project.githubUrl) && (
                                                        <a
                                                            href={project.links?.github || project.githubUrl}
                                                            className="project-btn project-btn-github"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label="View source code on GitHub"
                                                        >
                                                            <i className="fa-brands fa-github text-lg"></i>
                                                            <span>Source</span>
                                                        </a>
                                                    )}
                                                    {(project.links?.live || project.links?.demo || project.demoUrl) && (
                                                        <a
                                                            href={project.links?.live || project.links?.demo || project.demoUrl}
                                                            className="project-btn project-btn-demo"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label="View live demo"
                                                        >
                                                            <i className="fa-solid fa-arrow-up-right-from-square text-lg"></i>
                                                            <span>Live Demo</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16">
                <p className="text-textColor/70 text-lg mb-6">
                    Want to see more of my work?
                </p>
                <a
                    href="https://github.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-mainColor to-mainColor/80 text-bgColor font-semibold rounded-full hover-lift shadow-glow transition-all duration-300"
                >
                    <i className="fa-brands fa-github text-2xl"></i>
                    <span>Visit My GitHub</span>
                </a>
            </div>
        </section>
    );
};

export default Projects;