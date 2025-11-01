// src/components/Dashboard/SkillsEditorEnhanced.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Plus, Trash2, Edit3, Check, X, Code, Award, TrendingUp, Search,
    Filter, Download, Upload, Star, Move, Copy, Eye, EyeOff,
    BarChart3, Zap, Target, BookOpen, Link as LinkIcon, Calendar,
    CheckCircle, AlertCircle, Users, Trophy, Briefcase, GripVertical,
    RefreshCw, Settings, ChevronDown, ChevronUp, Loader, Grid,
    List, SortAsc, MoreVertical, Archive, Clock, Bookmark
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const SkillsEditorEnhanced = () => {
    const { user, isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error, warning } = useNotifications();
    const fileInputRef = useRef(null);

    // State Management
    const [activeTab, setActiveTab] = useState('technical');
    const [loading, setLoading] = useState(true);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [skillGroups, setSkillGroups] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    
    // Filter/Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('level');
    const [viewMode, setViewMode] = useState('grid');
    const [showHidden, setShowHidden] = useState(false);
    
    // Skill States
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [editingSkill, setEditingSkill] = useState(null);
    
    const [newSkill, setNewSkill] = useState({
        name: '',
        level: 50,
        category: 'Frontend',
        color: '#3b82f6',
        icon: 'fa-solid fa-code',
        type: 'technical',
        yearsOfExperience: 0,
        projects: [],
        certifications: [],
        learningResources: [],
        visible: true,
        featured: false,
        endorsements: 0
    });

    const iconOptions = [
        { value: 'fa-brands fa-html5', label: 'HTML5', color: '#e34c26' },
        { value: 'fa-brands fa-css3-alt', label: 'CSS3', color: '#264de4' },
        { value: 'fa-brands fa-js', label: 'JavaScript', color: '#f7df1e' },
        { value: 'fa-brands fa-react', label: 'React', color: '#61dafb' },
        { value: 'fa-brands fa-vue', label: 'Vue.js', color: '#42b883' },
        { value: 'fa-brands fa-angular', label: 'Angular', color: '#dd0031' },
        { value: 'fa-brands fa-node-js', label: 'Node.js', color: '#68a063' },
        { value: 'fa-brands fa-python', label: 'Python', color: '#3776ab' },
        { value: 'fa-brands fa-java', label: 'Java', color: '#007396' },
        { value: 'fa-brands fa-php', label: 'PHP', color: '#777bb4' },
        { value: 'fa-brands fa-git-alt', label: 'Git', color: '#f05032' },
        { value: 'fa-brands fa-docker', label: 'Docker', color: '#2496ed' },
        { value: 'fa-brands fa-aws', label: 'AWS', color: '#ff9900' },
        { value: 'fa-solid fa-database', label: 'Database', color: '#4479a1' },
        { value: 'fa-solid fa-brain', label: 'AI/ML', color: '#8b5cf6' },
        { value: 'fa-solid fa-mobile', label: 'Mobile', color: '#a4c639' },
        { value: 'fa-solid fa-code', label: 'Code', color: '#3b82f6' },
        { value: 'fa-solid fa-chart-line', label: 'Analytics', color: '#10b981' },
        { value: 'fa-solid fa-users', label: 'Team', color: '#f59e0b' },
        { value: 'fa-solid fa-lightbulb', label: 'Innovation', color: '#eab308' }
    ];

    const categoryOptions = {
        technical: [
            { value: 'Frontend', color: '#61dafb', icon: 'fa-solid fa-palette' },
            { value: 'Backend', color: '#68a063', icon: 'fa-solid fa-server' },
            { value: 'DevOps', color: '#f7931e', icon: 'fa-solid fa-infinity' },
            { value: 'Database', color: '#4479a1', icon: 'fa-solid fa-database' },
            { value: 'Mobile', color: '#a4c639', icon: 'fa-solid fa-mobile' },
            { value: 'AI/ML', color: '#8b5cf6', icon: 'fa-solid fa-brain' },
            { value: 'Cloud', color: '#ff9900', icon: 'fa-solid fa-cloud' },
            { value: 'Tools', color: '#f05032', icon: 'fa-solid fa-wrench' }
        ],
        professional: [
            { value: 'Leadership', color: '#8b5cf6', icon: 'fa-solid fa-crown' },
            { value: 'Communication', color: '#3b82f6', icon: 'fa-solid fa-comments' },
            { value: 'Project Management', color: '#10b981', icon: 'fa-solid fa-tasks' },
            { value: 'Problem Solving', color: '#f59e0b', icon: 'fa-solid fa-puzzle-piece' },
            { value: 'Creativity', color: '#ec4899', icon: 'fa-solid fa-lightbulb' },
            { value: 'Teamwork', color: '#06b6d4', icon: 'fa-solid fa-users' }
        ]
    };

    // Load Data
    useEffect(() => {
        loadSkills();
        loadAnalytics();
        loadSkillGroups();
    }, []);

    const loadSkills = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getSkills();
            const skills = response.skills || [];
            
            setTechnicalSkills(skills.filter(s => s.type === 'technical'));
            setProfessionalSkills(skills.filter(s => s.type === 'professional'));
        } catch (err) {
            error('Failed to load skills');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await ApiService.getSkillAnalytics();
            setAnalytics(response.analytics);
        } catch (err) {
            console.error('Analytics error:', err);
        }
    };

    const loadSkillGroups = async () => {
        try {
            const response = await ApiService.getSkillGroups();
            setSkillGroups(response.groups || []);
        } catch (err) {
            console.error('Groups error:', err);
        }
    };

    // CRUD Operations
    const handleAddSkill = async () => {
        if (!newSkill.name.trim()) {
            error('Please enter a skill name');
            return;
        }

        try {
            const skillData = { ...newSkill, type: activeTab };
            const response = await ApiService.addSkill(skillData);
            
            if (activeTab === 'technical') {
                setTechnicalSkills([...technicalSkills, response.skill]);
            } else {
                setProfessionalSkills([...professionalSkills, response.skill]);
            }
            
            resetForm();
            setShowAddModal(false);
            success(`Added ${newSkill.name}`);
            loadAnalytics();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to add skill');
        }
    };

    const handleUpdateSkill = async (id, updates) => {
        try {
            const response = await ApiService.updateSkill(id, updates);
            
            if (activeTab === 'technical') {
                setTechnicalSkills(technicalSkills.map(s => 
                    s.id === id ? { ...s, ...updates } : s
                ));
            } else {
                setProfessionalSkills(professionalSkills.map(s => 
                    s.id === id ? { ...s, ...updates } : s
                ));
            }
            
            success('Skill updated');
        } catch (err) {
            error('Failed to update skill');
        }
    };

    const handleDeleteSkill = async (id) => {
        try {
            await ApiService.deleteSkill(id);
            
            if (activeTab === 'technical') {
                setTechnicalSkills(technicalSkills.filter(s => s.id !== id));
            } else {
                setProfessionalSkills(professionalSkills.filter(s => s.id !== id));
            }
            
            success('Skill deleted');
            loadAnalytics();
        } catch (err) {
            error('Failed to delete skill');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await ApiService.bulkDeleteSkills(selectedSkills);
            
            if (activeTab === 'technical') {
                setTechnicalSkills(technicalSkills.filter(s => !selectedSkills.includes(s.id)));
            } else {
                setProfessionalSkills(professionalSkills.filter(s => !selectedSkills.includes(s.id)));
            }
            
            setSelectedSkills([]);
            success(`Deleted ${selectedSkills.length} skills`);
            loadAnalytics();
        } catch (err) {
            error('Failed to delete skills');
        }
    };

    const handleDuplicateSkill = async (skill) => {
        try {
            const duplicated = {
                ...skill,
                name: `${skill.name} (Copy)`,
                id: undefined,
                createdAt: undefined
            };
            
            const response = await ApiService.addSkill(duplicated);
            
            if (activeTab === 'technical') {
                setTechnicalSkills([...technicalSkills, response.skill]);
            } else {
                setProfessionalSkills([...professionalSkills, response.skill]);
            }
            
            success('Skill duplicated');
        } catch (err) {
            error('Failed to duplicate skill');
        }
    };

    const handleReorderSkills = async (newOrder) => {
        try {
            if (activeTab === 'technical') {
                setTechnicalSkills(newOrder);
            } else {
                setProfessionalSkills(newOrder);
            }
            
            await ApiService.reorderSkills(newOrder.map((s, idx) => ({ id: s.id, order: idx })));
        } catch (err) {
            error('Failed to reorder skills');
        }
    };

    // Import/Export
    const handleExport = () => {
        const currentSkills = activeTab === 'technical' ? technicalSkills : professionalSkills;
        const dataStr = JSON.stringify(currentSkills, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${activeTab}-skills-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        success('Skills exported');
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedSkills = JSON.parse(text);
            
            const createPromises = importedSkills.map(s => {
                const { id, createdAt, updatedAt, ...skillData } = s;
                return ApiService.addSkill({ ...skillData, type: activeTab });
            });
            
            await Promise.all(createPromises);
            await loadSkills();
            success(`Imported ${importedSkills.length} skills`);
        } catch (err) {
            error('Failed to import skills');
        }
    };

    // Helpers
    const resetForm = () => {
        setNewSkill({
            name: '', level: 50, category: 'Frontend', color: '#3b82f6',
            icon: 'fa-solid fa-code', type: 'technical', yearsOfExperience: 0,
            projects: [], certifications: [], learningResources: [],
            visible: true, featured: false, endorsements: 0
        });
    };

    const toggleSkillSelection = (id) => {
        setSelectedSkills(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const selectAllSkills = () => {
        if (selectedSkills.length === filteredSkills.length) {
            setSelectedSkills([]);
        } else {
            setSelectedSkills(filteredSkills.map(s => s.id));
        }
    };

    // Filter and Sort
    const currentSkills = activeTab === 'technical' ? technicalSkills : professionalSkills;
    const filteredSkills = currentSkills
        .filter(skill => {
            if (!showHidden && !skill.visible) return false;
            
            const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
            const matchesLevel = filterLevel === 'all' || 
                (filterLevel === 'beginner' && skill.level < 40) ||
                (filterLevel === 'intermediate' && skill.level >= 40 && skill.level < 70) ||
                (filterLevel === 'advanced' && skill.level >= 70);
            
            return matchesSearch && matchesCategory && matchesLevel;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'level': return b.level - a.level;
                case 'name': return a.name.localeCompare(b.name);
                case 'category': return (a.category || '').localeCompare(b.category || '');
                case 'recent': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'experience': return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
                default: return 0;
            }
        });

    const stats = [
        { 
            label: 'Total Skills', 
            value: technicalSkills.length + professionalSkills.length,
            icon: Code,
            color: 'blue',
            change: '+12%'
        },
        { 
            label: 'Technical', 
            value: technicalSkills.length,
            icon: Zap,
            color: 'purple',
            change: '+8%'
        },
        { 
            label: 'Professional', 
            value: professionalSkills.length,
            icon: Award,
            color: 'green',
            change: '+15%'
        },
        { 
            label: 'Avg Level', 
            value: Math.round(currentSkills.reduce((acc, s) => acc + s.level, 0) / currentSkills.length) || 0,
            icon: TrendingUp,
            color: 'amber',
            suffix: '%',
            change: '+5%'
        }
    ];

    const getLevelBadge = (level) => {
        if (level < 40) return { label: 'Beginner', color: 'bg-blue-500/20 text-blue-500' };
        if (level < 70) return { label: 'Intermediate', color: 'bg-amber-500/20 text-amber-500' };
        return { label: 'Advanced', color: 'bg-green-500/20 text-green-500' };
    };

    return (
        <DashboardLayout
            title="Skills Editor"
            subtitle={`Manage ${currentSkills.length} ${activeTab} skills with AI-powered insights`}
            actions={
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Upload size={16} /> Import
                    </button>

                    <button
                        onClick={handleExport}
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
                        <Plus size={18} /> Add Skill
                    </button>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
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
                                        {stat.value}{stat.suffix}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp size={14} className="text-green-500" />
                                        <span className="text-xs text-green-500 font-semibold">{stat.change}</span>
                                        <span className="text-xs text-gray-500">this month</span>
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

                {/* Tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        {['technical', 'professional'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSelectedSkills([]);
                                }}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                {tab === 'technical' ? <Code size={18} /> : <Award size={18} />}
                                <span className="capitalize">{tab} Skills</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === tab ? 'bg-white/20' : 'bg-white/10'
                                }`}>
                                    {tab === 'technical' ? technicalSkills.length : professionalSkills.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Settings size={16} /> Manage Groups
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {selectedSkills.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl 
                                         flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-blue-500" size={20} />
                                    <span className="font-semibold">{selectedSkills.length} selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            selectedSkills.forEach(id => {
                                                const skill = currentSkills.find(s => s.id === id);
                                                handleUpdateSkill(id, { visible: !skill.visible });
                                            });
                                            setSelectedSkills([]);
                                        }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Toggle Visibility
                                    </button>
                                    <button
                                        onClick={() => {
                                            selectedSkills.forEach(id => {
                                                const skill = currentSkills.find(s => s.id === id);
                                                handleDuplicateSkill(skill);
                                            });
                                            setSelectedSkills([]);
                                        }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Duplicate All
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 
                                                 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Delete All
                                    </button>
                                    <button
                                        onClick={() => setSelectedSkills([])}
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
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                                         placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 
                                             rounded-lg transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            {categoryOptions[activeTab].map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.value}</option>
                            ))}
                        </select>

                        {/* Level Filter */}
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                        >
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner (&lt;40%)</option>
                            <option value="intermediate">Intermediate (40-70%)</option>
                            <option value="advanced">Advanced (&gt;70%)</option>
                        </select>

                        {/* Sort & View */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                            >
                                <option value="level">Highest Level</option>
                                <option value="name">Name A-Z</option>
                                <option value="category">Category</option>
                                <option value="recent">Most Recent</option>
                                <option value="experience">Experience</option>
                            </select>

                            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-all ${
                                        viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'
                                    }`}
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded transition-all ${
                                        viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-white/10'
                                    }`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowHidden(!showHidden)}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
                            >
                                {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                {showHidden ? 'Showing hidden' : 'Hide hidden skills'}
                            </button>
                            <button
                                onClick={selectAllSkills}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all"
                            >
                                <CheckCircle size={16} />
                                {selectedSkills.length === filteredSkills.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <p className="text-sm text-gray-400">
                            Showing {filteredSkills.length} of {currentSkills.length} skills
                        </p>
                    </div>
                </div>

                {/* Skills Display */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
                            <p className="text-gray-400">Loading skills...</p>
                        </div>
                    </div>
                ) : filteredSkills.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <Code size={64} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold mb-2">No skills found</h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery || filterCategory !== 'all' || filterLevel !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Add your first skill to get started'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl 
                                     font-semibold hover:from-blue-700 hover:to-purple-700 transition-all 
                                     shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Add Skill
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <Reorder.Group
                        axis="y"
                        values={filteredSkills}
                        onReorder={handleReorderSkills}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredSkills.map((skill, index) => (
                            <Reorder.Item key={skill.id} value={skill}>
                                <SkillCard
                                    skill={skill}
                                    index={index}
                                    isSelected={selectedSkills.includes(skill.id)}
                                    onToggleSelect={() => toggleSkillSelection(skill.id)}
                                    onUpdate={handleUpdateSkill}
                                    onDelete={handleDeleteSkill}
                                    onDuplicate={handleDuplicateSkill}
                                    getLevelBadge={getLevelBadge}
                                    setSelectedSkill={setSelectedSkill}
                                    setShowResourceModal={setShowResourceModal}
                                />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                ) : (
                    <SkillList
                        skills={filteredSkills}
                        selectedSkills={selectedSkills}
                        onToggleSelect={toggleSkillSelection}
                        onUpdate={handleUpdateSkill}
                        onDelete={handleDeleteSkill}
                        onDuplicate={handleDuplicateSkill}
                        getLevelBadge={getLevelBadge}
                    />
                )}

                {/* Modals */}
                <AddSkillModal
                    show={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    skill={newSkill}
                    setSkill={setNewSkill}
                    onSave={handleAddSkill}
                    activeTab={activeTab}
                    iconOptions={iconOptions}
                    categoryOptions={categoryOptions}
                />

                <AnalyticsModal
                    show={showAnalyticsModal}
                    onClose={() => setShowAnalyticsModal(false)}
                    analytics={analytics}
                    skills={currentSkills}
                />

                <ResourceModal
                    show={showResourceModal}
                    onClose={() => {
                        setShowResourceModal(false);
                        setSelectedSkill(null);
                    }}
                    skill={selectedSkill}
                    onUpdate={handleUpdateSkill}
                />

                <GroupManagementModal
                    show={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    groups={skillGroups}
                    onUpdate={loadSkillGroups}
                />
            </div>
        </DashboardLayout>
    );
};

// Skill Card Component
const SkillCard = ({
    skill, index, isSelected, onToggleSelect, onUpdate, onDelete,
    onDuplicate, getLevelBadge, setSelectedSkill, setShowResourceModal
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const levelBadge = getLevelBadge(skill.level);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative group bg-white/5 backdrop-blur-xl border rounded-2xl p-6 
                       hover:bg-white/10 transition-all ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-white/10'
            } ${!skill.visible ? 'opacity-50' : ''}`}
        >
            {/* Selection & Drag Handle */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <button
                    onClick={onToggleSelect}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 
                             transition-all"
                >
                    {isSelected ? (
                        <CheckCircle className="text-blue-500" size={16} />
                    ) : (
                        <div className="w-4 h-4 border-2 border-white rounded" />
                    )}
                </button>
                <div className="p-2 bg-black/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 
                              transition-all cursor-move">
                    <GripVertical size={16} />
                </div>
            </div>

            {/* Featured/Hidden Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                {skill.featured && (
                    <div className="px-2 py-1 bg-amber-500 rounded-lg flex items-center gap-1 text-white text-xs font-bold">
                        <Star size={12} fill="white" />
                        Featured
                    </div>
                )}
                {!skill.visible && (
                    <div className="px-2 py-1 bg-gray-500 rounded-lg flex items-center gap-1 text-white text-xs font-bold">
                        <EyeOff size={12} />
                        Hidden
                    </div>
                )}
            </div>

            {/* Icon & Header */}
            <div className="flex items-start gap-4 mb-4 mt-8">
                <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{
                        background: `${skill.color}20`,
                        color: skill.color
                    }}
                >
                    <i className={skill.icon}></i>
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => onUpdate(skill.id, 'name', e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                     text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                        />
                    ) : (
                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                            {skill.name}
                        </h3>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        {skill.category && (
                            <span
                                className="px-2 py-1 rounded-lg text-xs font-bold"
                                style={{
                                    background: `${skill.color}25`,
                                    color: skill.color
                                }}
                            >
                                {skill.category}
                            </span>
                        )}
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${levelBadge.color}`}>
                            {levelBadge.label}
                        </span>
                    </div>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
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
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm"
                                >
                                    <Edit3 size={16} /> Edit Name
                                </button>
                                <button
                                    onClick={() => {
                                        onUpdate(skill.id, { featured: !skill.featured });
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm"
                                >
                                    <Star size={16} /> {skill.featured ? 'Unfeature' : 'Feature'}
                                </button>
                                <button
                                    onClick={() => {
                                        onUpdate(skill.id, { visible: !skill.visible });
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm"
                                >
                                    {skill.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {skill.visible ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedSkill(skill);
                                        setShowResourceModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm"
                                >
                                    <BookOpen size={16} /> Resources
                                </button>
                                <button
                                    onClick={() => {
                                        onDuplicate(skill);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm"
                                >
                                    <Copy size={16} /> Duplicate
                                </button>
                                <hr className="border-white/10" />
                                <button
                                    onClick={() => {
                                        onDelete(skill.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                {skill.yearsOfExperience > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <span>{skill.yearsOfExperience} years</span>
                    </div>
                )}
                {skill.projects?.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Briefcase size={14} />
                        <span>{skill.projects.length} projects</span>
                    </div>
                )}
                {skill.certifications?.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Award size={14} />
                        <span>{skill.certifications.length} certs</span>
                    </div>
                )}
                {skill.endorsements > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Users size={14} />
                        <span>{skill.endorsements} endorsements</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400 font-medium">Proficiency</span>
                    <span className="text-lg font-bold" style={{ color: skill.color }}>
                        {skill.level}%
                    </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                            background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`,
                            boxShadow: `0 0 10px ${skill.color}40`
                        }}
                    >
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                animation: 'shimmer 2s infinite'
                            }}
                        />
                    </motion.div>
                </div>

                {/* Level Slider (appears on hover/edit) */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.level}
                        onChange={(e) => onUpdate(skill.id, { level: parseInt(e.target.value) })}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, ${skill.color} 0%, ${skill.color} ${skill.level}%, rgba(255,255,255,0.1) ${skill.level}%, rgba(255,255,255,0.1) 100%)`
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Modal Components
const AddSkillModal = ({ show, onClose, skill, setSkill, onSave, iconOptions, categoryOptions }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Add New Skill</h3>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Skill Name"
                        value={skill.name}
                        onChange={(e) => setSkill({ ...skill, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg"
                    />
                    <select
                        value={skill.category}
                        onChange={(e) => setSkill({ ...skill, category: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg"
                    >
                        <option value="">Select Category</option>
                        {categoryOptions.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="flex gap-4">
                        <button onClick={onSave} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg">
                            Save
                        </button>
                        <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AnalyticsModal = ({ show, onClose, analytics, skills }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Skills Analytics</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400">Total Skills</p>
                        <p className="text-3xl font-bold text-white">{skills.length}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400">Average Level</p>
                        <p className="text-3xl font-bold text-white">
                            {(skills.reduce((acc, s) => acc + s.level, 0) / skills.length || 0).toFixed(1)}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
                    Close
                </button>
            </motion.div>
        </div>
    );
};

const ResourceModal = ({ show, onClose, skill, onUpdate }) => {
    if (!show || !skill) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Resources for {skill.name}</h3>
                <p className="text-slate-400 mb-4">Add learning resources, certifications, and projects</p>
                <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
                    Close
                </button>
            </motion.div>
        </div>
    );
};

const GroupManagementModal = ({ show, onClose, groups, onUpdate }) => {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full"
            >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Manage Skill Groups</h3>
                <p className="text-slate-400 mb-4">Organize your skills into groups</p>
                <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
                    Close
                </button>
            </motion.div>
        </div>
    );
};

export default SkillsEditorEnhanced;