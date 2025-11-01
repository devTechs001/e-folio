// src/components/Dashboard/AITracking/GeographicDistribution.jsx
import React from 'react';
import { MapPin, Globe, TrendingUp } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

const GeographicDistribution = ({ locations }) => {
    if (!locations || locations.length === 0) return null;

    const topLocations = locations.slice(0, 10);
    
    const data = {
        labels: topLocations.map(l => l._id),
        datasets: [{
            label: 'Visitors',
            data: topLocations.map(l => l.count),
            backgroundColor: topLocations.map((_, idx) => 
                `rgba(${59 + idx * 20}, ${130 - idx * 10}, 246, 0.8)`
            ),
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12
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
                <Globe className="text-green-500" size={24} />
                Geographic Distribution
            </h3>

            <div className="h-64 mb-6">
                <Bar data={data} options={options} />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {topLocations.map((location, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-full text-blue-500 font-bold text-sm">
                                {idx + 1}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <span className="font-medium">{location._id}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="font-bold">{location.count}</div>
                                <div className="text-xs text-gray-400">visitors</div>
                            </div>
                            {idx === 0 && <TrendingUp className="text-green-500" size={16} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeographicDistribution;