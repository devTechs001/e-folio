// client/src/components/dashboard/ThemeManagerEnhanced.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, Check, Download, Upload, Plus, X,
    Search, Grid, List, Star, Sparkles,
    Sun, Moon, Zap, Eye, Copy, Trash2,
    Save, Heart
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const ThemeManager = () => {
    const {
        theme,
        themes,
        changeTheme,
        currentTheme
    } = useTheme();

    const { success, error: showError } = useNotifications();

    // Custom themes stored in localStorage
    const [customThemes, setCustomThemes] = useState(() => {
        const saved = localStorage.getItem('customThemes');
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomThemeModal, setShowCustomThemeModal] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('favoriteThemes');
        return saved ? JSON.parse(saved) : [];
    });

    const fileInputRef = useRef(null);

    // Combine built-in themes with custom themes
    const allThemes = [...themes, ...customThemes];

    // Add custom theme
    const addCustomTheme = (newTheme) => {
        const updatedCustomThemes = [...customThemes, newTheme];
        setCustomThemes(updatedCustomThemes);
        localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
    };

    // Delete custom theme
    const deleteCustomTheme = (themeId) => {
        const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
        setCustomThemes(updatedCustomThemes);
        localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
        success('Custom theme deleted');
    };

    // Export theme
    const exportTheme = (themeId) => {
        const themeToExport = allThemes.find(t => t.id === themeId);
        if (themeToExport) {
            const dataStr = JSON.stringify(themeToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `theme-${themeId}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    };

    // Import theme
    const importTheme = (themeData) => {
        if (themeData && themeData.id && themeData.name && themeData.colors) {
            addCustomTheme({ ...themeData, custom: true });
        } else {
            throw new Error('Invalid theme format');
        }
    };

    // Categories
    const categories = [
        { id: 'all', label: 'All Themes', icon: Grid },
        { id: 'professional', label: 'Professional', icon: Zap },
        { id: 'creative', label: 'Creative', icon: Sparkles },
        { id: 'nature', label: 'Nature', icon: Sun },
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'retro', label: 'Retro', icon: Star },
        { id: 'monochrome', label: 'Monochrome', icon: Moon },
        { id: 'accessibility', label: 'High Contrast', icon: Eye }
    ];

    // Filter themes
    const filteredThemes = allThemes.filter(t => {
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.category?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Handle theme change
    const handleThemeChange = (themeId) => {
        changeTheme(themeId);
        success(`Theme changed to ${allThemes.find(t => t.id === themeId)?.name}`);
    };

    // Toggle favorite
    const toggleFavorite = (themeId) => {
        const newFavorites = favorites.includes(themeId)
            ? favorites.filter(id => id !== themeId)
            : [...favorites, themeId];
        
        setFavorites(newFavorites);
        localStorage.setItem('favoriteThemes', JSON.stringify(newFavorites));
    };

    // Handle export
    const handleExport = (themeId) => {
        exportTheme(themeId);
        success('Theme exported successfully');
    };

    // Handle import
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const themeData = JSON.parse(event.target.result);
                    importTheme(themeData);
                    success('Theme imported successfully');
                } catch (err) {
                    showError('Failed to import theme. Invalid file format.');
                }
            };
            reader.readAsText(file);
        }
    };

    // Get theme stats
    const getThemeStats = () => {
        return {
            total: allThemes.length,
            dark: allThemes.filter(t => t.type === 'dark').length,
            light: allThemes.filter(t => t.type === 'light').length,
            favorites: favorites.length
        };
    };

    const stats = getThemeStats();

    return (
        <DashboardLayout
            title="Theme Manager"
            subtitle="Customize your dashboard appearance with beautiful themes"
            actions={
                <div className="flex items-center gap-3 flex-wrap">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'list'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    {/* Import Theme */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Upload size={18} />
                        <span className="hidden sm:inline">Import</span>
                    </button>

                    {/* Create Custom Theme */}
                    <button
                        onClick={() => setShowCustomThemeModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/30"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Create Theme</span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </div>
            }
        >
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={Palette} label="Total Themes" value={stats.total} color="cyan" />
                    <StatCard icon={Moon} label="Dark Themes" value={stats.dark} color="blue" />
                    <StatCard icon={Sun} label="Light Themes" value={stats.light} color="yellow" />
                    <StatCard icon={Heart} label="Favorites" value={stats.favorites} color="pink" />
                </div>

                {/* Current Theme Preview */}
                <CurrentThemePreview
                    theme={allThemes.find(t => t.id === currentTheme)}
                    onExport={() => handleExport(currentTheme)}
                    isFavorite={favorites.includes(currentTheme)}
                    onToggleFavorite={() => toggleFavorite(currentTheme)}
                />

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search themes..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                                    selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-cyan-500/30'
                                }`}
                            >
                                <category.icon size={16} />
                                <span className="text-sm font-medium">{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Themes Grid/List */}
                {filteredThemes.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredThemes.map((themeOption) => (
                                <ThemeCard
                                    key={themeOption.id}
                                    theme={themeOption}
                                    isActive={currentTheme === themeOption.id}
                                    isFavorite={favorites.includes(themeOption.id)}
                                    onSelect={() => handleThemeChange(themeOption.id)}
                                    onToggleFavorite={() => toggleFavorite(themeOption.id)}
                                    onExport={() => handleExport(themeOption.id)}
                                    onDelete={themeOption.custom ? () => deleteCustomTheme(themeOption.id) : null}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredThemes.map((themeOption) => (
                                <ThemeListItem
                                    key={themeOption.id}
                                    theme={themeOption}
                                    isActive={currentTheme === themeOption.id}
                                    isFavorite={favorites.includes(themeOption.id)}
                                    onSelect={() => handleThemeChange(themeOption.id)}
                                    onToggleFavorite={() => toggleFavorite(themeOption.id)}
                                    onExport={() => handleExport(themeOption.id)}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-20">
                        <Palette size={64} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No themes found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Custom Theme Modal */}
            <CustomThemeModal
                isOpen={showCustomThemeModal}
                onClose={() => setShowCustomThemeModal(false)}
                onSave={(newTheme) => {
                    addCustomTheme(newTheme);
                    success('Custom theme created successfully');
                    setShowCustomThemeModal(false);
                }}
            />
        </DashboardLayout>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
    const colorClasses = {
        cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
        yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
        pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30'
    };

    const iconColors = {
        cyan: 'text-cyan-400',
        blue: 'text-blue-400',
        yellow: 'text-yellow-400',
        pink: 'text-pink-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={iconColors[color]} />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    );
};

// Current Theme Preview Component
const CurrentThemePreview = ({ theme, onExport, isFavorite, onToggleFavorite }) => {
    if (!theme) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Current Theme</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleFavorite}
                        className={`p-2 rounded-lg transition-all ${
                            isFavorite
                                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={onExport}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Theme Preview */}
                <div className="space-y-4">
                    <div
                        className="h-40 rounded-xl flex items-center justify-center shadow-2xl"
                        style={{ background: theme.gradient }}
                    >
                        <Palette size={48} className="text-white opacity-80" />
                    </div>
                    
                    {/* Color Palette */}
                    <div className="grid grid-cols-4 gap-2">
                        <ColorSwatch color={theme.colors.primary} label="Primary" />
                        <ColorSwatch color={theme.colors.secondary} label="Secondary" />
                        <ColorSwatch color={theme.colors.accent} label="Accent" />
                        <ColorSwatch color={theme.colors.background} label="Background" />
                    </div>
                </div>

                {/* Theme Info */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-2xl font-bold text-white mb-2">{theme.name}</h4>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full font-medium border border-cyan-500/30">
                                {theme.category}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium border border-blue-500/30">
                                {theme.type}
                            </span>
                        </div>
                    </div>

                    {/* Font Info */}
                    <div className="space-y-2">
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <p className="text-xs text-slate-500 mb-1">Heading Font</p>
                            <p className="text-sm text-slate-200 font-medium">{theme.fonts?.heading || 'Inter'}</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <p className="text-xs text-slate-500 mb-1">Body Font</p>
                            <p className="text-sm text-slate-200 font-medium">{theme.fonts?.body || 'Inter'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Color Swatch Component
const ColorSwatch = ({ color, label }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group relative"
            title={`${label}: ${color}`}
        >
            <div
                className="h-16 rounded-lg border-2 border-slate-700 group-hover:border-cyan-500 transition-all group-hover:scale-105"
                style={{ backgroundColor: color }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? (
                    <Check size={16} className="text-white drop-shadow-lg" />
                ) : (
                    <Copy size={16} className="text-white drop-shadow-lg" />
                )}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">{label}</p>
        </button>
    );
};

// Theme Card Component
const ThemeCard = ({ theme, isActive, isFavorite, onSelect, onToggleFavorite, onExport, onDelete }) => {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                isActive
                    ? 'border-cyan-500 shadow-2xl shadow-cyan-500/20'
                    : 'border-slate-700/50 hover:border-cyan-500/50'
            }`}
        >
            {/* Active Badge */}
            {isActive && (
                <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <Check size={16} className="text-white" />
                </div>
            )}

            {/* Favorite Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                }}
                className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800 transition-colors"
            >
                <Heart size={16} className={isFavorite ? 'text-pink-400 fill-pink-400' : 'text-slate-400'} />
            </button>

            {/* Theme Preview */}
            <div onClick={onSelect} className="p-6">
                <div
                    className="h-32 rounded-lg flex items-center justify-center shadow-lg mb-4"
                    style={{ background: theme.gradient }}
                >
                    <Palette size={40} className="text-white opacity-80" />
                </div>

                {/* Color Swatches */}
                <div className="flex gap-2 mb-4">
                    {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, idx) => (
                        <div
                            key={idx}
                            className="flex-1 h-8 rounded border-2 border-slate-700"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>

                {/* Theme Info */}
                <div className="mb-4">
                    <h4 className="text-white font-semibold text-lg mb-2">{theme.name}</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                            {theme.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            theme.type === 'dark'
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {theme.type === 'dark' ? <Moon size={12} className="inline mr-1" /> : <Sun size={12} className="inline mr-1" />}
                            {theme.type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-700/50 p-3 flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExport();
                    }}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <Download size={14} />
                    Export
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// Theme List Item Component
const ThemeListItem = ({ theme, isActive, isFavorite, onSelect, onToggleFavorite, onExport }) => {
    return (
        <motion.div
            whileHover={{ x: 4 }}
            onClick={onSelect}
            className={`flex items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/50 hover:border-cyan-500/50'
            }`}
        >
            {/* Theme Preview */}
            <div
                className="w-24 h-16 rounded-lg flex-shrink-0 shadow-lg"
                style={{ background: theme.gradient }}
            />

            {/* Theme Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold mb-1">{theme.name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                        {theme.category}
                    </span>
                    <span className="text-xs text-slate-500">{theme.type}</span>
                </div>
            </div>

            {/* Color Swatches */}
            <div className="hidden md:flex gap-2">
                {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, idx) => (
                    <div
                        key={idx}
                        className="w-10 h-10 rounded border-2 border-slate-700"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    className={`p-2 rounded-lg transition-all ${
                        isFavorite
                            ? 'bg-pink-500/20 text-pink-400'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExport();
                    }}
                    className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                >
                    <Download size={16} />
                </button>
                {isActive && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Check size={16} className="text-white" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Custom Theme Modal Component (Placeholder - you can expand this)
const CustomThemeModal = ({ isOpen, onClose, onSave }) => {
    const [themeName, setThemeName] = useState('');
    const [themeColors, setThemeColors] = useState({
        primary: '#06b6d4',
        secondary: '#0ea5e9',
        accent: '#22d3ee',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155'
    });

    const handleSave = () => {
        const newTheme = {
            id: `custom-${Date.now()}`,
            name: themeName || 'Custom Theme',
            category: 'custom',
            type: 'dark',
            colors: themeColors,
            gradient: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
            fonts: {
                heading: "'Inter', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            },
            custom: true
        };
        onSave(newTheme);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Create Custom Theme</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Theme Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Theme Name
                                </label>
                                <input
                                    type="text"
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    placeholder="My Custom Theme"
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            {/* Color Pickers */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {Object.entries(themeColors).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={value}
                                                onChange={(e) => setThemeColors({ ...themeColors, [key]: e.target.value })}
                                                className="w-14 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => setThemeColors({ ...themeColors, [key]: e.target.value })}
                                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Preview */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Preview</label>
                                <div
                                    className="h-32 rounded-lg flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` }}
                                >
                                    <Palette size={48} className="text-white opacity-80" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Theme
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ThemeManager;