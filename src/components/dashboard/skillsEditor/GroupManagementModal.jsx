// src/components/Dashboard/SkillsEditor/GroupManagementModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit3, Check, Folder } from 'lucide-react';

const GroupManagementModal = ({ show, onClose, groups, onUpdate }) => {
    const [newGroup, setNewGroup] = useState({ name: '', color: '#3b82f6', skills: [] });
    const [editingId, setEditingId] = useState(null);

    if (!show) return null;

    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#f97316', '#a855f7'
    ];

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
                    className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <Folder className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Skill Groups</h3>
                                <p className="text-sm text-gray-400">Organize skills into groups</p>
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
                        {/* Add New Group */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                                <Plus size={18} className="text-blue-500" />
                                Create New Group
                            </h4>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    placeholder="Group name"
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                             focus:ring-blue-500/50"
                                />
                                <div className="flex gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewGroup({ ...newGroup, color })}
                                            className={`w-8 h-8 rounded-lg transition-all ${
                                                newGroup.color === color ? 'ring-2 ring-white' : ''
                                            }`}
                                            style={{ background: color }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        // Add group logic
                                        setNewGroup({ name: '', color: '#3b82f6', skills: [] });
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg 
                                             font-semibold transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Groups List */}
                        <div className="space-y-3">
                            {groups.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                                    <Folder size={48} className="mx-auto mb-3 text-gray-600" />
                                    <p className="text-gray-400">No groups created yet</p>
                                </div>
                            ) : (
                                groups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 
                                                 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{ background: `${group.color}20` }}
                                                >
                                                    <Folder size={20} style={{ color: group.color }} />
                                                </div>
                                                {editingId === group.id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={group.name}
                                                        onBlur={(e) => {
                                                            // Update group name
                                                            setEditingId(null);
                                                        }}
                                                        className="px-3 py-1 bg-white/5 border border-white/10 rounded 
                                                                 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div>
                                                        <h4 className="font-semibold text-white">{group.name}</h4>
                                                        <p className="text-xs text-gray-400">
                                                            {group.skills?.length || 0} skills
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingId(group.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Delete group
                                                    }}
                                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GroupManagementModal;