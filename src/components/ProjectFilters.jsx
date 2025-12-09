// src/components/ProjectFilters.jsx
import React from 'react';
import { Search, Filter, Grid, List, Sliders } from 'lucide-react';
import '../styles/ProjectFilters.css';

const ProjectFilters = ({ filters, setFilters, sortBy, setSortBy, projectCount }) => {
    const categories = ['All', 'Web', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain', 'DevOps', 'Other'];
    const statuses = ['All', 'Planning', 'In Progress', 'Completed', 'Archived'];

    return (
        <div className="project-filters">
            <div className="filters-top-bar">
                <div className="filters-search">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search projects, technologies, tags..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="search-input"
                    />
                </div>

                <div className="filters-count">
                    <span>{projectCount} Projects</span>
                </div>
            </div>

            <div className="filters-options">
                <div className="filter-group">
                    <label>Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="filter-select"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat === 'All' ? 'all' : cat.toLowerCase()}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="filter-select"
                    >
                        {statuses.map(status => (
                            <option key={status} value={status === 'All' ? 'all' : status.toLowerCase().replace(' ', '-')}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Sort By</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="name">Name A-Z</option>
                        <option value="featured">Featured First</option>
                        <option value="views">Most Viewed</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Tags</label>
                    <select
                        multiple
                        value={filters.tags}
                        onChange={(e) => {
                            const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
                            setFilters(prev => ({ ...prev, tags: selectedTags }));
                        }}
                        className="filter-select multi-select"
                    >
                        <option value="featured">Featured</option>
                        <option value="popular">Popular</option>
                        <option value="latest">Latest</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="fullstack">Full Stack</option>
                    </select>
                </div>
            </div>

            <div className="filters-actions">
                <button
                    onClick={() => setFilters({
                        search: '',
                        category: 'all',
                        status: 'all',
                        tags: []
                    })}
                    className="btn-reset"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
};

export default ProjectFilters;