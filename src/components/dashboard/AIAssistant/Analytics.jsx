// src/components/Dashboard/AIAssistant/AIAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, DollarSign, Zap, Calendar,
    Clock, MessageSquare, Users, Download
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ApiService from '../../../services/api.service';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend
);

const AIAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [timeRange, setTimeRange] = useState('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [timeRange]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAIStats({ timeRange });
            setStats(response.stats);
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>;
    }

    // Usage over time chart
    const usageChartData = {
        labels: stats.dailyUsage.map(d => d._id),
        datasets: [
            {
                label: 'Messages',
                data: stats.dailyUsage.map(d => d.messages),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Tokens (thousands)',
                data: stats.dailyUsage.map(d => d.tokens / 1000),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Model distribution
    const modelChartData = {
        labels: stats.messagesByModel.map(m => m._id),
        datasets: [{
            data: stats.messagesByModel.map(m => m.count),
            backgroundColor: [
                '#3b82f6',
                '#8b5cf6',
                '#10b981',
                '#f59e0b'
            ],
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.1)'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#fff' }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#fff' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#fff' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#fff' }
            }
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-1">AI Usage Analytics</h2>
                    <p className="text-gray-400">Track your AI assistant usage and costs</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="all">All time</option>
                    </select>

                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all flex items-center gap-2">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Total Conversations',
                        value: stats.totalConversations,
                        icon: MessageSquare,
                        color: 'blue',
                        change: '+12%'
                    },
                    {
                        label: 'Total Messages',
                        value: stats.totalMessages.toLocaleString(),
                        icon: Zap,
                        color: 'purple',
                        change: '+18%'
                    },
                    {
                        label: 'Tokens Used',
                        value: (stats.totalTokens / 1000).toFixed(1) + 'K',
                        icon: BarChart3,
                        color: 'green',
                        change: '+25%'
                    },
                    {
                        label: 'Total Cost',
                        value: '$' + stats.totalCost,
                        icon: DollarSign,
                        color: 'amber',
                        change: '+8%'
                    }
                ].map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 bg-${metric.color}-500/10 rounded-xl`}>
                                <metric.icon className={`text-${metric.color}-500`} size={24} />
                            </div>
                            <div className={`px-2 py-1 bg-green-500/20 text-green-500 rounded-lg text-xs font-bold`}>
                                <TrendingUp size={12} className="inline mr-1" />
                                {metric.change}
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{metric.label}</p>
                        <h3 className={`text-3xl font-bold bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600 bg-clip-text text-transparent`}>
                            {metric.value}
                        </h3>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Usage Over Time */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Usage Over Time</h3>
                    <div style={{ height: '300px' }}>
                        <Line data={usageChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Model Distribution */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Model Distribution</h3>
                    <div style={{ height: '300px' }}>
                        <Doughnut data={modelChartData} options={doughnutOptions} />
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Average Usage</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Tokens per message</p>
                            <p className="text-2xl font-bold">{stats.averageTokensPerMessage}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Messages per conversation</p>
                            <p className="text-2xl font-bold">
                                {(stats.totalMessages / stats.totalConversations).toFixed(1)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Cost per message</p>
                            <p className="text-2xl font-bold">
                                ${(parseFloat(stats.totalCost) / stats.totalMessages).toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Cost Breakdown</h3>
                    <div className="space-y-3">
                        {stats.messagesByModel.map((model) => {
                            const percentage = ((model.count / stats.totalMessages) * 100).toFixed(1);
                            return (
                                <div key={model._id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{model._id || 'Unknown'}</span>
                                        <span className="text-gray-400">{percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Recommendations</h3>
                    <div className="space-y-3 text-sm">
                        {parseFloat(stats.totalCost) > 50 && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-amber-500 font-semibold mb-1">High Usage Alert</p>
                                <p className="text-gray-400">Consider using GPT-3.5 for simple queries</p>
                            </div>
                        )}
                        {stats.averageTokensPerMessage > 2000 && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-500 font-semibold mb-1">Long Conversations</p>
                                <p className="text-gray-400">Start new conversations to reduce token usage</p>
                            </div>
                        )}
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-500 font-semibold mb-1">Optimization Tip</p>
                            <p className="text-gray-400">Use prompt templates to save time and tokens</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAnalytics;