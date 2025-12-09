// src/components/Dashboard/ProjectManagerEnhanced.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Edit3, Trash2, Eye, ExternalLink, Github,
    Calendar, Tag, Users, Star, Image as ImageIcon, Upload, X,
    Download, Copy, MoreVertical, CheckSquare, Square, Archive,
    TrendingUp, Clock, Zap, AlertCircle, Check, Loader, Grid,
    List, SortAsc, RefreshCw, FileText, BarChart3, Settings,
    ChevronDown, ChevronUp, Maximize2, Link as LinkIcon, Video,
    Lightbulb, Clipboard, Code, CheckCircle, Rocket, Activity,
    Target, ArrowRight, Play, Pause, SkipForward, GitBranch,
    Database, Server, Shield, Bell, MessageSquare, Globe,
    PieChart, LineChart, Timer, Award, Flag, MapPin, Heart,
    Share2, Bookmark, ThumbsUp, Eye as ViewIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import ProjectModal from '../../pages/ProjectModal';
import ProjectShare from '../../pages/ProjectShare';
import ProjectSkeleton from '../../pages/ProjectSkeleton';

// Comprehensive Project Stages Definition
const projectStages = [
    {
        id: 'idea',
        name: 'Idea & Concept',
        description: 'Initial concept and brainstorming phase',
        color: '#6366f1',
        icon: Lightbulb,
        duration: '1-2 weeks',
        deliverables: ['Concept document', 'Market research', 'Initial sketches'],
        nextStage: 'planning',
        automation: {
            notifications: true,
            reminders: true,
            autoAdvance: false
        }
    },
    {
        id: 'planning',
        name: 'Planning & Design',
        description: 'Detailed planning and design phase',
        color: '#3b82f6',
        icon: Clipboard,
        duration: '2-4 weeks',
        deliverables: ['Project plan', 'Wireframes', 'Technical specs', 'User stories'],
        nextStage: 'development',
        automation: {
            notifications: true,
            reminders: true,
            autoAdvance: false
        }
    },
    {
        id: 'development',
        name: 'Development',
        description: 'Core development and implementation',
        color: '#10b981',
        icon: Code,
        duration: '4-12 weeks',
        deliverables: ['MVP', 'Core features', 'Database setup', 'API development'],
        nextStage: 'testing',
        automation: {
            notifications: true,
            ciCd: true,
            testing: true,
            autoAdvance: false
        }
    },
    {
        id: 'testing',
        name: 'Testing & QA',
        description: 'Quality assurance and bug fixing',
        color: '#f59e0b',
        icon: CheckCircle,
        duration: '2-3 weeks',
        deliverables: ['Test reports', 'Bug fixes', 'Performance optimization', 'Security audit'],
        nextStage: 'deployment',
        automation: {
            notifications: true,
            automatedTests: true,
            performanceMonitoring: true,
            autoAdvance: false
        }
    },
    {
        id: 'deployment',
        name: 'Deployment',
        description: 'Production deployment and launch',
        color: '#ef4444',
        icon: Rocket,
        duration: '1 week',
        deliverables: ['Live deployment', 'Documentation', 'Monitoring setup', 'Launch checklist'],
        nextStage: 'maintenance',
        automation: {
            notifications: true,
            autoDeploy: true,
            healthChecks: true,
            rollback: true,
            autoAdvance: true
        }
    },
    {
        id: 'maintenance',
        name: 'Maintenance & Updates',
        description: 'Ongoing maintenance and improvements',
        color: '#8b5cf6',
        icon: Settings,
        duration: 'Ongoing',
        deliverables: ['Regular updates', 'Support', 'Feature enhancements', 'Performance monitoring'],
        nextStage: null,
        automation: {
            notifications: true,
            monitoring: true,
            backups: true,
            updates: true,
            autoAdvance: false
        }
    }
];

// Stage Link Types for Direct Access
const stageLinkTypes = {
    idea: [],
    planning: ['documentation'],
    development: ['github', 'documentation', 'staging'],
    testing: ['staging', 'analytics'],
    deployment: ['live', 'staging', 'github', 'documentation', 'monitoring'],
    maintenance: ['live', 'analytics', 'monitoring', 'documentation']
};

