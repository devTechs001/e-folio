import React from 'react';

const ProjectFilters = ({ 
    categories, 
    technologies, 
    tags,
    selectedCategory,
    selectedTechs,
    onCategoryChange,
    onTechChange 
}) => {
    const toggleTech = (tech) => {
        if (selectedTechs.includes(tech)) {
            onTechChange(selectedTechs.filter(t => t !== tech));
        } else {
            onTechChange([...selectedTechs, tech]);
        }
    };

    return (
        <div className="advanced-filters-panel">
            {/* Technologies Filter */}
            <div className="filter-group">
                <h4 className="filter-group-title">
                    <i className="fa-solid fa-code"></i>
                    Filter by Technology
                </h4>
                <div className="filter-options">
                    {technologies.map((tech) => (
                        <button
                            key={tech}
                            onClick={() => toggleTech(tech)}
                            className={`filter-option ${selectedTechs.includes(tech) ? 'selected' : ''}`}
                        >
                            {tech}
                            {selectedTechs.includes(tech) && (
                                <i className="fa-solid fa-check ml-2"></i>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectFilters;