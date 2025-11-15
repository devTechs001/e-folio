// src/components/Dashboard/AIAssistant/PromptTemplates.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Search, Star, Copy, Edit3, Trash2,
    Tag, Users, TrendingUp, X, Check, Bookmark, Share2,
    Heart, Filter, SortDesc, Clock, Zap, Download, Upload,
    Grid, List, Book
} from 'lucide-react';
import ApiService from '../../../services/api.service';

const PromptTemplates = ({ onUseTemplate, onClose, currentUser }) => {
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateVariables, setTemplateVariables] = useState({});
    const [sortBy, setSortBy] = useState('popular'); // popular, newest, rating
    const [favorites, setFavorites] = useState(new Set());
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [tagsFilter, setTagsFilter] = useState([]);
    const [difficultyFilter, setDifficultyFilter] = useState('all'); // all, beginner, intermediate, advanced
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const categories = [
        { value: 'all', label: 'All Templates', icon: FileText },
        { value: 'coding', label: 'Coding', icon: FileText },
        { value: 'writing', label: 'Writing', icon: FileText },
        { value: 'analysis', label: 'Analysis', icon: TrendingUp },
        { value: 'creative', label: 'Creative', icon: Star },
        { value: 'business', label: 'Business', icon: Users },
        { value: 'education', label: 'Education', icon: Book },
        { value: 'research', label: 'Research', icon: Search },
        { value: 'productivity', label: 'Productivity', icon: Zap }
    ];

    const difficultyLevels = [
        { value: 'all', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    useEffect(() => {
        loadTemplates();
        loadUserPreferences();
    }, [selectedCategory, sortBy, tagsFilter, difficultyFilter]);

    const loadTemplates = async () => {
        try {
            const response = await ApiService.getPromptTemplates({
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                sortBy: sortBy,
                tags: tagsFilter.length > 0 ? tagsFilter : undefined,
                difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined
            });
            setTemplates(response.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };

    const loadUserPreferences = async () => {
        try {
            // Load user favorites
            const response = await ApiService.getUserFavorites();
            if (response.favorites) {
                setFavorites(new Set(response.favorites));
            }
        } catch (err) {
            console.error('Error loading user preferences:', err);
        }
    };

    const handleUseTemplate = (template) => {
        if (template.variables.length > 0) {
            setSelectedTemplate(template);
            // Initialize variables
            const vars = {};
            template.variables.forEach(v => {
                vars[v.name] = v.defaultValue || '';
            });
            setTemplateVariables(vars);
        } else {
            onUseTemplate(template.template);
            onClose();
        }
        
        // Track usage
        trackTemplateUsage(template.id);
    };

    const applyTemplate = () => {
        let prompt = selectedTemplate.template;
        
        // Replace variables
        Object.keys(templateVariables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            prompt = prompt.replace(regex, templateVariables[key]);
        });

        onUseTemplate(prompt);
        setSelectedTemplate(null);
        onClose();
    };

    const trackTemplateUsage = async (templateId) => {
        try {
            await ApiService.trackTemplateUsage(templateId);
        } catch (err) {
            console.error('Error tracking template usage:', err);
        }
    };

    const toggleFavorite = async (templateId) => {
        try {
            const newFavorites = new Set(favorites);
            if (newFavorites.has(templateId)) {
                newFavorites.delete(templateId);
                await ApiService.removeFavorite(templateId);
            } else {
                newFavorites.add(templateId);
                await ApiService.addFavorite(templateId);
            }
            setFavorites(newFavorites);
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Show notification (would be implemented in a real app)
    };

    const exportTemplates = async () => {
        try {
            const response = await ApiService.exportTemplates();
            const blob = new Blob([JSON.stringify(response.templates, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt-templates-export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting templates:', err);
        }
    };

    const importTemplates = async (file) => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const templatesData = JSON.parse(e.target.result);
                    await ApiService.importTemplates(templatesData);
                    loadTemplates(); // Refresh templates
                    setShowImportModal(false);
                } catch (err) {
                    console.error('Error importing templates:', err);
                }
            };
            reader.readAsText(file);
        } catch (err) {
            console.error('Error reading file:', err);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
        const matchesTags = tagsFilter.length === 0 || 
            tagsFilter.every(tag => t.tags?.includes(tag));
            
        const matchesDifficulty = difficultyFilter === 'all' || 
            t.difficulty === difficultyFilter;
            
        return matchesSearch && matchesTags && matchesDifficulty;
    });

    // Sort templates
    const sortedTemplates = [...filteredTemplates].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'rating':
                return b.rating.average - a.rating.average;
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            case 'popular':
            default:
                return b.usageCount - a.usageCount;
        }
    });

    // Extract unique tags
    const allTags = [...new Set(templates.flatMap(t => t.tags || []))];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Prompt Templates</h2>
                        <p className="text-sm text-gray-400">Use pre-built prompts to get started quickly</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="Import templates"
                        >
                            <Upload size={20} />
                        </button>
                        <button
                            onClick={exportTemplates}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            title="Export templates"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Template
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        >
                            {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>

                        {/* Tags Filter */}
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    setTagsFilter([...tagsFilter, e.target.value]);
                                    e.target.value = '';
                                }
                            }}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        >
                            <option value="">Filter by tag</option>
                            {allTags.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag}
                                </option>
                            ))}
                        </select>

                        {/* Difficulty Filter */}
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        >
                            {difficultyLevels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        >
                            <option value="popular">Most Popular</option>
                            <option value="newest">Newest</option>
                            <option value="rating">Highest Rated</option>
                            <option value="alphabetical">Alphabetical</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex border border-white/10 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500' : 'bg-white/5'} transition-all`}
                                title="Grid view"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500' : 'bg-white/5'} transition-all`}
                                title="List view"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Active Tags Filter */}
                    {tagsFilter.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {tagsFilter.map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-2">
                                    {tag}
                                    <button 
                                        onClick={() => setTagsFilter(tagsFilter.filter(t => t !== tag))}
                                        className="hover:bg-white/20 rounded-full p-1"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <button 
                                onClick={() => setTagsFilter([])}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/10 p-4 space-y-2 overflow-y-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                    selectedCategory === cat.value
                                        ? 'bg-blue-500/20 border-2 border-blue-500'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <cat.icon size={18} />
                                <span className="font-medium">{cat.label}</span>
                            </button>
                        ))}

                        {/* Favorites Section */}
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-semibold mb-2 text-gray-400 uppercase tracking-wider">Saved</h3>
                            <button
                                onClick={() => setSelectedCategory('favorites')}
                                className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                    selectedCategory === 'favorites'
                                        ? 'bg-rose-500/20 border-2 border-rose-500'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <Heart size={18} className="text-rose-500" />
                                <span className="font-medium">Favorites</span>
                                <span className="ml-auto text-xs bg-rose-500/20 text-rose-400 rounded-full px-2 py-1">
                                    {favorites.size}
                                </span>
                            </button>
                        </div>

                        {/* My Templates Section */}
                        <button
                            onClick={() => setSelectedCategory('my-templates')}
                            className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                selectedCategory === 'my-templates'
                                    ? 'bg-purple-500/20 border-2 border-purple-500'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            <Users size={18} className="text-purple-500" />
                            <span className="font-medium">My Templates</span>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Templates Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedTemplates.map((template) => (
                                    <motion.div
                                        key={template.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer relative"
                                        onClick={() => handleUseTemplate(template)}
                                    >
                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(template.id);
                                            }}
                                            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-all"
                                        >
                                            <Heart 
                                                size={16} 
                                                className={favorites.has(template.id) ? 'text-rose-500 fill-current' : 'text-gray-400'} 
                                            />
                                        </button>

                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold mb-1">{template.title}</h3>
                                                <p className="text-sm text-gray-400 line-clamp-2">
                                                    {template.description}
                                                </p>
                                            </div>
                                            {template.featured && (
                                                <Star className="text-amber-500" size={18} fill="#f59e0b" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                                {template.category}
                                            </span>
                                            {template.difficulty && (
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                                    template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {template.difficulty}
                                                </span>
                                            )}
                                            {template.tags?.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    {template.usageCount}
                                                </span>
                                                {template.rating.count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star size={12} />
                                                        {template.rating.average.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className="space-y-3">
                                {sortedTemplates.map((template) => (
                                    <motion.div
                                        key={template.id}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer relative flex items-center gap-4"
                                        onClick={() => handleUseTemplate(template)}
                                    >
                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(template.id);
                                            }}
                                            className="p-1.5 hover:bg-white/20 rounded-full transition-all"
                                        >
                                            <Heart 
                                                size={16} 
                                                className={favorites.has(template.id) ? 'text-rose-500 fill-current' : 'text-gray-400'} 
                                            />
                                        </button>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold">{template.title}</h3>
                                                    <p className="text-sm text-gray-400 line-clamp-1">
                                                        {template.description}
                                                    </p>
                                                </div>
                                                {template.featured && (
                                                    <Star className="text-amber-500" size={16} fill="#f59e0b" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                                    {template.category}
                                                </span>
                                                {template.difficulty && (
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                                        template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {template.difficulty}
                                                    </span>
                                                )}
                                                {template.tags?.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end text-xs text-gray-500 min-w-[120px]">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    {template.usageCount}
                                                </span>
                                                {template.rating.count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star size={12} />
                                                        {template.rating.average.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {sortedTemplates.length === 0 && (
                            <div className="text-center py-20">
                                <FileText size={64} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-400">No templates found</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create Your First Template
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variable Input Modal */}
                <AnimatePresence>
                    {selectedTemplate && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            >
                                <h3 className="text-xl font-bold mb-4">Fill Template Variables</h3>
                                
                                <div className="space-y-4 mb-6">
                                    {selectedTemplate.variables.map((variable) => (
                                        <div key={variable.name}>
                                            <label className="block text-sm font-semibold mb-2">
                                                {variable.name}
                                                {variable.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            {variable.description && (
                                                <p className="text-xs text-gray-400 mb-2">{variable.description}</p>
                                            )}
                                            
                                            {variable.type === 'textarea' ? (
                                                <textarea
                                                    value={templateVariables[variable.name] || ''}
                                                    onChange={(e) => setTemplateVariables({
                                                        ...templateVariables,
                                                        [variable.name]: e.target.value
                                                    })}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            ) : variable.type === 'select' ? (
                                                <select
                                                    value={templateVariables[variable.name] || ''}
                                                    onChange={(e) => setTemplateVariables({
                                                        ...templateVariables,
                                                        [variable.name]: e.target.value
                                                    })}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                >
                                                    <option value="">Select...</option>
                                                    {variable.options?.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={variable.type}
                                                    value={templateVariables[variable.name] || ''}
                                                    onChange={(e) => setTemplateVariables({
                                                        ...templateVariables,
                                                        [variable.name]: e.target.value
                                                    })}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={applyTemplate}
                                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all"
                                    >
                                        Use Template
                                    </button>
                                    <button
                                        onClick={() => {
                                            copyToClipboard(selectedTemplate.template);
                                            // Show notification (would be implemented in a real app)
                                        }}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all flex items-center gap-2"
                                        title="Copy raw template"
                                    >
                                        <Copy size={18} />
                                        Copy Raw
                                    </button>
                                    <button
                                        onClick={() => setSelectedTemplate(null)}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Import Modal */}
                <AnimatePresence>
                    {showImportModal && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
                            >
                                <h3 className="text-xl font-bold mb-4">Import Templates</h3>
                                <p className="text-gray-400 mb-6">
                                    Upload a JSON file containing prompt templates to import them into your library.
                                </p>
                                
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center mb-6">
                                    <Upload size={48} className="mx-auto mb-4 text-gray-500" />
                                    <p className="text-gray-400 mb-4">
                                        Drag & drop your template file here, or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                importTemplates(e.target.files[0]);
                                            }
                                        }}
                                        className="hidden"
                                        id="import-file"
                                    />
                                    <label
                                        htmlFor="import-file"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all cursor-pointer"
                                    >
                                        Choose File
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowImportModal(false)}
                                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default PromptTemplates;