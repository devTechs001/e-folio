import React, { useState } from 'react';
import ProjectShare from './ProjectShare';
import '../styles/ProjectCard.css';

const ProjectCard = ({ 
    project, 
    index, 
    isFavorite, 
    onToggleFavorite, 
    onViewDetails,
    onImageClick,
    viewMode = 'grid',
    likes,
    onIncrementLikes
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'live': return 'status-live';
            case 'beta': return 'status-beta';
            case 'development': return 'status-dev';
            default: return 'status-default';
        }
    };

    if (viewMode === 'list') {
        return (
            <div 
                className="project-card-list"
                data-aos="fade-right"
                data-aos-delay={index * 50}
            >
                <div className="list-image-container">
                    <img
                        src={project.thumbnail || project.imageUrl}
                        alt={project.title}
                        className={`list-image ${imageLoaded ? 'loaded' : ''}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            setImageError(true);
                            // Use a reliable fallback image
                            e.target.src = `https://via.placeholder.com/400x300/0ef/fff?text=${encodeURIComponent(project.title)}`;
                        }}
                    />
                    {!imageLoaded && <div className="image-skeleton"></div>}
                </div>
                
                <div className="list-content">
                    <div className="list-header">
                        <div>
                            <h3 className="list-title">{project.title}</h3>
                            <p className="list-description">{project.description}</p>
                        </div>
                        <div className="list-badges">
                            {project.category && (
                                <span className="category-badge">{project.category}</span>
                            )}
                            {project.status && (
                                <span className={`status-badge ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="list-tech">
                        {project.technologies?.slice(0, 6).map((tech, i) => (
                            <span key={i} className="tech-tag-small">{tech}</span>
                        ))}
                        {project.technologies?.length > 6 && (
                            <span className="tech-tag-small">+{project.technologies.length - 6}</span>
                        )}
                    </div>

                    <div className="list-footer">
                        <div className="list-stats">
                            <span><i className="fa-solid fa-eye"></i> {project.views || 0}</span>
                            <span 
                                className="clickable-stat"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    incrementLikes(project.id);
                                }}
                                title="Like this project"
                            >
                                <i className="fa-solid fa-heart"></i> {likes || 0}
                            </span>
                            {project.completionDate && (
                                <span><i className="fa-solid fa-calendar"></i> {new Date(project.completionDate).toLocaleDateString()}</span>
                            )}
                        </div>
                        
                        <div className="list-actions">
                            <button
                                onClick={() => onToggleFavorite(project.id)}
                                className={`action-btn ${isFavorite ? 'favorite-active' : ''}`}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart`}></i>
                            </button>
                            
                            {project.links?.github && (
                                <a
                                    href={project.links.github}
                                    className="action-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View source code"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="fa-brands fa-github"></i>
                                </a>
                            )}
                            
                            {project.links?.live && (
                                <a
                                    href={project.links.live}
                                    className="action-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View live demo"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="fa-solid fa-external-link-alt"></i>
                                </a>
                            )}
                            
                            <ProjectShare project={project} />
                            
                            <button
                                onClick={() => onViewDetails(project)}
                                className="action-btn action-btn-primary"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid/Masonry View
    return (
        <div
            className={`project-card ${viewMode === 'masonry' ? 'masonry-item' : ''}`}
            data-aos="fade-up"
            data-aos-delay={index * 100}
            onClick={() => onViewDetails(project)}
        >
            {/* Favorite Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id);
                }}
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart`}></i>
            </button>

            {/* Image Container */}
            <div className="project-image-container">
                {!imageLoaded && !imageError && (
                    <div className="image-skeleton">
                        <div className="skeleton-shimmer"></div>
                    </div>
                )}
                
                <img
                    src={project.images?.[0]?.url || project.thumbnail || project.imageUrl}
                    alt={project.title}
                    className={`project-image ${imageLoaded ? 'loaded' : ''}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                        setImageError(true);
                        // Use a reliable fallback image
                        e.target.src = `https://via.placeholder.com/800x600/0ef/fff?text=${encodeURIComponent(project.title)}`;
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(project.images?.[0]?.url || project.imageUrl);
                    }}
                />

                {/* Badges */}
                <div className="card-badges">
                    {project.featured && (
                        <span className="badge badge-featured">
                            <i className="fa-solid fa-star"></i> Featured
                        </span>
                    )}
                    {project.category && (
                        <span className="badge badge-category">
                            {project.category}
                        </span>
                    )}
                    {project.status && (
                        <span className={`badge badge-status ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                    )}
                </div>

                {/* Quick View Overlay */}
                <div className="quick-view-overlay">
                    <div className="quick-view-content">
                        <h4 className="quick-view-title">{project.title}</h4>
                        <p className="quick-view-description">{project.description}</p>
                        
                        {project.technologies && (
                            <div className="quick-view-tech">
                                {project.technologies.slice(0, 4).map((tech, i) => (
                                    <span key={i} className="tech-tag">{tech}</span>
                                ))}
                                {project.technologies.length > 4 && (
                                    <span className="tech-tag">+{project.technologies.length - 4}</span>
                                )}
                            </div>
                        )}

                        <div className="quick-view-stats">
                            <div className="stat">
                                <i className="fa-solid fa-eye"></i>
                                <span>{project.views || 0}</span>
                            </div>
                            <div className="stat">
                                <span 
                                    className="clickable-stat"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onIncrementLikes();
                                    }}
                                    title="Like this project"
                                >
                                    <i className="fa-solid fa-heart"></i>
                                    <span>{likes || 0}</span>
                                </span>
                            </div>
                            {project.duration && (
                                <div className="stat">
                                    <i className="fa-solid fa-clock"></i>
                                    <span>{project.duration}</span>
                                </div>
                            )}
                        </div>

                        <div className="quick-view-actions">
                            {project.links?.github && (
                                <a
                                    href={project.links.github}
                                    className="quick-action-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="fa-brands fa-github"></i>
                                </a>
                            )}
                            {project.links?.live && (
                                <a
                                    href={project.links.live}
                                    className="quick-action-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="fa-solid fa-external-link-alt"></i>
                                </a>
                            )}
                            <ProjectShare project={project} />
                            <button className="quick-action-btn primary">
                                <span>View Details</span>
                                <i className="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;