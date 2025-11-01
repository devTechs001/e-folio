// src/components/Dashboard/AITracking/RealtimeDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Users, Eye, MousePointer, Clock, MapPin,
    TrendingUp, Zap, Target, Brain, RefreshCw, Play, Pause
} from 'lucide-react';

const RealtimeDashboard = () => {
    const [realTimeData, setRealTimeData] = useState({
        activeUsers: 0,
        currentPageViews: [],
        recentEvents: [],
        liveMetrics: {
            avgEngagement: 0,
            avgDuration: 0,
            topPage: '',
            topLocation: ''
        }
    });

    const [isPaused, setIsPaused] = useState(false);
    const wsRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        connectWebSocket();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        wsRef.current = new WebSocket(`${wsUrl}/tracking`);

        wsRef.current.onopen = () => {
            console.log('Real-time connection established');
            wsRef.current.send(JSON.stringify({
                type: 'auth',
                token: localStorage.getItem('token')
            }));
        };

        wsRef.current.onmessage = (event) => {
            if (isPaused) return;

            const data = JSON.parse(event.data);
            handleRealtimeUpdate(data);
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket closed, reconnecting...');
            setTimeout(connectWebSocket, 5000);
        };
    };

    const handleRealtimeUpdate = (data) => {
        switch (data.type) {
            case 'new_visitor':
                handleNewVisitor(data.visitor);
                playNotificationSound();
                break;
            case 'page_view':
                handlePageView(data.pageView);
                break;
            case 'event':
                handleEvent(data.event);
                break;
            case 'metrics_update':
                updateMetrics(data.metrics);
                break;
            case 'conversion':
                handleConversion(data.conversion);
                playConversionSound();
                break;
        }
    };

    const handleNewVisitor = (visitor) => {
        setRealTimeData(prev => ({
            ...prev,
            activeUsers: prev.activeUsers + 1,
            recentEvents: [
                {
                    type: 'visitor',
                    message: `New visitor from ${visitor.location?.country || 'Unknown'}`,
                    timestamp: Date.now(),
                    data: visitor
                },
                ...prev.recentEvents.slice(0, 19)
            ]
        }));
    };

    const handlePageView = (pageView) => {
        setRealTimeData(prev => {
            const existingIndex = prev.currentPageViews.findIndex(
                pv => pv.sessionId === pageView.sessionId
            );

            let updatedPageViews;
            if (existingIndex >= 0) {
                updatedPageViews = [...prev.currentPageViews];
                updatedPageViews[existingIndex] = {
                    ...updatedPageViews[existingIndex],
                    page: pageView.page,
                    timestamp: Date.now()
                };
            } else {
                updatedPageViews = [
                    pageView,
                    ...prev.currentPageViews.slice(0, 49)
                ];
            }

            return {
                ...prev,
                currentPageViews: updatedPageViews,
                recentEvents: [
                    {
                        type: 'pageview',
                        message: `Viewing ${pageView.page}`,
                        timestamp: Date.now(),
                        data: pageView
                    },
                    ...prev.recentEvents.slice(0, 19)
                ]
            };
        });
    };

    const handleEvent = (event) => {
        setRealTimeData(prev => ({
            ...prev,
            recentEvents: [
                {
                    type: event.eventType,
                    message: `${event.eventType}: ${event.description || ''}`,
                    timestamp: Date.now(),
                    data: event
                },
                ...prev.recentEvents.slice(0, 19)
            ]
        }));
    };

    const handleConversion = (conversion) => {
        setRealTimeData(prev => ({
            ...prev,
            recentEvents: [
                {
                    type: 'conversion',
                    message: `🎉 Conversion: ${conversion.type}`,
                    timestamp: Date.now(),
                    data: conversion,
                    highlight: true
                },
                ...prev.recentEvents.slice(0, 19)
            ]
        }));
    };

    const updateMetrics = (metrics) => {
        setRealTimeData(prev => ({
            ...prev,
            liveMetrics: metrics
        }));
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    const playConversionSound = () => {
        // Play a different sound for conversions
        const audio = new Audio('/sounds/conversion.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    const getEventIcon = (type) => {
        const icons = {
            visitor: Users,
            pageview: Eye,
            click: MousePointer,
            conversion: Target,
            event: Zap
        };
        return icons[type] || Activity;
    };

    const getEventColor = (type) => {
        const colors = {
            visitor: 'blue',
            pageview: 'green',
            click: 'purple',
            conversion: 'amber',
            event: 'gray'
        };
        return colors[type] || 'gray';
    };

    return (
        <div className="space-y-6">
            {/* Audio elements */}
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-green-500">LIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                        Updated {new Date().toLocaleTimeString()}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            isPaused
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Active Now',
                        value: realTimeData.activeUsers,
                        icon: Activity,
                        color: 'green',
                        pulse: true
                    },
                    {
                        label: 'Avg Engagement',
                        value: `${realTimeData.liveMetrics.avgEngagement}%`,
                        icon: Brain,
                        color: 'blue'
                    },
                    {
                        label: 'Avg Session Time',
                        value: `${Math.round(realTimeData.liveMetrics.avgDuration / 1000)}s`,
                        icon: Clock,
                        color: 'purple'
                    },
                    {
                        label: 'Top Page',
                        value: realTimeData.liveMetrics.topPage || 'N/A',
                        icon: Eye,
                        color: 'amber',
                        truncate: true
                    }
                ].map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/10 ${
                            metric.pulse ? 'animate-pulse-slow' : ''
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 bg-${metric.color}-500/10 rounded-lg`}>
                                <metric.icon className={`text-${metric.color}-500`} size={20} />
                            </div>
                            {metric.pulse && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{metric.label}</p>
                        <h3 className={`text-2xl font-bold ${metric.truncate ? 'truncate' : ''}`}>
                            {metric.value}
                        </h3>
                    </motion.div>
                ))}
            </div>

            {/* Live Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Page Views */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Eye className="text-green-500" size={24} />
                        Active Visitors
                        <span className="ml-auto px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-bold">
                            {realTimeData.currentPageViews.length}
                        </span>
                    </h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                            {realTimeData.currentPageViews.map((pv, idx) => (
                                <motion.div
                                    key={pv.sessionId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {pv.location?.country || 'Unknown'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {Math.round((Date.now() - pv.timestamp) / 1000)}s ago
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400 truncate">
                                        {pv.page}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {realTimeData.currentPageViews.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <Users size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No active visitors</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Stream */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="text-blue-500" size={24} />
                        Live Events
                    </h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                            {realTimeData.recentEvents.map((event, idx) => {
                                const Icon = getEventIcon(event.type);
                                const color = getEventColor(event.type);

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={`p-3 rounded-lg transition-all ${
                                            event.highlight
                                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50'
                                                : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 bg-${color}-500/10 rounded-lg flex-shrink-0`}>
                                                <Icon className={`text-${color}-500`} size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{event.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {realTimeData.recentEvents.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <Activity size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Waiting for events...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealtimeDashboard;