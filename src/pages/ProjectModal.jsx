import React, { useState, useEffect } from 'react';
import { 
    Edit3, Save, X, ExternalLink, Github, Calendar, Tag, Users, Star, 
    Heart, Share2, Bookmark, Eye, Clock, ChevronLeft, ChevronRight,
    Trophy, Mountain, CheckCircle2, Code, AlignLeft, Sparkles
} from 'lucide-react';
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
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [likesCount, setLikesCount] = useState(project?.likes || 0);
    const [viewsCount, setViewsCount] = useState(project?.views || 0);
    
    const [editForm, setEditForm] = useState({
        title: project?.title || '',
        description: project?.description || '',
        fullDescription: project?.fullDescription || '',
        technologies: project?.technologies || [],
        status: project?.status || 'in-progress',
        featured: project?.featured || false,
        links: project?.links || {},
        tags: project?.tags || [],
        githubUrl: project?.links?.github || project?.githubUrl || '',
        liveUrl: project?.links?.live || project?.liveUrl || '',
        netlifyUrl: project?.links?.netlify || project?.netlifyUrl || ''
    });
    const [saving, setSaving] = useState(false);

    const projectId = project?._id || project?.id;

    useEffect(() => {
        if (!project) return;
        document.body.style.overflow = 'hidden';
        setLikesCount(project.likes || 0);
        setViewsCount(project.views || 0);
        setActiveImageIndex(0);

        // Record a view if valid ID
        if (projectId) {
            apiService.viewProject(projectId).catch(() => {});
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [project, projectId]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    if (!project) {
        return null;
    }

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const images = (project.images && project.images.length > 0)
        ? project.images
        : (project.imageUrl || project.thumbnail)
            ? [{ url: project.imageUrl || project.thumbnail, caption: project.title }]
            : [];

    const nextImage = () => {
        if (images.length <= 1) return;
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (images.length <= 1) return;
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditForm({
            title: project.title || '',
            description: project.description || '',
            fullDescription: project.fullDescription || '',
            technologies: project.technologies || [],
            status: project.status || 'in-progress',
            featured: project.featured || false,
            links: project.links || {},
            tags: project.tags || [],
            githubUrl: project.links?.github || project.githubUrl || '',
            liveUrl: project.links?.live || project.liveUrl || '',
            netlifyUrl: project.links?.netlify || project.netlifyUrl || ''
        });
    };

    const handleSave = async () => {
        if (!editForm.title.trim()) {
            error('Title is required');
            return;
        }

        try {
            setSaving(true);
            const { githubUrl, liveUrl, netlifyUrl, ...rest } = editForm;
            const payload = {
                ...rest,
                links: {
                    ...(editForm.links || {}),
                    github: githubUrl || undefined,
                    live: liveUrl || undefined,
                    netlify: netlifyUrl || undefined
                }
            };
            
            const response = await apiService.updateProject(projectId, payload);
            const updatedProject = response.project || response.data || { ...project, ...payload };
            
            if (onProjectUpdate) {
                onProjectUpdate(updatedProject);
            }
            
            success('Project updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving project:', err);
            error(err.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleLike = async () => {
        try {
            if (!liked) {
                setLiked(true);
                setLikesCount(prev => prev + 1);
                if (projectId) {
                    await apiService.likeProject(projectId);
                }
                success('Project liked!');
                if (onProjectUpdate) {
                    onProjectUpdate({ ...project, likes: likesCount + 1 });
                }
            } else {
                setLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error liking project:', err);
        }
    };

    const handleBookmark = async () => {
        try {
            setBookmarked(!bookmarked);
            if (projectId) {
                await apiService.toggleFavoriteProject(projectId);
            }
            success(bookmarked ? 'Bookmark removed' : 'Project bookmarked!');
        } catch (err) {
            console.error('Error bookmarking project:', err);
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/projects/${projectId || ''}`;
            const shareData = {
                title: project.title,
                text: project.description,
                url: shareUrl
            };
            
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                success('Project link copied to clipboard!');
            }
            if (projectId) {
                apiService.shareProject(projectId, 'general').catch(() => {});
            }
        } catch (err) {
            console.error('Error sharing project:', err);
        }
    };

    const handleImageClickInternal = (url) => {
        if (onImageClick) {
            onImageClick(url);
        } else if (url) {
            window.open(url, '_blank');
        }
    };

    const githubLink = project.links?.github || project.githubUrl;
    const demoLink = project.links?.netlify || project.links?.live || project.liveUrl;

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
                    <X size={20} />
                </button>

                {/* Modal Content */}
                <div className="modal-content">
                    {/* Image Gallery Section */}
                    <div className="modal-gallery">
                        {images.length > 0 ? (
                            <>
                                <div className="gallery-main">
                                    <img
                                        src={images[activeImageIndex]?.url}
                                        alt={images[activeImageIndex]?.caption || project.title}
                                        className="gallery-main-image cursor-pointer"
                                        onClick={() => handleImageClickInternal(images[activeImageIndex]?.url)}
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                className="gallery-nav gallery-nav-prev"
                                                onClick={prevImage}
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                className="gallery-nav gallery-nav-next"
                                                onClick={nextImage}
                                                aria-label="Next image"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </>
                                    )}
                                    {images[activeImageIndex]?.caption && (
                                        <div className="gallery-caption">
                                            {images[activeImageIndex]?.caption}
                                        </div>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="gallery-thumbnails">
                                        {images.map((img, index) => (
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
                            <div className="gallery-placeholder flex items-center justify-center h-48 bg-gray-800 text-gray-400">
                                <span>No preview image available</span>
                            </div>
                        )}
                    </div>

                    {/* Project Details Section */}
                    <div className="modal-details">
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{project.title}</h2>
                                <div className="modal-meta flex flex-wrap gap-2 items-center mt-2">
                                    {project.category && (
                                        <span className="meta-badge">{project.category}</span>
                                    )}
                                    {project.status && (
                                        <span className={`meta-badge status-${project.status.toLowerCase()}`}>
                                            {project.status}
                                        </span>
                                    )}
                                    {project.featured && (
                                        <span className="meta-badge featured flex items-center gap-1">
                                            <Star size={13} className="text-yellow-400 fill-yellow-400" /> Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="modal-stats-grid">
                            <div className="stat-item">
                                <Eye size={18} className="text-cyan-400" />
                                <div>
                                    <div className="stat-value">{viewsCount}</div>
                                    <div className="stat-label">Views</div>
                                </div>
                            </div>
                            <div className="stat-item">
                                <Heart size={18} className={liked ? 'text-red-500 fill-red-500' : 'text-red-400'} />
                                <div>
                                    <div className="stat-value">{likesCount}</div>
                                    <div className="stat-label">Likes</div>
                                </div>
                            </div>
                            {project.duration && (
                                <div className="stat-item">
                                    <Clock size={18} className="text-blue-400" />
                                    <div>
                                        <div className="stat-value">{project.duration}</div>
                                        <div className="stat-label">Duration</div>
                                    </div>
                                </div>
                            )}
                            {project.teamSize && (
                                <div className="stat-item">
                                    <Users size={18} className="text-emerald-400" />
                                    <div>
                                        <div className="stat-value">{project.teamSize}</div>
                                        <div className="stat-label">Team Size</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Edit Form - Only show when editing */}
                        {isEditing && (
                            <div className="edit-form space-y-4 my-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="form-input w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="Enter project title"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Short Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="form-textarea w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="Brief project description"
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Full Description</label>
                                    <textarea
                                        value={editForm.fullDescription}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, fullDescription: e.target.value }))}
                                        className="form-textarea w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="Detailed project description"
                                        rows={6}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Technologies (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(editForm.technologies) ? editForm.technologies.join(', ') : editForm.technologies}
                                        onChange={(e) => setEditForm(prev => ({ 
                                            ...prev, 
                                            technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                        }))}
                                        className="form-input w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="React, Node.js, MongoDB"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="form-select w-full p-2 rounded bg-gray-800 border border-gray-700"
                                    >
                                        <option value="in-progress">In Progress</option>
                                        <option value="planning">Planning</option>
                                        <option value="testing">Testing</option>
                                        <option value="completed">Completed</option>
                                        <option value="live">Live</option>
                                        <option value="beta">Beta</option>
                                        <option value="experimental">Experimental</option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">GitHub URL</label>
                                    <input
                                        type="url"
                                        value={editForm.githubUrl}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                        className="form-input w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="https://github.com/username/repo"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Live Demo URL</label>
                                    <input
                                        type="url"
                                        value={editForm.netlifyUrl || editForm.liveUrl}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, netlifyUrl: e.target.value, liveUrl: e.target.value }))}
                                        className="form-input w-full p-2 rounded bg-gray-800 border border-gray-700"
                                        placeholder="https://project.netlify.app"
                                    />
                                </div>
                                
                                <div className="form-group flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="featuredCheck"
                                        checked={editForm.featured}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, featured: e.target.checked }))}
                                        className="rounded text-cyan-500"
                                    />
                                    <label htmlFor="featuredCheck" className="text-sm">Featured Project</label>
                                </div>
                            </div>
                        )}

                        {/* Description - Only show when not editing */}
                        {!isEditing && (
                            <div className="modal-section">
                                <h3 className="section-title flex items-center gap-2 font-semibold text-lg mb-2">
                                    <AlignLeft size={18} className="text-cyan-400" />
                                    Description
                                </h3>
                                <p className="section-content text-gray-300 leading-relaxed">
                                    {project.fullDescription || project.description}
                                </p>
                            </div>
                        )}

                        {/* Technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                            <div className="modal-section mt-4">
                                <h3 className="section-title flex items-center gap-2 font-semibold text-lg mb-2">
                                    <Code size={18} className="text-cyan-400" />
                                    Technologies Used
                                </h3>
                                <div className="tech-list flex flex-wrap gap-2">
                                    {project.technologies.map((tech, index) => (
                                        <span key={index} className="tech-item px-3 py-1 bg-gray-800 text-cyan-300 rounded-full text-sm border border-gray-700">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                            <div className="modal-section mt-4">
                                <h3 className="section-title flex items-center gap-2 font-semibold text-lg mb-2">
                                    <Tag size={18} className="text-cyan-400" />
                                    Tags
                                </h3>
                                <div className="tags-list flex flex-wrap gap-2">
                                    {project.tags.map((tag, index) => (
                                        <span key={index} className="tag-item text-xs text-gray-400 bg-gray-800/60 px-2 py-1 rounded">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Challenges */}
                        {project.challenges && (
                            <div className="modal-section mt-4">
                                <h3 className="section-title flex items-center gap-2 font-semibold text-lg mb-2">
                                    <Mountain size={18} className="text-amber-400" />
                                    Challenges & Solutions
                                </h3>
                                <p className="section-content text-gray-300 leading-relaxed">{project.challenges}</p>
                            </div>
                        )}

                        {/* Achievements */}
                        {project.achievements && project.achievements.length > 0 && (
                            <div className="modal-section mt-4">
                                <h3 className="section-title flex items-center gap-2 font-semibold text-lg mb-2">
                                    <Trophy size={18} className="text-yellow-400" />
                                    Key Achievements
                                </h3>
                                <ul className="achievements-list space-y-2">
                                    {project.achievements.map((achievement, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-300">
                                            <CheckCircle2 size={16} className="text-emerald-400 mt-1 shrink-0" />
                                            <span>{achievement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="modal-actions flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-800">
                            {/* Owner Edit / Save Buttons */}
                            {user?.role === 'owner' && (
                                <button
                                    onClick={isEditing ? handleSave : handleEdit}
                                    className="modal-btn modal-btn-edit flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
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
                                    className="modal-btn modal-btn-cancel flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    <X size={16} />
                                    <span>Cancel</span>
                                </button>
                            )}
                            
                            {/* GitHub Link */}
                            {githubLink && (
                                <a
                                    href={githubLink}
                                    className="modal-btn modal-btn-github flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => projectId && apiService.shareProject(projectId, 'github')}
                                >
                                    <Github size={16} />
                                    <span>View Source Code</span>
                                </a>
                            )}
                            
                            {/* Live Demo */}
                            {demoLink && (
                                <a
                                    href={demoLink}
                                    className="modal-btn modal-btn-demo flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => projectId && apiService.shareProject(projectId, 'demo')}
                                >
                                    <ExternalLink size={16} />
                                    <span>Live Demo</span>
                                </a>
                            )}
                            
                            {/* Like Button */}
                            <button
                                onClick={handleLike}
                                className={`modal-btn modal-btn-like flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                                    liked 
                                        ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                                }`}
                            >
                                <Heart size={16} className={liked ? 'fill-current' : ''} />
                                <span>Like ({likesCount})</span>
                            </button>
                            
                            {/* Bookmark Button */}
                            <button
                                onClick={handleBookmark}
                                className={`modal-btn modal-btn-bookmark flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                                    bookmarked 
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                                }`}
                            >
                                <Bookmark size={16} className={bookmarked ? 'fill-current' : ''} />
                                <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                            </button>
                            
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="modal-btn modal-btn-share flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition"
                            >
                                <Share2 size={16} />
                                <span>Share</span>
                            </button>
                        </div>

                        {/* Project Info */}
                        {project.completionDate && (
                            <div className="modal-footer flex items-center gap-2 text-sm text-gray-400 mt-6 pt-4 border-t border-gray-800">
                                <Calendar size={15} />
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
