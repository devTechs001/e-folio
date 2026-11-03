// src/components/Projects.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../hooks/useProjects';
import ProjectFilters from './ProjectFilters';
import ProjectCard from './ProjectCard';
import ProjectModal from '../pages/ProjectModal';
import ImageLightbox from '../pages/ImageLightbox';
import NexStoreCard from './NexStoreCard';
import '../styles/Projects.css';

const Projects = () => {
    const {
        projects,
        loading,
        filteredProjects,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        selectedProject,
        setSelectedProject,
        showImageLightbox,
        setShowImageLightbox,
        currentImageIndex,
        setCurrentImageIndex,
        handleAddProject,
        handleUpdateProject,
        handleDeleteProject
    } = useProjects();

    const [showAddModal, setShowAddModal] = useState(false);

    if (loading) {
        return (
            <div className="projects-loading">
                <div className="loader-spinner"></div>
                <p>Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="projects-container">
            <div className="projects-header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="projects-title-section"
                >
                    <h1 className="projects-title">Project Showcase</h1>
                    <p className="projects-subtitle">Explore my latest work and ongoing projects</p>
                </motion.div>

                <div className="projects-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                    <NexStoreCard variant="compact" />
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                    >
                        Add Project
                    </button>
                </div>
            </div>

            <ProjectFilters
                filters={filters}
                setFilters={setFilters}
                sortBy={sortBy}
                setSortBy={setSortBy}
                projectCount={filteredProjects.length}
            />

            <div className="projects-grid">
                {filteredProjects.map((project, index) => (
                    <ProjectCard
                        key={project.id || index}
                        project={project}
                        index={index}
                        onClick={() => setSelectedProject(project)}
                    />
                ))}
            </div>

            <div className="cta-section">
                <div className="cta-card">
                    <div className="cta-content">
                        <NexStoreCard variant="card" />
                    </div>
                </div>
            </div>

            {selectedProject && (
                <ProjectModal
                    show={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    project={selectedProject}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onImageClick={(index) => {
                        setCurrentImageIndex(index);
                        setShowImageLightbox(true);
                    }}
                    onEdit={() => {
                        // Handle edit
                    }}
                />
            )}

            <ImageLightbox
                show={showImageLightbox}
                onClose={() => setShowImageLightbox(false)}
                images={selectedProject?.images || []}
                currentIndex={currentImageIndex}
                onPrevious={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                onNext={() => setCurrentImageIndex(prev => Math.min(
                    (selectedProject?.images?.length || 1) - 1, 
                    prev + 1
                ))}
            />

            {showAddModal && (
                <ProjectModal
                    show={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    project={null}
                    onSave={handleAddProject}
                    isNew={true}
                />
            )}
        </div>
    );
};

export default Projects;