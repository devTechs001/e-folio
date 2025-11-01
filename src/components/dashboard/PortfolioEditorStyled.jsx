import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Layout,
    Edit3,
    Eye,
    EyeOff,
    Save,
    Plus,
    Trash2,
    Settings,
    Monitor,
    Tablet,
    Smartphone,
    Code,
    Download,
    Upload,
    Palette,
    Type,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
    FileText,
    Globe,
    Mail,
    Github,
    Linkedin,
    Twitter,
    Instagram,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    X,
    Copy,
    Grid,
    Columns,
    Move,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Share2,
    History,
    Layers,
    Lock,
    Unlock,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    List,
    FileCode,
    Sparkles,
    Wand2,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import { SketchPicker } from 'react-color';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-monokai';

// Sortable Section Component
const SortableSection = ({ section, onEdit, onToggle, onDelete, onDuplicate, theme }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group p-4 mb-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-all ${
                !section.visible ? 'opacity-50' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <Move size={16} className="text-slate-400" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <Layout size={16} className="text-cyan-400" />
                        <span className="text-white font-medium">{section.name}</span>
                        <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded">
                            {section.type}
                        </span>
                        {section.locked && (
                            <Lock size={14} className="text-yellow-400" />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(section.id)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        {section.visible ? (
                            <Eye size={16} className="text-cyan-400" />
                        ) : (
                            <EyeOff size={16} className="text-slate-500" />
                        )}
                    </button>
                    <button
                        onClick={() => onDuplicate(section.id)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <Copy size={16} className="text-slate-400" />
                    </button>
                    <button
                        onClick={() => onEdit(section)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <Edit3 size={16} className="text-slate-400" />
                    </button>
                    <button
                        onClick={() => onDelete(section.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} className="text-red-400" />
                    </button>
                </div>
            </div>

            {section.settings && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 text-sm text-slate-400">
                    <div className="flex gap-4">
                        {section.settings.background && (
                            <span>BG: {section.settings.background}</span>
                        )}
                        {section.settings.padding && (
                            <span>Padding: {section.settings.padding}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PortfolioEditor = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError, warning } = useNotifications();
    
    const [editorMode, setEditorMode] = useState('visual');
    const [viewportSize, setViewportSize] = useState('desktop');
    const [activePanel, setActivePanel] = useState('sections');
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [showPreview, setShowPreview] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedSection, setSelectedSection] = useState(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [portfolioConfig, setPortfolioConfig] = useState({
        sections: [],
        theme: {
            primaryColor: '#06b6d4',
            secondaryColor: '#3b82f6',
            backgroundColor: '#0f172a',
            textColor: '#f8fafc',
            fontFamily: 'Inter, sans-serif',
            headingFont: 'Poppins, sans-serif'
        },
        seo: {
            title: '',
            description: '',
            keywords: [],
            ogImage: ''
        },
        settings: {
            animations: true,
            smoothScroll: true,
            darkMode: true,
            showSocialLinks: true
        }
    });

    const [sectionTemplates] = useState([
        {
            id: 'hero',
            name: 'Hero Section',
            type: 'hero',
            icon: Sparkles,
            description: 'Eye-catching introduction',
            defaultSettings: {
                background: 'gradient',
                textAlign: 'center',
                showCTA: true,
                animation: 'fadeIn'
            }
        },
        {
            id: 'about',
            name: 'About Me',
            type: 'about',
            icon: FileText,
            description: 'Personal introduction',
            defaultSettings: {
                layout: 'two-column',
                showImage: true,
                showStats: true
            }
        },
        {
            id: 'skills',
            name: 'Skills',
            type: 'skills',
            icon: Wand2,
            description: 'Display your expertise',
            defaultSettings: {
                layout: 'grid',
                showProgress: true,
                columns: 3
            }
        },
        {
            id: 'projects',
            name: 'Projects',
            type: 'portfolio',
            icon: Grid,
            description: 'Showcase your work',
            defaultSettings: {
                layout: 'grid',
                columns: 3,
                showFilters: true,
                sortBy: 'date'
            }
        },
        {
            id: 'experience',
            name: 'Experience',
            type: 'timeline',
            icon: History,
            description: 'Work history timeline',
            defaultSettings: {
                layout: 'timeline',
                showDuration: true
            }
        },
        {
            id: 'contact',
            name: 'Contact',
            type: 'contact',
            icon: Mail,
            description: 'Contact form and info',
            defaultSettings: {
                showForm: true,
                showMap: false,
                showSocial: true
            }
        }
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    useEffect(() => {
        if (isOwner()) {
            loadPortfolioConfig();
            loadVersions();
        }
    }, [isOwner]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [unsavedChanges]);

    const loadPortfolioConfig = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPortfolioConfig();
            
            if (response.success) {
                setPortfolioConfig(response.data);
                setCurrentVersion(response.version);
                addToHistory(response.data);
            }
        } catch (err) {
            console.error('Failed to load config:', err);
            showError('Failed to load portfolio configuration');
        } finally {
            setLoading(false);
        }
    };

    const loadVersions = async () => {
        try {
            const response = await apiService.getPortfolioVersions();
            if (response.success) {
                setVersions(response.data);
            }
        } catch (err) {
            console.error('Failed to load versions:', err);
        }
    };

    const savePortfolioConfig = async () => {
        try {
            setSaving(true);
            const response = await apiService.savePortfolioConfig({
                config: portfolioConfig,
                versionName: `Version ${new Date().toLocaleString()}`
            });

            if (response.success) {
                success('Portfolio saved successfully!');
                setUnsavedChanges(false);
                setCurrentVersion(response.version);
                loadVersions();
            } else {
                showError(response.message || 'Failed to save portfolio');
            }
        } catch (err) {
            console.error('Save error:', err);
            showError('Failed to save portfolio configuration');
        } finally {
            setSaving(false);
        }
    };

    const addToHistory = (config) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(config)));
        
        if (newHistory.length > 50) {
            newHistory.shift();
        }
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const updateConfig = (updates) => {
        const newConfig = { ...portfolioConfig, ...updates };
        setPortfolioConfig(newConfig);
        addToHistory(newConfig);
        setUnsavedChanges(true);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = portfolioConfig.sections.findIndex(s => s.id === active.id);
            const newIndex = portfolioConfig.sections.findIndex(s => s.id === over.id);

            const newSections = arrayMove(portfolioConfig.sections, oldIndex, newIndex);
            updateConfig({ sections: newSections });
        }
    };

    const addSection = (template) => {
        const newSection = {
            id: `section_${Date.now()}`,
            name: template.name,
            type: template.type,
            visible: true,
            locked: false,
            settings: template.defaultSettings,
            content: {
                title: template.name,
                description: '',
                data: {}
            }
        };

        updateConfig({
            sections: [...portfolioConfig.sections, newSection]
        });
        
        setShowSectionModal(false);
        success(`${template.name} added`);
    };

    const toggleSection = (id) => {
        const newSections = portfolioConfig.sections.map(s =>
            s.id === id ? { ...s, visible: !s.visible } : s
        );
        updateConfig({ sections: newSections });
    };

    const deleteSection = (id) => {
        if (confirm('Are you sure you want to delete this section?')) {
            const newSections = portfolioConfig.sections.filter(s => s.id !== id);
            updateConfig({ sections: newSections });
            success('Section deleted');
        }
    };

    const duplicateSection = (id) => {
        const section = portfolioConfig.sections.find(s => s.id === id);
        if (section) {
            const duplicate = {
                ...section,
                id: `section_${Date.now()}`,
                name: `${section.name} (Copy)`
            };
            updateConfig({
                sections: [...portfolioConfig.sections, duplicate]
            });
            success('Section duplicated');
        }
    };

    const editSection = (section) => {
        setSelectedSection(section);
    };

    const updateSection = (id, updates) => {
        const newSections = portfolioConfig.sections.map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        updateConfig({ sections: newSections });
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPortfolioConfig(history[historyIndex - 1]);
            setUnsavedChanges(true);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPortfolioConfig(history[historyIndex + 1]);
            setUnsavedChanges(true);
        }
    };

    const exportConfig = () => {
        const dataStr = JSON.stringify(portfolioConfig, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `portfolio-config-${Date.now()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        success('Configuration exported!');
    };

    const importConfig = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    setPortfolioConfig(imported);
                    addToHistory(imported);
                    setUnsavedChanges(true);
                    success('Configuration imported!');
                    setShowImportModal(false);
                } catch (err) {
                    showError('Invalid configuration file');
                }
            };
            reader.readAsText(file);
        }
    };

    const restoreVersion = async (versionId) => {
        if (confirm('Restore this version? Current unsaved changes will be lost.')) {
            try {
                const response = await apiService.restorePortfolioVersion(versionId);
                if (response.success) {
                    setPortfolioConfig(response.data);
                    addToHistory(response.data);
                    setUnsavedChanges(false);
                    success('Version restored!');
                }
            } catch (err) {
                showError('Failed to restore version');
            }
        }
    };

    const publishPortfolio = async () => {
        try {
            await savePortfolioConfig();
            const response = await apiService.publishPortfolio();
            if (response.success) {
                success('Portfolio published successfully!');
                window.open(response.url, '_blank');
            }
        } catch (err) {
            showError('Failed to publish portfolio');
        }
    };

    const getViewportWidth = () => {
        const widths = {
            desktop: '100%',
            tablet: '768px',
            mobile: '375px'
        };
        return widths[viewportSize];
    };

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center p-12 bg-red-500/10 border-2 border-red-500/50 rounded-2xl max-w-md">
                        <Lock size={48} className="text-red-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-red-400 mb-2">Access Restricted</h3>
                        <p className="text-slate-400">
                            Portfolio Editor is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading editor...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Portfolio Editor"
            subtitle="Customize your portfolio layout, design, and content"
            actions={
                <div className="flex items-center gap-3">
                    {/* History Controls */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            <Undo size={16} className="text-slate-400" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            <Redo size={16} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                        <button
                            onClick={() => setZoom(Math.max(50, zoom - 10))}
                            className="hover:text-cyan-400 transition-colors"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-sm font-medium min-w-[3rem] text-center">
                            {zoom}%
                        </span>
                        <button
                            onClick={() => setZoom(Math.min(200, zoom + 10))}
                            className="hover:text-cyan-400 transition-colors"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            onClick={() => setZoom(100)}
                            className="ml-1 hover:text-cyan-400 transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    {/* Preview Button */}
                    <button
                        onClick={() => setShowPreview(true)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <Eye size={18} />
                        Preview
                    </button>

                    {/* Publish Button */}
                    <button
                        onClick={publishPortfolio}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30 flex items-center gap-2"
                    >
                        <Globe size={18} />
                        Publish
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={savePortfolioConfig}
                        disabled={saving || !unsavedChanges}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {unsavedChanges ? 'Save Changes' : 'Saved'}
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="flex h-[calc(100vh-200px)] overflow-hidden bg-slate-900">
                {/* Left Sidebar - Controls */}
                <div className="w-80 bg-slate-800/50 border-r border-slate-700/50 overflow-y-auto custom-scrollbar">
                    <div className="p-4 space-y-6">
                        {/* Editor Mode Tabs */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                                Editor Mode
                            </h3>
                            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/50 rounded-lg">
                                {[
                                    { id: 'visual', label: 'Visual', icon: Layout },
                                    { id: 'code', label: 'Code', icon: Code },
                                    { id: 'preview', label: 'Preview', icon: Eye }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setEditorMode(mode.id)}
                                        className={`px-3 py-2 rounded-md flex flex-col items-center gap-1 transition-all ${
                                            editorMode === mode.id
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <mode.icon size={18} />
                                        <span className="text-xs font-medium">{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Viewport Size */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                                Viewport
                            </h3>
                            <div className="flex gap-2">
                                {[
                                    { id: 'desktop', icon: Monitor, label: 'Desktop' },
                                    { id: 'tablet', icon: Tablet, label: 'Tablet' },
                                    { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                                ].map((viewport) => (
                                    <button
                                        key={viewport.id}
                                        onClick={() => setViewportSize(viewport.id)}
                                        className={`flex-1 p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                                            viewportSize === viewport.id
                                                ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                                                : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                        title={viewport.label}
                                    >
                                        <viewport.icon size={20} />
                                        <span className="text-xs">{viewport.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Panel Tabs */}
                        <div>
                            <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg mb-4">
                                {[
                                    { id: 'sections', label: 'Sections', icon: Layers },
                                    { id: 'design', label: 'Design', icon: Palette },
                                    { id: 'settings', label: 'Settings', icon: Settings }
                                ].map((panel) => (
                                    <button
                                        key={panel.id}
                                        onClick={() => setActivePanel(panel.id)}
                                        className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all text-sm ${
                                            activePanel === panel.id
                                                ? 'bg-slate-700 text-white'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <panel.icon size={16} />
                                        <span>{panel.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Panel Content */}
                            <AnimatePresence mode="wait">
                                {/* Sections Panel */}
                                {activePanel === 'sections' && (
                                    <motion.div
                                        key="sections"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-white">
                                                Page Sections ({portfolioConfig.sections.length})
                                            </h3>
                                            <button
                                                onClick={() => setShowSectionModal(true)}
                                                className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={portfolioConfig.sections.map(s => s.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {portfolioConfig.sections.map((section) => (
                                                    <SortableSection
                                                        key={section.id}
                                                        section={section}
                                                        onEdit={editSection}
                                                        onToggle={toggleSection}
                                                        onDelete={deleteSection}
                                                        onDuplicate={duplicateSection}
                                                        theme={theme}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>

                                        {portfolioConfig.sections.length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <Layers size={48} className="mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">No sections yet</p>
                                                <button
                                                    onClick={() => setShowSectionModal(true)}
                                                    className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                                                >
                                                    Add Your First Section
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Design Panel */}
                                {activePanel === 'design' && (
                                    <motion.div
                                        key="design"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                                Primary Color
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                                                    style={{ backgroundColor: portfolioConfig.theme.primaryColor }}
                                                    onClick={() => {
                                                        // Open color picker
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={portfolioConfig.theme.primaryColor}
                                                    onChange={(e) => updateConfig({
                                                        theme: { ...portfolioConfig.theme, primaryColor: e.target.value }
                                                    })}
                                                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                                Font Family
                                            </label>
                                            <select
                                                value={portfolioConfig.theme.fontFamily}
                                                onChange={(e) => updateConfig({
                                                    theme: { ...portfolioConfig.theme, fontFamily: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Roboto, sans-serif">Roboto</option>
                                                <option value="Poppins, sans-serif">Poppins</option>
                                                <option value="Montserrat, sans-serif">Montserrat</option>
                                                <option value="'Fira Code', monospace">Fira Code</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                                Background Color
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                                                    style={{ backgroundColor: portfolioConfig.theme.backgroundColor }}
                                                />
                                                <input
                                                    type="text"
                                                    value={portfolioConfig.theme.backgroundColor}
                                                    onChange={(e) => updateConfig({
                                                        theme: { ...portfolioConfig.theme, backgroundColor: e.target.value }
                                                    })}
                                                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Settings Panel */}
                                {activePanel === 'settings' && (
                                    <motion.div
                                        key="settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-3">SEO Settings</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm text-slate-400 mb-1">
                                                        Page Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={portfolioConfig.seo.title}
                                                        onChange={(e) => updateConfig({
                                                            seo: { ...portfolioConfig.seo, title: e.target.value }
                                                        })}
                                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                                        placeholder="Your Portfolio"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-400 mb-1">
                                                        Meta Description
                                                    </label>
                                                    <textarea
                                                        value={portfolioConfig.seo.description}
                                                        onChange={(e) => updateConfig({
                                                            seo: { ...portfolioConfig.seo, description: e.target.value }
                                                        })}
                                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm resize-none"
                                                        rows={3}
                                                        placeholder="Brief description of your portfolio..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-3">Features</h4>
                                            <div className="space-y-2">
                                                {Object.entries(portfolioConfig.settings).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                                        <span className="text-sm text-white capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={value}
                                                                onChange={(e) => updateConfig({
                                                                    settings: { ...portfolioConfig.settings, [key]: e.target.checked }
                                                                })}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-3">Actions</h4>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={exportConfig}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Download size={16} />
                                                    Export Configuration
                                                </button>
                                                <button
                                                    onClick={() => setShowImportModal(true)}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Upload size={16} />
                                                    Import Configuration
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    <div className="h-full p-6 overflow-auto custom-scrollbar">
                        <div
                            className="mx-auto transition-all duration-300"
                            style={{
                                width: getViewportWidth(),
                                transform: `scale(${zoom / 100})`
                            }}
                        >
                            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl min-h-[600px] overflow-hidden">
                                {editorMode === 'visual' && (
                                    <div className="p-8">
                                        {portfolioConfig.sections.filter(s => s.visible).length === 0 ? (
                                            <div className="flex items-center justify-center min-h-[400px]">
                                                <div className="text-center">
                                                    <Layout size={64} className="mx-auto mb-4 text-slate-600" />
                                                    <h3 className="text-xl font-semibold text-slate-400 mb-2">
                                                        No Visible Sections
                                                    </h3>
                                                    <p className="text-slate-500 mb-6">
                                                        Add sections from the sidebar to build your portfolio
                                                    </p>
                                                    <button
                                                        onClick={() => setShowSectionModal(true)}
                                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto"
                                                    >
                                                        <Plus size={20} />
                                                        Add Section
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {portfolioConfig.sections.filter(s => s.visible).map((section) => (
                                                    <motion.div
                                                        key={section.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="group relative p-8 bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                                                        onClick={() => editSection(section)}
                                                    >
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    editSection(section);
                                                                }}
                                                                className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                                                            >
                                                                <Edit3 size={14} className="text-cyan-400" />
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Layout size={20} className="text-cyan-400" />
                                                            <h3 className="text-xl font-semibold text-white">
                                                                {section.content?.title || section.name}
                                                            </h3>
                                                        </div>
                                                        
                                                        <p className="text-slate-400">
                                                            {section.content?.description || `${section.type} section - Click to edit`}
                                                        </p>
                                                        
                                                        {section.settings && (
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {Object.entries(section.settings).map(([key, value]) => (
                                                                    <span
                                                                        key={key}
                                                                        className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded"
                                                                    >
                                                                        {key}: {value.toString()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {editorMode === 'code' && (
                                    <AceEditor
                                        mode="json"
                                        theme="monokai"
                                        value={JSON.stringify(portfolioConfig, null, 2)}
                                        onChange={(value) => {
                                            try {
                                                const parsed = JSON.parse(value);
                                                setPortfolioConfig(parsed);
                                                setUnsavedChanges(true);
                                            } catch (err) {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        width="100%"
                                        height="100%"
                                        fontSize={14}
                                        showPrintMargin={false}
                                        showGutter={true}
                                        highlightActiveLine={true}
                                        setOptions={{
                                            enableBasicAutocompletion: true,
                                            enableLiveAutocompletion: true,
                                            enableSnippets: true,
                                            showLineNumbers: true,
                                            tabSize: 2
                                        }}
                                    />
                                )}

                                {editorMode === 'preview' && (
                                    <div className="p-8">
                                        <div className="mb-6 flex items-center justify-between">
                                            <h2 className="text-2xl font-bold text-white">Live Preview</h2>
                                            <button
                                                onClick={() => window.open(`/portfolio/${user?.username}`, '_blank')}
                                                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                                            >
                                                <ExternalLink size={16} />
                                                Open in New Tab
                                            </button>
                                        </div>
                                        <div className="bg-white rounded-lg overflow-hidden">
                                            <iframe
                                                src={`/portfolio/${user?.username}?preview=true`}
                                                className="w-full h-[800px] border-0"
                                                title="Portfolio Preview"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                {selectedSection && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="w-80 bg-slate-800/50 border-l border-slate-700/50 overflow-y-auto custom-scrollbar"
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">
                                    Edit Section
                                </h3>
                                <button
                                    onClick={() => setSelectedSection(null)}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Section Name
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedSection.name}
                                        onChange={(e) => {
                                            const updated = { ...selectedSection, name: e.target.value };
                                            setSelectedSection(updated);
                                            updateSection(selectedSection.id, { name: e.target.value });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedSection.content?.title || ''}
                                        onChange={(e) => {
                                            const updated = {
                                                ...selectedSection,
                                                content: { ...selectedSection.content, title: e.target.value }
                                            };
                                            setSelectedSection(updated);
                                            updateSection(selectedSection.id, { content: updated.content });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={selectedSection.content?.description || ''}
                                        onChange={(e) => {
                                            const updated = {
                                                ...selectedSection,
                                                content: { ...selectedSection.content, description: e.target.value }
                                            };
                                            setSelectedSection(updated);
                                            updateSection(selectedSection.id, { content: updated.content });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white resize-none"
                                        rows={4}
                                    />
                                </div>

                                {/* Section-specific settings would go here */}
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3">Section Settings</h4>
                                    {selectedSection.settings && Object.entries(selectedSection.settings).map(([key, value]) => (
                                        <div key={key} className="mb-3">
                                            <label className="block text-sm text-slate-400 mb-1 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            {typeof value === 'boolean' ? (
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => {
                                                            const updated = {
                                                                ...selectedSection,
                                                                settings: { ...selectedSection.settings, [key]: e.target.checked }
                                                            };
                                                            setSelectedSection(updated);
                                                            updateSection(selectedSection.id, { settings: updated.settings });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                                                </label>
                                            ) : typeof value === 'number' ? (
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => {
                                                        const updated = {
                                                            ...selectedSection,
                                                            settings: { ...selectedSection.settings, [key]: parseInt(e.target.value) }
                                                        };
                                                        setSelectedSection(updated);
                                                        updateSection(selectedSection.id, { settings: updated.settings });
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => {
                                                        const updated = {
                                                            ...selectedSection,
                                                            settings: { ...selectedSection.settings, [key]: e.target.value }
                                                        };
                                                        setSelectedSection(updated);
                                                        updateSection(selectedSection.id, { settings: updated.settings });
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Add Section Modal */}
            <AnimatePresence>
                {showSectionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSectionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">Add Section</h3>
                                <button
                                    onClick={() => setShowSectionModal(false)}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sectionTemplates.map((template) => (
                                    <motion.div
                                        key={template.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addSection(template)}
                                        className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                                            <template.icon size={24} className="text-cyan-400" />
                                        </div>
                                        <h4 className="text-white font-semibold mb-2">{template.name}</h4>
                                        <p className="text-slate-400 text-sm">{template.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowImportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">Import Configuration</h3>
                            <p className="text-slate-400 mb-6">
                                Upload a JSON configuration file to import your portfolio settings.
                            </p>
                            <input
                                type="file"
                                accept=".json"
                                onChange={importConfig}
                                className="w-full px-4 py-3 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 cursor-pointer"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default PortfolioEditor;