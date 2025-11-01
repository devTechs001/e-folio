// client/src/components/Dashboard/DashboardLayout.jsx
// Simplified layout wrapper for dashboard pages
// This component provides a consistent header and content area
// The main sidebar and top navbar are handled by Dashboard.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardLayout = ({ children, title, subtitle, actions, breadcrumbs = [] }) => {
    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-2 text-sm mb-4">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                                <Home size={14} />
                                <span>Dashboard</span>
                            </Link>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={index}>
                                    <ChevronRight size={14} className="text-slate-600" />
                                    {crumb.path ? (
                                        <Link
                                            to={crumb.path}
                                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-300">{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}

                    {/* Title Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl sm:text-3xl font-bold text-white mb-2"
                            >
                                {title}
                            </motion.h1>
                            {subtitle && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-slate-400 text-sm sm:text-base"
                                >
                                    {subtitle}
                                </motion.p>
                            )}
                        </div>

                        {/* Actions */}
                        {actions && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                {actions}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-0">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
