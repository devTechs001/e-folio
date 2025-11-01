// src/components/Dashboard/AITracking/PredictiveAnalytics.jsx
import React from 'react';
import { Brain, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';

const PredictiveAnalytics = ({ predictions }) => {
    if (!predictions) return null;

    const forecastData = {
        labels: predictions.forecast?.map(f => f.label) || [],
        datasets: [
            {
                label: 'Historical',
                data: predictions.historical?.map(h => h.value) || [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            },
            {
                label: 'Predicted',
                data: predictions.forecast?.map(f => f.value) || [],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderDash: [5, 5],
                fill: true
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
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

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Brain className="text-purple-500" size={24} />
                AI Predictions
                <span className="ml-auto px-3 py-1 bg-purple-500/20 text-purple-500 rounded-full text-xs font-bold">
                    {predictions.confidence || 0}% Confidence
                </span>
            </h3>

            <div className="h-64 mb-6">
                <Line data={forecastData} options={options} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    {
                        label: 'Next Hour',
                        value: predictions.nextHourPrediction || 0,
                        change: '+12%',
                        icon: Zap,
                        color: 'green'
                    },
                    {
                        label: 'Tomorrow',
                        value: predictions.tomorrowPrediction || 0,
                        change: '+8%',
                        icon: Calendar,
                        color: 'blue'
                    },
                    {
                        label: 'Next Week',
                        value: predictions.weekPrediction || 0,
                        change: '+15%',
                        icon: TrendingUp,
                        color: 'purple'
                    }
                ].map((pred, idx) => (
                    <div key={idx} className={`p-4 bg-${pred.color}-500/10 border border-${pred.color}-500/30 rounded-lg`}>
                        <div className="flex items-center justify-between mb-2">
                            <pred.icon className={`text-${pred.color}-500`} size={20} />
                            <span className="text-xs text-green-500 font-bold">{pred.change}</span>
                        </div>
                        <div className="text-sm text-gray-400 mb-1">{pred.label}</div>
                        <div className="text-2xl font-bold text-white">{pred.value}</div>
                    </div>
                ))}
            </div>

            {/* AI Recommendations */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-blue-500 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    AI Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                    {predictions.recommendations?.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rec}</span>
                        </li>
                    )) || (
                        <>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Traffic expected to increase by 15% tomorrow. Prepare server capacity.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Peak activity predicted at 3 PM. Schedule important updates after 5 PM.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Mobile traffic growing. Consider mobile-first optimizations.</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default PredictiveAnalytics;