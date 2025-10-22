import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Search, MoreVertical, Phone, Video, Smile } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const ChatSystem = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { socket, connected, on, off, joinRoom, leaveRoom, sendMessage } = useSocket();
    const { info } = useNotifications();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeRoom, setActiveRoom] = useState('general');
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);

    const rooms = [
        { id: 'general', name: 'General', members: 5 },
        { id: 'projects', name: 'Projects', members: 3 },
        { id: 'collaboration', name: 'Collaboration', members: 2 }
    ];

    const [onlineUsers, setOnlineUsers] = useState([
        { id: 1, name: 'John Developer', avatar: 'JD', status: 'online' },
        { id: 2, name: 'Sarah Designer', avatar: 'SD', status: 'away' },
        { id: 3, name: 'Mike Tester', avatar: 'MT', status: 'busy' }
    ]);

    // Join room and listen for messages
    useEffect(() => {
        if (connected && activeRoom) {
            joinRoom(activeRoom);

            // Listen for room history
            const handleRoomHistory = (data) => {
                if (data.roomId === activeRoom) {
                    setMessages(data.messages.map(msg => ({
                        id: msg._id,
                        user: msg.senderName,
                        avatar: msg.senderName?.charAt(0) || 'U',
                        message: msg.content,
                        timestamp: new Date(msg.createdAt),
                        roomId: msg.room,
                        isOwn: msg.sender === user?.id
                    })));
                }
            };

            // Listen for new messages
            const handleNewMessage = (msg) => {
                if (msg.room === activeRoom) {
                    setMessages(prev => [...prev, {
                        id: msg._id,
                        user: msg.senderName,
                        avatar: msg.senderName?.charAt(0) || 'U',
                        message: msg.content,
                        timestamp: new Date(msg.createdAt),
                        roomId: msg.room,
                        isOwn: msg.sender === user?.id
                    }]);
                }
            };

            // Listen for typing indicators
            const handleUserTyping = (data) => {
                if (data.roomId === activeRoom && data.userId !== user?.id) {
                    if (data.isTyping) {
                        setTypingUsers(prev => [...new Set([...prev, data.user])]);
                    } else {
                        setTypingUsers(prev => prev.filter(u => u !== data.user));
                    }
                }
            };

            on('room_history', handleRoomHistory);
            on('new_message', handleNewMessage);
            on('user_typing', handleUserTyping);

            return () => {
                off('room_history', handleRoomHistory);
                off('new_message', handleNewMessage);
                off('user_typing', handleUserTyping);
                leaveRoom(activeRoom);
            };
        }
    }, [connected, activeRoom, joinRoom, leaveRoom, on, off, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !connected) return;

        sendMessage(activeRoom, {
            content: newMessage,
            type: 'text'
        });

        setNewMessage('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#10b981';
            case 'away': return '#f59e0b';
            case 'busy': return '#ef4444';
            default: return theme.textSecondary;
        }
    };

    const roomMessages = messages.filter(msg => msg.roomId === activeRoom);

    return (
        <DashboardLayout title="Chat System" subtitle="Collaborate with your team in real-time">
            <div style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr 280px',
                height: 'calc(100vh - 200px)',
                gap: '0',
                overflow: 'hidden'
            }}>
                {/* Rooms Sidebar */}
                <div style={{
                    background: `${theme.surface}60`,
                    borderRight: `1px solid ${theme.border}`,
                    padding: '20px',
                    overflowY: 'auto'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            color: theme.text,
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            fontFamily: theme.fontHeading
                        }}>Rooms</h3>
                        {rooms.map(room => (
                            <motion.div
                                key={room.id}
                                onClick={() => setActiveRoom(room.id)}
                                whileHover={{ scale: 1.02 }}
                                style={{
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    background: activeRoom === room.id ? theme.gradient : `${theme.primary}10`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: `1px solid ${activeRoom === room.id ? theme.primary : theme.border}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        color: activeRoom === room.id ? theme.background : theme.text,
                                        fontWeight: activeRoom === room.id ? '600' : '500',
                                        fontSize: '15px'
                                    }}>{room.name}</span>
                                    <span style={{
                                        background: activeRoom === room.id ? theme.background + '40' : `${theme.primary}20`,
                                        color: activeRoom === room.id ? theme.background : theme.primary,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>{room.members}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div>
                        <h3 style={{
                            color: theme.text,
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            fontFamily: theme.fontHeading
                        }}>Online ({onlineUsers.length})</h3>
                        {onlineUsers.map(user => (
                            <div key={user.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px',
                                marginBottom: '8px',
                                borderRadius: '8px',
                                background: `${theme.primary}08`,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                            onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}08`}
                            >
                                <div style={{ position: 'relative', marginRight: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: theme.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: theme.background,
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}>{user.avatar}</div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: getStatusColor(user.status),
                                        border: `2px solid ${theme.surface}`
                                    }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        color: theme.text,
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        margin: 0
                                    }}>{user.name}</p>
                                    <p style={{
                                        color: theme.textSecondary,
                                        fontSize: '12px',
                                        margin: 0,
                                        textTransform: 'capitalize'
                                    }}>{user.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: theme.background
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '20px',
                        borderBottom: `1px solid ${theme.border}`,
                        background: `${theme.surface}40`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{
                                color: theme.text,
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: 0,
                                fontFamily: theme.fontHeading
                            }}>#{rooms.find(r => r.id === activeRoom)?.name || activeRoom}</h3>
                            <p style={{
                                color: theme.textSecondary,
                                fontSize: '13px',
                                margin: '4px 0 0'
                            }}>{rooms.find(r => r.id === activeRoom)?.members} members</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{
                                background: `${theme.primary}15`,
                                border: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: theme.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                            onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                            >
                                <Phone size={20} />
                            </button>
                            <button style={{
                                background: `${theme.primary}15`,
                                border: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: theme.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                            onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                            >
                                <Video size={20} />
                            </button>
                            <button style={{
                                background: `${theme.primary}15`,
                                border: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: theme.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                            onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                            >
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <AnimatePresence>
                            {roomMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: msg.isOwn ? theme.gradient : `${theme.accent}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: msg.isOwn ? theme.background : theme.text,
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        flexShrink: 0
                                    }}>{msg.avatar}</div>
                                    <div style={{
                                        maxWidth: '60%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.isOwn ? 'flex-end' : 'flex-start'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '6px'
                                        }}>
                                            <span style={{
                                                color: theme.text,
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>{msg.user}</span>
                                            <span style={{
                                                color: theme.textSecondary,
                                                fontSize: '12px'
                                            }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div style={{
                                            background: msg.isOwn ? theme.gradient : `${theme.surface}90`,
                                            color: msg.isOwn ? theme.background : theme.text,
                                            padding: '12px 16px',
                                            borderRadius: msg.isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            fontSize: '15px',
                                            lineHeight: '1.5',
                                            boxShadow: `0 2px 8px ${theme.primary}15`
                                        }}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div style={{
                        padding: '20px',
                        borderTop: `1px solid ${theme.border}`,
                        background: `${theme.surface}40`
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <button style={{
                                background: `${theme.primary}15`,
                                border: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: theme.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Smile size={20} />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: `${theme.surface}90`,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '10px',
                                    color: theme.text,
                                    fontSize: '15px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                style={{
                                    background: theme.gradient,
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    color: theme.background,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    boxShadow: `0 4px 15px ${theme.primary}40`,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 6px 20px ${theme.primary}60`;
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 4px 15px ${theme.primary}40`;
                                }}
                            >
                                <Send size={18} />
                                <span>Send</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar (Optional - can be hidden on small screens) */}
                <div style={{
                    background: `${theme.surface}60`,
                    borderLeft: `1px solid ${theme.border}`,
                    padding: '20px',
                    overflowY: 'auto'
                }}>
                    <h3 style={{
                        color: theme.text,
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        fontFamily: theme.fontHeading
                    }}>Room Info</h3>
                    <p style={{
                        color: theme.textSecondary,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        marginBottom: '24px'
                    }}>
                        Real-time collaboration space for team communication and project updates.
                    </p>
                    <div style={{
                        background: `${theme.primary}10`,
                        padding: '16px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`
                    }}>
                        <p style={{
                            color: theme.text,
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>Quick Actions</p>
                        <button style={{
                            width: '100%',
                            padding: '10px',
                            background: `${theme.primary}15`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '8px',
                            color: theme.text,
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                        onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                        >
                            View Members
                        </button>
                        <button style={{
                            width: '100%',
                            padding: '10px',
                            background: `${theme.primary}15`,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '8px',
                            color: theme.text,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                        onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                        >
                            Room Settings
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatSystem;
