import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Shield, Ban, CheckCircle, Trash2, RefreshCw,
  Settings, Clock, Activity, Mail, Calendar, AlertTriangle, Loader2,
  UserCheck, UserX, Globe, Database, Lock, Unlock, UserPlus, UserMinus,
  ChevronLeft, ChevronRight, BarChart3, LogIn, Filter, HeartPulse,
  Cpu, HardDrive, Wifi, Zap, TrendingUp, UserCircle, Signal, Server,
  List, Download, Eye, EyeOff, MoreHorizontal
} from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'online', label: 'Online', icon: Signal },
  { id: 'activity', label: 'Activity', icon: List },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const AdminPanel = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { success, error: showError } = useNotifications();

  const [activeTab, setActiveTab] = useState('users');

  // User management state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Online users state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);

  // Activity state
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Health state
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Settings state
  const [appSettings, setAppSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    switch (activeTab) {
      case 'users':
        setLoading(true);
        try {
          const params = new URLSearchParams({ page, limit: '20' });
          if (search) params.set('search', search);
          if (statusFilter) params.set('status', statusFilter);
          const res = await apiService.request(`/admin/users?${params}`);
          if (res.success) { setUsers(res.data.users); setTotal(res.data.total); }
        } catch (err) { showError('Failed to fetch users'); }
        finally { setLoading(false); }
        break;

      case 'analytics':
        setAnalyticsLoading(true);
        try {
          const res = await apiService.request('/admin/analytics/registrations?days=30');
          if (res.success) setAnalytics(res.data);
        } catch (err) { /* ignore */ }
        finally { setAnalyticsLoading(false); }
        break;

      case 'online':
        setOnlineLoading(true);
        try {
          const res = await apiService.request('/admin/users/online');
          if (res.success) setOnlineUsers(res.data);
        } catch (err) { /* ignore */ }
        finally { setOnlineLoading(false); }
        break;

      case 'activity':
        setActivityLoading(true);
        try {
          const res = await apiService.request('/admin/activity?limit=50');
          if (res.success) setActivity(res.data);
        } catch (err) { /* ignore */ }
        finally { setActivityLoading(false); }
        break;

      case 'health':
        setHealthLoading(true);
        try {
          const res = await apiService.request('/admin/health');
          if (res.success) setHealth(res.data);
        } catch (err) { /* ignore */ }
        finally { setHealthLoading(false); }
        break;

      case 'settings':
        setSettingsLoading(true);
        try {
          const res = await apiService.request('/admin/settings');
          if (res.success) setAppSettings(res.data);
        } catch (err) { /* ignore */ }
        finally { setSettingsLoading(false); }
        break;
    }
  }, [activeTab, page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const res = await apiService.request(`/admin/users/${userId}/status`, {
        method: 'PATCH', body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.success) { success(`User ${currentStatus ? 'suspended' : 'activated'}`); fetchData(); }
    } catch (err) { showError('Failed to update user status'); }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await apiService.request(`/admin/users/${userId}`, { method: 'DELETE' });
      if (res.success) { success('User deleted'); setShowDeleteConfirm(null); fetchData(); }
    } catch (err) { showError('Failed to delete user'); }
  };

  const toggleMaintenance = async () => {
    try {
      const res = await apiService.request('/admin/settings', {
        method: 'PATCH', body: JSON.stringify({ maintenanceMode: !appSettings?.maintenanceMode })
      });
      if (res.success) { setAppSettings(res.data); success(`Maintenance ${appSettings?.maintenanceMode ? 'disabled' : 'enabled'}`); }
    } catch (err) { showError('Failed to update settings'); }
  };

  const toggleRegistration = async () => {
    try {
      const allow = appSettings?.allowRegistration === false;
      const res = await apiService.request('/admin/settings', {
        method: 'PATCH', body: JSON.stringify({ allowRegistration: allow })
      });
      if (res.success) { setAppSettings(res.data); success(`Registration ${allow ? 'enabled' : 'disabled'}`); }
    } catch (err) { showError('Failed to update settings'); }
  };

  const activeUsers = users.filter(u => u.isActive).length;
  const suspendedUsers = users.filter(u => !u.isActive).length;
  const totalPages = Math.ceil(total / 20);

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- TAB RENDERERS ---

  const renderUsers = () => (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: total, icon: Users, color: 'from-cyan-500 to-blue-500' },
          { label: 'Active', value: activeUsers, icon: UserCheck, color: 'from-emerald-500 to-green-500' },
          { label: 'Suspended', value: suspendedUsers, icon: UserX, color: 'from-red-500 to-rose-500' },
          { label: 'This Page', value: users.length, icon: Eye, color: 'from-purple-500 to-violet-500' }
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${card.color} opacity-10`} />
            <p className="text-sm text-slate-400 font-medium">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <form onSubmit={handleSearch}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search users..." className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm w-64 focus:border-cyan-500/50 focus:outline-none placeholder:text-slate-600 backdrop-blur-sm" />
            </form>
          </div>
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {['', 'active', 'suspended'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24">
            <Loader2 size={36} className="animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading users...</p>
          </motion.div>
        ) : users.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-24">
            <Users size={56} className="mx-auto mb-4 text-slate-600" />
            <p className="text-lg text-slate-400 font-medium">No users found</p>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
            <div className="grid grid-cols-[40px_1fr_140px_120px_100px] gap-4 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-white/5">
              <span /><span>User</span><span>Status</span><span>Joined</span><span className="text-right">Actions</span>
            </div>
            {users.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[40px_1fr_140px_120px_100px] gap-4 items-center px-5 py-3.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.isActive ? 'bg-gradient-to-br from-cyan-500 to-purple-500' : 'bg-slate-700'}`}>
                  {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{u.name}</span>
                    {u.isPremium && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-md font-medium">PRO</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{u.email}</span><span className="w-1 h-1 rounded-full bg-slate-600" /><span>@{u.username}</span>
                  </div>
                </div>
                <div>
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  <div className="flex items-center gap-1"><Calendar size={10} /> {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  {u.lastLoginAt && <div className="flex items-center gap-1 mt-0.5 text-slate-600"><LogIn size={10} /> {formatTime(u.lastLoginAt)}</div>}
                </div>
                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleUserStatus(u._id, u.isActive)}
                    className={`p-2 rounded-lg transition-all ${u.isActive ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                    title={u.isActive ? 'Suspend' : 'Activate'}>{u.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}</button>
                  <button onClick={() => setShowDeleteConfirm(u._id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Delete"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 disabled:opacity-30 hover:text-white transition-all">
              <ChevronLeft size={14} /> Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 disabled:opacity-30 hover:text-white transition-all">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>{showDeleteConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete User?</h3>
            <p className="text-sm text-slate-400 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all">Cancel</button>
              <button onClick={() => deleteUser(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-400 hover:bg-red-500/30 transition-all font-medium">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Registration Analytics</h2>
      <p className="text-sm text-slate-400 mb-8">User growth and platform activity over the last 30 days</p>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-cyan-400" /></div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'from-cyan-500 to-blue-500' },
              { label: 'New (7 days)', value: analytics.lastWeek, icon: UserPlus, color: 'from-emerald-500 to-green-500' },
              { label: 'Active Now', value: analytics.activeSessions, icon: Activity, color: 'from-purple-500 to-violet-500' },
              { label: 'Today Views', value: analytics.todayPageViews, icon: Eye, color: 'from-amber-500 to-orange-500' }
            ].map((card, i) => (
              <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${card.color} opacity-10`} />
                <p className="text-sm text-slate-400 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-base font-semibold text-white mb-4">Daily Registrations</h3>
            <div className="flex items-end gap-1 h-48">
              {analytics.dailyData?.map((d, i) => {
                const max = Math.max(...analytics.dailyData.map(x => x.count), 1);
                const h = (d.count / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {d.count} on {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                      className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 hover:from-cyan-500/60 transition-all cursor-pointer"
                      style={{ minHeight: d.count > 0 ? '4px' : '0' }} />
                    {i % 5 === 0 && <span className="text-[10px] text-slate-600 mt-1">{new Date(d.date).getDate()}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500"><BarChart3 size={48} className="mx-auto mb-4 opacity-30" /><p>No analytics data available</p></div>
      )}
    </div>
  );

  const renderOnline = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Currently Online</h2>
          <p className="text-sm text-slate-400 mt-1">Users active in the last 15 minutes</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all">
          <RefreshCw size={14} className={onlineLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {onlineLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-cyan-400" /></div>
      ) : onlineUsers.length === 0 ? (
        <div className="text-center py-20">
          <Signal size={56} className="mx-auto mb-4 text-slate-600" />
          <p className="text-lg text-slate-400 font-medium">No users online</p>
          <p className="text-sm text-slate-600 mt-1">Users will appear here when they're active</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {onlineUsers.map((u, i) => (
            <motion.div key={u._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{u.name}</p>
                <p className="text-xs text-slate-500">@{u.username}</p>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          <p className="text-sm text-slate-400 mt-1">Latest user registrations and logins</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all">
          <RefreshCw size={14} className={activityLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {activityLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-cyan-400" /></div>
      ) : activity.length === 0 ? (
        <div className="text-center py-20 text-slate-500"><List size={48} className="mx-auto mb-4 opacity-30" /><p>No activity yet</p></div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[40px_1fr_100px_auto] gap-4 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-white/5">
            <span /><span>User</span><span>Type</span><span>When</span>
          </div>
          {activity.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.01 }}
              className="grid grid-cols-[40px_1fr_100px_auto] gap-4 items-center px-5 py-3 rounded-xl hover:bg-white/5 transition-all">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${a.type === 'registered' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {a.user?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-white truncate">{a.user?.name}</p>
                <p className="text-xs text-slate-500">@{a.user?.username}</p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium ${a.type === 'registered' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {a.type === 'registered' ? <UserPlus size={12} /> : <LogIn size={12} />}
                  {a.type}
                </span>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{formatTime(a.timestamp)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHealth = () => (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-emerald-500/10">
          <HeartPulse size={24} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">System Health</h2>
          <p className="text-sm text-slate-400">Server status and performance metrics</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all">
          <RefreshCw size={14} className={healthLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {healthLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-cyan-400" /></div>
      ) : health ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Server size={18} className="text-cyan-400" /> Server</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Uptime', value: `${Math.floor(health.uptime / 86400)}d ${Math.floor((health.uptime % 86400) / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`, icon: Clock },
                  { label: 'Node.js', value: health.nodeVersion, icon: Cpu },
                  { label: 'Platform', value: health.platform, icon: Server },
                  { label: 'CPU Cores', value: health.cpu, icon: Cpu }
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <s.icon size={18} className="text-slate-500" />
                    <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-sm font-medium text-white">{s.value}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Database size={18} className="text-cyan-400" /> Database</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 w-fit">
                <div className={`w-3 h-3 rounded-full ${health.database === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm text-white font-medium capitalize">{health.database}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><HardDrive size={18} className="text-cyan-400" /> Memory</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Used</span><span className="text-white font-medium">{health.memory?.usage || 0}%</span></div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${health.memory?.usage || 0}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Free: {((health.memory?.free || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                  <span>Total: {((health.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" /> Tracking
              </h3>
              <p className="text-2xl font-bold text-white">{health.activeTrackingSessions}</p>
              <p className="text-xs text-slate-500 mt-1">Active sessions</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500"><HeartPulse size={48} className="mx-auto mb-4 opacity-30" /><p>Health data unavailable</p></div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Maintenance & Access Control</h2>
      <p className="text-sm text-slate-400 mb-8">Manage system-wide settings</p>

      {settingsLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-cyan-400" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border p-6 ${appSettings?.maintenanceMode ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${appSettings?.maintenanceMode ? 'bg-red-500/10' : 'bg-cyan-500/5'}`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${appSettings?.maintenanceMode ? 'bg-red-500/20' : 'bg-cyan-500/10'}`}>
                  {appSettings?.maintenanceMode ? <Lock size={22} className="text-red-400" /> : <Unlock size={22} className="text-cyan-400" />}
                </div>
                <button onClick={toggleMaintenance}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${appSettings?.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${appSettings?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Maintenance Mode</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Blocks new registrations. Existing users can still log in.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`relative overflow-hidden rounded-2xl border p-6 ${appSettings?.allowRegistration === false ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/5'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${appSettings?.allowRegistration === false ? 'bg-amber-500/10' : 'bg-emerald-500/5'}`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${appSettings?.allowRegistration === false ? 'bg-amber-500/20' : 'bg-emerald-500/10'}`}>
                  {appSettings?.allowRegistration === false ? <UserMinus size={22} className="text-amber-400" /> : <UserPlus size={22} className="text-emerald-400" />}
                </div>
                <button onClick={toggleRegistration}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${appSettings?.allowRegistration === false ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${appSettings?.allowRegistration === false ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">User Registration</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Toggle whether new users can create accounts.</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'analytics': return renderAnalytics();
      case 'online': return renderOnline();
      case 'activity': return renderActivity();
      case 'health': return renderHealth();
      case 'settings': return renderSettings();
      default: return null;
    }
  };

  return (
    <DashboardLayout title="Admin Panel" subtitle="Manage users, monitor activity, and control system settings">
      <div className="mb-8 flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-cyan-500/15 text-cyan-400 shadow-lg shadow-cyan-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </DashboardLayout>
  );
};

export default AdminPanel;
