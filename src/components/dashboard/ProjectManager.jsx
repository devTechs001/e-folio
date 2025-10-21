import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProjectManager = () => {
    const { canEdit, isOwner } = useAuth();
    const [projects, setProjects] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [filter, setFilter] = useState('all');

    // Initialize with existing projects from the portfolio
    useEffect(() => {
        const initialProjects = [
            {
                id: 1,
                title: "E-Commerce Platform",
                description: "Full-stack e-commerce solution with secure payment integration",
                status: "completed",
                category: "web",
                technologies: ["React", "Node.js", "MongoDB"],
                githubUrl: "https://github.com/yourusername/ecommerce",
                demoUrl: "https://demo-ecommerce.com",
                imageUrl: "https://images.unsplash.com/photo-1557821552-17105176677c",
                featured: true
            },
            {
                id: 2,
                title: "Portfolio Website",
                description: "Modern portfolio website with animations",
                status: "completed",
                category: "web",
                technologies: ["React", "CSS"],
                githubUrl: "https://github.com/yourusername/portfolio",
                demoUrl: "https://yourusername.github.io/portfolio",
                imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
                featured: true
            },
            {
                id: 3,
                title: "AI Chat Bot",
                description: "Intelligent chatbot with NLP capabilities",
                status: "in-development",
                category: "ai",
                technologies: ["Python", "TensorFlow", "Flask"],
                githubUrl: "https://github.com/yourusername/ai-bot",
                demoUrl: "",
                imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
                featured: false
            }
        ];
        setProjects(initialProjects);
    }, []);

    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        status: 'in-development',
        category: 'web',
        technologies: [],
        githubUrl: '',
        demoUrl: '',
        imageUrl: '',
        featured: false
    });

    const statusOptions = [
        { value: 'in-development', label: 'In Development', color: '#ffa500' },
        { value: 'completed', label: 'Completed', color: '#0ef' },
        { value: 'on-hold', label: 'On Hold', color: '#ff6b6b' },
        { value: 'planning', label: 'Planning', color: '#888' }
    ];

    const categoryOptions = [
        { value: 'web', label: 'Web Development' },
        { value: 'mobile', label: 'Mobile App' },
        { value: 'ai', label: 'AI/ML' },
        { value: 'desktop', label: 'Desktop App' },
        { value: 'other', label: 'Other' }
    ];

    const filteredProjects = projects.filter(project => 
        filter === 'all' || project.status === filter || project.category === filter
    );

    const handleAddProject = () => {
        if (!canEdit()) return;
        
        const project = {
            ...newProject,
            id: Date.now(),
            technologies: newProject.technologies.filter(tech => tech.trim() !== '')
        };
        
        setProjects([...projects, project]);
        setNewProject({
            title: '',
            description: '',
            status: 'in-development',
            category: 'web',
            technologies: [],
            githubUrl: '',
            demoUrl: '',
            imageUrl: '',
            featured: false
        });
        setShowAddForm(false);
    };

    const handleEditProject = (project) => {
        if (!canEdit()) return;
        setEditingProject({ ...project });
    };

    const handleUpdateProject = () => {
        setProjects(projects.map(p => 
            p.id === editingProject.id ? editingProject : p
        ));
        setEditingProject(null);
    };

    const handleDeleteProject = (id) => {
        if (!isOwner()) return;
        setProjects(projects.filter(p => p.id !== id));
    };

    return (
        <div className="project-manager">
            <div className="header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h2 style={{ color: '#0ef', margin: 0 }}>Project Management</h2>
                {canEdit() && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        style={{
                            background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                            color: '#081b29',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-plus"></i> Add Project
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="filters" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                {['all', 'completed', 'in-development', 'web', 'ai', 'mobile'].map(filterOption => (
                    <button
                        key={filterOption}
                        onClick={() => setFilter(filterOption)}
                        style={{
                            background: filter === filterOption ? '#0ef' : 'transparent',
                            color: filter === filterOption ? '#081b29' : '#0ef',
                            border: '2px solid #0ef',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {filterOption.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Projects Grid */}
            <div className="projects-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
            }}>
                {filteredProjects.map(project => (
                    <div key={project.id} className="project-card" style={{
                        background: 'rgba(8, 27, 41, 0.8)',
                        border: '2px solid rgba(0, 239, 255, 0.3)',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease'
                    }}>
                        {project.imageUrl && (
                            <img 
                                src={project.imageUrl} 
                                alt={project.title}
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    objectFit: 'cover'
                                }}
                            />
                        )}
                        
                        <div style={{ padding: '20px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '15px'
                            }}>
                                <h3 style={{ color: '#0ef', margin: 0, fontSize: '18px' }}>
                                    {project.title}
                                </h3>
                                <span style={{
                                    background: statusOptions.find(s => s.value === project.status)?.color || '#888',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {project.status.replace('-', ' ')}
                                </span>
                            </div>

                            <p style={{ color: '#ededed', fontSize: '14px', marginBottom: '15px' }}>
                                {project.description}
                            </p>

                            <div className="tech-stack" style={{ marginBottom: '15px' }}>
                                {project.technologies.map((tech, index) => (
                                    <span key={index} style={{
                                        background: 'rgba(0, 239, 255, 0.2)',
                                        color: '#0ef',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        marginRight: '5px',
                                        marginBottom: '5px',
                                        display: 'inline-block'
                                    }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <div className="project-actions" style={{
                                display: 'flex',
                                gap: '10px',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {project.githubUrl && (
                                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                                           style={{
                                               color: '#0ef',
                                               fontSize: '16px',
                                               textDecoration: 'none'
                                           }}>
                                            <i className="fab fa-github"></i>
                                        </a>
                                    )}
                                    {project.demoUrl && (
                                        <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                                           style={{
                                               color: '#0ef',
                                               fontSize: '16px',
                                               textDecoration: 'none'
                                           }}>
                                            <i className="fas fa-external-link-alt"></i>
                                        </a>
                                    )}
                                </div>

                                {canEdit() && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleEditProject(project)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#0ef',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        {isOwner() && (
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ff4444',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Project Modal */}
            {showAddForm && canEdit() && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#081b29',
                        border: '2px solid #0ef',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Add New Project</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Project Title
                            </label>
                            <input
                                type="text"
                                value={newProject.title}
                                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Description
                            </label>
                            <textarea
                                value={newProject.description}
                                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed',
                                    minHeight: '80px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                    Status
                                </label>
                                <select
                                    value={newProject.status}
                                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#081b29',
                                        border: '2px solid #0ef',
                                        borderRadius: '5px',
                                        color: '#ededed'
                                    }}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                    Category
                                </label>
                                <select
                                    value={newProject.category}
                                    onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#081b29',
                                        border: '2px solid #0ef',
                                        borderRadius: '5px',
                                        color: '#ededed'
                                    }}
                                >
                                    {categoryOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Technologies (comma separated)
                            </label>
                            <input
                                type="text"
                                value={newProject.technologies.join(', ')}
                                onChange={(e) => setNewProject({
                                    ...newProject, 
                                    technologies: e.target.value.split(',').map(tech => tech.trim())
                                })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                                placeholder="React, Node.js, MongoDB"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                GitHub URL
                            </label>
                            <input
                                type="url"
                                value={newProject.githubUrl}
                                onChange={(e) => setNewProject({...newProject, githubUrl: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Demo URL
                            </label>
                            <input
                                type="url"
                                value={newProject.demoUrl}
                                onChange={(e) => setNewProject({...newProject, demoUrl: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    background: 'transparent',
                                    border: '2px solid #888',
                                    color: '#888',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProject}
                                style={{
                                    background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                                    color: '#081b29',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Add Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;
