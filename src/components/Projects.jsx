import React from 'react';
import '../styles/Projects.css';

const Projects = () => {
    const projects = [
        {
            title: "E-Commerce Platform",
            description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
            imageUrl: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/ecommerce",
            demoUrl: "https://demo-ecommerce.com",
            technologies: ["React", "Node.js", "MongoDB"]
        },
        {
            title: "Portfolio Website",
            description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
            imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/portfolio",
            demoUrl: "https://yourusername.github.io/portfolio",
            technologies: ["React", "CSS"]
        },
        {
            title: "Task Management App",
            description: "React-based task management application with real-time updates and collaborative features.",
            imageUrl: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/taskmanager",
            demoUrl: "https://yourusername.github.io/taskmanager",
            technologies: ["React", "Firebase"]
        },
        {
            title: "Social Media Dashboard",
            description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/dashboard",
            demoUrl: "https://yourusername.github.io/dashboard",
            technologies: ["React", "D3.js"]
        },
        {
            title: "Weather App",
            description: "Dynamic weather application with location-based forecasts and interactive maps.",
            imageUrl: "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/weather-app",
            demoUrl: "https://yourusername.github.io/weather-app",
            technologies: ["React", "OpenWeatherMap API"]
        },
        {
            title: "Chat Application",
            description: "Real-time chat application with WebSocket integration and file sharing capabilities.",
            imageUrl: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/chat-app",
            demoUrl: "https://yourusername.github.io/chat-app",
            technologies: ["React", "Socket.io"]
        },
        {
            title: "AI Image Generator",
            description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
            imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/ai-image-generator",
            demoUrl: "https://yourusername.github.io/ai-image-generator",
            technologies: ["React", "TensorFlow.js"]
        },
        {
            title: "Crypto Trading Bot",
            description: "Automated cryptocurrency trading bot with technical analysis and risk management features.",
            imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/crypto-bot",
            demoUrl: "https://yourusername.github.io/crypto-bot",
            technologies: ["Python", "TensorFlow"]
        },
        {
            title: "Virtual Reality Game",
            description: "Immersive VR game developed with Unity, featuring realistic physics and interactive environments.",
            imageUrl: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?ixlib=rb-4.0.3",
            githubUrl: "https://github.com/yourusername/vr-game",
            demoUrl: "https://yourusername.github.io/vr-game",
            technologies: ["Unity", "C#"]
        }
    ];

    return (
        <section className="projects" id="projects">
            <h2 className="heading">Latest <span>Projects</span></h2>
            <div className="projects-container">
                {projects.map((project, index) => (
                    <div 
                        className="project-box" 
                        key={index}
                        data-aos="fade-up" 
                        data-aos-delay={index * 100}
                    >
                        <img src={project.imageUrl} alt={project.title} />
                        <div className="project-layer">
                            <h4>{project.title}</h4>
                            <p>{project.description}</p>
                            <div className="project-tech">
                                {project.technologies.map((tech, techIndex) => (
                                    <span key={techIndex} className="tech-tag">{tech}</span>
                                ))}
                            </div>
                            <div className="project-links">
                                <a 
                                    href={project.githubUrl} 
                                    className="project-link github"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label="View source code on GitHub"
                                >
                                    <i className="fa-brands fa-github"></i>
                                    <span>Source</span>
                                </a>
                                <a 
                                    href={project.demoUrl} 
                                    className="project-link demo"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label="View live demo"
                                >
                                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                    <span>Live Demo</span>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;
