import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Lightbulb, Code, FileText, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const AIAssistant = () => {
    const { theme } = useTheme();
    const { info } = useNotifications();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const suggestions = [
        { icon: <Code size={20} />, text: 'Generate code snippet', color: '#3b82f6' },
        { icon: <Lightbulb size={20} />, text: 'Get creative ideas', color: '#f59e0b' },
        { icon: <FileText size={20} />, text: 'Write documentation', color: '#10b981' },
        { icon: <Zap size={20} />, text: 'Optimize performance', color: '#a855f7' }
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: `I understand you want to know about "${input}". Here's a helpful response with some suggestions and code examples that might help you achieve your goal.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion.text);
    };

    return (
        <DashboardLayout title="AI Assistant" subtitle="Get intelligent help with your projects">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 200px)',
                overflow: 'hidden'
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {messages.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '32px'
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: theme.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 8px 32px ${theme.primary}60`
                                }}
                            >
                                <Sparkles size={50} style={{ color: theme.background }} />
                            </motion.div>
                            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                                <h2 style={{
                                    color: theme.text,
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    fontFamily: theme.fontHeading
                                }}>Welcome to AI Assistant</h2>
                                <p style={{
                                    color: theme.textSecondary,
                                    fontSize: '16px',
                                    lineHeight: '1.6'
                                }}>
                                    Ask me anything about coding, design, or project management. I'm here to help!
                                </p>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                width: '100%',
                                maxWidth: '800px'
                            }}>
                                {suggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        style={{
                                            padding: '20px',
                                            background: `${theme.surface}80`,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: `${suggestion.color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: suggestion.color
                                        }}>
                                            {suggestion.icon}
                                        </div>
                                        <span style={{
                                            color: theme.text,
                                            fontSize: '15px',
                                            fontWeight: '500'
                                        }}>{suggestion.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: message.type === 'user' ? theme.gradient : `${theme.accent}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: message.type === 'user' ? `0 4px 12px ${theme.primary}40` : 'none'
                                    }}>
                                        {message.type === 'user' ? (
                                            <span style={{ color: theme.background, fontWeight: '700' }}>U</span>
                                        ) : (
                                            <Sparkles size={20} style={{ color: theme.text }} />
                                        )}
                                    </div>
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '16px 20px',
                                        background: message.type === 'user' ? theme.gradient : `${theme.surface}90`,
                                        color: message.type === 'user' ? theme.background : theme.text,
                                        borderRadius: message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        boxShadow: `0 2px 8px ${theme.primary}15`,
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        {message.content}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: `${theme.accent}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Sparkles size={20} style={{ color: theme.text }} />
                            </div>
                            <div style={{
                                padding: '16px 20px',
                                background: `${theme.surface}90`,
                                borderRadius: '16px 16px 16px 4px',
                                display: 'flex',
                                gap: '6px'
                            }}>
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.2
                                        }}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: theme.primary
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '24px',
                    borderTop: `1px solid ${theme.border}`,
                    background: `${theme.surface}40`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        <button style={{
                            padding: '12px',
                            background: `${theme.primary}15`,
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            color: theme.primary,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = `${theme.primary}25`}
                        onMouseOut={(e) => e.currentTarget.style.background = `${theme.primary}15`}
                        >
                            <Mic size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '12px',
                                color: theme.text,
                                fontSize: '15px',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                padding: '14px 28px',
                                background: theme.gradient,
                                border: 'none',
                                borderRadius: '12px',
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
        </DashboardLayout>
    );
};

export default AIAssistant;
