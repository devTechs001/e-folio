/**
 * Resources dashboard page (owner-only).
 *
 * The file inventory comes from `/api/admin/resources`, which scans an
 * allowlisted set of local directories and returns metadata only (no contents,
 * no real `.env` files, no private uploads). Security references come from the
 * local `src/data/securityResources.json`; external URLs are links, never
 * fetched by this app.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FolderOpen, FileText, Search, RefreshCw, Download, Copy, Loader2,
    AlertCircle, ShieldCheck, ExternalLink, Lock, HardDrive, Layers, BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import securityResources from '../../data/securityResources.json';

const formatBytes = value => {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5 ${className}`}>{children}</div>
);

const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ResourcesPage = () => {
    const { isOwner } = useAuth();
    const owner = typeof isOwner === 'function' ? isOwner() : false;
    const { success, error: showError } = useNotifications();

    const [tab, setTab] = useState('files');
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiService.getResources();
            if (!response?.success) {
                setInventory(null);
                setError(response?.message || 'Resource inventory API is unavailable.');
            } else {
                setInventory(response.data);
            }
        } catch (err) {
            setInventory(null);
            setError(err?.message || 'Resource inventory API is unavailable.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (owner) load(); }, [owner, load]);

    const copy = async value => {
        try {
            await navigator.clipboard.writeText(value);
            success('Copied to clipboard.');
        } catch {
            showError('Clipboard access was blocked.');
        }
    };

    const filtered = useMemo(() => {
        const items = inventory?.items || [];
        const term = search.trim().toLowerCase();
        return items.filter(item =>
            (category === 'all' || item.category === category) &&
            (!term || item.path.toLowerCase().includes(term) || item.categoryLabel.toLowerCase().includes(term))
        );
    }, [inventory, search, category]);

    const exportInventory = format => {
        if (!inventory) return;
        if (format === 'json') {
            downloadFile(JSON.stringify(inventory, null, 2), 'resource-inventory.json', 'application/json');
        } else {
            const rows = [
                ['path', 'category', 'sizeBytes', 'modifiedAt', 'extension'].join(','),
                ...(inventory.items || []).map(item => [
                    item.path, item.category, item.sizeBytes, item.modifiedAt, item.extension
                ].map(csvCell).join(','))
            ].join('\n');
            downloadFile(rows, 'resource-inventory.csv', 'text/csv');
        }
        success(`${format.toUpperCase()} inventory downloaded.`);
    };

    if (!owner) {
        return (
            <div className="p-6 lg:p-8">
                <Card className="border-amber-500/40">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} /> Owner access required</h1>
                    <p className="text-slate-400 text-sm mt-2">The resource inventory is an owner-only API. No files were listed.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-900/40">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <FolderOpen size={26} className="text-purple-400" /> Resources
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                        Local documentation, backups, scripts, tests, data samples and curated security references.
                        Only file metadata is listed; contents and secrets stay in the workspace.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={load} disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh
                    </button>
                    <Link to="/dashboard/security-audit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400">
                        <ShieldCheck size={15} /> Security Audit
                    </Link>
                </div>
            </div>

            <Card className="border-cyan-500/30">
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><Layers size={13} /> {inventory?.totalItems ?? '—'} files</span>
                    <span className="inline-flex items-center gap-1.5"><HardDrive size={13} /> {inventory ? formatBytes(inventory.totalBytes) : '—'}</span>
                    <span className="inline-flex items-center gap-1.5"><BookOpen size={13} /> {inventory?.categories?.length ?? '—'} groups</span>
                    <span>Generated {formatDate(inventory?.generatedAt)}</span>
                    <span className="text-slate-500">{inventory?.mode || '—'}</span>
                </div>
                {inventory?.note && <p className="text-[11px] text-slate-500 mt-2">{inventory.note}</p>}
            </Card>

            {error && (
                <Card className="border-rose-500/40">
                    <div className="flex items-center gap-2 text-sm text-rose-300"><AlertCircle size={16} /> {error}</div>
                </Card>
            )}
            {inventory?.truncated && (
                <Card className="border-amber-500/40">
                    <div className="flex items-center gap-2 text-sm text-amber-300">
                        <AlertCircle size={16} /> Showing {inventory.returnedItems} of {inventory.totalItems} files (server cap). Narrow the category filter.
                    </div>
                </Card>
            )}

            <div className="flex flex-wrap gap-2 border-b border-slate-700/60 pb-3">
                {[
                    { id: 'files', label: 'Workspace files', icon: FileText },
                    { id: 'references', label: 'Security references', icon: BookOpen }
                ].map(item => {
                    const Icon = item.icon;
                    return (
                        <button key={item.id} type="button" onClick={() => setTab(item.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === item.id
                                    ? 'bg-purple-500/15 text-purple-200 border border-purple-500/40'
                                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-700'}`}>
                            <Icon size={15} /> {item.label}
                        </button>
                    );
                })}
            </div>

            {/* ---------------------------- WORKSPACE FILES --------------------------- */}
            {tab === 'files' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {(inventory?.categories || []).map(group => (
                            <button key={group.id} type="button" onClick={() => setCategory(category === group.id ? 'all' : group.id)}
                                    className={`text-left p-3 rounded-xl border transition-colors ${category === group.id ? 'bg-purple-500/15 border-purple-500/40' : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40'}`}>
                                <div className="text-xs font-semibold text-slate-200">{group.label}</div>
                                <div className="text-lg font-bold text-white mt-1">{group.count}</div>
                                <div className="text-[11px] text-slate-500">{formatBytes(group.bytes)}</div>
                            </button>
                        ))}
                    </div>

                    <Card>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 rounded-lg bg-slate-900/70 border border-slate-700">
                                <Search size={15} className="text-slate-500" />
                                <input className="w-full py-2.5 bg-transparent text-slate-100 text-sm focus:outline-none"
                                       placeholder="Filter by path or category" value={search}
                                       onChange={event => setSearch(event.target.value)} />
                            </div>
                            <select value={category} onChange={event => setCategory(event.target.value)}
                                    className="px-3 py-2.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 text-sm focus:border-cyan-400 focus:outline-none">
                                <option value="all">All categories</option>
                                {(inventory?.categories || []).map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
                            </select>
                            <button type="button" onClick={() => exportInventory('json')} disabled={!inventory}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400 disabled:opacity-50">
                                <Download size={14} /> JSON
                            </button>
                            <button type="button" onClick={() => exportInventory('csv')} disabled={!inventory}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400 disabled:opacity-50">
                                <Download size={14} /> CSV
                            </button>
                        </div>

                        {loading && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Reading local inventory…</p>}
                        {!loading && !inventory && <p className="text-sm text-slate-500">No inventory data available.</p>}
                        {!loading && inventory && filtered.length === 0 && <p className="text-sm text-slate-500">No files match this filter.</p>}

                        {filtered.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-700/60">
                                            <th className="py-2 pr-3 font-semibold">Path</th>
                                            <th className="py-2 pr-3 font-semibold">Group</th>
                                            <th className="py-2 pr-3 font-semibold">Size</th>
                                            <th className="py-2 pr-3 font-semibold">Modified</th>
                                            <th className="py-2 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(item => (
                                            <tr key={item.path} className="border-b border-slate-700/30 hover:bg-slate-700/10">
                                                <td className="py-2.5 pr-3 text-slate-200"><span className="inline-flex items-start gap-1.5"><FileText size={12} className="text-purple-400 mt-0.5 shrink-0" /><code className="break-all">{item.path}</code></span></td>
                                                <td className="py-2.5 pr-3 text-slate-400">{item.categoryLabel}</td>
                                                <td className="py-2.5 pr-3 text-slate-400">{formatBytes(item.sizeBytes)}</td>
                                                <td className="py-2.5 pr-3 text-slate-500">{formatDate(item.modifiedAt)}</td>
                                                <td className="py-2.5">
                                                    <button type="button" onClick={() => copy(item.path)} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200" aria-label={`Copy ${item.path}`}>
                                                        <Copy size={12} /> Copy path
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* --------------------------- SECURITY REFERENCES ------------------------ */}
            {tab === 'references' && (
                <div className="space-y-6">
                    <Card className="border-cyan-500/30">
                        <p className="text-xs text-slate-400">{securityResources.description}</p>
                        <p className="text-[11px] text-slate-500 mt-2">External links are never fetched by this app; they only open in a new tab.</p>
                        <Link to="/dashboard/security-audit" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:underline mt-2">
                            Back to the Security Audit findings <ShieldCheck size={13} />
                        </Link>
                    </Card>

                    {securityResources.categories.map(group => {
                        const refs = securityResources.references.filter(ref => ref.category === group.id);
                        if (!refs.length) return null;
                        return (
                            <Card key={group.id}>
                                <h3 className="text-sm font-semibold text-white mb-3">{group.label} · {refs.length}</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {refs.map(ref => ref.kind === 'external' ? (
                                        <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
                                           className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60 hover:border-cyan-500/50 transition-colors">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                                                <ExternalLink size={13} className="text-cyan-400" /> {ref.title}
                                                <span className="ml-auto text-[10px] uppercase text-slate-500">external</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">{ref.description}</p>
                                            <p className="text-[11px] text-cyan-300/80 mt-1 break-all">{ref.url}</p>
                                        </a>
                                    ) : (
                                        <div key={ref.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <FileText size={13} className="text-purple-400" />
                                                <span className="text-xs font-semibold text-slate-200">{ref.title}</span>
                                                <button type="button" onClick={() => copy(ref.path)} className="ml-auto text-cyan-300 hover:text-cyan-200" aria-label={`Copy ${ref.path}`}>
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">{ref.description}</p>
                                            <code className="text-[11px] text-slate-500 break-all">{ref.path}</code>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResourcesPage;
