// src/components/Dashboard/SkillsEditor/AddSkillModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Trash2, Link as LinkIcon, Award, BookOpen } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const AddSkillModal = ({ 
    show, onClose, skill, setSkill, onSave, activeTab, 
    iconOptions, categoryOptions 
}) => {
    const { theme } = useTheme();
    const [newCertification, setNewCertification] = useState('');
    const [newResource, setNewResource] = useState({ title: '', url: '' });

    if (!show) return null;

    const handleAddCertification = () => {
        if (newCertification.trim()) {
            setSkill({
                ...skill,
                certifications: [...(skill.certifications || []), newCertification]
            });
            setNewCertification('');
        }
    };

    const handleAddResource = () => {
        if (newResource.title.trim() && newResource.url.trim()) {
            setSkill({
                ...skill,
                learningResources: [...(skill.learningResources || []), newResource]
            });
            setNewResource({ title: '', url: '' });
        }
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
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Add New Skill</h3>
                            <p className="text-sm text-gray-400">
                                Add a {activeTab} skill to your portfolio
                            </p>
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
                        {/* Skill Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Skill Name *
                            </label>
                            <input
                                type="text"
                                value={skill.name}
                                onChange={(e) => setSkill({ ...skill, name: e.target.value })}
                                placeholder="e.g., React, Leadership, Python"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                         focus:ring-blue-500/50 transition-all"
                            />
                        </div>

                        {/* Icon Selection (Technical only) */}
                        {activeTab === 'technical' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Icon
                                </label>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10">
                                    {iconOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSkill({ 
                                                ...skill, 
                                                icon: option.value, 
                                                color: option.color 
                                            })}
                                            className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                                                skill.icon === option.value
                                                    ? 'ring-2 ring-blue-500'
                                                    : 'hover:bg-white/10'
                                            }`}
                                            style={{
                                                background: skill.icon === option.value 
                                                    ? `${option.color}30` 
                                                    : 'transparent',
                                                color: option.color
                                            }}
                                            title={option.label}
                                        >
                                            <i className={option.value}></i>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Category *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categoryOptions[activeTab].map((cat) => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setSkill({ 
                                            ...skill, 
                                            category: cat.value,
                                            color: cat.color 
                                        })}
                                        className={`p-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                            skill.category === cat.value
                                                ? 'ring-2'
                                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                        }`}
                                        style={{
                                            background: skill.category === cat.value 
                                                ? `${cat.color}30` 
                                                : undefined,
                                            color: skill.category === cat.value 
                                                ? cat.color 
                                                : undefined,
                                            borderColor: skill.category === cat.value 
                                                ? cat.color 
                                                : undefined
                                        }}
                                    >
                                        <i className={cat.icon}></i>
                                        <span className="text-sm">{cat.value}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Proficiency Level */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-semibold text-gray-300">
                                    Proficiency Level
                                </label>
                                <span className="text-2xl font-bold" style={{ color: skill.color }}>
                                    {skill.level}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={skill.level}
                                onChange={(e) => setSkill({ ...skill, level: parseInt(e.target.value) })}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, ${skill.color} 0%, ${skill.color} ${skill.level}%, rgba(255,255,255,0.1) ${skill.level}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Beginner</span>
                                <span>Intermediate</span>
                                <span>Advanced</span>
                            </div>
                        </div>

                        {/* Years of Experience */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={skill.yearsOfExperience || 0}
                                    onChange={(e) => setSkill({ 
                                        ...skill, 
                                        yearsOfExperience: parseInt(e.target.value) || 0 
                                    })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Endorsements
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={skill.endorsements || 0}
                                    onChange={(e) => setSkill({ 
                                        ...skill, 
                                        endorsements: parseInt(e.target.value) || 0 
                                    })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Certifications */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Certifications
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newCertification}
                                    onChange={(e) => setNewCertification(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                                    placeholder="Add certification name"
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                             focus:ring-blue-500/50 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCertification}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium 
                                             transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                            {skill.certifications?.length > 0 && (
                                <div className="space-y-2">
                                    {skill.certifications.map((cert, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-white/5 border 
                                                     border-white/10 rounded-lg group hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Award size={16} className="text-amber-500" />
                                                <span className="text-sm">{cert}</span>
                                            </div>
                                            <button
                                                onClick={() => setSkill({
                                                    ...skill,
                                                    certifications: skill.certifications.filter((_, i) => i !== idx)
                                                })}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 
                                                         text-red-500 rounded transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Learning Resources */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Learning Resources
                            </label>
                            <div className="space-y-2 mb-3">
                                <input
                                    type="text"
                                    value={newResource.title}
                                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                    placeholder="Resource title"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                             focus:ring-blue-500/50 text-sm"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newResource.url}
                                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddResource()}
                                        placeholder="https://..."
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                                 text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                                 focus:ring-blue-500/50 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddResource}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium 
                                                 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            </div>
                            {skill.learningResources?.length > 0 && (
                                <div className="space-y-2">
                                    {skill.learningResources.map((resource, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-white/5 border 
                                                     border-white/10 rounded-lg group hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <BookOpen size={16} className="text-blue-500 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{resource.title}</p>
                                                    <a
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-400 hover:underline truncate block"
                                                    >
                                                        {resource.url}
                                                    </a>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSkill({
                                                    ...skill,
                                                    learningResources: skill.learningResources.filter((_, i) => i !== idx)
                                                })}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 
                                                         text-red-500 rounded transition-all flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Visibility Options */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={skill.visible}
                                    onChange={(e) => setSkill({ ...skill, visible: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-600 
                                             focus:ring-2 focus:ring-blue-500/50"
                                />
                                <span className="text-sm font-medium">Visible on portfolio</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={skill.featured}
                                    onChange={(e) => setSkill({ ...skill, featured: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-600 
                                             focus:ring-2 focus:ring-blue-500/50"
                                />
                                <span className="text-sm font-medium">Featured skill</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6 flex gap-3">
                        <button
                            onClick={onSave}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                                     hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold 
                                     transition-all shadow-lg shadow-blue-500/25 flex items-center 
                                     justify-center gap-2"
                        >
                            <Check size={18} /> Add Skill
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 
                                     rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddSkillModal;