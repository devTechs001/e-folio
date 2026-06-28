import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoChatbubbleEllipses, IoClose, IoSend, IoSparkles, IoCodeSlash, IoLanguage, IoCog, IoTrashBin, IoRefresh, IoCopy, IoMic, IoMicOff, IoVolumeHigh, IoVolumeMute, IoSettings, IoEllipsisHorizontal } from 'react-icons/io5';
import { FaRobot, FaUser, FaThumbsUp, FaThumbsDown, FaExclamationTriangle, FaCheck, FaTimes, FaMagic, FaRegClock, FaRegLightbulb } from 'react-icons/fa';
import apiService from '../services/api.service';
import '../styles/AIChatbot.css';

const STREAMING_DELAY = 15;

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
  const [copiedId, setCopiedId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [streamingText, setStreamingText] = useState({});
  const [userName, setUserName] = useState(() => localStorage.getItem('chat_user_name') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamTimersRef = useRef({});

  useEffect(() => {
    const hasVisited = localStorage.getItem('portfolio_visited');
    if (!hasVisited) {
      setIsFirstTimeVisitor(true);
      localStorage.setItem('portfolio_visited', 'true');
    }
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);
    const isTablet = /ipad|tablet/.test(userAgent);
    if (isTablet) setDeviceType('tablet');
    else if (isMobile) setDeviceType('mobile');
    else setDeviceType('desktop');

    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e) => {
      setDeviceType(e.matches ? 'mobile' : 'desktop');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(`chat_messages_${sessionId}`);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      Object.values(streamTimersRef.current).forEach(t => clearInterval(t));
      streamTimersRef.current = {};
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakText = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ''));
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const aiModels = {
    general: {
      name: 'General Assistant',
      icon: <FaRobot />,
      color: '#6366f1',
      description: 'Portfolio & general questions'
    },
    code: {
      name: 'Code Expert',
      icon: <IoCodeSlash />,
      color: '#10b981',
      description: 'Programming & tech help'
    },
    creative: {
      name: 'Creative Writer',
      icon: <IoSparkles />,
      color: '#f59e0b',
      description: 'Writing & creativity'
    },
    analyst: {
      name: 'Data Analyst',
      icon: <IoCog />,
      color: '#ef4444',
      description: 'Data & insights'
    },
    translator: {
      name: 'Language Expert',
      icon: <IoLanguage />,
      color: '#8b5cf6',
      description: 'Translation & languages'
    }
  };

  const quickActions = [
    { text: 'Tell me about your projects', action: 'projects' },
    { text: 'What skills do you have?', action: 'skills' },
    { text: 'How can we collaborate?', action: 'collaborate' },
    { text: 'Tell me about your experience', action: 'experience' },
    { text: 'How can I contact you?', action: 'contact' }
  ];

  const followUpSuggestions = {
    personal: ['Your background', 'What technologies do you use', 'What are your hobbies'],
    projects: ['Show me web projects', 'Latest project details', 'Tech stack used'],
    skills: ['Frontend skills', 'Backend skills', 'DevOps tools'],
    collaborate: ['Freelance rates', 'Availability', 'Past collaborations'],
    experience: ['Education background', 'Certifications', 'Languages spoken'],
    education: ['Your training', 'Courses completed', 'Learning journey'],
    interests: ['What do you do for fun', 'Side projects', 'Tech interests'],
    contact: ['Email address', 'Social links', 'Location'],
    default: ['Tell me more', 'Show projects', 'Contact info']
  };

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
      `${getGreeting()}${userName ? ' ' + userName : ''}! Welcome to my portfolio. I'm here to help you explore my work and skills. What would you like to know about?`,
      `${getGreeting()}! Thanks for visiting. I can tell you about my projects, skills, or how we can work together. What interests you?`,
      `Hey${userName ? ' ' + userName : ''}! Great to have you here. Feel free to ask me anything about my portfolio or experience!`,
      `${getGreeting()}! I'm your AI guide to this portfolio. Ask me about projects, skills, technologies I use, or collaboration opportunities.`
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
      "I appreciate your curiosity! I've worked on many interesting projects and learned a lot along the way. What aspect would you like to dive into?"
    ],
    personal: [
      `Hey${userName ? ' ' + userName : ''}! I'm Dev Techs — a full-stack developer passionate about building modern web applications and solving real-world problems. Want to know about my skills, projects, or what I do for fun?`,
      `I'm Dev Techs, a developer who loves creating things for the web. I work with React, Node.js, Python, and various other technologies. Ask me about my journey, skills, or what inspires me!`,
      `My name is Dev Techs (Daniel Mukula for formal introductions). I've been building web applications and exploring new technologies. Feel free to ask about my experience, education, or interests — I'm an open book!`,
      `Dev Techs here! I'm a developer focused on full-stack web development with a love for clean code and great user experiences. I'm always learning and building. What would you like to know about me?`
    ],
    education: [
      "I've studied and trained in software development, focusing on modern web technologies. I believe in continuous learning and staying up to date with the latest tools and practices. Want to know about specific courses or certifications?",
      "My education journey has been a mix of formal study and hands-on projects. I'm always taking courses to sharpen my skills in areas like React, Node.js, and software architecture. Curious about any specific area?",
      "I'm passionate about learning and have completed training in full-stack development, algorithms, and system design. The tech world moves fast, so I make sure to keep learning. Ask me about what I'm currently studying!"
    ],
    interests: [
      "Outside of coding, I enjoy exploring new technologies, working on side projects, and diving into creative problem-solving. I'm also into tech communities, gaming, and staying active. What about you?",
      "When I'm not building software, I like to stay curious — reading about tech trends, experimenting with new frameworks, and working on fun side projects. I also enjoy connecting with other developers and sharing knowledge.",
      "My interests span coding, design, and technology in general. I love turning ideas into real products and learning how things work under the hood. Got a cool project idea? Let's talk about it!"
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
      "That's a great question! I'd be happy to help. You can ask me about my projects, skills, education, interests, or anything about my work. What interests you most?",
      "I may not have the full answer to that, but I can definitely share my experience and knowledge! Want to hear about my projects, my tech stack, or what I'm working on right now?",
      "Good question! While I focus on my portfolio and development work, I'm always open to chat. Ask me about my coding journey, favorite technologies, or how we could collaborate!",
      "I'm here to talk about my work, skills, and experience — but I'm also happy to discuss tech, development, or collaboration ideas. What's on your mind?"
    ]
  };

  const detectIntent = (message) => {
    const lower = message.toLowerCase();
    const categories = {
      greeting: /^(hi|hello|hey|greetings|sup|yo|howdy|good\s*(morning|afternoon|evening))/i,
      personal: /(your\s*name|who\s*are\s*you|tell\s*me\s*about\s*yourself|daniel|mukula|danie|devtechs|about\s*dev|dev\s*folio|your\s*age|how\s*old|where\s*(are\s*you|do\s*you\s*live)|location|based|from|your\s*story|introduce)/i,
      projects: /(project|portfolio|work|app|application|website|built|created|developed|showcase|demo)/i,
      skills: /(skill|technology|tech\b|stack|framework|language|tool|know|languages|proficient|expertise|competenc)/i,
      experience: /(experience|background|journey|career|years|worked\s*(as|at|on)|professional|history|bio|about\s*you)/i,
      education: /(education|study|studies|school|university|college|degree|certificate|course|learn|training)/i,
      interests: /(interest|hobby|hobbies|passion|fun|free\s*time|enjoy|like\s*to\s*do|leisure|music|game|sport|read|travel)/i,
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

  const generateResponse = (userMessage) => {
    const intent = detectIntent(userMessage);
    const responses = fallbackResponses[intent] || fallbackResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const streamText = (messageId, fullText) => {
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setStreamingText(prev => ({ ...prev, [messageId]: fullText.slice(0, index) }));
      if (index >= fullText.length) {
        clearInterval(timer);
        delete streamTimersRef.current[messageId];
        setTimeout(() => {
          setStreamingText(prev => {
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
        }, 200);
      }
    }, STREAMING_DELAY);
    streamTimersRef.current[messageId] = timer;
    return timer;
  };

  const getFollowUps = (intent) => {
    const options = followUpSuggestions[intent] || followUpSuggestions.default;
    return options.sort(() => Math.random() - 0.5).slice(0, 3);
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

    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);
    setSuggestions([]);

    try {
      const response = await apiService.request('/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: currentInput,
          aiType: selectedAI,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (response.success) {
        const safeText = sanitizeResponse(response.response || '');
        const intent = detectIntent(currentInput);
        const aiMessageId = Date.now() + 1;
        const aiMessage = {
          id: aiMessageId,
          text: safeText,
          sender: 'ai',
          model: response.model || selectedAI,
          timestamp: new Date(),
          tokens: response.tokens,
          intent
        };

        setMessages(prev => [...prev, aiMessage]);
        streamText(aiMessageId, safeText);
        setSuggestions(getFollowUps(intent));

        setTimeout(() => speakText(safeText), 300);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const fallbackResponse = generateResponse(currentInput);
      const intent = detectIntent(currentInput);
      const isConnectionIssue = error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('network');

      const aiMessageId = Date.now() + 1;
      const aiMessage = {
        id: aiMessageId,
        text: fallbackResponse,
        sender: 'ai',
        model: 'fallback',
        timestamp: new Date(),
        isError: isConnectionIssue,
        errorType: isConnectionIssue ? 'network' : 'general',
        intent
      };

      setMessages(prev => [...prev, aiMessage]);
      streamText(aiMessageId, fallbackResponse);
      setSuggestions(getFollowUps(intent));
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action.text);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  const parseMessageContent = (text) => {
    if (!text) return [{ type: 'text', content: '' }];
    const segments = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(...parseInlineCode(text.slice(lastIndex, match.index)));
      }
      segments.push({ type: 'code-block', lang: match[1] || 'text', content: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push(...parseInlineCode(text.slice(lastIndex)));
    }
    return segments;
  };

  const parseInlineCode = (text) => {
    const segments = [];
    const inlineRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'inline-code', content: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return segments;
  };

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderMessageContent = (text, messageCopiedId) => {
    const segments = parseMessageContent(text);
    return segments.map((seg, i) => {
      if (seg.type === 'code-block') {
        return (
          <div key={`cb-${i}`} className="code-block-wrapper">
            <div className="code-block-header">
              <span className="code-lang">{seg.lang}</span>
              <button className="code-copy-btn" onClick={() => copyText(seg.content)}>
                <IoCopy /> Copy
              </button>
            </div>
            <pre className="code-block-content"><code>{seg.content}</code></pre>
          </div>
        );
      }
      if (seg.type === 'inline-code') {
        return <code key={`ic-${i}`} className="inline-code">{seg.content}</code>;
      }
      return <span key={`t-${i}`}>{seg.content}</span>;
    });
  };

  const clearChat = useCallback(() => {
    Object.values(streamTimersRef.current).forEach(t => clearInterval(t));
    streamTimersRef.current = {};
    setMessages([]);
    setStreamingText({});
    setSuggestions([]);
    sessionStorage.removeItem(`chat_messages_${sessionId}`);
  }, [sessionId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const setName = (name) => {
    const trimmed = name.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('chat_user_name', trimmed);
      setShowNamePrompt(false);
    }
  };

  const handleClose = () => setIsOpen(false);

  if (!isOpen) {
    return (
      <div className="chatbot-fab-container">
        <button className="chatbot-fab" onClick={() => { setIsOpen(true); setIsMinimized(false); }} aria-label="Open AI Chat">
          <IoChatbubbleEllipses />
          <span className="fab-pulse"></span>
          <span className="fab-ring"></span>
        </button>
        <div className="fab-tooltip">Chat with me!</div>
      </div>
    );
  }

  return (
    <div className={`chatbot-overlay ${isFullscreen ? 'fullscreen' : ''}`} onClick={(e) => {
      if (e.target === e.currentTarget) setIsOpen(false);
    }}>
      <div className={`chatbot-container ${isMinimized ? 'minimized' : ''} ${deviceType}`}>
        <div className="chatbot-glass">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="ai-avatar">
                <FaRobot />
                <span className="ai-status online"></span>
              </div>
              <div className="header-info">
                <h3>AI Assistant</h3>
                <p className="header-model-name">{aiModels[selectedAI]?.name || 'AI Assistant'}</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className={`header-btn ${soundEnabled ? '' : 'muted'}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Mute' : 'Unmute'}
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <IoVolumeHigh /> : <IoVolumeMute />}
              </button>
              <button
                className="header-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? 'Minimize' : 'Fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <IoClose /> : <IoSparkles />}
              </button>
              {messages.length > 0 && (
                <button className="header-btn clear-btn" onClick={clearChat} aria-label="Clear chat" title="Clear conversation">
                  <IoTrashBin />
                </button>
              )}
              <button
                className="header-btn close-btn"
                onClick={handleClose}
                aria-label="Close"
                title="Close chatbot"
              >
                <IoClose />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="ai-model-selector">
                <div className="model-tabs">
                  {Object.entries(aiModels).map(([key, model]) => (
                    <button
                      key={key}
                      className={`model-tab ${selectedAI === key ? 'active' : ''}`}
                      onClick={() => setSelectedAI(key)}
                      style={{ '--accent-color': model.color }}
                      title={model.description}
                    >
                      <span className="model-icon">{model.icon}</span>
                      <span className="model-name">{model.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="chatbot-messages" id="chatbot-messages">
                {messages.length === 0 && !showNamePrompt && (
                  <div className="welcome-message">
                    <div className="welcome-content">
                      <div className="welcome-icon-wrapper">
                        <FaRobot />
                        <span className="welcome-ring"></span>
                      </div>
                      <h4>
                        {isFirstTimeVisitor
                          ? `${getGreeting()}! I'm your AI Portfolio Guide`
                          : `${getGreeting()}${userName ? ', ' + userName : ''}! I'm your AI Assistant`
                        }
                      </h4>
                      <p>
                        {isFirstTimeVisitor
                          ? deviceType === 'mobile'
                            ? "I'll guide you through my mobile-optimized portfolio! I can highlight responsive projects and mobile development expertise. What would you like to explore first?"
                            : deviceType === 'tablet'
                            ? "Welcome to my tablet-friendly portfolio! I can showcase touch-optimized interfaces and adaptive designs. How can I help you?"
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

                {showNamePrompt && (
                  <div className="name-prompt">
                    <FaRegLightbulb />
                    <p>What's your name?</p>
                    <div className="name-input-row">
                      <input
                        type="text"
                        placeholder="Enter your name..."
                        className="name-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setName(e.target.value);
                        }}
                      />
                      <button className="name-submit-btn" onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        setName(input.value);
                      }}>
                        <FaCheck />
                      </button>
                    </div>
                  </div>
                )}

                  {messages.map((message) => {
                  const displayText = streamingText[message.id] || message.text;
                  const isStreaming = !!streamingText[message.id];
                  return (
                    <div
                      key={message.id}
                      className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''} ${isStreaming ? 'streaming' : ''}`}
                    >
                      <div className="message-avatar">
                        {message.sender === 'user' ? <FaUser /> : message.isError ? <FaExclamationTriangle /> : aiModels[message.model]?.icon || <FaRobot />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">
                          {message.sender === 'user' ? displayText : renderMessageContent(displayText)}
                          {isStreaming && <span className="cursor-blink">|</span>}
                        </div>
                        <div className="message-footer">
                          <span className="message-time">
                            <FaRegClock size={10} />
                            {getRelativeTime(message.timestamp)}
                          </span>
                          {message.tokens && (
                            <span className="message-tokens">{message.tokens} tokens</span>
                          )}
                        </div>
                        {!isStreaming && message.sender === 'ai' && (
                          <div className="message-actions">
                            <button
                              className={`action-btn ${copiedId === message.id ? 'copied' : ''}`}
                              onClick={() => copyMessage(message.text, message.id)}
                              aria-label="Copy message"
                            >
                              {copiedId === message.id ? <FaCheck /> : <IoCopy />}
                            </button>
                            {!message.isError && (
                              <>
                                <button className="action-btn" aria-label="Like" onClick={() => speakText(message.text)}>
                                  <FaThumbsUp />
                                </button>
                                <button className="action-btn" aria-label="Dislike">
                                  <FaThumbsDown />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

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

                {suggestions.length > 0 && !isTyping && (
                  <div className="suggestion-chips">
                    <span className="suggestion-label">Follow-up:</span>
                    <div className="suggestion-list">
                      {suggestions.map((s, i) => (
                        <button key={i} className="suggestion-chip" onClick={() => handleSuggestionClick(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input">
                <div className="input-container">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about my portfolio..."
                    className="message-input"
                    rows={1}
                  />
                  <button
                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleVoiceInput}
                    aria-label={isListening ? 'Stop recording' : 'Voice input'}
                    title={isListening ? 'Stop recording' : 'Voice input'}
                  >
                    {isListening ? <IoMicOff /> : <IoMic />}
                  </button>
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
      </div>
    </div>
  );
};

export default AIChatbot;
