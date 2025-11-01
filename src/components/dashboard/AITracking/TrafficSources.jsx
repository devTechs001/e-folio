// src/components/Dashboard/AITracking/TrafficSources.jsx
import React from 'react';
import { Share2, Search, Link2, Hash } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';

const TrafficSources = ({ sources }) => {
    if (!sources) return null;

    const sourceIcons = {
        direct: Link2,
        search: Search,
        social: Share2,
        referral: Hash
    };

    const data = {
        labels: ['Direct', 'Search', 'Social', 'Referral'],
        datasets: [{
            data: [
                sources.direct || 0,
                sources.search || 0,
                sources.social || 0,
                sources.referral || 0
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#fff', padding: 20 }
            }
        }
    };

    const total = (sources.direct || 0) + (sources.search || 0) + 
                  (sources.social || 0) + (sources.referral || 0);

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Share2 className="text-amber-500" size={24} />
                Traffic Sources
            </h3>

            <div className="h-64 mb-6">
                <Doughnut data={data} options={options} />
            </div>

            <div className="space-y-3">
                {Object.entries(sources).map(([source, count]) => {
                    const Icon = sourceIcons[source] || Hash;
                    const colors = {
                        direct: 'blue',
                        search: 'green',
                        social: 'amber',
                        referral: 'pink'
                    };
                    const color = colors[source] || 'gray';

                    return (
                        <div key={source} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                                    <Icon className={`text-${color}-500`} size={20} />
                                </div>
                                <span className="font-medium capitalize">{source}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">{count}</div>
                                <div className="text-xs text-gray-400">
                                    {total > 0 ? ((count / total) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrafficSources;