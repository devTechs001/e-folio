// src/components/Dashboard/AITracking/VisitorDetailsModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, Monitor, Smartphone, Clock, Eye, MousePointer,
    Route, Share2, Target, Brain, Activity, Globe, Wifi
} from 'lucide-react';

const VisitorDetailsModal = ({ show, visitor, onClose }) => {
    if (!show || !visitor) return null;

    const engagementColor = {
        very_high: 'green',
        high: 'blue',
        medium: 'amber',
        low: 'gray'
    }[visitor.aiInsights?.engagementLevel || 'low'];

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
                    className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 bg-${engagementColor}-500/10 rounded-xl`}>
                                <Brain className={`text-${engagementColor}-500`} size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Visitor Details</h3>
                                <p className="text-sm text-gray-400">
                                    Session ID: {visitor.sessionId?.substring(0, 8)}...
                                </p>
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
                        {/* AI Insights */}
                        <div className={`p-5 bg-${engagementColor}-500/10 border border-${engagementColor}-500/30 rounded-xl`}>
                            <h4 className={`text-lg font-bold text-${engagementColor}-500 mb-4 flex items-center gap-2`}>
                                <Brain size={20} />
                                AI Analysis
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Engagement Level</div>
                                    <div className={`text-lg font-bold text-${engagementColor}-500 capitalize`}>
                                        {visitor.aiInsights?.engagementLevel?.replace('_', ' ') || 'Low'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Intent Score</div>
                                    <div className="text-lg font-bold text-white">
                                        {visitor.aiInsights?.intentScore || 0}/100
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Conversion Probability</div>
                                    <div className="text-lg font-bold text-white">
                                        {visitor.aiInsights?.conversionProbability || 0}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Behavior Type</div>
                                    <div className="text-lg font-bold text-white capitalize">
                                        {visitor.aiInsights?.behaviorType || 'Explorer'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <Activity size={18} className="text-blue-500" />
                                    Session Data
                                </h4>
                                {[
                                    { label: 'Duration', value: `${Math.round((visitor.duration || 0) / 1000)}s`, icon: Clock },
                                    { label: 'Pages Viewed', value: visitor.pagesViewed || 0, icon: Eye },
                                    { label: 'Clicks', value: visitor.clicks || 0, icon: MousePointer },
                                    { label: 'Scroll Depth', value: `${visitor.scrollDepth || 0}%`, icon: Target }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <item.icon size={16} />
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="font-bold text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <Globe size={18} className="text-green-500" />
                                    Visitor Info
                                </h4>
                                {[
                                    { label: 'Location', value: `${visitor.location?.city || ''}, ${visitor.location?.country || 'Unknown'}`, icon: MapPin },
                                    { label: 'Device', value: visitor.device?.isMobile ? 'Mobile' : 'Desktop', icon: visitor.device?.isMobile ? Smartphone : Monitor },
                                    { label: 'Browser', value: visitor.browser || 'Unknown', icon: Globe },
                                    { label: 'IP Address', value: visitor.ip || 'N/A', icon: Wifi }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <item.icon size={16} />
                                            <span>{item.label}</span>
                                        </div>
                                        <span className="font-bold text-white text-right">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Page Journey */}
                        <div>
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Route size={18} className="text-purple-500" />
                                Page Journey
                            </h4>
                            <div className="space-y-2">
                                {visitor.pageJourney?.map((page, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 rounded-full text-purple-500 font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{page.path}</div>
                                            <div className="text-xs text-gray-400">
                                                {Math.round(page.timeSpent / 1000)}s spent
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {new Date(page.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                )) || (
                                    <div className="text-center py-8 text-gray-400">
                                        No page journey data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Traffic Source */}
                        {visitor.source && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <h4 className="font-semibold text-blue-500 mb-2 flex items-center gap-2">
                                    <Share2 size={16} />
                                    Traffic Source
                                </h4>
                                <div className="text-sm text-gray-300">
                                    <span className="font-medium">Referrer:</span> {visitor.source.referrer || 'Direct'}
                                </div>
                                {visitor.source.campaign && (
                                    <div className="text-sm text-gray-300 mt-1">
                                        <span className="font-medium">Campaign:</span> {visitor.source.campaign}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VisitorDetailsModal;