// src/components/Dashboard/SkillsEditor/ResourceModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, BookOpen, ExternalLink, Calendar } from 'lucide-react';

const ResourceModal = ({ show, onClose, skill, onUpdate }) => {
    const [newResource, setNewResource] = useState({ 
        title: '', 
        url: '', 
        type: 'article',
        completedDate: '' 
    });

    if (!show || !skill) return null;

    const handleAddResource = () => {
        if (newResource.title.trim() && newResource.url.trim()) {
            const updatedResources = [
                ...(skill.learningResources || []),
                { ...newResource, addedAt: new Date().toISOString() }
            ];
            onUpdate(skill.id, { learningResources: updatedResources });
            setNewResource({ title: '', url: '', type: 'article', completedDate: '' });
        }
    };

    const handleRemoveResource = (index) => {
        const updatedResources = skill.learningResources.filter((_, i) => i !== index);
        onUpdate(skill.id, { learningResources: updatedResources });
    };

    return (
        <AnimatePresence>
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{
                                    background: `${skill.color}20`,
                                    color: skill.color
                                }}
                            >
                                <i className={skill.icon}></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{skill.name}</h3>
                                <p className="text-sm text-gray-400">Learning Resources</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Add New Resource */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                                <Plus size={18} className="text-blue-500" />
                                Add Learning Resource
                            </h4>
                            <input
                                type="text"
                                value={newResource.title}
                                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                placeholder="Resource title"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                         focus:ring-blue-500/50"
                            />
                            <input
                                type="url"
                                value={newResource.url}
                                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                         focus:ring-blue-500/50"
                            />
                            <div className="flex gap-3">
                                <select
                                    value={newResource.type}
                                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="article">Article</option>
                                    <option value="video">Video</option>
                                    <option value="course">Course</option>
                                    <option value="book">Book</option>
                                    <option value="documentation">Documentation</option>
                                </select>
                                <input
                                    type="date"
                                    value={newResource.completedDate}
                                    onChange={(e) => setNewResource({ ...newResource, completedDate: e.target.value })}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <button
                                onClick={handleAddResource}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg 
                                         font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Add Resource
                            </button>
                        </div>

                        {/* Resources List */}
                        <div>
                            <h4 className="font-semibold text-white mb-3">
                                Saved Resources ({skill.learningResources?.length || 0})
                            </h4>
                            {!skill.learningResources || skill.learningResources.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                    <BookOpen size={48} className="mx-auto mb-3 text-gray-600" />
                                    <p className="text-gray-400">No resources added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {skill.learningResources.map((resource, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white/5 border border-white/10 rounded-xl p-4 
                                                     hover:bg-white/10 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <BookOpen size={18} className="text-blue-500 flex-shrink-0 mt-1" />
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-semibold text-white mb-1">
                                                                {resource.title}
                                                            </h5>
                                                            <a
                                                                href={resource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-400 hover:underline 
                                                                         flex items-center gap-1 truncate"
                                                            >
                                                                <span className="truncate">{resource.url}</span>
                                                                <ExternalLink size={12} className="flex-shrink-0" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="px-2 py-1 bg-white/5 rounded capitalize">
                                                            {resource.type}
                                                        </span>
                                                        {resource.completedDate && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                Completed: {new Date(resource.completedDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveResource(idx)}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 
                                                             text-red-500 rounded-lg transition-all flex-shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ResourceModal;