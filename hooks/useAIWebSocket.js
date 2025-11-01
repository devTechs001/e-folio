// src/hooks/useAIWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAIWebSocket = (conversationId) => {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);
    const [typing, setTyping] = useState({});
    const [streamingMessage, setStreamingMessage] = useState('');
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        connect();

        return () => {
            disconnect();
        };
    }, [user, conversationId]);

    const connect = () => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        wsRef.current = new WebSocket(`${wsUrl}/ws/ai`);

        wsRef.current.onopen = () => {
            console.log('AI WebSocket connected');
            setConnected(true);
            
            // Authenticate
            const token = localStorage.getItem('token');
            send({ type: 'auth', token });

            // Join conversation if specified
            if (conversationId) {
                send({ type: 'join_conversation', conversationId });
            }
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected');
            setConnected(false);
            
            // Attempt reconnection
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('Attempting to reconnect...');
                connect();
            }, 3000);
        };
    };

    const disconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    const handleMessage = (data) => {
        switch (data.type) {
            case 'auth_success':
                console.log('Authenticated with WebSocket');
                break;
                
            case 'new_message':
                // Handle new message (callback to parent)
                window.dispatchEvent(new CustomEvent('ai_new_message', { detail: data.message }));
                break;
                
            case 'user_typing':
                setTyping(prev => ({
                    ...prev,
                    [data.userId]: data.isTyping
                }));
                break;
                
            case 'message_stream':
                if (data.done) {
                    setStreamingMessage('');
                } else {
                    setStreamingMessage(prev => prev + data.chunk);
                }
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const send = (data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    };

    const sendTyping = (isTyping) => {
        if (conversationId) {
            send({
                type: 'typing',
                conversationId,
                isTyping
            });
        }
    };

    const joinConversation = (convId) => {
        send({
            type: 'join_conversation',
            conversationId: convId
        });
    };

    const leaveConversation = (convId) => {
        send({
            type: 'leave_conversation',
            conversationId: convId
        });
    };

    return {
        connected,
        typing,
        streamingMessage,
        sendTyping,
        joinConversation,
        leaveConversation,
        send
    };
};