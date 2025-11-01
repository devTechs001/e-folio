// src/components/Dashboard/AITracking/BehaviorPatterns.jsx
import React from 'react';
import { Layers, Route, Clock, MousePointer, Target } from 'lucide-react';
import { Radar } from 'react-chartjs-2';

const BehaviorPatterns = ({ patterns }) => {
    if (!patterns || patterns.length === 0) return null;

    const radarData = {
        labels: ['Engagement', 'Navigation', 'Time', 'Clicks', 'Scroll'],
        datasets: [{
            label: 'User Behavior',
            data: [
                patterns.avgEngagement || 0,
                patterns.avgPagesPerSession || 0,
                (patterns.avgSessionDuration || 0) / 60000, // Convert to minutes
                patterns.avgClicks || 0,
                patterns.avgScrollDepth || 0
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            borderWidth: 2
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            r: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#fff', backdropColor: 'transparent' },
                pointLabels: { color: '#fff' }
            }
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Layers className="text-blue-500" size={24} />
                Behavior Patterns
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                    <Radar data={radarData} options={options} />
                </div>

                <div className="space-y-3">
                    {[
                        {
                            label: 'Avg Session Duration',
                            value: `${Math.round((patterns.avgSessionDuration || 0) / 1000)}s`,
                            icon: Clock,
                            color: 'blue'
                        },
                        {
                            label: 'Pages Per Session',
                            value: (patterns.avgPagesPerSession || 0).toFixed(1),
                            icon: Route,
                            color: 'purple'
                        },
                        {
                            label: 'Clicks Per Session',
                            value: Math.round(patterns.avgClicks || 0),
                            icon: MousePointer,
                            color: 'green'
                        },
                        {
                            label: 'Scroll Depth',
                            value: `${Math.round(patterns.avgScrollDepth || 0)}%`,
                            icon: Target,
                            color: 'amber'
                        }
                    ].map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-${metric.color}-500/10 rounded-lg`}>
                                    <metric.icon className={`text-${metric.color}-500`} size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-300">{metric.label}</span>
                            </div>
                            <span className="text-xl font-bold text-white">{metric.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Common Patterns */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Most Common Path', value: 'Home → Projects → Contact', icon: Route },
                    { title: 'Peak Activity', value: '2-4 PM', icon: Clock },
                    { title: 'Avg Engagement', value: 'High', icon: Target }
                ].map((pattern, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                        <pattern.icon className="text-blue-500 mb-2" size={20} />
                        <div className="text-xs text-gray-400 mb-1">{pattern.title}</div>
                        <div className="font-bold text-white">{pattern.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BehaviorPatterns;