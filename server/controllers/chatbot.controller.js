const GeminiService = require('../services/gemini.service');
const asyncHandler = require('express-async-handler');

// @desc    Chat with AI bot
// @route   POST /api/chatbot/chat
// @access  Public
exports.chatWithBot = asyncHandler(async (req, res) => {
    const { message, aiType = 'general', conversationHistory = [] } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    try {
        const systemPrompt = GeminiService.getSystemPrompt(aiType);
        
        const response = await GeminiService.generateResponse(message, {
            systemPrompt,
            conversationHistory,
            temperature: 0.7,
            maxTokens: 1000
        });

        res.json({
            success: true,
            response: response.content,
            model: response.model,
            tokens: response.tokens,
            metadata: response.metadata
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500);
        throw new Error('Failed to generate response');
    }
});

// @desc    Stream chat response
// @route   POST /api/chatbot/stream
// @access  Public
exports.streamChat = asyncHandler(async (req, res) => {
    const { message, aiType = 'general', conversationHistory = [] } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    try {
        const systemPrompt = GeminiService.getSystemPrompt(aiType);
        
        const { stream, model } = await GeminiService.generateStreamingResponse(message, {
            systemPrompt,
            conversationHistory,
            temperature: 0.7,
            maxTokens: 1000
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        for await (const chunk of stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                res.write(`data: ${JSON.stringify({
                    type: 'content',
                    content: chunkText,
                    model: model
                })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Stream chat error:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
        })}\n\n`);
        res.end();
    }
});

// @desc    Test chatbot connection
// @route   GET /api/chatbot/test
// @access  Private
exports.testConnection = asyncHandler(async (req, res) => {
    try {
        const testResult = await GeminiService.testConnection();
        res.json({
            success: testResult.success,
            message: testResult.message,
            error: testResult.error
        });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({
            success: false,
            error: 'Connection test failed'
        });
    }
});

// @desc    Get chatbot info
// @route   GET /api/chatbot/info
// @access  Public
exports.getChatbotInfo = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        chatbot: {
            name: 'Portfolio AI Assistant',
            models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-2.5-flash'],
            aiTypes: {
                general: 'General Assistant',
                code: 'Code Expert',
                creative: 'Creative Writer',
                analyst: 'Data Analyst',
                translator: 'Language Expert'
            },
            features: [
                'Real AI responses powered by Gemini & free LLM API',
                'Multiple AI personalities',
                'Conversation history',
                'Streaming responses',
                'Code expertise',
                'Creative writing',
                'Data analysis',
                'Multilingual support'
            ]
        }
    });
});

module.exports = exports;