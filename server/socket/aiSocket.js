// websocket/aiSocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class AIWebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server, 
            path: '/ws/ai'
        });
        
        this.clients = new Map(); // userId -> Set of ws connections
        this.conversationRooms = new Map(); // conversationId -> Set of ws connections
        
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('AI WebSocket client connected');
            
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
                console.log('AI WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        // Heartbeat to detect broken connections
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    this.handleDisconnect(ws);
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    async handleMessage(ws, data) {
        switch (data.type) {
            case 'auth':
                await this.authenticateClient(ws, data.token);
                break;
                
            case 'join_conversation':
                this.joinConversation(ws, data.conversationId);
                break;
                
            case 'leave_conversation':
                this.leaveConversation(ws, data.conversationId);
                break;
                
            case 'typing':
                this.broadcastTyping(ws, data.conversationId, data.isTyping);
                break;
                
            case 'message_stream':
                this.handleMessageStream(ws, data);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }

    async authenticateClient(ws, token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ws.userId = decoded.id;
            ws.authenticated = true;

            // Add to user clients
            if (!this.clients.has(ws.userId)) {
                this.clients.set(ws.userId, new Set());
            }
            this.clients.get(ws.userId).add(ws);

            ws.send(JSON.stringify({
                type: 'auth_success',
                userId: ws.userId
            }));

            // Send user's active conversations
            const conversations = await Conversation.find({ 
                userId: ws.userId 
            })
                .select('_id title updatedAt')
                .sort({ updatedAt: -1 })
                .limit(10);

            ws.send(JSON.stringify({
                type: 'conversations',
                conversations
            }));

        } catch (error) {
            ws.send(JSON.stringify({
                type: 'auth_failed',
                message: 'Invalid token'
            }));
        }
    }

    joinConversation(ws, conversationId) {
        if (!ws.authenticated) {
            return ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
            }));
        }

        if (!this.conversationRooms.has(conversationId)) {
            this.conversationRooms.set(conversationId, new Set());
        }
        
        this.conversationRooms.get(conversationId).add(ws);
        ws.currentConversation = conversationId;

        ws.send(JSON.stringify({
            type: 'joined_conversation',
            conversationId
        }));
    }

    leaveConversation(ws, conversationId) {
        const room = this.conversationRooms.get(conversationId);
        if (room) {
            room.delete(ws);
            if (room.size === 0) {
                this.conversationRooms.delete(conversationId);
            }
        }
        ws.currentConversation = null;
    }

    broadcastTyping(ws, conversationId, isTyping) {
        const room = this.conversationRooms.get(conversationId);
        if (!room) return;

        const message = JSON.stringify({
            type: 'user_typing',
            conversationId,
            userId: ws.userId,
            isTyping
        });

        room.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    handleMessageStream(ws, data) {
        const { conversationId, chunk, done } = data;
        
        const room = this.conversationRooms.get(conversationId);
        if (!room) return;

        const message = JSON.stringify({
            type: 'message_stream',
            conversationId,
            chunk,
            done
        });

        room.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    // Broadcast new message to conversation participants
    broadcastMessage(conversationId, message) {
        const room = this.conversationRooms.get(conversationId);
        if (!room) return;

        const data = JSON.stringify({
            type: 'new_message',
            conversationId,
            message
        });

        room.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    // Broadcast to specific user across all their connections
    broadcastToUser(userId, data) {
        const userClients = this.clients.get(userId);
        if (!userClients) return;

        const message = JSON.stringify(data);

        userClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    handleDisconnect(ws) {
        // Remove from user clients
        if (ws.userId && this.clients.has(ws.userId)) {
            const userClients = this.clients.get(ws.userId);
            userClients.delete(ws);
            
            if (userClients.size === 0) {
                this.clients.delete(ws.userId);
            }
        }

        // Remove from conversation rooms
        if (ws.currentConversation) {
            this.leaveConversation(ws, ws.currentConversation);
        }
    }

    close() {
        clearInterval(this.heartbeatInterval);
        this.wss.close();
    }
}

module.exports = AIWebSocketServer;