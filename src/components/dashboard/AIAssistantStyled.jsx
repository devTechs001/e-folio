// src/components/Dashboard/AIAssistant/AIAssistantEnhanced.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mic, Sparkles, Lightbulb, Code, FileText, Zap, Upload,
    Download, Copy, Check, Trash2, RefreshCw, History, Settings,
    MessageSquare, Brain, Image as ImageIcon, Play, Square, ChevronDown,
    ChevronUp, Bookmark, Share2, MoreVertical, Plus, X, Search,
    Filter, Calendar, Tag, Star, Link as LinkIcon, Video, Music
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';

const AIAssistantEnhanced = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { success, error, info } = useNotifications();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    // State Management
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [aiModel, setAiModel] = useState('gpt-4');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2000);
    const [streamResponse, setStreamResponse] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [expandedMessages, setExpandedMessages] = useState(new Set());

    const suggestions = [
        { 
            icon: Code, 
            text: 'Generate code snippet', 
            color: 'blue',
            prompt: 'Can you help me write a function to...',
            category: 'code'
        },
        { 
            icon: Lightbulb, 
            text: 'Get creative ideas', 
            color: 'amber',
            prompt: 'I need creative ideas for...',
            category: 'creative'
        },
        { 
            icon: FileText, 
            text: 'Write documentation', 
            color: 'green',
            prompt: 'Help me write documentation for...',
            category: 'writing'
        },
        { 
            icon: Zap, 
            text: 'Optimize performance', 
            color: 'purple',
            prompt: 'How can I optimize...',
            category: 'optimization'
        },
        {
            icon: Brain,
            text: 'Explain concept',
            color: 'pink',
            prompt: 'Can you explain...',
            category: 'learning'
        },
        {
            icon: MessageSquare,
            text: 'Review code',
            color: 'indigo',
            prompt: 'Please review this code and suggest improvements...',
            category: 'review'
        }
    ];

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Setup speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsRecording(false);
            };

            recognitionRef.current.onerror = () => {
                setIsRecording(false);
                error('Speech recognition failed');
            };
        }
    }, []);

    const loadConversations = async () => {
        try {
            const response = await ApiService.getConversations();
            setConversations(response.conversations || []);
            
            if (response.conversations.length > 0) {
                loadConversation(response.conversations[0].id);
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    const loadConversation = async (conversationId) => {
        try {
            const response = await ApiService.getConversation(conversationId);
            setCurrentConversation(response.conversation);
            setMessages(response.conversation.messages || []);
        } catch (err) {
            error('Failed to load conversation');
        }
    };

    const createNewConversation = async () => {
        try {
            const response = await ApiService.createConversation({
                title: 'New Conversation',
                model: aiModel
            });
            
            setConversations([response.conversation, ...conversations]);
            setCurrentConversation(response.conversation);
            setMessages([]);
            success('New conversation started');
        } catch (err) {
            error('Failed to create conversation');
        }
    };

    const handleSend = async () => {
        if (!input.trim() && selectedFiles.length === 0) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: input,
            files: selectedFiles,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedFiles([]);
        setIsTyping(true);

        try {
            const response = await ApiService.sendMessage({
                conversationId: currentConversation?.id,
                message: input,
                files: selectedFiles,
                model: aiModel,
                temperature,
                maxTokens,
                stream: streamResponse
            });

            if (streamResponse) {
                // Handle streaming response
                handleStreamingResponse(response);
            } else {
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: response.message,
                    timestamp: new Date().toISOString(),
                    model: response.model,
                    tokens: response.tokens
                };
                
                setMessages(prev => [...prev, aiMessage]);
                setIsTyping(false);
            }

            // Update conversation
            if (!currentConversation) {
                await createNewConversation();
            }
        } catch (err) {
            error('Failed to send message');
            setIsTyping(false);
        }
    };

    const handleStreamingResponse = async (stream) => {
        const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: '',
            timestamp: new Date().toISOString(),
            streaming: true
        };

        setMessages(prev => [...prev, aiMessage]);

        try {
            const reader = stream.getReader();
            const decoder = new TextDecoder();

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
                            const content = parsed.choices[0]?.delta?.content || '';
                            
                            setMessages(prev => prev.map(msg => 
                                msg.id === aiMessage.id 
                                    ? { ...msg, content: msg.content + content }
                                    : msg
                            ));
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Streaming error:', err);
        } finally {
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessage.id 
                    ? { ...msg, streaming: false }
                    : msg
            ));
            setIsTyping(false);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

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

    const exportConversation = async () => {
        try {
            const data = {
                title: currentConversation?.title,
                messages,
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            success('Conversation exported');
        } catch (err) {
            error('Export failed');
        }
    };

    const deleteConversation = async (conversationId) => {
        try {
            await ApiService.deleteConversation(conversationId);
            setConversations(conversations.filter(c => c.id !== conversationId));
            
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
            
            success('Conversation deleted');
        } catch (err) {
            error('Failed to delete conversation');
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

    const renderMessage = (message) => {
        const isExpanded = expandedMessages.has(message.id);
        const isLong = message.content.length > 500;

        return (
            <div className="space-y-2">
                <ReactMarkdown
                    className="prose prose-invert max-w-none"
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={atomOneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {isLong && !isExpanded ? message.content.substring(0, 500) + '...' : message.content}
                </ReactMarkdown>

                {isLong && (
                    <button
                        onClick={() => toggleMessageExpanded(message.id)}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
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

                {message.files && message.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.files.map((file, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-1 bg-white/10 rounded-lg text-sm flex items-center gap-2"
                            >
                                <Upload size={14} />
                                {file.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout
            title="AI Assistant"
            subtitle={`${messages.length} messages • ${currentConversation?.title || 'New Conversation'}`}
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <History size={16} />
                        History
                    </button>

                    <button
                        onClick={exportConversation}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <Settings size={16} />
                        Settings
                    </button>

                    <button
                        onClick={createNewConversation}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                                 hover:to-purple-700 rounded-lg font-semibold transition-all shadow-lg 
                                 shadow-blue-500/25 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Chat
                    </button>
                </div>
            }
        >
            <div className="flex h-[calc(100vh-200px)]">
                {/* Sidebar - Conversation History */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 300, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-r border-white/10 bg-white/5 backdrop-blur-xl overflow-y-auto"
                        >
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Conversations</h3>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="relative mb-4">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                                 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>

                                {conversations
                                    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((conv) => (
                                    <motion.div
                                        key={conv.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => loadConversation(conv.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                                            currentConversation?.id === conv.id
                                                ? 'bg-blue-500/20 border-2 border-blue-500'
                                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate mb-1">
                                                    {conv.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {conv.messages?.[conv.messages.length - 1]?.content || 'No messages'}
                                                </p>
                                                <span className="text-xs text-gray-500 mt-1 block">
                                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteConversation(conv.id);
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded transition-all"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {conversations.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No conversations yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
                                             flex items-center justify-center shadow-2xl shadow-blue-500/50"
                                >
                                    <Sparkles size={48} className="text-white" />
                                </motion.div>

                                <div className="text-center max-w-2xl">
                                    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 
                                                 bg-clip-text text-transparent">
                                        Welcome to AI Assistant
                                    </h2>
                                    <p className="text-gray-400 text-lg mb-8">
                                        Ask me anything about coding, design, or get help with your projects. 
                                        I'm powered by {aiModel} and ready to assist!
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                                    {suggestions.map((suggestion, index) => (
                                        <motion.button
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.05, y: -4 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setInput(suggestion.prompt)}
                                            className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 
                                                     rounded-xl text-left group transition-all backdrop-blur-xl"
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-${suggestion.color}-500/10 
                                                          flex items-center justify-center mb-3 group-hover:scale-110 
                                                          transition-transform`}>
                                                <suggestion.icon className={`text-${suggestion.color}-500`} size={24} />
                                            </div>
                                            <h3 className="font-semibold mb-1">{suggestion.text}</h3>
                                            <p className="text-xs text-gray-400">{suggestion.category}</p>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            message.type === 'user'
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                                        }`}>
                                            {message.type === 'user' ? (
                                                <span className="text-white font-bold text-sm">
                                                    {user?.name?.[0] || 'U'}
                                                </span>
                                            ) : (
                                                <Brain size={20} className="text-white" />
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 max-w-3xl">
                                            <div className={`rounded-2xl p-5 ${
                                                message.type === 'user'
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                    : 'bg-white/5 border border-white/10 backdrop-blur-xl'
                                            }`}>
                                                {renderMessage(message)}

                                                {message.streaming && (
                                                    <div className="flex gap-2 mt-2">
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ y: [0, -8, 0] }}
                                                                transition={{
                                                                    duration: 0.6,
                                                                    repeat: Infinity,
                                                                    delay: i * 0.2
                                                                }}
                                                                className="w-2 h-2 rounded-full bg-blue-500"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Actions */}
                                            <div className="flex items-center gap-2 mt-2 ml-2">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>

                                                {message.type === 'ai' && (
                                                    <>
                                                        <button
                                                            onClick={() => copyToClipboard(message.content, message.id)}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                                        >
                                                            {copiedId === message.id ? (
                                                                <Check size={14} className="text-green-500" />
                                                            ) : (
                                                                <Copy size={14} className="text-gray-400" />
                                                            )}
                                                        </button>

                                                        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                                                            <RefreshCw size={14} className="text-gray-400" />
                                                        </button>

                                                        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                                                            <Bookmark size={14} className="text-gray-400" />
                                                        </button>

                                                        {message.tokens && (
                                                            <span className="text-xs text-gray-500 ml-auto">
                                                                {message.tokens} tokens
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}

                        {isTyping && !messages.some(m => m.streaming) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 
                                              flex items-center justify-center shadow-lg shadow-green-500/50">
                                    <Brain size={20} className="text-white" />
                                </div>
                                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5">
                                    <div className="flex gap-2">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{
                                                    duration: 0.6,
                                                    repeat: Infinity,
                                                    delay: i * 0.2
                                                }}
                                                className="w-2 h-2 rounded-full bg-blue-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-6">
                        {/* File Previews */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg"
                                    >
                                        <Upload size={16} />
                                        <span className="text-sm">{file.name}</span>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-all"
                                        >
                                            <X size={14} className="text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Controls */}
                        <div className="flex gap-3 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                multiple
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all 
                                         flex items-center justify-center"
                            >
                                <Upload size={20} />
                            </button>

                            <button
                                onClick={toggleRecording}
                                className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                                    isRecording
                                        ? 'bg-red-500 animate-pulse'
                                        : 'bg-white/10 hover:bg-white/20'
                                }`}
                            >
                                {isRecording ? <Square size={20} /> : <Mic size={20} />}
                            </button>

                            <div className="flex-1 bg-white/10 rounded-xl border border-white/10 overflow-hidden">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask me anything... (Shift+Enter for new line)"
                                    rows={3}
                                    className="w-full p-4 bg-transparent border-none outline-none resize-none 
                                             text-white placeholder-gray-400"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() && selectedFiles.length === 0}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                                         hover:to-purple-700 rounded-xl font-semibold transition-all shadow-lg 
                                         shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 
                                         disabled:cursor-not-allowed h-[60px]"
                            >
                                <Send size={20} />
                                <span>Send</span>
                            </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <span>Model: {aiModel} • Temperature: {temperature} • Max tokens: {maxTokens}</span>
                            <span>Press Shift+Enter for new line, Enter to send</span>
                        </div>
                    </div>
                </div>

                {/* Settings Sidebar */}
                <AnimatePresence>
                    {showSettings && (
                        <SettingsPanel
                            aiModel={aiModel}
                            setAiModel={setAiModel}
                            temperature={temperature}
                            setTemperature={setTemperature}
                            maxTokens={maxTokens}
                            setMaxTokens={setMaxTokens}
                            streamResponse={streamResponse}
                            setStreamResponse={setStreamResponse}
                            onClose={() => setShowSettings(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

// Settings Panel Component
const SettingsPanel = ({
    aiModel, setAiModel, temperature, setTemperature,
    maxTokens, setMaxTokens, streamResponse, setStreamResponse, onClose
}) => {
    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/10 bg-white/5 backdrop-blur-xl overflow-y-auto p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Settings</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                {/* AI Model Selection */}
                <div>
                    <label className="block text-sm font-semibold mb-3">AI Model</label>
                    <div className="space-y-2">
                        {[
                            { value: 'gpt-4', label: 'GPT-4', description: 'Most capable, slower' },
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
                            { value: 'claude-3', label: 'Claude 3', description: 'Anthropic\'s latest' }
                        ].map((model) => (
                            <button
                                key={model.value}
                                onClick={() => setAiModel(model.value)}
                                className={`w-full p-3 rounded-lg text-left transition-all ${
                                    aiModel === model.value
                                        ? 'bg-blue-500/20 border-2 border-blue-500'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <div className="font-semibold text-sm">{model.label}</div>
                                <div className="text-xs text-gray-400 mt-1">{model.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Temperature */}
                <div>
                    <label className="block text-sm font-semibold mb-2">
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
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Precise</span>
                        <span>Creative</span>
                    </div>
                </div>

                {/* Max Tokens */}
                <div>
                    <label className="block text-sm font-semibold mb-2">
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

                {/* Stream Response */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-sm">Stream Response</div>
                        <div className="text-xs text-gray-400">Show response as it generates</div>
                    </div>
                    <button
                        onClick={() => setStreamResponse(!streamResponse)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                            streamResponse ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                    >
                        <motion.div
                            animate={{ x: streamResponse ? 24 : 0 }}
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                        />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AIAssistantEnhanced;