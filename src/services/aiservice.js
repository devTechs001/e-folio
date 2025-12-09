// src/services/aiservice.js
import ApiService from './api.service';

class AIServiceWrapper {
    constructor() {
        this.pricing = {
            'llama3-70b': { input: 0.00059, output: 0.00079 },  // $0.59 / $0.79 per 1M tokens
            'llama3-8b': { input: 0.00008, output: 0.00008 },   // $0.08 / $0.08 per 1M tokens
            'mixtral-8x7b': { input: 0.00024, output: 0.00024 }, // $0.24 / $0.24 per 1M tokens
            'gemma-7b': { input: 0.0001, output: 0.0001 },      // $0.10 / $0.10 per 1M tokens
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'claude-3': { input: 0.015, output: 0.075 },
            'claude-2': { input: 0.008, output: 0.024 }
        };
    }

    /**
     * Get available models
     */
    getAvailableModels(provider = null) {
        const allModels = [
            // Groq Models (fast inference)
            { id: 'llama3-70b', name: 'Llama 3 70B', provider: 'groq', description: 'Most capable model for complex tasks', maxTokens: 8192, speed: 'fast' },
            { id: 'llama3-8b', name: 'Llama 3 8B', provider: 'groq', description: 'Great balance of speed and capability', maxTokens: 8192, speed: 'very-fast' },
            { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'groq', description: 'Strong performance for reasoning', maxTokens: 4096, speed: 'fast' },
            { id: 'gemma-7b', name: 'Gemma 7B', provider: 'google', description: 'Open model by Google', maxTokens: 8192, speed: 'fast' },
            // OpenAI Models
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Most capable model with latest features', maxTokens: 128000, speed: 'medium' },
            { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Previous generation most capable model', maxTokens: 8192, speed: 'slow' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and capable of complex tasks', maxTokens: 16385, speed: 'fast' },
            // Anthropic Models
            { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful model', maxTokens: 200000, speed: 'medium' },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', description: 'Ideal balance of intelligence and speed', maxTokens: 200000, speed: 'fast' },
            { id: 'claude-2', name: 'Claude 2', provider: 'anthropic', description: 'Previous generation model', maxTokens: 100000, speed: 'medium' }
        ];

        if (!provider) return allModels;
        return allModels.filter(model => model.provider === provider);
    }

    /**
     * Calculate cost based on token usage
     */
    calculateCost(model, inputTokens, outputTokens) {
        const prices = this.pricing[model];
        if (!prices) return 0;

        const inputCost = (inputTokens / 1000000) * prices.input;  // Per 1M tokens
        const outputCost = (outputTokens / 1000000) * prices.output;  // Per 1M tokens

        return inputCost + outputCost;
    }

    /**
     * Get model info by ID
     */
    getModelInfo(modelId) {
        return this.getAvailableModels().find(model => model.id === modelId);
    }

    /**
     * Send message to AI model via backend API
     */
    async sendMessage(options) {
        try {
            const response = await ApiService.request('/ai/chat', {
                method: 'POST',
                body: JSON.stringify(options)
            });

            // Calculate cost if tokens are present
            if (response.data && response.data.usage) {
                const { prompt_tokens: inputTokens = 0, completion_tokens: outputTokens = 0 } = response.data.usage;
                response.data.cost = this.calculateCost(options.model, inputTokens, outputTokens);
            }

            return response.data;
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }

    /**
     * Stream message to AI model via backend API
     */
    async streamMessage(options) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.body;
        } catch (error) {
            console.error('AI Streaming error:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings for semantic search
     */
    async generateEmbeddings(text) {
        try {
            const response = await ApiService.request('/ai/embeddings', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            return response.embedding;
        } catch (error) {
            console.error('Embeddings error:', error);
            throw error;
        }
    }

    /**
     * Moderate content
     */
    async moderateContent(text) {
        try {
            const response = await ApiService.request('/ai/moderate', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            return response.data;
        } catch (error) {
            console.error('Moderation error:', error);
            return { flagged: false };
        }
    }

    /**
     * Generate image using DALL-E or other providers
     */
    async generateImage(prompt, options = {}) {
        try {
            const response = await ApiService.request('/ai/images/generate', {
                method: 'POST',
                body: JSON.stringify({ prompt, ...options })
            });
            return response.data;
        } catch (error) {
            console.error('Image generation error:', error);
            throw error;
        }
    }

    /**
     * Transcribe audio using Whisper API
     */
    async transcribeAudio(audioBlob, options = {}) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            
            const response = await ApiService.request('/ai/transcribe', {
                method: 'POST',
                body: formData
            });
            
            return response.data;
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    /**
     * List available voices
     */
    async listVoices() {
        try {
            const response = await ApiService.request('/ai/voices');
            return response.data.voices;
        } catch (error) {
            console.error('Voice listing error:', error);
            return [];
        }
    }

    /**
     * Synthesize speech
     */
    async synthesizeSpeech(text, options = {}) {
        try {
            const response = await ApiService.request('/ai/speech', {
                method: 'POST',
                body: JSON.stringify({ text, ...options })
            });
            return response.audioUrl;
        } catch (error) {
            console.error('Speech synthesis error:', error);
            throw error;
        }
    }

    /**
     * Get usage statistics
     */
    async getUsageStats() {
        try {
            const response = await ApiService.request('/ai/usage-stats');
            return response.data;
        } catch (error) {
            console.error('Usage stats error:', error);
            return {};
        }
    }

    /**
     * Get models with capabilities
     */
    getModelsCapabilities() {
        return {
            textGeneration: ['llama3-70b', 'llama3-8b', 'mixtral-8x7b', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
            vision: ['gpt-4-vision', 'gpt-4-turbo'],
            audio: ['whisper', 'tts-1', 'tts-1-hd'],
            embeddings: ['text-embedding-ada-002', 'llama3-70b-embed'],
            moderation: ['moderation-latest'],
            codeGeneration: ['gpt-4', 'gpt-3.5-turbo'],
            reasoning: ['llama3-70b', 'claude-3-opus', 'gpt-4-turbo']
        };
    }
}

export default new AIServiceWrapper();