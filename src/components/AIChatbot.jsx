import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoChatbubbleEllipses, IoClose, IoSend, IoSparkles, IoCodeSlash, IoLanguage, IoCog, IoTrashBin, IoRefresh, IoCopy } from 'react-icons/io5';
import { FaRobot, FaUser, FaThumbsUp, FaThumbsDown, FaExclamationTriangle, FaCheck, FaTimes, FaMagic } from 'react-icons/fa';
import apiService from '../services/api.service';
import '../styles/AIChatbot.css';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedAI, setSelectedAI] = useState('general');
    const [isMinimized, setIsMinimized] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
    const [deviceType, setDeviceType] = useState('desktop');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Detect device type and first-time visitor
    useEffect(() => {
        // Check if first-time visitor
        const hasVisited = localStorage.getItem('portfolio_visited');
        if (!hasVisited) {
            setIsFirstTimeVisitor(true);
            localStorage.setItem('portfolio_visited', 'true');
        }

        // Detect device type
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);
        const isTablet = /ipad|tablet/.test(userAgent);
        
        if (isTablet) {
            setDeviceType('tablet');
        } else if (isMobile) {
            setDeviceType('mobile');
        } else {
            setDeviceType('desktop');
        }
    }, []);

    // Load messages from session storage on mount
    useEffect(() => {
        const savedMessages = sessionStorage.getItem(`chat_messages_${sessionId}`);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                setMessages(parsed);
            } catch (error) {
                console.log('No saved messages found');
            }
        }
    }, [sessionId]);

    // Save messages to session storage when they change
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
        }
    }, [messages, sessionId]);

    // Clear messages when session ends (page close)
    useEffect(() => {
        const handleBeforeUnload = () => {
            sessionStorage.removeItem(`chat_messages_${sessionId}`);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [sessionId]);

    const aiModels = {
        general: {
            name: 'General Assistant',
            icon: <FaRobot />,
            color: '#6366f1',
            description: 'General questions and help'
        },
        code: {
            name: 'Code Expert',
            icon: <IoCodeSlash />,
            color: '#10b981',
            description: 'Programming and development'
        },
        creative: {
            name: 'Creative Writer',
            icon: <IoSparkles />,
            color: '#f59e0b',
            description: 'Writing and creativity'
        },
        analyst: {
            name: 'Data Analyst',
            icon: <IoCog />,
            color: '#ef4444',
            description: 'Data analysis and insights'
        },
        translator: {
            name: 'Language Expert',
            icon: <IoLanguage />,
            color: '#8b5cf6',
            description: 'Translation and languages'
        }
    };

    const quickActions = [
        { text: 'Tell me about your projects', action: 'projects' },
        { text: 'What skills do you have?', action: 'skills' },
        { text: 'How can we collaborate?', action: 'collaborate' },
        { text: 'Tell me about your experience', action: 'experience' },
        { text: 'How can I contact you?', action: 'contact' }
    ];

    const sanitizeResponse = (text) => {
        const sensitivePatterns = [
            /src\/\w+/gi, /server\/\w+/gi, /routes\/\w+/gi, /controllers\/\w+/gi,
            /models\/\w+/gi, /middleware\/\w+/gi, /config\/\w+/gi, /\.env\w*/gi,
            /database\s+url/i, /mongodb\s+uri/i, /api\s+key/i, /secret\s+\w+/gi,
            /password\s*[:=]\s*\S+/gi, /token\s*[:=]\s*\S+/gi, /jwt\s*[:=]\s*\S+/gi,
            /endpoint[:=]\s*\S+/gi, /localhost:\d+/gi, /127\.0\.0\.1:\d+/gi,
            /process\.env/i, /import\.meta\.env/i
        ];
        let sanitized = text;
        sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        });
        return sanitized;
    };

    const fallbackResponses = {
        greeting: [
            "Hello! Welcome to my portfolio. I'm here to help you explore my work and skills. What would you like to know about?",
            "Hi there! Thanks for visiting. I can tell you about my projects, skills, or how we can work together. What interests you?",
            "Hey! Great to have you here. Feel free to ask me anything about my portfolio or experience!",
            "Welcome! I'm your AI guide to this portfolio. Ask me about projects, skills, technologies I use, or collaboration opportunities."
        ],
        projects: [
            "I've worked on a variety of projects including web applications, mobile apps, and software solutions. Each project showcases different technologies and problem-solving approaches. Would you like to see specific types of projects?",
            "My portfolio includes several projects that demonstrate my skills in frontend and backend development. I enjoy building responsive, user-friendly applications. What kind of projects are you interested in?",
            "I've created everything from interactive web apps to data visualization dashboards. Each project taught me something new. Would you like me to highlight some of my recent work?",
            "The projects in my portfolio reflect my passion for clean code, good design, and solving real problems. Is there a particular type of project you'd like to learn more about?"
        ],
        skills: [
            "I work with modern web technologies including React, Node.js, and various databases. I'm always learning new tools and frameworks. What skills are you curious about?",
            "My skill set spans frontend development, backend engineering, and everything in between. I focus on writing clean, maintainable code. Any specific technology you'd like to discuss?",
            "I specialize in full-stack web development with modern JavaScript frameworks, responsive design, and server-side technologies. Would you like to know more about any particular area?",
            "I bring both technical and creative skills to the table - from coding to design thinking. I believe in building solutions that are both functional and elegant. What interests you most?"
        ],
        experience: [
            "I have several years of experience in software development, working on diverse projects across different domains. Each project has helped me grow as a developer. Would you like to hear about specific experiences?",
            "My journey in tech has been exciting and full of learning. I've worked on various projects that challenged me and helped me improve my skills. What would you like to know about my background?",
            "I've gained experience working with different technologies, frameworks, and development methodologies. I enjoy taking on new challenges and solving complex problems. Ask me anything!",
            "Through my work, I've developed strong problem-solving skills and a deep understanding of web technologies. I'm passionate about creating great user experiences. How can I help you today?"
        ],
        collaborate: [
            "I'm always open to interesting collaboration opportunities! Whether you have a project idea, need technical help, or want to discuss a partnership, I'd love to hear about it.",
            "Collaboration is at the heart of great work. If you have a project or idea you'd like to discuss, feel free to reach out through the contact section!",
            "I enjoy working with others who share a passion for creating amazing things. If you'd like to collaborate, just let me know what you have in mind!",
            "Looking for a collaborator? I'm excited about new opportunities and would be happy to discuss how we could work together on your next project."
        ],
        contact: [
            "You can reach me through the contact form on this website, or connect with me via social media links in the about section. I'd love to hear from you!",
            "Feel free to send me a message through the contact section below, or connect on social media. I typically respond within a day!",
            "The best way to reach me is through the contact form on this site. I'm always open to new connections and conversations!"
        ],
        general: [
            "That's a great question! I'd be happy to help you learn more about my work and experience. What specific area interests you?",
            "Thanks for your interest! I can share insights about my projects, technical skills, or professional background. What would you like to explore?",
            "I'm here to help you navigate this portfolio. Feel free to ask about projects, skills, experience, or anything else you're curious about!",
            "Great question! My portfolio showcases my work in web development and software engineering. Is there something specific you'd like to know more about?",
            "I appreciate your curiosity! I've worked on many interesting projects and learned a lot along the way. What aspect would you like to dive into?",
            "Thanks for asking! My goal is to create useful, well-crafted digital solutions. I'd be happy to tell you more about specific projects or my approach."
        ],
        compliment: [
            "Thank you so much! That means a lot. I put a lot of effort into my work and it's wonderful to hear that you appreciate it.",
            "I really appreciate your kind words! It motivates me to keep creating and improving. Is there anything specific you'd like to know more about?",
            "Thank you! Your feedback makes my day. If you have any questions about my work or experience, I'm here to help!",
            "That's very kind of you to say! I'm glad you like what you see. Feel free to explore more or ask me anything!"
        ],
        farewell: [
            "Thanks for chatting with me! Feel free to come back anytime if you have more questions. Have a great day!",
            "It was great talking with you! If you ever need more information, just open this chat again. Take care!",
            "Goodbye! I hope you enjoyed exploring my portfolio. If you have more questions later, I'll be right here. Cheers!",
            "Thanks for stopping by! Don't hesitate to reach out through the contact form if you'd like to connect further. Have a wonderful day!"
        ],
        unknown: [
            "That's an interesting topic! While I'm primarily here to help you explore my portfolio, I'd be happy to answer questions about my projects, skills, or experience.",
            "I'm not sure I have the answer to that, but I can definitely tell you about my work! Would you like to hear about my projects or skills?",
            "That's outside my main focus, but I'd love to help you learn more about my portfolio instead. What would you like to explore?",
            "I specialize in discussing my portfolio and experience. Could you ask me about my projects, skills, or how we might collaborate?"
        ]
    };

    const detectIntent = (message) => {
        const lower = message.toLowerCase();
        const categories = {
            greeting: /^(hi|hello|hey|greetings|sup|yo|howdy|good\s*(morning|afternoon|evening))/i,
            projects: /(project|portfolio|work|app|application|website|built|created|developed|showcase|demo)/i,
            skills: /(skill|technology|tech\b|stack|framework|language|tool|know|languages|proficient|expertise|competenc)/i,
            experience: /(experience|background|journey|career|years|worked\s*(as|at|on)|professional|history|bio|about\s*you)/i,
            collaborate: /(collaborate|collaboration|hire|freelance|contract|work\s*together|partner|opportunit|job|position|team)/i,
            contact: /(contact|email|message|reach|phone|call|social|connect|get\s*in\s*touch)/i,
            compliment: /(great|awesome|amazing|nice|beautiful|impressive|love|wow|cool|fantastic|excellent|good\s*job|well\s*done)/i,
            farewell: /(bye|goodbye|see\s*you|later|farewell|cya|peace|take\s*care)/i
        };

        for (const [category, pattern] of Object.entries(categories)) {
            if (pattern.test(lower)) return category;
        }
        return 'unknown';
    };

    const generateResponse = (userMessage, aiType) => {
        const intent = detectIntent(userMessage);
        const responses = fallbackResponses[intent] || fallbackResponses.general;
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Clear input and show typing indicator
        const currentInput = input.trim();
        setInput('');
        setIsTyping(true);

        try {
            // Call real Gemini API
            const response = await apiService.request('/chatbot/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: currentInput,
                    aiType: selectedAI,
                    conversationHistory: messages.slice(-6).map(m => ({ // Keep last 6 messages for context
                        role: m.sender === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }))
                })
            });

            if (response.data.success) {
                const safeText = sanitizeResponse(response.data.response || '');
                const aiMessage = {
                    id: Date.now() + 1,
                    text: safeText,
                    sender: 'ai',
                    model: response.data.model,
                    timestamp: new Date(),
                    tokens: response.data.tokens
                };
                
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error(response.data.error || 'Failed to get response');
            }
            
        } catch (error) {
            console.error('Chatbot error:', error);
            
            const fallbackResponse = generateResponse(currentInput, selectedAI);
            
            const isConnectionIssue = error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('network');
            
            const aiMessage = {
                id: Date.now() + 1,
                text: fallbackResponse,
                sender: 'ai',
                model: 'fallback',
                timestamp: new Date(),
                isError: isConnectionIssue,
                errorType: isConnectionIssue ? 'network' : 'general'
            };
            
            setMessages(prev => [...prev, aiMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (action) => {
        setInput(action.text);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const [copiedId, setCopiedId] = useState(null);

    const copyMessage = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const clearChat = useCallback(() => {
        setMessages([]);
        sessionStorage.removeItem(`chat_messages_${sessionId}`);
    }, [sessionId]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <div className="chatbot-fab-container">
                <button
                    className="chatbot-fab"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Chat"
                >
                    <IoChatbubbleEllipses />
                    <span className="fab-pulse"></span>
                </button>
            </div>
        );
    }

    return (
        <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
            {/* Header */}
            <div className="chatbot-header">
                <div className="header-content">
                    <div className="ai-avatar">
                        <FaRobot />
                        <span className="ai-status online"></span>
                    </div>
                    <div className="header-info">
                        <h3>AI Assistant</h3>
                        <p>{aiModels[selectedAI]?.name || 'AI Assistant'}</p>
                    </div>
                </div>
                <div className="header-actions">
                    {messages.length > 0 && (
                        <button
                            className="header-btn clear-btn"
                            onClick={clearChat}
                            aria-label="Clear chat"
                            title="Clear conversation"
                        >
                            <IoTrashBin />
                        </button>
                    )}
                    <button
                        className="header-btn minimize-btn"
                        onClick={() => setIsMinimized(!isMinimized)}
                        aria-label="Minimize"
                    >
                        {isMinimized ? <IoChatbubbleEllipses /> : <IoClose />}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* AI Model Selector */}
                    <div className="ai-model-selector">
                        <div className="model-tabs">
                            {Object.entries(aiModels).map(([key, model]) => (
                                <button
                                    key={key}
                                    className={`model-tab ${selectedAI === key ? 'active' : ''}`}
                                    onClick={() => setSelectedAI(key)}
                                    style={{ '--accent-color': model.color }}
                                >
                                    <span className="model-icon">{model.icon}</span>
                                    <span className="model-name">{model.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="welcome-message">
                                <div className="welcome-content">
                                    <FaRobot />
                                    <h4>
                                        {isFirstTimeVisitor 
                                            ? "Welcome! I'm your AI Portfolio Guide" 
                                            : "Hello! I'm your AI Assistant"
                                        }
                                    </h4>
                                    <p>
                                        {isFirstTimeVisitor 
                                            ? deviceType === 'mobile'
                                                ? "I'm excited to guide you through my mobile-optimized portfolio! I can highlight responsive projects and mobile development expertise. What would you like to explore first?"
                                                : deviceType === 'tablet'
                                                ? "Welcome to my tablet-friendly portfolio! I can showcase touch-optimized interfaces and adaptive designs. How can I help you discover my work?"
                                                : "Welcome to my portfolio! I can guide you through my projects, skills, and collaboration opportunities. What would you like to explore?"
                                            : deviceType === 'mobile'
                                                ? "I can help you explore my mobile-optimized portfolio and responsive design projects. What interests you most?"
                                                : deviceType === 'tablet'
                                                ? "I can showcase my tablet-friendly projects and touch-optimized interfaces. What would you like to know?"
                                                : "I can help you learn about my portfolio, skills, and collaboration opportunities. Choose an AI model above or ask me anything!"
                                        }
                                    </p>
                                </div>
                                <div className="quick-actions">
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={index}
                                            className="quick-action-btn"
                                            onClick={() => handleQuickAction(action)}
                                        >
                                            {action.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''}`}
                            >
                                <div className="message-avatar">
                                    {message.sender === 'user' ? <FaUser /> : message.isError ? <FaExclamationTriangle /> : aiModels[message.model]?.icon || <FaRobot />}
                                </div>
                                <div className="message-content">
                                    <div className="message-text">
                                        {message.text}
                                    </div>
                                    <div className="message-actions">
                                        <button
                                            className={`action-btn ${copiedId === message.id ? 'copied' : ''}`}
                                            onClick={() => copyMessage(message.text, message.id)}
                                            aria-label="Copy message"
                                        >
                                            {copiedId === message.id ? <FaCheck className="text-green-400" /> : <IoCopy />}
                                        </button>
                                        {message.sender === 'ai' && !message.isError && (
                                            <>
                                                <button className="action-btn" aria-label="Like">
                                                    <FaThumbsUp />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="message ai-message typing">
                                <div className="message-avatar">
                                    <FaRobot />
                                </div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chatbot-input">
                        <div className="input-container">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything about my portfolio..."
                                className="message-input"
                                rows={1}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSendMessage}
                                disabled={!input.trim()}
                                aria-label="Send message"
                            >
                                <IoSend />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatbot;