import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Music, Camera, Book, Code, Gamepad, Palette, Plane, Bike,
    Coffee, Globe, Star, Trophy, Theater, Headphones, Dumbbell, Compass, Pen,
    Plus, Trash2, Edit3, Search, X, ChevronUp, ChevronDown, AlertCircle,
    Loader, Sparkles, Eye, EyeOff, Download, Upload, GripVertical, Filter,
    BarChart3, RefreshCw, Save, CheckCircle2
} from 'lucide-react';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const ICON_MAP = {
    Heart, Music, Camera, Book, Code, Gamepad, Palette, Plane, Bike,
    Coffee, Globe, Star, Trophy, Theater, Headphones, Dumbbell, Compass, Pen
};

const ICON_NAMES = Object.keys(ICON_MAP);

const CATEGORIES = ['Technology', 'Creative', 'Sports', 'Music', 'Travel', 'Food', 'Reading', 'Gaming', 'Art', 'Science', 'Social', 'Other'];

const LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
];

const emptyForm = {
    name: '',
    description: '',
    icon: 'Heart',
    category: 'Other',
    level: 'intermediate',
    tags: '',
    startedYear: ''
};

const VISIBILITY_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' }
];

const HobbiesManager = () => {
    const { success, error: showError } = useNotifications();

    const [interests, setInterests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [visibilityFilter, setVisibilityFilter] = useState('all');
    const [showAnalytics, setShowAnalytics] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInterest, setSelectedInterest] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);

    // Reorder is applied locally while dragging and persisted explicitly, so a
    // mis-drop can be undone with "Discard" instead of guessing the old order.
    const [orderDirty, setOrderDirty] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [draggingId, setDraggingId] = useState(null);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const importRef = useRef(null);

    useEffect(() => {
        loadInterests();
        loadStats();
    }, []);

    const loadInterests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.getInterests();
            const list = response.interests || response.data || [];
            setInterests(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.message || 'Failed to load interests');
            setInterests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await ApiService.getInterestStats();
            if (response.success && response.stats) setStats(response.stats);
        } catch {
            // The summary is supplementary: a failure leaves the cards blank
            // rather than blocking the manager.
            setStats(null);
        }
    };

    const refresh = async () => {
        await Promise.all([loadInterests(), loadStats()]);
    };

    const toPayload = (form) => ({
        // `title` is still sent for older backends that read it; `name` is the
        // field the model actually validates.
        title: form.name,
        name: form.name,
        description: form.description,
        icon: `lucide:${String(form.icon).toLowerCase()}`,
        iconName: form.icon,
        category: form.category,
        level: form.level,
        tags: form.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        startedYear: form.startedYear ? Number(form.startedYear) : undefined
    });

    const handleAdd = async () => {
        if (!formData.name.trim()) {
            showError('Please enter a name');
            return;
        }
        try {
            setSubmitting(true);
            await ApiService.addInterest(toPayload(formData));
            await refresh();
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
            await ApiService.updateInterest(selectedInterest.id, toPayload(formData));
            await refresh();
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
            await refresh();
            setShowDeleteModal(false);
            setSelectedInterest(null);
            success('Hobby deleted successfully');
        } catch (err) {
            showError(err.message || 'Failed to delete hobby');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleVisibility = async (interest) => {
        const next = interest.visible === false;
        // Optimistic: the pill flips immediately, and reverts if the API fails.
        setInterests(current =>
            current.map(item => (item.id === interest.id ? { ...item, visible: next } : item))
        );
        try {
            await ApiService.setInterestVisibility(interest.id, next);
            success(next ? 'Hobby is visible on your portfolio' : 'Hobby hidden from visitors');
            loadStats();
        } catch (err) {
            setInterests(current =>
                current.map(item => (item.id === interest.id ? { ...item, visible: !next } : item))
            );
            showError(err.message || 'Could not change visibility');
        }
    };

    const openEdit = (interest) => {
        setSelectedInterest(interest);
        setFormData({
            name: interest.title || interest.name || '',
            description: interest.description || '',
            icon: interest.iconName || 'Heart',
            category: interest.category || 'Other',
            level: interest.level || 'intermediate',
            tags: Array.isArray(interest.tags) ? interest.tags.join(', ') : '',
            startedYear: interest.startedYear ? String(interest.startedYear) : ''
        });
        setShowEditModal(true);
    };

    const openDelete = (interest) => {
        setSelectedInterest(interest);
        setShowDeleteModal(true);
    };

    // ------------------------------------------------------ ordering ---

    const moveItem = (index, direction) => {
        const sourceIndex = interests.findIndex(item => item.id === filteredInterests[index]?.id);
        if (sourceIndex < 0) return;
        const target = sourceIndex + direction;
        if (target < 0 || target >= interests.length) return;
        const next = [...interests];
        [next[sourceIndex], next[target]] = [next[target], next[sourceIndex]];
        setInterests(next);
        setOrderDirty(true);
    };

    const handleDrop = (droppedId) => {
        if (!draggingId || draggingId === droppedId) {
            setDraggingId(null);
            return;
        }
        const from = interests.findIndex(item => item.id === draggingId);
        const to = interests.findIndex(item => item.id === droppedId);
        if (from < 0 || to < 0) {
            setDraggingId(null);
            return;
        }
        const next = [...interests];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setInterests(next);
        setOrderDirty(true);
        setDraggingId(null);
    };

    const persistOrder = async () => {
        try {
            setSavingOrder(true);
            await ApiService.reorderInterests(
                interests.map((item, index) => ({ id: item.id, order: index }))
            );
            setOrderDirty(false);
            success('Order saved — the portfolio uses it too');
        } catch (err) {
            showError(err.message || 'Could not save the new order');
        } finally {
            setSavingOrder(false);
        }
    };

    const discardOrder = () => {
        setOrderDirty(false);
        loadInterests();
    };

    // -------------------------------------------------- import/export ---

    const exportJson = async () => {
        try {
            setExporting(true);
            const response = await ApiService.exportInterests();
            const payload = response.success ? response : { hobbies: interests };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `hobbies-${new Date().toISOString().slice(0, 10)}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            success('Hobbies exported');
        } catch (err) {
            showError(err.message || 'Could not export hobbies');
        } finally {
            setExporting(false);
        }
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const list = Array.isArray(parsed) ? parsed : parsed.hobbies || parsed.data;
            if (!Array.isArray(list) || !list.length) {
                throw new Error('No hobbies found in that file');
            }
            const response = await ApiService.importInterests(list);
            await refresh();
            const imported = response.imported ?? 0;
            const skipped = response.skipped ?? 0;
            if (imported) {
                success(
                    `Imported ${imported} ${imported === 1 ? 'hobby' : 'hobbies'}` +
                    (skipped ? ` · ${skipped} skipped` : '')
                );
            } else {
                showError('Nothing was imported — those hobbies already exist');
            }
        } catch (err) {
            showError(err.message || 'That file is not a hobbies export');
        } finally {
            setImporting(false);
            if (importRef.current) importRef.current.value = '';
        }
    };

    // -------------------------------------------------------- helpers ---

    const getIcon = (iconName) => {
        const name = iconName?.replace('lucide:', '');
        const Icon = ICON_MAP[name] || ICON_MAP[Object.keys(ICON_MAP)[0]];
        return Icon;
    };

    const resolveInterestIcon = (interest) => {
        const iconName = interest.iconName || interest.icon || '';
        return getIcon(iconName);
    };

    const filteredInterests = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return interests.filter(item => {
            if (categoryFilter !== 'all' && (item.category || 'Other') !== categoryFilter) return false;
            if (visibilityFilter === 'visible' && item.visible === false) return false;
            if (visibilityFilter === 'hidden' && item.visible !== false) return false;
            if (!q) return true;
            return [item.name, item.title, item.description, item.category, ...(item.tags || [])]
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(q));
        });
    }, [interests, searchQuery, categoryFilter, visibilityFilter]);

    const usedCategories = useMemo(
        () => [...new Set(interests.map(item => item.category).filter(Boolean))].sort(),
        [interests]
    );

    const statCards = useMemo(() => {
        const hidden = interests.filter(item => item.visible === false).length;
        const byCategory = new Set(interests.map(item => item.category).filter(Boolean)).size;
        const average = stats?.averageLevel
            ?? (interests.length
                ? Math.round(interests.reduce((sum, item) => sum + (item.levelScore || 60), 0) / interests.length)
                : 0);
        return [
            { label: 'Total Hobbies', value: interests.length, icon: Sparkles, tone: 'cyan' },
            { label: 'Categories', value: byCategory, icon: Globe, tone: 'purple' },
            { label: 'Hidden', value: hidden, icon: hidden ? EyeOff : Eye, tone: 'amber' },
            { label: 'Avg. Level', value: `${average}%`, icon: BarChart3, tone: 'emerald' }
        ];
    }, [interests, stats]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
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
                        {ICON_NAMES.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Comfort level</label>
                    <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                                 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    >
                        {LEVELS.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Since (year)</label>
                    <input
                        type="number"
                        min="1900"
                        max="2100"
                        placeholder="Optional"
                        value={formData.startedYear}
                        onChange={(e) => setFormData({ ...formData, startedYear: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                                 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder-slate-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Tags <span className="text-slate-500 font-normal">(comma separated, up to 8)</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g., outdoors, film, weekend"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder-slate-500"
                />
            </div>
        </div>
    );

    return (
        <DashboardLayout
            title="Hobbies & Interests"
            subtitle="Manage your personal interests and hobbies shown on your portfolio"
            actions={
                <div className="flex items-center gap-2">
                    <input
                        ref={importRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={handleImportFile}
                        className="hidden"
                    />
                    <button
                        onClick={() => importRef.current?.click()}
                        disabled={importing}
                        className="px-3 py-2.5 bg-slate-700/60 hover:bg-slate-600 rounded-lg font-semibold
                                 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        title="Import hobbies from a JSON export"
                    >
                        {importing ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                        <span className="hidden sm:inline">Import</span>
                    </button>
                    <button
                        onClick={exportJson}
                        disabled={exporting}
                        className="px-3 py-2.5 bg-slate-700/60 hover:bg-slate-600 rounded-lg font-semibold
                                 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        title="Export hobbies as JSON"
                    >
                        {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                        <span className="hidden sm:inline">Export</span>
                    </button>
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
                </div>
            }
        >
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4
                                     flex items-center gap-4"
                        >
                            <div className={`p-3 rounded-lg ${
                                stat.tone === 'cyan' ? 'bg-cyan-500/10'
                                    : stat.tone === 'purple' ? 'bg-purple-500/10'
                                        : stat.tone === 'amber' ? 'bg-amber-500/10'
                                            : 'bg-emerald-500/10'
                            }`}>
                                <stat.icon
                                    size={24}
                                    className={
                                        stat.tone === 'cyan' ? 'text-cyan-400'
                                            : stat.tone === 'purple' ? 'text-purple-400'
                                                : stat.tone === 'amber' ? 'text-amber-400'
                                                    : 'text-emerald-400'
                                    }
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-slate-400 truncate">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Unsaved reorder banner */}
                {orderDirty && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                                    bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                        <p className="text-sm text-amber-200 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Order changed on this screen — save it to apply it to your portfolio.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={persistOrder}
                                disabled={savingOrder}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg
                                         text-sm font-semibold transition-all flex items-center gap-2
                                         disabled:opacity-50"
                            >
                                {savingOrder ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                                Save order
                            </button>
                            <button
                                onClick={discardOrder}
                                disabled={savingOrder}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm
                                         font-semibold transition-all"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                )}

                {/* Toolbar: search + filters + analytics toggle */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search hobbies, tags, categories..."
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
                                    aria-label="Clear search"
                                >
                                    <X size={14} className="text-slate-400" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-400 hidden sm:block" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm
                                         text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            >
                                <option value="all">All categories</option>
                                {usedCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowAnalytics(open => !open)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                                    ${showAnalytics
                                        ? 'bg-cyan-500 text-slate-900'
                                        : 'bg-slate-700/50 text-slate-200 hover:bg-slate-600'}`}
                            >
                                <BarChart3 size={16} />
                                <span className="hidden sm:inline">Breakdown</span>
                            </button>
                            <button
                                onClick={refresh}
                                className="p-2.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all"
                                title="Refresh"
                                aria-label="Refresh hobbies"
                            >
                                <RefreshCw size={16} className="text-slate-300" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {VISIBILITY_FILTERS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setVisibilityFilter(option.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                    ${visibilityFilter === option.value
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/50 hover:text-slate-200'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-slate-500">
                            {filteredInterests.length} of {interests.length} shown
                        </span>
                    </div>

                    {/* Breakdown panel */}
                    <AnimatePresence initial={false}>
                        {showAnalytics && stats && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-slate-700/60">
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                            By category
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {stats.byCategory.length === 0 && (
                                                <li className="text-sm text-slate-500">No categories yet.</li>
                                            )}
                                            {stats.byCategory.map(row => (
                                                <li key={row.category} className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-300 flex-1 truncate">{row.category}</span>
                                                    <span className="text-cyan-300 font-semibold">{row.count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                            By comfort level
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {stats.byLevel.map(row => (
                                                <li key={row.level} className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-300 flex-1 capitalize">{row.level}</span>
                                                    <span className="text-purple-300 font-semibold">{row.count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                            {searchQuery || categoryFilter !== 'all' || visibilityFilter !== 'all'
                                ? 'No hobbies match those filters'
                                : 'No hobbies yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery || categoryFilter !== 'all' || visibilityFilter !== 'all'
                                ? 'Try clearing the search or filters'
                                : 'Add your first hobby to get started'}
                        </p>
                        {!(searchQuery || categoryFilter !== 'all' || visibilityFilter !== 'all') && (
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
                                const hidden = interest.visible === false;

                                return (
                                    <motion.div
                                        key={interest.id || index}
                                        layout
                                        variants={itemVariants}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        draggable
                                        onDragStart={() => setDraggingId(interest.id)}
                                        onDragEnd={() => setDraggingId(null)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={() => handleDrop(interest.id)}
                                        className={`group relative backdrop-blur-xl border rounded-xl p-5 transition-all
                                            ${hidden
                                                ? 'bg-slate-900/40 border-slate-700/40 opacity-70'
                                                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'}
                                            ${draggingId === interest.id ? 'ring-2 ring-cyan-500/60' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-cyan-500/10 rounded-lg flex-shrink-0">
                                                <IconComp size={24} className="text-cyan-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-slate-200 truncate">
                                                    {title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="inline-block px-2 py-0.5 text-xs font-medium
                                                                   bg-slate-700/50 text-cyan-400 rounded-full border border-slate-600">
                                                        {category}
                                                    </span>
                                                    {interest.level && (
                                                        <span className="inline-block px-2 py-0.5 text-xs font-medium
                                                                       bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/30 capitalize">
                                                            {interest.level}
                                                        </span>
                                                    )}
                                                    {hidden && (
                                                        <span className="inline-block px-2 py-0.5 text-xs font-medium
                                                                       bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/30">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400"
                                                title="Drag to reorder"
                                                aria-hidden="true"
                                            >
                                                <GripVertical size={16} />
                                            </span>
                                        </div>

                                        {description && (
                                            <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                                                {description}
                                            </p>
                                        )}

                                        {Array.isArray(interest.tags) && interest.tags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {interest.tags.slice(0, 4).map(tag => (
                                                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full
                                                                       bg-slate-700/40 text-slate-400">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => moveItem(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1.5 hover:bg-slate-600 rounded-lg transition-all
                                                             disabled:opacity-30 disabled:cursor-not-allowed"
                                                    aria-label={`Move ${title} up`}
                                                >
                                                    <ChevronUp size={16} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => moveItem(index, 1)}
                                                    disabled={index === filteredInterests.length - 1}
                                                    className="p-1.5 hover:bg-slate-600 rounded-lg transition-all
                                                             disabled:opacity-30 disabled:cursor-not-allowed"
                                                    aria-label={`Move ${title} down`}
                                                >
                                                    <ChevronDown size={16} className="text-slate-400" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleVisibility(interest)}
                                                    className={`p-2 rounded-lg transition-all
                                                        ${hidden
                                                            ? 'text-amber-400 hover:bg-amber-500/10'
                                                            : 'text-slate-400 hover:bg-slate-600 hover:text-emerald-400'}`}
                                                    title={hidden ? 'Show on the portfolio' : 'Hide from the portfolio'}
                                                    aria-label={hidden ? `Show ${title} on the portfolio` : `Hide ${title} from the portfolio`}
                                                >
                                                    {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => openEdit(interest)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-all text-slate-400
                                                             hover:text-cyan-400"
                                                    aria-label={`Edit ${title}`}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDelete(interest)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-all text-slate-400
                                                             hover:text-red-400"
                                                    aria-label={`Delete ${title}`}
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

                {orderDirty && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        Drag cards or use the arrows to reorder; nothing is saved until you press Save order.
                    </p>
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
                                    aria-label="Close"
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
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
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
                                    aria-label="Close"
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
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
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

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && selectedInterest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500/10 rounded-lg">
                                    <Trash2 className="text-red-400" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Delete Hobby?</h3>
                            </div>
                            <p className="text-slate-400 mb-2">
                                You are about to delete{' '}
                                <strong className="text-slate-200">
                                    {selectedInterest.title || selectedInterest.name}
                                </strong>.
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                To take it off the portfolio without losing it, close this and use the
                                visibility toggle instead.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold
                                             transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
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
