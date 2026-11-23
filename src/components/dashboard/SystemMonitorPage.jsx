/**
 * Phase 40 — System Monitor / Resources / Cache Cleaner (owner-only).
 *
 * Three honest sources feed this page:
 *   1. `/api/admin/system` — real measurements from the running API process.
 *   2. The browser — localStorage, sessionStorage, the in-memory response cache
 *      and the service-worker caches, all measured locally.
 *   3. `/api/admin/resources` — the existing allow-listed file inventory.
 *
 * Anything that cannot be measured renders as "not measurable". Nothing is
 * estimated, seeded or shown as a plausible-looking zero, and the page never
 * claims to be live unless a real request just succeeded.
 *
 * Confidential: local checkout only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity, AlertTriangle, CheckCircle2, Cpu, Database, HardDrive, MemoryStick,
    RefreshCw, Loader2, Trash2, Server, Clock, WifiOff, ShieldAlert, FolderOpen,
    Gauge, Layers, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import { measureClientStorage, clearClientCaches } from '../../services/cacheCleaner.service';
import {
    evaluateAlerts,
    alertStatus,
    formatBytes,
    CACHE_SURFACES
} from '../../utils/cacheCleaner';

const POLL_MS = 15000;

const Card = ({ children, className = '' }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 ${className}`}>
        {children}
    </div>
);

const Stat = ({ icon, label, value, hint, tone = 'cyan' }) => {
    const Icon = icon;
    const tones = {
        cyan: 'text-cyan-400',
        violet: 'text-violet-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400'
    };
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <Icon size={18} className={tones[tone] || tones.cyan} aria-hidden="true" />
            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-white break-words">{value}</p>
                {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
            </div>
        </div>
    );
};

const Meter = ({ label, percent, detail }) => {
    const known = Number.isFinite(percent);
    const clamped = known ? Math.max(0, Math.min(100, percent)) : 0;
    const tone = !known ? 'bg-slate-600' : clamped >= 90 ? 'bg-rose-500' : clamped >= 75 ? 'bg-amber-500' : 'bg-cyan-500';
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-medium">{known ? `${clamped.toFixed(1)}%` : 'not measurable'}</span>
            </div>
            <div
                className="h-2 rounded-full bg-white/5 overflow-hidden"
                role="meter"
                aria-valuenow={known ? Math.round(clamped) : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
            >
                <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${known ? clamped : 0}%` }} />
            </div>
            {detail && <p className="text-[11px] text-slate-500">{detail}</p>}
        </div>
    );
};

const duration = seconds => {
    if (!Number.isFinite(seconds)) return 'not measurable';
    const s = Math.max(0, Math.floor(seconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d}d ${h}h ${m}m`;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
};

const SystemMonitorPage = () => {
    const { isOwner } = useAuth();
    const { addNotification } = useNotifications();

    const [metrics, setMetrics] = useState(null);
    const [metricsError, setMetricsError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [storage, setStorage] = useState(() => measureClientStorage());
    const [resources, setResources] = useState(null);
    const [resourcesError, setResourcesError] = useState(null);
    const [purging, setPurging] = useState(false);
    const [purgeResults, setPurgeResults] = useState(null);
    const [allowDestructive, setAllowDestructive] = useState(false);
    const [serverPurgeResult, setServerPurgeResult] = useState(null);

    const mounted = useRef(true);
    useEffect(() => () => { mounted.current = false; }, []);

    const loadMetrics = useCallback(async ({ silent = false } = {}) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await apiService.request('/admin/system');
            if (!mounted.current) return;
            if (res?.success && res.data) {
                setMetrics(res.data);
                setMetricsError(null);
                setLastUpdated(new Date());
            } else {
                // An answer we cannot use is not a success.
                setMetrics(null);
                setMetricsError(res?.message || 'The server returned no metrics.');
            }
        } catch (error) {
            if (!mounted.current) return;
            setMetrics(null);
            setMetricsError(
                error?.response?.status === 401 || error?.response?.status === 403
                    ? 'System metrics are owner-only. Sign in as the owner to view them.'
                    : 'The API could not be reached, so no metrics are shown.'
            );
        } finally {
            if (mounted.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    const loadResources = useCallback(async () => {
        try {
            const res = await apiService.request('/admin/resources');
            if (!mounted.current) return;
            if (res?.success) {
                setResources(res.data);
                setResourcesError(null);
            } else {
                setResources(null);
                setResourcesError('The file inventory could not be read.');
            }
        } catch {
            if (!mounted.current) return;
            setResources(null);
            setResourcesError('The file inventory is unavailable.');
        }
    }, []);

    useEffect(() => {
        if (!isOwner) return undefined;
        loadMetrics();
        loadResources();
        setStorage(measureClientStorage());

        const timer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            loadMetrics({ silent: true });
            setStorage(measureClientStorage());
        }, POLL_MS);
        return () => clearInterval(timer);
    }, [isOwner, loadMetrics, loadResources]);

    /** Alerts come from the server when present, plus local browser thresholds. */
    const alerts = useMemo(() => {
        const clientMetrics = {
            browserStorageBytes: storage.totalBytes,
            cacheEntries: storage.apiCache?.entries
        };
        const local = evaluateAlerts(clientMetrics);

        const server = Array.isArray(metrics?.alerts)
            ? metrics.alerts.map(alert => ({
                id: alert.id,
                severity: alert.severity,
                title: alert.title,
                detail: alert.detail,
                source: 'server'
            }))
            : [];

        const rank = { critical: 0, warning: 1, info: 2 };
        return [...server, ...local.map(a => ({ ...a, source: 'browser' }))]
            .sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
    }, [metrics, storage]);

    const status = alertStatus(alerts);

    const runClientPurge = async () => {
        setPurging(true);
        try {
            const outcome = await clearClientCaches({ allowDestructive });
            if (!mounted.current) return;
            setPurgeResults(outcome);
            setStorage(measureClientStorage());

            if (outcome.summary.status === 'cleared') {
                addNotification?.('Cache cleared', 'Browser caches were cleared.', 'success');
            } else if (outcome.summary.status === 'partial') {
                addNotification?.('Partly cleared', 'Some caches could not be cleared. See the details.', 'warning');
            } else if (outcome.summary.status === 'failed') {
                addNotification?.('Clear failed', 'The cache could not be cleared.', 'error');
            }
        } finally {
            if (mounted.current) setPurging(false);
        }
    };

    const runServerPurge = async () => {
        setPurging(true);
        try {
            const res = await apiService.request('/admin/system/cache/purge', {
                method: 'POST',
                body: JSON.stringify({ targets: ['dashboard', 'response'] })
            });
            if (!mounted.current) return;
            if (res?.success && res.data) {
                setServerPurgeResult(res.data);
                addNotification?.('Server cache cleared', 'Server-side caches were purged.', 'success');
                loadMetrics({ silent: true });
            } else {
                setServerPurgeResult({ error: res?.message || 'The purge did not report success.' });
            }
        } catch (error) {
            if (!mounted.current) return;
            setServerPurgeResult({
                error: error?.response?.status === 403
                    ? 'Only the owner can purge server caches.'
                    : 'The purge request failed.'
            });
        } finally {
            if (mounted.current) setPurging(false);
        }
    };

    if (!isOwner) {
        return (
            <div className="p-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={22} className="text-amber-400" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Owner access required</h2>
                            <p className="text-sm text-slate-400">
                                The system monitor reads process and database metrics, so it is limited to the owner account.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const live = Boolean(metrics) && !metricsError;
    const statusTone = {
        healthy: { chip: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
        info: { chip: 'bg-cyan-500/10 text-cyan-400', dot: 'bg-cyan-500' },
        warning: { chip: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-500' },
        critical: { chip: 'bg-rose-500/10 text-rose-400', dot: 'bg-rose-500' }
    }[status.level] || { chip: 'bg-slate-500/10 text-slate-300', dot: 'bg-slate-500' };

    return (
        <div className="p-6 space-y-6">
            {/* ------------------------------------------------------ header --- */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10">
                    <Activity size={24} className="text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">System Monitor</h1>
                    <p className="text-sm text-slate-400">Live process metrics, resource usage, alerts and cache control</p>
                </div>

                <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusTone.chip}`}>
                    <span className={`w-2 h-2 rounded-full ${statusTone.dot} ${live ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-medium">{live ? status.label : 'No data'}</span>
                </div>

                <button
                    type="button"
                    onClick={() => { loadMetrics({ silent: true }); loadResources(); setStorage(measureClientStorage()); }}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all"
                    aria-label="Refresh metrics"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <p className="text-xs text-slate-500">
                {lastUpdated
                    ? `Last successful read ${lastUpdated.toLocaleTimeString()} · refreshes every ${POLL_MS / 1000}s while this tab is visible`
                    : 'No successful metric read yet.'}
            </p>

            {/* ------------------------------------------------------ alerts --- */}
            <Card>
                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className={alerts.length ? 'text-amber-400' : 'text-emerald-400'} />
                    Alerts
                    <span className="text-xs font-normal text-slate-500">
                        ({alerts.length} active)
                    </span>
                </h2>

                {alerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span>
                            {live || lastUpdated
                                ? 'Nothing crossed a threshold.'
                                : 'No measurements yet, so no alert can be raised.'}
                        </span>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {alerts.map(alert => {
                            const tone = alert.severity === 'critical'
                                ? 'border-rose-500/30 bg-rose-500/5'
                                : alert.severity === 'warning'
                                    ? 'border-amber-500/30 bg-amber-500/5'
                                    : 'border-cyan-500/30 bg-cyan-500/5';
                            const iconTone = alert.severity === 'critical'
                                ? 'text-rose-400'
                                : alert.severity === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-cyan-400';
                            return (
                                <li key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${tone}`}>
                                    <AlertTriangle size={16} className={`${iconTone} mt-0.5`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">{alert.title}</p>
                                        <p className="text-xs text-slate-400">{alert.detail}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            source: {alert.source === 'browser' ? 'this browser' : 'API process'}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            {/* --------------------------------------------------- server --- */}
            {loading ? (
                <Card>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-cyan-400" />
                    </div>
                </Card>
            ) : metricsError ? (
                <Card>
                    <div className="flex items-start gap-3">
                        <WifiOff size={20} className="text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-white">Server metrics unavailable</p>
                            <p className="text-xs text-slate-400">{metricsError}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Nothing is shown in place of a measurement. Browser figures below are still real.
                            </p>
                        </div>
                    </div>
                </Card>
            ) : metrics ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 space-y-4">
                        <Card>
                            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                <Gauge size={18} className="text-cyan-400" /> Process &amp; host
                            </h2>
                            <div className="space-y-4">
                                <Meter
                                    label="System memory"
                                    percent={metrics.system?.memoryUsagePercent}
                                    detail={
                                        Number.isFinite(metrics.system?.totalMemoryBytes)
                                            ? `${formatBytes(metrics.system.usedMemoryBytes)} used of ${formatBytes(metrics.system.totalMemoryBytes)}`
                                            : 'memory totals unavailable'
                                    }
                                />
                                <Meter
                                    label="Node heap"
                                    percent={metrics.process?.heapUsagePercent}
                                    detail={
                                        Number.isFinite(metrics.process?.heapLimitBytes)
                                            ? `${formatBytes(metrics.process.heapUsedBytes)} of ${formatBytes(metrics.process.heapLimitBytes)} limit`
                                            : 'heap limit unavailable'
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                                <Stat icon={Clock} label="Uptime" value={duration(metrics.process?.uptimeSeconds)} />
                                <Stat icon={Cpu} label="CPU cores" value={metrics.system?.cpuCores ?? 'not measurable'}
                                    hint={metrics.system?.loadAverage?.one != null ? `load ${metrics.system.loadAverage.one.toFixed(2)} (1m)` : undefined}
                                    tone="violet" />
                                <Stat icon={MemoryStick} label="RSS" value={formatBytes(metrics.process?.rssBytes)} />
                                <Stat icon={Server} label="Node" value={metrics.process?.nodeVersion || 'not measurable'}
                                    hint={[metrics.system?.platform, metrics.system?.arch].filter(Boolean).join(' · ') || undefined} />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                <Database size={18} className="text-cyan-400" /> Database
                            </h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${metrics.database?.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-sm font-medium text-white capitalize">{metrics.database?.state || 'unknown'}</span>
                                </div>
                                {metrics.database?.name && (
                                    <span className="text-sm text-slate-400">database: <span className="text-white">{metrics.database.name}</span></span>
                                )}
                                <span className="text-sm text-slate-400">
                                    documents: <span className="text-white">
                                        {Number.isFinite(metrics.database?.documentCount)
                                            ? metrics.database.documentCount.toLocaleString()
                                            : 'not measurable'}
                                    </span>
                                </span>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                <FolderOpen size={18} className="text-cyan-400" /> File inventory
                            </h2>
                            {resourcesError ? (
                                <p className="text-sm text-amber-400">{resourcesError}</p>
                            ) : resources ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-400">
                                        <span className="text-white font-medium">{resources.totalItems}</span> files ·{' '}
                                        <span className="text-white font-medium">{formatBytes(resources.totalBytes)}</span>
                                        {resources.truncated && <span className="text-amber-400"> · list truncated</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(resources.categories || []).map(category => (
                                            <span key={category.id}
                                                className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-slate-300">
                                                {category.label} <span className="text-white font-medium">{category.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-500">{resources.note}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Loader2 size={14} className="animate-spin" /> Reading inventory…
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* --------------------------------------------- side rail --- */}
                    <div className="space-y-4">
                        <Card>
                            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                <HardDrive size={18} className="text-cyan-400" /> This browser
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">localStorage</span>
                                    <span className="text-white">
                                        {storage.localStorage.available
                                            ? `${storage.localStorage.keys} keys · ${formatBytes(storage.localStorage.bytes)}`
                                            : 'not measurable'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">sessionStorage</span>
                                    <span className="text-white">
                                        {storage.sessionStorage.available
                                            ? `${storage.sessionStorage.keys} keys · ${formatBytes(storage.sessionStorage.bytes)}`
                                            : 'not measurable'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Response cache</span>
                                    <span className="text-white">{storage.apiCache.entries} entries</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Cache hit rate</span>
                                    <span className="text-white">
                                        {storage.apiCache.hits + storage.apiCache.misses === 0
                                            ? 'no lookups yet'
                                            : `${(storage.apiCache.hitRate * 100).toFixed(0)}%`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Unsent review drafts</span>
                                    <span className={storage.reviewOutbox.pending > 0 ? 'text-amber-400' : 'text-white'}>
                                        {storage.reviewOutbox.available ? storage.reviewOutbox.pending : 'not measurable'}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                                <Layers size={18} className="text-cyan-400" /> Response cache
                            </h2>
                            <p className="text-xs text-slate-500 mb-3">Server-side, owner-only</p>
                            {metrics.cache?.responseCache ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">In-memory entries</span>
                                        <span className="text-white">
                                            {Number.isFinite(metrics.cache.responseCache.memoryEntries)
                                                ? metrics.cache.responseCache.memoryEntries
                                                : 'not measurable'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Redis</span>
                                        <span className="text-white">
                                            {metrics.cache.responseCache.redisEnabled
                                                ? (metrics.cache.responseCache.redisConnected ? 'connected' : 'enabled, disconnected')
                                                : 'not configured'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Dashboard caches</span>
                                        <span className="text-white">
                                            {Object.entries(metrics.cache.dashboard || {})
                                                .filter(([, value]) => value === 'fresh').length} fresh
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">No response-cache statistics available.</p>
                            )}
                        </Card>
                    </div>
                </div>
            ) : null}

            {/* ------------------------------------------------ cache cleaner --- */}
            <Card>
                <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                    <Trash2 size={18} className="text-cyan-400" /> Cache cleaner
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                    Sign-in state and unsaved CV drafts are never removed. Unsent review drafts need an explicit opt-in.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {CACHE_SURFACES.map(surface => (
                        <div key={surface.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white">{surface.label}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    surface.scope === 'server' ? 'bg-violet-500/20 text-violet-300' : 'bg-cyan-500/20 text-cyan-300'
                                }`}>
                                    {surface.scope}
                                </span>
                                {surface.destructive && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                        destructive
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{surface.description}</p>
                        </div>
                    ))}
                </div>

                <label className="flex items-start gap-2 mb-4 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={allowDestructive}
                        onChange={event => setAllowDestructive(event.target.checked)}
                        className="mt-0.5"
                    />
                    <span>
                        Also discard unsent review drafts
                        <span className="block text-[11px] text-slate-500">
                            Those drafts have not reached the server and cannot be recovered.
                        </span>
                    </span>
                </label>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={runClientPurge}
                        disabled={purging}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        {purging ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Clear browser caches
                    </button>
                    <button
                        type="button"
                        onClick={runServerPurge}
                        disabled={purging}
                        className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        {purging ? <Loader2 size={16} className="animate-spin" /> : <Server size={16} />}
                        Clear server caches
                    </button>
                </div>

                {purgeResults && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-white">
                            Browser purge: <span className="capitalize">{purgeResults.summary.status}</span>
                            <span className="text-slate-400 font-normal">
                                {' '}({purgeResults.summary.cleared} of {purgeResults.summary.total} surfaces)
                            </span>
                        </p>
                        <ul className="space-y-1">
                            {purgeResults.results.map(result => (
                                <li key={result.id} className="flex items-start gap-2 text-xs">
                                    {result.status === 'cleared'
                                        ? <CheckCircle2 size={13} className="text-emerald-400 mt-0.5" />
                                        : result.status === 'skipped'
                                            ? <Info size={13} className="text-slate-400 mt-0.5" />
                                            : <AlertTriangle size={13} className="text-amber-400 mt-0.5" />}
                                    <span className="text-slate-400">
                                        <span className="text-slate-200">{result.label}:</span> {result.detail}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {serverPurgeResult && (
                    <div className="mt-4 space-y-2">
                        {serverPurgeResult.error ? (
                            <p className="text-sm text-amber-400">{serverPurgeResult.error}</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-white">
                                    Server purge at {new Date(serverPurgeResult.purgedAt).toLocaleTimeString()}
                                </p>
                                <ul className="space-y-1">
                                    {serverPurgeResult.results.map(result => (
                                        <li key={result.id} className="flex items-start gap-2 text-xs">
                                            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5" />
                                            <span className="text-slate-400">
                                                <span className="text-slate-200">{result.label}:</span> {result.detail}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SystemMonitorPage;
