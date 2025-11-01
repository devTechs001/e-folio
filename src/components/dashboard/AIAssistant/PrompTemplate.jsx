// src/components/Dashboard/AIAssistant/PromptTemplates.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Search, Star, Copy, Edit3, Trash2,
    Tag, Users, TrendingUp, X, Check, Bookmark, Share2
} from 'lucide-react';
import ApiService from '../../../services/api.service';

const PromptTemplates = ({ onUseTemplate, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateVariables, setTemplateVariables] = useState({});

    const categories = [
        { value: 'all', label: 'All Templates', icon: FileText },
        { value: 'coding', label: 'Coding', icon: FileText },
        { value: 'writing', label: 'Writing', icon: FileText },
        { value: 'analysis', label: 'Analysis', icon: TrendingUp },
        { value: 'creative', label: 'Creative', icon: Star },
        { value: 'business', label: 'Business', icon: Users }
    ];

    useEffect(() => {
        loadTemplates();
    }, [selectedCategory]);

    const loadTemplates = async () => {
        try {
            const response = await ApiService.getPromptTemplates({
                category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setTemplates(response.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
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

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/10 p-4 space-y-2">
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
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Search */}
                        <div className="relative mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Templates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => (
                                <motion.div
                                    key={template.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer"
                                    onClick={() => handleUseTemplate(template)}
                                >
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
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className="text-center py-20">
                                <FileText size={64} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-gray-400">No templates found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variable Input Modal */}
                <AnimatePresence>
                    {selectedTemplate && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
            </motion.div>
        </div>
    );
};

export default PromptTemplates;