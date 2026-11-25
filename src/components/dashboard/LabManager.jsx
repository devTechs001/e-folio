import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FlaskConical, RefreshCw, Trash2, Plus, AlertCircle, CheckCircle2,
    Terminal, ArrowUpRight, Save, FolderGit2, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import { publishLabChanged } from '../../utils/projectSync';
import DashboardLayout from './DashboardLayout';

/**
 * Phase 42 — Lab dashboard.
 *
 * The Lab is its own module: it reads and writes `LabEntry` records through
 * `/api/lab` and never touches the Project collection. Before this it listed
 * portfolio projects and filtered them by status, so it effectively *was* the
 * Projects dashboard with a different filter — the source of the two modules
 * fighting over the same records.
 *
 * The "real projects" counter is gone on purpose: portfolio projects are not
 * this dashboard's business. The link to /dashboard/projects is a navigation
 * aid, not a shared data source.
 */

const LAB_STATUSES = ['development', 'experimental', 'beta', 'live', 'archived'];
const LAB_DOMAINS = [
    'Reconnaissance', 'Network Security', 'Web Security', 'Cloud Security',
    'Wireless Security', 'Systems & Active Directory', 'Malware Analysis',
    'Digital Forensics', 'Blue Team', 'Tooling'
];

const STATUS_LABELS = {
    development: 'In development',
    experimental: 'Experimental',
    beta: 'Beta',
    live: 'Running',
    archived: 'Archived'
};

/**
 * Resolve the poster a Lab card will show, exactly the way the public page and
 * the public API do. Keeping one rule here is what makes the dashboard preview
 * and the published card agree.
 */
const posterOf = (project) =>
    project?.thumbnail || project?.imageUrl || project?.images?.[0]?.url || '';

const blankDraft = () => ({
    title: '',
    summary: '',
    domain: 'Tooling',
    status: 'development',
    environment: '',
    scope: '',
    tools: '',
    description: ''
});

