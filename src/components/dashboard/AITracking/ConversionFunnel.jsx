// src/components/Dashboard/AITracking/ConversionFunnel.jsx
import React from 'react';
import { TrendingDown, Users, Eye, MousePointer, Award } from 'lucide-react';

const ConversionFunnel = ({ funnel }) => {
    if (!funnel || funnel.length === 0) return null;

    const maxValue = Math.max(...funnel.map(f => f.count));

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingDown className="text-purple-500" size={24} />
                Conversion Funnel
                <span className="text-sm font-normal text-gray-400 ml-auto">
                    Overall Rate: {funnel[funnel.length - 1]?.conversionRate || 0}%
                </span>
            </h3>

            <div className="space-y-4">
                {funnel.map((step, idx) => {
                    const percentage = (step.count / maxValue) * 100;
                    const dropoff = idx > 0 ? funnel[idx - 1].count - step.count : 0;
                    const dropoffRate = idx > 0 ? ((dropoff / funnel[idx - 1].count) * 100).toFixed(1) : 0;

                    const icons = [Users, Eye, MousePointer, Award];
                    const Icon = icons[idx] || Award;

                    return (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${
                                        idx === 0 ? 'bg-green-500/10' :
                                        idx === funnel.length - 1 ? 'bg-purple-500/10' :
                                        'bg-blue-500/10'
                                    } rounded-lg`}>
                                        <Icon className={
                                            idx === 0 ? 'text-green-500' :
                                            idx === funnel.length - 1 ? 'text-purple-500' :
                                            'text-blue-500'
                                        } size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{step.name}</h4>
                                        <p className="text-xs text-gray-400">{step.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">{step.count}</div>
                                    {idx > 0 && dropoff > 0 && (
                                        <div className="text-xs text-red-400">
                                            -{dropoffRate}% drop
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative h-12 bg-white/5 rounded-lg overflow-hidden">
                                <div
                                    className={`absolute inset-y-0 left-0 ${
                                        idx === 0 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                        idx === funnel.length - 1 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                        'bg-gradient-to-r from-blue-500 to-blue-600'
                                    } flex items-center justify-center transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                >
                                    <span className="text-white font-bold text-sm">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Optimization Tips */}
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <h4 className="font-semibold text-amber-500 mb-2 flex items-center gap-2">
                    <TrendingDown size={16} />
                    Optimization Opportunity
                </h4>
                <p className="text-sm text-gray-300">
                    {funnel[1] && funnel[0] && ((funnel[0].count - funnel[1].count) / funnel[0].count * 100) > 50
                        ? 'High drop-off at step 2. Consider improving initial engagement.'
                        : 'Funnel performing well. Focus on increasing top-of-funnel traffic.'}
                </p>
            </div>
        </div>
    );
};

export default ConversionFunnel;