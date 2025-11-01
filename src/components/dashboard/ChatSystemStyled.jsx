import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Users, Search, MoreVertical, Phone, Video, Smile,
    Paperclip, Image as ImageIcon, File, X, Edit2, Trash2,
    Pin, Check, CheckCheck, Download, Plus, Settings,
    UserPlus, Hash, Lock, Bell, BellOff, Mic, Camera,
    ChevronDown, AtSign, ThumbsUp, Heart, Laugh, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const ChatSystem = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { socket, connected, on, off, joinRoom, leaveRoom, sendMessage } = useSocket();
    const { info, error: showError, success } = useNotifications();
    
    // State Management
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeRoom, setActiveRoom] = useState('general');
    const [typingUsers, setTypingUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showUserProfile, setShowUserProfile] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [messageReactions, setMessageReactions] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [directMessages, setDirectMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('rooms'); // rooms, dms, search
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messageInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    // Fetch rooms and users
    useEffect(() => {
        fetchRooms();
        fetchOnlineUsers();
        fetchDirectMessages();
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (connected && activeRoom) {
            joinRoom(activeRoom);

            const handleRoomHistory = (data) => {
                if (data.roomId === activeRoom) {
                    setMessages(data.messages.map(formatMessage));
                }
            };

            const handleNewMessage = (msg) => {
                if (msg.room === activeRoom) {
                    setMessages(prev => [...prev, formatMessage(msg)]);
                    scrollToBottom();
                    
                    // Mark as read
                    markMessageAsRead(msg._id);
                } else {
                    // Update unread count
                    setUnreadCounts(prev => ({
                        ...prev,
                        [msg.room]: (prev[msg.room] || 0) + 1
                    }));
                    
                    if (notificationsEnabled) {
                        showNotification(msg);
                    }
                }
            };

            const handleUserTyping = (data) => {
                if (data.roomId === activeRoom && data.userId !== user?.id) {
                    if (data.isTyping) {
                        setTypingUsers(prev => [...new Set([...prev, data.user])]);
                    } else {
                        setTypingUsers(prev => prev.filter(u => u !== data.user));
                    }
                }
            };

            const handleMessageUpdated = (msg) => {
                setMessages(prev => prev.map(m => 
                    m.id === msg._id ? formatMessage(msg) : m
                ));
            };

            const handleMessageDeleted = (msgId) => {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            };

            const handleReaction = (data) => {
                setMessageReactions(prev => ({
                    ...prev,
                    [data.messageId]: data.reactions
                }));
            };

            const handleUserStatusChange = (data) => {
                setOnlineUsers(prev => prev.map(u => 
                    u.id === data.userId ? { ...u, status: data.status } : u
                ));
            };

            on('room_history', handleRoomHistory);
            on('new_message', handleNewMessage);
            on('user_typing', handleUserTyping);
            on('message_updated', handleMessageUpdated);
            on('message_deleted', handleMessageDeleted);
            on('message_reaction', handleReaction);
            on('user_status_change', handleUserStatusChange);

            return () => {
                off('room_history', handleRoomHistory);
                off('new_message', handleNewMessage);
                off('user_typing', handleUserTyping);
                off('message_updated', handleMessageUpdated);
                off('message_deleted', handleMessageDeleted);
                off('message_reaction', handleReaction);
                off('user_status_change', handleUserStatusChange);
                leaveRoom(activeRoom);
            };
        }
    }, [connected, activeRoom, user, notificationsEnabled]);

    // API Functions
    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/chat/rooms', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setRooms(data.rooms);
            }
        } catch (error) {
            showError('Failed to fetch rooms');
        }
    };

    const fetchOnlineUsers = async () => {
        try {
            const response = await fetch('/api/chat/users/online', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setOnlineUsers(data.users);
            }
        } catch (error) {
            showError('Failed to fetch online users');
        }
    };

    const fetchDirectMessages = async () => {
        try {
            const response = await fetch('/api/chat/direct-messages', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setDirectMessages(data.conversations);
            }
        } catch (error) {
            showError('Failed to fetch direct messages');
        }
    };

    const searchMessages = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            const response = await fetch(`/api/chat/search?q=${encodeURIComponent(query)}&room=${activeRoom}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.results);
            }
        } catch (error) {
            showError('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const markMessageAsRead = async (messageId) => {
        try {
            await fetch(`/api/chat/messages/${messageId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Failed to mark message as read');
        }
    };

    const createRoom = async (roomData) => {
        try {
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(roomData)
            });
            const data = await response.json();
            if (data.success) {
                setRooms(prev => [...prev, data.room]);
                success('Room created successfully');
                setShowCreateRoom(false);
            }
        } catch (error) {
            showError('Failed to create room');
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            const response = await fetch(`/api/chat/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                success('Message deleted');
            }
        } catch (error) {
            showError('Failed to delete message');
        }
    };

    const updateMessage = async (messageId, content) => {
        try {
            const response = await fetch(`/api/chat/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });
            const data = await response.json();
            if (data.success) {
                success('Message updated');
                setEditingMessage(null);
            }
        } catch (error) {
            showError('Failed to update message');
        }
    };

    const addReaction = async (messageId, emoji) => {
        try {
            await fetch(`/api/chat/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ emoji })
            });
        } catch (error) {
            showError('Failed to add reaction');
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('room', activeRoom);

        try {
            const response = await fetch('/api/chat/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await response.json();
            return data.fileUrl;
        } catch (error) {
            showError('File upload failed');
            return null;
        }
    };

    // Helper Functions
    const formatMessage = (msg) => ({
        id: msg._id,
        user: msg.senderName,
        avatar: msg.senderAvatar || msg.senderName?.charAt(0) || 'U',
        message: msg.content,
        timestamp: new Date(msg.createdAt),
        roomId: msg.room,
        isOwn: msg.sender === user?.id,
        edited: msg.edited,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        replyTo: msg.replyTo,
        isPinned: msg.isPinned,
        readBy: msg.readBy || []
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTyping = () => {
        if (socket && connected) {
            socket.emit('typing', { roomId: activeRoom, isTyping: true, user: user?.name });
            
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing', { roomId: activeRoom, isTyping: false, user: user?.name });
            }, 1000);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !connected) return;

        let fileUrl = null;
        if (selectedFile) {
            fileUrl = await uploadFile(selectedFile);
            if (!fileUrl) return;
        }

        const messageData = {
            content: newMessage,
            type: selectedFile ? 'file' : 'text',
            fileUrl,
            fileType: selectedFile?.type,
            replyTo: replyingTo?.id
        };

        if (editingMessage) {
            await updateMessage(editingMessage.id, newMessage);
        } else {
            sendMessage(activeRoom, messageData);
        }

        setNewMessage('');
        setSelectedFile(null);
        setFilePreview(null);
        setReplyingTo(null);
        setEditingMessage(null);
        messageInputRef.current?.focus();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            const audioChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
                const fileUrl = await uploadFile(audioFile);
                
                if (fileUrl) {
                    sendMessage(activeRoom, {
                        content: 'Voice message',
                        type: 'voice',
                        fileUrl,
                        fileType: 'audio/wav'
                    });
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            showError('Could not access microphone');
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const showNotification = (message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New message from ${message.senderName}`, {
                body: message.content,
                icon: '/logo.png'
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const roomMessages = messages.filter(msg => msg.roomId === activeRoom);
    const filteredRooms = rooms.filter(room => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout title="Chat System" subtitle="Collaborate with your team in real-time">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] h-[calc(100vh-200px)] gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                
                {/* Left Sidebar - Rooms & Users */}
                <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'rooms'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <Hash size={16} className="inline mr-1" />
                            Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab('dms')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'dms'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <Users size={16} className="inline mr-1" />
                            DMs
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {activeTab === 'rooms' ? (
                            <>
                                {/* Create Room Button */}
                                <button
                                    onClick={() => setShowCreateRoom(true)}
                                    className="w-full flex items-center gap-2 p-3 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                    Create Room
                                </button>

                                {/* Rooms List */}
                                {filteredRooms.map(room => (
                                    <motion.div
                                        key={room.id}
                                        onClick={() => {
                                            setActiveRoom(room.id);
                                            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative p-3 rounded-lg cursor-pointer transition-all ${
                                            activeRoom === room.id
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {room.isPrivate && <Lock size={14} />}
                                                <span className="font-medium text-sm">{room.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {unreadCounts[room.id] > 0 && (
                                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                        {unreadCounts[room.id]}
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    activeRoom === room.id
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {room.members}
                                                </span>
                                            </div>
                                        </div>
                                        {room.description && (
                                            <p className={`text-xs mt-1 truncate ${
                                                activeRoom === room.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {room.description}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <>
                                {/* Direct Messages */}
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    Online ({onlineUsers.length})
                                </h3>
                                {onlineUsers.map(usr => (
                                    <motion.div
                                        key={usr.id}
                                        onClick={() => setShowUserProfile(usr)}
                                        whileHover={{ scale: 1.02 }}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                {usr.avatar}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(usr.status)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {usr.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {usr.status}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Center - Chat Area */}
                <div className="flex flex-col bg-gray-50 dark:bg-gray-900">
                    {/* Chat Header */}
                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Hash size={20} className="text-gray-400" />
                                {rooms.find(r => r.id === activeRoom)?.name || activeRoom}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {rooms.find(r => r.id === activeRoom)?.members} members
                                {typingUsers.length > 0 && (
                                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                                        • {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Phone size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Video size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <MoreVertical size={20} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Pinned Messages */}
                    {pinnedMessages.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
                            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                <Pin size={16} />
                                <span className="font-medium">Pinned:</span>
                                <span className="truncate">{pinnedMessages[0].message}</span>
                            </div>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {roomMessages.map((msg, index) => {
                                const showAvatar = index === 0 || roomMessages[index - 1].user !== msg.user;
                                const reactions = messageReactions[msg.id] || [];
                                
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`flex gap-3 group ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`${showAvatar ? 'visible' : 'invisible'}`}>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {msg.avatar}
                                            </div>
                                        </div>

                                        {/* Message Content */}
                                        <div className={`flex flex-col max-w-[60%] ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                                            {showAvatar && (
                                                <div className={`flex items-center gap-2 mb-1 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {msg.user}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Reply Preview */}
                                            {msg.replyTo && (
                                                <div className="bg-gray-100 dark:bg-gray-800 border-l-2 border-blue-500 p-2 rounded text-xs mb-1 max-w-full">
                                                    <p className="text-gray-600 dark:text-gray-400 truncate">
                                                        Replying to: {messages.find(m => m.id === msg.replyTo)?.message}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div className={`relative rounded-2xl px-4 py-2 shadow-sm ${
                                                msg.isOwn
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                                            }`}>
                                                {/* File Preview */}
                                                {msg.fileUrl && (
                                                    <div className="mb-2">
                                                        {msg.fileType?.startsWith('image/') ? (
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt="Shared image"
                                                                className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={msg.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
                                                            >
                                                                <File size={20} />
                                                                <span className="text-sm">Download File</span>
                                                                <Download size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message Text */}
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {msg.message}
                                                </p>

                                                {/* Read Receipt */}
                                                {msg.isOwn && (
                                                    <div className="flex justify-end mt-1">
                                                        {msg.readBy?.length > 1 ? (
                                                            <CheckCheck size={14} className="text-blue-200" />
                                                        ) : (
                                                            <Check size={14} className="text-white/60" />
                                                        )}
                                                    </div>
                                                )}

                                                {msg.edited && (
                                                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                                                )}

                                                {/* Message Actions */}
                                                <div className={`absolute ${msg.isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 px-2`}>
                                                    <button
                                                        onClick={() => setReplyingTo(msg)}
                                                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                                        title="Reply"
                                                    >
                                                        <Reply size={14} />
                                                    </button>
                                                    {msg.isOwn && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessage(msg);
                                                                    setNewMessage(msg.message);
                                                                }}
                                                                className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteMessage(msg.id)}
                                                                className="p-1 rounded bg-red-600 hover:bg-red-500 text-white"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => addReaction(msg.id, '👍')}
                                                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                                        title="React"
                                                    >
                                                        <Smile size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Reactions */}
                                            {reactions.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {reactions.map((reaction, idx) => (
                                                        <motion.button
                                                            key={idx}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        >
                                                            <span>{reaction.emoji}</span>
                                                            <span className="text-gray-600 dark:text-gray-400">{reaction.count}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply/Edit Indicator */}
                    {(replyingTo || editingMessage) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                {editingMessage ? (
                                    <>
                                        <Edit2 size={16} />
                                        <span>Editing message</span>
                                    </>
                                ) : (
                                    <>
                                        <Reply size={16} />
                                        <span>Replying to {replyingTo.user}</span>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setReplyingTo(null);
                                    setEditingMessage(null);
                                    setNewMessage('');
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* File Preview */}
                    {filePreview && (
                        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile?.name}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setFilePreview(null);
                                }}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Message Input */}
                    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Paperclip size={20} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Smile size={20} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                className={`p-2 rounded-lg transition-colors ${
                                    isRecording
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <Mic size={20} />
                            </motion.button>

                            <input
                                ref={messageInputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() && !selectedFile}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                <Send size={18} />
                                {editingMessage ? 'Update' : 'Send'}
                            </motion.button>
                        </div>

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-20 left-4 z-50">
                                <EmojiPicker
                                    onEmojiSelect={(emoji) => {
                                        setNewMessage(prev => prev + emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    onClose={() => setShowEmojiPicker(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Room Info */}
                <div className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Room Details
                    </h3>

                    {/* Room Description */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {rooms.find(r => r.id === activeRoom)?.description || 
                            'Real-time collaboration space for team communication and project updates.'}
                        </p>
                    </div>

                    {/* Notifications Toggle */}
                    <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <button
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className="flex items-center justify-between w-full"
                        >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Notifications
                            </span>
                            {notificationsEnabled ? (
                                <Bell size={18} className="text-blue-500" />
                            ) : (
                                <BellOff size={18} className="text-gray-400" />
                            )}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Quick Actions
                        </h4>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <Users size={18} />
                            View Members ({rooms.find(r => r.id === activeRoom)?.members || 0})
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <UserPlus size={18} />
                            Invite People
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <Settings size={18} />
                            Room Settings
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            <Search size={18} />
                            Search Messages
                        </motion.button>
                    </div>

                    {/* Pinned Messages */}
                    {pinnedMessages.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Pinned Messages
                            </h4>
                            <div className="space-y-2">
                                {pinnedMessages.map(msg => (
                                    <div key={msg.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Pin size={14} className="text-yellow-600 dark:text-yellow-400 mt-1" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                                                    {msg.user}
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showUserProfile && (
                    <UserProfileModal
                        user={showUserProfile}
                        onClose={() => setShowUserProfile(null)}
                    />
                )}

                {showCreateRoom && (
                    <CreateRoomModal
                        onClose={() => setShowCreateRoom(false)}
                        onCreate={createRoom}
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Helper Components
const Reply = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 10L4 15l5 5" />
        <path d="M20 4v7a4 4 0 01-4 4H4" />
    </svg>
);

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
    const emojis = ['😀', '😂', '😍', '🎉', '👍', '❤️', '🔥', '✨', '👏', '🙌', '💯', '🚀', '💪', '🎯', '⭐', '✅'];
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
        >
            <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEmojiSelect(emoji)}
                        className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                    >
                        {emoji}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};

const UserProfileModal = ({ user, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        User Profile
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-4">
                        {user.avatar}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {user.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {user.status}
                    </p>
                </div>

                <div className="space-y-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        Send Message
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        View Profile
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CreateRoomModal = ({ onClose, onCreate }) => {
    const [roomData, setRoomData] = useState({
        name: '',
        description: '',
        isPrivate: false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(roomData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Create New Room
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            value={roomData.name}
                            onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="e.g., Project Discussion"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={roomData.description}
                            onChange={(e) => setRoomData({ ...roomData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                            rows="3"
                            placeholder="What's this room about?"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            checked={roomData.isPrivate}
                            onChange={(e) => setRoomData({ ...roomData, isPrivate: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Lock size={16} />
                            Private Room
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                            Create Room
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ChatSystem;