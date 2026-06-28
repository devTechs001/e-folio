import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Music, Camera, Book, Code, Gamepad, Palette, Plane, Bike,
    Coffee, Globe, Star, Trophy, Theater, Headphones, Dumbbell, Compass, Pen,
    Plus, Trash2, Edit3, Search, X, ChevronUp, ChevronDown, AlertCircle,
    Loader, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const ICON_MAP = {
    Heart, Music, Camera, Book, Code, Gamepad, Palette, Plane, Bike,
    Coffee, Globe, Star, Trophy, Theater, Headphones, Dumbbell, Compass, Pen
};

const ICON_NAMES = Object.keys(ICON_MAP);

const CATEGORIES = ['Technology', 'Creative', 'Sports', 'Music', 'Travel', 'Food', 'Reading', 'Gaming', 'Art', 'Science', 'Social', 'Other'];

const emptyForm = {
    name: '',
    description: '',
    icon: 'Heart',
    category: 'Other'
};

const HobbiesManager = () => {
    const { user, isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError } = useNotifications();

    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInterest, setSelectedInterest] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInterests();
    }, []);

    const loadInterests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.getInterests();
            if (response.success && response.interests) {
                setInterests(response.interests);
            } else if (response.success && response.data) {
                setInterests(response.data);
            } else {
                setInterests([]);
            }
        } catch (err) {
            setError(err.message || 'Failed to load interests');
            setInterests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.name.trim()) {
            showError('Please enter a name');
            return;
        }
        try {
            setSubmitting(true);
            const data = {
                title: formData.name,
                name: formData.name,
                description: formData.description,
                icon: `lucide:${formData.icon.toLowerCase()}`,
                iconName: formData.icon,
                category: formData.category
            };
            const response = await ApiService.addInterest(data);
            await loadInterests();
            setShowAddModal(false);
            setFormData({ ...emptyForm });
            success('Hobby added successfully');
        } catch (err) {
            showError(err.message || 'Failed to add hobby');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!formData.name.trim()) {
            showError('Please enter a name');
            return;
        }
        try {
            setSubmitting(true);
            const data = {
                title: formData.name,
                name: formData.name,
                description: formData.description,
                icon: `lucide:${formData.icon.toLowerCase()}`,
                iconName: formData.icon,
                category: formData.category
            };
            await ApiService.updateInterest(selectedInterest.id, data);
            await loadInterests();
            setShowEditModal(false);
            setSelectedInterest(null);
            setFormData({ ...emptyForm });
            success('Hobby updated successfully');
        } catch (err) {
            showError(err.message || 'Failed to update hobby');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedInterest) return;
        try {
            setSubmitting(true);
            await ApiService.deleteInterest(selectedInterest.id);
            await loadInterests();
            setShowDeleteModal(false);
            setSelectedInterest(null);
            success('Hobby deleted successfully');
        } catch (err) {
            showError(err.message || 'Failed to delete hobby');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (interest) => {
        setSelectedInterest(interest);
        setFormData({
            name: interest.title || interest.name || '',
            description: interest.description || '',
            icon: interest.iconName || 'Heart',
            category: interest.category || 'Other'
        });
        setShowEditModal(true);
    };

    const openDelete = (interest) => {
        setSelectedInterest(interest);
        setShowDeleteModal(true);
    };

    const moveItem = (index, direction) => {
        const newList = [...interests];
        const target = index + direction;
        if (target < 0 || target >= newList.length) return;
        [newList[index], newList[target]] = [newList[target], newList[index]];
        setInterests(newList);
    };

    const getIcon = (iconName) => {
        const name = iconName?.replace('lucide:', '');
        const Icon = ICON_MAP[name] || ICON_MAP[Object.keys(ICON_MAP)[0]];
        return Icon;
    };

    const isLucideIcon = (iconStr) => {
        if (!iconStr) return false;
        const name = iconStr.replace('lucide:', '');
        return !!ICON_MAP[name];
    };

    const resolveInterestIcon = (interest) => {
        const iconName = interest.iconName || interest.icon || '';
        if (isLucideIcon(iconName)) {
            const name = iconName.replace('lucide:', '');
            return ICON_MAP[name];
        }
        return ICON_MAP[Object.keys(ICON_MAP)[0]];
    };

    const filteredInterests = useMemo(() => {
        if (!searchQuery.trim()) return interests;
        const q = searchQuery.toLowerCase();
        return interests.filter(i => {
            const title = (i.title || i.name || '').toLowerCase();
            const desc = (i.description || '').toLowerCase();
            const cat = (i.category || '').toLowerCase();
            return title.includes(q) || desc.includes(q) || cat.includes(q);
        });
    }, [interests, searchQuery]);

    const stats = useMemo(() => [
        { label: 'Total Hobbies', value: interests.length, icon: Sparkles, color: 'cyan' },
        { label: 'Categories', value: new Set(interests.map(i => i.category).filter(Boolean)).size, icon: Globe, color: 'purple' },
        { label: 'Visible', value: CATEGORIES.length, icon: Star, color: 'amber' }
    ], [interests]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const renderForm = () => (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <input
                    type="text"
                    placeholder="e.g., Photography, Guitar..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder-slate-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                    placeholder="Tell us about this hobby..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder-slate-500 resize-none"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Icon</label>
                    <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                                 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    >
                        {ICON_NAMES.map(name => {
                            const IconComp = ICON_MAP[name];
                            return (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <span>Preview:</span>
                        {(() => {
                            const IconComp = ICON_MAP[formData.icon];
                            return IconComp ? <IconComp size={20} className="text-cyan-400" /> : null;
                        })()}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                                 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            title="Hobbies & Interests"
            subtitle="Manage your personal interests and hobbies shown on your portfolio"
            actions={
                <button
                    onClick={() => {
                        setFormData({ ...emptyForm });
                        setShowAddModal(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600
                             hover:to-blue-700 rounded-lg font-semibold transition-all shadow-lg
                             shadow-cyan-500/25 flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Add Hobby
                </button>
            }
        >
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4
                                     flex items-center gap-4"
                        >
                            <div className={`p-3 bg-${stat.color === 'cyan' ? 'cyan' : stat.color === 'purple' ? 'purple' : 'amber'}-500/10 rounded-lg`}>
                                <stat.icon className={`text-${stat.color === 'cyan' ? 'cyan' : stat.color === 'purple' ? 'purple' : 'amber'}-400`} size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search hobbies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg
                                     text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                                     focus:border-cyan-500 placeholder-slate-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600 rounded transition-all"
                            >
                                <X size={14} className="text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader className="animate-spin mx-auto mb-4 text-cyan-400" size={48} />
                            <p className="text-slate-400">Loading hobbies...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                        <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Failed to load</h3>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <button
                            onClick={loadInterests}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg
                                     font-semibold transition-all shadow-lg shadow-cyan-500/25"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredInterests.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                        <Heart size={64} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">
                            {searchQuery ? 'No hobbies found' : 'No hobbies yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search'
                                : 'Add your first hobby to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => {
                                    setFormData({ ...emptyForm });
                                    setShowAddModal(true);
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg
                                         font-semibold transition-all shadow-lg shadow-cyan-500/25"
                            >
                                <Plus size={18} className="inline mr-2" />
                                Add Hobby
                            </button>
                        )}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredInterests.map((interest, index) => {
                                const IconComp = resolveInterestIcon(interest);
                                const title = interest.title || interest.name || 'Untitled';
                                const description = interest.description || '';
                                const category = interest.category || 'Other';

                                return (
                                    <motion.div
                                        key={interest.id || index}
                                        layout
                                        variants={itemVariants}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50
                                                 rounded-xl p-5 hover:bg-slate-700/50 transition-all hover:border-slate-600"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-cyan-500/10 rounded-lg flex-shrink-0">
                                                <IconComp size={24} className="text-cyan-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-slate-200 truncate">
                                                    {title}
                                                </h3>
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium
                                                               bg-slate-700/50 text-cyan-400 rounded-full border border-slate-600">
                                                    {category}
                                                </span>
                                            </div>
                                        </div>

                                        {description && (
                                            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                                                {description}
                                            </p>
                                        )}

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => moveItem(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1.5 hover:bg-slate-600 rounded-lg transition-all
                                                             disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronUp size={16} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => moveItem(index, 1)}
                                                    disabled={index === filteredInterests.length - 1}
                                                    className="p-1.5 hover:bg-slate-600 rounded-lg transition-all
                                                             disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronDown size={16} className="text-slate-400" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(interest)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-all text-slate-400
                                                             hover:text-cyan-400"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDelete(interest)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-all text-slate-400
                                                             hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-cyan-400">Add New Hobby</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            {renderForm()}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
                                <button
                                    onClick={handleAdd}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600
                                             hover:from-cyan-600 hover:to-blue-700 rounded-lg font-semibold
                                             transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader size={18} className="animate-spin" />
                                    ) : (
                                        <Plus size={18} />
                                    )}
                                    {submitting ? 'Adding...' : 'Add Hobby'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-cyan-400">Edit Hobby</h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedInterest(null);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            {renderForm()}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
                                <button
                                    onClick={handleEdit}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600
                                             hover:from-cyan-600 hover:to-blue-700 rounded-lg font-semibold
                                             transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader size={18} className="animate-spin" />
                                    ) : (
                                        <Edit3 size={18} />
                                    )}
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedInterest(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteModal && selectedInterest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                        >
                            <div className="text-center">
                                <div className="mx-auto w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle size={28} className="text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-200 mb-2">Delete Hobby</h3>
                                <p className="text-slate-400 mb-2">
                                    Are you sure you want to delete
                                </p>
                                <p className="text-cyan-400 font-semibold mb-6">
                                    "{selectedInterest.title || selectedInterest.name}"?
                                </p>
                                <p className="text-xs text-slate-500 mb-6">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg font-semibold
                                             transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                    {submitting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedInterest(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default HobbiesManager;
