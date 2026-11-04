import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FlaskConical, Rocket, RefreshCw, Trash2, Plus, Database,
    ExternalLink, AlertCircle, CheckCircle2, Terminal, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import labSampleData from '../../data/labSamples.json';
import { publishProjectsChanged } from '../../utils/projectSync';

const LAB_SAMPLE_TAG = labSampleData.tag;
const LAB_STATUSES = ['live', 'beta', 'development', 'experimental'];

const isSample = (project) =>
    Array.isArray(project?.tags) && project.tags.includes(LAB_SAMPLE_TAG);

const settled = (result) =>
    result.status === 'fulfilled' && result.value?.success ? result.value : null;

const LabManager = () => {
    const { isOwner: checkOwner } = useAuth();
    const owner = typeof checkOwner === 'function' ? checkOwner() : false;
    const { success: notifySuccess, error: notifyError } = useNotifications();

    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [hobbies, setHobbies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [p, s, h] = await Promise.allSettled([
                ApiService.request('/public/projects?status=all&limit=100'),
                ApiService.request('/public/skills'),
                ApiService.request('/public/interests')
            ]);
            const projectData = settled(p);
            const skillsData = settled(s);
            const hobbiesData = settled(h);
            const allProjects = Array.isArray(projectData?.projects) ? projectData.projects : [];
            setProjects(allProjects.filter(item =>
                LAB_STATUSES.includes(String(item.status || '').toLowerCase())
            ));
            setSkills(Array.isArray(skillsData?.skills) ? skillsData.skills : []);
            setHobbies(Array.isArray(hobbiesData?.interests)
                ? hobbiesData.interests
                : (Array.isArray(hobbiesData?.data) ? hobbiesData.data : []));
            if (!projectData || !skillsData || !hobbiesData) {
                setNotice('Some dashboard data is temporarily unavailable. Only loaded records are shown.');
            } else {
                setNotice('');
            }
        } catch (error) {
            setNotice('Could not load lab data. Check the API connection and retry.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const samples = useMemo(() => projects.filter(isSample), [projects]);
    const realProjects = useMemo(() => projects.filter(p => !isSample(p)), [projects]);

    const addSamples = async () => {
        if (!owner) return;
        if (!window.confirm(`Add ${labSampleData.samples.length} clearly-labelled SAMPLE experiments? They can be deleted at any time.`)) return;
        setBusy(true);
        let created = 0;
        let skipped = 0;
        try {
            for (const sample of labSampleData.samples) {
                if (projects.some(p => p.title === sample.title)) { skipped += 1; continue; }
                const response = await ApiService.createProject({
                    ...sample,
                    tags: [LAB_SAMPLE_TAG, ...sample.tags],
                    visibility: 'public'
                });
                if (response?.success === false) throw new Error(response.message || 'Create failed');
                created += 1;
            }
            notifySuccess(`Added ${created} sample experiment(s)${skipped ? `, ${skipped} already present` : ''}.`);
            window.dispatchEvent(new CustomEvent('settingsChanged'));
            publishProjectsChanged();
            await load();
        } catch (error) {
            notifyError(error?.message || 'Could not add the sample experiments.');
            await load();
        } finally {
            setBusy(false);
        }
    };

    const deleteSample = async (project) => {
        if (!owner) return;
        const id = project.id || project._id;
        if (!id || !window.confirm(`Delete "${project.title}"?`)) return;
        setBusy(true);
        try {
            const response = await ApiService.deleteProject(id);
            if (response?.success === false) throw new Error(response.message || 'Delete failed');
            setProjects(prev => prev.filter(p => (p.id || p._id) !== id));
            notifySuccess('Sample experiment deleted.');
            window.dispatchEvent(new CustomEvent('settingsChanged'));
            publishProjectsChanged();
        } catch (error) {
            notifyError(error?.message || 'Could not delete the sample experiment.');
        } finally {
            setBusy(false);
        }
    };

    const deleteAllSamples = async () => {
        if (!owner || samples.length === 0) return;
        if (!window.confirm(`Delete all ${samples.length} sample experiments? Real projects are untouched.`)) return;
        setBusy(true);
        let removed = 0;
        try {
            for (const project of samples) {
                const id = project.id || project._id;
                if (!id) continue;
                const response = await ApiService.deleteProject(id);
                if (response?.success === false) throw new Error(response.message || 'Delete failed');
                removed += 1;
            }
            notifySuccess(`Deleted ${removed} sample experiment(s).`);
            window.dispatchEvent(new CustomEvent('settingsChanged'));
            publishProjectsChanged();
            await load();
        } catch (error) {
            notifyError(error?.message || 'Could not delete all samples.');
            await load();
        } finally {
            setBusy(false);
        }
    };

    const panel = 'rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5';

    return (
        <DashboardLayout
            title="Lab"
            subtitle="Experiments, toolkit and hobbies behind the public Lab page"
            actions={
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-cyan-400 transition"
                    >
                        <RefreshCw size={15} /> Refresh
                    </button>
                    <Link
                        to="/#lab"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-cyan-400 transition"
                    >
                        <ExternalLink size={15} /> View public Lab
                    </Link>
                </div>
            }
        >
            <div className="space-y-6">
                {notice && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        <AlertCircle size={16} /> {notice}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Lab experiments', value: projects.length, icon: FlaskConical },
                        { label: 'Real projects', value: realProjects.length, icon: Rocket },
                        { label: 'Deletable samples', value: samples.length, icon: Trash2 },
                        { label: 'Skills / hobbies', value: `${skills.length} / ${hobbies.length}`, icon: Database }
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className={panel}>
                            <div className="flex items-center gap-2 text-cyan-400 mb-2"><Icon size={16} /></div>
                            <div className="text-2xl font-bold text-slate-100">{value}</div>
                            <div className="text-xs text-slate-400 mt-1">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Sample data controls */}
                <div className={panel}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <FlaskConical size={18} className="text-amber-400" /> Sample data (you can delete this)
                            </h2>
                            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                                These are clearly labelled starter experiments tagged
                                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">{LAB_SAMPLE_TAG}</code>.
                                Projects, skills and hobbies are real records from the database — the samples are
                                the only disposable content.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={addSamples}
                                disabled={!owner || busy}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/25 disabled:opacity-50 transition"
                            >
                                <Plus size={15} /> Add sample experiments
                            </button>
                            <button
                                onClick={deleteAllSamples}
                                disabled={!owner || busy || samples.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm font-semibold hover:bg-rose-500/20 disabled:opacity-50 transition"
                            >
                                <Trash2 size={15} /> Delete all samples
                            </button>
                        </div>
                    </div>

                    {!owner && (
                        <p className="mt-3 text-xs text-amber-300 flex items-center gap-2">
                            <AlertCircle size={13} /> Owner access is required to add or delete samples.
                        </p>
                    )}

                    <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2"><Terminal size={14} /> CLI alternative</div>
                        <code className="block text-cyan-300">npm run seed:lab</code>
                        <code className="block text-cyan-300">npm run seed:lab:remove</code>
                        <p className="mt-2 leading-relaxed">
                            The CLI only creates or removes documents carrying the sample tag. It never
                            modifies real projects, skills or hobbies.
                        </p>
                    </div>
                </div>

                {/* Experiment list */}
                <div className={panel}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-100">Lab experiments</h2>
                        <span className="text-xs text-slate-400">{loading ? 'Loading…' : `${projects.length} records`}</span>
                    </div>

                    {projects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                            No lab experiments yet. Add the samples above, or set a project status to
                            live / beta / development / experimental in the{' '}
                            <Link to="/dashboard/projects" className="text-cyan-400 underline">Projects manager</Link>.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {projects.map(project => {
                                const sample = isSample(project);
                                return (
                                    <div
                                        key={project.id || project._id || project.title}
                                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${sample ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700/60 bg-slate-950/30'}`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-slate-100 truncate">{project.title}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                                    {project.status}
                                                </span>
                                                {sample && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                                        Sample · deletable
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-2xl">{project.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to="/dashboard/projects"
                                                className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
                                            >
                                                Edit <ArrowUpRight size={12} />
                                            </Link>
                                            {owner && sample && (
                                                <button
                                                    onClick={() => deleteSample(project)}
                                                    disabled={busy}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 text-xs hover:bg-rose-500/15 disabled:opacity-50 transition"
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Related real data */}
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { to: '/dashboard/projects', title: 'Projects', detail: 'Real project records', count: realProjects.length },
                        { to: '/dashboard/skills', title: 'Skills', detail: 'Real published skills', count: skills.length },
                        { to: '/dashboard/hobbies', title: 'Hobbies', detail: 'Real interests', count: hobbies.length }
                    ].map(item => (
                        <Link key={item.title} to={item.to} className={`${panel} hover:border-cyan-500/50 transition block`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-100">{item.title}</span>
                                <ArrowUpRight size={14} className="text-cyan-400" />
                            </div>
                            <div className="text-2xl font-bold text-cyan-400 mt-2">{item.count}</div>
                            <div className="text-xs text-slate-400 mt-1">{item.detail}</div>
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 size={14} /> The public Lab page reads these same endpoints; edits reach it through live signals, cross-tab notices and its 30-second refresh.
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabManager;
