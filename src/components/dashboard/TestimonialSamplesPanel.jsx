import React, { useState, useEffect, useCallback } from 'react';
import {
    FlaskConical, Plus, Trash2, Eye, EyeOff, RefreshCw,
    ExternalLink, AlertCircle, CheckCircle2, Database, Terminal, Star
} from 'lucide-react';
import apiService from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import dataset from '../../data/testimonialSamples.json';

const TAG = dataset.tag;
const PROJECT_URL = dataset.previewUrl;
const PREVIEW_KEY = 'testimonial_preview';

const isSample = item => Array.isArray(item?.tags) && item.tags.includes(TAG);
const idOf = item => item?._id || item?.id;

/**
 * Owner-controlled MOCK testimonial data.
 *
 * Nothing here is invented at runtime: the 8 records come verbatim from the
 * shared dataset (which is also backed up in server/backups/testimonials/).
 * They are inserted as real Testimonial documents, marked with `TAG`, and
 * default to preview-only (visible:false) so normal visitors never see them.
 */
const TestimonialSamplesPanel = ({ onChanged }) => {
    const { isOwner: checkOwner } = useAuth();
    const owner = typeof checkOwner === 'function' ? checkOwner() : false;

    const [samples, setSamples] = useState([]);
    const [realCount, setRealCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [notice, setNotice] = useState('');

    const notify = () => window.dispatchEvent(new CustomEvent('settingsChanged'));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllTestimonials({ limit: 100 });
            const all = response?.success && Array.isArray(response.testimonials)
                ? response.testimonials
                : [];
            setSamples(all.filter(isSample));
            setRealCount(all.filter(item => !isSample(item)).length);
            if (!response?.success) setNotice('Could not reach the testimonials API. Retry after the backend is up.');
            else setNotice('');
        } catch (error) {
            setNotice('Could not reach the testimonials API. Retry after the backend is up.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const afterChange = async () => {
        notify();
        await load();
        if (typeof onChanged === 'function') onChanged();
    };

    const addSamples = async () => {
        if (!owner) return;
        if (!window.confirm(`Insert ${dataset.samples.length} clearly-labelled SAMPLE testimonials? They stay preview-only until you publish them.`)) return;
        setBusy(true);
        let created = 0;
        let skipped = 0;
        try {
            for (const sample of dataset.samples) {
                if (samples.some(item => item.name === sample.name)) { skipped += 1; continue; }
                const response = await apiService.createTestimonial({
                    ...sample,
                    tags: [...(sample.tags || []), TAG],
                    website: PROJECT_URL,
                    visible: false
                });
                if (!response?.success) throw new Error(response?.message || 'Could not insert sample');
                created += 1;
            }
            setNotice(`Inserted ${created} sample(s)${skipped ? `, ${skipped} already present` : ''}. They are preview-only.`);
            await afterChange();
        } catch (error) {
            setNotice(error?.message || 'Could not insert samples.');
        } finally {
            setBusy(false);
        }
    };

    const deleteOne = async item => {
        const id = idOf(item);
        if (!owner || !id || !window.confirm(`Delete sample "${item.name}"?`)) return;
        setBusy(true);
        try {
            const response = await apiService.deleteTestimonial(id);
            if (!response?.success) throw new Error(response?.message || 'Delete failed');
            await afterChange();
        } catch (error) {
            setNotice(error?.message || 'Delete failed.');
        } finally {
            setBusy(false);
        }
    };

    const deleteAll = async () => {
        if (!owner || samples.length === 0) return;
        if (!window.confirm(`Delete all ${samples.length} sample testimonials? Real client records are untouched.`)) return;
        setBusy(true);
        let removed = 0;
        try {
            for (const item of samples) {
                const id = idOf(item);
                if (!id) continue;
                const response = await apiService.deleteTestimonial(id);
                if (!response?.success) throw new Error(response?.message || 'Delete failed');
                removed += 1;
            }
            setNotice(`Deleted ${removed} sample(s). Real testimonials preserved.`);
            await afterChange();
        } catch (error) {
            setNotice(error?.message || 'Delete failed.');
            await afterChange();
        } finally {
            setBusy(false);
        }
    };

    const setPublished = async visible => {
        if (!owner) return;
        const targets = samples.filter(item => Boolean(item.visible) !== visible);
        if (targets.length === 0) {
            setNotice(visible ? 'Samples are already published.' : 'Samples are already preview-only.');
            return;
        }
        if (visible && !window.confirm('Publish the sample testimonials to the PUBLIC site? They are mock data — only do this for a deliberate preview.')) return;
        setBusy(true);
        try {
            for (const item of targets) {
                const response = await apiService.toggleTestimonialVisibility(idOf(item));
                if (!response?.success) throw new Error(response?.message || 'Visibility change failed');
            }
            setNotice(visible
                ? 'Samples are now PUBLIC (mock data is visible to visitors — turn off when done).'
                : 'Samples are preview-only again.');
            await afterChange();
        } catch (error) {
            setNotice(error?.message || 'Visibility change failed.');
            await afterChange();
        } finally {
            setBusy(false);
        }
    };

    const openPublicPreview = () => {
        try { localStorage.setItem(PREVIEW_KEY, 'on'); } catch (error) { /* storage may be blocked */ }
        window.open('/?preview=1', '_blank', 'noopener,noreferrer');
        setNotice('Opening the public page in preview mode. Sample cards will be clearly labelled.');
    };

    const exitPublicPreview = () => {
        try { localStorage.removeItem(PREVIEW_KEY); } catch (error) { /* storage may be blocked */ }
        notify();
        setNotice('Public preview turned off. Visitors see only real, published testimonials.');
    };

    const publishedCount = samples.filter(item => item.visible).length;
    const panel = 'rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5';

    return (
        <div className={`${panel} mb-8 border-amber-500/40`} id="testimonial-samples">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <FlaskConical size={18} className="text-amber-400" />
                        Sample testimonials (mock data you control)
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                        The original 8 records, kept <strong>exactly as they were</strong>, stored as real
                        database documents tagged <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">{TAG}</code>.
                        They default to <strong>preview-only</strong>; visitors never see mock data unless
                        you deliberately publish it or enable preview mode.
                        Real testimonials in the database: <strong className="text-emerald-300">{realCount}</strong> (never modified).
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={load} disabled={busy}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-cyan-400 transition disabled:opacity-50">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-cyan-400 transition">
                        <ExternalLink size={14} /> Project preview
                    </a>
                </div>
            </div>

            {notice && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    <AlertCircle size={16} /> {notice}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                    { label: 'Dataset records', value: dataset.samples.length, icon: Database },
                    { label: 'Samples in DB', value: samples.length, icon: FlaskConical },
                    { label: 'Published', value: publishedCount, icon: Eye },
                    { label: 'Preview-only', value: samples.length - publishedCount, icon: EyeOff }
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3">
                        <div className="flex items-center gap-2 text-cyan-400 mb-1"><Icon size={14} /></div>
                        <div className="text-xl font-bold text-slate-100">{loading ? '…' : value}</div>
                        <div className="text-[11px] text-slate-400">{label}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={addSamples} disabled={!owner || busy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/25 disabled:opacity-50 transition">
                    <Plus size={15} /> Add sample data
                </button>
                <button onClick={() => setShowPreview(v => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 text-sm font-semibold hover:bg-purple-500/20 transition">
                    <Eye size={15} /> {showPreview ? 'Hide preview' : 'Preview mode'}
                </button>
                <button onClick={openPublicPreview}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm font-semibold hover:border-cyan-400 transition">
                    <ExternalLink size={15} /> Preview on public page
                </button>
                <button onClick={exitPublicPreview}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-slate-400 transition">
                    <EyeOff size={15} /> Exit public preview
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setPublished(true)} disabled={!owner || busy || samples.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition">
                    <CheckCircle2 size={15} /> Publish samples
                </button>
                <button onClick={() => setPublished(false)} disabled={!owner || busy || samples.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-semibold hover:border-amber-400 disabled:opacity-50 transition">
                    <EyeOff size={15} /> Unpublish (preview only)
                </button>
                <button onClick={deleteAll} disabled={!owner || busy || samples.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm font-semibold hover:bg-rose-500/20 disabled:opacity-50 transition">
                    <Trash2 size={15} /> Delete all samples
                </button>
            </div>

            {!owner && (
                <p className="mt-3 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle size={13} /> Owner access is required to insert, publish or delete samples.
                </p>
            )}

            {/* Inline preview of the mock data exactly as the public cards show it */}
            {showPreview && (
                <div className="mt-5 rounded-xl border border-purple-500/40 bg-purple-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-purple-300 mb-3">
                        <Eye size={15} /> PREVIEW MODE — sample data, not published
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {dataset.samples.map(item => (
                            <div key={item.name} className="rounded-xl border border-dashed border-purple-500/40 bg-slate-950/50 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <img src={item.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-600"
                                        onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-100 truncate">{item.name}</div>
                                        <div className="text-[11px] text-slate-400 truncate">{item.position} · {item.company}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                                    {Array.from({ length: item.rating }, (_, i) => <Star key={i} size={11} fill="currentColor" />)}
                                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-purple-300">Sample</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">“{item.content}”</p>
                                <div className="text-[10px] text-slate-500 mt-2 truncate">{item.project}</div>
                            </div>
                        ))}
                    </div>
                    <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                        Project link: {PROJECT_URL} <ExternalLink size={11} />
                    </a>
                </div>
            )}

            {/* Samples currently in the DB */}
            {samples.length > 0 && (
                <div className="mt-5">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Samples currently in the database</div>
                    <div className="space-y-2">
                        {samples.map(item => (
                            <div key={idOf(item) || item.name}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                                <div className="min-w-0">
                                    <span className="text-sm font-semibold text-slate-100">{item.name}</span>
                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Sample</span>
                                    <span className="ml-2 text-[10px] text-slate-400">{item.visible ? 'PUBLIC' : 'preview-only'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1">
                                        Project <ExternalLink size={11} />
                                    </a>
                                    {owner && (
                                        <button onClick={() => deleteOne(item)} disabled={busy}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 text-xs hover:bg-rose-500/15 disabled:opacity-50 transition">
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2"><Terminal size={14} /> Database &amp; backup files (all kept as they were)</div>
                <code className="block text-cyan-300">npm run seed:testimonials</code>
                <code className="block text-cyan-300">npm run seed:testimonials:remove</code>
                <code className="block text-cyan-300">npm run backup:testimonials</code>
                <p className="mt-2 leading-relaxed">
                    Canonical data: <code>src/data/testimonialSamples.json</code>. Backups:
                    <code> server/backups/testimonials/</code> — the 8 original records verbatim,
                    a full dataset copy, and timestamped exports of every real DB testimonial taken
                    automatically before seeding. No real client record is ever overwritten or deleted.
                </p>
            </div>
        </div>
    );
};

export default TestimonialSamplesPanel;
