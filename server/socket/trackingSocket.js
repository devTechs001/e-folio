// websocket/trackingSocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class TrackingWebSocket {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/tracking' });
        this.clients = new Map(); // sessionId -> ws connection
        
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('WebSocket client connected');

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });

            ws.on('close', () => {
                // Remove from clients
                for (const [sessionId, client] of this.clients.entries()) {
                    if (client === ws) {
                        this.clients.delete(sessionId);
                        break;
                    }
                }
                console.log('WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }

    async handleMessage(ws, data) {
        switch (data.type) {
            case 'auth':
                await this.authenticateClient(ws, data.token);
                break;
            case 'subscribe':
                this.clients.set(data.sessionId, ws);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }

    async authenticateClient(ws, token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.role === 'owner') {
                ws.isOwner = true;
                ws.userId = decoded.id;
                ws.send(JSON.stringify({ type: 'auth_success' }));
            } else {
                ws.send(JSON.stringify({ type: 'auth_failed' }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: 'auth_failed' }));
        }
    }

    // Broadcast to owner clients
    broadcastToOwner(data) {
        this.wss.clients.forEach((client) => {
            if (client.isOwner && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    // Send to specific session
    sendToSession(sessionId, data) {
        const client = this.clients.get(sessionId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }

    // Broadcast new visitor
    broadcastNewVisitor(visitor) {
        this.broadcastToOwner({
            type: 'new_visitor',
            visitor
        });
    }

    // Broadcast analytics update
    broadcastAnalyticsUpdate(analytics) {
        this.broadcastToOwner({
            type: 'analytics_update',
            analytics
        });
    }

    // Broadcast high engagement alert
    broadcastHighEngagement(session) {
        this.broadcastToOwner({
            type: 'high_engagement',
            message: `High engagement from ${session.location?.country || 'unknown'}`,
            session
        });
    }

    // Broadcast conversion
    broadcastConversion(session) {
        this.broadcastToOwner({
            type: 'conversion',
            message: `New conversion! Type: ${session.conversionType}`,
            session
        });
    }
}

module.exports = TrackingWebSocket;