import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, ExternalLink, Github, Calendar, Tag, Users, Star, MapPin, Heart, Share2, Bookmark, ThumbsUp, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/NotificationSystem';
import apiService from '../services/api.service';
import '../styles/ProjectModal.css';

const ProjectModal = ({ project, onClose, onImageClick, onProjectUpdate }) => {
    const { user } = useAuth();
    const { success, error } = useNotifications();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: project.title || '',
        description: project.description || '',
        fullDescription: project.fullDescription || '',
        technologies: project.technologies || [],
        status: project.status || 'development',
        featured: project.featured || false,
        links: project.links || {},
        tags: project.tags || [],
        githubUrl: project.githubUrl || '',
        liveUrl: project.liveUrl || ''
    });
    const [saving, setSaving] = useState(false);

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

    const handleEdit = () => {
        setIsEditing(true);
        setEditForm({
            title: project.title || '',
            description: project.description || '',
            fullDescription: project.fullDescription || '',
            technologies: project.technologies || [],
            status: project.status || 'development',
            featured: project.featured || false,
            links: project.links || {},
            tags: project.tags || [],
            githubUrl: project.githubUrl || '',
            liveUrl: project.liveUrl || ''
        });
    };

    const handleSave = async () => {
        if (!editForm.title.trim()) {
            error('Title is required');
            return;
        }

        try {
            setSaving(true);
            const response = await apiService.updateProject(project.id, editForm);
            
            // Update the project in the parent component
            if (onProjectUpdate) {
                onProjectUpdate(response.project);
            }
            
            success('Project updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving project:', err);
            error(err.response?.data?.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({
            title: project.title || '',
            description: project.description || '',
            fullDescription: project.fullDescription || '',
            technologies: project.technologies || [],
            status: project.status || 'development',
            featured: project.featured || false,
            links: project.links || {},
            tags: project.tags || [],
            githubUrl: project.githubUrl || '',
            liveUrl: project.liveUrl || ''
        });
    };

    const handleLike = async () => {
        try {
            await apiService.likeProject(project.id);
            success('Project liked!');
            if (onProjectUpdate) {
                onProjectUpdate({ ...project, likes: (project.likes || 0) + 1 });
            }
        } catch (err) {
            console.error('Error liking project:', err);
        }
    };

    const handleBookmark = async () => {
        try {
            await apiService.toggleFavoriteProject(project.id);
            success('Project bookmarked!');
        } catch (err) {
            console.error('Error bookmarking project:', err);
        }
    };

    const handleShare = async () => {
        try {
            const shareData = {
                title: project.title,
                text: project.description,
                url: `${window.location.origin}/projects/${project.id}`
            };
            
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                success('Project link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing project:', err);
        }
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

                        {/* Edit Form - Only show when editing */}
                        {isEditing && (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Project Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="form-input"
                                        placeholder="Enter project title"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Short Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="form-textarea"
                                        placeholder="Brief project description"
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Full Description</label>
                                    <textarea
                                        value={editForm.fullDescription}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, fullDescription: e.target.value }))}
                                        className="form-textarea"
                                        placeholder="Detailed project description"
                                        rows={6}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Technologies (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={editForm.technologies.join(', ')}
                                        onChange={(e) => setEditForm(prev => ({ 
                                            ...prev, 
                                            technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                        }))}
                                        className="form-input"
                                        placeholder="React, Node.js, MongoDB"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="form-select"
                                    >
                                        <option value="development">Development</option>
                                        <option value="beta">Beta</option>
                                        <option value="live">Live</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>GitHub URL</label>
                                    <input
                                        type="url"
                                        value={editForm.githubUrl}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                        className="form-input"
                                        placeholder="https://github.com/username/repo"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Live Demo URL</label>
                                    <input
                                        type="url"
                                        value={editForm.liveUrl}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, liveUrl: e.target.value }))}
                                        className="form-input"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editForm.featured}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, featured: e.target.checked }))}
                                        />
                                        Featured Project
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Description - Only show when not editing */}
                        {!isEditing && (
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <i className="fa-solid fa-align-left"></i>
                                    Description
                                </h3>
                                <p className="section-content">
                                    {project.fullDescription || project.description}
                                </p>
                            </div>
                        )}

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
                            {/* Edit Button */}
                            {user?.role === 'owner' && (
                                <button
                                    onClick={isEditing ? handleSave : handleEdit}
                                    className="modal-btn modal-btn-edit"
                                    disabled={saving}
                                >
                                    {isEditing ? (
                                        <>
                                            <Save size={16} />
                                            <span>{saving ? 'Saving...' : 'Save'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={16} />
                                            <span>Edit Project</span>
                                        </>
                                    )}
                                </button>
                            )}
                            
                            {isEditing && user?.role === 'owner' && (
                                <button
                                    onClick={handleCancel}
                                    className="modal-btn modal-btn-cancel"
                                >
                                    <X size={16} />
                                    <span>Cancel</span>
                                </button>
                            )}
                            
                            {/* GitHub Link */}
                            {(project.links?.github || project.githubUrl) && (
                                <a
                                    href={project.links?.github || project.githubUrl}
                                    className="modal-btn modal-btn-github"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => apiService.shareProject(project.id, 'github')}
                                >
                                    <Github size={16} />
                                    <span>View Source Code</span>
                                </a>
                            )}
                            
                            {/* Live Demo */}
                            {(project.links?.live || project.liveUrl) && (
                                <a
                                    href={project.links?.live || project.liveUrl}
                                    className="modal-btn modal-btn-demo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => apiService.shareProject(project.id, 'demo')}
                                >
                                    <ExternalLink size={16} />
                                    <span>Live Demo</span>
                                </a>
                            )}
                            
                            {/* Like Button */}
                            <button
                                onClick={handleLike}
                                className="modal-btn modal-btn-like"
                            >
                                <Heart size={16} />
                                <span>Like ({project.likes || 0})</span>
                            </button>
                            
                            {/* Bookmark Button */}
                            <button
                                onClick={handleBookmark}
                                className="modal-btn modal-btn-bookmark"
                            >
                                <Bookmark size={16} />
                                <span>Bookmark</span>
                            </button>
                            
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="modal-btn modal-btn-share"
                            >
                                <Share2 size={16} />
                                <span>Share</span>
                            </button>
                            
                            {/* View Stats */}
                            <button
                                onClick={() => apiService.viewProject(project.id)}
                                className="modal-btn modal-btn-views"
                            >
                                <Eye size={16} />
                                <span>Views ({project.views || 0})</span>
                            </button>
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