// services/AIService.js
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { Readable } = require('stream');

class AIService {
    constructor() {
        // Initialize OpenAI only if API key is provided
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        } else {
            console.warn('OpenAI API key not provided. AI features will be limited.');
        }

        // Initialize Anthropic only if API key is provided
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
        } else {
            console.warn('Anthropic API key not provided. Claude features will be limited.');
        }

        // Initialize Groq only if API key is provided
        if (process.env.GROQ_API_KEY) {
            this.groq = require('groq-sdk');
            this.groq_client = new this.groq({
                apiKey: process.env.GROQ_API_KEY
            });
        } else {
            console.warn('Groq API key not provided. Groq features will be limited.');
        }

        // Initialize Google Generative AI only if API key is provided
        if (process.env.GOOGLE_API_KEY) {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            this.google_ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        } else {
            console.warn('Google API key not provided. Gemini features will be limited.');
        }

        // Token pricing (per 1K tokens) - Setting defaults with free/low-cost models prioritized
        this.pricing = {
            // Free/Low-cost alternatives
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },   // Often available through free tier
            'llama3-8b': { input: 0.00008, output: 0.00008 },     // Very low cost
            'gemma-7b': { input: 0.0001, output: 0.0001 },       // Low cost
            'mistral-7b': { input: 0.0001, output: 0.0001 },     // Low cost
            
            // Paid models
            'gpt-4': { input: 0.03, output: 0.06 },
            'gemini-pro': { input: 0.0005, output: 0.0015 },     // $0.50 / $1.50 per 1M tokens
            'gemini-1.5-pro': { input: 0.0005, output: 0.0015 }, // $0.50 / $1.50 per 1M tokens
            'llama3-70b': { input: 0.00059, output: 0.00079 },  // $0.59 / $0.79 per 1M tokens
            'mixtral-8x7b': { input: 0.00024, output: 0.00024 }, // $0.24 / $0.24 per 1M tokens
            'claude-3': { input: 0.015, output: 0.075 },
            'claude-2': { input: 0.008, output: 0.024 }
        };
    }

    /**
     * Send message to AI and get response
     */
    async sendMessage(options) {
        const {
            model = 'llama3-8b',
            messages = [],
            temperature = 0.7,
            maxTokens = 2000,
            stream = false,
            systemPrompt
        } = options;

        const startTime = Date.now();

        try {
            if (model.startsWith('gpt')) {
                // Default to GPT-3.5-turbo which is often available through free tier
                return await this.sendToOpenAI({
                    model,
                    messages,
                    temperature,
                    maxTokens,
                    stream,
                    systemPrompt,
                    startTime
                });
            } else if (model.includes('gemini')) {
                return await this.sendToGoogle({
                    model,
                    messages,
                    temperature,
                    maxTokens,
                    stream,
                    systemPrompt,
                    startTime
                });
            } else if (model.includes('llama') || model.includes('mixtral') || model.includes('gemma')) {
                return await this.sendToGroq({
                    model,
                    messages,
                    temperature,
                    maxTokens,
                    stream,
                    systemPrompt,
                    startTime
                });
            } else if (model.startsWith('claude')) {
                return await this.sendToClaude({
                    model,
                    messages,
                    temperature,
                    maxTokens,
                    stream,
                    systemPrompt,
                    startTime
                });
            } else {
                throw new Error(`Unsupported model: ${model}`);
            }
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }

    /**
     * Send to OpenAI
     */
    async sendToOpenAI(options) {
        const {
            model,
            messages,
            temperature,
            maxTokens,
            stream,
            systemPrompt,
            startTime
        } = options;

        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }

        // Prepare messages
        const formattedMessages = [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(m => ({
                role: m.role === 'ai' ? 'assistant' : m.role,
                content: m.content
            }))
        ];

        if (stream) {
            return this.streamOpenAI({
                model,
                messages: formattedMessages,
                temperature,
                maxTokens
            });
        }

        const completion = await this.openai.chat.completions.create({
            model,
            messages: formattedMessages,
            temperature,
            max_tokens: maxTokens,
            stream: false
        });

        const responseTime = Date.now() - startTime;
        const usage = completion.usage;
        const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

        return {
            content: completion.choices[0].message.content,
            model: completion.model,
            tokens: {
                prompt: usage.prompt_tokens,
                completion: usage.completion_tokens,
                total: usage.total_tokens
            },
            cost,
            responseTime,
            finishReason: completion.choices[0].finish_reason
        };
    }

    /**
     * Stream OpenAI response
     */
    async streamOpenAI(options) {
        const { model, messages, temperature, maxTokens } = options;

        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }

        const stream = await this.openai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        });

        // Convert to readable stream
        const readable = new Readable({
            async read() {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            this.push(`data: ${JSON.stringify({ 
                                content, 
                                done: false 
                            })}\n\n`);
                        }

                        if (chunk.choices[0]?.finish_reason) {
                            this.push('data: [DONE]\n\n');
                            this.push(null);
                        }
                    }
                } catch (error) {
                    this.destroy(error);
                }
            }
        });

        return readable;
    }

    /**
     * Send to Claude (Anthropic)
     */
    async sendToClaude(options) {
        const {
            model,
            messages,
            temperature,
            maxTokens,
            stream,
            systemPrompt,
            startTime
        } = options;

        // Format messages for Claude
        const formattedMessages = messages.map(m => ({
            role: m.role === 'ai' ? 'assistant' : m.role,
            content: m.content
        }));

        const claudeModel = model === 'claude-3' 
            ? 'claude-3-opus-20240229'
            : 'claude-2.1';

        if (stream) {
            return this.streamClaude({
                model: claudeModel,
                messages: formattedMessages,
                temperature,
                maxTokens,
                systemPrompt
            });
        }

        const completion = await this.anthropic.messages.create({
            model: claudeModel,
            messages: formattedMessages,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt
        });

        const responseTime = Date.now() - startTime;
        const usage = completion.usage;
        const cost = this.calculateCost(model, usage.input_tokens, usage.output_tokens);

        return {
            content: completion.content[0].text,
            model: claudeModel,
            tokens: {
                prompt: usage.input_tokens,
                completion: usage.output_tokens,
                total: usage.input_tokens + usage.output_tokens
            },
            cost,
            responseTime,
            finishReason: completion.stop_reason
        };
    }

    /**
     * Stream Claude response
     */
    async streamClaude(options) {
        const { model, messages, temperature, maxTokens, systemPrompt } = options;

        const stream = await this.anthropic.messages.stream({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt
        });

        const readable = new Readable({
            async read() {
                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_delta') {
                            const content = chunk.delta.text || '';
                            this.push(`data: ${JSON.stringify({ 
                                content, 
                                done: false 
                            })}\n\n`);
                        }

                        if (chunk.type === 'message_stop') {
                            this.push('data: [DONE]\n\n');
                            this.push(null);
                        }
                    }
                } catch (error) {
                    this.destroy(error);
                }
            }
        });

        return readable;
    }

    /**
     * Send to Groq
     */
    async sendToGroq(options) {
        const {
            model,
            messages,
            temperature,
            maxTokens,
            stream,
            systemPrompt,
            startTime
        } = options;

        if (!this.groq_client) {
            throw new Error('Groq API key not configured. Please set GROQ_API_KEY environment variable.');
        }

        // Prepare messages
        const formattedMessages = [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(m => ({
                role: m.role === 'ai' ? 'assistant' : m.role,
                content: m.content
            }))
        ];

        if (stream) {
            return this.streamGroq({
                model,
                messages: formattedMessages,
                temperature,
                maxTokens
            });
        }

        const completion = await this.groq_client.chat.completions.create({
            model,
            messages: formattedMessages,
            temperature,
            max_tokens: maxTokens,
            stream: false
        });

        const responseTime = Date.now() - startTime;
        const usage = completion.usage;
        const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

        return {
            content: completion.choices[0].message.content,
            model: completion.model,
            tokens: {
                prompt: usage.prompt_tokens,
                completion: usage.completion_tokens,
                total: usage.total_tokens
            },
            cost,
            responseTime,
            finishReason: completion.choices[0].finish_reason
        };
    }

    /**
     * Stream Groq response
     */
    async streamGroq(options) {
        const { model, messages, temperature, maxTokens } = options;

        if (!this.groq_client) {
            throw new Error('Groq API key not configured. Please set GROQ_API_KEY environment variable.');
        }

        const stream = await this.groq_client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        });

        // Convert to readable stream
        const readable = new Readable({
            async read() {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            this.push(`data: ${JSON.stringify({ 
                                content, 
                                done: false 
                            })}\n\n`);
                        }

                        if (chunk.choices[0]?.finish_reason) {
                            this.push('data: [DONE]\n\n');
                            this.push(null);
                        }
                    }
                } catch (error) {
                    this.destroy(error);
                }
            }
        });

        return readable;
    }

    /**
     * Send to Google Gemini
     */
    async sendToGoogle(options) {
        const {
            model,
            messages,
            temperature,
            maxTokens,
            stream,
            systemPrompt,
            startTime
        } = options;

        if (!this.google_ai) {
            throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable.');
        }

        try {
            const genModel = this.google_ai.getGenerativeModel({ model });

            // Prepare content for Gemini
            const contents = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            if (systemPrompt) {
                // Add system message at the beginning
                contents.unshift({
                    role: 'user',
                    parts: [{ text: `System instruction: ${systemPrompt}` }]
                });
            }

            const generationConfig = {
                temperature: temperature,
                maxOutputTokens: maxTokens,
            };

            if (stream) {
                return this.streamGoogle({
                    genModel,
                    contents,
                    generationConfig
                });
            }

            const result = await genModel.generateContent({
                contents,
                generationConfig
            });

            const response = await result.response;
            const responseTime = Date.now() - startTime;
            
            // Note: Google AI SDK doesn't always return exact token counts
            const textResponse = response.text();
            const promptTokens = messages.reduce((acc, msg) => acc + msg.content.split(' ').length, 0);
            const completionTokens = textResponse.split(' ').length;
            const cost = this.calculateCost(model, promptTokens, completionTokens);

            return {
                content: textResponse,
                model: model,
                tokens: {
                    prompt: promptTokens,
                    completion: completionTokens,
                    total: promptTokens + completionTokens
                },
                cost,
                responseTime,
                finishReason: 'stop'
            };
        } catch (error) {
            console.error('Google AI Service error:', error);
            throw error;
        }
    }

    /**
     * Calculate cost based on token usage
     */
    calculateCost(model, inputTokens, outputTokens) {
        const prices = this.pricing[model];
        if (!prices) return 0;

        // Convert from 1K tokens to 1M tokens (standard pricing model)
        const divisor = 1000000; // Per 1M tokens
        const inputCost = (inputTokens / divisor) * prices.input;
        const outputCost = (outputTokens / divisor) * prices.output;

        return inputCost + outputCost;
    }

    /**
     * Generate embeddings for semantic search
     */
    async generateEmbeddings(text) {
        if (!this.openai) {
            // If OpenAI is not configured, return mock embeddings
            return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        }
        
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Embeddings error:', error);
            // Return mock embeddings if fail
            return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        }
    }

    /**
     * Moderate content
     */
    async moderateContent(text) {
        if (!this.openai) {
            // If OpenAI is not configured, return safe default
            return { 
                flagged: false, 
                categories: {}, 
                scores: {},
                success: true
            };
        }
        
        try {
            const response = await this.openai.moderations.create({
                input: text
            });

            const result = response.results[0];
            return {
                flagged: result.flagged,
                categories: result.categories,
                scores: result.category_scores,
                success: true
            };
        } catch (error) {
            console.error('Moderation error:', error);
            // Return safe default if moderation fails
            return { 
                flagged: false, 
                categories: {}, 
                scores: {},
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate image using DALL-E or compatible service
     */
    async generateImage(prompt, options = {}) {
        if (!this.openai) {
            // If OpenAI is not configured, return a mock image response
            return {
                url: `https://placehold.co/600x400?text=${encodeURIComponent(prompt.substring(0, 50))}`,
                revised_prompt: prompt,
                success: true
            };
        }
        
        try {
            const response = await this.openai.images.generate({
                model: options.model || 'dall-e-3',
                prompt: prompt,
                n: options.n || 1,
                size: options.size || '1024x1024',
                quality: options.quality || 'standard',
                style: options.style || 'vivid'
            });

            return {
                url: response.data[0].url,
                revised_prompt: response.data[0].revised_prompt || prompt,
                success: true
            };
        } catch (error) {
            console.error('Image generation error:', error);
            // Return a placeholder image if generation fails
            return {
                url: `https://placehold.co/600x400?text=${encodeURIComponent(prompt.substring(0, 50))}`,
                revised_prompt: prompt,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Transcribe audio using Whisper API
     */
    async transcribeAudio(audioBlob, options = {}) {
        if (!this.openai) {
            // If OpenAI is not configured, return a mock transcription
            return {
                text: "This is a simulated transcription due to missing API configuration.",
                language: "en",
                duration: 0,
                success: true
            };
        }

        try {
            const response = await this.openai.audio.transcriptions.create({
                file: audioBlob,
                model: options.model || "whisper-1",
                response_format: options.format || "json",
                language: options.language || "en",
                temperature: options.temperature || 0
            });

            return {
                text: response.text,
                language: response.language || "en",
                duration: 0, // Actual duration would need to be calculated
                success: true
            };
        } catch (error) {
            console.error('Transcription error:', error);
            // Return a fallback transcription if transcription fails
            return {
                text: "Transcription failed due to an error.",
                language: "en",
                duration: 0,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate embeddings for semantic search
     */
    async generateEmbeddings(text) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }
        
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Embeddings error:', error);
            throw error;
        }
    }

    /**
     * Analyze image with vision model
     */
    async analyzeImage(imageUrl, prompt = 'What is in this image?') {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }
        
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Image analysis error:', error);
            throw error;
        }
    }

    /**
     * Generate code completion
     */
    async generateCode(prompt, language = 'javascript') {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }
        
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert ${language} programmer. Generate clean, efficient, and well-documented code.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Code generation error:', error);
            throw error;
        }
    }

    /**
     * Moderate content
     */
    async moderateContent(text) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }
        
        try {
            const response = await this.openai.moderations.create({
                input: text
            });

            const result = response.results[0];
            return {
                flagged: result.flagged,
                categories: result.categories,
                scores: result.category_scores
            };
        } catch (error) {
            console.error('Moderation error:', error);
            return { flagged: false };
        }
    }
}

module.exports = new AIService();