const LabManager = () => {
    const { isOwner: checkOwner } = useAuth();
    const owner = typeof checkOwner === 'function' ? checkOwner() : false;
    const { success: notifySuccess, error: notifyError } = useNotifications();

    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [draft, setDraft] = useState(blankDraft);
    const [showForm, setShowForm] = useState(false);
    const [posterDrafts, setPosterDrafts] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [list, statsResponse] = await Promise.all([
                ApiService.getLabEntries(),
                ApiService.getLabStats()
            ]);
            setEntries(Array.isArray(list?.experiments) ? list.experiments : []);
            setStats(statsResponse?.success ? statsResponse : null);
            setNotice(list?.success === false
                ? 'Lab entries could not be loaded. Check the API connection and retry.'
                : '');
        } catch {
            setNotice('Lab entries could not be loaded. Check the API connection and retry.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const seededCount = useMemo(() => entries.filter(entry => entry.seedKey).length, [entries]);

    const createEntry = async (event) => {
        event.preventDefault();
        if (!owner) return;
        if (!draft.title.trim() || !draft.summary.trim()) {
            notifyError?.('A title and a short summary are required.');
            return;
        }
        setBusy(true);
        try {
            const response = await ApiService.createLabEntry({
                ...draft,
                tools: draft.tools.split(',').map(t => t.trim()).filter(Boolean)
            });
            if (response?.success === false) throw new Error(response.message || 'Could not create the entry');
            publishLabChanged();
            notifySuccess?.('Lab experiment added.');
            setDraft(blankDraft());
            setShowForm(false);
            await load();
        } catch (error) {
            notifyError?.(error?.message || 'Could not create the entry.');
        } finally {
            setBusy(false);
        }
    };

    const removeEntry = async (entry) => {
        if (!owner) return;
        if (!window.confirm(`Delete "${entry.title}" from the Lab?\n\nThis removes the lab entry only — no portfolio project is affected.`)) return;
        setBusy(true);
        try {
            const response = await ApiService.deleteLabEntry(entry._id || entry.id);
            if (response?.success === false) throw new Error(response.message || 'Delete failed');
            publishLabChanged();
            notifySuccess?.('Lab experiment deleted.');
            await load();
        } catch (error) {
            notifyError?.(error?.message || 'Could not delete the entry.');
        } finally {
            setBusy(false);
        }
    };

    /**
     * Set the poster image a Lab card renders. Phase 42: this writes to the
     * LabEntry's own `thumbnail` through the Lab API — it used to write to a
     * Project document, which is exactly the coupling this phase removed.
     */
    const savePoster = async (entry) => {
        if (!owner) return;
        const id = entry._id || entry.id;
        if (!id) return;
        const value = String(posterDrafts[id] ?? posterOf(entry));
        setBusy(true);
        try {
            const response = await ApiService.updateLabEntry(id, { thumbnail: value.trim() });
            if (response?.success === false) throw new Error(response.message || 'Could not save the image');
            notifySuccess('Card image saved — the public Lab card uses it now.');
            window.dispatchEvent(new CustomEvent('settingsChanged'));
            publishLabChanged();
            await load();
        } catch (error) {
            notifyError?.(error?.message || 'Could not save the image.');
        } finally {
            setBusy(false);
        }
    };

    const statusCounts = useMemo(() => {
        const counts = Object.fromEntries(LAB_STATUSES.map(status => [status, 0]));
        for (const entry of entries) {
            const status = String(entry.status || '').toLowerCase();
            if (counts[status] !== undefined) counts[status] += 1;
        }
        return counts;
    }, [entries]);

    const statCards = [
        { label: 'Lab experiments', value: entries.length, icon: FlaskConical },
        { label: 'Running', value: statusCounts.live, icon: CheckCircle2 },
        { label: 'In progress', value: statusCounts.development + statusCounts.experimental, icon: Terminal },
        { label: 'Seeded records', value: seededCount, icon: Save }
    ];

    return (
        <DashboardLayout
            title="Lab"
            description="Cybersecurity operations — experiments, builds and research."
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FlaskConical size={22} className="text-cyan-400" />
                            Security Lab
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            A separate module from portfolio projects, with its own records.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/lab"
                            className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                            <ExternalLink size={14} /> View public page
                        </Link>
                        <button
                            onClick={load}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-500 transition"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowForm(v => !v)}
                            disabled={!owner || busy}
                            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition disabled:opacity-50"
                        >
                            <Plus size={14} /> New experiment
                        </button>
                    </div>
                </div>

                {notice && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{notice}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map(({ label, value, icon }) => (
                        <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                            {React.createElement(icon, { size: 16, className: 'text-cyan-400' })}
                            <div className="mt-2 text-xl font-semibold text-white">{value}</div>
                            <div className="text-xs text-slate-400 mt-1">{label}</div>
                        </div>
                    ))}
                </div>

                {showForm && owner && (
                    <form onSubmit={createEntry} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                            <label className="text-sm text-slate-300">
                                Title
                                <input
                                    value={draft.title}
                                    onChange={e => setDraft({ ...draft, title: e.target.value })}
                                    maxLength={120}
                                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                    required
                                />
                            </label>
                            <label className="text-sm text-slate-300">
                                Domain
                                <select
                                    value={draft.domain}
                                    onChange={e => setDraft({ ...draft, domain: e.target.value })}
                                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                >
                                    {LAB_DOMAINS.map(domain => <option key={domain}>{domain}</option>)}
                                </select>
                            </label>
                        </div>
                        <label className="block text-sm text-slate-300">
                            Summary
                            <input
                                value={draft.summary}
                                onChange={e => setDraft({ ...draft, summary: e.target.value })}
                                maxLength={240}
                                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                required
                            />
                        </label>
                        <div className="grid md:grid-cols-3 gap-3">
                            <label className="text-sm text-slate-300">
                                Status
                                <select
                                    value={draft.status}
                                    onChange={e => setDraft({ ...draft, status: e.target.value })}
                                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                >
                                    {LAB_STATUSES.map(status => (
                                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm text-slate-300">
                                Environment
                                <input
                                    value={draft.environment}
                                    onChange={e => setDraft({ ...draft, environment: e.target.value })}
                                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                />
                            </label>
                            <label className="text-sm text-slate-300">
                                Scope
                                <input
                                    value={draft.scope}
                                    onChange={e => setDraft({ ...draft, scope: e.target.value })}
                                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                                />
                            </label>
                        </div>
                        <label className="block text-sm text-slate-300">
                            Tools (comma separated)
                            <input
                                value={draft.tools}
                                onChange={e => setDraft({ ...draft, tools: e.target.value })}
                                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                            />
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                            >
                                <Plus size={14} /> Add experiment
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setDraft(blankDraft()); }}
                                className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <h2 className="text-sm font-semibold text-white">Experiments</h2>
                        <span className="text-xs text-slate-500">
                            {stats?.total !== undefined ? `${stats.total} in the collection` : '—'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">Loading experiments…</div>
                    ) : entries.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                            No lab experiments yet. Add one, or run{' '}
                            <code className="text-cyan-300">npm run seed:lab</code>.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800">
                            {entries.map(entry => (
                                <li key={entry._id || entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
                                    {posterOf(entry) ? (
                                        <img
                                            src={posterOf(entry)}
                                            alt=""
                                            className="h-12 w-16 shrink-0 rounded object-cover border border-slate-800"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="h-12 w-16 shrink-0 rounded border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600">
                                            <FlaskConical size={16} />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-white truncate">{entry.title}</span>
                                            <span className="text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-slate-800 text-cyan-300">
                                                {STATUS_LABELS[entry.status] || entry.status}
                                            </span>
                                            {entry.seedKey && (
                                                <span className="text-[11px] rounded px-1.5 py-0.5 bg-slate-800 text-slate-400">
                                                    seeded
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">{entry.summary}</p>
                                        <div className="mt-1 text-[11px] text-slate-500">
                                            {entry.domain}
                                            {entry.environment ? ` · ${entry.environment}` : ''}
                                        </div>
                                        {owner && (
                                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 mt-2 pt-2">
                                                <label className="sr-only" htmlFor={`poster-${entry._id || entry.id}`}>
                                                    Card image URL for {entry.title}
                                                </label>
                                                <input
                                                    id={`poster-${entry._id || entry.id}`}
                                                    aria-label={`Card image URL for ${entry.title}`}
                                                    value={posterDrafts[entry._id || entry.id] ?? posterOf(entry)}
                                                    onChange={e => setPosterDrafts(prev => ({
                                                        ...prev,
                                                        [entry._id || entry.id]: e.target.value
                                                    }))}
                                                    placeholder="https://… card image URL"
                                                    className="flex-1 min-w-0 rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => savePoster(entry)}
                                                    disabled={busy}
                                                    className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-cyan-500 disabled:opacity-50"
                                                >
                                                    Save image
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Link
                                            to="/lab"
                                            className="p-1.5 rounded text-slate-400 hover:text-cyan-300"
                                            title="View on the public page"
                                        >
                                            <ArrowUpRight size={15} />
                                        </Link>
                                        <button
                                            onClick={() => removeEntry(entry)}
                                            disabled={!owner || busy}
                                            className="p-1.5 rounded text-slate-400 hover:text-red-400 disabled:opacity-40"
                                            title={owner ? 'Delete this experiment' : 'Owner access required'}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400 space-y-2">
                    <p className="flex items-start gap-2">
                        <FolderGit2 size={14} className="mt-0.5 shrink-0 text-slate-500" />
                        <span>
                            Portfolio projects are a separate module with their own records —
                            see <Link to="/dashboard/projects" className="text-cyan-400 hover:text-cyan-300">Projects</Link>.
                            Nothing here is a project and nothing here affects that list.
                        </span>
                    </p>
                    {!owner && (
                        <p className="flex items-start gap-2 text-amber-300/80">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>Owner access is required to add or delete experiments.</span>
                        </p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabManager;
