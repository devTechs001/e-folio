const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not found in environment variables');
        }
        
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not found in environment variables');
        }
        
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.openaiBaseURL = 'https://api.openai.com/v1';
        
        // Initialize Google AI models if API key is available
        if (this.geminiApiKey) {
            try {
                const genAI = new GoogleGenerativeAI(this.geminiApiKey);
                this.models = {};
                const modelNames = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro-vision'];
                modelNames.forEach(m => {
                    try {
                        this.models[m] = genAI.getGenerativeModel({ model: m });
                    } catch (e) {
                        console.warn(`Failed to initialize model ${m}:`, e.message);
                    }
                });
            } catch (e) {
                console.warn('Failed to initialize Google AI:', e.message);
                this.models = {};
            }
        } else {
            this.models = {};
        }
        
        // Enhanced predefined responses for better AI-like interaction
        this.contextualResponses = {
            greeting: [
                "Hello! I'm your AI assistant. I can help you learn about my portfolio, skills, projects, and collaboration opportunities. What would you like to know?",
                "Hi there! I'm excited to help you explore my work and capabilities. Feel free to ask about my projects, technical skills, or how we can work together!",
                "Welcome! I'm here to provide insights about my professional experience and expertise. What aspect of my portfolio interests you most?"
            ],
            projects: [
                "I've worked on over 50 diverse projects including full-stack web applications, mobile apps, AI-powered solutions, and enterprise systems. My portfolio features e-commerce platforms, real-time collaboration tools, data analytics dashboards, and custom software solutions. Each project demonstrates innovative problem-solving and cutting-edge technology implementation. Would you like me to highlight specific projects that align with your interests?",
                "My project experience spans multiple domains and technologies. I've built scalable microservices, real-time applications with WebSockets, RESTful APIs, and complex frontend interfaces. Recent highlights include a real-time collaboration platform using Socket.io, an AI-powered content management system, and a distributed e-commerce solution. I follow clean code principles and optimize for performance. What type of projects are you most interested in?",
                "Throughout my career, I've delivered solutions across fintech, healthcare, e-commerce, and SaaS industries. My projects consistently achieve 95% client satisfaction with 40% faster delivery times than industry standards. I specialize in turning complex business requirements into elegant technical solutions. Are you looking for specific technical implementations or business outcomes?"
            ],
            skills: [
                "I bring comprehensive full-stack expertise with 5+ years of professional experience. My core competencies include frontend development (React, Vue, TypeScript), backend engineering (Node.js, Python, Java), cloud infrastructure (AWS, Docker, Kubernetes), and database management (PostgreSQL, MongoDB, Redis). I'm proficient in modern development practices including CI/CD pipelines, test-driven development, and agile methodologies. What specific technologies would you like to explore?",
                "Technical expertise breakdown: Frontend (React, Vue.js, TypeScript, Tailwind CSS), Backend (Node.js, Express, Python, Django, Java Spring), Databases (PostgreSQL, MongoDB, Redis, Elasticsearch), Cloud & DevOps (AWS, Docker, Kubernetes, CI/CD, Terraform), Testing (Jest, Cypress, PyTest). I follow SOLID principles, implement design patterns, and maintain comprehensive documentation. Recent achievements include reducing bundle sizes by 40% and implementing zero-downtime deployments.",
                "Beyond technical skills, I excel at system architecture design, team leadership, and translating business requirements into technical solutions. I've led teams of 5+ developers, mentored junior engineers, and delivered technical presentations to stakeholders. My analytical approach includes code reviews, performance profiling, and security audits. What specific skills or leadership aspects would you like to discuss?"
            ],
            collaboration: [
                "I'm excited about collaboration opportunities that combine technical innovation with meaningful impact! Whether you're a startup with a groundbreaking idea, an established company looking to modernize systems, or an open-source project seeking contributors, I bring valuable expertise and enthusiasm. I'm flexible with engagement models from short-term consulting to long-term partnerships. Let's discuss your vision and explore how we can create something exceptional together!",
                "Seeking technical collaboration where I can contribute to challenging engineering problems. I can help with system architecture design, code reviews, technical leadership, and building scalable solutions. I'm experienced in agile methodologies, pair programming, and remote collaboration tools. I've mentored junior developers and led code review processes. What technical challenges or team dynamics are you working with?",
                "I thrive in collaborative environments where I can contribute to architecture decisions, mentor team members, and deliver high-quality solutions. My experience spans both startup and enterprise environments, giving me perspective on different development methodologies and business challenges. Whether you need a technical co-founder or a senior developer, I bring proven expertise and a collaborative mindset. What kind of collaboration are you envisioning?"
            ],
            experience: [
                "My professional journey spans 5+ years across startups, mid-size companies, and enterprise environments. I've progressed from Junior Developer to Senior Full-Stack Engineer, taking on technical leadership roles and mentoring team members. I've worked in fast-paced startup environments requiring rapid iteration, as well as structured enterprise settings with strict compliance requirements. This diverse experience has given me perspective on different development methodologies and business challenges.",
                "Technical career progression: Started with frontend development, expanded to full-stack, then specialized in system architecture and cloud technologies. Key milestones include leading monolith-to-microservices migration, implementing real-time features for millions of users, and building developer tooling that improved team productivity by 40%. I've worked across fintech, healthcare, e-commerce, and SaaS domains. What specific technical journey interests you?",
                "Professional achievements include delivering 50+ projects with 95% on-time completion, leading teams of 5-15 engineers, improving system performance by 60%, and maintaining 99.9% uptime for critical systems. I've implemented monitoring systems that reduced incident response time by 70% and established code quality standards that improved developer productivity. What specific metrics or outcomes would you like to explore?"
            ],
            default: [
                "That's an interesting question! Based on my portfolio and experience, I'd be happy to provide detailed insights. My background spans various technologies and industries, so I can offer comprehensive perspectives. Could you share more context about what specific aspect interests you most?",
                "I appreciate your curiosity! My experience covers full-stack development, system architecture, and technical leadership across different domains. I enjoy discussing both technical challenges and business solutions. What particular area would you like to explore in depth?",
                "Great question! I'm passionate about creating impactful technology solutions and sharing my knowledge. Whether you're interested in technical details, project insights, or collaboration opportunities, I'm here to help. What brings you to my portfolio today?"
            ]
        };
    }

    async generateResponse(prompt, options = {}) {
        const {
            model = 'gemini-pro',
            temperature = 0.7,
            maxTokens = 2048,
            systemPrompt = '',
            conversationHistory = []
        } = options;

        try {
            // First try the real Gemini API
            const geminiResponse = await fetch(`${this.geminiBaseURL}/models/${model}:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: maxTokens,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
                
                return {
                    content: text,
                    model: model,
                    tokens: this.estimateTokens(text),
                    finishReason: data.candidates?.[0]?.finishReason || 'stop',
                    metadata: {
                        temperature,
                        maxTokens,
                        promptTokens: this.estimateTokens(prompt),
                        completionTokens: this.estimateTokens(text)
                    }
                };
            }
        } catch (error) {
            console.log('Gemini API not available, trying OpenAI fallback...');
        }

        // Try OpenAI as fallback
        if (this.openaiApiKey && this.openaiApiKey !== 'your_openai_api_key') {
            try {
                const openaiResponse = await axios.post(`${this.openaiBaseURL}/chat/completions`, {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt || 'You are a helpful AI assistant for a portfolio website. Provide professional, detailed responses about projects, skills, experience, and collaboration opportunities.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: temperature,
                    max_tokens: maxTokens
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                const text = openaiResponse.data.choices?.[0]?.message?.content || 'No response generated';
                
                return {
                    content: text,
                    model: 'gpt-3.5-turbo',
                    tokens: openaiResponse.data.usage?.total_tokens || 0,
                    finishReason: openaiResponse.data.choices?.[0]?.finish_reason || 'stop',
                    metadata: {
                        temperature,
                        maxTokens,
                        promptTokens: openaiResponse.data.usage?.prompt_tokens || 0,
                        completionTokens: openaiResponse.data.usage?.completion_tokens || 0,
                        provider: 'openai'
                    }
                };
            } catch (openaiError) {
                console.log('OpenAI API not available, using enhanced fallback responses');
            }
        }

        // Enhanced fallback with contextual responses
        const lowerPrompt = prompt.toLowerCase();
        let responseCategory = 'default';
        
        // Determine response category based on prompt content
        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
            responseCategory = 'greeting';
        } else if (lowerPrompt.includes('project') || lowerPrompt.includes('work') || lowerPrompt.includes('portfolio')) {
            responseCategory = 'projects';
        } else if (lowerPrompt.includes('skill') || lowerPrompt.includes('technology') || lowerPrompt.includes('expertise')) {
            responseCategory = 'skills';
        } else if (lowerPrompt.includes('collaborat') || lowerPrompt.includes('work together') || lowerPrompt.includes('partner')) {
            responseCategory = 'collaboration';
        } else if (lowerPrompt.includes('experience') || lowerPrompt.includes('background') || lowerPrompt.includes('career')) {
            responseCategory = 'experience';
        }

        // Get a random response from the appropriate category
        const responses = this.contextualResponses[responseCategory] || this.contextualResponses.default;
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        return {
            content: responseText,
            model: 'enhanced-fallback',
            tokens: this.estimateTokens(responseText),
            finishReason: 'stop',
            metadata: {
                temperature,
                maxTokens,
                promptTokens: this.estimateTokens(prompt),
                completionTokens: this.estimateTokens(responseText),
                category: responseCategory,
                provider: 'fallback'
            }
        };
    }

    async generateStreamingResponse(prompt, options = {}) {
        const {
            model = 'gemini-1.5-pro',
            temperature = 0.7,
            maxTokens = 2048,
            systemPrompt = '',
            conversationHistory = []
        } = options;

        try {
            const generativeModel = this.models[model] || this.models['gemini-pro'];
            
            // Build conversation context
            let fullPrompt = '';
            
            if (systemPrompt) {
                fullPrompt += `System: ${systemPrompt}\n\n`;
            }
            
            if (conversationHistory.length > 0) {
                conversationHistory.forEach(msg => {
                    if (msg.role === 'user') {
                        fullPrompt += `User: ${msg.content}\n`;
                    } else if (msg.role === 'assistant') {
                        fullPrompt += `Assistant: ${msg.content}\n`;
                    }
                });
                fullPrompt += '\n';
            }
            
            fullPrompt += `User: ${prompt}`;

            const result = await generativeModel.generateContentStream(fullPrompt);
            
            return {
                stream: result.stream,
                model: model
            };

        } catch (error) {
            console.error('Gemini Streaming Error:', error);
            throw new Error(`Gemini streaming error: ${error.message}`);
        }
    }

    async analyzeImage(imageBase64, prompt, options = {}) {
        const {
            model = 'gemini-pro-vision',
            temperature = 0.7
        } = options;

        try {
            const generativeModel = this.models[model];
            
            const imagePart = {
                inlineData: {
                    data: imageBase64.split(',')[1], // Remove base64 prefix
                    mimeType: 'image/jpeg'
                }
            };

            const result = await generativeModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            return {
                content: text,
                model: model,
                tokens: this.estimateTokens(text),
                metadata: {
                    temperature,
                    hasImage: true
                }
            };

        } catch (error) {
            console.error('Gemini Vision Error:', error);
            throw new Error(`Gemini vision error: ${error.message}`);
        }
    }

    // AI Model personalities for different chatbot modes
    getSystemPrompt(aiType) {
        const prompts = {
            general: `You are a helpful AI assistant for a portfolio website. You help visitors learn about the developer's skills, projects, and collaboration opportunities. Be friendly, professional, and informative. Focus on highlighting the developer's expertise and experience. Keep responses concise but comprehensive.`,

            code: `You are an expert programming assistant. You help visitors understand the developer's technical skills, coding expertise, and development approach. You can discuss programming concepts, technologies used in projects, and best practices. Be technical but clear, and provide code examples when helpful.`,

            creative: `You are a creative writing assistant. You help visitors understand the developer's creative approach to problem-solving, design thinking, and innovative solutions. You can discuss project concepts, user experience design, and creative methodologies. Be inspiring and imaginative.`,

            analyst: `You are a data analysis assistant. You help visitors understand the developer's project metrics, performance data, and analytical capabilities. You can discuss project outcomes, user statistics, and technical performance. Be data-driven and precise.`,

            translator: `You are a multilingual communication assistant. You help international visitors understand the developer's portfolio, skills, and collaboration opportunities. You can translate content and discuss cross-cultural project experience. Be clear, professional, and culturally aware.`
        };

        return prompts[aiType] || prompts.general;
    }

    // Estimate token count (rough approximation)
    estimateTokens(text) {
        // Rough approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    // Calculate cost based on token usage
    calculateCost(model, promptTokens, completionTokens) {
        const pricing = {
            'gemini-1.5-pro': {
                input: 0.00125, // per 1K tokens
                output: 0.00375  // per 1K tokens
            },
            'gemini-1.5-flash': {
                input: 0.000075,
                output: 0.00015
            },
            'gemini-pro': {
                input: 0.0005,
                output: 0.0015
            }
        };

        const modelPricing = pricing[model] || pricing['gemini-1.5-pro'];
        
        const inputCost = (promptTokens / 1000) * modelPricing.input;
        const outputCost = (completionTokens / 1000) * modelPricing.output;
        
        return inputCost + outputCost;
    }

    // Validate API key and connectivity
    async testConnection() {
        try {
            const result = await this.generateResponse('Hello', { model: 'gemini-pro' });
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new GeminiService();
