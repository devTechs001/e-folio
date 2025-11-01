// services/AIService.js
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { Readable } = require('stream');

class AIService {
    constructor() {
        // Initialize OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Initialize Anthropic
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        // Token pricing (per 1K tokens)
        this.pricing = {
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'claude-3': { input: 0.015, output: 0.075 },
            'claude-2': { input: 0.008, output: 0.024 }
        };
    }

    /**
     * Send message to AI and get response
     */
    async sendMessage(options) {
        const {
            model = 'gpt-3.5-turbo',
            messages = [],
            temperature = 0.7,
            maxTokens = 2000,
            stream = false,
            systemPrompt
        } = options;

        const startTime = Date.now();

        try {
            if (model.startsWith('gpt')) {
                return await this.sendToOpenAI({
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
     * Calculate cost based on token usage
     */
    calculateCost(model, inputTokens, outputTokens) {
        const prices = this.pricing[model];
        if (!prices) return 0;

        const inputCost = (inputTokens / 1000) * prices.input;
        const outputCost = (outputTokens / 1000) * prices.output;

        return inputCost + outputCost;
    }

    /**
     * Generate embeddings for semantic search
     */
    async generateEmbeddings(text) {
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