// Enhanced Modal Component
const ProjectFormModal = ({ show, onClose, project, setProject, onSave, title, uploading, onImageUpload, imageUrl, setImageUrl }) => {
    if (!show) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave();
    };
    
    const handleChange = (field, value) => {
        setProject(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLinkChange = (linkType, value) => {
        setProject(prev => ({
            ...prev,
            links: { ...prev.links, [linkType]: value }
        }));
    };
    
    const handleImageAdd = () => {
        setProject(prev => ({
            ...prev,
            images: [...(prev.images || []), { url: '', caption: '' }]
        }));
    };
    
    const handleImageRemove = (index) => {
        setProject(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index) || []
        }));
    };
    
    const handleImageChange = (index, field, value) => {
        setProject(prev => ({
            ...prev,
            images: prev.images?.map((img, i) => 
                i === index ? { ...img, [field]: value } : img
            ) || []
        }));
    };
    
    const technologyOptions = [
        // Frontend Frameworks
        'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Solid.js', 'Qwik',
        'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose', 'Ionic', 'Expo',
        
        // Backend Technologies
        'Node.js', 'Express', 'NestJS', 'Fastify', 'Koa', 'Django', 'Flask', 'FastAPI',
        'Spring Boot', 'Spring MVC', 'Laravel', 'Symfony', 'Rails', 'Phoenix', 'ASP.NET',
        
        // Databases
        'MongoDB', 'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'Redis', 'Elasticsearch',
        'Cassandra', 'DynamoDB', 'CouchDB', 'Neo4j', 'Supabase', 'Firebase', 'PlanetScale',
        
        // Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', '.NET', 'PHP', 'Ruby',
        'Go', 'Rust', 'Swift', 'Kotlin', 'C++', 'Dart', 'Scala', 'Elixir',
        
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions',
        'GitLab CI', 'CircleCI', 'Travis CI', 'Bamboo', 'Puppet', 'Chef',
        
        // CSS & UI Frameworks
        'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Chakra UI', 'Ant Design', 'Mantine',
        'Semantic UI', 'Bulma', 'Foundation', 'Styled Components', 'Emotion', 'CSS Modules',
        'Sass', 'Less', 'PostCSS', 'PurgeCSS', 'CSS-in-JS',
        
        // State Management & Data Flow
        'Redux', 'Redux Toolkit', 'MobX', 'Zustand', 'Recoil', 'Vuex', 'Pinia', 'Apollo',
        'GraphQL', 'REST API', 'gRPC', 'WebSocket', 'Socket.io', 'SignalR', 'WebRTC',
        
        // Testing & Quality
        'Jest', 'Vitest', 'Mocha', 'Chai', 'Cypress', 'Playwright', 'Selenium', 'Testing Library',
        'Storybook', 'ESLint', 'Prettier', 'Husky', 'Lint-staged', 'SonarQube',
        
        // AI & Machine Learning
        'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter',
        'MLflow', 'Kubeflow', 'OpenAI', 'Hugging Face', 'LangChain', 'OpenCV',
        
        // Tools & Misc
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'npm', 'Yarn', 'pnpm', 'Webpack',
        'Vite', 'Parcel', 'Rollup', 'Babel', 'ESBuild', 'SWC', 'Postman', 'Insomnia',
        
        // Security & Authentication
        'JWT', 'OAuth 2.0', 'OpenID Connect', 'Passport.js', 'Auth0', 'Firebase Auth',
        'bcrypt', 'SSL/TLS', 'HTTPS', 'CORS', 'CSRF', 'XSS', 'SQL Injection',
        
        // Performance & Monitoring
        'Lighthouse', 'Web Vitals', 'New Relic', 'Datadog', 'Sentry', 'LogRocket',
        'Google Analytics', 'Hotjar', 'Mixpanel', 'Segment', 'Amplitude',
        
        // Blockchain & Web3
        'Ethereum', 'Solidity', 'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle',
        'MetaMask', 'IPFS', 'Smart Contracts', 'DeFi', 'NFT', 'DAO',
        
        // Mobile & IoT
        'React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin', 'Ionic',
        'Arduino', 'Raspberry Pi', 'ESP32', 'MQTT', 'CoAP', 'LoRaWAN'
    ];
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={project.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Enter project title"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Client/Company
                            </label>
                            <input
                                type="text"
                                value={project.client || ''}
                                onChange={(e) => handleChange('client', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Client name or company"
                            />
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={project.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Enter project description"
                            rows={4}
                            required
                        />
                    </div>
                    
                    {/* Category, Status, Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category
                            </label>
                            <select
                                value={project.category || 'Web'}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="Web">Web Application</option>
                                <option value="Mobile">Mobile App</option>
                                <option value="Desktop">Desktop App</option>
                                <option value="AI/ML">AI/Machine Learning</option>
                                <option value="Blockchain">Blockchain</option>
                                <option value="DevOps">DevOps/Infrastructure</option>
                                <option value="Data">Data Science</option>
                                <option value="Game">Game Development</option>
                                <option value="IoT">IoT</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={project.status || 'planning'}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="idea">Idea</option>
                                <option value="planning">Planning</option>
                                <option value="in-progress">In Progress</option>
                                <option value="testing">Testing</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Priority
                            </label>
                            <select
                                value={project.priority || 'medium'}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={project.startDate || ''}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={project.endDate || ''}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Budget ($)
                            </label>
                            <input
                                type="number"
                                value={project.budget || ''}
                                onChange={(e) => handleChange('budget', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                    
                    {/* Technologies Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Technologies
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-700 rounded-lg">
                            {technologyOptions.map(tech => (
                                <label key={tech} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={(project.technologies || []).includes(tech)}
                                        onChange={(e) => {
                                            const techs = project.technologies || [];
                                            if (e.target.checked) {
                                                handleChange('technologies', [...techs, tech]);
                                            } else {
                                                handleChange('technologies', techs.filter(t => t !== tech));
                                            }
                                        }}
                                        className="rounded text-cyan-500 focus:ring-cyan-500"
                                    />
                                    <span className="text-slate-300">{tech}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            value={(project.tags || []).join(', ')}
                            onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="frontend, backend, fullstack"
                        />
                    </div>
                    
                    {/* Links */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Links
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="url"
                                value={project.links?.github || ''}
                                onChange={(e) => handleLinkChange('github', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="GitHub URL"
                            />
                            <input
                                type="url"
                                value={project.links?.live || ''}
                                onChange={(e) => handleLinkChange('live', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Live Demo URL"
                            />
                            <input
                                type="url"
                                value={project.links?.documentation || ''}
                                onChange={(e) => handleLinkChange('documentation', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Documentation URL"
                            />
                            <input
                                type="url"
                                value={project.links?.api || ''}
                                onChange={(e) => handleLinkChange('api', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="API Documentation URL"
                            />
                        </div>
                    </div>
                    
                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Images
                        </label>
                        <div className="space-y-3">
                            {(project.images || []).map((image, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={image.url || ''}
                                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Image URL"
                                    />
                                    <input
                                        type="text"
                                        value={image.caption || ''}
                                        onChange={(e) => handleImageChange(index, 'caption', e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Image caption"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleImageRemove(index)}
                                        className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleImageAdd}
                                className="w-full px-4 py-2 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add Image
                            </button>
                        </div>
                    </div>
                    
                    {/* Featured Checkbox */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={project.featured || false}
                            onChange={(e) => handleChange('featured', e.target.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-500"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-slate-300">
                            Featured Project
                        </label>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                            {uploading ? 'Saving...' : 'Save Project'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ProjectManagerEnhanced = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { success, error, warning } = useNotifications();
    const fileInputRef = useRef(null);

    // Enhanced State Management
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [showLinksModal, setShowLinksModal] = useState(false);
    const [showAutomationModal, setShowAutomationModal] = useState(false);
    
    // Filter/Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTags, setFilterTags] = useState([]);
    const [filterStage, setFilterStage] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('grid');
    
    // Project States
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // New Modal States
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [favorites, setFavorites] = useState([]);
    
    // Enhanced Project Structure
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        technologies: [],
        currentStage: 'idea',
        category: 'Web',
        links: { 
            github: '', 
            live: '', 
            demo: '', 
            documentation: '',
            staging: '',
            analytics: '',
            monitoring: ''
        },
        images: [],
        featured: false,
        tags: [],
        collaborators: [],
        startDate: '',
        endDate: '',
        priority: 'medium',
        visibility: 'public',
        stageHistory: [],
        milestones: [],
        team: [],
        resources: {
            budget: 0,
            timeline: '',
            tools: [],
            documentation: ''
        },
        deliverables: {
            current: [],
            completed: [],
            pending: []
        },
        automation: {
            autoDeploy: false,
            ciCd: false,
            testing: false,
            monitoring: false,
            notifications: true
        },
        analytics: {
            views: 0,
            engagement: 0,
            performance: 0,
            uptime: 0,
            errors: 0
        }
    });

    // Load Data
    useEffect(() => {
        loadProjects();
        loadAnalytics();
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    // Save favorites to localStorage when they change
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            // Use the same endpoint as the Projects page to get all existing projects
            const response = await ApiService.request('/public/projects');
            
            if (response.success && response.projects && response.projects.length > 0) {
                // Process all projects for images
                const processedProjects = response.projects.map(project => ({
                    ...project,
                    // Ensure image URL is properly set
                    imageUrl: project.imageUrl || project.image || 
                             (project.images && project.images[0] ? 
                              (typeof project.images[0] === 'string' ? project.images[0] : project.images[0].url) : 
                              `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`),
                    // Ensure images array is properly formatted
                    images: project.images || [{ 
                        url: project.imageUrl || project.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`, 
                        caption: project.title 
                    }],
                    // Set fallbacks for missing fields
                    status: project.status || 'completed',
                    category: project.category || 'Web',
                    technologies: project.technologies || ['React', 'Node.js'],
                    tags: project.tags || ['Featured', 'Latest']
                }));
                setProjects(processedProjects);
            } else {
                // Use fallback projects if no projects from API
                setProjects(getFallbackProjects());
            }
        } catch (err) {
            error('Failed to load projects, using fallback data with real images');
            console.error(err);
            setProjects(getFallbackProjects());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackProjects = () => [
        {
            id: 1,
            title: "E-Commerce Platform",
            description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
            imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop", caption: "Main E-commerce View" },
                { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop", caption: "Shopping Cart" },
                { url: "https://images.unsplash.com/photo-1556740738-b6a82e8bfca5?w=800&h=600&fit=crop", caption: "Admin Dashboard" }
            ],
            links: {
                github: "https://github.com/yourusername/ecommerce",
                live: "https://demo-ecommerce.com"
            },
            technologies: ["React", "Node.js", "MongoDB", "Stripe", "Java", "Spring Boot"],
            category: "Web",
            status: "completed",
            featured: true,
            tags: ["e-commerce", "fullstack", "payment"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 1245,
            likes: 42
        },
        {
            id: 2,
            title: "Portfolio Website",
            description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
            imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop", caption: "Portfolio Home" },
                { url: "https://images.unsplash.com/photo-1522252234503-e356532cafd5?w=800&h=600&fit=crop", caption: "Responsive Design" },
                { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", caption: "Project Gallery" }
            ],
            links: {
                github: "https://github.com/yourusername/portfolio",
                live: "https://yourportfolio.com"
            },
            technologies: ["React", "Tailwind CSS", "Framer Motion", "Next.js"],
            category: "Web",
            status: "completed",
            featured: false,
            tags: ["portfolio", "react", "animation"],
            createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
            updatedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
            views: 892,
            likes: 28
        },
        {
            id: 3,
            title: "Task Management App",
            description: "Collaborative task management application with real-time updates and team collaboration features.",
            imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop", caption: "Task Dashboard" },
                { url: "https://images.unsplash.com/photo-1586880244406-5564e8cb497d?w=800&h=600&fit=crop", caption: "Planning View" },
                { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop", caption: "Team View" }
            ],
            links: {
                github: "https://github.com/yourusername/taskmanager",
                live: "https://taskmanager-demo.com"
            },
            technologies: ["Vue.js", "Firebase", "Vuex", "Material Design"],
            category: "Mobile",
            status: "in-progress",
            featured: false,
            tags: ["task management", "collaboration", "real-time"],
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updatedAt: new Date().toISOString(),
            views: 532,
            likes: 17
        },
        {
            id: 4,
            title: "AI Dashboard",
            description: "Advanced analytics dashboard with real-time data visualization and machine learning insights.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop", caption: "AI Dashboard" },
                { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop", caption: "Data Analysis" },
                { url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop", caption: "ML Visualization" }
            ],
            links: {
                github: "https://github.com/yourusername/ai-dashboard",
                live: "https://ai-dashboard-demo.com"
            },
            technologies: ["React", "TensorFlow.js", "D3.js", "Python", "FastAPI"],
            category: "AI/ML",
            status: "in-progress",
            featured: false,
            tags: ["ai", "machine-learning", "analytics"],
            createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            updatedAt: new Date().toISOString(),
            views: 445,
            likes: 23
        },
        {
            id: 5,
            title: "Social Media App",
            description: "Mobile-first social media platform with real-time messaging, stories, and content sharing.",
            imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop", caption: "Social Feed" },
                { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop", caption: "Messaging Interface" },
                { url: "https://images.unsplash.com/photo-1512295765893-2a2e82d3284d?w=800&h=600&fit=crop", caption: "Profile View" }
            ],
            links: {
                github: "https://github.com/yourusername/socialapp",
                live: "https://socialapp-demo.com"
            },
            technologies: ["React Native", "Firebase", "Redux", "WebRTC"],
            category: "Mobile",
            status: "in-progress",
            featured: false,
            tags: ["social", "mobile", "messaging"],
            createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
            updatedAt: new Date().toISOString(),
            views: 678,
            likes: 34
        }
    ];

    const loadAnalytics = async () => {
        try {
            // Get overall analytics for all projects
            const response = await ApiService.request('/projects/analytics?timeframe=30d');
            setAnalytics(response.analytics || {
                views: 0,
                engagement: 0,
                performance: 0,
                uptime: 0,
                errors: 0
            });
        } catch (err) {
            console.error('Analytics error:', err);
            // Set default analytics on error
            setAnalytics({
                views: 0,
                engagement: 0,
                performance: 0,
                uptime: 0,
                errors: 0
            });
        }
    };

    // Project CRUD Operations
    const handleAddProject = async () => {
        if (!newProject.title || !newProject.description) {
            error('Title and description are required');
            return;
        }

        try {
            const response = await ApiService.createProject(newProject);
            setProjects([response.project, ...projects]);
            resetForm();
            setShowAddModal(false);
            success('Project created successfully!');
            loadAnalytics();
            // Trigger cache refresh for public projects page
            try {
                await ApiService.request('/public/projects/refresh', { method: 'POST' });
            } catch (err) {
                console.log('Cache refresh failed, but project was created');
            }
        } catch (err) {
            error(err.response?.data?.message || 'Failed to create project');
        }
    };

    const handleUpdateProject = async () => {
        if (!selectedProject?.id) return;

        try {
            const response = await ApiService.updateProject(selectedProject.id, selectedProject);
            setProjects(projects.map(p => p.id === selectedProject.id ? response.project : p));
            setShowEditModal(false);
            setSelectedProject(null);
            success('Project updated successfully!');
        } catch (err) {
            error('Failed to update project');
        }
    };

    const handleDeleteProject = async (id) => {
        try {
            await ApiService.deleteProject(id);
            setProjects(projects.filter(p => p.id !== id));
            setShowDeleteConfirm(false);
            setProjectToDelete(null);
            success('Project deleted successfully!');
            loadAnalytics();
        } catch (err) {
            error('Failed to delete project');
        }
    };

    // Enhanced Project Handlers
    const handleViewProject = (project) => {
        setSelectedProject(project);
        setShowProjectModal(true);
    };

    const handleToggleFavorite = (projectId) => {
        setFavorites(prev => 
            prev.includes(projectId) 
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleImageClick = (imageUrl) => {
        setLightboxImage(imageUrl);
    };

    const incrementViews = async (projectId) => {
        try {
            await ApiService.request(`/public/projects/${projectId}/view`, {
                method: 'POST'
            });
            setProjects(prev => prev.map(p => 
                p.id === projectId ? { ...p, views: (p.views || 0) + 1 } : p
            ));
        } catch (err) {
            console.error('Error incrementing views:', err);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await ApiService.bulkDeleteProjects(selectedProjects);
            setProjects(projects.filter(p => !selectedProjects.includes(p.id)));
            setSelectedProjects([]);
            setShowBulkActions(false);
            success(`Deleted ${selectedProjects.length} projects`);
            loadAnalytics();
        } catch (err) {
            error('Failed to delete projects');
        }
    };

    const handleToggleFeatured = async (id) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        
        const isFallbackProject = typeof id === 'number';
        
        try {
            if (!isFallbackProject) {
                await ApiService.updateProject(id, { featured: !project.featured });
            }
            setProjects(projects.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
            success(project.featured ? 'Removed from featured' : 'Added to featured');
        } catch (err) {
            error('Failed to update project');
        }
    };

    const handleDuplicateProject = async (project) => {
        try {
            const duplicated = {
                ...project,
                title: `${project.title} (Copy)`,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined
            };
            const response = await ApiService.createProject(duplicated);
            setProjects([response.project, ...projects]);
            success('Project duplicated successfully!');
            loadAnalytics();
        } catch (err) {
            error('Failed to duplicate project');
        }
    };

    const handleToggleVisibility = async (id) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        
        // Check if this is a fallback project (has numeric ID)
        const isFallbackProject = typeof id === 'number';
        
        try {
            if (!isFallbackProject) {
                // Only call API for real projects
                await ApiService.updateProject(id, { hidden: !project.hidden });
            }
            // Always update local state
            setProjects(projects.map(p => p.id === id ? { ...p, hidden: !p.hidden } : p));
            success(project.hidden ? 'Project is now visible' : 'Project is now hidden');
        } catch (err) {
            error('Failed to update project visibility');
        }
    };

    const handleToggleArchived = async (id) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        
        const isFallbackProject = typeof id === 'number';
        
        try {
            if (!isFallbackProject) {
                await ApiService.updateProject(id, { archived: !project.archived });
            }
            setProjects(projects.map(p => p.id === id ? { ...p, archived: !p.archived } : p));
            success(project.archived ? 'Project restored from archive' : 'Project archived');
        } catch (err) {
            error('Failed to archive project');
        }
    };

    const handleTogglePinned = async (id) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        
        const isFallbackProject = typeof id === 'number';
        
        try {
            if (!isFallbackProject) {
                await ApiService.updateProject(id, { pinned: !project.pinned });
            }
            setProjects(projects.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
            success(project.pinned ? 'Project unpinned' : 'Project pinned');
        } catch (err) {
            error('Failed to pin project');
        }
    };

    // File Upload
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(file => ApiService.uploadImage(file));
            const uploadedImages = await Promise.all(uploadPromises);
            
            setNewProject({
                ...newProject,
                images: [...(newProject.images || []), ...uploadedImages.map(img => ({ url: img.url, caption: '' }))]
            });
            success(`Uploaded ${files.length} image(s)`);
        } catch (err) {
            error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    // Export/Import
    const handleExportProjects = () => {
        const dataStr = JSON.stringify(filteredProjects, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `projects-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        success('Projects exported');
    };

    const handleImportProjects = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedProjects = JSON.parse(text);
            
            const createPromises = importedProjects.map(p => {
                const { id, createdAt, updatedAt, ...projectData } = p;
                return ApiService.createProject(projectData);
            });
            
            await Promise.all(createPromises);
            await loadProjects();
            success(`Imported ${importedProjects.length} projects`);
        } catch (err) {
            error('Failed to import projects');
        }
    };

    // Helpers
    const resetForm = () => {
        setNewProject({
            title: '', description: '', technologies: [], status: 'in-progress',
            category: 'Web', links: { github: '', live: '', demo: '', documentation: '' },
            images: [], featured: false, tags: [], collaborators: [],
            startDate: '', endDate: '', priority: 'medium', visibility: 'public'
        });
        setImageUrl('');
    };

    const toggleProjectSelection = (id) => {
        setSelectedProjects(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const selectAllProjects = () => {
        if (selectedProjects.length === filteredProjects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredProjects.map(p => p.id));
        }
    };

    // Filter and Sort
    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.technologies?.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            const matchesTags = filterTags.length === 0 || filterTags.some(tag => p.tags?.includes(tag));
            return matchesSearch && matchesStatus && matchesCategory && matchesTags;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title': return a.title.localeCompare(b.title);
                case 'featured': return b.featured - a.featured;
                case 'updated': return new Date(b.updatedAt) - new Date(a.updatedAt);
                default: return 0;
            }
        });

    const allTags = [...new Set(projects.flatMap(p => p.tags || []))];
    const statusColors = {
        'in-progress': 'bg-amber-500/20 text-amber-500',
        'completed': 'bg-green-500/20 text-green-500',
        'archived': 'bg-gray-500/20 text-gray-500',
        'planning': 'bg-blue-500/20 text-blue-500'
    };

    const priorityColors = {
        'low': 'bg-gray-500/20 text-gray-500',
        'medium': 'bg-yellow-500/20 text-yellow-500',
        'high': 'bg-red-500/20 text-red-500'
    };

    return (
        <DashboardLayout
            title="Project Manager"
            subtitle={`Manage and showcase ${projects.length} portfolio projects`}
            actions={
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportProjects}
                        accept=".json"
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => window.open('/projects', '_blank')}
                        className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2 
                                 hover:bg-blue-500/20"
                        title="View projects page"
                    >
                        <ExternalLink size={16} />
                        View Projects Page
                    </button>
                    
                    <button
                        onClick={() => {
                            loadProjects();
                            success('Projects synchronized successfully!');
                        }}
                        className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2 
                                 hover:bg-green-500/20"
                        title="Sync projects with public page"
                    >
                        <RefreshCw size={16} />
                        Sync Projects
                    </button>
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Upload size={16} /> Import
                    </button>

                    <button
                        onClick={handleExportProjects}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>

                    <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <BarChart3 size={16} /> Analytics
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                                 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg 
                                 shadow-blue-500/25 flex items-center gap-2"
                    >
                        <Plus size={18} /> New Project
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { 
                            label: 'Total Projects', 
                            value: projects.length, 
                            icon: FileText, 
                            color: 'blue', 
                            change: analytics?.totalGrowth || '+0%'
                        },
                        { 
                            label: 'In Progress', 
                            value: projects.filter(p => p.status === 'in-progress').length, 
                            icon: Clock, 
                            color: 'amber', 
                            change: analytics?.inProgressGrowth || '+0%'
                        },
                        { 
                            label: 'Completed', 
                            value: projects.filter(p => p.status === 'completed').length, 
                            icon: Check, 
                            color: 'green', 
                            change: analytics?.completedGrowth || '+0%'
                        },
                        { 
                            label: 'Featured', 
                            value: projects.filter(p => p.featured).length, 
                            icon: Star, 
                            color: 'purple', 
                            change: analytics?.featuredGrowth || '+0%'
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 
                                     border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium mb-1">{stat.label}</p>
                                    <h3 className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 
                                                   bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp size={14} className="text-green-500" />
                                        <span className="text-xs text-green-500 font-semibold">{stat.change}</span>
                                        <span className="text-xs text-gray-500">vs last month</span>
                                    </div>
                                </div>
                                <div className={`p-3 bg-${stat.color}-500/10 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`text-${stat.color}-500`} size={24} />
                                </div>
                            </div>
                            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600`} />
                        </motion.div>
                    ))}
                </div>

                {/* Filters & Actions */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {selectedProjects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckSquare className="text-blue-500" size={20} />
                                    <span className="font-semibold">{selectedProjects.length} selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {/* Bulk status update */}}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => {/* Bulk export */}}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Export Selected
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        onClick={() => setSelectedProjects([])}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative lg:col-span-2">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search projects, technologies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                                         focus:border-blue-500/50 transition-all placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="planning">Planning</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="Web">Web</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Desktop">Desktop</option>
                            <option value="AI/ML">AI/ML</option>
                            <option value="Blockchain">Blockchain</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="updated">Last Updated</option>
                                <option value="featured">Featured First</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'}`}
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                            <Tag size={16} className="text-gray-400" />
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTags(prev =>
                                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                    )}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                        filterTags.includes(tag)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            {filterTags.length > 0 && (
                                <button
                                    onClick={() => setFilterTags([])}
                                    className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all"
                                >
                                    Clear Tags
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Projects Display */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
                            <p className="text-gray-400">Loading projects...</p>
                        </div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <FileText size={64} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first project to get started'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold 
                                     hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={selectAllProjects}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 
                                         border border-white/10 rounded-lg text-sm font-medium transition-all"
                            >
                                {selectedProjects.length === filteredProjects.length ? (
                                    <><CheckSquare size={16} /> Deselect All</>
                                ) : (
                                    <><Square size={16} /> Select All</>
                                )}
                            </button>
                            <p className="text-sm text-gray-400">
                                Showing {filteredProjects.length} of {projects.length} projects
                            </p>
                        </div>

                        {/* Grid/List View */}
                        <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30'
                            : 'space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30'
                        }>
                            {filteredProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    viewMode={viewMode}
                                    isSelected={selectedProjects.includes(project.id)}
                                    onToggleSelect={() => toggleProjectSelection(project.id)}
                                    onEdit={() => {
                                        setSelectedProject(project);
                                        setShowEditModal(true);
                                    }}
                                    onDelete={() => {
                                        setProjectToDelete(project);
                                        setShowDeleteConfirm(true);
                                    }}
                                    onToggleFeatured={() => handleToggleFeatured(project.id)}
                                    onDuplicate={() => handleDuplicateProject(project)}
                                    onViewImages={() => {
                                        setSelectedProject(project);
                                        setShowImageModal(true);
                                    }}
                                    onToggleVisibility={() => handleToggleVisibility(project.id)}
                                    onToggleArchived={() => handleToggleArchived(project.id)}
                                    onTogglePinned={() => handleTogglePinned(project.id)}
                                    statusColors={statusColors}
                                    priorityColors={priorityColors}
                                    onViewProject={handleViewProject}
                                    onToggleFavorite={handleToggleFavorite}
                                    onImageClick={handleImageClick}
                                    isFavorite={favorites.includes(project.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Modals */}
                <ProjectFormModal
                    show={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    project={newProject}
                    setProject={setNewProject}
                    onSave={handleAddProject}
                    title="Create New Project"
                    uploading={uploading}
                    onImageUpload={handleImageUpload}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                />

                <ProjectFormModal
                    show={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    setProject={setSelectedProject}
                    onSave={handleUpdateProject}
                    title="Edit Project"
                    uploading={uploading}
                    onImageUpload={handleImageUpload}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                />

                <ImageGalleryModal
                    show={showImageModal}
                    onClose={() => {
                        setShowImageModal(false);
                        setSelectedProject(null);
                        setCurrentImageIndex(0);
                    }}
                    project={selectedProject}
                    currentIndex={currentImageIndex}
                    setCurrentIndex={setCurrentImageIndex}
                />

                <DeleteConfirmModal
                    show={showDeleteConfirm}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setProjectToDelete(null);
                    }}
                    onConfirm={() => handleDeleteProject(projectToDelete?.id)}
                    project={projectToDelete}
                />

                <AnalyticsModal
                    show={showAnalyticsModal}
                    onClose={() => setShowAnalyticsModal(false)}
                    analytics={analytics}
                    projects={projects}
                />

                {/* New Modals */}
                <ProjectModal
                    project={selectedProject}
                    onClose={() => {
                        setShowProjectModal(false);
                        setSelectedProject(null);
                    }}
                    onImageClick={handleImageClick}
                />

                {/* Lightbox */}
                {lightboxImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        onClick={() => setLightboxImage(null)}
                    >
                        <img
                            src={lightboxImage}
                            alt="Project view"
                            className="max-w-90vw max-h-90vh object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// Project Card Component
const ProjectCard = ({
    project, index, viewMode, isSelected, onToggleSelect, onEdit, onDelete,
    onToggleFeatured, onDuplicate, onViewImages, onToggleVisibility, onToggleArchived, onTogglePinned,
    statusColors, priorityColors, onViewProject, onToggleFavorite, onImageClick, isFavorite
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden 
                       hover:bg-white/10 hover:border-white/20 transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : ''
            } ${viewMode === 'list' ? 'flex' : ''} ${
                project.hidden ? 'opacity-60' : ''
            } ${project.archived ? 'grayscale-[50%]' : ''}`}
        >
            {/* Status Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {project.pinned && (
                    <div className="p-2 bg-yellow-500 rounded-lg shadow-lg">
                        <MapPin size={16} fill="white" className="text-white" />
                    </div>
                )}
                {project.hidden && (
                    <div className="p-2 bg-gray-500 rounded-lg shadow-lg">
                        <Eye size={16} className="text-white" />
                    </div>
                )}
                {project.archived && (
                    <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                        <Archive size={16} className="text-white" />
                    </div>
                )}
            </div>

            {/* Selection Checkbox */}
            <button
                onClick={onToggleSelect}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-lg 
                         opacity-0 group-hover:opacity-100 transition-all"
            >
                {isSelected ? (
                    <CheckSquare className="text-blue-500" size={18} />
                ) : (
                    <Square className="text-white" size={18} />
                )}
            </button>

            {/* Featured Badge */}
            {project.featured && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-3 py-1 bg-purple-500 rounded-lg 
                              flex items-center gap-1.5 text-white text-xs font-bold shadow-lg">
                    <Star size={12} fill="white" />
                    Featured
                </div>
            )}

            {/* Image */}
            <div className={`relative overflow-hidden ${
                viewMode === 'grid' ? 'h-48' : 'w-64 h-full'
            }`}>
                {project.images?.length > 0 ? (
                    <div
                        onClick={onViewImages}
                        className="w-full h-full cursor-pointer group"
                    >
                        <img
                            src={project.images[0].url}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                                      opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <Maximize2 className="text-white" size={32} />
                        </div>
                        {project.images.length > 1 && (
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm 
                                          rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                                <ImageIcon size={12} />
                                +{project.images.length - 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 
                                  flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-600" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${viewMode === 'grid' ? '' : 'flex flex-col'}`}>
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white line-clamp-1">{project.title}</h3>
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                            >
                                <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 
                                                 rounded-xl shadow-xl overflow-hidden z-20"
                                    >
                                        <button onClick={() => { onEdit(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        <button onClick={() => { onDuplicate(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Copy size={16} /> Duplicate
                                        </button>
                                        <button onClick={() => { onToggleFeatured(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Star size={16} /> {project.featured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <button onClick={() => { onTogglePinned(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <MapPin size={16} /> {project.pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button onClick={() => { onToggleVisibility(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Eye size={16} /> {project.hidden ? 'Show' : 'Hide'}
                                        </button>
                                        <button onClick={() => { onToggleArchived(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm">
                                            <Archive size={16} /> {project.archived ? 'Restore' : 'Archive'}
                                        </button>
                                        <hr className="border-white/10" />
                                        <button onClick={() => { onDelete(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{project.description}</p>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusColors[project.status]}`}>
                            {project.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">
                            {project.category}
                        </span>
                        {project.priority && (
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${priorityColors[project.priority]}`}>
                                {project.priority.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Technologies */}
                {project.technologies?.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {project.technologies.slice(0, 5).map((tech, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium">
                                    {tech}
                                </span>
                            ))}
                            {project.technologies.length > 5 && (
                                <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-400">
                                    +{project.technologies.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 space-y-4">
                    {/* Links Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {project.links?.github && (
                                <a
                                    href={project.links.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                    title="View on GitHub"
                                >
                                    <Github size={16} />
                                </a>
                            )}
                            {project.links?.live && (
                                <a
                                    href={project.links.live}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                    title="Live Demo"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            )}
                            {project.links?.demo && (
                                <a
                                    href={project.links.demo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                    title="Video Demo"
                                >
                                    <Video size={16} />
                                </a>
                            )}
                            {project.links?.documentation && (
                                <a
                                    href={project.links.documentation}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                    title="Documentation"
                                >
                                    <FileText size={16} />
                                </a>
                            )}
                            
                            {/* New Action Buttons */}
                            <button
                                onClick={() => onViewProject(project)}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                title="View Details"
                            >
                                <Eye size={16} />
                            </button>
                            
                            {/* Share Component */}
                            <ProjectShare project={project} />
                            
                            <button
                                onClick={() => onToggleFavorite(project.id)}
                                className={`p-2 ${isFavorite ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 hover:bg-white/10'} border rounded-lg transition-all`}
                                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            >
                                <Heart size={16} className={isFavorite ? 'text-red-500 fill-red-500' : ''} />
                            </button>
                            {project.links?.api && (
                                <a
                                    href={project.links.api}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                    title="API Documentation"
                                >
                                    <Code size={16} />
                                </a>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>{project.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart size={14} />
                                <span>{project.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            {project.client && (
                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                                    {project.client}
                                </span>
                            )}
                            {project.budget && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg">
                                    ${project.budget}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {project.startDate && (
                                <span className="text-gray-400">
                                    Start: {new Date(project.startDate).toLocaleDateString()}
                                </span>
                            )}
                            {project.endDate && (
                                <span className="text-gray-400">
                                    End: {new Date(project.endDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Modal Components
const ImageGalleryModal = ({ show, onClose, project, currentIndex, setCurrentIndex }) => {
    if (!show || !project) return null;
    
    const images = project.images || [];
    
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative max-w-5xl w-full"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg z-10"
                >
                    ✕
                </button>
                
                {images.length > 0 ? (
                    <div className="bg-slate-800 rounded-xl p-6">
                        <img
                            src={images[currentIndex]}
                            alt={`${project.title} - ${currentIndex + 1}`}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg"
                            >
                                Previous
                            </button>
                            <span className="text-white">{currentIndex + 1} / {images.length}</span>
                            <button
                                onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                                disabled={currentIndex === images.length - 1}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-400">
                        No images available
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const DeleteConfirmModal = ({ show, onClose, onConfirm, project }) => {
    if (!show || !project) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full"
            >
                <h3 className="text-2xl font-bold text-red-400 mb-4">Delete Project</h3>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const AnalyticsModal = ({ show, onClose, analytics, projects }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Project Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Projects</p>
                        <p className="text-3xl font-bold text-white">
                            {analytics?.totalProjects || projects.length}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Published</p>
                        <p className="text-3xl font-bold text-green-400">
                            {analytics?.publishedProjects || projects.filter(p => p.status === 'published').length}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">In Progress</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {analytics?.inProgressProjects || projects.filter(p => p.status === 'in-progress').length}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Views</p>
                        <p className="text-3xl font-bold text-cyan-400">
                            {analytics?.totalViews || projects.reduce((acc, p) => acc + (p.views || 0), 0)}
                        </p>
                    </div>
                </div>
                
                {/* Additional Analytics */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">Average Views per Project</p>
                            <p className="text-2xl font-bold text-cyan-400">
                                {analytics?.averageViews || Math.round(projects.reduce((acc, p) => acc + (p.views || 0), 0) / projects.length) || 0}
                            </p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">Most Popular Project</p>
                            <p className="text-xl font-bold text-green-400 truncate">
                                {analytics?.mostPopularProject || projects.reduce((max, p) => (p.views || 0) > (max.views || 0) ? p : max, projects[0])?.title || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {analytics?.completionRate || Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) || 0}%
                            </p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm mb-2">Featured Projects</p>
                            <p className="text-2xl font-bold text-yellow-400">
                                {analytics?.featuredProjects || projects.filter(p => p.featured).length}
                            </p>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

export default ProjectManagerEnhanced;