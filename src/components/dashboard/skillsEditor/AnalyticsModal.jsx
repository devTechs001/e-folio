// src/components/Dashboard/SkillsEditor/AnalyticsModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Award, Target, BarChart3, PieChart, Activity } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AnalyticsModal = ({ show, onClose, analytics, skills }) => {
    if (!show) return null;

    // Category Distribution
    const categoryData = skills.reduce((acc, skill) => {
        const cat = skill.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoryChartData = {
        labels: Object.keys(categoryData),
        datasets: [{
            data: Object.values(categoryData),
            backgroundColor: [
                '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
                '#10b981', '#06b6d4', '#f97316', '#a855f7'
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
        }]
    };

    // Level Distribution
    const levelData = skills.reduce((acc, skill) => {
        if (skill.level < 40) acc.beginner++;
        else if (skill.level < 70) acc.intermediate++;
        else acc.advanced++;
        return acc;
    }, { beginner: 0, intermediate: 0, advanced: 0 });

    const levelChartData = {
        labels: ['Beginner', 'Intermediate', 'Advanced'],
        datasets: [{
            label: 'Skills by Level',
            data: [levelData.beginner, levelData.intermediate, levelData.advanced],
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
        }]
    };

    // Top Skills by Level
    const topSkills = [...skills]
        .sort((a, b) => b.level - a.level)
        .slice(0, 10);

    const topSkillsData = {
        labels: topSkills.map(s => s.name),
        datasets: [{
            label: 'Proficiency Level',
            data: topSkills.map(s => s.level),
            backgroundColor: topSkills.map(s => s.color || '#3b82f6'),
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
        }]
    };

    const chartOptions = {
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

    const avgLevel = Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length) || 0;
    const totalExperience = skills.reduce((acc, s) => acc + (s.yearsOfExperience || 0), 0);
    const totalCertifications = skills.reduce((acc, s) => acc + (s.certifications?.length || 0), 0);
    const featuredSkills = skills.filter(s => s.featured).length;

    return (
        <AnimatePresence>
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <BarChart3 className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Skills Analytics</h3>
                                <p className="text-sm text-gray-400">Insights and statistics</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Skills', value: skills.length, icon: Target, color: 'blue' },
                                { label: 'Avg Proficiency', value: `${avgLevel}%`, icon: TrendingUp, color: 'green' },
                                { label: 'Total Experience', value: `${totalExperience}y`, icon: Activity, color: 'purple' },
                                { label: 'Certifications', value: totalCertifications, icon: Award, color: 'amber' }
                            ].map((metric, i) => (
                                <div
                                    key={i}
                                    className="bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/10"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <p className="text-sm text-gray-400 font-medium">{metric.label}</p>
                                        <div className={`p-2 bg-${metric.color}-500/10 rounded-lg`}>
                                            <metric.icon className={`text-${metric.color}-500`} size={20} />
                                        </div>
                                    </div>
                                    <h4 className={`text-3xl font-bold bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600 bg-clip-text text-transparent`}>
                                        {metric.value}
                                    </h4>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Category Distribution */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <PieChart size={20} className="text-blue-500" />
                                    Category Distribution
                                </h4>
                                <div style={{ height: '300px' }}>
                                    <Doughnut data={categoryChartData} options={doughnutOptions} />
                                </div>
                            </div>

                            {/* Level Distribution */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 size={20} className="text-green-500" />
                                    Level Distribution
                                </h4>
                                <div style={{ height: '300px' }}>
                                    <Bar data={levelChartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        {/* Top Skills */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-purple-500" />
                                Top 10 Skills by Proficiency
                            </h4>
                            <div style={{ height: '400px' }}>
                                <Bar data={topSkillsData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Skills Matrix */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4">Skills Matrix</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-400">Skill</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-400">Category</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-400">Level</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-400">Experience</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topSkills.map((skill) => (
                                            <tr key={skill.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <i className={skill.icon} style={{ color: skill.color }}></i>
                                                        <span className="font-medium">{skill.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className="px-2 py-1 rounded text-xs font-bold"
                                                        style={{
                                                            background: `${skill.color}25`,
                                                            color: skill.color
                                                        }}
                                                    >
                                                        {skill.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${skill.level}%`,
                                                                    background: skill.color
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="font-bold" style={{ color: skill.color }}>
                                                            {skill.level}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400">
                                                    {skill.yearsOfExperience || 0} years
                                                </td>
                                                <td className="py-3 px-4">
                                                    {skill.featured && (
                                                        <span className="text-amber-500 text-xs">★ Featured</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AnalyticsModal;