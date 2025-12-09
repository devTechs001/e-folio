// src/components/ProjectCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Eye, Star, Clock, Tag, Code, Globe } from 'lucide-react';
import '../styles/ProjectCard.css';

const ProjectCard = ({ project, index, onClick }) => {
    const {
        title,
        description,
        imageUrl,
        images = [],
        technologies = [],
        category,
        status = 'completed',
        featured = false,
        tags = [],
        links = {},
        views = 0,
        likes = 0,
        createdAt,
        updatedAt
    } = project;

    // Get the main image URL
    const displayImage = imageUrl || (images[0] && images[0].url) || '/placeholder-project.jpg';

    // Status color mapping
    const statusColors = {
        'planning': 'bg-blue-500/20 text-blue-500',
        'in-progress': 'bg-yellow-500/20 text-yellow-500',
        'completed': 'bg-green-500/20 text-green-500',
        'archived': 'bg-gray-500/20 text-gray-500'
    };

    const statusColor = statusColors[status] || statusColors.completed;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="project-card"
            onClick={onClick}
        >
            <div className="project-card-image">
                <img
                    src={displayImage}
                    alt={title}
                    className="project-card-img"
                    onError={(e) => {
                        e.target.src = 'https://source.unsplash.com/400x300/?technology,code';
                    }}
                />
                
                {featured && (
                    <div className="project-featured-badge">
                        <Star size={16} fill="currentColor" />
                        Featured
                    </div>
                )}
                
                <div className="project-status-badge">
                    <span className={`status-indicator ${statusColor}`}>
                        {status.replace('-', ' ')}
                    </span>
                </div>
                
                {links.live && (
                    <a
                        href={links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-external-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Globe size={16} />
                    </a>
                )}
            </div>

            <div className="project-card-content">
                <h3 className="project-title">{title}</h3>
                
                <p className="project-description">
                    {description.length > 120 
                        ? description.substring(0, 120) + '...' 
                        : description}
                </p>

                <div className="project-category">
                    <span className="category-badge">{category}</span>
                </div>

                <div className="project-tech-stack">
                    {technologies.slice(0, 3).map((tech, idx) => (
                        <span key={idx} className="tech-badge">
                            {tech}
                        </span>
                    ))}
                    {technologies.length > 3 && (
                        <span className="tech-badge">+{technologies.length - 3}</span>
                    )}
                </div>

                <div className="project-tags">
                    {tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="tag-badge">
                            <Tag size={12} />
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="project-stats">
                    <span className="stat-item">
                        <Eye size={14} />
                        {views} views
                    </span>
                    <span className="stat-item">
                        <Star size={14} />
                        {likes} likes
                    </span>
                    {createdAt && (
                        <span className="stat-item">
                            <Clock size={14} />
                            {new Date(createdAt).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <div className="project-links">
                    {links.github && (
                        <a
                            href={links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link-btn"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Github size={16} />
                            Code
                        </a>
                    )}
                    {links.live && (
                        <a
                            href={links.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link-btn primary"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={16} />
                            Live Demo
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard;