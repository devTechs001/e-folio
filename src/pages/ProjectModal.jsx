import React, { useState, useEffect } from 'react';
import '../styles/ProjectModal.css';

const ProjectModal = ({ project, onClose, onImageClick }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    // Return null if no project is provided
    if (!project) {
        return null;
    }

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const nextImage = () => {
        setActiveImageIndex((prev) => 
            prev === (project.images?.length || 1) - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setActiveImageIndex((prev) => 
            prev === 0 ? (project.images?.length || 1) - 1 : prev - 1
        );
    };

    return (
        <div 
            className={`modal-backdrop ${isClosing ? 'closing' : ''}`}
            onClick={handleBackdropClick}
        >
            <div className={`modal-container ${isClosing ? 'closing' : ''}`}>
                {/* Close Button */}
                <button 
                    className="modal-close-btn"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    <i className="fa-solid fa-times"></i>
                </button>

                {/* Modal Content */}
                <div className="modal-content">
                    {/* Image Gallery Section */}
                    <div className="modal-gallery">
                        {project.images && project.images.length > 0 ? (
                            <>
                                <div className="gallery-main">
                                    <img
                                        src={project.images[activeImageIndex]?.url}
                                        alt={project.images[activeImageIndex]?.caption || project.title}
                                        className="gallery-main-image"
                                        onClick={() => onImageClick(project.images[activeImageIndex]?.url)}
                                    />
                                    {project.images.length > 1 && (
                                        <>
                                            <button
                                                className="gallery-nav gallery-nav-prev"
                                                onClick={prevImage}
                                                aria-label="Previous image"
                                            >
                                                <i className="fa-solid fa-chevron-left"></i>
                                            </button>
                                            <button
                                                className="gallery-nav gallery-nav-next"
                                                onClick={nextImage}
                                                aria-label="Next image"
                                            >
                                                <i className="fa-solid fa-chevron-right"></i>
                                            </button>
                                        </>
                                    )}
                                    <div className="gallery-caption">
                                        {project.images[activeImageIndex]?.caption}
                                    </div>
                                </div>
                                {project.images.length > 1 && (
                                    <div className="gallery-thumbnails">
                                        {project.images.map((img, index) => (
                                            <button
                                                key={index}
                                                className={`gallery-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                                                onClick={() => setActiveImageIndex(index)}
                                            >
                                                <img src={img.url} alt={img.caption || `Thumbnail ${index + 1}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <img
                                src={project.imageUrl || project.thumbnail}
                                alt={project.title}
                                className="gallery-main-image"
                            />
                        )}
                    </div>

                    {/* Project Details Section */}
                    <div className="modal-details">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{project.title}</h2>
                                <div className="modal-meta">
                                    {project.category && (
                                        <span className="meta-badge">{project.category}</span>
                                    )}
                                    {project.status && (
                                        <span className={`meta-badge status-${project.status.toLowerCase()}`}>
                                            {project.status}
                                        </span>
                                    )}
                                    {project.featured && (
                                        <span className="meta-badge featured">
                                            <i className="fa-solid fa-star"></i> Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="modal-stats-grid">
                            <div className="stat-item">
                                <i className="fa-solid fa-eye"></i>
                                <div>
                                    <div className="stat-value">{project.views || 0}</div>
                                    <div className="stat-label">Views</div>
                                </div>
                            </div>
                            <div className="stat-item">
                                <i className="fa-solid fa-heart"></i>
                                <div>
                                    <div className="stat-value">{project.likes || 0}</div>
                                    <div className="stat-label">Likes</div>
                                </div>
                            </div>
                            {project.duration && (
                                <div className="stat-item">
                                    <i className="fa-solid fa-clock"></i>
                                    <div>
                                        <div className="stat-value">{project.duration}</div>
                                        <div className="stat-label">Duration</div>
                                    </div>
                                </div>
                            )}
                            {project.teamSize && (
                                <div className="stat-item">
                                    <i className="fa-solid fa-users"></i>
                                    <div>
                                        <div className="stat-value">{project.teamSize}</div>
                                        <div className="stat-label">Team Size</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="modal-section">
                            <h3 className="section-title">
                                <i className="fa-solid fa-align-left"></i>
                                Description
                            </h3>
                            <p className="section-content">
                                {project.fullDescription || project.description}
                            </p>
                        </div>

                        {/* Technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <i className="fa-solid fa-code"></i>
                                    Technologies Used
                                </h3>
                                <div className="tech-list">
                                    {project.technologies.map((tech, index) => (
                                        <span key={index} className="tech-item">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <i className="fa-solid fa-tags"></i>
                                    Tags
                                </h3>
                                <div className="tags-list">
                                    {project.tags.map((tag, index) => (
                                        <span key={index} className="tag-item">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Challenges */}
                        {project.challenges && (
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <i className="fa-solid fa-mountain"></i>
                                    Challenges & Solutions
                                </h3>
                                <p className="section-content">{project.challenges}</p>
                            </div>
                        )}

                        {/* Achievements */}
                        {project.achievements && project.achievements.length > 0 && (
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <i className="fa-solid fa-trophy"></i>
                                    Key Achievements
                                </h3>
                                <ul className="achievements-list">
                                    {project.achievements.map((achievement, index) => (
                                        <li key={index}>
                                            <i className="fa-solid fa-check-circle"></i>
                                            {achievement}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-actions">
                            {project.links?.github && (
                                <a
                                    href={project.links.github}
                                    className="modal-btn modal-btn-github"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-github"></i>
                                    <span>View Source Code</span>
                                </a>
                            )}
                            {project.links?.live && (
                                <a
                                    href={project.links.live}
                                    className="modal-btn modal-btn-demo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-solid fa-external-link-alt"></i>
                                    <span>Live Demo</span>
                                </a>
                            )}
                        </div>

                        {/* Project Info */}
                        {project.completionDate && (
                            <div className="modal-footer">
                                <i className="fa-solid fa-calendar"></i>
                                <span>Completed on {new Date(project.completionDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;