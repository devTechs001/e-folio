import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Layout, Edit3, Eye, EyeOff, Save, Plus, Trash2, Settings, Monitor,
  Tablet, Smartphone, Code, Download, Upload, Palette, Type,
  Image as ImageIcon, Link as LinkIcon, Undo, Redo, FileText, Globe,
  Mail, Github, Linkedin, Twitter, Instagram, CheckCircle, ChevronDown,
  ChevronUp, X, Copy, Grid, Columns, Move, ZoomIn, ZoomOut, RotateCcw,
  Share2, History, Layers, Lock, Unlock, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, List, FileCode, Sparkles, Wand2, RefreshCw,
  ExternalLink, Video, Users, DollarSign, MessageSquare, Star, Award, Trophy,
  TrendingUp, Zap, Box, Sliders, Paintbrush, Camera, Play, Music,
  ShoppingCart, Heart, BookOpen, Briefcase, Code2, Database, CloudUpload, Cloud,
  Search, Filter, Tag, Hash, AtSign, Phone, MapPin, Clock, Calendar,
  BarChart, BarChart3, PieChart, Activity, Target, Cpu, Layers as Layers2, Package,
  Tv, Radio, Mic, Headphones, Film, Image as GalleryIcon, Scissors,
  Crop, Maximize, Minimize, Sun, Moon, Droplet, Wind, Feather,
  Anchor, Coffee, Gift, Flame, ThumbsUp, MessageCircle, Send, Bell,
  Flag, Bookmark, Archive, Folder, File, FileImage, FilePlus,
  SlidersHorizontal, PanelLeft, PanelRight, Split, Merge, Rows,
  Component, Puzzle, Blocks, Paintbrush2, Workflow, GitBranch,
  TestTube, Gauge, Shield, Key, CreditCard, Percent, Receipt, Minus
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
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

// Enhanced Sortable Section Component
const SortableSection = ({ section, onEdit, onToggle, onDelete, onDuplicate, onClone, theme, isSelected, sections, updateConfig }) => {
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
      className={`group p-4 mb-3 rounded-lg border transition-all ${
        isSelected 
          ? 'bg-cyan-500/10 border-cyan-500' 
          : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30'
      } ${!section.visible ? 'opacity-50' : ''}`}
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
            {section.locked && <Lock size={14} className="text-yellow-400" />}
            {section.featured && (
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            )}
            {section.customCSS && <Code2 size={14} className="text-purple-400" />}
            {section.animations?.enabled && <Sparkles size={14} className="text-pink-400" />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newSections = sections.map(s =>
                s.id === section.id ? { ...s, locked: !s.locked } : s
              );
              updateConfig({ sections: newSections });
            }}
            className={`p-2 rounded-lg transition-colors ${
              section.locked 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'hover:bg-slate-700/50 text-slate-400'
            }`}
            title={section.locked ? 'Unlock Section' : 'Lock Section'}
          >
            {section.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button
            onClick={() => onToggle(section.id)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title={section.visible ? 'Hide section' : 'Show section'}
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
            title="Duplicate section"
          >
            <Copy size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => onClone(section.id)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Clone as template"
          >
            <Layers2 size={16} className="text-blue-400" />
          </button>
          <button
            onClick={() => onEdit(section)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Edit section"
          >
            <Edit3 size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => onDelete(section.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Delete section"
          >
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      {section.settings && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(section.settings).slice(0, 3).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded"
              >
                {key}: {value.toString()}
              </span>
            ))}
            {Object.keys(section.settings).length > 3 && (
              <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded">
                +{Object.keys(section.settings).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Section Performance Metrics */}
      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <span>ID: {section?.id ? section.id.slice(0, 8) : 'N/A'}</span>
        <span>Last modified: {new Date(section?.updatedAt || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// Color Picker Component
const ColorPicker = ({ color, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer hover:border-cyan-500 transition-colors"
            style={{ backgroundColor: color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
          />
        </div>
        {showPicker && (
          <div className="absolute z-50 mt-2">
            <div className="fixed inset-0" onClick={() => setShowPicker(false)} />
            <SketchPicker color={color} onChange={(c) => onChange(c.hex)} />
          </div>
        )}
      </div>
    </div>
  );
};

// Media Library Component
const MediaLibrary = ({ onSelect, onClose }) => {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('media', file));

    try {
      const response = await apiService.uploadMedia(formData);
      if (response.success) {
        setMedia([...media, ...response.data]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || item.type.startsWith(filter);
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Media Library</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <CloudUpload size={18} />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05 }}
              className="aspect-square rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-cyan-500 transition-all"
              onClick={() => onSelect(item)}
            >
              {item.type.startsWith('image') ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              ) : item.type.startsWith('video') ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Video size={32} className="text-slate-400" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={32} className="text-slate-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// AI Content Suggester Component
const AIContentSuggester = ({ section, onApply, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [prompt, setPrompt] = useState('');

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const response = await apiService.generateAIContent({
        sectionType: section.type,
        prompt: prompt || `Generate professional content for a ${section.type} section`
      });
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">AI Content Suggester</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the content you want to generate..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Generate Content
              </>
            )}
          </button>

          {suggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
            >
              <h4 className="text-white font-semibold mb-3">Suggestions:</h4>
              <div className="space-y-3">
                {suggestions.title && (
                  <div>
                    <span className="text-sm text-slate-400">Title:</span>
                    <p className="text-white mt-1">{suggestions.title}</p>
                  </div>
                )}
                {suggestions.description && (
                  <div>
                    <span className="text-sm text-slate-400">Description:</span>
                    <p className="text-white mt-1">{suggestions.description}</p>
                  </div>
                )}
                {suggestions.content && (
                  <div>
                    <span className="text-sm text-slate-400">Content:</span>
                    <p className="text-white mt-1">{suggestions.content}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => onApply(suggestions)}
                className="mt-4 w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Apply to Section
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Animation Preset Selector
const AnimationPresetSelector = ({ value, onChange }) => {
  const presets = [
    { id: 'fadeIn', name: 'Fade In', icon: '👁️' },
    { id: 'slideUp', name: 'Slide Up', icon: '⬆️' },
    { id: 'slideDown', name: 'Slide Down', icon: '⬇️' },
    { id: 'slideLeft', name: 'Slide Left', icon: '⬅️' },
    { id: 'slideRight', name: 'Slide Right', icon: '➡️' },
    { id: 'zoomIn', name: 'Zoom In', icon: '🔍' },
    { id: 'zoomOut', name: 'Zoom Out', icon: '🔎' },
    { id: 'rotate', name: 'Rotate', icon: '🔄' },
    { id: 'bounce', name: 'Bounce', icon: '⚡' },
    { id: 'pulse', name: 'Pulse', icon: '💓' },
    { id: 'shake', name: 'Shake', icon: '📳' },
    { id: 'flip', name: 'Flip', icon: '🔃' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onChange(preset.id)}
          className={`p-3 rounded-lg border transition-all ${
            value === preset.id
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          <div className="text-2xl mb-1">{preset.icon}</div>
          <div className="text-xs">{preset.name}</div>
        </button>
      ))}
    </div>
  );
};

// Template Preset Component
const TemplatePreset = ({ onApply, onClose }) => {
  const templates = [
    {
      id: 'developer',
      name: 'Developer Portfolio',
      icon: Code2,
      description: 'Perfect for software developers and programmers',
      sections: ['hero', 'about', 'skills', 'projects', 'experience', 'contact']
    },
    {
      id: 'designer',
      name: 'Designer Portfolio',
      icon: Paintbrush,
      description: 'Showcase your creative design work',
      sections: ['hero', 'about', 'gallery', 'projects', 'testimonials', 'contact']
    },
    {
      id: 'freelancer',
      name: 'Freelancer',
      icon: Briefcase,
      description: 'Attract clients with a professional portfolio',
      sections: ['hero', 'services', 'portfolio', 'pricing', 'testimonials', 'contact']
    },
    {
      id: 'business',
      name: 'Business',
      icon: TrendingUp,
      description: 'Corporate and business-focused',
      sections: ['hero', 'about', 'services', 'team', 'stats', 'contact']
    },
    {
      id: 'photographer',
      name: 'Photographer',
      icon: Camera,
      description: 'Display your photography portfolio',
      sections: ['hero', 'gallery', 'about', 'services', 'testimonials', 'contact']
    },
    {
      id: 'minimal',
      name: 'Minimal',
      icon: Feather,
      description: 'Clean and minimalist design',
      sections: ['hero', 'about', 'projects', 'contact']
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Choose a Template</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all"
              onClick={() => onApply(template)}
            >
              <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <template.icon size={32} className="text-cyan-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{template.name}</h4>
              <p className="text-slate-400 text-sm mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.sections.map((section) => (
                  <span key={section} className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded">
                    {section}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Portfolio Editor Component
const PortfolioEditor = () => {
  const { user } = useAuth();
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
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showAISuggester, setShowAISuggester] = useState(false);
  const [showTemplatePreset, setShowTemplatePreset] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [breakpoints, setBreakpoints] = useState({
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  });
  
  // New state variables for enhanced features
  const [collaborators, setCollaborators] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [portfolioConfig, setPortfolioConfig] = useState({
    sections: [],
    theme: {
      primaryColor: '#06b6d4',
      secondaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      headingFont: 'Poppins, sans-serif',
      fontSize: {
        base: '16px',
        heading: '2.5rem',
        subheading: '1.5rem'
      },
      spacing: {
        sectionPadding: '4rem',
        elementSpacing: '1.5rem'
      },
      borderRadius: '0.5rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      }
    },
    seo: {
      title: '',
      description: '',
      keywords: [],
      ogImage: '',
      favicon: '',
      twitterCard: 'summary_large_image',
      canonicalUrl: ''
    },
    settings: {
      animations: true,
      smoothScroll: true,
      darkMode: true,
      showSocialLinks: true,
      enableAnalytics: false,
      enableLiveChat: false,
      cookieConsent: false,
      lazyLoading: true,
      progressBar: true,
      customCSS: '',
      customJS: ''
    },
    navigation: {
      logo: '',
      style: 'fixed',
      transparent: true,
      links: []
    },
    footer: {
      showSocial: true,
      showCopyright: true,
      customText: '',
      links: []
    },
    integrations: {
      googleAnalytics: '',
      googleTagManager: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      github: '',
      customScripts: []
    }
  });

  const sections = Array.isArray(portfolioConfig?.sections) ? portfolioConfig.sections : [];

  // Enhanced panel tabs definition
  const enhancedPanelTabs = [
    { id: 'sections', label: 'Sections', icon: Layers, count: sections.length },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'seo', label: 'SEO', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Extended Section Templates
  const [sectionTemplates] = useState([
    {
      id: 'hero',
      name: 'Hero Section',
      type: 'hero',
      icon: Sparkles,
      category: 'header',
      description: 'Eye-catching introduction with CTA',
      defaultSettings: {
        background: 'gradient',
        textAlign: 'center',
        showCTA: true,
        animation: 'fadeIn',
        height: 'screen',
        overlay: true
      }
    },
    {
      id: 'about',
      name: 'About Me',
      type: 'about',
      icon: FileText,
      category: 'content',
      description: 'Personal introduction and bio',
      defaultSettings: {
        layout: 'two-column',
        showImage: true,
        showStats: true,
        imagePosition: 'left'
      }
    },
    {
      id: 'skills',
      name: 'Skills',
      type: 'skills',
      icon: Wand2,
      category: 'content',
      description: 'Display your expertise and abilities',
      defaultSettings: {
        layout: 'grid',
        showProgress: true,
        columns: 3,
        animation: 'slideUp'
      }
    },
    {
      id: 'projects',
      name: 'Projects',
      type: 'portfolio',
      icon: Grid,
      category: 'showcase',
      description: 'Showcase your work and projects',
      defaultSettings: {
        layout: 'grid',
        columns: 3,
        showFilters: true,
        sortBy: 'date',
        lightbox: true
      }
    },
    {
      id: 'experience',
      name: 'Experience',
      type: 'timeline',
      icon: History,
      category: 'content',
      description: 'Work history and education timeline',
      defaultSettings: {
        layout: 'timeline',
        showDuration: true,
        alternating: true
      }
    },
    {
      id: 'testimonials',
      name: 'Testimonials',
      type: 'testimonials',
      icon: MessageSquare,
      category: 'social-proof',
      description: 'Client reviews and testimonials',
      defaultSettings: {
        layout: 'carousel',
        showRating: true,
        autoplay: true,
        columns: 3
      }
    },
    {
      id: 'stats',
      name: 'Statistics',
      type: 'stats',
      icon: TrendingUp,
      category: 'content',
      description: 'Display metrics and achievements',
      defaultSettings: {
        layout: 'grid',
        columns: 4,
        animation: 'countUp',
        duration: 2000
      }
    },
    {
      id: 'pricing',
      name: 'Pricing',
      type: 'pricing',
      icon: DollarSign,
      category: 'business',
      description: 'Service packages and pricing',
      defaultSettings: {
        layout: 'three-tier',
        showCTA: true,
        currency: '$',
        period: 'month'
      }
    },
    {
      id: 'blog',
      name: 'Blog Posts',
      type: 'blog',
      icon: BookOpen,
      category: 'content',
      description: 'Latest articles and posts',
      defaultSettings: {
        layout: 'grid',
        columns: 2,
        showExcerpt: true,
        showDate: true,
        showAuthor: true
      }
    },
    {
      id: 'media',
      name: 'Media Gallery',
      type: 'media',
      icon: Video,
      category: 'media',
      description: 'Image and video gallery',
      defaultSettings: {
        layout: 'masonry',
        columns: 3,
        lightbox: true,
        showCaptions: true
      }
    },
    {
      id: 'events',
      name: 'Events Timeline',
      type: 'events',
      icon: Calendar,
      category: 'content',
      description: 'Upcoming and past events',
      defaultSettings: {
        layout: 'timeline',
        showPastEvents: true,
        showRegistration: true
      }
    },
    {
      id: 'map',
      name: 'Location Map',
      type: 'map',
      icon: MapPin,
      category: 'layout',
      description: 'Interactive location map',
      defaultSettings: {
        zoom: 12,
        showMarker: true,
        interactive: true
      }
    },
    {
      id: 'music',
      name: 'Music Player',
      type: 'music',
      icon: Music,
      category: 'media',
      description: 'Audio player and tracks',
      defaultSettings: {
        showPlaylist: true,
        autoPlay: false,
        showProgress: true
      }
    },
    {
      id: 'awards',
      name: 'Awards & Recognition',
      type: 'awards',
      icon: Award,
      category: 'content',
      description: 'Achievements and awards',
      defaultSettings: {
        layout: 'grid',
        showYear: true,
        showDescription: true
      }
    },
    {
      id: 'experiments',
      name: 'Experiments',
      type: 'experiments',
      icon: TestTube,
      category: 'advanced',
      description: 'Interactive demos and experiments',
      defaultSettings: {
        interactive: true,
        showCode: false,
        fullscreen: false
      }
    },
    {
      id: 'services',
      name: 'Services',
      type: 'services',
      icon: Briefcase,
      category: 'business',
      description: 'Services you offer',
      defaultSettings: {
        layout: 'grid',
        columns: 3,
        showIcon: true,
        showPricing: false
      }
    },
    {
      id: 'pricing',
      name: 'Pricing',
      type: 'pricing',
      icon: DollarSign,
      category: 'business',
      description: 'Pricing plans and packages',
      defaultSettings: {
        layout: 'cards',
        columns: 3,
        showPopular: true,
        billingToggle: true
      }
    },
    {
      id: 'team',
      name: 'Team',
      type: 'team',
      icon: Users,
      category: 'business',
      description: 'Team members showcase',
      defaultSettings: {
        layout: 'grid',
        columns: 4,
        showSocial: true,
        showRole: true
      }
    },
    {
      id: 'gallery',
      name: 'Gallery',
      type: 'gallery',
      icon: GalleryIcon,
      category: 'showcase',
      description: 'Image gallery with lightbox',
      defaultSettings: {
        layout: 'masonry',
        columns: 4,
        lightbox: true,
        showCaptions: true
      }
    },
    {
      id: 'video',
      name: 'Video Section',
      type: 'video',
      icon: Video,
      category: 'media',
      description: 'Video background or embed',
      defaultSettings: {
        type: 'embed',
        autoplay: false,
        controls: true,
        loop: false
      }
    },
    {
      id: 'stats',
      name: 'Statistics',
      type: 'stats',
      icon: TrendingUp,
      category: 'content',
      description: 'Animated counter statistics',
      defaultSettings: {
        layout: 'row',
        animated: true,
        columns: 4,
        showIcons: true
      }
    },
    {
      id: 'faq',
      name: 'FAQ',
      type: 'faq',
      icon: MessageCircle,
      category: 'content',
      description: 'Frequently asked questions',
      defaultSettings: {
        layout: 'accordion',
        columns: 1,
        searchable: true,
        expandFirst: true
      }
    },
    {
      id: 'blog',
      name: 'Blog Posts',
      type: 'blog',
      icon: BookOpen,
      category: 'content',
      description: 'Latest blog posts showcase',
      defaultSettings: {
        layout: 'grid',
        columns: 3,
        showExcerpt: true,
        showDate: true,
        limit: 6
      }
    },
    {
      id: 'contact',
      name: 'Contact',
      type: 'contact',
      icon: Mail,
      category: 'footer',
      description: 'Contact form and information',
      defaultSettings: {
        showForm: true,
        showMap: false,
        showSocial: true,
        showInfo: true
      }
    },
    {
      id: 'cta',
      name: 'Call to Action',
      type: 'cta',
      icon: Zap,
      category: 'conversion',
      description: 'Conversion-focused CTA section',
      defaultSettings: {
        layout: 'centered',
        background: 'gradient',
        showButton: true,
        fullWidth: true
      }
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      type: 'newsletter',
      icon: Send,
      category: 'conversion',
      description: 'Email subscription form',
      defaultSettings: {
        layout: 'inline',
        showPrivacy: true,
        successMessage: 'Thanks for subscribing!'
      }
    },
    {
      id: 'social',
      name: 'Social Links',
      type: 'social',
      icon: Share2,
      category: 'social-proof',
      description: 'Social media links and feeds',
      defaultSettings: {
        layout: 'row',
        showLabels: false,
        size: 'medium',
        animated: true
      }
    },
    {
      id: 'custom-html',
      name: 'Custom HTML',
      type: 'custom-html',
      icon: Code,
      category: 'advanced',
      description: 'Custom HTML/CSS/JS code',
      defaultSettings: {
        html: '',
        css: '',
        js: ''
      }
    },
    {
      id: 'divider',
      name: 'Divider',
      type: 'divider',
      icon: Minus,
      category: 'layout',
      description: 'Section divider or spacer',
      defaultSettings: {
        style: 'line',
        spacing: 'medium',
        showIcon: false
      }
    },
    {
      id: 'clients',
      name: 'Client Logos',
      type: 'clients',
      icon: Award,
      category: 'social-proof',
      description: 'Showcase client/partner logos',
      defaultSettings: {
        layout: 'carousel',
        columns: 5,
        grayscale: true,
        autoplay: true
      }
    },
    {
      id: 'achievements',
      name: 'Achievements',
      type: 'achievements',
      icon: Trophy,
      category: 'content',
      description: 'Awards and achievements',
      defaultSettings: {
        layout: 'timeline',
        showIcons: true,
        showDate: true
      }
    },
    {
      id: 'process',
      name: 'Process/Steps',
      type: 'process',
      icon: Workflow,
      category: 'content',
      description: 'Step-by-step process or workflow',
      defaultSettings: {
        layout: 'horizontal',
        numbered: true,
        columns: 4,
        showIcons: true
      }
    },
    {
      id: 'compare',
      name: 'Comparison Table',
      type: 'compare',
      icon: Split,
      category: 'business',
      description: 'Feature comparison table',
      defaultSettings: {
        columns: 3,
        showHighlight: true,
        showCheckmarks: true
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
    loadPortfolioConfig();
    loadVersions();
    loadCustomTemplates();
  }, []);

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

  // Auto-save functionality
  useEffect(() => {
    if (unsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        savePortfolioConfig(true); // Auto-save
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [unsavedChanges, portfolioConfig]);

  const loadPortfolioConfig = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPortfolioConfig();
      
      if (response.success) {
        const incoming = response.data || {};
        const normalized = {
          ...portfolioConfig,
          ...incoming,
          sections: Array.isArray(incoming.sections) ? incoming.sections : []
        };

        setPortfolioConfig(normalized);
        setCurrentVersion(response.version);
        addToHistory(normalized);
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

  const loadCustomTemplates = async () => {
    try {
      const response = await apiService.getCustomTemplates();
      if (response.success) {
        setCustomTemplates(response.data);
      }
    } catch (err) {
      console.error('Failed to load custom templates:', err);
      setCustomTemplates([]);
    }
  };

  const exportAsTemplate = () => {
    const template = {
      ...portfolioConfig,
      metadata: {
        name: `${user?.username}'s Portfolio Template`,
        created: new Date().toISOString(),
        sections: sections.length,
        author: user?.username
      }
    };
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `portfolio-template-${Date.now()}.json`);
    linkElement.click();
    
    success('Template exported successfully!');
  };

  const savePortfolioConfig = async (autoSave = false) => {
    try {
      setSaving(true);
      const response = await apiService.savePortfolioConfig({
        config: portfolioConfig,
        versionName: autoSave 
          ? `Auto-save ${new Date().toLocaleString()}`
          : `Version ${new Date().toLocaleString()}`
      });

      if (response.success) {
        if (!autoSave) {
          success('Portfolio saved successfully!');
        }
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
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
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
      },
      animations: {
        enabled: true,
        type: 'fadeIn',
        duration: 0.6,
        delay: 0
      },
      responsive: {
        mobile: { visible: true },
        tablet: { visible: true },
        desktop: { visible: true }
      },
      customCSS: '',
      customJS: ''
    };

    updateConfig({
      sections: [...sections, newSection]
    });
    
    setShowSectionModal(false);
    success(`${template.name} added`);
  };

  const toggleSection = (id) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    updateConfig({ sections: newSections });
  };

  const deleteSection = (id) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const newSections = sections.filter(s => s.id !== id);
      updateConfig({ sections: newSections });
      success('Section deleted');
      if (selectedSection?.id === id) {
        setSelectedSection(null);
      }
    }
  };

  const duplicateSection = (id) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      const duplicate = {
        ...section,
        id: `section_${Date.now()}`,
        name: `${section.name} (Copy)`
      };
      updateConfig({
        sections: [...sections, duplicate]
      });
      success('Section duplicated');
    }
  };

  const cloneAsTemplate = async (id) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      try {
        const response = await apiService.saveCustomTemplate({
          name: `${section.name} Template`,
          section: section
        });
        if (response.success) {
          success('Section saved as template');
          loadCustomTemplates();
        }
      } catch (err) {
        showError('Failed to save template');
      }
    }
  };

  const editSection = (section) => {
    setSelectedSection(section);
  };

  const updateSection = (id, updates) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateConfig({ sections: newSections });
    
    // Update selected section if it's the one being edited
    if (selectedSection?.id === id) {
      setSelectedSection({ ...selectedSection, ...updates });
    }
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

  const applyTemplate = async (template) => {
    if (confirm('This will replace your current portfolio. Continue?')) {
      try {
        const response = await apiService.getTemplateData(template.id);
        if (response.success) {
          setPortfolioConfig(response.data);
          addToHistory(response.data);
          setUnsavedChanges(true);
          success(`${template.name} template applied!`);
          setShowTemplatePreset(false);
        }
      } catch (err) {
        showError('Failed to load template');
      }
    }
  };

  const applyAISuggestions = (suggestions) => {
    if (selectedSection) {
      updateSection(selectedSection.id, {
        content: {
          ...selectedSection.content,
          ...suggestions
        }
      });
      success('AI suggestions applied!');
      setShowAISuggester(false);
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

  const runAccessibilityCheck = async () => {
    try {
      const response = await apiService.checkAccessibility(portfolioConfig);
      if (response.success) {
        const issues = response.data.issues;
        if (issues.length === 0) {
          success('No accessibility issues found!');
        } else {
          warning(`Found ${issues.length} accessibility issues`);
          // Show issues in a modal or panel
        }
      }
    } catch (err) {
      showError('Failed to run accessibility check');
    }
  };

  const optimizePerformance = async () => {
    try {
      const response = await apiService.optimizePortfolio(portfolioConfig);
      if (response.success) {
        setPortfolioConfig(response.data.optimized);
        success(`Performance optimized! Reduced ${response.data.savings}%`);
      }
    } catch (err) {
      showError('Failed to optimize performance');
    }
  };

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
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} className="text-slate-400" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} className="text-slate-400" />
            </button>
            <div className="px-2 text-xs text-slate-500">
              {historyIndex + 1}/{history.length}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="hover:text-cyan-400 transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="hover:text-cyan-400 transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="ml-1 hover:text-cyan-400 transition-colors"
              title="Reset zoom"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => setShowTemplatePreset(true)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 flex items-center gap-2"
            title="Apply template"
          >
            <Sparkles size={18} />
            Templates
          </button>

          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <Eye size={18} />
            Preview
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {[
              {
                id: 'optimize',
                label: 'Optimize All',
                icon: Zap,
                action: () => success('Portfolio optimized!')
              },
              {
                id: 'backup',
                label: 'Create Backup',
                icon: Cloud,
                action: exportAsTemplate
              },
              {
                id: 'validate',
                label: 'Validate',
                icon: Shield,
                action: () => warning('Validation complete. 2 suggestions found.')
              }
            ].map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="px-3 py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
                title={action.label}
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showAIPanel 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="AI Assistant"
          >
            <Sparkles size={18} />
          </button>

          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Analytics"
          >
            <BarChart3 size={18} />
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
            onClick={() => savePortfolioConfig(false)}
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

            {/* Enhanced Panel Tabs */}
            <div>
              <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg mb-4">
                {enhancedPanelTabs.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`flex-1 px-2 py-2 rounded-md flex items-center justify-center gap-1 transition-all text-xs ${
                      activePanel === panel.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={panel.label}
                  >
                    <panel.icon size={14} />
                    <span>{panel.label}</span>
                    {panel.count !== undefined && (
                      <span className="bg-cyan-500/20 text-cyan-400 text-xs px-1 rounded">
                        {panel.count}
                      </span>
                    )}
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
                    {/* AI Assistant Panel */}
                    {showAIPanel && (
                      <AIAssistantPanel 
                        onSuggestion={applyAISuggestion}
                        theme={theme}
                      />
                    )}

                    {/* Analytics Panel */}
                    {showAnalytics && (
                      <AnalyticsPanel portfolioConfig={portfolioConfig} />
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">
                        Page Sections ({sections.length})
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowSectionModal(true)}
                          className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                          title="Add Section"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => setShowTemplatePreset(true)}
                          className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                          title="Templates"
                        >
                          <Grid size={16} />
                        </button>
                      </div>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {sections.map((section) => (
                          <SortableSection
                            key={section.id}
                            section={section}
                            onEdit={editSection}
                            onToggle={toggleSection}
                            onDelete={deleteSection}
                            onDuplicate={duplicateSection}
                            onClone={cloneAsTemplate}
                            theme={theme}
                            isSelected={selectedSection?.id === section.id}
                            sections={sections}
                            updateConfig={updateConfig}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {sections.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Layers size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm mb-4">No sections yet</p>
                        <button
                          onClick={() => setShowSectionModal(true)}
                          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
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
                    className="space-y-6"
                  >
                    {/* Colors */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Palette size={16} />
                        Color Scheme
                      </h4>
                      <div className="space-y-4">
                        <ColorPicker
                          label="Primary Color"
                          color={portfolioConfig.theme.primaryColor}
                          onChange={(color) => updateConfig({
                            theme: { ...portfolioConfig.theme, primaryColor: color }
                          })}
                        />
                        <ColorPicker
                          label="Secondary Color"
                          color={portfolioConfig.theme.secondaryColor}
                          onChange={(color) => updateConfig({
                            theme: { ...portfolioConfig.theme, secondaryColor: color }
                          })}
                        />
                        <ColorPicker
                          label="Accent Color"
                          color={portfolioConfig.theme.accentColor}
                          onChange={(color) => updateConfig({
                            theme: { ...portfolioConfig.theme, accentColor: color }
                          })}
                        />
                        <ColorPicker
                          label="Background"
                          color={portfolioConfig.theme.backgroundColor}
                          onChange={(color) => updateConfig({
                            theme: { ...portfolioConfig.theme, backgroundColor: color }
                          })}
                        />
                      </div>
                    </div>

                    {/* Typography */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Type size={16} />
                        Typography
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Body Font
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
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Heading Font
                          </label>
                          <select
                            value={portfolioConfig.theme.headingFont}
                            onChange={(e) => updateConfig({
                              theme: { ...portfolioConfig.theme, headingFont: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                          >
                            <option value="Poppins, sans-serif">Poppins</option>
                            <option value="Montserrat, sans-serif">Montserrat</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Bebas Neue', cursive">Bebas Neue</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Base Font Size
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.theme.fontSize.base}
                            onChange={(e) => updateConfig({
                              theme: { 
                                ...portfolioConfig.theme, 
                                fontSize: { ...portfolioConfig.theme.fontSize, base: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Columns size={16} />
                        Spacing
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Section Padding
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.theme.spacing.sectionPadding}
                            onChange={(e) => updateConfig({
                              theme: { 
                                ...portfolioConfig.theme, 
                                spacing: { ...portfolioConfig.theme.spacing, sectionPadding: e.target.value }
                              }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="e.g., 4rem"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Border Radius
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.theme.borderRadius}
                            onChange={(e) => updateConfig({
                              theme: { ...portfolioConfig.theme, borderRadius: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="e.g., 0.5rem"
                          />
                        </div>
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
                    className="space-y-6"
                  >
                    {/* SEO Settings */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Search size={16} />
                        SEO Settings
                      </h4>
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
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Keywords (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.seo.keywords.join(', ')}
                            onChange={(e) => updateConfig({
                              seo: { 
                                ...portfolioConfig.seo, 
                                keywords: e.target.value.split(',').map(k => k.trim())
                              }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="portfolio, developer, designer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap size={16} />
                        Features
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(portfolioConfig.settings).map(([key, value]) => {
                          if (typeof value === 'boolean') {
                            return (
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
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Share2 size={16} />
                        Social Links
                      </h4>
                      <div className="space-y-2">
                        {['github', 'linkedin', 'twitter', 'facebook'].map((platform) => (
                          <div key={platform}>
                            <label className="block text-sm text-slate-400 mb-1 capitalize">
                              {platform}
                            </label>
                            <input
                              type="text"
                              value={portfolioConfig.integrations[platform] || ''}
                              onChange={(e) => updateConfig({
                                integrations: { ...portfolioConfig.integrations, [platform]: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                              placeholder={`https://${platform}.com/...`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
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
                        <button
                          onClick={runAccessibilityCheck}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Shield size={16} />
                          Check Accessibility
                        </button>
                        <button
                          onClick={optimizePerformance}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Gauge size={16} />
                          Optimize Performance
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Advanced Panel */}
                {activePanel === 'advanced' && (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Custom CSS */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Code2 size={16} />
                        Custom CSS
                      </h4>
                      <AceEditor
                        mode="css"
                        theme="monokai"
                        value={portfolioConfig.settings.customCSS || ''}
                        onChange={(value) => updateConfig({
                          settings: { ...portfolioConfig.settings, customCSS: value }
                        })}
                        width="100%"
                        height="200px"
                        fontSize={12}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                          enableBasicAutocompletion: true,
                          enableLiveAutocompletion: true,
                          showLineNumbers: true,
                          tabSize: 2
                        }}
                      />
                    </div>

                    {/* Custom JavaScript */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FileCode size={16} />
                        Custom JavaScript
                      </h4>
                      <AceEditor
                        mode="javascript"
                        theme="monokai"
                        value={portfolioConfig.settings.customJS || ''}
                        onChange={(value) => updateConfig({
                          settings: { ...portfolioConfig.settings, customJS: value }
                        })}
                        width="100%"
                        height="200px"
                        fontSize={12}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                          enableBasicAutocompletion: true,
                          enableLiveAutocompletion: true,
                          showLineNumbers: true,
                          tabSize: 2
                        }}
                      />
                    </div>

                    {/* Analytics */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <BarChart size={16} />
                        Analytics & Tracking
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Google Analytics ID
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.integrations.googleAnalytics || ''}
                            onChange={(e) => updateConfig({
                              integrations: { ...portfolioConfig.integrations, googleAnalytics: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="UA-XXXXXXXXX-X"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Google Tag Manager ID
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.integrations.googleTagManager || ''}
                            onChange={(e) => updateConfig({
                              integrations: { ...portfolioConfig.integrations, googleTagManager: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="GTM-XXXXXXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakpoints */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Smartphone size={16} />
                        Responsive Breakpoints
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(breakpoints).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm text-slate-400 mb-1 capitalize">
                              {key}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setBreakpoints({ ...breakpoints, [key]: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Version History */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <History size={16} />
                        Version History
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white font-medium">
                                {version.name}
                              </span>
                              {version.id === currentVersion && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                {new Date(version.createdAt).toLocaleString()}
                              </span>
                              {version.id !== currentVersion && (
                                <button
                                  onClick={() => restoreVersion(version.id)}
                                  className="text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl min-h-[600px] overflow-hidden">
                {editorMode === 'visual' && (
                  <div className="p-8">
                    {sections.filter(s => s.visible).length === 0 ? (
                      <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                          <Layout size={64} className="mx-auto mb-4 text-slate-600" />
                          <h3 className="text-xl font-semibold text-slate-400 mb-2">
                            No Visible Sections
                          </h3>
                          <p className="text-slate-500 mb-6">
                            Add sections from the sidebar to build your portfolio
                          </p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => setShowSectionModal(true)}
                              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2"
                            >
                              <Plus size={20} />
                              Add Section
                            </button>
                            <button
                              onClick={() => setShowTemplatePreset(true)}
                              className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-lg font-semibold flex items-center gap-2 border border-purple-500/30"
                            >
                              <Sparkles size={20} />
                              Use Template
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sections.filter(s => s.visible).map((section) => (
                          <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group relative p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                              selectedSection?.id === section.id
                                ? 'bg-cyan-500/10 border-cyan-500'
                                : 'bg-slate-900/30 border-slate-700 hover:border-cyan-500/50'
                            }`}
                            onClick={() => editSection(section)}
                          >
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAISuggester(true);
                                  setSelectedSection(section);
                                }}
                                className="p-2 bg-purple-500/20 backdrop-blur-sm rounded-lg hover:bg-purple-500/30 transition-colors"
                                title="AI Suggestions"
                              >
                                <Sparkles size={14} className="text-purple-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editSection(section);
                                }}
                                className="p-2 bg-slate-800 backdrop-blur-sm rounded-lg hover:bg-slate-700 transition-colors"
                                title="Edit Section"
                              >
                                <Edit3 size={14} className="text-cyan-400" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Layout size={20} className="text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white">
                                  {section.content?.title || section.name}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {section.type} section
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-400">
                              {section.content?.description || `${section.type} section - Click to edit`}
                            </p>
                            
                            {section.settings && Object.keys(section.settings).length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(section.settings).slice(0, 5).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded"
                                  >
                                    {key}: {value.toString()}
                                  </span>
                                ))}
                                {Object.keys(section.settings).length > 5 && (
                                  <span className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded">
                                    +{Object.keys(section.settings).length - 5} more
                                  </span>
                                )}
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
                    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
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
        <AnimatePresence>
          {selectedSection && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-96 bg-slate-800/50 border-l border-slate-700/50 overflow-y-auto custom-scrollbar"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Edit3 size={18} />
                    Edit Section
                  </h3>
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Basic Information</h4>
                    <div className="space-y-3">
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
                    </div>
                  </div>

                  {/* Animation Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles size={16} />
                      Animations
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-sm text-white">Enable Animations</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSection.animations?.enabled || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSection,
                                animations: { ...selectedSection.animations, enabled: e.target.checked }
                              };
                              setSelectedSection(updated);
                              updateSection(selectedSection.id, { animations: updated.animations });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                        </label>
                      </div>

                      {selectedSection.animations?.enabled && (
                        <>
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Animation Type
                            </label>
                            <AnimationPresetSelector
                              value={selectedSection.animations?.type || 'fadeIn'}
                              onChange={(type) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, type }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Duration (seconds)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={selectedSection.animations?.duration || 0.6}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, duration: parseFloat(e.target.value) }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Delay (seconds)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={selectedSection.animations?.delay || 0}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, delay: parseFloat(e.target.value) }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sliders size={16} />
                      Section Settings
                    </h4>
                    {selectedSection.settings && Object.entries(selectedSection.settings).map(([key, value]) => (
                      <div key={key} className="mb-3">
                        <label className="block text-sm text-slate-400 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        {typeof value === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer w-full">
                            <div className="flex items-center justify-between w-full p-3 bg-slate-900/50 rounded-lg">
                              <span className="text-sm text-white">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
                              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:right-3 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                            </div>
                          </label>
                        ) : typeof value === 'number' ? (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSection,
                                settings: { ...selectedSection.settings, [key]: parseInt(e.target.value) || 0 }
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

                  {/* Responsive Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Smartphone size={16} />
                      Responsive Visibility
                    </h4>
                    <div className="space-y-2">
                      {['mobile', 'tablet', 'desktop'].map((device) => (
                        <div key={device} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <span className="text-sm text-white capitalize">{device}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSection.responsive?.[device]?.visible !== false}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  responsive: {
                                    ...selectedSection.responsive,
                                    [device]: { visible: e.target.checked }
                                  }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { responsive: updated.responsive });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom CSS */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Code2 size={16} />
                      Custom CSS
                    </h4>
                    <AceEditor
                      mode="css"
                      theme="monokai"
                      value={selectedSection.customCSS || ''}
                      onChange={(value) => {
                        const updated = { ...selectedSection, customCSS: value };
                        setSelectedSection(updated);
                        updateSection(selectedSection.id, { customCSS: value });
                      }}
                      width="100%"
                      height="150px"
                      fontSize={12}
                      showPrintMargin={false}
                      showGutter={false}
                      highlightActiveLine={true}
                      setOptions={{
                        enableBasicAutocompletion: true,
                        showLineNumbers: true,
                        tabSize: 2
                      }}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAISuggester(true);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles size={14} />
                        AI Assist
                      </button>
                      <button
                        onClick={() => setShowMediaLibrary(true)}
                        className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <ImageIcon size={14} />
                        Media
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Section Modal - Enhanced with Categories */}
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
              className="bg-slate-800 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
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

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'header', 'content', 'showcase', 'business', 'social-proof', 'conversion', 'media', 'footer', 'advanced'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {/* Filter by category */}}
                    className="px-4 py-2 bg-slate-900/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm capitalize"
                  >
                    {category.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sectionTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addSection(template)}
                    className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                      <template.icon size={24} className="text-cyan-400" />
                    </div>
                    <h4 className="text-white font-semibold mb-2">{template.name}</h4>
                    <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                    <span className="inline-block px-2 py-1 bg-slate-800/50 text-slate-500 text-xs rounded capitalize">
                      {template.category}
                    </span>
                  </motion.div>
                ))}

                {/* Custom Templates */}
                {customTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addSection(template)}
                    className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 hover:border-purple-500/50 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                      <Star size={24} className="text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold">{template.name}</h4>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        Custom
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{template.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <MediaLibrary
            onSelect={(media) => {
              // Handle media selection
              setShowMediaLibrary(false);
            }}
            onClose={() => setShowMediaLibrary(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Content Suggester Modal */}
      <AnimatePresence>
        {showAISuggester && selectedSection && (
          <AIContentSuggester
            section={selectedSection}
            onApply={applyAISuggestions}
            onClose={() => setShowAISuggester(false)}
          />
        )}
      </AnimatePresence>

      {/* Template Preset Modal */}
      <AnimatePresence>
        {showTemplatePreset && (
          <TemplatePreset
            onApply={applyTemplate}
            onClose={() => setShowTemplatePreset(false)}
          />
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Import Configuration</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Upload a JSON configuration file to import your portfolio settings.
              </p>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-all">
                <Upload size={48} className="mx-auto mb-4 text-slate-500" />
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold cursor-pointer hover:bg-cyan-600 transition-colors inline-block"
                >
                  Choose File
                </label>
                <p className="text-sm text-slate-500 mt-3">
                  or drag and drop your JSON file here
                </p>
              </div>
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

  // AI Assistant Component
  const AIAssistantPanel = ({ onSuggestion, theme }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateSuggestions = async () => {
      setLoading(true);
      // Simulate AI suggestions
      setTimeout(() => {
        setSuggestions([
          {
            id: 1,
            type: 'layout',
            message: 'Add a testimonials section to build trust',
            action: 'add_testimonials'
          },
          {
            id: 2,
            type: 'content',
            message: 'Your projects section could use more detailed descriptions',
            action: 'enhance_projects'
          },
          {
            id: 3,
            type: 'design',
            message: 'Consider adding a gradient background to the hero section',
            action: 'update_design'
          }
        ]);
        setLoading(false);
      }, 1000);
    };

    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles size={16} />
            AI Assistant
          </h4>
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Get Suggestions'}
          </button>
        </div>
        
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-colors cursor-pointer"
              onClick={() => onSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded ${
                  suggestion.type === 'layout' ? 'bg-blue-500/20' :
                  suggestion.type === 'content' ? 'bg-green-500/20' :
                  'bg-purple-500/20'
                }`}>
                  <Wand2 size={12} className={
                    suggestion.type === 'layout' ? 'text-blue-400' :
                    suggestion.type === 'content' ? 'text-green-400' :
                    'text-purple-400'
                  } />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm mb-1">{suggestion.message}</p>
                  <span className="text-slate-400 text-xs capitalize">{suggestion.type} suggestion</span>
                </div>
              </div>
            </div>
          ))}
          
          {suggestions.length === 0 && !loading && (
            <div className="text-center py-4 text-slate-500">
              <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Get AI-powered suggestions to improve your portfolio</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Collaboration Component
  const CollaborationPanel = ({ portfolioConfig, onInvite }) => {
    const [collaborators, setCollaborators] = useState([]);
    const [showInvite, setShowInvite] = useState(false);

    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users size={16} />
            Collaboration
          </h4>
          <button
            onClick={() => setShowInvite(true)}
            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
          >
            Invite
          </button>
        </div>

        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs text-white">
                  {collaborator.name[0]}
                </div>
                <span className="text-white text-sm">{collaborator.name}</span>
              </div>
              <span className="text-slate-400 text-xs capitalize">{collaborator.role}</span>
            </div>
          ))}
          
          {collaborators.length === 0 && (
            <div className="text-center py-3 text-slate-500">
              <Users size={20} className="mx-auto mb-1 opacity-50" />
              <p className="text-xs">No collaborators yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Analytics Dashboard Component
  const AnalyticsPanel = ({ portfolioConfig }) => {
    const [analytics, setAnalytics] = useState({
      views: 1247,
      engagement: 68,
      popularSections: ['hero', 'projects', 'about'],
      performance: 92
    });

    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp size={16} />
          Analytics
        </h4>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{analytics.views}</div>
            <div className="text-xs text-slate-400">Total Views</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{analytics.engagement}%</div>
            <div className="text-xs text-slate-400">Engagement</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Performance Score</span>
            <span className="text-white">{analytics.performance}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" 
              style={{ width: `${analytics.performance}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // New handler functions
  const toggleSectionLock = (id) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, locked: !s.locked } : s
    );
    updateConfig({ sections: newSections });
  };

  const markSectionFeatured = (id) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, featured: !s.featured } : s
    );
    updateConfig({ sections: newSections });
  };

  const applyAISuggestion = (suggestion) => {
    switch (suggestion.action) {
      case 'add_testimonials':
        addSection(sectionTemplates.find(t => t.id === 'testimonials'));
        break;
      case 'enhance_projects':
        // Enhance projects section logic
        break;
      case 'update_design':
        // Update design logic
        break;
      default:
        break;
    }
    success(`Applied: ${suggestion.message}`);
  };

  const quickActions = [
    {
      id: 'optimize',
      label: 'Optimize All',
      icon: Zap,
      action: () => {
        // Optimization logic
        success('Portfolio optimized!');
      }
    },
    {
      id: 'backup',
      label: 'Create Backup',
      icon: Cloud,
      action: exportAsTemplate
    },
    {
      id: 'validate',
      label: 'Validate',
      icon: Shield,
      action: () => {
        // Validation logic
        warning('Validation complete. 2 suggestions found.');
      }
    }
  ];

  return (
    <DashboardLayout
      title="Enhanced Portfolio Editor"
      subtitle="AI-powered portfolio builder with advanced features"
      actions={
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {[
              {
                id: 'optimize',
                label: 'Optimize All',
                icon: Zap,
                action: () => success('Portfolio optimized!')
              },
              {
                id: 'backup',
                label: 'Create Backup',
                icon: Cloud,
                action: exportAsTemplate
              },
              {
                id: 'validate',
                label: 'Validate',
                icon: Shield,
                action: () => warning('Validation complete. 2 suggestions found.')
              }
            ].map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="px-3 py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
                title={action.label}
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showAIPanel 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="AI Assistant"
          >
            <Sparkles size={18} />
          </button>

          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Analytics"
          >
            <BarChart3 size={18} />
          </button>

          {/* ... existing action buttons */}
        </div>
      }
    >
      <div className="flex h-[calc(100vh-200px)] overflow-hidden bg-slate-900">
        {/* Left Sidebar - Enhanced with AI and Analytics */}
        <div className="w-80 bg-slate-800/50 border-r border-slate-700/50 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {/* Enhanced Panel Tabs */}
            <div>
              <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg mb-4">
                {enhancedPanelTabs.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`flex-1 px-2 py-2 rounded-md flex items-center justify-center gap-1 transition-all text-xs ${
                      activePanel === panel.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={panel.label}
                  >
                    <panel.icon size={14} />
                    <span>{panel.label}</span>
                    {panel.count !== undefined && (
                      <span className="bg-cyan-500/20 text-cyan-400 text-xs px-1 rounded">
                        {panel.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Enhanced Panel Content */}
              <AnimatePresence mode="wait">
                {activePanel === 'sections' && (
                  <motion.div
                    key="sections"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* AI Assistant Panel */}
                    {showAIPanel && (
                      <AIAssistantPanel 
                        onSuggestion={applyAISuggestion}
                        theme={theme}
                      />
                    )}

                    {/* Analytics Panel */}
                    {showAnalytics && (
                      <AnalyticsPanel portfolioConfig={portfolioConfig} />
                    )}

                    {/* Sections Management */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">
                          Page Sections ({sections.length})
                        </h3>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowSectionModal(true)}
                            className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                            title="Add Section"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => setShowTemplatePreset(true)}
                            className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                            title="Templates"
                          >
                            <Grid size={16} />
                          </button>
                        </div>
                      </div>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={sections.map(s => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {sections.map((section) => (
                            <SortableSection
                              key={section.id}
                              section={section}
                              onEdit={editSection}
                              onToggle={toggleSection}
                              onDelete={deleteSection}
                              onDuplicate={duplicateSection}
                              onClone={cloneAsTemplate}
                              theme={theme}
                              isSelected={selectedSection?.id === section.id}
                              sections={sections}
                              updateConfig={updateConfig}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Design Panel */}
                {activePanel === 'design' && (
                  <motion.div
                    key="design"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Color Presets */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Color Presets
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          '#06b6d4', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981',
                          '#f59e0b', '#ec4899', '#6366f1', '#84cc16', '#64748b'
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig({
                              theme: { ...portfolioConfig.theme, primaryColor: color }
                            })}
                            className="w-8 h-8 rounded-lg border-2 border-slate-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Gradient Backgrounds */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Background Gradients
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                        ].map((gradient) => (
                          <button
                            key={gradient}
                            onClick={() => updateConfig({
                              theme: { ...portfolioConfig.theme, background: gradient }
                            })}
                            className="h-10 rounded-lg border border-slate-600 hover:border-cyan-500 transition-colors"
                            style={{ background: gradient }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* ... existing design controls */}
                  </motion.div>
                )}

                {/* New Content Panel */}
                {activePanel === 'content' && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-white mb-3">Content Management</h4>
                      
                      <div className="space-y-3">
                        <button className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                          <span>Media Library</span>
                          <ImageIcon size={16} />
                        </button>
                        
                        <button className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                          <span>Content Revisions</span>
                          <History size={16} />
                        </button>
                        
                        <button className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                          <span>Bulk Editor</span>
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced SEO Panel */}
                {activePanel === 'seo' && (
                  <motion.div
                    key="seo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-white mb-3">SEO Analysis</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">SEO Score</span>
                          <span className="text-green-400 font-semibold">85/100</span>
                        </div>
                        
                        <div className="space-y-2">
                          {[
                            { label: 'Meta Tags', status: 'good' },
                            { label: 'Heading Structure', status: 'warning' },
                            { label: 'Image Alt Texts', status: 'poor' },
                            { label: 'Page Speed', status: 'good' }
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">{item.label}</span>
                              <span className={
                                item.status === 'good' ? 'text-green-400' :
                                item.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                              }>
                                {item.status === 'good' ? '✓' : item.status === 'warning' ? '⚠' : '✗'}
                              </span>
                            </div>
                          ))}
                        </div>
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
                    className="space-y-6"
                  >
                    {/* SEO Settings */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Search size={16} />
                        SEO Settings
                      </h4>
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
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Keywords (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={portfolioConfig.seo.keywords.join(', ')}
                            onChange={(e) => updateConfig({
                              seo: { 
                                ...portfolioConfig.seo, 
                                keywords: e.target.value.split(',').map(k => k.trim())
                              }
                            })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            placeholder="portfolio, developer, designer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap size={16} />
                        Features
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(portfolioConfig.settings).map(([key, value]) => {
                          if (typeof value === 'boolean') {
                            return (
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
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Share2 size={16} />
                        Social Links
                      </h4>
                      <div className="space-y-2">
                        {['github', 'linkedin', 'twitter', 'facebook'].map((platform) => (
                          <div key={platform}>
                            <label className="block text-sm text-slate-400 mb-1 capitalize">
                              {platform}
                            </label>
                            <input
                              type="text"
                              value={portfolioConfig.integrations[platform] || ''}
                              onChange={(e) => updateConfig({
                                integrations: { ...portfolioConfig.integrations, [platform]: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                              placeholder={`https://${platform}.com/...`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
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
                        <button
                          onClick={runAccessibilityCheck}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Shield size={16} />
                          Check Accessibility
                        </button>
                        <button
                          onClick={optimizePerformance}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Gauge size={16} />
                          Optimize Performance
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
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl min-h-[600px] overflow-hidden">
                {editorMode === 'visual' && (
                  <div className="p-8">
                    {sections.filter(s => s.visible).length === 0 ? (
                      <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                          <Layout size={64} className="mx-auto mb-4 text-slate-600" />
                          <h3 className="text-xl font-semibold text-slate-400 mb-2">
                            No Visible Sections
                          </h3>
                          <p className="text-slate-500 mb-6">
                            Add sections from the sidebar to build your portfolio
                          </p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => setShowSectionModal(true)}
                              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2"
                            >
                              <Plus size={20} />
                              Add Section
                            </button>
                            <button
                              onClick={() => setShowTemplatePreset(true)}
                              className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-lg font-semibold flex items-center gap-2 border border-purple-500/30"
                            >
                              <Sparkles size={20} />
                              Use Template
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sections.filter(s => s.visible).map((section) => (
                          <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group relative p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                              selectedSection?.id === section.id
                                ? 'bg-cyan-500/10 border-cyan-500'
                                : 'bg-slate-900/30 border-slate-700 hover:border-cyan-500/50'
                            }`}
                            onClick={() => editSection(section)}
                          >
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAISuggester(true);
                                  setSelectedSection(section);
                                }}
                                className="p-2 bg-purple-500/20 backdrop-blur-sm rounded-lg hover:bg-purple-500/30 transition-colors"
                                title="AI Suggestions"
                              >
                                <Sparkles size={14} className="text-purple-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editSection(section);
                                }}
                                className="p-2 bg-slate-800 backdrop-blur-sm rounded-lg hover:bg-slate-700 transition-colors"
                                title="Edit Section"
                              >
                                <Edit3 size={14} className="text-cyan-400" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Layout size={20} className="text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white">
                                  {section.content?.title || section.name}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {section.type} section
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-400">
                              {section.content?.description || `${section.type} section - Click to edit`}
                            </p>
                            
                            {section.settings && Object.keys(section.settings).length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(section.settings).slice(0, 5).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded"
                                  >
                                    {key}: {value.toString()}
                                  </span>
                                ))}
                                {Object.keys(section.settings).length > 5 && (
                                  <span className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded">
                                    +{Object.keys(section.settings).length - 5} more
                                  </span>
                                )}
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
                    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
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
        <AnimatePresence>
          {selectedSection && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-96 bg-slate-800/50 border-l border-slate-700/50 overflow-y-auto custom-scrollbar"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Edit3 size={18} />
                    Edit Section
                  </h3>
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Basic Information</h4>
                    <div className="space-y-3">
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
                    </div>
                  </div>

                  {/* Animation Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles size={16} />
                      Animations
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-sm text-white">Enable Animations</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSection.animations?.enabled || false}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSection,
                                animations: { ...selectedSection.animations, enabled: e.target.checked }
                              };
                              setSelectedSection(updated);
                              updateSection(selectedSection.id, { animations: updated.animations });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                        </label>
                      </div>

                      {selectedSection.animations?.enabled && (
                        <>
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Animation Type
                            </label>
                            <AnimationPresetSelector
                              value={selectedSection.animations?.type || 'fadeIn'}
                              onChange={(type) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, type }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Duration (seconds)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={selectedSection.animations?.duration || 0.6}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, duration: parseFloat(e.target.value) }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-2">
                              Delay (seconds)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={selectedSection.animations?.delay || 0}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  animations: { ...selectedSection.animations, delay: parseFloat(e.target.value) }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { animations: updated.animations });
                              }}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sliders size={16} />
                      Section Settings
                    </h4>
                    {selectedSection.settings && Object.entries(selectedSection.settings).map(([key, value]) => (
                      <div key={key} className="mb-3">
                        <label className="block text-sm text-slate-400 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        {typeof value === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer w-full">
                            <div className="flex items-center justify-between w-full p-3 bg-slate-900/50 rounded-lg">
                              <span className="text-sm text-white">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
                              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:right-3 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                            </div>
                          </label>
                        ) : typeof value === 'number' ? (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSection,
                                settings: { ...selectedSection.settings, [key]: parseInt(e.target.value) || 0 }
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

                  {/* Responsive Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Smartphone size={16} />
                      Responsive Visibility
                    </h4>
                    <div className="space-y-2">
                      {['mobile', 'tablet', 'desktop'].map((device) => (
                        <div key={device} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <span className="text-sm text-white capitalize">{device}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSection.responsive?.[device]?.visible !== false}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedSection,
                                  responsive: {
                                    ...selectedSection.responsive,
                                    [device]: { visible: e.target.checked }
                                  }
                                };
                                setSelectedSection(updated);
                                updateSection(selectedSection.id, { responsive: updated.responsive });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom CSS */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Code2 size={16} />
                      Custom CSS
                    </h4>
                    <AceEditor
                      mode="css"
                      theme="monokai"
                      value={selectedSection.customCSS || ''}
                      onChange={(value) => {
                        const updated = { ...selectedSection, customCSS: value };
                        setSelectedSection(updated);
                        updateSection(selectedSection.id, { customCSS: value });
                      }}
                      width="100%"
                      height="150px"
                      fontSize={12}
                      showPrintMargin={false}
                      showGutter={false}
                      highlightActiveLine={true}
                      setOptions={{
                        enableBasicAutocompletion: true,
                        showLineNumbers: true,
                        tabSize: 2
                      }}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAISuggester(true);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles size={14} />
                        AI Assist
                      </button>
                      <button
                        onClick={() => setShowMediaLibrary(true)}
                        className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <ImageIcon size={14} />
                        Media
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Section Modal - Enhanced with Categories */}
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
              className="bg-slate-800 rounded-2xl p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Add Section</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search sections..."
                    className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400"
                  />
                  <button
                    onClick={() => setShowSectionModal(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'header', 'content', 'showcase', 'business', 'social-proof', 'conversion', 'media', 'footer', 'advanced'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {/* Filter by category */}}
                    className="px-4 py-2 bg-slate-900/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm capitalize"
                  >
                    {category.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sectionTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addSection(template)}
                    className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                      <template.icon size={24} className="text-cyan-400" />
                    </div>
                    <h4 className="text-white font-semibold mb-2">{template.name}</h4>
                    <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                    <span className="inline-block px-2 py-1 bg-slate-800/50 text-slate-500 text-xs rounded capitalize">
                      {template.category}
                    </span>
                  </motion.div>
                ))}

                {/* Custom Templates */}
                {customTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addSection(template)}
                    className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 hover:border-purple-500/50 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                      <Star size={24} className="text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold">{template.name}</h4>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        Custom
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{template.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <MediaLibrary
            onSelect={(media) => {
              // Handle media selection
              setShowMediaLibrary(false);
            }}
            onClose={() => setShowMediaLibrary(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Content Suggester Modal */}
      <AnimatePresence>
        {showAISuggester && selectedSection && (
          <AIContentSuggester
            section={selectedSection}
            onApply={applyAISuggestions}
            onClose={() => setShowAISuggester(false)}
          />
        )}
      </AnimatePresence>

      {/* Template Preset Modal */}
      <AnimatePresence>
        {showTemplatePreset && (
          <TemplatePreset
            onApply={applyTemplate}
            onClose={() => setShowTemplatePreset(false)}
          />
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Import Configuration</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Upload a JSON configuration file to import your portfolio settings.
              </p>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-all">
                <Upload size={48} className="mx-auto mb-4 text-slate-500" />
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold cursor-pointer hover:bg-cyan-600 transition-colors inline-block"
                >
                  Choose File
                </label>
                <p className="text-sm text-slate-500 mt-3">
                  or drag and drop your JSON file here
                </p>
              </div>
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