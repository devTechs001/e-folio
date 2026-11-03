/**
 * User Workspaces — create accounts, CVs and portfolios for other users.
 *
 * Every action hits a real API: registration, get-or-create CV/portfolio,
 * publish/unpublish, versions, templates, export, the owner user directory,
 * public per-user reads and DB-backed notifications. Empty/failed states are
 * reported honestly; there are no sample records or fabricated metrics.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
    UserPlus, FileText, Briefcase, Bell, Users, RefreshCw, Copy, ExternalLink,
    Check, X, Loader2, QrCode, Download, Send, Search, Shield, Mail,
    Calendar, AlertCircle, CheckCircle2, Trash2, Inbox, Wifi, WifiOff,
    Globe, Layers, RotateCcw, Sparkles, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import { useWorkspaceNotifications } from '../../hooks/useWorkspaceNotifications';
import {
    publicUserLinks, registrationLink, ensureUserWorkspace, buildWorkspaceChecklist,
    createAccountForAnotherUser, inspectUserWorkspace, notifyWorkspaceUser,
    downloadCVExport, copyToClipboard, publishUserPortfolio, unpublishUserPortfolio
} from '../../utils/userWorkspace';

const TABS = [
    { id: 'create', label: 'Create account', icon: UserPlus },
    { id: 'workspace', label: 'My CV & portfolio', icon: Briefcase },
    { id: 'users', label: 'Other users', icon: Users, ownerOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell }
];

const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const Badge = ({ ready, label }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ready
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
        {ready ? <Check size={12} /> : <X size={12} />} {label}
    </span>
);

const ActionButton = ({ onClick, disabled, children, tone = 'slate', title }) => {
    const tones = {
        slate: 'border-slate-600 text-slate-200 hover:border-cyan-400',
        cyan: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25',
        purple: 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25',
        emerald: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20',
        rose: 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
    };
    return (
        <button type="button" onClick={onClick} disabled={disabled} title={title}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]}`}>
            {children}
        </button>
    );
};

const Field = ({ label, name, value, onChange, type = 'text', placeholder, autoComplete }) => (
    <label className="block">
        <span className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</span>
        <input
            className="w-full px-3 py-2.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
            type={type} name={name} value={value} onChange={onChange}
            placeholder={placeholder} autoComplete={autoComplete}
        />
    </label>
);

const Panel = ({ title, description, children, accent = 'border-slate-700/50' }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border ${accent}`}>
        {title && <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>}
        {description && <p className="text-slate-400 text-xs sm:text-sm mb-4">{description}</p>}
        {children}
    </div>
);

const UserWorkspaceManager = () => {
    const { user, isOwner } = useAuth();
    const owner = typeof isOwner === 'function' ? isOwner() : false;
    const { success, error: showError, info } = useNotifications();
    const notifications = useWorkspaceNotifications(user?.id);

    const [activeTab, setActiveTab] = useState('create');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const tabs = useMemo(() => TABS.filter(tab => !tab.ownerOnly || owner), [owner]);

    /* ------------------------------ create account ------------------------ */
    const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
    const [created, setCreated] = useState(null);
    const [createBusy, setCreateBusy] = useState(false);

    const handleFormChange = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

    const submitAccount = async event => {
        event.preventDefault();
        setMessage('');
        if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.password) {
            setMessage('Name, username, email and password are required.');
            return;
        }
        if (form.password.length < 6) { setMessage('Password must be at least 6 characters.'); return; }
        if (form.password !== form.confirmPassword) { setMessage('Passwords do not match.'); return; }
        setCreateBusy(true);
        try {
            const result = await createAccountForAnotherUser({
                name: form.name.trim(), username: form.username.trim(),
                email: form.email.trim(), password: form.password
            });
            if (!result.success) { setMessage(result.message); return; }
            setCreated(result.user);
            setForm({ name: '', username: '', email: '', password: '', confirmPassword: '' });
            success(`Account created for @${result.user?.username}.`);
            notifications.refresh();
        } catch (error) {
            setMessage(error?.message || 'Registration failed.');
        } finally {
            setCreateBusy(false);
        }
    };

    const copy = async (text, label) => {
        const result = await copyToClipboard(text);
        if (result.success) success(`${label} copied.`);
        else showError(result.message || 'Clipboard access denied.');
    };

    /* ------------------------------- my workspace ------------------------ */
    const [workspace, setWorkspace] = useState(null);
    const [workspaceError, setWorkspaceError] = useState('');
    const [versions, setVersions] = useState({ cv: [], portfolio: [] });
    const [templates, setTemplates] = useState([]);
    const [versionName, setVersionName] = useState('');
    const [qr, setQr] = useState('');

    const loadWorkspace = useCallback(async () => {
        setBusy(true);
        setWorkspaceError('');
        try {
            const status = await ensureUserWorkspace();
            setWorkspace(status);
            if (status.errors.length) setWorkspaceError(status.errors.join('; '));
            const [cvVersions, portfolioVersions, templateList] = await Promise.allSettled([
                apiService.getCVVersions(),
                apiService.getPortfolioVersions(),
                apiService.getPortfolioTemplates()
            ]);
            setVersions({
                cv: cvVersions.status === 'fulfilled' && Array.isArray(cvVersions.value?.data) ? cvVersions.value.data : [],
                portfolio: portfolioVersions.status === 'fulfilled' && Array.isArray(portfolioVersions.value?.data) ? portfolioVersions.value.data : []
            });
            setTemplates(templateList.status === 'fulfilled' && Array.isArray(templateList.value?.data) ? templateList.value.data : []);
        } catch (error) {
            setWorkspaceError(error?.message || 'Could not load workspace records.');
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

    const runWorkspaceAction = async (fn, okMessage) => {
        setBusy(true);
        setWorkspaceError('');
        try {
            const response = await fn();
            if (response?.success === false) {
                setWorkspaceError(response.message || 'The API rejected the request.');
                showError(response.message || 'The API rejected the request.');
            } else {
                if (okMessage) success(okMessage);
                await loadWorkspace();
            }
        } catch (error) {
            setWorkspaceError(error?.message || 'Action failed.');
            showError(error?.message || 'Action failed.');
        } finally {
            setBusy(false);
        }
    };

    const checklist = workspace ? buildWorkspaceChecklist(workspace.cv, workspace.portfolio) : null;
    const links = publicUserLinks(user?.username);
    const portfolioResponse = workspace?.portfolio;
    const isPublished = Boolean(portfolioResponse?.isPublished);

    const showQr = async () => {
        if (!links.portfolio) return;
        try {
            setQr(await QRCode.toDataURL(`${window.location.origin}${links.portfolio}`, { width: 220, margin: 1 }));
        } catch {
            showError('Could not generate the QR code.');
        }
    };

    /* -------------------------------- other users ------------------------ */
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersError, setUsersError] = useState('');
    const [usersLoading, setUsersLoading] = useState(false);
    const [inspected, setInspected] = useState({});
    const [notifyDraft, setNotifyDraft] = useState({ userId: null, title: '', message: '' });

    const loadUsers = useCallback(async () => {
        if (!owner) return;
        setUsersLoading(true);
        setUsersError('');
        try {
            const response = await apiService.getAdminUsers({ search: search.trim(), page: 1, limit: 20 });
            if (!response?.success) { setUsersError(response?.message || 'User directory unavailable.'); setUsers([]); return; }
            setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
            setUsersTotal(Number(response.data?.total) || 0);
        } catch (error) {
            setUsersError(error?.message || 'User directory unavailable.');
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    }, [owner, search]);

    useEffect(() => { if (activeTab === 'users' && owner) loadUsers(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [activeTab, owner]);

    const inspect = async username => {
        const status = await inspectUserWorkspace(username);
        setInspected(prev => ({ ...prev, [username]: status }));
        if (!status.cvReady && !status.portfolioReady) info('No public CV or portfolio records yet for this account.');
    };

    const sendNotificationToUser = async target => {
        if (!notifyDraft.title.trim() || !notifyDraft.message.trim()) {
            showError('A title and message are required.');
            return;
        }
        try {
            const response = await notifyWorkspaceUser(target._id || target.id, {
                type: 'workspace',
                title: notifyDraft.title.trim(),
                message: notifyDraft.message.trim(),
                link: '/dashboard/user-workspaces'
            });
            if (!response?.success) { showError(response?.message || 'Notification was not delivered.'); return; }
            success(response.message || 'Notification delivered in real time.');
            setNotifyDraft({ userId: null, title: '', message: '' });
        } catch (error) {
            showError(error?.message || 'Notification was not delivered.');
        }
    };

    /* ------------------------------ notifications ------------------------ */
    const noteTypeTone = type => {
        if (type === 'error') return 'border-rose-500/40 text-rose-300';
        if (type === 'warning') return 'border-amber-500/40 text-amber-300';
        if (type === 'success' || type === 'cv' || type === 'portfolio') return 'border-emerald-500/40 text-emerald-300';
        if (type === 'account' || type === 'workspace') return 'border-purple-500/40 text-purple-300';
        return 'border-cyan-500/40 text-cyan-300';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-900/40">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Sparkles size={26} className="text-purple-400" /> User Workspaces
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                        Create accounts for other people, provision their CV &amp; portfolio records through real APIs,
                        publish public pages and follow every change with real-time notifications.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${notifications.live
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-300'}`}>
                        {notifications.live ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {notifications.live ? 'Live notifications' : 'Polling (30s)'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-800 border-slate-700 text-slate-200">
                        <Bell size={13} /> {notifications.unreadCount} unread
                    </span>
                    <ActionButton onClick={() => { loadWorkspace(); notifications.refresh(); }} disabled={busy} tone="cyan">
                        <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh
                    </ActionButton>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-700/60 pb-3">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id
                                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-700'}`}>
                            <Icon size={15} /> {tab.label}
                            {tab.id === 'notifications' && notifications.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">{notifications.unreadCount}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* --------------------------- CREATE ACCOUNT --------------------------- */}
            {activeTab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Panel title="Create an account for another user" accent="border-purple-500/30"
                           description="Uses POST /api/auth/register. Your own session is not replaced — the returned token is discarded and the new user signs in themselves.">
                        <form onSubmit={submitAccount} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Full name" name="name" value={form.name} onChange={handleFormChange} placeholder="Jane Doe" autoComplete="name" />
                                <Field label="Username" name="username" value={form.username} onChange={handleFormChange} placeholder="jane.doe" autoComplete="username" />
                            </div>
                            <Field label="Email" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="jane@example.com" autoComplete="email" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Password (min. 6 characters)" name="password" type="password" value={form.password} onChange={handleFormChange} autoComplete="new-password" />
                                <Field label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleFormChange} autoComplete="new-password" />
                            </div>
                            {message && <div className="text-xs text-amber-300 flex items-center gap-2"><AlertCircle size={13} /> {message}</div>}
                            <div className="flex flex-wrap gap-2 pt-1">
                                <ActionButton onClick={submitAccount} disabled={createBusy} tone="purple">
                                    {createBusy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Create account
                                </ActionButton>
                                <ActionButton onClick={() => copy(registrationLink(), 'Registration link')} tone="slate">
                                    <Copy size={14} /> Copy registration link
                                </ActionButton>
                                <Link to="/register" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400">
                                    <ExternalLink size={14} /> Open public form
                                </Link>
                            </div>
                        </form>
                    </Panel>

                    <div className="space-y-6">
                        {created ? (
                            <Panel title="Account created" accent="border-emerald-500/30"
                                   description="The account exists. CV &amp; portfolio records are created when the holder first signs in or opens their own workspace page.">
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div><span className="text-slate-500">Name:</span> {created.name}</div>
                                    <div><span className="text-slate-500">Username:</span> @{created.username}</div>
                                    <div><span className="text-slate-500">Email:</span> {created.email}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <a href={publicUserLinks(created.username).cv} target="_blank" rel="noopener noreferrer" className="text-cyan-300 text-xs hover:underline">Public CV: /cv/{created.username}</a>
                                    <a href={publicUserLinks(created.username).portfolio} target="_blank" rel="noopener noreferrer" className="text-cyan-300 text-xs hover:underline">Public portfolio: /portfolio/{created.username}</a>
                                </div>
                                {owner && (
                                    <div className="mt-4">
                                        <ActionButton tone="emerald" onClick={() => sendNotificationToUser(created)}>
                                            <Send size={14} /> Send welcome notification
                                        </ActionButton>
                                    </div>
                                )}
                            </Panel>
                        ) : (
                            <Panel title="What happens next" description="Real behaviour, no sample data.">
                                <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                                    <li>The account is stored by the real registration endpoint.</li>
                                    <li>On first sign-in, the app provisions a CV and portfolio through GET /api/cv and GET /api/portfolio/config.</li>
                                    <li>The holder edits and publishes from their own dashboard; public pages read /api/public/cv/:username and /api/public/portfolio/:username.</li>
                                    <li>Account, CV, portfolio and publish events create real-time notifications in this dashboard.</li>
                                </ul>
                            </Panel>
                        )}
                        {owner && (
                            <Panel title="Notify another account" description="Owner-only: sends a DB-backed notification delivered instantly to that user's authenticated room.">
                                <div className="space-y-3">
                                    <Field label="Title" name="notifyTitle" value={notifyDraft.title} onChange={e => setNotifyDraft(prev => ({ ...prev, title: e.target.value, userId: created?._id || created?.id || null }))} placeholder="Your portfolio is ready to review" />
                                    <Field label="Message" name="notifyMessage" value={notifyDraft.message} onChange={e => setNotifyDraft(prev => ({ ...prev, message: e.target.value }))} placeholder="Please check your CV details and publish when ready." />
                                    <ActionButton tone="cyan" onClick={() => sendNotificationToUser(created || {})}
                                                  disabled={!created}>
                                        <Send size={14} /> Send to created account
                                    </ActionButton>
                                    {!created && <p className="text-xs text-slate-500">Create an account first, or use the Other users tab to notify an existing holder.</p>}
                                </div>
                            </Panel>
                        )}
                    </div>
                </div>
            )}

            {/* --------------------------- MY WORKSPACE --------------------------- */}
            {activeTab === 'workspace' && (
                <div className="space-y-6">
                    <Panel title="My CV &amp; portfolio workspace" accent="border-purple-500/30"
                           description={`Signed in as ${user?.name || 'user'}${user?.username ? ` (@${user.username})` : ''}. Records come from the real get-or-create APIs.`}>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge ready={Boolean(workspace?.cvReady)} label={`CV ${workspace?.cvReady ? 'ready' : 'unavailable'}`} />
                            <Badge ready={Boolean(workspace?.portfolioReady)} label={`Portfolio ${workspace?.portfolioReady ? 'ready' : 'unavailable'}`} />
                            <Badge ready={isPublished} label={isPublished ? 'Published' : 'Not published'} />
                        </div>
                        {workspaceError && <div className="text-xs text-amber-300 mb-3 flex items-center gap-2"><AlertCircle size={13} /> {workspaceError}</div>}
                        {portfolioResponse?.publishedAt && <p className="text-xs text-slate-400 mb-3">Published at: {formatDate(portfolioResponse.publishedAt)}</p>}
                        <div className="flex flex-wrap gap-2">
                            <ActionButton onClick={loadWorkspace} disabled={busy} tone="purple"><RefreshCw size={14} /> Create / refresh records</ActionButton>
                            <ActionButton onClick={() => runWorkspaceAction(publishUserPortfolio, 'Portfolio published.')} disabled={busy} tone="emerald"><Globe size={14} /> Publish portfolio</ActionButton>
                            <ActionButton onClick={() => runWorkspaceAction(unpublishUserPortfolio, 'Portfolio unpublished.')} disabled={busy} tone="rose"><Eye size={14} /> Unpublish</ActionButton>
                            <ActionButton onClick={async () => {
                                const result = await downloadCVExport(user?.username || 'cv');
                                if (result.success) success('CV JSON export downloaded.');
                                else showError(result.message || 'CV export failed.');
                            }} disabled={busy} tone="slate"><Download size={14} /> Export CV JSON</ActionButton>
                            <Link to="/dashboard/cv-editor" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400"><FileText size={14} /> CV Editor</Link>
                            <Link to="/dashboard/portfolio-editor" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:border-cyan-400"><Briefcase size={14} /> Portfolio Editor</Link>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4 text-xs">
                            {links.cv && <a href={links.cv} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Public CV {links.cv}</a>}
                            {links.portfolio && <a href={links.portfolio} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Public portfolio {links.portfolio}</a>}
                            {links.portfolio && <ActionButton onClick={() => copy(`${window.location.origin}${links.portfolio}`, 'Public portfolio link')} tone="slate"><Copy size={13} /> Copy public link</ActionButton>}
                            {links.portfolio && <ActionButton onClick={showQr} tone="slate"><QrCode size={13} /> Show QR</ActionButton>}
                        </div>
                        {qr && (
                            <div className="mt-4 inline-flex flex-col items-center gap-2 bg-white p-3 rounded-xl">
                                <img src={qr} alt="QR code for the public portfolio" width="180" height="180" />
                                <button type="button" className="text-xs text-slate-700" onClick={() => setQr('')}>Close</button>
                            </div>
                        )}
                    </Panel>

                    {checklist && (
                        <Panel title={`Workspace completeness · ${checklist.ready}/${checklist.total} (${checklist.percent}%)`}
                               description="Computed only from the CV and portfolio documents returned by the APIs.">
                            <div className="w-full h-2 rounded-full bg-slate-700/70 mb-4 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" style={{ width: `${checklist.percent}%` }} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {checklist.items.map(item => (
                                    <div key={item.id} className={`flex items-start gap-2 p-3 rounded-lg border ${item.ready ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-slate-900/40 border-slate-700/60'}`}>
                                        {item.ready ? <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" /> : <AlertCircle size={15} className="text-slate-500 mt-0.5 shrink-0" />}
                                        <div>
                                            <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{item.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Panel title="CV versions" description="Snapshots from GET /api/cv/versions.">
                            <div className="flex gap-2 mb-3">
                                <input className="flex-1 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                                       placeholder="Version name" value={versionName} onChange={e => setVersionName(e.target.value)} />
                                <ActionButton tone="cyan" disabled={busy} onClick={() => runWorkspaceAction(
                                    () => apiService.createCVVersion(versionName.trim() || `Version ${versions.cv.length + 1}`),
                                    'CV version created.'
                                )}><Layers size={13} /> Save</ActionButton>
                            </div>
                            {versions.cv.length === 0 ? <p className="text-xs text-slate-500">No CV versions returned by the API.</p> : (
                                <ul className="space-y-2 max-h-56 overflow-y-auto">
                                    {versions.cv.map(version => (
                                        <li key={version._id || version.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                            <div className="text-xs text-slate-300"><div className="font-semibold">{version.name || 'Version'}</div><div className="text-[11px] text-slate-500">{formatDate(version.createdAt)}</div></div>
                                            <ActionButton tone="slate" disabled={busy} onClick={() => runWorkspaceAction(() => apiService.restoreCVVersion(version._id || version.id), 'CV version restored.')}><RotateCcw size={12} /> Restore</ActionButton>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Portfolio versions" description="Snapshots from GET /api/portfolio/versions.">
                            {versions.portfolio.length === 0 ? <p className="text-xs text-slate-500">No portfolio versions returned by the API.</p> : (
                                <ul className="space-y-2 max-h-56 overflow-y-auto">
                                    {versions.portfolio.map(version => (
                                        <li key={version._id || version.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                            <div className="text-xs text-slate-300"><div className="font-semibold">{version.name || `v${version.version || '?'}`}</div><div className="text-[11px] text-slate-500">{formatDate(version.createdAt)}</div></div>
                                            <ActionButton tone="slate" disabled={busy} onClick={() => runWorkspaceAction(() => apiService.restorePortfolioVersion(version._id || version.id), 'Portfolio version restored.')}><RotateCcw size={12} /> Restore</ActionButton>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Portfolio templates" description="Real templates from GET /api/portfolio/templates. Applying one backs up the current config server-side.">
                            {templates.length === 0 ? <p className="text-xs text-slate-500">No templates returned by the API.</p> : (
                                <ul className="space-y-2 max-h-56 overflow-y-auto">
                                    {templates.map(template => (
                                        <li key={template.id || template._id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-700/60">
                                            <div className="text-xs text-slate-300"><div className="font-semibold">{template.name || template.id}</div><div className="text-[11px] text-slate-500">{template.category || 'built-in'}</div></div>
                                            <ActionButton tone="purple" disabled={busy} onClick={() => runWorkspaceAction(() => apiService.applyPortfolioTemplate(template.id), 'Template applied.')}><Sparkles size={12} /> Apply</ActionButton>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>
                </div>
            )}

            {/* ----------------------------- OTHER USERS ----------------------------- */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {!owner ? (
                        <Panel title="Owner access required" description="The user directory is an owner-only API (GET /api/admin/users). Your own workspace is available in the previous tab." />
                    ) : (
                        <Panel title={`Registered users · ${usersTotal}`} accent="border-cyan-500/30"
                               description="Real records from GET /api/admin/users. Inspecting a user reads their public CV and portfolio endpoints only.">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 rounded-lg bg-slate-900/70 border border-slate-700">
                                    <Search size={15} className="text-slate-500" />
                                    <input className="w-full py-2.5 bg-transparent text-slate-100 text-sm focus:outline-none"
                                           placeholder="Search name, username or email" value={search}
                                           onChange={e => setSearch(e.target.value)}
                                           onKeyDown={e => { if (e.key === 'Enter') loadUsers(); }} />
                                </div>
                                <ActionButton onClick={loadUsers} disabled={usersLoading} tone="cyan">
                                    {usersLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
                                </ActionButton>
                            </div>
                            {usersError && <div className="text-xs text-amber-300 mb-3 flex items-center gap-2"><AlertCircle size={13} /> {usersError}</div>}
                            {users.length === 0 && !usersLoading && <p className="text-sm text-slate-500">No users returned. Search to load the real directory.</p>}
                            <div className="space-y-3">
                                {users.map(item => {
                                    const status = inspected[item.username];
                                    return (
                                        <div key={item._id || item.id || item.username} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/60">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="text-sm">
                                                    <div className="text-slate-100 font-semibold flex items-center gap-2"><Shield size={13} className="text-cyan-400" /> {item.name} <span className="text-slate-500 font-normal">@{item.username}</span></div>
                                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3">
                                                        <span className="inline-flex items-center gap-1"><Mail size={11} /> {item.email}</span>
                                                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> Joined {formatDate(item.createdAt)}</span>
                                                        <span>{item.isActive === false ? 'Suspended' : 'Active'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <ActionButton tone="slate" onClick={() => inspect(item.username)}><Eye size={13} /> Inspect workspace</ActionButton>
                                                    <ActionButton tone="cyan" onClick={() => setNotifyDraft({ userId: item._id || item.id, title: `Hello ${item.name}`, message: 'Your CV and portfolio workspace is ready to review.' })}><Bell size={13} /> Notify</ActionButton>
                                                </div>
                                            </div>

                                            {status && (
                                                <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
                                                    <Badge ready={status.cvReady} label={`CV ${status.cvReady ? 'found' : 'not created'}`} />
                                                    <Badge ready={status.portfolioReady} label={`Portfolio ${status.portfolioReady ? 'found' : 'not created'}`} />
                                                    <a href={status.links.cv} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Public CV</a>
                                                    <a href={status.links.portfolio} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Public portfolio</a>
                                                    <button type="button" className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1" onClick={() => copy(`${window.location.origin}${status.links.portfolio}`, 'Public portfolio link')}><Copy size={12} /> Copy link</button>
                                                </div>
                                            )}

                                            {notifyDraft.userId === (item._id || item.id) && (
                                                <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                                                    <Field label="Notification title" name="rowTitle" value={notifyDraft.title} onChange={e => setNotifyDraft(prev => ({ ...prev, title: e.target.value }))} />
                                                    <Field label="Message" name="rowMessage" value={notifyDraft.message} onChange={e => setNotifyDraft(prev => ({ ...prev, message: e.target.value }))} />
                                                    <div className="flex gap-2">
                                                        <ActionButton tone="emerald" onClick={() => sendNotificationToUser(item)}><Send size={13} /> Send now</ActionButton>
                                                        <ActionButton tone="slate" onClick={() => setNotifyDraft({ userId: null, title: '', message: '' })}><X size={13} /> Cancel</ActionButton>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Panel>
                    )}
                </div>
            )}

            {/* ---------------------------- NOTIFICATIONS ---------------------------- */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <Panel title="Real-time notification centre" accent="border-cyan-500/30"
                           description="Records are read from /api/notifications. New events arrive over the authenticated /notifications socket namespace; when it is unavailable the REST API is polled every 30 seconds.">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${notifications.live
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'}`}>
                                {notifications.live ? <Wifi size={13} /> : <WifiOff size={13} />} {notifications.live ? 'Live' : 'Polling fallback'}
                            </span>
                            <span className="text-xs text-slate-400">{notifications.unreadCount} unread · {notifications.notifications.length} shown · last sync {formatDate(notifications.lastSync)}</span>
                        </div>
                        {notifications.connectionError && <div className="text-xs text-amber-300 mb-3">Socket: {notifications.connectionError}</div>}
                        {notifications.error && <div className="text-xs text-rose-300 mb-3 flex items-center gap-2"><AlertCircle size={13} /> {notifications.error}</div>}
                        <div className="flex flex-wrap gap-2">
                            <ActionButton tone="cyan" onClick={notifications.refresh}><RefreshCw size={14} /> Refresh</ActionButton>
                            <ActionButton tone="emerald" onClick={notifications.markAllRead}><Check size={14} /> Mark all read</ActionButton>
                            {owner && <ActionButton tone="slate" onClick={notifications.sendTest}><Send size={14} /> Send live test</ActionButton>}
                            {owner && <ActionButton tone="rose" onClick={notifications.removeAll}><Trash2 size={14} /> Clear all</ActionButton>}
                        </div>
                    </Panel>

                    <Panel title="Inbox">
                        {notifications.loading && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading real notifications…</p>}
                        {!notifications.loading && notifications.notifications.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <Inbox size={28} className="mx-auto mb-2" />
                                <p className="text-sm">No notifications yet. Account, CV, portfolio and publish events will appear here in real time.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            {notifications.notifications.map(note => (
                                <div key={note.id} className={`p-3 rounded-lg border flex flex-wrap items-start justify-between gap-3 ${note.read ? 'bg-slate-900/30 border-slate-700/50' : `bg-slate-800/60 ${noteTypeTone(note.type)}`}`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-100">{note.title}</span>
                                            {!note.read && <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">NEW</span>}
                                            <span className="text-[10px] uppercase tracking-wide text-slate-500">{note.type}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 mt-1 break-words">{note.message}</p>
                                        <div className="text-[11px] text-slate-500 mt-1">{formatDate(note.createdAt)}</div>
                                        {note.link && <a href={note.link} className="text-[11px] text-cyan-300 hover:underline mt-1 inline-block">{note.link}</a>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {!note.read && <ActionButton tone="emerald" onClick={() => notifications.markRead(note.id)}><Check size={12} /> Read</ActionButton>}
                                        {!note.dismissed && <ActionButton tone="slate" onClick={() => notifications.dismiss(note.id)}><X size={12} /> Dismiss</ActionButton>}
                                        {owner && <ActionButton tone="rose" onClick={() => notifications.remove(note.id)}><Trash2 size={12} /> Delete</ActionButton>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            )}
        </div>
    );
};

export default UserWorkspaceManager;
