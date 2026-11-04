import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import apiService from '../services/api.service';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import ProjectShare from './ProjectShare';
import ImageLightbox from './ImageLightbox';
import ProjectFilters from './ProjectFilters';
import NexStoreCard from '../components/NexStoreCard';
import ProjectShowcase from '../components/ProjectShowcase';
import ArchiveNote from '../components/ArchiveNote';
import { loadPublicSection, isLiveContent, getSnapshotSection, PUBLIC_ENDPOINTS } from '../services/publicContent';
import { PROJECT_LINKS, projectLinkHost, projectLinkAnchorProps } from '../utils/projectLinks';
import { recordDevIssue, publicEmptyCopy } from '../utils/publicMessaging';
import '../styles/Projects.css';

const Projects = () => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentSource, setContentSource] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured'); // featured, newest, popular, views
    const [selectedProject, setSelectedProject] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // grid, list, masonry
    const [favorites, setFavorites] = useState([]);
    const [selectedTechs, setSelectedTechs] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [projectLikes, setProjectLikes] = useState({});
    const [projectsCollapsed, setProjectsCollapsed] = useState(false);
    const [techShowcaseCollapsed, setTechShowcaseCollapsed] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const techScrollerRef = useRef(null);
    const projectsGridRef = useRef(null);
    const projectLinksRef = useRef(null);
    const [linksCanScrollLeft, setLinksCanScrollLeft] = useState(false);
    const [linksCanScrollRight, setLinksCanScrollRight] = useState(false);

    // Page-level scroll affordances only — the project cards are untouched.
    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            setScrollProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            document.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('is-visible'));
            return undefined;
        }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
        return () => observer.disconnect();
    }, []);

    const updateTechScrollState = useCallback(() => {
        const strip = techScrollerRef.current;
        if (!strip) return;
        setCanScrollLeft(strip.scrollLeft > 4);
        setCanScrollRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateTechScrollState();
        window.addEventListener('resize', updateTechScrollState);
        return () => window.removeEventListener('resize', updateTechScrollState);
    }, [updateTechScrollState, allTechnologies.length]);

    const scrollTechStrip = useCallback(direction => {
        const strip = techScrollerRef.current;
        if (!strip) return;
        strip.scrollBy({ left: direction * Math.max(240, strip.clientWidth * 0.8), behavior: 'smooth' });
    }, []);

    const toggleTech = useCallback(tech => {
        setSelectedTechs(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    }, []);

    const updateLinksScrollState = useCallback(() => {
        const strip = projectLinksRef.current;
        if (!strip) return;
        setLinksCanScrollLeft(strip.scrollLeft > 4);
        setLinksCanScrollRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateLinksScrollState();
        window.addEventListener('resize', updateLinksScrollState);
        return () => window.removeEventListener('resize', updateLinksScrollState);
    }, [updateLinksScrollState]);

    const scrollProjectLinks = useCallback(direction => {
        const strip = projectLinksRef.current;
        if (!strip) return;
        strip.scrollBy({ left: direction * Math.max(280, strip.clientWidth * 0.8), behavior: 'smooth' });
    }, []);

    const loadProjects = useCallback(async () => {
        try {
            const cached = cacheService.get('public_projects');
            if (cached) {
                setProjects(cached);
                setContentSource('live');
                setLoading(false);
                return;
            }

            setLoading(true);
            // Live API first; the saved local copy keeps the section complete
            // and consistent when the backend cannot supply it. No technical
            // detail is ever exposed to visitors.
            const response = await loadPublicSection('projects');
            const liveItems = Array.isArray(response.projects) ? response.projects : [];
            // A live API may only publish a few records. Complete the section
            // from the same local saved copy used for offline visits, so the
            // public catalogue is never reduced to a partial live subset.
            const saved = getSnapshotSection('projects');
            const savedItems = Array.isArray(saved.projects) ? saved.projects : [];
            const identity = project => String(project.title || '').trim().toLowerCase();
            const seen = new Set(liveItems.map(identity));
            const additions = savedItems.filter(project => identity(project) && !seen.has(identity(project)));
            const items = [...liveItems, ...additions];
            setProjects(items);
            // Saved records are labelled as the archive, never as live data.
            setContentSource(additions.length ? 'snapshot' : (response.source || ''));
            // Only cache genuine live-only data, so a saved copy never masks a
            // backend that comes back online.
            if (isLiveContent(response) && additions.length === 0) {
                cacheService.set('public_projects', items, CACHE_TTL.TEN_MINUTES);
            }
        } catch (error) {
            recordDevIssue({ section: 'projects', endpoint: PUBLIC_ENDPOINTS.projects, error });
            setProjects([]);
            setContentSource('');
        } finally {
            setLoading(false);
        }
    }, [setProjects, setLoading]);

    const loadFavorites = () => {
        const saved = localStorage.getItem('favoriteProjects');
        if (saved) {
            setFavorites(JSON.parse(saved));
        }
    };

    const toggleFavorite = useCallback(async (projectId) => {
        try {
            // Try to toggle via API first
            await apiService.toggleFavoriteProject(projectId);
            
            // Update local state regardless of API success
            setFavorites(prev => {
                const newFavorites = prev.includes(projectId)
                    ? prev.filter(id => id !== projectId)
                    : [...prev, projectId];
                localStorage.setItem('favoriteProjects', JSON.stringify(newFavorites));
                return newFavorites;
            });
            
            // Show success feedback (could use a toast notification here)
            console.log(`Project ${projectId} ${favorites.includes(projectId) ? 'removed from' : 'added to'} favorites`);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Fallback to local state only
            setFavorites(prev => {
                const newFavorites = prev.includes(projectId)
                    ? prev.filter(id => id !== projectId)
                    : [...prev, projectId];
                localStorage.setItem('favoriteProjects', JSON.stringify(newFavorites));
                return newFavorites;
            });
        }
    }, [favorites]);

    const incrementViews = useCallback(async (projectId) => {
        try {
            await apiService.request(`/public/projects/${projectId}/view`, {
                method: 'POST'
            });
            setProjects(prev => prev.map(p => 
                p.id === projectId ? { ...p, views: (p.views || 0) + 1 } : p
            ));
            
            // Emit socket event for real-time update
            if (socket && connected) {
                socket.emit('project:view', { projectId, userId: user?.id });
            }
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }, [socket, connected, user?.id]);

    const incrementLikes = useCallback(async (projectId) => {
        try {
            // Check if user already liked this project
            const currentLikes = projectLikes[projectId] || 0;
            const hasLiked = currentLikes > 0 && currentLikes % 2 === 1; // Odd means liked
            
            if (hasLiked) {
                // Unlike the project
                await apiService.unlikeProject(projectId);
                setProjectLikes(prev => ({
                    ...prev,
                    [projectId]: Math.max(0, (prev[projectId] || 0) - 1)
                }));
                
                // Emit socket event for real-time update
                if (socket && connected) {
                    socket.emit('project:unlike', { projectId, userId: user?.id });
                }
            } else {
                // Like the project
                await apiService.likeProject(projectId);
                setProjectLikes(prev => ({
                    ...prev,
                    [projectId]: (prev[projectId] || 0) + 1
                }));
                
                // Emit socket event for real-time update
                if (socket && connected) {
                    socket.emit('project:like', { projectId, userId: user?.id });
                }
            }
            
            // Update the project's likes count
            setProjects(prev => prev.map(p => 
                p.id === projectId ? { 
                    ...p, 
                    likes: hasLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1 
                } : p
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
            // Fallback to local state if API fails
            setProjectLikes(prev => ({
                ...prev,
                [projectId]: (prev[projectId] || 0) + 1
            }));
        }
    }, [projectLikes, socket, connected, user?.id]);

    const shareProject = useCallback(async (projectId, platform = 'native') => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const shareData = {
                title: project.title,
                text: project.description,
                url: `${window.location.origin}/projects/${projectId}`
            };

            if (platform === 'native' && navigator.share) {
                // Use native share API
                await navigator.share(shareData);
            } else {
                // Fallback to API and manual sharing
                await apiService.shareProject(projectId, platform);
                
                // Create share URL based on platform
                let shareUrl = shareData.url;
                switch (platform) {
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
                        break;
                    case 'linkedin':
                        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
                        break;
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
                        break;
                    default:
                        // Copy to clipboard
                        await navigator.clipboard.writeText(shareData.url);
                        console.log('Project link copied to clipboard!');
                        return;
                }
                
                // Open share URL in new window
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }

            // Update share count
            setProjects(prev => prev.map(p => 
                p.id === projectId ? { ...p, shares: (p.shares || 0) + 1 } : p
            ));
            
        } catch (error) {
            console.error('Error sharing project:', error);
            // Fallback to copying link
            const project = projects.find(p => p.id === projectId);
            if (project) {
                await navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}`);
                console.log('Project link copied to clipboard!');
            }
        }
    }, [projects]);


    useEffect(() => {
        loadProjects();
        loadFavorites();
    }, [loadProjects]);

    // Real-time socket listeners for project updates
    useEffect(() => {
        if (!connected || !socket) return;

        const handleProjectUpdate = (data) => {
            console.log('Project updated in real-time:', data);
            setProjects(prev => prev.map(p =>
                p.id === data.projectId ? { ...p, ...data.updates } : p
            ));
        };

        const handleLikeUpdate = (data) => {
            console.log('Like update in real-time:', data);
            setProjects(prev => prev.map(p =>
                p.id === data.projectId ? { ...p, likes: data.likes } : p
            ));
            setProjectLikes(prev => ({
                ...prev,
                [data.projectId]: data.userLikes
            }));
        };

        const handleViewUpdate = (data) => {
            console.log('View update in real-time:', data);
            setProjects(prev => prev.map(p =>
                p.id === data.projectId ? { ...p, views: data.views } : p
            ));
        };

        const handleNewProject = (data) => {
            console.log('New project added:', data);
            setProjects(prev => [data.project, ...prev]);
        };

        socket.on('project:updated', handleProjectUpdate);
        socket.on('project:liked', handleLikeUpdate);
        socket.on('project:viewed', handleViewUpdate);
        socket.on('project:created', handleNewProject);

        return () => {
            socket.off('project:updated', handleProjectUpdate);
            socket.off('project:liked', handleLikeUpdate);
            socket.off('project:viewed', handleViewUpdate);
            socket.off('project:created', handleNewProject);
        };
    }, [connected, socket]);

    // Listen for settings changes from dashboard
    useEffect(() => {
        const handleSettingsChange = (e) => {
            console.log('[Projects] Settings changed, refreshing data...');
            cacheService.delete('public_projects');
            loadProjects();
        };
        window.addEventListener('settingsChanged', handleSettingsChange);
        return () => window.removeEventListener('settingsChanged', handleSettingsChange);
    }, [loadProjects]);

    // Enhanced filtering and sorting logic
    const filteredAndSortedProjects = useMemo(() => {
        let result = [...projects];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(project =>
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query) ||
                project.technologies?.some(tech => tech.toLowerCase().includes(query)) ||
                project.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Category filter
        if (filter !== 'all') {
            result = result.filter(p => p.category === filter);
        }

        // Technology filter
        if (selectedTechs.length > 0) {
            result = result.filter(p =>
                selectedTechs.every(tech =>
                    p.technologies?.some(t => t.toLowerCase() === tech.toLowerCase())
                )
            );
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'featured':
                    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
                case 'newest':
                    return new Date(b.completionDate || 0) - new Date(a.completionDate || 0);
                case 'popular':
                    return (b.likes || 0) - (a.likes || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return result;
    }, [projects, filter, searchQuery, sortBy, selectedTechs]);

    const categories = useMemo(() => {
        const allCategories = projects.map(p => p.category).filter(Boolean);
        const uniqueCategories = [...new Set(allCategories)];
        return ['all', ...uniqueCategories];
    }, [projects]);

    const allTechnologies = useMemo(() => {
        const techs = projects.flatMap(p => p.technologies || []);
        return [...new Set(techs)].sort();
    }, [projects]);

    const allTags = useMemo(() => {
        const tags = projects.flatMap(p => p.tags || []);
        return [...new Set(tags)].sort();
    }, [projects]);

    const projectStats = useMemo(() => ({
        total: projects.length,
        featured: projects.filter(p => p.featured).length,
        totalViews: projects.reduce((sum, p) => sum + (p.views || 0), 0),
        totalLikes: projects.reduce((sum, p) => sum + (p.likes || 0), 0)
    }), [projects]);

    // A zero total is not meaningful public information, so it is omitted
    // instead of being displayed as "0" or "0.0k".
    const summaryCards = useMemo(() => ([
        { label: 'Total Projects', count: projectStats.total, display: projectStats.total },
        { label: 'Featured', count: projectStats.featured, display: projectStats.featured },
        { label: 'Total Views', count: projectStats.totalViews, display: `${(projectStats.totalViews / 1000).toFixed(1)}k` },
        { label: 'Total Likes', count: projectStats.totalLikes, display: projectStats.totalLikes }
    ].filter(card => card.count > 0)), [projectStats]);

    if (loading) {
        return (
            <section className="min-h-screen bg-bgColor flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="project-loader"></div>
                        <div className="project-loader-inner"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-textColor text-xl font-semibold mb-2 animate-pulse">
                            Loading Amazing Projects...
                        </p>
                        <div className="flex gap-2 justify-center">
                            <span className="loading-dot"></span>
                            <span className="loading-dot" style={{ animationDelay: '0.2s' }}></span>
                            <span className="loading-dot" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="projects-section bg-bgColor py-20 px-4 md:px-8 lg:px-16" id="projects">
            <div
                className="projects-scroll-progress"
                style={{ transform: `scaleX(${scrollProgress})` }}
                aria-hidden="true"
            />
            {/* Enhanced Header with Stats */}
            <div className="max-w-7xl mx-auto mb-16" data-reveal>
                <div className="text-center mb-12 projects-header">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor mb-4">
                        Latest <span className="text-mainColor gradient-text">Projects</span>
                    </h2>
                    <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
                        Explore my portfolio of innovative solutions and creative implementations
                    </p>
                    <ArchiveNote source={contentSource} />

                    {/* Enhanced featured link: same destination, real copy/share/QR actions. */}
                    <div className="flex justify-center mb-8 w-full">
                        <NexStoreCard variant="banner" />
                    </div>

                    {/* Additional verified external project links (shared JSON + seeder). */}
                    <div className="flex justify-center mb-8 w-full">
                        <ProjectShowcase />
                    </div>

                    {/* Stats Cards — zero-valued totals are never shown. */}
                    {summaryCards.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                            {summaryCards.map(card => (
                                <div className="stat-card" key={card.label}>
                                    <div className="stat-number gradient-text">{card.display}</div>
                                    <div className="stat-label">{card.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search and Controls */}
                <div className="mb-8 projects-toolbar" data-reveal>
                    <div className="projects-controls flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                        {/* Search Bar */}
                        <div className="search-container w-full md:w-96">
                            <i className="fa-solid fa-search search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search projects, technologies, tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="search-clear"
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            )}
                        </div>

                        {/* View Mode and Sort */}
                        <div className="flex gap-4 items-center">
                            {/* View Mode Toggles */}
                            <div className="view-mode-container">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    title="Grid View"
                                >
                                    <i className="fa-solid fa-grip"></i>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    title="List View"
                                >
                                    <i className="fa-solid fa-list"></i>
                                </button>
                                <button
                                    onClick={() => setViewMode('masonry')}
                                    className={`view-mode-btn ${viewMode === 'masonry' ? 'active' : ''}`}
                                    title="Masonry View"
                                >
                                    <i className="fa-solid fa-th"></i>
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="featured">Featured First</option>
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="views">Most Viewed</option>
                                <option value="alphabetical">A-Z</option>
                            </select>

                            {/* Advanced Filters Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                            >
                                <i className="fa-solid fa-filter"></i>
                                <span className="hidden md:inline">Filters</span>
                                {(selectedTechs.length > 0 || filter !== 'all') && (
                                    <span className="filter-badge">{selectedTechs.length + (filter !== 'all' ? 1 : 0)}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <ProjectFilters
                            categories={categories}
                            technologies={allTechnologies}
                            tags={allTags}
                            selectedCategory={filter}
                            selectedTechs={selectedTechs}
                            onCategoryChange={setFilter}
                            onTechChange={setSelectedTechs}
                        />
                    )}

                    {/* Category Pills */}
                    {categories.length > 1 && (
                        <div className="flex flex-wrap gap-3 justify-center">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setFilter(category)}
                                    className={`category-pill ${filter === category ? 'active' : ''}`}
                                >
                                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    <span className="category-count">
                                        {category === 'all' 
                                            ? projects.length 
                                            : projects.filter(p => p.category === category).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Visible filter buttons for every technology actually used
                        by the projects. Horizontal scroller keeps long lists tidy. */}
                    {allTechnologies.length > 0 && (
                        <div className="tech-scroller" data-reveal>
                            <div className="tech-scroller__head">
                                <span className="tech-scroller__label">
                                    <i className="fa-solid fa-layer-group"></i> Filter by technology
                                </span>
                                <button
                                    type="button"
                                    className="tech-scroller__jump"
                                    onClick={() => projectsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                >
                                    <i className="fa-solid fa-arrow-down"></i> Jump to projects
                                </button>
                            </div>
                            <div className="tech-scroller__viewport">
                                <button
                                    type="button"
                                    className="tech-scroller__arrow"
                                    onClick={() => scrollTechStrip(-1)}
                                    disabled={!canScrollLeft}
                                    aria-label="Scroll technology filters left"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <div
                                    className="tech-scroller__strip"
                                    ref={techScrollerRef}
                                    onScroll={updateTechScrollState}
                                >
                                    {allTechnologies.map(tech => {
                                        const count = projects.filter(p => (p.technologies || []).includes(tech)).length;
                                        return (
                                            <button
                                                key={tech}
                                                type="button"
                                                className={`tech-chip ${selectedTechs.includes(tech) ? 'active' : ''}`}
                                                onClick={() => toggleTech(tech)}
                                                aria-pressed={selectedTechs.includes(tech)}
                                            >
                                                <span>{tech}</span>
                                                <span className="tech-chip__count">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    className="tech-scroller__arrow"
                                    onClick={() => scrollTechStrip(1)}
                                    disabled={!canScrollRight}
                                    aria-label="Scroll technology filters right"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(searchQuery || selectedTechs.length > 0 || filter !== 'all') && (
                    <div className="active-filters">
                        <span className="text-textColor/70 text-sm">Active Filters:</span>
                        <div className="flex flex-wrap gap-2">
                            {searchQuery && (
                                <span className="filter-tag">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')}>×</button>
                                </span>
                            )}
                            {filter !== 'all' && (
                                <span className="filter-tag">
                                    Category: {filter}
                                    <button onClick={() => setFilter('all')}>×</button>
                                </span>
                            )}
                            {selectedTechs.map(tech => (
                                <span key={tech} className="filter-tag">
                                    Tech: {tech}
                                    <button onClick={() => setSelectedTechs(prev => prev.filter(t => t !== tech))}>×</button>
                                </span>
                            ))}
                            {(searchQuery || selectedTechs.length > 0 || filter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedTechs([]);
                                        setFilter('all');
                                    }}
                                    className="clear-all-filters"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Owner-supplied project links: verified titles only, no zero
                values, invented stacks or metrics. Horizontal scroller. */}
            {PROJECT_LINKS.length > 0 && (
                <div className="project-links-section max-w-7xl mx-auto mb-16" data-reveal>
                    <div className="project-links-head">
                        <div>
                            <span className="project-links-eyebrow">
                                <i className="fa-solid fa-link"></i> Project directory
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold text-textColor">
                                More <span className="gradient-text">projects</span>
                            </h3>
                            <p className="text-textColor/70 text-sm">
                                Published work you can open and explore.
                            </p>
                        </div>
                        <div className="project-links-arrows">
                            <button
                                type="button"
                                className="project-links-arrow"
                                onClick={() => scrollProjectLinks(-1)}
                                disabled={!linksCanScrollLeft}
                                aria-label="Scroll project links left"
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <button
                                type="button"
                                className="project-links-arrow"
                                onClick={() => scrollProjectLinks(1)}
                                disabled={!linksCanScrollRight}
                                aria-label="Scroll project links right"
                            >
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div
                        className="project-links-strip"
                        ref={projectLinksRef}
                        onScroll={updateLinksScrollState}
                    >
                        {PROJECT_LINKS.map(link => (
                            <a
                                key={link.slug}
                                className="project-link-card"
                                {...projectLinkAnchorProps(link)}
                            >
                                <span className="project-link-card__title">{link.title}</span>
                                <span className="project-link-card__host">{projectLinkHost(link.url)}</span>
                                <span className="project-link-card__cta">
                                    Open project <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto" ref={projectsGridRef}>
                {/* Section Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-textColor">
                        All Projects
                        <span className="text-mainColor text-lg ml-2">({filteredAndSortedProjects.length})</span>
                    </h3>
                    <button
                        onClick={() => setProjectsCollapsed(!projectsCollapsed)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-mainColor/10 border border-mainColor/30 text-textColor hover:bg-mainColor/20 transition-all duration-300"
                    >
                        <i className={`fa-solid fa-chevron-${projectsCollapsed ? 'down' : 'up'} transition-transform duration-300`}></i>
                        <span className="text-sm">{projectsCollapsed ? 'Show Projects' : 'Hide Projects'}</span>
                    </button>
                </div>

                {!projectsCollapsed && (
                    <>
                {filteredAndSortedProjects.length === 0 ? (
                    <div className="no-results">
                        <i className="fa-solid fa-folder-open text-6xl text-mainColor/30 mb-4"></i>
                        <h3 className="text-2xl font-bold text-textColor mb-2">No Projects Found</h3>
                        <p className="text-textColor/60 mb-6">
                            {publicEmptyCopy('emptyProjects')}
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedTechs([]);
                                setFilter('all');
                            }}
                            className="reset-filters-btn"
                        >
                            <i className="fa-solid fa-refresh mr-2"></i>
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Results Count */}
                        <div className="results-count">
                            Showing <span className="text-mainColor font-semibold">{filteredAndSortedProjects.length}</span> {filteredAndSortedProjects.length === 1 ? 'project' : 'projects'}
                        </div>

                        <div className={`projects-grid view-mode-${viewMode}`}>
                            {filteredAndSortedProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    isFavorite={favorites.includes(project.id)}
                                    onToggleFavorite={() => toggleFavorite(project.id)}
                                    onViewDetails={(proj) => {
                                        setSelectedProject(proj);
                                        incrementViews(proj.id);
                                    }}
                                    onImageClick={(img) => setLightboxImage(img)}
                                    viewMode={viewMode}
                                    likes={(projectLikes[project.id] || 0) + (project.likes || 0)}
                                    onIncrementLikes={() => incrementLikes(project.id)}
                                    onShare={shareProject}
                                />
                            ))}
                        </div>
                    </>
                )}
                    </>
                )}
            </div>

            {/* Tech Stack Showcase */}
            {allTechnologies.length > 0 && (
                <div className="tech-showcase max-w-7xl mx-auto mt-20">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-textColor">
                            Technologies I <span className="gradient-text">Master</span>
                        </h3>
                        <button
                            onClick={() => setTechShowcaseCollapsed(!techShowcaseCollapsed)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-mainColor/10 border border-mainColor/30 text-textColor hover:bg-mainColor/20 transition-all duration-300"
                        >
                            <i className={`fa-solid fa-chevron-${techShowcaseCollapsed ? 'down' : 'up'} transition-transform duration-300`}></i>
                            <span className="text-sm">{techShowcaseCollapsed ? 'Show' : 'Hide'}</span>
                        </button>
                    </div>
                    {!techShowcaseCollapsed && (
                    <div className="tech-grid">
                        {allTechnologies.map((tech, index) => {
                            const projectCount = projects.filter(p => 
                                p.technologies?.includes(tech)
                            ).length;
                            return (
                                <div
                                    key={index}
                                    className="tech-item"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    onClick={() => {
                                        if (selectedTechs.includes(tech)) {
                                            setSelectedTechs(prev => prev.filter(t => t !== tech));
                                        } else {
                                            setSelectedTechs(prev => [...prev, tech]);
                                        }
                                    }}
                                >
                                    <div className={`tech-icon ${selectedTechs.includes(tech) ? 'selected' : ''}`}>
                                        {tech.charAt(0)}
                                    </div>
                                    <div className="tech-name">{tech}</div>
                                    <div className="tech-count">{projectCount} {projectCount === 1 ? 'project' : 'projects'}</div>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>
            )}

            {/* Call to Action */}
            <div className="cta-section max-w-4xl mx-auto mt-20" data-reveal>
                <div className="cta-card">
                    <div className="cta-content">
                        <h3 className="text-3xl md:text-4xl font-bold text-textColor mb-4">
                            Have a Project in Mind?
                        </h3>
                        <p className="text-textColor/70 text-lg mb-8">
                            Let's collaborate and bring your ideas to life with cutting-edge technology
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <a
                                href="#contact"
                                className="cta-btn cta-btn-primary"
                            >
                                <i className="fa-solid fa-paper-plane mr-2"></i>
                                Get In Touch
                            </a>
                            <a
                                href="https://github.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cta-btn cta-btn-secondary"
                            >
                                <i className="fa-brands fa-github mr-2"></i>
                                View All Projects
                            </a>
                        </div>
                    </div>
                    <div className="cta-decoration">
                        <div className="decoration-circle"></div>
                        <div className="decoration-circle"></div>
                        <div className="decoration-circle"></div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onImageClick={(img) => setLightboxImage(img)}
                    onProjectUpdate={(updatedProject) => {
                        setProjects(prev => prev.map(p => 
                            p.id === updatedProject.id ? updatedProject : p
                        ));
                        setSelectedProject(updatedProject);
                    }}
                />
            )}

            {lightboxImage && (
                <ImageLightbox
                    image={lightboxImage}
                    images={selectedProject?.images || []}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </section>
    );
};

export default Projects;