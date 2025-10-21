import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit3, Trash2, Eye, ExternalLink, Github, Calendar, Tag, Users, Star, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const ProjectManagerEnhanced = () => {
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('grid');

    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        technologies: [],
        status: 'in-progress',
        category: 'Web',
        links: { github: '', live: '', demo: '' },
        images: [],
        featured: false
    });
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [imageUrl, setImageUrl] = useState('');

    // Load projects from database
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getProjects();
            setProjects(response.projects || []);
        } catch (err) {
            console.error('Error loading projects:', err);
            // Fallback to demo data if API fails
            setProjects(getDemoProjects());
        } finally {
            setLoading(false);
        }
    };

    const getDemoProjects = () => [
        {
            id: '1',
            title: 'E-Portfolio Website',
            description: 'Modern portfolio with real-time features',
            technologies: ['React', 'Node.js', 'MongoDB', 'Socket.io'],
            status: 'completed',
            category: 'Web',
            links: { github: 'https://github.com/...', live: 'https://...' },
            images: [
                { url: 'https://via.placeholder.com/800x400/0ef/081b29?text=Portfolio+Dashboard', caption: 'Dashboard View' },
                { url: 'https://via.placeholder.com/800x400/00d4ff/081b29?text=Project+Gallery', caption: 'Projects Section' }
            ],
            featured: true,
            createdAt: '2024-01-15'
        },
        {
            id: '2',
            title: 'Task Management App',
            description: 'Collaborative task manager with Kanban board',
            technologies: ['React', 'Firebase', 'TailwindCSS'],
            status: 'in-progress',
            category: 'Web',
            links: { github: 'https://github.com/...' },
            images: [
                { url: 'https://via.placeholder.com/800x400/f59e0b/081b29?text=Kanban+Board', caption: 'Task Board' }
            ],
            featured: false,
            createdAt: '2024-02-01'
        }
    ];

    const handleAddProject = async () => {
        if (!newProject.title || !newProject.description) {
            error('Please fill in all required fields');
            return;
        }

        try {
            const response = await ApiService.createProject(newProject);
            setProjects([response.project, ...projects]);
            setShowAddModal(false);
            setNewProject({
                title: '',
                description: '',
                technologies: [],
                status: 'in-progress',
                category: 'Web',
                links: { github: '', live: '', demo: '' },
                images: [],
                featured: false
            });
            success('Project created successfully!');
        } catch (err) {
            error('Failed to create project');
        }
    };

    const handleDeleteProject = async (id) => {
        try {
            await ApiService.deleteProject(id);
            setProjects(projects.filter(p => p.id !== id));
            success('Project deleted');
        } catch (err) {
            error('Failed to delete project');
        }
    };

    const handleToggleFeatured = async (id) => {
        const project = projects.find(p => p.id === id);
        try {
            await ApiService.updateProject(id, { featured: !project.featured });
            setProjects(projects.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
            success(project.featured ? 'Removed from featured' : 'Added to featured');
        } catch (err) {
            error('Failed to update project');
        }
    };

    // Filter and sort projects
    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'featured') return b.featured - a.featured;
            return 0;
        });

    const statusColors = {
        'in-progress': '#f59e0b',
        'completed': '#10b981',
        'archived': '#6b7280'
    };

    return (
        <DashboardLayout
            title="Project Manager"
            subtitle="Manage and showcase your portfolio projects"
            actions={
                <button onClick={() => setShowAddModal(true)} style={{
                    padding: '12px 24px', background: theme.gradient, color: theme.background,
                    borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                    boxShadow: `0 4px 15px ${theme.primary}40`
                }}>
                    <Plus size={18} /> New Project
                </button>
            }
        >
            <div style={{ padding: '24px' }}>
                {/* Filters & Search */}
                <div style={{
                    background: `${theme.surface}80`, borderRadius: '16px', padding: '20px',
                    marginBottom: '24px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                            <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 40px', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`,
                                borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer'
                            }}>
                            <option value="all">All Status</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        {/* Category Filter */}
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                            style={{
                                padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`,
                                borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer'
                            }}>
                            <option value="all">All Categories</option>
                            <option value="Web">Web</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Desktop">Desktop</option>
                            <option value="AI/ML">AI/ML</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* Sort By */}
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`,
                                borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer'
                            }}>
                            <option value="recent">Most Recent</option>
                            <option value="title">Title A-Z</option>
                            <option value="featured">Featured First</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total', value: projects.length, color: theme.primary },
                        { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, color: '#f59e0b' },
                        { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#10b981' },
                        { label: 'Featured', value: projects.filter(p => p.featured).length, color: '#8b5cf6' }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: `${theme.surface}80`, borderRadius: '12px', padding: '20px',
                            border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                        }}>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '700', color: stat.color, margin: 0 }}>{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
                        <p>No projects found. Create your first project!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {filteredProjects.map((project, index) => (
                            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: `${theme.surface}90`, borderRadius: '16px', border: `1px solid ${theme.border}`,
                                    overflow: 'hidden', backdropFilter: 'blur(10px)', position: 'relative'
                                }}
                            >
                                {/* Project Image */}
                                {project.images && project.images.length > 0 ? (
                                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden', cursor: 'pointer' }}
                                        onClick={() => { setSelectedProject(project); setShowImageModal(true); }}
                                    >
                                        <img src={project.images[0].url} alt={project.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {project.images.length > 1 && (
                                            <div style={{
                                                position: 'absolute', bottom: '12px', right: '12px',
                                                background: 'rgba(0, 0, 0, 0.7)', padding: '6px 12px', borderRadius: '8px',
                                                color: 'white', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                <ImageIcon size={14} /> +{project.images.length - 1} more
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        height: '200px', background: `${theme.primary}15`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${theme.border}`
                                    }}>
                                        <ImageIcon size={48} style={{ color: `${theme.primary}40` }} />
                                    </div>
                                )}

                                {/* Featured Badge */}
                                {project.featured && (
                                    <div style={{
                                        position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                                        padding: '4px 12px', borderRadius: '6px', background: '#8b5cf6',
                                        color: 'white', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <Star size={14} /> Featured
                                    </div>
                                )}

                                {/* Project Header */}
                                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
                                    <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>
                                        {project.title}
                                    </h3>
                                    <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 12px 0', lineHeight: '1.6' }}>
                                        {project.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                            background: `${statusColors[project.status]}20`, color: statusColors[project.status]
                                        }}>
                                            {project.status.replace('-', ' ').toUpperCase()}
                                        </span>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                            background: `${theme.primary}20`, color: theme.primary
                                        }}>
                                            <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {project.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Technologies */}
                                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border}` }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {project.technologies?.map((tech, i) => (
                                            <span key={i} style={{
                                                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                                background: `${theme.background}80`, color: theme.text, border: `1px solid ${theme.border}`
                                            }}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ padding: '16px 24px', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {project.links?.github && (
                                            <a href={project.links.github} target="_blank" rel="noopener noreferrer" style={{
                                                padding: '8px', background: `${theme.primary}15`, borderRadius: '8px',
                                                color: theme.primary, display: 'flex', alignItems: 'center', cursor: 'pointer'
                                            }}>
                                                <Github size={16} />
                                            </a>
                                        )}
                                        {project.links?.live && (
                                            <a href={project.links.live} target="_blank" rel="noopener noreferrer" style={{
                                                padding: '8px', background: `${theme.primary}15`, borderRadius: '8px',
                                                color: theme.primary, display: 'flex', alignItems: 'center', cursor: 'pointer'
                                            }}>
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleToggleFeatured(project.id)} style={{
                                            padding: '8px', background: project.featured ? '#8b5cf620' : `${theme.primary}15`,
                                            borderRadius: '8px', border: 'none', color: project.featured ? '#8b5cf6' : theme.primary, cursor: 'pointer'
                                        }}>
                                            <Star size={16} fill={project.featured ? '#8b5cf6' : 'none'} />
                                        </button>
                                        <button style={{
                                            padding: '8px', background: `${theme.primary}15`, borderRadius: '8px',
                                            border: 'none', color: theme.primary, cursor: 'pointer'
                                        }}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteProject(project.id)} style={{
                                            padding: '8px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px',
                                            border: 'none', color: '#ef4444', cursor: 'pointer'
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add Project Modal */}
                {showAddModal && (
                    <div onClick={() => setShowAddModal(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
                            style={{
                                background: theme.surface, borderRadius: '20px', padding: '32px', maxWidth: '600px',
                                width: '90%', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <h3 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                                Create New Project
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                        Title *
                                    </label>
                                    <input type="text" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                        placeholder="E-Commerce Platform" style={{
                                            width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                        Description *
                                    </label>
                                    <textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="Brief project description..." rows={4} style={{
                                            width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none', resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                            Status
                                        </label>
                                        <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                            }}>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                            Category
                                        </label>
                                        <select value={newProject.category} onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                            }}>
                                            <option value="Web">Web</option>
                                            <option value="Mobile">Mobile</option>
                                            <option value="Desktop">Desktop</option>
                                            <option value="AI/ML">AI/ML</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                        GitHub URL
                                    </label>
                                    <input type="url" value={newProject.links.github} onChange={(e) => setNewProject({ ...newProject, links: { ...newProject.links, github: e.target.value } })}
                                        placeholder="https://github.com/..." style={{
                                            width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                        Live Demo URL
                                    </label>
                                    <input type="url" value={newProject.links.live} onChange={(e) => setNewProject({ ...newProject, links: { ...newProject.links, live: e.target.value } })}
                                        placeholder="https://..." style={{
                                            width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                            border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                        }}
                                    />
                                </div>
                                {/* Image URLs */}
                                <div>
                                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                        Project Images (URLs)
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://image-url.com/image.jpg" style={{
                                                flex: 1, padding: '12px 16px', background: `${theme.background}80`,
                                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '15px', outline: 'none'
                                            }}
                                        />
                                        <button type="button" onClick={() => {
                                            if (imageUrl.trim()) {
                                                setNewProject({ ...newProject, images: [...(newProject.images || []), { url: imageUrl, caption: '' }] });
                                                setImageUrl('');
                                            }
                                        }} style={{
                                            padding: '12px 20px', background: theme.gradient, border: 'none',
                                            borderRadius: '10px', color: theme.background, fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            <Plus size={16} /> Add
                                        </button>
                                    </div>
                                    {/* Image Preview */}
                                    {newProject.images && newProject.images.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '12px' }}>
                                            {newProject.images.map((img, idx) => (
                                                <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                                                    <img src={img.url} alt={`Preview ${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                    <button onClick={() => setNewProject({ ...newProject, images: newProject.images.filter((_, i) => i !== idx) })}
                                                        style={{
                                                            position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px',
                                                            background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '4px',
                                                            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button onClick={handleAddProject} style={{
                                    flex: 1, padding: '14px', background: theme.gradient, border: 'none',
                                    borderRadius: '10px', color: theme.background, fontSize: '16px', fontWeight: '700', cursor: 'pointer'
                                }}>
                                    Create Project
                                </button>
                                <button onClick={() => setShowAddModal(false)} style={{
                                    padding: '14px 24px', background: `${theme.surface}80`, border: `1px solid ${theme.border}`,
                                    borderRadius: '10px', color: theme.text, fontSize: '16px', fontWeight: '600', cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Image Gallery Modal */}
                {showImageModal && selectedProject && (
                    <div onClick={() => setShowImageModal(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.9)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
                            style={{
                                background: theme.surface, borderRadius: '20px', padding: '32px', maxWidth: '900px',
                                width: '90%', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', margin: 0 }}>
                                    {selectedProject.title} - Images
                                </h3>
                                <button onClick={() => setShowImageModal(false)} style={{
                                    background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer'
                                }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {selectedProject.images && selectedProject.images.length > 0 ? (
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    {selectedProject.images.map((img, idx) => (
                                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            style={{
                                                borderRadius: '12px', overflow: 'hidden', border: `1px solid ${theme.border}`,
                                                background: `${theme.background}80`
                                            }}
                                        >
                                            <img src={img.url} alt={img.caption || `Image ${idx + 1}`}
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                            />
                                            {img.caption && (
                                                <div style={{ padding: '16px' }}>
                                                    <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>{img.caption}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
                                    <ImageIcon size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <p>No images for this project</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProjectManagerEnhanced;
