/**
 * Security Audit dashboard page (owner-only).
 *
 * Every figure comes from the real owner-only API
 * `/api/admin/security-audit`, which re-runs the offline static audit in this
 * checkout, and `/api/admin/security-controls`, which inspects local source.
 * No live/external probing, no invented findings, no secret values.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, ShieldAlert, Shield, RefreshCw, Download, Loader2,
    AlertCircle, CheckCircle2, XCircle, FileText, ExternalLink, Copy,
    Clock, Server, BookOpen, Lock, WifiOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import securityResources from '../../data/securityResources.json';

const SEVERITY = {
    HIGH: { tone: 'bg-rose-500/10 border-rose-500/40 text-rose-300', icon: XCircle },
    MEDIUM: { tone: 'bg-amber-500/10 border-amber-500/40 text-amber-300', icon: AlertCircle },
    LOW: { tone: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300', icon: Shield },
    PASS: { tone: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300', icon: CheckCircle2 }
};

const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 ${className}`}>{children}</div>
);

const downloadJson = (value, filename) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const SecurityAuditDashboard = () => {
    const { isOwner } = useAuth();
    const owner = typeof isOwner === 'function' ? isOwner() : false;
    const { success, error: showError } = useNotifications();

    const [tab, setTab] = useState('findings');
    const [audit, setAudit] = useState(null);
    const [controls, setControls] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async (force = false) => {
        if (force) setRefreshing(true); else setLoading(true);
        setError('');
        const [auditResult, controlsResult] = await Promise.allSettled([
            apiService.getSecurityAudit(force ? { refresh: '1' } : {}),
            apiService.getSecurityControls()
        ]);
        const auditResponse = auditResult.status === 'fulfilled' ? auditResult.value : null;
        const controlsResponse = controlsResult.status === 'fulfilled' ? controlsResult.value : null;

        if (auditResponse?.success) setAudit(auditResponse.data);
        else if (!auditResponse?.success) {
            setAudit(null);
            setError(auditResponse?.message || 'Security audit API is unavailable.');
        }
        setControls(controlsResponse?.success ? controlsResponse.data : null);
        if (!controlsResponse?.success) {
            setError(prev => prev || 'Security controls API is unavailable.');
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { if (owner) load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [owner]);

    const copyPath = async value => {
        try {
            await navigator.clipboard.writeText(value);
            success('Path copied.');
        } catch {
            showError('Clipboard access was blocked.');
        }
    };

    const findings = audit?.findings || [];
    const externalRefs = useMemo(() => securityResources.references.filter(ref => ref.kind === 'external'), []);
    const internalRefs = useMemo(() => securityResources.references.filter(ref => ref.kind === 'internal'), []);

    if (!owner) {
        return (
            <div className="p-6 lg:p-8">
                <Card className="border-amber-500/40">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} /> Owner access required</h1>
                    <p className="text-slate-400 text-sm mt-2">The security audit and resource inventory are owner-only APIs. No data was loaded.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-900/40">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck size={26} className="text-emerald-400" /> Security Audit
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                        Offline static analysis of this checkout: tracked secrets, hard-coded credentials, JWT handling,
                        server hardening, undeclared dependencies, mutations, fabricated content and owner guards.
                        No live or external testing is performed.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => load(true)} disabled={refreshing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50">
                        {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Run audit again
                    </button>
                    <button type="button" onClick={() => {
                        if (!audit) return;
                        downloadJson(audit, 'security-audit.json');
                        success('Audit JSON downloaded.');
                    }} disabled={!audit}
                       className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400 disabled:opacity-50">
                        <Download size={15} /> Export JSON
                    </button>
                    <Link to="/dashboard/resources" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400">
                        <BookOpen size={15} /> Resources
                    </Link>
                </div>
            </div>

            {/* Status strip */}
            <Card className="border-cyan-500/30">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Last run: {formatDate(audit?.generatedAt)}</span>
                    <span className="inline-flex items-center gap-1.5"><Server size={13} /> {audit?.mode || 'not run'} · {audit?.source || '—'}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${audit?.cached ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'}`}>
                        {audit?.cached ? 'Cached result (60s)' : 'Fresh run'}
                    </span>
                    <span>{audit?.durationMs != null ? `${audit.durationMs} ms` : '—'} · {audit?.checksRun?.length || 0} checks</span>
                </div>
                {audit?.note && <p className="text-[11px] text-slate-500 mt-2">{audit.note}</p>}
            </Card>

            {error && (
                <Card className="border-rose-500/40">
                    <div className="flex items-center gap-2 text-sm text-rose-300"><AlertCircle size={16} /> {error}</div>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-700/60 pb-3">
                {[
                    { id: 'findings', label: 'Findings', icon: ShieldAlert },
                    { id: 'controls', label: 'Controls', icon: Shield },
                    { id: 'resources', label: 'Resources', icon: BookOpen }
                ].map(item => {
                    const Icon = item.icon;
                    return (
                        <button key={item.id} type="button" onClick={() => setTab(item.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === item.id
                                    ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40'
                                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-700'}`}>
                            <Icon size={15} /> {item.label}
                            {item.id === 'findings' && findings.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">{findings.length}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading && !audit && (
                <Card><p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Running the offline audit…</p></Card>
            )}

            {/* ------------------------------- FINDINGS ------------------------------- */}
            {tab === 'findings' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {['HIGH', 'MEDIUM', 'LOW'].map(severity => {
                            const style = SEVERITY[severity];
                            const Icon = style.icon;
                            const value = audit?.[severity.toLowerCase()];
                            return (
                                <Card key={severity} className={style.tone}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-wider">{severity}</span>
                                        <Icon size={18} />
                                    </div>
                                    <div className="text-3xl font-bold mt-2">{value == null ? '—' : value}</div>
                                    <div className="text-[11px] mt-1 opacity-80">findings from the real audit</div>
                                </Card>
                            );
                        })}
                    </div>

                    <Card>
                        <h2 className="text-lg font-semibold text-white mb-1">Audit findings</h2>
                        <p className="text-xs text-slate-400 mb-4">Sorted by severity. Locations are local file paths, never secret values.</p>
                        {!audit && !loading && <p className="text-sm text-slate-500">No audit data. Run the audit again.</p>}
                        {audit && findings.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-emerald-300">
                                <CheckCircle2 size={17} /> No findings. All static checks passed.
                            </div>
                        )}
                        <div className="space-y-3">
                            {findings.map((finding, index) => {
                                const style = SEVERITY[finding.severity] || SEVERITY.LOW;
                                const Icon = style.icon;
                                return (
                                    <div key={`${finding.category}-${index}`} className={`p-4 rounded-lg border ${style.tone}`}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Icon size={15} />
                                            <span className="text-xs font-bold">{finding.severity}</span>
                                            <span className="text-xs uppercase tracking-wide opacity-80">{finding.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-100 mt-2">{finding.message}</p>
                                        {(finding.locations || []).length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {finding.locations.map(location => (
                                                    <li key={location} className="text-[11px] text-slate-400 flex items-center gap-2">
                                                        <FileText size={11} /> <code className="break-all">{location}</code>
                                                        <button type="button" onClick={() => copyPath(location)} className="text-cyan-300 hover:text-cyan-200" aria-label={`Copy ${location}`}>
                                                            <Copy size={11} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {audit?.checksRun?.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-white mb-3">Checks performed</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {audit.checksRun.map(name => (
                                    <div key={name} className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> {name}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ------------------------------- CONTROLS ------------------------------- */}
            {tab === 'controls' && (
                <div className="space-y-6">
                    <Card className="border-cyan-500/30">
                        <h2 className="text-lg font-semibold text-white mb-1">Runtime-facing controls</h2>
                        <p className="text-xs text-slate-400 mb-3">{controls?.note || 'Control data unavailable.'}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700">{controls ? `${controls.enabledCount}/${controls.total} detected` : '—'}</span>
                            <span className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700">Environment: {controls?.environment?.production ? 'production' : 'development'}</span>
                            <span className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700">Config issues: {controls?.configurationIssueCount ?? '—'}</span>
                        </div>
                    </Card>

                    {controls?.environment && (
                        <Card>
                            <h3 className="text-sm font-semibold text-white mb-3">Environment presence (values never shown)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(controls.environment).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/60 text-xs">
                                        <span className="text-slate-400 break-all">{key}</span>
                                        <span className={typeof value === 'boolean' ? (value ? 'text-emerald-300' : 'text-amber-300') : 'text-cyan-300'}>
                                            {typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card>
                        <h3 className="text-sm font-semibold text-white mb-3">Detected controls</h3>
                        {!controls && <p className="text-sm text-slate-500">Controls API unavailable.</p>}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            {(controls?.controls || []).map(control => (
                                <div key={control.id} className={`p-3 rounded-lg border ${control.enabled ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-amber-500/5 border-amber-500/25'}`}>
                                    <div className="flex items-center gap-2">
                                        {control.enabled ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-amber-400" />}
                                        <span className="text-xs font-semibold text-slate-200">{control.label}</span>
                                        <span className="ml-auto text-[10px] uppercase text-slate-500">{control.enabled ? 'detected' : 'not detected'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">{control.detail}</p>
                                    <button type="button" onClick={() => copyPath(control.source)} className="text-[11px] text-cyan-300 hover:underline mt-1 inline-flex items-center gap-1">
                                        <FileText size={10} /> {control.source} <Copy size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ------------------------------- RESOURCES ------------------------------ */}
            {tab === 'resources' && (
                <div className="space-y-6">
                    <Card className="border-purple-500/30">
                        <h2 className="text-lg font-semibold text-white mb-1">Security resources</h2>
                        <p className="text-xs text-slate-400 mb-3">
                            {securityResources.description} External links are never fetched by this app.
                        </p>
                        <Link to="/dashboard/resources" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:underline">
                            Open the full Resources page (local file inventory) <ExternalLink size={13} />
                        </Link>
                    </Card>

                    {securityResources.categories.filter(category => category.id !== 'internal').map(category => (
                        <Card key={category.id}>
                            <h3 className="text-sm font-semibold text-white mb-3">{category.label}</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                {externalRefs.filter(ref => ref.category === category.id).map(ref => (
                                    <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
                                       className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60 hover:border-cyan-500/50 transition-colors">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                                            <ExternalLink size={13} className="text-cyan-400" /> {ref.title}
                                            <span className="ml-auto text-[10px] uppercase text-slate-500">external</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">{ref.description}</p>
                                        <p className="text-[11px] text-cyan-300/80 mt-1 break-all">{ref.url}</p>
                                    </a>
                                ))}
                            </div>
                        </Card>
                    ))}

                    <Card>
                        <h3 className="text-sm font-semibold text-white mb-3">Project-internal resources</h3>
                        <div className="space-y-2">
                            {internalRefs.map(ref => (
                                <div key={ref.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <FileText size={13} className="text-purple-400" />
                                        <span className="text-xs font-semibold text-slate-200">{ref.title}</span>
                                        <button type="button" onClick={() => copyPath(ref.path)} className="ml-auto text-cyan-300 hover:text-cyan-200" aria-label={`Copy ${ref.path}`}>
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">{ref.description}</p>
                                    <code className="text-[11px] text-slate-500 break-all">{ref.path}</code>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5"><WifiOff size={12} /> Local files only — contents are not loaded by this page.</p>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SecurityAuditDashboard;
