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
    Share2, Bookmark, ThumbsUp, Eye as ViewIcon, Columns,
    Circle, LayoutDashboard, DownloadCloud
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import ProjectModal from '../../pages/ProjectModal';
import ProjectShare from '../../pages/ProjectShare';
import ProjectSkeleton from '../../pages/ProjectSkeleton';
import cacheService from '../../services/cache.service';

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
        'Go', 'Rust', 'C++', 'Dart', 'Scala', 'Elixir',

        // Mobile Specific Languages
        'Swift', 'Kotlin',

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
        'Xamarin', 'Arduino', 'Raspberry Pi', 'ESP32', 'MQTT', 'CoAP', 'LoRaWAN'
    ];
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--surface-color)] rounded-xl p-6 max-w-full sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-[var(--border-color)]"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-[var(--text-color)]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-3 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500"
                    >
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={project.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter project title"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Client/Company
                            </label>
                            <input
                                type="text"
                                value={project.client || ''}
                                onChange={(e) => handleChange('client', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Client name or company"
                            />
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Description *
                    </label>
                    <textarea
                        value={project.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter project description"
                        rows={4}
                        required
                    />
                    </div>
                    
                    {/* Category, Status, Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Category
                            </label>
                            <select
                                value={project.category || 'Web'}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Status
                            </label>
                            <select
                                value={project.status || 'planning'}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Priority
                            </label>
                            <select
                                value={project.priority || 'medium'}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={project.startDate || ''}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={project.endDate || ''}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Budget ($)
                            </label>
                            <input
                                type="number"
                                value={project.budget || ''}
                                onChange={(e) => handleChange('budget', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                    
                    {/* Technologies Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Technologies
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-[var(--surface-color)]/80 rounded-lg border border-[var(--border-color)]">
                            {technologyOptions.map((tech, index) => (
                                <label key={`${tech}-${index}`} className="flex items-center space-x-2 text-sm">
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
                                        className="rounded text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className="text-[var(--text-secondary)]">{tech}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            value={(project.tags || []).join(', ')}
                            onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                            className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="frontend, backend, fullstack"
                        />
                    </div>
                    
                    {/* Links */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Project Links
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="url"
                                value={project.links?.github || ''}
                                onChange={(e) => handleLinkChange('github', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="GitHub URL"
                            />
                            <input
                                type="url"
                                value={project.links?.live || ''}
                                onChange={(e) => handleLinkChange('live', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Live Demo URL"
                            />
                            <input
                                type="url"
                                value={project.links?.documentation || ''}
                                onChange={(e) => handleLinkChange('documentation', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Documentation URL"
                            />
                            <input
                                type="url"
                                value={project.links?.api || ''}
                                onChange={(e) => handleLinkChange('api', e.target.value)}
                                className="w-full px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="API Documentation URL"
                            />
                        </div>
                    </div>
                    
                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Project Images
                        </label>
                        <div className="space-y-3">
                            {(project.images || []).map((image, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="url"
                                        value={image.url || ''}
                                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                        className="flex-1 px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Image URL"
                                    />
                                    <input
                                        type="text"
                                        value={image.caption || ''}
                                        onChange={(e) => handleImageChange(index, 'caption', e.target.value)}
                                        className="flex-1 px-4 py-3 sm:py-2 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Image caption"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleImageRemove(index)}
                                        className="px-3 py-3 sm:py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleImageAdd}
                                className="w-full px-4 py-3 sm:py-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
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
                            className="rounded text-indigo-500 focus:ring-indigo-500"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-[var(--text-secondary)]">
                            Featured Project
                        </label>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-color)] rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500"
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
    const [filterPriority, setFilterPriority] = useState('all');
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [activeStatFilter, setActiveStatFilter] = useState('all');
    
    // Enhanced Project Structure
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        technologies: [],
        currentStage: 'planning',
        category: 'Web',
        links: {
            github: '',
            live: '',
            demo: '',
            documentation: '',
            staging: '',
            analytics: '',
            monitoring: '',
            api: ''
        },
        images: [],
        featured: false,
        tags: [],
        collaborators: [],
        startDate: '',
        endDate: '',
        priority: 'medium',
        visibility: 'public',
        client: '',
        budget: 0,
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
        },
        challenges: '',
        achievements: [],
        fullDescription: '',
        duration: '',
        teamSize: 0,
        completionDate: '',
        hidden: false,
        archived: false,
        pinned: false
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

    // Init last sync time from cache
    useEffect(() => {
        const cached = cacheService.get('projects_last_sync');
        if (cached) {
            setLastSyncTime(cached);
        } else {
            setLastSyncTime(new Date().toISOString());
            cacheService.set('projects_last_sync', new Date().toISOString(), 86400000);
        }
    }, []);

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
            fullDescription: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management. Features include user accounts, shopping cart, payment processing, inventory management, and admin dashboard.",
            imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop", caption: "Main E-commerce View" },
                { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop", caption: "Shopping Cart" },
                { url: "https://images.unsplash.com/photo-1556740738-b6a82e8bfca5?w=800&h=600&fit=crop", caption: "Admin Dashboard" }
            ],
            links: {
                github: "https://github.com/yourusername/ecommerce",
                live: "https://demo-ecommerce.com",
                demo: "",
                documentation: "",
                staging: "",
                analytics: "",
                monitoring: "",
                api: ""
            },
            technologies: ["React", "Node.js", "MongoDB", "Stripe", "Java", "Spring Boot"],
            category: "Web",
            status: "completed",
            currentStage: "deployment",
            featured: true,
            tags: ["e-commerce", "fullstack", "payment"],
            collaborators: [
                { name: "John Doe", role: "Backend Developer", github: "johndoe" },
                { name: "Jane Smith", role: "Frontend Developer", github: "janesmith" }
            ],
            startDate: new Date(Date.now() - 86400000 * 90).toISOString(), // 3 months ago
            endDate: new Date().toISOString(),
            priority: "high",
            visibility: "public",
            views: 1245,
            likes: 42,
            client: "ABC Company",
            budget: 50000,
            challenges: "Integrating multiple payment gateways and ensuring PCI compliance",
            achievements: ["Processed $100K+ in transactions", "Achieved 99.9% uptime"],
            duration: "3 months",
            teamSize: 4,
            completionDate: new Date().toISOString(),
            hidden: false,
            archived: false,
            pinned: false,
            stageHistory: [
                { stage: "planning", date: new Date(Date.now() - 86400000 * 90).toISOString(), notes: "Initial planning and requirements gathering" },
                { stage: "development", date: new Date(Date.now() - 86400000 * 60).toISOString(), notes: "Started development phase" },
                { stage: "testing", date: new Date(Date.now() - 86400000 * 10).toISOString(), notes: "QA and testing phase" },
                { stage: "deployment", date: new Date().toISOString(), notes: "Launched to production" }
            ],
            milestones: [
                { name: "Design Phase", description: "Complete UI/UX design", dueDate: new Date(Date.now() - 86400000 * 70).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 70).toISOString() },
                { name: "Backend API", description: "Develop core API endpoints", dueDate: new Date(Date.now() - 86400000 * 40).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 40).toISOString() },
                { name: "Frontend Integration", description: "Connect frontend to backend", dueDate: new Date(Date.now() - 86400000 * 15).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 15).toISOString() },
                { name: "Go Live", description: "Deploy to production", dueDate: new Date().toISOString(), completed: true, completedAt: new Date().toISOString() }
            ],
            team: [
                { name: "Alice Johnson", role: "Project Manager", email: "alice@example.com" },
                { name: "Bob Williams", role: "Lead Developer", email: "bob@example.com" }
            ],
            resources: {
                budget: 50000,
                timeline: "3 months",
                tools: ["Figma", "VS Code", "Postman", "Jira"],
                documentation: "https://docs.example.com/ecommerce"
            },
            deliverables: {
                current: [],
                completed: ["Design documents", "Backend API", "Frontend application", "Testing suite"],
                pending: []
            },
            automation: {
                autoDeploy: true,
                ciCd: true,
                testing: true,
                monitoring: true,
                notifications: true
            },
            analytics: {
                views: 1245,
                engagement: 85,
                performance: 95,
                uptime: 99.9,
                errors: 0.1
            },
            metrics: {
                stars: 120,
                forks: 45,
                commits: 234,
                lastCommit: new Date().toISOString()
            },
            createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            title: "Portfolio Website",
            description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
            fullDescription: "Modern portfolio website built with React, featuring smooth animations and responsive design. Showcases projects, skills, and contact information with a clean, professional interface.",
            imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop", caption: "Portfolio Home" },
                { url: "https://images.unsplash.com/photo-1522252234503-e356532cafd5?w=800&h=600&fit=crop", caption: "Responsive Design" },
                { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", caption: "Project Gallery" }
            ],
            links: {
                github: "https://github.com/yourusername/portfolio",
                live: "https://yourportfolio.com",
                demo: "",
                documentation: "",
                staging: "",
                analytics: "",
                monitoring: "",
                api: ""
            },
            technologies: ["React", "Tailwind CSS", "Framer Motion", "Next.js"],
            category: "Web",
            status: "completed",
            currentStage: "maintenance",
            featured: true,
            tags: ["portfolio", "frontend", "responsive"],
            collaborators: [
                { name: "Alex Johnson", role: "Designer", github: "alexjohnson" },
                { name: "Sam Wilson", role: "Developer", github: "samwilson" }
            ],
            startDate: new Date(Date.now() - 86400000 * 30).toISOString(), // 1 month ago
            endDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
            priority: "medium",
            visibility: "public",
            views: 892,
            likes: 28,
            client: "Self",
            budget: 0,
            challenges: "Creating smooth animations while maintaining performance",
            achievements: ["Achieved 100 Lighthouse score", "Implemented dark/light mode"],
            duration: "3 weeks",
            teamSize: 2,
            completionDate: new Date(Date.now() - 86400000 * 10).toISOString(),
            hidden: false,
            archived: false,
            pinned: false,
            stageHistory: [
                { stage: "planning", date: new Date(Date.now() - 86400000 * 30).toISOString(), notes: "Initial planning and wireframes" },
                { stage: "design", date: new Date(Date.now() - 86400000 * 20).toISOString(), notes: "UI/UX design phase" },
                { stage: "development", date: new Date(Date.now() - 86400000 * 15).toISOString(), notes: "Started development" },
                { stage: "testing", date: new Date(Date.now() - 86400000 * 12).toISOString(), notes: "Testing and refinement" },
                { stage: "deployment", date: new Date(Date.now() - 86400000 * 10).toISOString(), notes: "Launched to production" }
            ],
            milestones: [
                { name: "Design Complete", description: "Complete UI/UX design", dueDate: new Date(Date.now() - 86400000 * 20).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 20).toISOString() },
                { name: "Development Phase", description: "Core functionality", dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 10).toISOString() }
            ],
            team: [
                { name: "Alex Johnson", role: "Designer", email: "alex@example.com" },
                { name: "Sam Wilson", role: "Developer", email: "sam@example.com" }
            ],
            resources: {
                budget: 0,
                timeline: "3 weeks",
                tools: ["Figma", "VS Code", "Photoshop"],
                documentation: "https://docs.example.com/portfolio"
            },
            deliverables: {
                current: [],
                completed: ["Design", "Frontend", "Responsive layout", "Animations"],
                pending: []
            },
            automation: {
                autoDeploy: true,
                ciCd: true,
                testing: false,
                monitoring: true,
                notifications: true
            },
            analytics: {
                views: 892,
                engagement: 78,
                performance: 98,
                uptime: 100,
                errors: 0
            },
            metrics: {
                stars: 45,
                forks: 12,
                commits: 87,
                lastCommit: new Date(Date.now() - 86400000 * 5).toISOString()
            },
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            title: "Task Management App",
            description: "Collaborative task management application with real-time updates and team collaboration features.",
            fullDescription: "Collaborative task management application with real-time updates and team collaboration features. Includes Kanban boards, team chat, file sharing, and progress tracking.",
            imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop", caption: "Task Dashboard" },
                { url: "https://images.unsplash.com/photo-1586880244406-5564e8cb497d?w=800&h=600&fit=crop", caption: "Planning View" },
                { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop", caption: "Team View" }
            ],
            links: {
                github: "https://github.com/yourusername/taskmanager",
                live: "https://taskmanager-demo.com",
                demo: "",
                documentation: "",
                staging: "",
                analytics: "",
                monitoring: "",
                api: ""
            },
            technologies: ["Vue.js", "Firebase", "Vuex", "Material Design"],
            category: "Web",
            status: "in-progress",
            currentStage: "development",
            featured: false,
            tags: ["task management", "collaboration", "real-time"],
            collaborators: [
                { name: "Mike Thompson", role: "Frontend Developer", github: "mikethompson" },
                { name: "Sarah Davis", role: "Backend Developer", github: "sarahdavis" },
                { name: "Tom Wilson", role: "UI/UX Designer", github: "tomwilson" }
            ],
            startDate: new Date(Date.now() - 86400000 * 45).toISOString(), // 45 days ago
            endDate: null,
            priority: "high",
            visibility: "public",
            views: 543,
            likes: 15,
            client: "Internal",
            budget: 25000,
            challenges: "Implementing real-time synchronization across multiple clients",
            achievements: ["Real-time updates working", "Cross-platform compatibility achieved"],
            duration: "ongoing",
            teamSize: 3,
            completionDate: null,
            hidden: false,
            archived: false,
            pinned: false,
            stageHistory: [
                { stage: "planning", date: new Date(Date.now() - 86400000 * 50).toISOString(), notes: "Requirements gathering" },
                { stage: "design", date: new Date(Date.now() - 86400000 * 40).toISOString(), notes: "UI/UX design completed" },
                { stage: "development", date: new Date(Date.now() - 86400000 * 30).toISOString(), notes: "Started development" }
            ],
            milestones: [
                { name: "MVP Complete", description: "Basic functionality", dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
                { name: "Real-time Sync", description: "Implement real-time updates", dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), completed: false, completedAt: null }
            ],
            team: [
                { name: "Mike Thompson", role: "Frontend Developer", email: "mike@example.com" },
                { name: "Sarah Davis", role: "Backend Developer", email: "sarah@example.com" },
                { name: "Tom Wilson", role: "UI/UX Designer", email: "tom@example.com" }
            ],
            resources: {
                budget: 25000,
                timeline: "ongoing",
                tools: ["Vue.js", "Firebase", "Figma", "VS Code"],
                documentation: "https://docs.example.com/taskmanager"
            },
            deliverables: {
                current: ["Real-time sync", "Mobile responsiveness"],
                completed: ["Authentication", "Task creation", "Kanban board"],
                pending: ["Advanced reporting", "Mobile app"]
            },
            automation: {
                autoDeploy: true,
                ciCd: true,
                testing: true,
                monitoring: true,
                notifications: true
            },
            analytics: {
                views: 543,
                engagement: 65,
                performance: 88,
                uptime: 99.5,
                errors: 0.2
            },
            metrics: {
                stars: 28,
                forks: 7,
                commits: 156,
                lastCommit: new Date().toISOString()
            },
            createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 5,
            title: "AI Analytics Dashboard",
            description: "Advanced analytics dashboard powered by artificial intelligence to provide insights and predictions.",
            fullDescription: "Advanced analytics dashboard powered by artificial intelligence to provide insights and predictions. Features include data visualization, predictive analytics, anomaly detection, and automated reporting.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop", caption: "Analytics Overview" },
                { url: "https://images.unsplash.com/photo-1544256718-3bcf23cd33ff?w=800&h=600&fit=crop", caption: "Data Visualization" },
                { url: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=600&fit=crop", caption: "Predictive Models" }
            ],
            links: {
                github: "https://github.com/yourusername/ai-analytics",
                live: "https://ai-analytics-demo.com",
                demo: "",
                documentation: "",
                staging: "",
                analytics: "",
                monitoring: "",
                api: ""
            },
            technologies: ["Python", "TensorFlow", "React", "D3.js", "Node.js", "MongoDB"],
            category: "AI/ML",
            status: "completed",
            currentStage: "maintenance",
            featured: true,
            tags: ["ai", "analytics", "machine learning", "data science"],
            collaborators: [
                { name: "Dr. Emily Chen", role: "Data Scientist", github: "emilychen" },
                { name: "David Rodriguez", role: "ML Engineer", github: "davidrodriguez" },
                { name: "Lisa Park", role: "Frontend Developer", github: "lisapark" }
            ],
            startDate: new Date(Date.now() - 86400000 * 120).toISOString(), // 4 months ago
            endDate: new Date(Date.now() - 86400000 * 30).toISOString(), // 1 month ago
            priority: "high",
            visibility: "public",
            views: 1205,
            likes: 67,
            client: "TechCorp Inc.",
            budget: 120000,
            challenges: "Processing large datasets in real-time and optimizing ML models for performance",
            achievements: ["Reduced prediction latency by 60%", "Achieved 95% accuracy in forecasting"],
            duration: "3 months",
            teamSize: 5,
            completionDate: new Date(Date.now() - 86400000 * 30).toISOString(),
            hidden: false,
            archived: false,
            pinned: true,
            stageHistory: [
                { stage: "planning", date: new Date(Date.now() - 86400000 * 120).toISOString(), notes: "Requirements and feasibility study" },
                { stage: "data prep", date: new Date(Date.now() - 86400000 * 100).toISOString(), notes: "Data collection and preprocessing" },
                { stage: "modeling", date: new Date(Date.now() - 86400000 * 70).toISOString(), notes: "ML model development" },
                { stage: "development", date: new Date(Date.now() - 86400000 * 45).toISOString(), notes: "Frontend and backend development" },
                { stage: "testing", date: new Date(Date.now() - 86400000 * 35).toISOString(), notes: "Integration and performance testing" },
                { stage: "deployment", date: new Date(Date.now() - 86400000 * 30).toISOString(), notes: "Production deployment" }
            ],
            milestones: [
                { name: "Data Pipeline", description: "Establish data collection pipeline", dueDate: new Date(Date.now() - 86400000 * 90).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 90).toISOString() },
                { name: "ML Model", description: "Train and validate ML models", dueDate: new Date(Date.now() - 86400000 * 60).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 60).toISOString() },
                { name: "Dashboard", description: "Complete dashboard UI/UX", dueDate: new Date(Date.now() - 86400000 * 30).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 30).toISOString() }
            ],
            team: [
                { name: "Dr. Emily Chen", role: "Data Scientist", email: "emily@techcorp.com" },
                { name: "David Rodriguez", role: "ML Engineer", email: "david@techcorp.com" },
                { name: "Lisa Park", role: "Frontend Developer", email: "lisa@techcorp.com" }
            ],
            resources: {
                budget: 120000,
                timeline: "4 months",
                tools: ["Python", "TensorFlow", "React", "Docker", "AWS"],
                documentation: "https://docs.example.com/ai-analytics"
            },
            deliverables: {
                current: [],
                completed: ["Data pipeline", "ML models", "Dashboard", "API", "Documentation"],
                pending: []
            },
            automation: {
                autoDeploy: true,
                ciCd: true,
                testing: true,
                monitoring: true,
                notifications: true
            },
            analytics: {
                views: 1205,
                engagement: 92,
                performance: 96,
                uptime: 99.8,
                errors: 0.05
            },
            metrics: {
                stars: 89,
                forks: 34,
                commits: 421,
                lastCommit: new Date(Date.now() - 86400000 * 5).toISOString()
            },
            createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 6,
            title: "Social Media App",
            description: "Mobile-first social media platform with real-time messaging, stories, and content sharing.",
            fullDescription: "Mobile-first social media platform with real-time messaging, stories, and content sharing. Features include user profiles, news feed, instant messaging, content creation tools, and social networking capabilities.",
            imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
            thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
            images: [
                { url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop", caption: "Social Feed" },
                { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop", caption: "Messaging Interface" },
                { url: "https://images.unsplash.com/photo-1512295765893-2a2e82d3284d?w=800&h=600&fit=crop", caption: "Profile View" }
            ],
            links: {
                github: "https://github.com/yourusername/socialapp",
                live: "https://socialapp-demo.com",
                demo: "",
                documentation: "",
                staging: "",
                analytics: "",
                monitoring: "",
                api: ""
            },
            technologies: ["React Native", "Firebase", "Redux", "WebRTC"],
            category: "Mobile",
            status: "in-progress",
            currentStage: "development",
            featured: false,
            tags: ["social", "mobile", "messaging"],
            collaborators: [
                { name: "James Wilson", role: "Mobile Developer", github: "jameswilson" },
                { name: "Sophia Garcia", role: "Backend Developer", github: "sophiagarcia" },
                { name: "Michael Brown", role: "UI/UX Designer", github: "michaelbrown" }
            ],
            startDate: new Date(Date.now() - 86400000 * 60).toISOString(), // 2 months ago
            endDate: null,
            priority: "high",
            visibility: "public",
            views: 678,
            likes: 34,
            client: "StartupXYZ",
            budget: 75000,
            challenges: "Implementing real-time messaging at scale and ensuring data privacy",
            achievements: ["Achieved 10K beta users", "Implemented end-to-end encryption"],
            duration: "ongoing",
            teamSize: 4,
            completionDate: null,
            hidden: false,
            archived: false,
            pinned: false,
            stageHistory: [
                { stage: "planning", date: new Date(Date.now() - 86400000 * 65).toISOString(), notes: "Initial planning and market research" },
                { stage: "design", date: new Date(Date.now() - 86400000 * 55).toISOString(), notes: "UI/UX design phase" },
                { stage: "development", date: new Date(Date.now() - 86400000 * 45).toISOString(), notes: "Started development" }
            ],
            milestones: [
                { name: "MVP", description: "Basic social features", dueDate: new Date(Date.now() - 86400000 * 20).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 20).toISOString() },
                { name: "Beta Launch", description: "Release to beta users", dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), completed: true, completedAt: new Date(Date.now() - 86400000 * 10).toISOString() }
            ],
            team: [
                { name: "James Wilson", role: "Mobile Developer", email: "james@startupxyz.com" },
                { name: "Sophia Garcia", role: "Backend Developer", email: "sophia@startupxyz.com" },
                { name: "Michael Brown", role: "UI/UX Designer", email: "michael@startupxyz.com" }
            ],
            resources: {
                budget: 75000,
                timeline: "ongoing",
                tools: ["React Native", "Firebase", "Figma", "Jira"],
                documentation: "https://docs.example.com/socialapp"
            },
            deliverables: {
                current: ["Push notifications", "Advanced privacy controls"],
                completed: ["User authentication", "News feed", "Messaging", "Content sharing"],
                pending: ["Video calling", "Monetization features"]
            },
            automation: {
                autoDeploy: false,
                ciCd: true,
                testing: true,
                monitoring: true,
                notifications: true
            },
            analytics: {
                views: 678,
                engagement: 72,
                performance: 85,
                uptime: 98.5,
                errors: 0.3
            },
            metrics: {
                stars: 15,
                forks: 3,
                commits: 89,
                lastCommit: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
            updatedAt: new Date().toISOString()
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
            // Format project data according to backend schema
            const projectData = {
                ...newProject, // Spread all properties to allow for extended fields
                userId: newProject.userId || undefined, // Exclude userId as it's set by backend
                createdAt: newProject.createdAt || undefined, // Exclude timestamps as they're set by backend
                updatedAt: newProject.updatedAt || undefined
            };

            const response = await ApiService.createProject(projectData);

            // Add the new project to the beginning of the list
            setProjects(prevProjects => [response.project, ...prevProjects]);
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
            console.error('Error creating project:', err);
            error(err.response?.data?.message || err.message || 'Failed to create project');
        }
    };

    const handleUpdateProject = async () => {
        if (!selectedProject?.id) return;

        try {
            // Format project data according to backend schema
            const projectData = {
                ...selectedProject, // Spread all properties to allow for extended fields
                userId: selectedProject.userId || undefined, // Exclude userId as it's set by backend
                createdAt: selectedProject.createdAt || undefined, // Exclude timestamps as they're set by backend
                updatedAt: selectedProject.updatedAt || undefined
            };

            const response = await ApiService.updateProject(selectedProject.id, projectData);
            setProjects(projects.map(p => p.id === selectedProject.id ? response.project : p));
            setShowEditModal(false);
            setSelectedProject(null);
            success('Project updated successfully!');
        } catch (err) {
            console.error('Error updating project:', err);
            error(err.response?.data?.message || err.message || 'Failed to update project');
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
            title: '',
            description: '',
            technologies: [],
            status: 'in-progress',
            category: 'Web',
            links: {
                github: '',
                live: '',
                demo: '',
                documentation: '',
                staging: '',
                analytics: '',
                monitoring: '',
                api: ''
            },
            images: [],
            featured: false,
            tags: [],
            collaborators: [],
            startDate: '',
            endDate: '',
            priority: 'medium',
            visibility: 'public',
            client: '',
            budget: 0,
            currentStage: 'planning',
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
            },
            challenges: '',
            achievements: [],
            fullDescription: '',
            duration: '',
            teamSize: 0,
            completionDate: '',
            hidden: false,
            archived: false,
            pinned: false
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
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q ||
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.technologies?.some(tech => tech.toLowerCase().includes(q)) ||
                p.tags?.some(tag => tag.toLowerCase().includes(q)) ||
                (p.priority || '').toLowerCase().includes(q) ||
                (p.status || '').toLowerCase().includes(q) ||
                (p.client || '').toLowerCase().includes(q);
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            const matchesTags = filterTags.length === 0 || filterTags.some(tag => p.tags?.includes(tag));
            const matchesPriority = filterPriority === 'all' || p.priority === filterPriority;
            const matchesStatFilter = activeStatFilter === 'all' ||
                (activeStatFilter === 'active' && (p.status === 'in-progress' || p.status === 'planning' || p.status === 'testing')) ||
                (activeStatFilter === 'completed' && p.status === 'completed') ||
                (activeStatFilter === 'archived' && p.archived === true);
            return matchesSearch && matchesStatus && matchesCategory && matchesTags && matchesPriority && matchesStatFilter;
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
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportProjects}
                        accept=".json"
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => window.open('/projects', '_blank')}
                        className="hidden md:flex px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 
                                 rounded-lg text-sm font-medium transition-all items-center gap-2 
                                 hover:bg-blue-500/20"
                        title="View projects page"
                    >
                        <ExternalLink size={16} />
                        View Projects Page
                    </button>
                    
                    <button
                        onClick={() => {
                            loadProjects();
                            const now = new Date().toISOString();
                            setLastSyncTime(now);
                            cacheService.set('projects_last_sync', now, 86400000);
                            success('Projects synchronized successfully!');
                        }}
                        className="hidden lg:flex px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 
                                 rounded-lg text-sm font-medium transition-all items-center gap-2 
                                 hover:bg-green-500/20"
                        title="Sync projects with public page"
                    >
                        <RefreshCw size={16} />
                        Sync Projects
                    </button>
                    
                    {lastSyncTime && (
                        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-xs text-cyan-400 font-medium whitespace-nowrap">
                                Synced: {new Date(lastSyncTime).toLocaleTimeString()}
                            </span>
                        </div>
                    )}
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Upload size={16} /> Import
                    </button>

                    <div className="relative group/export">
                        <button
                            className="px-4 py-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                     rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Download size={16} /> Export
                        </button>
                        <div className="absolute right-0 mt-2 w-40 bg-[var(--surface-color)] border border-[var(--border-color)] 
                                    rounded-xl shadow-xl overflow-hidden z-50 opacity-0 invisible group-hover/export:opacity-100 
                                    group-hover/export:visible transition-all duration-200">
                            <button
                                onClick={() => {
                                    handleExportProjects();
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                            >
                                <FileText size={16} /> Export JSON
                            </button>
                            <button
                                onClick={() => {
                                    const csv = projectsToCSV(filteredProjects);
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    success('Projects exported as CSV');
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                            >
                                <DownloadCloud size={16} /> Export CSV
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="hidden sm:flex px-4 py-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all items-center gap-2"
                    >
                        <BarChart3 size={16} /> Analytics
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-5 py-3 sm:px-6 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 
                                 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg 
                                 shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Plus size={18} /> New Project
                    </button>
                </div>
            }
        >
            <div className="p-4 sm:p-6 space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { 
                            label: 'Total Projects', 
                            value: projects.length, 
                            icon: FileText, 
                            color: 'blue', 
                            statFilter: 'all',
                            change: analytics?.totalGrowth || '+0%'
                        },
                        { 
                            label: 'Active', 
                            value: projects.filter(p => p.status === 'in-progress' || p.status === 'planning' || p.status === 'testing').length, 
                            icon: Activity, 
                            color: 'amber', 
                            statFilter: 'active',
                            change: analytics?.inProgressGrowth || '+0%'
                        },
                        { 
                            label: 'Completed', 
                            value: projects.filter(p => p.status === 'completed').length, 
                            icon: Check, 
                            color: 'green', 
                            statFilter: 'completed',
                            change: analytics?.completedGrowth || '+0%'
                        },
                        { 
                            label: 'Archived', 
                            value: projects.filter(p => p.archived).length, 
                            icon: Archive, 
                            color: 'purple', 
                            statFilter: 'archived',
                            change: analytics?.featuredGrowth || '+0%'
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setActiveStatFilter(prev => prev === stat.statFilter ? 'all' : stat.statFilter)}
                            className={`relative overflow-hidden bg-[var(--surface-color)] shadow-lg rounded-xl p-6 
                                     border transition-all duration-200 hover:shadow-xl group cursor-pointer ${
                                activeStatFilter === stat.statFilter
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                    : 'border-[var(--border-color)]'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">{stat.label}</p>
                                    <h3 className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 
                                                   bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp size={14} className="text-green-500" />
                                        <span className="text-xs text-green-500 font-semibold">{stat.change}</span>
                                        <span className="text-xs text-[var(--text-secondary)]">vs last month</span>
                                    </div>
                                </div>
                                <div className={`p-3 bg-${stat.color}-500/10 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`text-${stat.color}-500`} size={24} />
                                </div>
                            </div>
                            <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600`} />
                        </motion.div>
                    ))}
                </div>

                {/* Filters & Actions */}
                <div className="bg-[var(--surface-color)] shadow-lg rounded-xl p-5 border border-[var(--border-color)]">
                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {selectedProjects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckSquare className="text-indigo-500" size={20} />
                                    <span className="font-semibold text-[var(--text-color)]">{selectedProjects.length} selected</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => {/* Bulk status update */}}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Change Status
                                    </button>
                                    <button
                                        onClick={() => {/* Bulk export */}}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
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
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative sm:col-span-2">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search projects, technologies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 sm:py-2.5 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-xl 
                                         text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 
                                         focus:border-indigo-500 transition-all placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 sm:py-2.5 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-xl text-sm 
                                     text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                            className="px-4 py-3 sm:py-2.5 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-xl text-sm 
                                     text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-4 py-3 sm:py-2.5 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-xl text-sm 
                                     text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="all">All Priority</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 px-4 py-3 sm:py-2.5 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-xl text-sm 
                                         text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="updated">Last Updated</option>
                                <option value="featured">Featured First</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-[var(--surface-color)]/80 border border-[var(--border-color)] rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-secondary)]'}`}
                                    title="Grid View"
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-secondary)]'}`}
                                    title="List View"
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'timeline' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-secondary)]'}`}
                                    title="Timeline View"
                                >
                                    <Clock size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`p-1.5 rounded transition-all ${viewMode === 'board' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-secondary)]'}`}
                                    title="Board View"
                                >
                                    <Columns size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                            <Tag size={16} className="text-[var(--text-secondary)]" />
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTags(prev =>
                                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                    )}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                        filterTags.includes(tag)
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] text-[var(--text-secondary)]'
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
                            <div className="animate-pulse">
                                <div className="mx-auto mb-4 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            </div>
                            <p className="text-[var(--text-secondary)]">Loading projects...</p>
                        </div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-[var(--surface-color)] shadow-lg rounded-xl border border-[var(--border-color)]">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2 text-[var(--text-color)]">No projects found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first project to get started'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold 
                                     hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <button
                                onClick={selectAllProjects}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                                         border border-[var(--border-color)] rounded-lg text-sm font-medium transition-all text-gray-700 dark:text-gray-300"
                            >
                                {selectedProjects.length === filteredProjects.length ? (
                                    <><CheckSquare size={16} /> Deselect All</>
                                ) : (
                                    <><Square size={16} /> Select All</>
                                )}
                            </button>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Showing {filteredProjects.length} of {projects.length} projects
                            </p>
                        </div>

                        {/* Grid/List View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-white/30">
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
                        )}

                        {viewMode === 'list' && (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-white/30">
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
                        )}

                        {viewMode === 'timeline' && (
                            <TimelineView
                                projects={filteredProjects}
                                onEdit={(project) => {
                                    setSelectedProject(project);
                                    setShowEditModal(true);
                                }}
                                onDelete={(project) => {
                                    setProjectToDelete(project);
                                    setShowDeleteConfirm(true);
                                }}
                                onViewProject={handleViewProject}
                            />
                        )}

                        {viewMode === 'board' && (
                            <BoardView
                                projects={filteredProjects}
                                onEdit={(project) => {
                                    setSelectedProject(project);
                                    setShowEditModal(true);
                                }}
                                onDelete={(project) => {
                                    setProjectToDelete(project);
                                    setShowDeleteConfirm(true);
                                }}
                                onViewProject={handleViewProject}
                            />
                        )}
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
                {showProjectModal && selectedProject && (
                    <ProjectModal
                        project={selectedProject}
                        onClose={() => {
                            setShowProjectModal(false);
                            setSelectedProject(null);
                        }}
                        onImageClick={handleImageClick}
                    />
                )}

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
                            className="absolute top-4 right-4 p-3 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all focus:ring-2 focus:ring-indigo-500"
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
            className={`relative group bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl overflow-hidden 
                       shadow-lg transition-all duration-200 hover:shadow-xl ${
                isSelected ? 'ring-2 ring-indigo-500' : ''
            } ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''} ${
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
                viewMode === 'grid' ? 'h-48' : 'w-full sm:w-64 h-48 sm:h-full'
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
                <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-[var(--text-color)] line-clamp-1">{project.title}</h3>
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
                                        className="absolute right-0 mt-2 w-48 bg-[var(--surface-color)] border border-[var(--border-color)] 
                                                 rounded-xl shadow-xl overflow-hidden z-50"
                                    >
                                        <button onClick={() => { onEdit(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Edit3 size={16} /> Edit
                                        </button>
                                        <button onClick={() => { onDuplicate(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Copy size={16} /> Duplicate
                                        </button>
                                        <button onClick={() => { onToggleFeatured(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Star size={16} /> {project.featured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <button onClick={() => { onTogglePinned(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <MapPin size={16} /> {project.pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button onClick={() => { onToggleVisibility(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Eye size={16} /> {project.hidden ? 'Show' : 'Hide'}
                                        </button>
                                        <button onClick={() => { onToggleArchived(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Archive size={16} /> {project.archived ? 'Restore' : 'Archive'}
                                        </button>
                                        <button onClick={() => { onViewProject(project); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Share2 size={16} /> Share
                                        </button>
                                        <hr className="border-[var(--border-color)]" />
                                        <button onClick={() => { onDelete(); setShowMenu(false); }}
                                            className="w-full px-4 py-2.5 hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">{project.description}</p>

                    <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusColors[project.status]}`}>
                            {project.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-bold">
                            {project.category}
                        </span>
                        {project.priority && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                project.priority === 'urgent' ? 'bg-red-500/20 text-red-500' :
                                project.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                                project.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-green-500/20 text-green-500'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    project.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                                    project.priority === 'high' ? 'bg-orange-500' :
                                    project.priority === 'medium' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                }`} />
                                {project.priority.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Technologies */}
                {project.technologies?.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)]">
                        <div className="flex flex-wrap gap-2">
                            {project.technologies.slice(0, 5).map((tech, i) => (
                                <span key={`${tech}-${i}`} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-[var(--border-color)] rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {tech}
                                </span>
                            ))}
                            {project.technologies.length > 5 && (
                                <span key="more-tech" className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-secondary)]">
                                    +{project.technologies.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {project.tags?.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-color)]">
                        <div className="flex flex-wrap gap-1.5">
                            {project.tags.map((tag, i) => {
                                const tagColors = [
                                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                                    'bg-pink-500/10 text-pink-400 border-pink-500/20',
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                    'bg-violet-500/10 text-violet-400 border-violet-500/20',
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20',
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                ];
                                const colorClass = tagColors[i % tagColors.length];
                                return (
                                    <span key={`tag-${tag}-${i}`} className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${colorClass}`}>
                                        #{tag}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 sm:p-6 space-y-4">
                    {/* Links Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {project.links?.github && (
                                <a
                                    href={project.links.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
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
                                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
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
                                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
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
                                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
                                    title="Documentation"
                                >
                                    <FileText size={16} />
                                </a>
                            )}
                            
                            {/* New Action Buttons */}
                            <button
                                onClick={() => onViewProject(project)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
                                title="View Details"
                            >
                                <Eye size={16} />
                            </button>
                            
                            {/* Share Component */}
                            <ProjectShare project={project} />
                            
                            <button
                                onClick={() => onToggleFavorite(project.id)}
                                className={`p-2 ${isFavorite ? 'bg-red-500/20 border-red-500/30' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} border border-[var(--border-color)] rounded-lg transition-all`}
                                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            >
                                <Heart size={16} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-[var(--text-secondary)]'} />
                            </button>
                            {project.links?.api && (
                                <a
                                    href={project.links.api}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-[var(--border-color)] rounded-lg transition-all text-[var(--text-secondary)]"
                                    title="API Documentation"
                                >
                                    <Code size={16} />
                                </a>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>{project.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart size={14} />
                                <span>{project.likes || 0}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <Clock size={14} />
                                <span>{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            {project.client && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-[var(--border-color)] rounded-lg text-gray-700 dark:text-gray-300">
                                    {project.client}
                                </span>
                            )}
                            {project.budget && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg">
                                    ${project.budget}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {project.startDate && (
                                <span className="text-[var(--text-secondary)]">
                                    Start: {new Date(project.startDate).toLocaleDateString()}
                                </span>
                            )}
                            {project.endDate && (
                                <span className="text-[var(--text-secondary)]">
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
                className="relative max-w-full sm:max-w-5xl w-full"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-3 sm:p-2 rounded-lg z-10 focus:ring-2 focus:ring-indigo-500"
                >
                    <X size={20} />
                </button>
                
                {images.length > 0 ? (
                    <div className="bg-[var(--surface-color)] rounded-xl p-4 sm:p-6 shadow-lg border border-[var(--border-color)]">
                        <img
                            src={images[currentIndex]}
                            alt={`${project.title} - ${currentIndex + 1}`}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="px-4 py-3 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-[var(--text-color)] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                Previous
                            </button>
                            <span className="text-[var(--text-color)] font-medium">{currentIndex + 1} / {images.length}</span>
                            <button
                                onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                                disabled={currentIndex === images.length - 1}
                                className="px-4 py-3 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-[var(--text-color)] rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[var(--surface-color)] rounded-xl p-8 text-center text-[var(--text-secondary)] border border-[var(--border-color)] shadow-lg">
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
                className="bg-[var(--surface-color)] rounded-xl p-6 max-w-full sm:max-w-md w-full shadow-lg border border-[var(--border-color)]"
            >
                <h3 className="text-2xl font-bold text-red-500 mb-4">Delete Project</h3>
                <p className="text-[var(--text-secondary)] mb-6">
                    Are you sure you want to delete <strong className="text-[var(--text-color)]">{project.title}</strong>? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="w-full sm:flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-color)] px-4 py-3 sm:py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                className="bg-[var(--surface-color)] rounded-xl p-6 max-w-full sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-[var(--border-color)]"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-indigo-500">Project Analytics</h3>
                    <button onClick={onClose} className="p-3 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500">
                        <X size={20} className="text-[var(--text-secondary)]" />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[var(--text-secondary)] text-sm">Total Projects</p>
                        <p className="text-3xl font-bold text-[var(--text-color)]">
                            {analytics?.totalProjects || projects.length}
                        </p>
                    </div>
                    <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[var(--text-secondary)] text-sm">Published</p>
                        <p className="text-3xl font-bold text-green-500">
                            {analytics?.publishedProjects || projects.filter(p => p.status === 'published').length}
                        </p>
                    </div>
                    <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[var(--text-secondary)] text-sm">In Progress</p>
                        <p className="text-3xl font-bold text-yellow-500">
                            {analytics?.inProgressProjects || projects.filter(p => p.status === 'in-progress').length}
                        </p>
                    </div>
                    <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-[var(--text-secondary)] text-sm">Total Views</p>
                        <p className="text-3xl font-bold text-indigo-500">
                            {analytics?.totalViews || projects.reduce((acc, p) => acc + (p.views || 0), 0)}
                        </p>
                    </div>
                </div>
                
                {/* Additional Analytics */}
                {analytics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-[var(--text-secondary)] text-sm mb-2">Average Views per Project</p>
                            <p className="text-2xl font-bold text-indigo-500">
                                {analytics?.averageViews || Math.round(projects.reduce((acc, p) => acc + (p.views || 0), 0) / projects.length) || 0}
                            </p>
                        </div>
                        <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-[var(--text-secondary)] text-sm mb-2">Most Popular Project</p>
                            <p className="text-xl font-bold text-green-500 truncate">
                                {analytics?.mostPopularProject || projects.reduce((max, p) => (p.views || 0) > (max.views || 0) ? p : max, projects[0])?.title || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-[var(--text-secondary)] text-sm mb-2">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-500">
                                {analytics?.completionRate || Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) || 0}%
                            </p>
                        </div>
                        <div className="bg-[var(--surface-color)]/80 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-[var(--text-secondary)] text-sm mb-2">Featured Projects</p>
                            <p className="text-2xl font-bold text-yellow-500">
                                {analytics?.featuredProjects || projects.filter(p => p.featured).length}
                            </p>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[var(--text-color)] px-4 py-3 sm:py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

// Timeline View Component
const TimelineView = ({ projects, onEdit, onDelete, onViewProject }) => {
    if (!projects.length) return (
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mb-2" />
            <p>No projects to display on timeline</p>
        </div>
    );

    const now = new Date();
    const sorted = [...projects].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const earliest = new Date(sorted[0]?.createdAt || now);
    const timelineStart = new Date(earliest);
    timelineStart.setMonth(timelineStart.getMonth() - 1);
    const latest = new Date();
    latest.setMonth(latest.getMonth() + 2);
    const totalDays = (latest - timelineStart) / (1000 * 60 * 60 * 24);

    const getProjectStart = (p) => new Date(p.startDate || p.createdAt || now);
    const getProjectEnd = (p) => {
        if (p.endDate) return new Date(p.endDate);
        const days = p.duration ? parseInt(p.duration) * 30 : 90;
        return new Date((p.startDate ? new Date(p.startDate) : new Date(p.createdAt || now)).getTime() + days * 86400000);
    };

    const statusBarColors = {
        'idea': 'bg-gradient-to-r from-indigo-500 to-purple-600',
        'planning': 'bg-gradient-to-r from-blue-500 to-cyan-500',
        'in-progress': 'bg-gradient-to-r from-amber-500 to-orange-500',
        'testing': 'bg-gradient-to-r from-yellow-500 to-amber-500',
        'completed': 'bg-gradient-to-r from-green-500 to-emerald-500',
        'archived': 'bg-gradient-to-r from-gray-500 to-slate-500',
    };

    return (
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-2">
            <div className="min-w-[800px] space-y-2">
                {/* Month headers */}
                <div className="flex sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-[var(--border-color)]">
                    {Array.from({ length: Math.ceil(totalDays / 30) }, (_, i) => {
                        const month = new Date(timelineStart);
                        month.setMonth(month.getMonth() + i);
                        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                        return (
                            <div
                                key={i}
                                className="text-center py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-[var(--border-color)] last:border-r-0"
                                style={{ width: `${(daysInMonth / totalDays) * 100}%` }}
                            >
                                {month.toLocaleString('default', { month: 'short', year: '2-digit' })}
                            </div>
                        );
                    })}
                </div>

                {/* Timeline bars */}
                <AnimatePresence>
                    {sorted.map((project, idx) => {
                        const start = getProjectStart(project);
                        const end = getProjectEnd(project);
                        const leftPct = Math.max(0, ((start - timelineStart) / (1000 * 60 * 60 * 24) / totalDays) * 100);
                        const widthPct = Math.max(2, Math.min(100 - leftPct, ((end - start) / (1000 * 60 * 60 * 24) / totalDays) * 100));
                        const isOngoing = !project.endDate;

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="relative group flex items-center gap-3 py-1.5"
                            >
                                {/* Project label */}
                                <div className="w-44 flex-shrink-0 truncate pr-2">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                                        {project.title}
                                    </span>
                                </div>

                                {/* Timeline track */}
                                <div className="flex-1 relative h-7 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPct}%` }}
                                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                                        className={`absolute inset-y-0 left-0 rounded-full ${statusBarColors[project.status] || 'bg-gradient-to-r from-gray-400 to-gray-500'} 
                                                    group-hover:opacity-80 transition-opacity cursor-pointer`}
                                        style={{ marginLeft: `${leftPct}%` }}
                                        onClick={() => onViewProject(project)}
                                        title={`${project.title}: ${start.toLocaleDateString()} - ${isOngoing ? 'Ongoing' : end.toLocaleDateString()}`}
                                    >
                                        {/* Priority dot */}
                                        <div className={`absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                            project.priority === 'urgent' ? 'bg-white animate-pulse' :
                                            project.priority === 'high' ? 'bg-white/80' :
                                            project.priority === 'medium' ? 'bg-white/60' :
                                            'bg-white/40'
                                        }`} />
                                    </motion.div>
                                    {isOngoing && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {/* Date labels */}
                                <div className="w-32 flex-shrink-0 text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block text-right">
                                    {start.toLocaleDateString()} {isOngoing ? '- Now' : `- ${end.toLocaleDateString()}`}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Board View Component (Kanban-style)
const BoardView = ({ projects, onEdit, onDelete, onViewProject }) => {
    const columns = [
        { key: 'planning', label: 'Planning', color: 'border-t-blue-500' },
        { key: 'in-progress', label: 'In Progress', color: 'border-t-amber-500' },
        { key: 'review', label: 'Review', color: 'border-t-violet-500' },
        { key: 'completed', label: 'Completed', color: 'border-t-green-500' },
        { key: 'archived', label: 'Archived', color: 'border-t-gray-500' },
    ];

    const getProjectsByStatus = (status) => {
        if (status === 'review') {
            return projects.filter(p => p.status === 'testing');
        }
        return projects.filter(p => p.status === status || (status === 'archived' && p.archived));
    };

    if (!projects.length) return (
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <LayoutDashboard size={48} className="mb-2" />
            <p>No projects to display on board</p>
        </div>
    );

    return (
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pb-2">
            <div className="flex gap-4 min-w-[700px] h-full">
                {columns.map(col => {
                    const colProjects = getProjectsByStatus(col.key);
                    return (
                        <div key={col.key} className="flex-1 min-w-[180px]">
                            <div className={`bg-[var(--surface-color)]/80 rounded-xl border border-[var(--border-color)] border-t-4 ${col.color} shadow-lg overflow-hidden`}>
                                <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{col.label}</h4>
                                    <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                        {colProjects.length}
                                    </span>
                                </div>
                                <div className="p-2 space-y-2 max-h-[55vh] overflow-y-auto">
                                    <AnimatePresence>
                                        {colProjects.map((project, idx) => (
                                            <motion.div
                                                key={project.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="bg-[var(--surface-color)]/80/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600 
                                                         hover:shadow-md transition-all cursor-pointer group"
                                                onClick={() => onViewProject(project)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-[var(--text-color)] truncate flex-1">
                                                        {project.title}
                                                    </span>
                                                    {/* Priority dot */}
                                                    <span className={`ml-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                                        project.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                                                        project.priority === 'high' ? 'bg-orange-500' :
                                                        project.priority === 'medium' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`} />
                                                </div>
                                                {project.technologies && (
                                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                                        {project.technologies.slice(0, 3).map((tech, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[9px] font-medium text-[var(--text-secondary)]">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Eye size={10} />
                                                        <span>{project.views || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper: convert projects array to CSV
const projectsToCSV = (projects) => {
    const headers = ['Title', 'Description', 'Category', 'Status', 'Priority', 'Tags', 'Technologies', 'Client', 'Budget', 'Start Date', 'End Date', 'Created At', 'Views', 'Likes'];
    const rows = projects.map(p => [
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${(p.category || '')}"`,
        `"${(p.status || '')}"`,
        `"${(p.priority || '')}"`,
        `"${(p.tags || []).join('; ')}"`,
        `"${(p.technologies || []).join('; ')}"`,
        `"${(p.client || '')}"`,
        p.budget || 0,
        p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
        p.endDate ? new Date(p.endDate).toLocaleDateString() : '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        p.views || 0,
        p.likes || 0
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

export default ProjectManagerEnhanced;