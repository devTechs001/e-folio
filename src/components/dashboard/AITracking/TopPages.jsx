// src/components/Dashboard/AITracking/TopPages.jsx
import React from 'react';
import { Eye, Clock, MousePointer } from 'lucide-react';

const TopPages = ({ pages }) => {
    if (!pages || pages.length === 0) return null;

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Eye className="text-blue-500" size={24} />
                Top Pages
            </h3>

            <div className="space-y-3">
                {pages.slice(0, 8).map((page, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-500/10 rounded-full text-blue-500 font-bold text-xs">
                                        {idx + 1}
                                    </span>
                                    <h4 className="font-semibold text-white truncate">
                                        {page._id || '/'}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                    {page.title || 'Untitled Page'}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-blue-500">{page.count}</div>
                                <div className="text-xs text-gray-400">views</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={14} />
                                <span>{Math.round((page.avgTime || 0) / 1000)}s</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MousePointer size={14} />
                                <span>{page.clicks || 0} clicks</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Eye size={14} />
                                <span>{page.uniqueViews || 0} unique</span>
                            </div>
                        </div>

                        {/* Engagement Bar */}
                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                style={{ width: `${Math.min((page.engagement || 0), 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopPages;