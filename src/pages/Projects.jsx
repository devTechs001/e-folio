import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiService from '../services/api.service';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import ProjectShare from './ProjectShare';
import ImageLightbox from './ImageLightbox';
import ProjectFilters from './ProjectFilters';
import '../styles/Projects.css';

const Projects = () => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const [techShowcaseCollapsed, setTechShowcaseCollapsed] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const cached = cacheService.get('public_projects');
            if (cached) {
                setProjects(cached);
                setLoading(false);
                return;
            }

            setLoading(true);
            const response = await apiService.request('/public/projects');
            
            if (response.success && response.projects && response.projects.length > 0) {
                cacheService.set('public_projects', response.projects, CACHE_TTL.TEN_MINUTES);
                setProjects(response.projects);
            } else {
                setProjects(getFallbackProjects());
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            setProjects(getFallbackProjects());
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

    const getFallbackProjects = () => [
        {
            id: 1,
            title: "E-Commerce Platform",
            description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
            fullDescription: "A comprehensive e-commerce platform built with modern web technologies. Features include real-time inventory tracking, secure payment processing through Stripe, user authentication with JWT, product recommendations using AI, advanced search with filters, shopping cart persistence, order tracking, and admin dashboard for managing products and orders.",
            imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
            thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
            images: [
                { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d", caption: "Main E-commerce View" },
                { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Product Detail Page" },
                { url: "https://images.unsplash.com/photo-1556740738-b6a82e8bfca5", caption: "Shopping Cart" },
                { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Checkout Process" }
            ],
            links: {
                github: "https://github.com/devTechs001/ecommerce-platform",
                live: "https://devtechs001.github.io/omnibiz/"
            },
            technologies: ["React", "Node.js", "MongoDB", "Stripe", "Express", "Redux", "JWT", "Socket.io"],
            category: "Web",
            tags: ["Full-Stack", "E-Commerce", "Real-time", "Payment Integration"],
            views: 1245,
            likes: 42,
            featured: true,
            status: "Live",
            completionDate: "2024-01-15",
            duration: "3 months",
            teamSize: 1,
            challenges: "Implementing real-time inventory updates, secure payment processing, and scalable architecture",
            achievements: ["99.9% uptime", "Sub-second load times", "1000+ daily active users"]
        },
        {
            id: 2,
            title: "Portfolio Website",
            description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
            fullDescription: "A stunning portfolio website showcasing projects and skills with beautiful animations, dark mode support, and optimal performance. Built with modern React practices and styled with Tailwind CSS for a sleek, professional appearance.",
            imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
            thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
            images: [
                { url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d", caption: "Portfolio Home" },
                { url: "https://images.unsplash.com/photo-1522252234503-e356532cafd5", caption: "Projects Section" },
                { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", caption: "About Page" }
            ],
            links: {
                github: "https://github.com/devTechs001/portfolio-website",
                live: "https://devtechs001.github.io/portfolio"
            },
            technologies: ["React", "Tailwind CSS", "Framer Motion", "TypeScript"],
            category: "Web",
            tags: ["Portfolio", "Animation", "Responsive", "TypeScript"],
            views: 892,
            likes: 28,
            featured: false,
            status: "Live",
            completionDate: "2023-12-20",
            duration: "1 month",
            teamSize: 1
        },
        {
            id: 3,
            title: "Task Management App",
            description: "React-based task management application with real-time updates and collaborative features.",
            fullDescription: "A powerful task management solution with real-time collaboration, drag-and-drop interface, team workspaces, and productivity analytics. Perfect for remote teams and project management.",
            imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71",
            thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71",
            images: [
                { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71", caption: "Task Dashboard" },
                { url: "https://images.unsplash.com/photo-1586880244406-5564e8cb497d", caption: "Kanban Board" },
                { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173", caption: "Analytics View" }
            ],
            links: {
                github: "https://github.com/devTechs001/task-manager",
                live: "https://devtechs001.github.io/task-manager"
            },
            technologies: ["React", "Firebase", "Redux", "Material-UI", "Chart.js"],
            category: "Mobile",
            tags: ["Productivity", "Real-time", "Collaboration", "PWA"],
            views: 532,
            likes: 17,
            featured: false,
            status: "Live",
            completionDate: "2023-11-10",
            duration: "2 months",
            teamSize: 2
        },
        {
            id: 4,
            title: "AI Image Generator",
            description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
            fullDescription: "Cutting-edge AI image generation platform utilizing stable diffusion technology. Features include text-to-image generation, image editing with AI, style transfer, upscaling, and custom model training capabilities.",
            imageUrl: "https://picsum.photos/800/600?random=4",
            thumbnail: "https://picsum.photos/400/300?random=4",
            images: [
                { url: "https://picsum.photos/800/600?random=4", caption: "AI Generated Art" },
                { url: "https://picsum.photos/800/600?random=41", caption: "Style Transfer Interface" },
                { url: "https://picsum.photos/800/600?random=42", caption: "Gallery View" }
            ],
            links: {
                github: "https://github.com/devTechs001/ai-image-generator",
                live: "https://devtechs001.github.io/ai-image-generator"
            },
            technologies: ["React", "TensorFlow.js", "Python", "FastAPI", "WebGL", "Docker"],
            category: "AI/ML",
            tags: ["AI", "Machine Learning", "Image Processing", "Deep Learning"],
            views: 742,
            likes: 31,
            featured: true,
            status: "Beta",
            completionDate: "2024-02-01",
            duration: "4 months",
            teamSize: 3,
            achievements: ["Featured on Product Hunt", "10k+ images generated", "AI Weekly mention"]
        },
        {
            id: 5,
            title: "Social Media Dashboard",
            description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
            fullDescription: "All-in-one social media analytics dashboard providing insights from multiple platforms. Features real-time metrics, engagement tracking, sentiment analysis, competitor analysis, and automated reporting.",
            imageUrl: "https://picsum.photos/800/600?random=5",
            thumbnail: "https://picsum.photos/400/300?random=5",
            images: [
                { url: "https://picsum.photos/800/600?random=5", caption: "Analytics Dashboard" },
                { url: "https://picsum.photos/800/600?random=51", caption: "Engagement Metrics" },
                { url: "https://picsum.photos/800/600?random=52", caption: "Report Generation" }
            ],
            links: {
                github: "https://github.com/devTechs001/analytics-dashboard",
                live: "https://devtechs001.github.io/analytics-dashboard"
            },
            technologies: ["React", "D3.js", "Chart.js", "Python", "Flask", "PostgreSQL", "Redis"],
            category: "Web",
            tags: ["Analytics", "Data Visualization", "Dashboard", "API Integration"],
            views: 1103,
            likes: 38,
            featured: true,
            status: "Live",
            completionDate: "2023-10-25",
            duration: "3 months",
            teamSize: 2,
            achievements: ["500+ active users", "99% customer satisfaction", "Featured on HackerNews"]
        },
        {
            id: 6,
            title: "Blockchain Wallet",
            description: "Secure cryptocurrency wallet with multi-chain support and DeFi integration.",
            fullDescription: "Next-generation cryptocurrency wallet supporting multiple blockchains. Features include secure key management, token swaps, NFT gallery, staking, DeFi protocol integration, and portfolio tracking.",
            imageUrl: "https://picsum.photos/800/600?random=6",
            thumbnail: "https://picsum.photos/400/300?random=6",
            images: [
                { url: "https://picsum.photos/800/600?random=6", caption: "Wallet Dashboard" },
                { url: "https://picsum.photos/800/600?random=61", caption: "Token Swap Interface" },
                { url: "https://picsum.photos/800/600?random=62", caption: "NFT Gallery" }
            ],
            links: {
                github: "https://github.com/devTechs001/blockchain-wallet",
                live: "https://wallet.devtechs001.com"
            },
            technologies: ["React", "Web3.js", "Ethers.js", "Solidity", "IPFS", "TypeScript"],
            category: "Blockchain",
            tags: ["Web3", "Cryptocurrency", "DeFi", "NFT", "Security"],
            views: 2341,
            likes: 87,
            featured: true,
            status: "Live",
            completionDate: "2024-03-05",
            duration: "5 months",
            teamSize: 4,
            achievements: ["$1M+ in transactions", "Security audit passed", "20k+ wallet downloads"]
        },
        {
            id: 7,
            title: "GB Chat",
            description: "Real-time chat application with group messaging, file sharing, and advanced communication features.",
            fullDescription: "A comprehensive real-time chat application built with modern web technologies. Features include group messaging, private chats, file sharing, emoji reactions, typing indicators, online status tracking, message search, and responsive design for all devices.",
            imageUrl: "https://images.unsplash.com/photo-1611601179222-ecb0bbcd7bc3",
            thumbnail: "https://images.unsplash.com/photo-1611601179222-ecb0bbcd7bc3",
            images: [
                { url: "https://images.unsplash.com/photo-1611601179222-ecb0bbcd7bc3", caption: "Chat Interface" },
                { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2", caption: "Group Chat" },
                { url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0", caption: "Mobile View" },
                { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71", caption: "File Sharing" }
            ],
            links: {
                github: "https://github.com/devTechs001/GB-chat",
                live: "https://devtechs001.github.io/GB-chat/"
            },
            technologies: ["React", "Socket.io", "Node.js", "Express", "MongoDB", "JWT", "Tailwind CSS", "WebRTC"],
            category: "Web",
            tags: ["Real-time", "Chat", "Messaging", "Socket.io", "Communication"],
            views: 856,
            likes: 34,
            featured: true,
            status: "Live",
            completionDate: "2024-02-15",
            duration: "2 months",
            teamSize: 2,
            challenges: "Implementing real-time messaging, file uploads, and scalable socket connections",
            achievements: ["1000+ active users", "99.9% uptime", "Sub-second message delivery"]
        },
        {
            id: 8,
            title: "Moview Watch",
            description: "Movie streaming platform with personalized recommendations, watchlists, and social features.",
            fullDescription: "A comprehensive movie streaming platform that provides users with a vast library of films and TV shows. Features include personalized recommendations based on viewing history, watchlist management, user ratings and reviews, social sharing, genre filtering, search functionality, and responsive design for optimal viewing on any device.",
            imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
            thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
            images: [
                { url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1", caption: "Movie Library" },
                { url: "https://images.unsplash.com/photo-1489599745951-884f3749b052", caption: "Movie Details" },
                { url: "https://images.unsplash.com/photo-1518676590629-3d8889cced0c", caption: "Watch Interface" },
                { url: "https://images.unsplash.com/photo-1535016120720-40c6a9e0a2f5", caption: "User Dashboard" }
            ],
            links: {
                github: "https://github.com/devTechs001/moview-watch",
                live: "https://devtechs001.github.io/moview-watch/"
            },
            technologies: ["React", "Redux", "TMDB API", "Node.js", "Express", "MongoDB", "JWT", "CSS3", "Video.js"],
            category: "Web",
            tags: ["Streaming", "Movies", "Entertainment", "API Integration", "Media"],
            views: 1243,
            likes: 56,
            featured: true,
            status: "Live",
            completionDate: "2024-03-01",
            duration: "3 months",
            teamSize: 3,
            challenges: "Integrating TMDB API, implementing video streaming, and building recommendation engine",
            achievements: ["5000+ registered users", "50,000+ movies streamed", "4.8/5 user rating"]
        }
    ];

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
            {/* Enhanced Header with Stats */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor mb-4">
                        Latest <span className="text-mainColor gradient-text">Projects</span>
                    </h2>
                    <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
                        Explore my portfolio of innovative solutions and creative implementations
                    </p>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                        <div className="stat-card">
                            <div className="stat-number gradient-text">{projectStats.total}</div>
                            <div className="stat-label">Total Projects</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number gradient-text">{projectStats.featured}</div>
                            <div className="stat-label">Featured</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number gradient-text">{(projectStats.totalViews / 1000).toFixed(1)}k</div>
                            <div className="stat-label">Total Views</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number gradient-text">{projectStats.totalLikes}</div>
                            <div className="stat-label">Total Likes</div>
                        </div>
                    </div>
                </div>

                {/* Search and Controls */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
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

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto">
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
                            Try adjusting your filters or search query
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
            <div className="cta-section max-w-4xl mx-auto mt-20">
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