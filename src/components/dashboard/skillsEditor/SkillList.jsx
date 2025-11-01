// src/components/Dashboard/SkillsEditor/SkillList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle, Edit3, Trash2, Copy, Star, Eye, EyeOff, 
    Clock, Briefcase, Award, Users, GripVertical 
} from 'lucide-react';

const SkillList = ({ 
    skills, selectedSkills, onToggleSelect, onUpdate, 
    onDelete, onDuplicate, getLevelBadge 
}) => {
    return (
        <div className="space-y-3">
            {skills.map((skill, index) => {
                const levelBadge = getLevelBadge(skill.level);
                const isSelected = selectedSkills.includes(skill.id);

                return (
                    <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`relative group bg-white/5 backdrop-blur-xl border rounded-xl p-4 
                                   hover:bg-white/10 transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-white/10'
                        } ${!skill.visible ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            {/* Selection Checkbox */}
                            <button
                                onClick={() => onToggleSelect(skill.id)}
                                className="flex-shrink-0"
                            >
                                {isSelected ? (
                                    <CheckCircle className="text-blue-500" size={20} />
                                ) : (
                                    <div className="w-5 h-5 border-2 border-gray-400 rounded hover:border-blue-500 transition-all" />
                                )}
                            </button>

                            {/* Drag Handle */}
                            <div className="flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100 transition-all">
                                <GripVertical size={20} className="text-gray-400" />
                            </div>

                            {/* Icon */}
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                style={{
                                    background: `${skill.color}20`,
                                    color: skill.color
                                }}
                            >
                                <i className={skill.icon}></i>
                            </div>

                            {/* Skill Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-base font-bold text-white truncate">
                                        {skill.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {skill.category && (
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
                                                style={{
                                                    background: `${skill.color}25`,
                                                    color: skill.color
                                                }}
                                            >
                                                {skill.category}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelBadge.color}`}>
                                            {levelBadge.label}
                                        </span>
                                        {skill.featured && (
                                            <Star size={14} className="text-amber-500" fill="#f59e0b" />
                                        )}
                                        {!skill.visible && (
                                            <EyeOff size={14} className="text-gray-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    {skill.yearsOfExperience > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {skill.yearsOfExperience}y
                                        </div>
                                    )}
                                    {skill.projects?.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Briefcase size={12} />
                                            {skill.projects.length}
                                        </div>
                                    )}
                                    {skill.certifications?.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Award size={12} />
                                            {skill.certifications.length}
                                        </div>
                                    )}
                                    {skill.endorsements > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Users size={12} />
                                            {skill.endorsements}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-48 flex-shrink-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-400">Level</span>
                                    <span className="text-sm font-bold" style={{ color: skill.color }}>
                                        {skill.level}%
                                    </span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${skill.level}%`,
                                            background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`,
                                            boxShadow: `0 0 8px ${skill.color}40`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => onUpdate(skill.id, { featured: !skill.featured })}
                                    className={`p-2 rounded-lg transition-all ${
                                        skill.featured
                                            ? 'bg-amber-500/20 text-amber-500'
                                            : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                    title={skill.featured ? 'Unfeature' : 'Feature'}
                                >
                                    <Star size={16} fill={skill.featured ? '#f59e0b' : 'none'} />
                                </button>
                                <button
                                    onClick={() => onUpdate(skill.id, { visible: !skill.visible })}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                    title={skill.visible ? 'Hide' : 'Show'}
                                >
                                    {skill.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => onDuplicate(skill)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                    title="Duplicate"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete(skill.id)}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SkillList;