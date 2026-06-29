import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Lock, CheckCircle, Star, Download, Eye,
  Sparkles, X, Loader2, Filter, Search
} from 'lucide-react';

const TemplatePicker = ({ type = 'portfolio', onSelect, onClose }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const res = await apiService.getTemplates(type);
    if (res.success) setTemplates(res.data);
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    if (filter === 'free' && t.isPremium) return false;
    if (filter === 'premium' && !t.isPremium) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={22} className="text-cyan-400" />
              Choose {type === 'portfolio' ? 'Portfolio' : 'CV'} Template
            </h2>
            <p className="text-slate-400 text-sm mt-1">Select a template to apply to your {type}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          {['all', 'free', 'premium'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? f === 'premium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-600 hover:text-white'
              }`}
            >
              {f === 'premium' && <Crown size={14} className="inline mr-1" />}
              {f}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Filter size={48} className="mx-auto mb-3 opacity-30" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t, i) => {
                const isUnlocked = !t.isPremium || user?.isPremium;
                return (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative group rounded-xl border overflow-hidden transition-all cursor-pointer ${
                      isUnlocked
                        ? 'border-slate-600 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5'
                        : 'border-slate-700/50 opacity-75'
                    }`}
                    onClick={() => isUnlocked && onSelect(t)}
                  >
                    <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-2">
                          <Eye size={20} className="text-white" />
                        </div>
                        <p className="text-xs text-slate-400">{t.layout.sections.length} sections</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                        {t.isPremium ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-md font-medium">
                            <Crown size={10} /> PREMIUM
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-md font-medium">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{t.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Star size={12} /> {t.rating}</span>
                        <span className="flex items-center gap-1"><Download size={12} /> {t.downloads}</span>
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="text-center">
                            <Lock size={32} className="text-amber-400 mx-auto mb-2" />
                            <p className="text-white text-sm font-medium">Premium Template</p>
                            <p className="text-slate-400 text-xs mt-1">Upgrade to unlock</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TemplatePicker;
