import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FolderKanban, LayoutDashboard, User, Mail } from 'lucide-react';

const NAV_ITEMS = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'About', path: '/about' },
    { icon: Mail, label: 'Contact', path: '/contact' },
];

const MobileBottomNav = () => {
    const location = useLocation();

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 pb-6"
        >
            <div className="flex items-center justify-around py-2 pt-2">
                {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                    const isActive = path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(path);

                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 group ${
                                isActive
                                    ? 'text-cyan-400'
                                    : 'text-slate-400 hover:text-slate-300'
                            }`}
                        >
                            <div className="relative">
                                <Icon
                                    size={22}
                                    className={`transition-colors ${
                                        isActive
                                            ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                                            : 'group-hover:text-slate-300'
                                    }`}
                                />
                                {path === '/dashboard' && (
                                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                                        3
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-semibold tracking-tight transition-colors ${
                                    isActive
                                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'
                                        : ''
                                }`}
                            >
                                {label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </motion.nav>
    );
};

export default MobileBottomNav;
