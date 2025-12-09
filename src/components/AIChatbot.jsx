import React, { useState, useEffect, useRef } from 'react';
import { IoChatbubbleEllipses, IoClose, IoSend, IoSparkles, IoCodeSlash, IoLanguage, IoCog } from 'react-icons/io5';
import { FaRobot, FaUser, FaCopy, FaThumbsUp, FaThumbsDown, FaExclamationTriangle } from 'react-icons/fa';
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
        { text: 'Explain your experience', action: 'experience' }
    ];

    const predefinedResponses = {
        projects: {
            general: "I've worked on over 50 diverse projects ranging from full-stack web applications and mobile apps to AI-powered solutions and enterprise systems. Each project demonstrates cutting-edge technology implementation and innovative problem-solving approaches. My portfolio includes e-commerce platforms, real-time collaboration tools, data analytics dashboards, and custom software solutions. I'd be happy to highlight specific projects that align with your interests - are you looking for web development, mobile apps, or AI solutions?",
            code: "My technical portfolio spans across modern web technologies including React, Node.js, Python, and cloud architectures. I've built scalable microservices, real-time applications with WebSockets, RESTful APIs, and complex frontend interfaces. Recent projects include a real-time collaboration platform using Socket.io, an AI-powered content management system, and a distributed e-commerce solution with microservices. I follow clean code principles, implement comprehensive testing, and optimize for performance. What specific technologies or project types are you most interested in exploring?",
            creative: "My projects blend technical excellence with creative design thinking. I've developed interactive data visualizations that make complex information intuitive, immersive user experiences that engage and delight, and innovative interfaces that push boundaries. One standout project is an AI-powered design assistant that helps users create professional layouts through natural language. Another is a collaborative storytelling platform that combines real-time editing with creative writing tools. I believe the best solutions emerge when technology serves human creativity. What kind of creative challenge are you working on?",
            analyst: "Project performance metrics show exceptional results: 95% client satisfaction rate, 40% faster average delivery time compared to industry standards, and 92% of projects featuring measurable ROI improvements. My portfolio includes data-driven solutions that process millions of records, real-time analytics dashboards with sub-second response times, and predictive models with 85%+ accuracy. Key technical achievements include optimizing database queries by 300%, implementing caching strategies that reduced API response times by 60%, and building scalable architectures that handle 10x traffic spikes. What specific metrics or performance aspects would you like to dive deeper into?",
            translator: "I've delivered multilingual projects for clients across 15+ countries, implementing comprehensive localization strategies that go beyond simple translation. My portfolio includes international e-commerce platforms supporting 12 languages, multilingual content management systems with RTL language support, and cross-cultural collaboration tools. I've implemented Unicode compliance, cultural adaptation of UI/UX elements, and region-specific features like payment gateways and date formats. Understanding cultural nuances is crucial - I ensure that translations maintain context, tone, and cultural appropriateness. Are you looking to expand your project to international markets?"
        },
        skills: {
            general: "I bring comprehensive full-stack expertise with 5+ years of professional experience. My core competencies span frontend development (React, Vue, TypeScript), backend engineering (Node.js, Python, Java), cloud infrastructure (AWS, Docker, Kubernetes), and database management (PostgreSQL, MongoDB, Redis). I'm proficient in modern development practices including CI/CD pipelines, test-driven development, and agile methodologies. Beyond technical skills, I excel at system architecture design, team leadership, and translating complex business requirements into technical solutions. I'm continuously learning emerging technologies and best practices. What specific skills or technologies would you like to explore?",
            code: "Technical expertise breakdown: Frontend (React, Vue.js, TypeScript, Tailwind CSS, WebGL), Backend (Node.js, Express, Python, Django, Java Spring), Databases (PostgreSQL, MongoDB, Redis, Elasticsearch), Cloud & DevOps (AWS, Docker, Kubernetes, CI/CD, Terraform), Testing (Jest, Cypress, PyTest), and Performance Optimization. I follow SOLID principles, implement design patterns, and maintain comprehensive documentation. Recent technical achievements include reducing bundle sizes by 40%, implementing zero-downtime deployments, and building distributed systems with 99.9% uptime. Are you interested in specific technical areas or architectural patterns?",
            creative: "Beyond coding, I bring creative problem-solving, UX/UI design thinking, technical writing, and product management skills. I excel at creating user-centric solutions that balance functionality with aesthetics. My design experience includes creating responsive layouts, implementing micro-interactions, and building accessible interfaces. I've written comprehensive technical documentation, API specifications, and user guides. I also enjoy rapid prototyping and design sprints to iterate quickly on ideas. I believe technical solutions should not only work well but also provide delightful user experiences. What creative challenges or design problems are you facing?",
            analyst: "Skills assessment based on project outcomes: Full-Stack Development (95%), System Architecture (92%), Performance Optimization (90%), Database Design (88%), Cloud Infrastructure (85%), API Design (93%), Testing & Quality Assurance (87%), Technical Leadership (82%). I've led teams of 5+ developers, mentored junior engineers, and delivered technical presentations to stakeholders. My analytical approach includes code review processes, performance profiling, security audits, and cost optimization strategies. I use data-driven decision making for technical choices and regularly conduct retrospectives to improve processes. What specific metrics or analytical approaches are you interested in?",
            translator: "Multilingual capabilities: Fluent in English (native), Spanish (professional), and French (intermediate). Technical translation experience includes API documentation, user interfaces, error messages, and marketing materials. I've worked with international teams across North America, Europe, and Asia, adapting communication styles and technical approaches for different cultural contexts. I understand the challenges of international development including timezone coordination, cultural differences in design preferences, and localization best practices. I can bridge technical and business communication across languages and cultures. Are you working on international projects or need multilingual support?"
        },
        collaborate: {
            general: "I'm excited about collaboration opportunities that combine technical innovation with meaningful impact! Whether you're a startup with a groundbreaking idea, an established company looking to modernize systems, or an open-source project seeking contributors, I bring valuable expertise and enthusiasm. I thrive in collaborative environments where I can contribute to architecture decisions, mentor team members, and deliver high-quality solutions. I'm flexible with engagement models - from short-term consulting to long-term partnerships. Let's discuss your vision and explore how we can create something exceptional together!",
            code: "Seeking technical collaboration opportunities where I can contribute to challenging engineering problems. I can help with system architecture design, code reviews, technical leadership, and building scalable solutions. I'm experienced in agile methodologies, pair programming, and remote collaboration tools. I've mentored junior developers, conducted technical interviews, and led code review processes. Whether you need a technical co-founder, a senior developer to join your team, or a consultant to optimize your systems, I bring proven expertise and a collaborative mindset. What technical challenges or team dynamics are you working with?",
            creative: "Creative collaborations energize me! I love working on projects that push the boundaries of what's possible with technology. Whether it's experimental digital art installations, innovative user experiences, or AI-powered creative tools, I bring both technical depth and creative thinking. I enjoy brainstorming sessions, rapid prototyping, and iterating based on user feedback. I've collaborated with designers, artists, and product managers to create experiences that delight and inspire. If you have a creative vision that needs technical implementation, or want to explore the intersection of technology and art, let's create something remarkable together!",
            analyst: "Collaboration opportunities where data-driven insights can make a real impact: I can help with technical consulting, system audits, performance optimization, data strategy development, and analytics implementation. I provide detailed analysis of current systems, identify bottlenecks and improvement opportunities, and create actionable roadmaps. My analytical approach includes regular performance audits, user behavior analysis, and cost optimization strategies that reduced cloud expenses by 30%. What specific challenges or metrics are you looking to address through collaboration?",
            translator: "Open to international collaborations that bridge cultural and technical gaps. I can help with localization projects, international market expansion, multilingual team coordination, and cross-cultural product development. I understand the challenges of working across time zones, cultural differences in user expectations, and technical requirements for global products. I've successfully coordinated with teams in North America, Europe, and Asia, adapting communication styles and development processes for different cultural contexts. Whether you're expanding to international markets or working with distributed teams, I can help ensure smooth collaboration and culturally appropriate solutions."
        },
        experience: {
            general: "My professional journey spans 5+ years of progressive responsibility across startups, mid-size companies, and enterprise environments. I've grown from Junior Developer to Senior Full-Stack Engineer, taking on technical leadership roles and mentoring team members along the way. I've worked in fast-paced startup environments where rapid iteration is crucial, as well as structured enterprise settings with strict compliance requirements. This diverse experience has given me perspective on different development methodologies, team structures, and business challenges. Each role has taught me valuable lessons about communication, problem-solving, and delivering value through technology.",
            code: "Technical career progression: Started with frontend development (HTML/CSS/JavaScript), expanded to full-stack (React, Node.js, databases), then specialized in system architecture and cloud technologies. Key milestones include leading the migration of a monolith to microservices, implementing real-time features affecting millions of users, and building developer tooling that improved team productivity by 40%. I've worked in various domains: fintech (security-critical applications), healthcare (HIPAA compliance), e-commerce (high-traffic systems), and SaaS (multi-tenant architectures). I've also contributed to open-source projects and spoken at technical meetups. What specific technical journey or expertise area interests you?",
            creative: "My experience uniquely blends technical depth with creative direction. I've led product development from concept to market launch, combining user research, design thinking, and technical implementation. Creative highlights include designing an AI-powered content recommendation system, building interactive data visualizations that won design awards, and creating a collaborative storytelling platform used by thousands of writers. I've worked closely with UX designers, product managers, and stakeholders to translate creative visions into technical realities. This experience has taught me that the best products emerge at the intersection of technical excellence and human-centered design. What creative or design-focused challenges are you exploring?",
            analyst: "Quantified professional achievements: Delivered 50+ projects with 95% on-time completion, led teams of 5-15 engineers, improved system performance by an average of 60%, reduced technical debt by 40% through refactoring initiatives, and maintained 99.9% uptime for critical systems. I've implemented monitoring and alerting systems that reduced incident response time by 70%, established code quality standards that improved developer productivity, and built automated testing suites that caught 85% of bugs before production. My analytical approach includes regular performance audits, user behavior analysis, and cost optimization strategies that reduced cloud expenses by 30%. What specific metrics or analytical insights would be most valuable for your context?",
            translator: "Global experience spanning international markets and cross-cultural teams. I've worked with clients and teams across North America, Europe, and Asia, adapting to different business cultures and communication styles. International project highlights include launching a multilingual e-commerce platform in 8 countries, coordinating development across 5 time zones, and implementing localization strategies that increased international user engagement by 45%. I've navigated cultural differences in design preferences, business practices, and technical requirements. This global perspective has taught me to build flexible, culturally-aware systems that work seamlessly across borders. Are you looking to expand internationally or work with distributed teams?"
        }
    };

    const generateResponse = (userMessage, aiType) => {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for predefined responses
        for (const [key, responses] of Object.entries(predefinedResponses)) {
            if (lowerMessage.includes(key)) {
                return responses[aiType] || responses.general;
            }
        }

        // Generate contextual responses based on AI type, device, and visitor status
        const contextualResponses = {
            general: [
                isFirstTimeVisitor 
                    ? `Welcome to my portfolio! I'm excited to guide you through my work. Since you're viewing this on ${deviceType}, I can highlight projects and features that work best on your device. What would you like to explore first - my projects, skills, or collaboration opportunities?`
                    : `That's an excellent question! Based on my portfolio and experience, I'd be happy to provide detailed insights. I see you're browsing on ${deviceType}, so I can tailor my responses accordingly. What specific aspect interests you most?`,
                deviceType === 'mobile' 
                    ? "Great question! I notice you're browsing on mobile - I can highlight my responsive design projects and mobile-first development approach. My portfolio is fully optimized for mobile viewing. What would you like to know about my mobile development experience?"
                    : deviceType === 'tablet'
                    ? "Interesting question! Since you're on a tablet, I can share my experience with responsive design and touch-optimized interfaces. I've built several tablet-friendly applications. What aspect of my work interests you?"
                    : "That's a thoughtful question! Since you're on desktop, I can showcase my full-stack projects and complex web applications. I have extensive experience with desktop-optimized solutions. What would you like to explore?",
                `I appreciate your curiosity! My experience covers full-stack development, system architecture, and technical leadership across different domains. I enjoy discussing both technical challenges and business solutions. What particular area would you like to explore in depth?`
            ],
            code: [
                deviceType === 'mobile'
                    ? "From a technical perspective, I can dive deep into mobile-first development, responsive design, and performance optimization for mobile devices. My mobile projects include Progressive Web Apps, React Native applications, and highly optimized mobile websites. Are you interested in specific mobile technologies or responsive design techniques?"
                    : deviceType === 'tablet'
                    ? "Let me break this down technically. I specialize in responsive design and touch-optimized interfaces that work beautifully on tablets. My tablet projects include adaptive layouts, gesture-based interactions, and multi-resolution support. What technical challenges or tablet-specific features are you most curious about?"
                    : "From a technical perspective, I can dive deep into architecture decisions, technology choices, and implementation strategies. My experience includes building scalable systems, optimizing performance, and implementing best practices. Are you interested in specific technologies, architectural patterns, or development methodologies?",
                "Code-wise, I bring expertise across the full stack with a focus on clean architecture and maintainable solutions. I've implemented complex features like real-time collaboration, AI integrations, and high-performance systems. Would you like to discuss specific technologies, code patterns, or system designs?"
            ],
            creative: [
                isFirstTimeVisitor
                    ? "Creatively speaking, I love finding innovative solutions that bridge technology and human experience! Since this is your first visit, let me show you some of my most creative projects. I've developed interactive data visualizations, immersive user experiences, and innovative interfaces. What kind of creative challenges inspire you?"
                    : "Creatively speaking, I love finding innovative solutions that bridge technology and human experience. My projects often combine technical excellence with thoughtful design thinking. I believe the best solutions emerge when we push boundaries while staying user-focused. What creative challenges or design problems are you exploring?",
                deviceType === 'mobile'
                    ? "Creatively, I specialize in mobile-first design and creating delightful mobile experiences. My mobile projects feature smooth animations, intuitive gestures, and beautiful responsive layouts. I believe great mobile design is about simplicity and elegance. What creative mobile experiences interest you?"
                    : "Creativity is at the heart of what I do! I thrive on turning complex problems into elegant, intuitive solutions. My experience includes designing user interfaces, creating interactive experiences, and developing innovative features that engage users. What creative aspects of technology excite you most?"
            ],
            analyst: [
                isFirstTimeVisitor
                    ? "Analyzing your first visit, I can provide insights into my portfolio performance and project metrics. My work shows exceptional results: 95% client satisfaction, 40% faster delivery times, and 92% projects with measurable ROI improvements. Since you're new here, would you like me to highlight my most successful projects?"
                    : "Analyzing your question, I can provide data-driven insights and metrics-based perspectives. My approach combines technical expertise with quantitative analysis to deliver measurable results. I focus on performance optimization, user metrics, and system efficiency. What specific metrics or analytical insights would be most valuable?",
                deviceType === 'mobile'
                    ? "From an analytical perspective, I excel at mobile performance optimization and user experience metrics. My mobile projects show 60% faster load times, 95% mobile usability scores, and 40% better engagement rates. I use tools like Lighthouse and real user monitoring to optimize mobile experiences. What mobile performance metrics interest you?"
                    : "Data shows that the most successful projects balance innovation with measurable impact. I bring strong analytical skills to system design, performance optimization, and user experience improvements. I can provide insights on scalability, performance metrics, and ROI optimization. What analytical challenges are you facing?"
            ],
            translator: [
                isFirstTimeVisitor
                    ? "Welcome! I notice this might be your first visit. I have extensive experience with international projects and multilingual applications. My portfolio includes work with clients across 15+ countries, implementing comprehensive localization strategies. Are you interested in international development or multilingual solutions?"
                    : "As a language specialist, I can help bridge communication gaps across cultures and languages. My experience with international teams and multilingual projects has taught me the importance of cultural context and nuanced communication. How can I assist with international or multilingual aspects of your project?",
                deviceType === 'mobile'
                    ? "From a mobile localization perspective, I've implemented multilingual mobile apps with RTL support, adaptive layouts for different languages, and culturally appropriate UI elements. My mobile projects support 12+ languages with seamless switching. Are you interested in mobile internationalization?"
                    : "Language expertise allows me to facilitate global communication and ensure technical concepts translate effectively across cultures. I've coordinated with international teams and adapted solutions for different markets. How can I help with your multilingual or international needs?"
            ]
        };

        return contextualResponses[aiType][Math.floor(Math.random() * contextualResponses[aiType].length)];
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
                const aiMessage = {
                    id: Date.now() + 1,
                    text: response.data.response,
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
            
            // Determine error type and provide appropriate fallback
            let fallbackResponse = '';
            let errorType = 'general';
            
            if (error.response?.status === 500) {
                errorType = 'server';
                fallbackResponse = 'I apologize, but the AI service is temporarily unavailable. This might be due to server maintenance. Please try again in a few moments.';
            } else if (error.response?.status === 401) {
                errorType = 'auth';
                fallbackResponse = 'AI service authentication is not configured. Please contact the administrator to set up the API key.';
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                errorType = 'network';
                fallbackResponse = 'Unable to connect to the AI service. Please check your internet connection and try again.';
            } else {
                // Use predefined response as fallback
                fallbackResponse = generateResponse(currentInput, selectedAI);
            }
            
            const aiMessage = {
                id: Date.now() + 1,
                text: fallbackResponse,
                sender: 'ai',
                model: 'fallback',
                timestamp: new Date(),
                isError: true,
                errorType: errorType
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

    const copyMessage = (text) => {
        navigator.clipboard.writeText(text);
    };

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
                        <p>{aiModels[selectedAI].name}</p>
                    </div>
                </div>
                <div className="header-actions">
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
                                            className="action-btn"
                                            onClick={() => copyMessage(message.text)}
                                            aria-label="Copy message"
                                        >
                                            <FaCopy />
                                        </button>
                                        {message.sender === 'ai' && !message.isError && (
                                            <>
                                                <button className="action-btn" aria-label="Like">
                                                    <FaThumbsUp />
                                                </button>
                                                <button className="action-btn" aria-label="Dislike">
                                                    <FaThumbsDown />
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