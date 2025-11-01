// src/components/Dashboard/AITracking/DeviceBreakdown.jsx
import React from 'react';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';

const DeviceBreakdown = ({ devices }) => {
    if (!devices) return null;

    const total = devices.mobile + devices.desktop + (devices.tablet || 0);
    const data = {
        labels: ['Mobile', 'Desktop', 'Tablet'],
        datasets: [{
            data: [devices.mobile, devices.desktop, devices.tablet || 0],
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'],
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

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Monitor className="text-purple-500" size={24} />
                Device Breakdown
            </h3>

            <div className="h-64 mb-6">
                <Doughnut data={data} options={options} />
            </div>

            <div className="space-y-3">
                {[
                    { label: 'Mobile', count: devices.mobile, icon: Smartphone, color: 'blue' },
                    { label: 'Desktop', count: devices.desktop, icon: Monitor, color: 'purple' },
                    { label: 'Tablet', count: devices.tablet || 0, icon: Tablet, color: 'pink' }
                ].map((device, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-${device.color}-500/10 rounded-lg`}>
                                <device.icon className={`text-${device.color}-500`} size={20} />
                            </div>
                            <span className="font-medium">{device.label}</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-lg">{device.count}</div>
                            <div className="text-xs text-gray-400">
                                {((device.count / total) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeviceBreakdown;