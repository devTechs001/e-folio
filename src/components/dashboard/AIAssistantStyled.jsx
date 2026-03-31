// src/components/Dashboard/AIAssistant/AIAssistantEnhanced.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mic, Sparkles, Lightbulb, Code, FileText, Zap, Upload,
    Download, Copy, Check, Trash2, RefreshCw, History, Settings,
    MessageSquare, Brain, Image as ImageIcon, Play, Square, ChevronDown,
    ChevronUp, Bookmark, Share2, MoreVertical, Plus, X, Search,
    Filter, Calendar, Tag, Star, Link as LinkIcon, Video, Music,
    Eye, Edit2, GitBranch, DollarSign, BarChart2, Users, Globe,
    Terminal, Database, Cpu, Layers, TrendingUp, Activity, Paperclip,
    Smile, Mic as MicIcon, Camera, File, Folder, Hash, AtSign,
    Clock, MapPin, Shield, Lock, Unlock, Award, Target, Zap as ZapIcon,
    Maximize2, Minimize2, Volume2, VolumeX, Shuffle, Repeat
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Picker from 'emoji-picker-react';
import toast from 'react-hot-toast';

// Enhanced Empty State for AI Assistant
const EmptyState = ({ suggestions = [], setInput = () => {}, aiModel }) => {
    return (
        <div className="flex items-center justify-center h-full p-6">
            <motion.div 
                className="max-w-4xl w-full text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Animated AI Brain Icon */}
                <motion.div
                    className="w-24 h-24 mx-auto mb-6 relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-full animate-pulse" />
                    <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                        <Brain size={48} className="text-blue-500" />
                    </div>
                    <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>

                <motion.h2 
                    className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Start a conversation with AI
                </motion.h2>
                <motion.p 
                    className="text-lg text-gray-600 dark:text-gray-400 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Ask the assistant anything — try a suggestion below or type your question.
                </motion.p>

                {/* Enhanced Predefined Prompts Grid */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {suggestions.map((sugg, idx) => {
                        const Icon = sugg.icon || (() => null);
                        return (
                            <motion.button
                                key={idx}
                                onClick={() => setInput(typeof sugg.prompt === 'function' ? sugg.prompt({ model: aiModel }) : sugg.prompt)}
                                className="group relative overflow-hidden bg-gradient-to-br from-white/80 to-gray-50 dark:from-gray-800/80 dark:to-gray-900/80 hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 text-left transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="relative z-10 flex items-start gap-4">
                                    {/* Enhanced Icon Container */}
                                    <motion.div 
                                        className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon size={24} className="text-white" />
                                    </motion.div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {sugg.text}
                                        </div>
                                        {sugg.prompt && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                                {String(sugg.prompt).substring(0, 120)}
                                                {String(sugg.prompt).length > 120 && '...'}
                                            </div>
                                        )}
                                        
                                        {/* Category Badge */}
                                        {sugg.category && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 + idx * 0.1 }}
                                                className="mt-2 inline-block"
                                            >
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                                                    <Tag size={10} />
                                                    {sugg.category}
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Effect Corner */}
                                <motion.div
                                    className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Quick Tips Section */}
                <motion.div
                    className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-900 dark:text-blue-100">Quick Tips</span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>• Use Ctrl+Enter to send messages quickly</p>
                        <p>• Upload files for AI analysis and insights</p>
                        <p>• Try voice recording for hands-free interaction</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

const AIAssistant = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { success, error, info } = useNotifications();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const abortControllerRef = useRef(null);
    const textareaRef = useRef(null);

    // Enhanced State Management
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showHistory, setShowHistory] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showPlugins, setShowPlugins] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('comfortable'); // compact, comfortable, spacious

    // AI Settings - Using a free model as default
    const [aiModel, setAiModel] = useState('gpt-3.5-turbo'); // Changed to a potentially free model as default
    const [aiProvider, setAiProvider] = useState('openai'); // Using OpenAI as it often has free tier
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2000);
    const [topP, setTopP] = useState(1);
    const [frequencyPenalty, setFrequencyPenalty] = useState(0);
    const [presencePenalty, setPresencePenalty] = useState(0);
    const [streamResponse, setStreamResponse] = useState(true);
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
    
    // Advanced Features
    const [contextWindow, setContextWindow] = useState(10);
    const [useRAG, setUseRAG] = useState(false);
    const [enablePlugins, setEnablePlugins] = useState(true);
    const [enableWebSearch, setEnableWebSearch] = useState(false);
    const [enableCodeExecution, setEnableCodeExecution] = useState(false);
    const [enableVision, setEnableVision] = useState(false);
    const [enableImageGen, setEnableImageGen] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    
    // UI State
    const [copiedId, setCopiedId] = useState(null);
    const [expandedMessages, setExpandedMessages] = useState(new Set());
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [selectedBranch, setSelectedBranch] = useState({});
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCostTracker, setShowCostTracker] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    
    // Analytics & Tracking
    const [usageStats, setUsageStats] = useState({
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        conversationCount: 0,
        avgResponseTime: 0
    });
    
    // Plugins & Tools
    const [activePlugins, setActivePlugins] = useState([]);
    const [availableTools, setAvailableTools] = useState([
        { id: 'web_search', name: 'Web Search', icon: Globe, enabled: false },
        { id: 'code_interpreter', name: 'Code Interpreter', icon: Terminal, enabled: false },
        { id: 'image_gen', name: 'Image Generation', icon: ImageIcon, enabled: false },
        { id: 'pdf_reader', name: 'PDF Reader', icon: FileText, enabled: false },
        { id: 'calculator', name: 'Calculator', icon: Hash, enabled: false },
        { id: 'web_scraper', name: 'Web Scraper', icon: Database, enabled: false }
    ]);
    
    // Prompt Templates
    const [promptTemplates, setPromptTemplates] = useState([
        {
            id: 1,
            name: 'Code Review',
            prompt: 'Please review the following code and provide suggestions for:\n1. Code quality\n2. Performance\n3. Security\n4. Best practices\n\n```\n{code}\n```',
            category: 'development',
            tags: ['code', 'review', 'quality']
        },
        {
            id: 2,
            name: 'Bug Fix Helper',
            prompt: 'I have a bug in my code. Here\'s the error:\n{error}\n\nHere\'s my code:\n```\n{code}\n```\n\nPlease help me:\n1. Identify the root cause\n2. Suggest a fix\n3. Explain why it happened',
            category: 'development',
            tags: ['debug', 'fix', 'error']
        },
        {
            id: 3,
            name: 'API Documentation',
            prompt: 'Generate comprehensive API documentation for the following endpoint:\n\n{endpoint}\n\nInclude:\n- Description\n- Parameters\n- Request/Response examples\n- Error codes\n- Rate limits',
            category: 'documentation',
            tags: ['api', 'docs', 'reference']
        },
        {
            id: 4,
            name: 'Unit Test Generator',
            prompt: 'Generate comprehensive unit tests for this function:\n\n```\n{code}\n```\n\nInclude:\n- Happy path tests\n- Edge cases\n- Error scenarios\n- Mock data',
            category: 'testing',
            tags: ['test', 'unit', 'qa']
        },
        {
            id: 5,
            name: 'SQL Query Optimizer',
            prompt: 'Optimize this SQL query for better performance:\n\n```sql\n{query}\n```\n\nProvide:\n- Optimized version\n- Explanation of changes\n- Expected performance improvement\n- Index suggestions',
            category: 'database',
            tags: ['sql', 'optimize', 'performance']
        },
        {
            id: 6,
            name: 'System Design',
            prompt: 'Design a system for: {requirement}\n\nInclude:\n- Architecture diagram description\n- Technology stack recommendations\n- Scalability considerations\n- Security measures\n- Database design\n- API structure',
            category: 'architecture',
            tags: ['design', 'system', 'architecture']
        },
        {
            id: 7,
            name: 'Content Writer',
            prompt: 'Write a {type} about {topic}\n\nRequirements:\n- Tone: {tone}\n- Length: {length} words\n- Target audience: {audience}\n- Include SEO keywords\n- Add engaging examples',
            category: 'content',
            tags: ['writing', 'content', 'blog']
        },
        {
            id: 8,
            name: 'Data Analysis',
            prompt: 'Analyze this dataset and provide insights:\n\n{data}\n\nProvide:\n- Key statistics\n- Trends and patterns\n- Anomalies\n- Recommendations\n- Visualizations (describe)',
            category: 'data',
            tags: ['analysis', 'data', 'insights']
        }
    ]);

    const suggestions = [
        { 
            icon: Code, 
            text: 'Generate React Component', 
            color: 'blue',
            prompt: 'Create a modern React component for {component_name} with TypeScript, Tailwind CSS, and proper error handling. Include hooks, props validation, and responsive design.',
            category: 'Development',
            tags: ['react', 'typescript', 'frontend']
        },
        { 
            icon: Lightbulb, 
            text: 'Brainstorm Project Ideas', 
            color: 'amber',
            prompt: 'Generate 10 innovative project ideas for {domain} with detailed descriptions, tech stacks, potential challenges, and monetization strategies.',
            category: 'Creative',
            tags: ['brainstorming', 'innovation', 'strategy']
        },
        { 
            icon: FileText, 
            text: 'Write Technical Documentation', 
            color: 'green',
            prompt: 'Create comprehensive technical documentation for {project} including API endpoints, setup instructions, usage examples, and troubleshooting guide.',
            category: 'Documentation',
            tags: ['writing', 'api', 'documentation']
        },
        { 
            icon: Zap, 
            text: 'Performance Optimization', 
            color: 'purple',
            prompt: 'Analyze this code/application for performance bottlenecks and provide specific optimization strategies:\n\n{code_or_description}',
            category: 'Optimization',
            tags: ['performance', 'optimization', 'analysis']
        },
        {
            icon: Brain,
            text: 'Explain Complex Concepts',
            color: 'pink',
            prompt: 'Explain {concept} in three different ways: 1) Simple analogy for beginners, 2) Technical explanation for developers, 3) Advanced details with real-world examples.',
            category: 'Learning',
            tags: ['education', 'explanation', 'tutorial']
        },
        {
            icon: MessageSquare,
            text: 'Code Review & Refactoring',
            color: 'indigo',
            prompt: 'Perform a comprehensive code review of this code, focusing on: code quality, security vulnerabilities, performance issues, and suggest improvements:\n\n{code}',
            category: 'Review',
            tags: ['code-review', 'refactoring', 'quality']
        },
        {
            icon: Database,
            text: 'Database Schema Design',
            color: 'cyan',
            prompt: 'Design a complete database schema for {application_type} including ERD, relationships, indexes, constraints, and migration scripts.',
            category: 'Database',
            tags: ['database', 'schema', 'design']
        },
        {
            icon: Terminal,
            text: 'Debug & Troubleshoot',
            color: 'red',
            prompt: 'Help me debug this issue. Error: {error}\nContext: {context}\nCode: {code}\n\nProvide step-by-step debugging approach and solutions.',
            category: 'Debugging',
            tags: ['debugging', 'troubleshooting', 'error']
        },
        {
            icon: TrendingUp,
            text: 'Architecture Planning',
            color: 'emerald',
            prompt: 'Design system architecture for {project} including microservices, data flow, scalability considerations, and technology recommendations.',
            category: 'Architecture',
            tags: ['architecture', 'design', 'scalability']
        },
        {
            icon: Shield,
            text: 'Security Analysis',
            color: 'orange',
            prompt: 'Conduct a security analysis of this code/application and identify vulnerabilities, attack vectors, and provide security best practices:\n\n{code_or_description}',
            category: 'Security',
            tags: ['security', 'audit', 'vulnerability']
        },
        {
            icon: Users,
            text: 'UX/UI Design Review',
            color: 'teal',
            prompt: 'Review this UI/UX design and provide feedback on usability, accessibility, visual hierarchy, and user experience improvements:\n\n{design_description}',
            category: 'Design',
            tags: ['ux', 'ui', 'design']
        },
        {
            icon: GitBranch,
            text: 'Git Workflow Setup',
            color: 'lime',
            prompt: 'Design a comprehensive Git workflow for {team_size} team working on {project_type} including branching strategy, CI/CD pipeline, and best practices.',
            category: 'DevOps',
            tags: ['git', 'workflow', 'devops']
        }
    ];

    // Load data on mount
    useEffect(() => {
        loadConversations();
        loadUsageStats();
        loadUserPreferences();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-save conversation
    useEffect(() => {
        if (autoSave && currentConversation && messages.length > 0) {
            const saveTimeout = setTimeout(() => {
                saveConversation();
            }, 2000);
            return () => clearTimeout(saveTimeout);
        }
    }, [messages, autoSave]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K - New conversation
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                createNewConversation();
            }
            // Ctrl/Cmd + / - Toggle history
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowHistory(!showHistory);
            }
            // Ctrl/Cmd + . - Toggle settings
            if ((e.ctrlKey || e.metaKey) && e.key === '.') {
                e.preventDefault();
                setShowSettings(!showSettings);
            }
            // Esc - Cancel generation
            if (e.key === 'Escape' && isTyping) {
                stopGeneration();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showHistory, showSettings, isTyping]);

    // Setup speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setInput(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                error('Speech recognition failed: ' + event.error);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    // Database Operations
    const loadConversations = async () => {
        try {
            const response = await ApiService.getAIConversations(user?.id);
            
            setConversations(response.conversations || []);
            
            if (response.conversations.length > 0 && !currentConversation) {
                await loadConversation(response.data.conversations[0].id);
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
            error('Failed to load conversations');
        }
    };

    const loadConversation = async (conversationId) => {
        try {
            const response = await ApiService.get(`/ai/conversations/${conversationId}`);
            const conversation = response.data;
            
            setCurrentConversation(conversation);
            setMessages(conversation.messages || []);
            
            // Update conversation access time
            await ApiService.patch(`/ai/conversations/${conversationId}`, {
                lastAccessedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error loading conversation:', err);
            error('Failed to load conversation');
        }
    };

    const saveConversation = async () => {
        if (!currentConversation) return;

        try {
            await ApiService.patch(`/ai/conversations/${currentConversation.id}`, {
                messages,
                updatedAt: new Date().toISOString(),
                messageCount: messages.length,
                settings: {
                    model: aiModel,
                    provider: aiProvider,
                    temperature,
                    maxTokens,
                    systemPrompt
                }
            });
        } catch (err) {
            console.error('Error saving conversation:', err);
        }
    };

    const createNewConversation = async () => {
        try {
            const response = await ApiService.post('/ai/conversations', {
                userId: user?.id,
                title: 'New Conversation',
                model: aiModel,
                provider: aiProvider,
                settings: {
                    temperature,
                    maxTokens,
                    systemPrompt
                },
                createdAt: new Date().toISOString()
            });
            
            const newConversation = response.data;
            setConversations([newConversation, ...conversations]);
            setCurrentConversation(newConversation);
            setMessages([]);
            success('New conversation started');
        } catch (err) {
            console.error('Error creating conversation:', err);
            error('Failed to create conversation');
        }
    };

    const updateConversationTitle = async (conversationId, newTitle) => {
        try {
            await ApiService.patch(`/ai/conversations/${conversationId}`, {
                title: newTitle
            });
            
            setConversations(conversations.map(c => 
                c.id === conversationId ? { ...c, title: newTitle } : c
            ));
            
            if (currentConversation?.id === conversationId) {
                setCurrentConversation({ ...currentConversation, title: newTitle });
            }
        } catch (err) {
            error('Failed to update title');
        }
    };

    const deleteConversation = async (conversationId) => {
        try {
            await ApiService.delete(`/ai/conversations/${conversationId}`);
            
            setConversations(conversations.filter(c => c.id !== conversationId));
            
            if (currentConversation?.id === conversationId) {
                const remainingConvs = conversations.filter(c => c.id !== conversationId);
                if (remainingConvs.length > 0) {
                    await loadConversation(remainingConvs[0].id);
                } else {
                    setCurrentConversation(null);
                    setMessages([]);
                }
            }
            
            success('Conversation deleted');
        } catch (err) {
            error('Failed to delete conversation');
        }
    };

    const loadUsageStats = async () => {
        try {
            const response = await ApiService.getUsageStats(user?.id);
            setUsageStats(response);
        } catch (err) {
            console.error('Error loading usage stats:', err);
        }
    };

    const loadUserPreferences = async () => {
        try {
            const response = await ApiService.getAIPreferences(user?.id);
            const prefs = response;
            if (prefs) {
                // Default to free model (gpt-3.5-turbo) when possible
                setAiModel(prefs.aiModel || 'gpt-3.5-turbo');
                setAiProvider(prefs.aiProvider || 'openai');
                setTemperature(prefs.temperature || 0.7);
                setMaxTokens(prefs.maxTokens || 2000);
                setSystemPrompt(prefs.systemPrompt || 'You are a helpful AI assistant.');
                setStreamResponse(prefs.streamResponse !== false);
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
        }
    };

    const saveUserPreferences = async () => {
        try {
            await ApiService.post('/ai/preferences', {
                userId: user?.id,
                aiModel,
                aiProvider,
                temperature,
                maxTokens,
                systemPrompt,
                streamResponse,
                topP,
                frequencyPenalty,
                presencePenalty
            });
            success('Preferences saved');
        } catch (err) {
            error('Failed to save preferences');
        }
    };

    // Message Operations
    const handleSend = async (customPrompt = null) => {
        const messageContent = customPrompt || input;
        
        if (!messageContent.trim() && selectedFiles.length === 0) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: messageContent,
            files: selectedFiles,
            timestamp: new Date().toISOString(),
            metadata: {
                model: aiModel,
                provider: aiProvider
            }
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedFiles([]);
        setIsTyping(true);

        try {
            // Prepare context messages
            const contextMessages = messages
                .slice(-contextWindow)
                .map(m => ({
                    role: m.type === 'user' ? 'user' : 'assistant',
                    content: m.content
                }));

            // Add system prompt
            if (systemPrompt) {
                contextMessages.unshift({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Prepare request payload
            const payload = {
                conversationId: currentConversation?.id,
                messages: [...contextMessages, { role: 'user', content: messageContent }],
                model: aiModel,
                provider: aiProvider,
                temperature,
                maxTokens,
                topP,
                frequencyPenalty,
                presencePenalty,
                stream: streamResponse,
                tools: activePlugins.map(p => p.id),
                enableWebSearch,
                enableCodeExecution,
                enableVision: enableVision && selectedFiles.some(f => f.type.startsWith('image/')),
                files: selectedFiles
            };

            // Create abort controller for stopping generation
            abortControllerRef.current = new AbortController();

            if (streamResponse) {
                await handleStreamingResponse(payload);
            } else {
                await handleRegularResponse(payload);
            }

            // Save message to database
            await saveMessageToDB(userMessage);

            // Update conversation if first message
            if (!currentConversation) {
                await createNewConversation();
            } else if (messages.length === 0) {
                // Auto-generate title from first message
                const title = await generateConversationTitle(messageContent);
                await updateConversationTitle(currentConversation.id, title);
            }

            // Update usage stats
            await updateUsageStats();
            
        } catch (err) {
            if (err.name === 'AbortError') {
                info('Generation stopped');
            } else {
                console.error('Error sending message:', err);
                error('Failed to send message: ' + (err.message || 'Unknown error'));
            }
            setIsTyping(false);
        }
    };

    const handleStreamingResponse = async (payload) => {
        const aiMessage = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: '',
            timestamp: new Date().toISOString(),
            streaming: true,
            metadata: {
                model: aiModel,
                provider: aiProvider,
                startTime: Date.now()
            }
        };

        setMessages(prev => [...prev, aiMessage]);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/ai/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'content') {
                                const content = parsed.content || '';
                                fullContent += content;
                                
                                setMessages(prev => prev.map(msg => 
                                    msg.id === aiMessage.id 
                                        ? { ...msg, content: fullContent }
                                        : msg
                                ));
                            } else if (parsed.type === 'tool_use') {
                                // Handle tool/plugin execution
                                setMessages(prev => prev.map(msg => 
                                    msg.id === aiMessage.id 
                                        ? { 
                                            ...msg, 
                                            toolCalls: [...(msg.toolCalls || []), parsed.data]
                                        }
                                        : msg
                                ));
                            } else if (parsed.type === 'metadata') {
                                // Update metadata
                                setMessages(prev => prev.map(msg => 
                                    msg.id === aiMessage.id 
                                        ? { 
                                            ...msg, 
                                            metadata: { ...msg.metadata, ...parsed.data }
                                        }
                                        : msg
                                ));
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }

            // Mark as complete
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessage.id 
                    ? { 
                        ...msg, 
                        streaming: false,
                        metadata: {
                            ...msg.metadata,
                            endTime: Date.now(),
                            duration: Date.now() - msg.metadata.startTime,
                            tokens: fullContent.split(' ').length * 1.3 // Rough estimate
                        }
                    }
                    : msg
            ));

            // Save AI message to database
            const finalMessage = messages.find(m => m.id === aiMessage.id);
            await saveMessageToDB({ ...aiMessage, content: fullContent, streaming: false });
            
        } catch (err) {
            if (err.name === 'AbortError') {
                throw err;
            }
            console.error('Streaming error:', err);
            throw err;
        } finally {
            setIsTyping(false);
        }
    };

    const handleRegularResponse = async (payload) => {
        const response = await ApiService.post('/ai/chat', payload);
        const data = response.data;

        const aiMessage = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: data.message,
            timestamp: new Date().toISOString(),
            metadata: {
                model: data.model,
                provider: data.provider,
                tokens: data.tokens,
                cost: data.cost,
                duration: data.duration,
                toolCalls: data.toolCalls
            }
        };

        setMessages(prev => [...prev, aiMessage]);
        await saveMessageToDB(aiMessage);
        setIsTyping(false);
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsTyping(false);
        info('Generation stopped');
    };

    const regenerateMessage = async (messageId) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || messageIndex === 0) return;

        // Find the previous user message
        const userMessage = messages[messageIndex - 1];
        if (userMessage.type !== 'user') return;

        // Remove the AI message and regenerate
        setMessages(prev => prev.slice(0, messageIndex));
        await handleSend(userMessage.content);
    };

    const editMessage = async (messageId) => {
        const message = messages.find(m => m.id === messageId);
        if (!message || message.type !== 'user') return;

        setEditingMessageId(messageId);
        setEditContent(message.content);
    };

    const saveEditedMessage = async () => {
        if (!editingMessageId || !editContent.trim()) return;

        const messageIndex = messages.findIndex(m => m.id === editingMessageId);
        if (messageIndex === -1) return;

        // Create new branch if needed
        const originalMessage = messages[messageIndex];
        if (originalMessage.branches) {
            originalMessage.branches.push(originalMessage.content);
        } else {
            originalMessage.branches = [originalMessage.content];
        }

        // Update message
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
            ...originalMessage,
            content: editContent,
            edited: true,
            editedAt: new Date().toISOString()
        };

        // Remove all messages after this one
        const newMessages = updatedMessages.slice(0, messageIndex + 1);
        setMessages(newMessages);

        // Regenerate AI response
        await handleSend(editContent);

        setEditingMessageId(null);
        setEditContent('');
    };

    const createBranch = async (messageId) => {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const branchMessages = messages.slice(0, messageIndex + 1);
        
        // Save current branch
        await ApiService.post('/ai/branches', {
            conversationId: currentConversation?.id,
            messages: branchMessages,
            parentMessageId: messageId,
            createdAt: new Date().toISOString()
        });

        success('Branch created');
    };

    const saveMessageToDB = async (message) => {
        try {
            await ApiService.post('/ai/messages', {
                conversationId: currentConversation?.id,
                ...message,
                userId: user?.id
            });
        } catch (err) {
            console.error('Error saving message:', err);
        }
    };

    const generateConversationTitle = async (firstMessage) => {
        try {
            const response = await ApiService.post('/ai/generate-title', {
                message: firstMessage
            });
            return response.data.title;
        } catch (err) {
            return firstMessage.substring(0, 50) + '...';
        }
    };

    const updateUsageStats = async () => {
        try {
            const lastMessage = messages[messages.length - 1];
            const tokens = lastMessage?.metadata?.tokens || 0;
            const cost = lastMessage?.metadata?.cost || 0;

            await ApiService.post('/ai/usage', {
                userId: user?.id,
                tokens,
                cost,
                model: aiModel,
                provider: aiProvider,
                timestamp: new Date().toISOString()
            });

            // Reload stats
            loadUsageStats();
        } catch (err) {
            console.error('Error updating usage stats:', err);
        }
    };

    // File Operations
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        
        // Validate files
        const validFiles = files.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                error(`File ${file.name} is too large. Max size is 10MB.`);
                return false;
            }
            return true;
        });

        // Process files (upload to server/storage)
        const uploadedFiles = await Promise.all(
            validFiles.map(async (file) => {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('userId', user?.id);

                    const response = await ApiService.post('/ai/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    return {
                        ...response.data,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    };
                } catch (err) {
                    error(`Failed to upload ${file.name}`);
                    return null;
                }
            })
        );

        setSelectedFiles(prev => [...prev, ...uploadedFiles.filter(Boolean)]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Voice Operations
    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
            info('Listening...');
        }
    };

    const speakMessage = async (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
        } else {
            error('Text-to-speech not supported');
        }
    };

    // Utility Functions
    const copyToClipboard = async (content, id) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(id);
            success('Copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            error('Failed to copy');
        }
    };

    const safeFormatTime = (ts) => {
        if (!ts) return '';
        const d = ts instanceof Date ? ts : new Date(ts);
        if (isNaN(d)) return '';
        try {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const exportConversation = async (format = 'json') => {
        try {
            const data = {
                title: currentConversation?.title,
                messages,
                metadata: {
                    model: aiModel,
                    provider: aiProvider,
                    totalMessages: messages.length,
                    createdAt: currentConversation?.createdAt,
                    exportedAt: new Date().toISOString()
                }
            };

            let blob;
            let filename;

            if (format === 'json') {
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename = `conversation-${Date.now()}.json`;
            } else if (format === 'markdown') {
                const markdown = convertToMarkdown(data);
                blob = new Blob([markdown], { type: 'text/markdown' });
                filename = `conversation-${Date.now()}.md`;
            } else if (format === 'txt') {
                const text = convertToText(data);
                blob = new Blob([text], { type: 'text/plain' });
                filename = `conversation-${Date.now()}.txt`;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            success(`Conversation exported as ${format.toUpperCase()}`);
        } catch (err) {
            error('Export failed');
        }
    };

    const convertToMarkdown = (data) => {
        let md = `# ${data.title}\n\n`;
        md += `**Exported:** ${new Date(data.metadata.exportedAt).toLocaleString()}\n\n`;
        md += `**Model:** ${data.metadata.model} (${data.metadata.provider})\n\n`;
        md += `---\n\n`;

        data.messages.forEach(msg => {
            md += `## ${msg.type === 'user' ? 'User' : 'Assistant'}\n\n`;
            md += `${msg.content}\n\n`;
            md += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
            md += `---\n\n`;
        });

        return md;
    };

    const convertToText = (data) => {
        let text = `${data.title}\n\n`;
        text += `Exported: ${new Date(data.metadata.exportedAt).toLocaleString()}\n`;
        text += `Model: ${data.metadata.model} (${data.metadata.provider})\n\n`;
        text += `${'='.repeat(50)}\n\n`;

        data.messages.forEach(msg => {
            text += `${msg.type === 'user' ? 'You' : 'AI'}:\n`;
            text += `${msg.content}\n`;
            text += `[${new Date(msg.timestamp).toLocaleString()}]\n\n`;
            text += `${'-'.repeat(50)}\n\n`;
        });

        return text;
    };

    const shareConversation = async () => {
        try {
            const response = await ApiService.post('/ai/share', {
                conversationId: currentConversation?.id,
                messages,
                expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            const shareUrl = `${window.location.origin}/shared/${response.data.shareId}`;
            await navigator.clipboard.writeText(shareUrl);
            success('Share link copied to clipboard');
        } catch (err) {
            error('Failed to create share link');
        }
    };

    const bookmarkMessage = async (messageId) => {
        try {
            const message = messages.find(m => m.id === messageId);
            await ApiService.post('/ai/bookmarks', {
                userId: user?.id,
                messageId,
                conversationId: currentConversation?.id,
                content: message.content,
                timestamp: new Date().toISOString()
            });

            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, bookmarked: true } : m
            ));

            success('Message bookmarked');
        } catch (err) {
            error('Failed to bookmark message');
        }
    };

    const toggleMessageExpanded = (id) => {
        setExpandedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const applyTemplate = (template) => {
        setInput(template.prompt);
        setShowTemplates(false);
        textareaRef.current?.focus();
    };

    const togglePlugin = (pluginId) => {
        setAvailableTools(tools =>
            tools.map(tool =>
                tool.id === pluginId
                    ? { ...tool, enabled: !tool.enabled }
                    : tool
            )
        );

        if (availableTools.find(t => t.id === pluginId)?.enabled) {
            setActivePlugins(prev => prev.filter(p => p.id !== pluginId));
        } else {
            const plugin = availableTools.find(t => t.id === pluginId);
            setActivePlugins(prev => [...prev, plugin]);
        }
    };

    // Render Message Component
    const renderMessage = (message) => {
        const isExpanded = expandedMessages.has(message.id);
        const isLong = message.content.length > 500;
        const isEditing = editingMessageId === message.id;

        return (
            <div className="space-y-3">
                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={saveEditedMessage}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Save & Regenerate
                            </button>
                            <button
                                onClick={() => {
                                    setEditingMessageId(null);
                                    setEditContent('');
                                }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="prose prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group">
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => copyToClipboard(String(children), `code-${message.id}`)}
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                    >
                                                        {copiedId === `code-${message.id}` ? (
                                                            <Check size={16} className="text-green-400" />
                                                        ) : (
                                                            <Copy size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                                <SyntaxHighlighter
                                                    style={theme === 'dark' ? atomOneDark : docco}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    customStyle={{
                                                        margin: 0,
                                                        borderRadius: '0.75rem',
                                                        fontSize: '0.875rem'
                                                    }}
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    a({ node, children, ...props }) {
                                        return (
                                            <a
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                                {children}
                                            </a>
                                        );
                                    },
                                    img({ node, ...props }) {
                                        return (
                                            <img
                                                {...props}
                                                className="rounded-xl max-w-full h-auto"
                                                loading="lazy"
                                            />
                                        );
                                    }
                                }}
                            >
                                {isLong && !isExpanded 
                                    ? message.content.substring(0, 500) + '...' 
                                    : message.content}
                            </ReactMarkdown>
                        </div>

                        {isLong && (
                            <button
                                onClick={() => toggleMessageExpanded(message.id)}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp size={16} /> Show less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={16} /> Show more
                                    </>
                                )}
                            </button>
                        )}

                        {/* Tool Calls */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                                    <Zap size={14} />
                                    Tools Used
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {message.toolCalls.map((tool, idx) => (
                                        <div
                                            key={idx}
                                            className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs"
                                        >
                                            <span className="font-medium">{tool.name}</span>
                                            {tool.result && (
                                                <span className="ml-2 text-gray-400">
                                                    {tool.result.substring(0, 30)}...
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {message.files && message.files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {message.files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2"
                                    >
                                        {file.type.startsWith('image/') ? (
                                            <ImageIcon size={16} />
                                        ) : file.type.startsWith('video/') ? (
                                            <Video size={16} />
                                        ) : file.type.startsWith('audio/') ? (
                                            <Music size={16} />
                                        ) : (
                                            <File size={16} />
                                        )}
                                        <span>{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message Branches */}
                        {message.branches && message.branches.length > 0 && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setSelectedBranch({ 
                                        ...selectedBranch, 
                                        [message.id]: !selectedBranch[message.id] 
                                    })}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <GitBranch size={14} />
                                    {message.branches.length} alternate version{message.branches.length > 1 ? 's' : ''}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout
            title="AI Assistant"
            subtitle={`${messages.length} messages • ${currentConversation?.title || 'New Conversation'}`}
            icon={Brain}
            actions={
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Active Plugins Indicator */}
                    {activePlugins.length > 0 && (
                        <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs flex items-center gap-2">
                            <Zap size={14} className="text-purple-400" />
                            <span className="text-purple-400 font-medium">
                                {activePlugins.length} plugin{activePlugins.length > 1 ? 's' : ''} active
                            </span>
                        </div>
                    )}

                    {/* Cost Tracker */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCostTracker(!showCostTracker)}
                        className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <DollarSign size={16} />
                        <span className="hidden sm:inline">${usageStats.totalCost.toFixed(4)}</span>
                    </motion.button>

                    {/* Templates */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <FileText size={16} />
                        <span className="hidden sm:inline">Templates</span>
                    </motion.button>

                    {/* Plugins */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPlugins(!showPlugins)}
                        className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <Layers size={16} />
                        <span className="hidden sm:inline">Tools</span>
                    </motion.button>

                    {/* History */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <History size={16} />
                        <span className="hidden sm:inline">History</span>
                    </motion.button>

                    {/* Export */}
                    <div className="relative group">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Export</span>
                        </motion.button>
                        <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                            <button
                                onClick={() => exportConversation('json')}
                                className="w-full px-4 py-2 text-left hover:bg-white/5 rounded-t-lg transition-colors text-sm"
                            >
                                Export as JSON
                            </button>
                            <button
                                onClick={() => exportConversation('markdown')}
                                className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors text-sm"
                            >
                                Export as Markdown
                            </button>
                            <button
                                onClick={() => exportConversation('txt')}
                                className="w-full px-4 py-2 text-left hover:bg-white/5 rounded-b-lg transition-colors text-sm"
                            >
                                Export as Text
                            </button>
                        </div>
                    </div>

                    {/* Settings */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSettings(!showSettings)}
                        className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <Settings size={16} />
                        <span className="hidden sm:inline">Settings</span>
                    </motion.button>

                    {/* New Chat */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={createNewConversation}
                        className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Chat</span>
                        <span className="sm:hidden">New</span>
                    </motion.button>
                </div>
            }
        >
            <div className={`flex ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-[calc(100vh-220px)]'} gap-4`}>
                {/* Sidebar - Conversation History */}
                <AnimatePresence>
                    {showHistory && (
                        <ConversationHistory
                            key="conversation-history"
                            conversations={conversations}
                            currentConversation={currentConversation}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            loadConversation={loadConversation}
                            deleteConversation={deleteConversation}
                            updateConversationTitle={updateConversationTitle}
                            onClose={() => setShowHistory(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {messages.length === 0 ? (
                        <EmptyState
                            suggestions={suggestions}
                            setInput={setInput}
                            aiModel={aiModel}
                        />
                    ) : (
                        <MessageList
                            messages={messages}
                            isTyping={isTyping}
                            user={user}
                            renderMessage={renderMessage}
                            copyToClipboard={copyToClipboard}
                            regenerateMessage={regenerateMessage}
                            editMessage={editMessage}
                            bookmarkMessage={bookmarkMessage}
                            createBranch={createBranch}
                            speakMessage={speakMessage}
                            copiedId={copiedId}
                            safeFormatTime={safeFormatTime}
                            messagesEndRef={messagesEndRef}
                            viewMode={viewMode}
                        />
                    )}

                    {/* Input Area */}
                    <InputArea
                        input={input}
                        setInput={setInput}
                        selectedFiles={selectedFiles}
                        removeFile={removeFile}
                        handleSend={handleSend}
                        isTyping={isTyping}
                        stopGeneration={stopGeneration}
                        fileInputRef={fileInputRef}
                        handleFileUpload={handleFileUpload}
                        toggleRecording={toggleRecording}
                        isRecording={isRecording}
                        aiModel={aiModel}
                        temperature={temperature}
                        maxTokens={maxTokens}
                        textareaRef={textareaRef}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                    />
                </div>

                {/* Right Sidebar - Settings/Plugins/Templates */}
                <AnimatePresence>
                    {showSettings && (
                        <SettingsPanel
                            key="settings-panel"
                            aiModel={aiModel}
                            setAiModel={setAiModel}
                            aiProvider={aiProvider}
                            setAiProvider={setAiProvider}
                            temperature={temperature}
                            setTemperature={setTemperature}
                            maxTokens={maxTokens}
                            setMaxTokens={setMaxTokens}
                            topP={topP}
                            setTopP={setTopP}
                            frequencyPenalty={frequencyPenalty}
                            setFrequencyPenalty={setFrequencyPenalty}
                            presencePenalty={presencePenalty}
                            setPresencePenalty={setPresencePenalty}
                            streamResponse={streamResponse}
                            setStreamResponse={setStreamResponse}
                            systemPrompt={systemPrompt}
                            setSystemPrompt={setSystemPrompt}
                            contextWindow={contextWindow}
                            setContextWindow={setContextWindow}
                            useRAG={useRAG}
                            setUseRAG={setUseRAG}
                            enableWebSearch={enableWebSearch}
                            setEnableWebSearch={setEnableWebSearch}
                            enableCodeExecution={enableCodeExecution}
                            setEnableCodeExecution={setEnableCodeExecution}
                            enableVision={enableVision}
                            setEnableVision={setEnableVision}
                            enableImageGen={enableImageGen}
                            setEnableImageGen={setEnableImageGen}
                            autoSave={autoSave}
                            setAutoSave={setAutoSave}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            saveUserPreferences={saveUserPreferences}
                            onClose={() => setShowSettings(false)}
                        />
                    )}

                    {showPlugins && (
                        <PluginsPanel
                            availableTools={availableTools}
                            togglePlugin={togglePlugin}
                            onClose={() => setShowPlugins(false)}
                        />
                    )}

                    {showTemplates && (
                        <TemplatesPanel
                            promptTemplates={promptTemplates}
                            applyTemplate={applyTemplate}
                            onClose={() => setShowTemplates(false)}
                        />
                    )}

                    {showCostTracker && (
                        <CostTrackerPanel
                            usageStats={usageStats}
                            onClose={() => setShowCostTracker(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

// Sub-components (Conversation History, Message List, Input Area, Settings Panel, etc.)
// [Continue with all sub-components implementation...]

// Conversation History Component
const ConversationHistory = ({
    conversations, currentConversation, searchQuery, setSearchQuery,
    sortBy, setSortBy, loadConversation, deleteConversation,
    updateConversationTitle, onClose
}) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const filteredConversations = conversations
        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            } else if (sortBy === 'oldest') {
                return new Date(a.updatedAt) - new Date(b.updatedAt);
            } else if (sortBy === 'name') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });



    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col"
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Conversations</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredConversations.map((conv) => (
                    <motion.div
                        key={conv.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => loadConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all group ${
                            currentConversation?.id === conv.id
                                ? 'bg-blue-500/20 border-2 border-blue-500'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                    >
                        {editingId === conv.id ? (
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            updateConversationTitle(conv.id, editTitle);
                                            setEditingId(null);
                                        } else if (e.key === 'Escape') {
                                            setEditingId(null);
                                        }
                                    }}
                                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        updateConversationTitle(conv.id, editTitle);
                                        setEditingId(null);
                                    }}
                                    className="p-1 hover:bg-green-500/20 rounded"
                                >
                                    <Check size={14} className="text-green-400" />
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 hover:bg-red-500/20 rounded"
                                >
                                    <X size={14} className="text-red-400" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-sm truncate flex-1">
                                        {conv.title}
                                    </h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingId(conv.id);
                                                setEditTitle(conv.title);
                                            }}
                                            className="p-1 hover:bg-blue-500/20 rounded"
                                        >
                                            <Edit2 size={12} className="text-blue-400" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this conversation?')) {
                                                    deleteConversation(conv.id);
                                                }
                                            }}
                                            className="p-1 hover:bg-red-500/20 rounded"
                                        >
                                            <Trash2 size={12} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 truncate mb-1">
                                    {conv.messages?.[conv.messages.length - 1]?.content.substring(0, 60) || 'No messages'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                                    <span>{conv.messageCount || 0} messages</span>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}

                {filteredConversations.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Message List Component
const MessageList = ({ 
    messages, 
    isTyping, 
    user, 
    renderMessage, 
    copyToClipboard, 
    regenerateMessage, 
    editMessage, 
    bookmarkMessage, 
    createBranch, 
    speakMessage, 
    copiedId, 
    safeFormatTime, 
    messagesEndRef, 
    viewMode 
}) => {
    return (
        <div className={`flex-1 overflow-y-auto p-6 ${viewMode === 'compact' ? 'space-y-4' : viewMode === 'spacious' ? 'space-y-8' : 'space-y-6'} custom-scrollbar`}>
            {messages.map((message, index) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-4xl w-full ${
                        message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30' 
                            : 'bg-white/5 border border-white/10'
                    } rounded-2xl p-6 backdrop-blur-sm`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.type === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}>
                                {message.type === 'user' ? (
                                    <span className="text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                ) : (
                                    <Brain size={16} className="text-white" />
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-sm">
                                        {message.type === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {safeFormatTime(message.timestamp)}
                                    </span>
                                </div>
                                
                                {renderMessage(message)}
                            </div>
                            
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => copyToClipboard(message.content, message.id)}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    {copiedId === message.id ? (
                                        <Check size={14} className="text-green-400" />
                                    ) : (
                                        <Copy size={14} className="text-gray-400" />
                                    )}
                                </button>
                                
                                {message.type === 'user' && (
                                    <>
                                        <button
                                            onClick={() => editMessage(message.id)}
                                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                        >
                                            <Edit2 size={14} className="text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => createBranch(message.id)}
                                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                        >
                                            <GitBranch size={14} className="text-gray-400" />
                                        </button>
                                    </>
                                )}
                                
                                <button
                                    onClick={() => regenerateMessage(message.id)}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    <RefreshCw size={14} className="text-gray-400" />
                                </button>
                                
                                <button
                                    onClick={() => bookmarkMessage(message.id)}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Bookmark size={14} className="text-gray-400" />
                                </button>
                                
                                <button
                                    onClick={() => speakMessage(message.content)}
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Volume2 size={14} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
            
            {isTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                >
                    <div className="max-w-4xl w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500">
                                <Brain size={16} className="text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-sm">Assistant</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <div ref={messagesEndRef} />
        </div>
    );
};

// Enhanced Input Area Component
const InputArea = ({
    input, setInput, selectedFiles, removeFile, handleSend, isTyping, 
    stopGeneration, fileInputRef, handleFileUpload, toggleRecording, 
    isRecording, aiModel, temperature, maxTokens, textareaRef, 
    showEmojiPicker, setShowEmojiPicker
}) => {
    return (
        <motion.div 
            className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Enhanced File Preview */}
                <AnimatePresence>
                    {selectedFiles.length > 0 && (
                        <motion.div
                            key="file-preview"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-3 mb-4"
                        >
                            {selectedFiles.map((file, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                        <File size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => removeFile(idx)}
                                        className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <X size={14} />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Enhanced Input Container */}
                <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.01 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isTyping) handleSend();
                            }
                        }}
                        placeholder="Ask AI anything... (Ctrl+Enter to send, Shift+Enter for new line)"
                        className="relative w-full p-4 pr-32 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                        rows="1"
                        style={{ minHeight: '80px', maxHeight: '300px' }}
                        disabled={isTyping}
                    />

                    {/* Enhanced Action Buttons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple
                            accept="image/*,audio/*,video/*,text/*,.pdf,.doc,.docx"
                        />
                        
                        <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Attach files"
                        >
                            <Paperclip size={18} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleRecording}
                            className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                                isRecording 
                                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                            title={isRecording ? 'Stop recording' : 'Start voice recording'}
                        >
                            <Mic size={18} />
                        </motion.button>

                        {isTyping ? (
                            <motion.button
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={stopGeneration}
                                className="p-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                title="Stop generation"
                            >
                                <Square size={18} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSend()}
                                disabled={!input.trim() && selectedFiles.length === 0}
                                className={`p-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                                    input.trim() || selectedFiles.length > 0
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                }`}
                                title="Send message (Ctrl+Enter)"
                            >
                                <Send size={18} />
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Enhanced Status Bar */}
                <motion.div 
                    className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-4">
                        <motion.div 
                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Cpu size={12} />
                            <span className="font-medium">{aiModel}</span>
                        </motion.div>
                        <motion.div 
                            className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Activity size={12} />
                            <span className="font-medium">Temp: {temperature}</span>
                        </motion.div>
                        <motion.div 
                            className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Zap size={12} />
                            <span className="font-medium">Max: {maxTokens}</span>
                        </motion.div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <motion.span 
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Clock size={12} />
                            <span>Auto-save enabled</span>
                        </motion.span>
                        <motion.span 
                            className="flex items-center gap-1 text-green-600 dark:text-green-400"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Shield size={12} />
                            <span>Secured</span>
                        </motion.span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// Settings Panel Component
const SettingsPanel = ({
    aiModel, setAiModel, aiProvider, setAiProvider, temperature, setTemperature,
    maxTokens, setMaxTokens, topP, setTopP, frequencyPenalty, setFrequencyPenalty,
    presencePenalty, setPresencePenalty, streamResponse, setStreamResponse,
    systemPrompt, setSystemPrompt, contextWindow, setContextWindow, useRAG, setUseRAG,
    enableWebSearch, setEnableWebSearch, enableCodeExecution, setEnableCodeExecution,
    enableVision, setEnableVision, enableImageGen, setEnableImageGen,
    autoSave, setAutoSave, viewMode, setViewMode, saveUserPreferences, onClose
}) => {
    const [activeTab, setActiveTab] = useState('model');

    const models = [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Free Tier)', provider: 'openai' },
        { id: 'llama3-8b', name: 'Llama 3 8B (Free on Groq)', provider: 'groq' },
        { id: 'gemma-7b', name: 'Gemma 7B (Free)', provider: 'google' },
        { id: 'mistral-7b', name: 'Mistral 7B (Free)', provider: 'openrouter' },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' },
        { id: 'llama3-70b', name: 'Llama 3 70B', provider: 'groq' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
        { id: 'llama-3-70b', name: 'Llama 3 70B (Meta)', provider: 'meta' }
    ];

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-xl flex flex-col h-full"
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Settings</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex border-b border-white/10">
                {['model', 'advanced', 'display', 'save'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm capitalize ${
                            activeTab === tab ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activeTab === 'model' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">AI Model</label>
                            <select
                                value={aiModel}
                                onChange={(e) => setAiModel(e.target.value)}
                                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {models.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Provider</label>
                            <select
                                value={aiProvider}
                                onChange={(e) => setAiProvider(e.target.value)}
                                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="google">Google</option>
                                <option value="meta">Meta</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Temperature: {temperature}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Higher = more creative, lower = more focused
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Max Tokens: {maxTokens}
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="4000"
                                step="100"
                                value={maxTokens}
                                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Stream Response</span>
                            <button
                                onClick={() => setStreamResponse(!streamResponse)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                    streamResponse ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                            >
                                <div
                                    className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                        streamResponse ? 'left-7' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Top-P: {topP}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={topP}
                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Frequency Penalty: {frequencyPenalty}
                            </label>
                            <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.1"
                                value={frequencyPenalty}
                                onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Presence Penalty: {presencePenalty}
                            </label>
                            <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.1"
                                value={presencePenalty}
                                onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Context Window: {contextWindow} messages
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={contextWindow}
                                onChange={(e) => setContextWindow(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Use RAG</span>
                                <button
                                    onClick={() => setUseRAG(!useRAG)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        useRAG ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            useRAG ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Web Search</span>
                                <button
                                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        enableWebSearch ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            enableWebSearch ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Code Execution</span>
                                <button
                                    onClick={() => setEnableCodeExecution(!enableCodeExecution)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        enableCodeExecution ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            enableCodeExecution ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Vision</span>
                                <button
                                    onClick={() => setEnableVision(!enableVision)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        enableVision ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            enableVision ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Image Generation</span>
                                <button
                                    onClick={() => setEnableImageGen(!enableImageGen)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        enableImageGen ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            enableImageGen ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'display' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">View Mode</label>
                            <div className="space-y-2">
                                {['compact', 'comfortable', 'spacious'].map((mode) => (
                                    <label key={mode} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="viewMode"
                                            value={mode}
                                            checked={viewMode === mode}
                                            onChange={(e) => setViewMode(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <span className="capitalize">{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Auto-save conversations</span>
                            <button
                                onClick={() => setAutoSave(!autoSave)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                    autoSave ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                            >
                                <div
                                    className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                        autoSave ? 'left-7' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'save' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">System Prompt</label>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                rows="4"
                                placeholder="Enter system prompt..."
                            />
                        </div>

                        <button
                            onClick={saveUserPreferences}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
                        >
                            Save Preferences
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Plugins Panel Component
const PluginsPanel = ({ availableTools, togglePlugin, onClose }) => {
    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-xl flex flex-col h-full"
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Tools & Plugins</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {availableTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <div
                            key={tool.id}
                            className={`p-4 rounded-lg border transition-all ${
                                tool.enabled
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{tool.name}</h4>
                                        <p className="text-xs text-gray-400">AI Enhancement Tool</p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => togglePlugin(tool.id)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                        tool.enabled ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                                            tool.enabled ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-300">
                                Enhance your AI experience with {tool.name.toLowerCase()} capabilities.
                            </p>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

// Templates Panel Component
const TemplatesPanel = ({ promptTemplates, applyTemplate, onClose }) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [...new Set(promptTemplates.map(t => t.category))];
    const filteredTemplates = promptTemplates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.prompt.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-xl flex flex-col h-full"
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Prompt Templates</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3 border-b border-white/10">
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1 text-xs rounded-full ${
                            selectedCategory === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-300'
                        }`}
                    >
                        All
                    </button>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 text-xs rounded-full capitalize ${
                                selectedCategory === category
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/10 text-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => applyTemplate(template)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                        </div>
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                            {template.prompt}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {template.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-white/10 text-xs rounded-full text-gray-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// Cost Tracker Panel Component
const CostTrackerPanel = ({ usageStats, onClose }) => {
    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-xl flex flex-col h-full"
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Usage & Cost</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-green-400">
                            ${usageStats.totalCost?.toFixed(4) || '0.0000'}
                        </div>
                        <div className="text-sm text-gray-400">Total Cost</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-blue-400">
                            {usageStats.totalTokens || 0}
                        </div>
                        <div className="text-sm text-gray-400">Tokens Used</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-purple-400">
                            {usageStats.totalMessages || 0}
                        </div>
                        <div className="text-sm text-gray-400">Messages</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-2xl font-bold text-yellow-400">
                            {usageStats.conversationCount || 0}
                        </div>
                        <div className="text-sm text-gray-400">Conversations</div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-medium mb-3">Cost Breakdown</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Input Tokens:</span>
                            <span className="text-gray-300">0.0000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Output Tokens:</span>
                            <span className="text-gray-300">0.0000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Images:</span>
                            <span className="text-gray-300">0.0000</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-2 border-t border-white/10">
                            <span>Total:</span>
                            <span className="text-green-400">${usageStats.totalCost?.toFixed(4) || '0.0000'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-medium mb-3">Monthly Usage</h4>
                    <div className="h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <BarChart2 size={32} className="mx-auto mb-2" />
                            <p>Usage Chart</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AIAssistant;