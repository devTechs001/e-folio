import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, FileText, File, ArrowLeft, Loader2, Mail, Phone, MapPin, Globe, Github, Linkedin, User } from 'lucide-react';
import '../styles/CVComponent.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserCVPage = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const cvRef = useRef(null);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        const res = await fetch(`${API_URL}/public/cv/${username}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'CV not found');
        }
      } catch (err) {
        setError('Failed to load CV');
      } finally {
        setLoading(false);
      }
    };
    fetchCV();
  }, [username]);

  const downloadAsImage = async () => {
    if (!cvRef.current) return;
    setIsGenerating(true);
    try {
      const el = cvRef.current;
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: false, backgroundColor: '#ffffff',
        logging: false, width: el.scrollWidth, height: el.scrollHeight,
        windowWidth: el.scrollWidth, windowHeight: el.scrollHeight
      });
      const link = document.createElement('a');
      link.download = `${data.user.name}_CV.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('CV image error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHtml = () => {
    if (!data) return;
    const { cv, user } = data;
    const p = cv.personalInfo || {};

    let skillsHtml = '';
    if (cv.skills) {
      if (typeof cv.skills === 'object' && !Array.isArray(cv.skills)) {
        skillsHtml = Object.entries(cv.skills).map(([cat, list]) => `
          <div class="skill-b"><h4>${cat}</h4><div class="skill-tags">${(list || []).map(s => `<span>${s}</span>`).join('')}</div></div>
        `).join('');
      } else if (Array.isArray(cv.skills)) {
        skillsHtml = `<div class="skill-tags">${cv.skills.map(s => `<span>${s.name || s}</span>`).join('')}</div>`;
      }
    }

    const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,'Segoe UI',system-ui,sans-serif;color:#0f172a;background:#f1f5f9;line-height:1.5}
.cv{max-width:900px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08)}
header{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:32px 40px}
.header-inner{display:flex;gap:32px;align-items:center}
.avatar{width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:3px solid rgba(255,255,255,0.2);font-size:36px}
.info{flex:1}.info h1{font-size:28px;font-weight:700;margin:0 0 4px}.info .title{font-size:15px;color:rgba(255,255,255,0.8)}
.contact-bar{display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)}
.contact-bar span{font-size:12px;color:rgba(255,255,255,0.8)}
main{display:grid;grid-template-columns:1.4fr 1fr}
.left{padding:32px;border-right:1px solid #e2e8f0}
.right{padding:32px;background:#fafbfc}
.section{margin-bottom:28px}.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 16px}
.exp{margin-bottom:20px}.exp-h{display:flex;justify-content:space-between;margin-bottom:6px}
.exp-h h4{font-size:15px;font-weight:600}.exp-meta{text-align:right;font-size:12px;color:#94a3b8}
.exp-desc{font-size:13px;color:#475569;margin:0 0 8px}
.tech{display:flex;flex-wrap:wrap;gap:4px}
.tech span{font-size:11px;background:#eef2ff;color:#4338ca;padding:2px 10px;border-radius:20px;font-weight:500}
.project{margin-bottom:20px}.project h4{font-size:15px;font-weight:600}
.skill-tags{display:flex;flex-wrap:wrap;gap:6px}
.skill-tags span{font-size:12px;background:#fff;color:#334155;padding:4px 12px;border-radius:6px;border:1px solid #e2e8f0}
.skill-b{margin-bottom:16px}.skill-b h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 8px}
.edu{margin-bottom:16px}.edu h4{font-size:14px;font-weight:600}
.achieve{padding:10px 12px;background:#fff;border-radius:8px;border-left:3px solid #2563eb;margin-bottom:8px}
@media(max-width:768px){main{grid-template-columns:1fr}}@media print{body{background:#fff}.cv{box-shadow:none;margin:0;border-radius:0}}
`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${p.name || user.name} - CV</title><style>${css}</style></head><body>
<div class="cv"><header><div class="header-inner"><div class="avatar">${(p.name || user.name).charAt(0)}</div>
<div class="info"><h1>${p.name || user.name}</h1><div class="title">${p.title || ''}</div></div></div>
<div class="contact-bar">${p.email ? `<span>${p.email}</span>` : ''}${p.phone ? `<span>${p.phone}</span>` : ''}${p.location ? `<span>${p.location}</span>` : ''}</div></header>
<main><div class="left">${(cv.experience || []).length ? `<div class="section"><div class="section-title">Experience</div>${
      cv.experience.map(e => `<div class="exp"><div class="exp-h"><div><h4>${e.title}</h4></div><div class="exp-meta">${e.period || ''}</div></div><div class="exp-desc">${e.description || ''}</div>${
        e.technologies?.length ? `<div class="tech">${e.technologies.map(t => `<span>${t}</span>`).join('')}</div>` : ''}</div>`
      ).join('')
    }</div>` : ''}${(cv.projects || []).length ? `<div class="section"><div class="section-title">Projects</div>${
      cv.projects.map(p => `<div class="project"><h4>${p.name}</h4><p>${p.description || ''}</p>${
        p.technologies?.length ? `<div class="tech">${p.technologies.map(t => `<span>${t}</span>`).join('')}</div>` : ''}</div>`
      ).join('')
    }</div>` : ''}</div>
<div class="right">${skillsHtml ? `<div class="section"><div class="section-title">Skills</div>${skillsHtml}</div>` : ''}${
      (cv.education || []).length ? `<div class="section"><div class="section-title">Education</div>${
        cv.education.map(e => `<div class="edu"><h4>${e.degree}</h4><p>${e.institution || ''}${e.details ? ` &mdash; ${e.details}` : ''}</p></div>`).join('')
      }</div>` : ''}${
      (cv.achievements || []).length ? `<div class="section"><div class="section-title">Achievements</div>${
        cv.achievements.map(a => `<div class="achieve">${a.text || a}</div>`).join('')
      }</div>` : ''}</div>
</main></div></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = `${user.name}_CV.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { cv, user } = data;
  const p = cv.personalInfo || {};

  const getSkillsEntries = () => {
    if (!cv.skills) return [];
    if (typeof cv.skills === 'object' && !Array.isArray(cv.skills)) {
      return Object.entries(cv.skills);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex gap-3">
            <button onClick={downloadAsImage} disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50">
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Download size={16} /> Image</>}
            </button>
            <button onClick={downloadAsHtml}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg">
              <FileText size={16} /> HTML
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} ref={cvRef} className="cv-content bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="cv-header" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
            <div className="header-content flex gap-8 items-center">
              <div className="cv-avatar w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 border-white/20" style={{ background: 'rgba(255,255,255,0.12)' }}>
                {(p.name || user.name).charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">{p.name || user.name}</h1>
                {p.title && <div className="text-sm text-white/80 mb-2">{p.title}</div>}
                {p.bio && <p className="text-xs text-white/60 max-w-lg">{p.bio}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {p.email && <span className="flex items-center gap-1.5 text-xs text-white/80"><Mail size={12} />{p.email}</span>}
              {p.phone && <span className="flex items-center gap-1.5 text-xs text-white/80"><Phone size={12} />{p.phone}</span>}
              {p.location && <span className="flex items-center gap-1.5 text-xs text-white/80"><MapPin size={12} />{p.location}</span>}
              {p.website && <span className="flex items-center gap-1.5 text-xs text-white/80"><Globe size={12} />{p.website}</span>}
              {p.github && <span className="flex items-center gap-1.5 text-xs text-white/80"><Github size={12} />{p.github}</span>}
              {p.linkedin && <span className="flex items-center gap-1.5 text-xs text-white/80"><Linkedin size={12} />{p.linkedin}</span>}
            </div>
          </div>

          <div className="grid grid-cols-[1.4fr_1fr] max-md:grid-cols-1">
            <div className="p-8 border-r border-slate-200 max-md:border-r-0">
              {cv.experience?.length > 0 && (
                <div className="mb-7">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Experience</h3>
                  {cv.experience.filter(e => e.visible !== false).map((e, i) => (
                    <div key={i} className="mb-5 last:mb-0">
                      <div className="flex justify-between gap-3 mb-1.5">
                        <div><h4 className="text-sm font-semibold text-slate-900">{e.title}</h4><span className="text-xs text-blue-600 font-medium">{e.company}</span></div>
                        <div className="text-xs text-slate-400 text-right shrink-0">{e.period}{e.location ? `\n${e.location}` : ''}</div>
                      </div>
                      {e.description && <p className="text-xs text-slate-600 leading-relaxed mb-2">{e.description}</p>}
                      {e.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1">{e.technologies.map((t, j) => <span key={j} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {cv.projects?.length > 0 && (
                <div className="mb-7">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Projects</h3>
                  {cv.projects.filter(pr => pr.visible !== false).map((pr, i) => (
                    <div key={i} className="mb-5 last:mb-0">
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{pr.name}</h4>
                      {pr.description && <p className="text-xs text-slate-600 leading-relaxed mb-1.5">{pr.description}</p>}
                      {pr.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1">{pr.technologies.map((t, j) => <span key={j} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50/50">
              {getSkillsEntries().length > 0 && (
                <div className="mb-7">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Skills</h3>
                  {getSkillsEntries().map(([cat, list]) => (
                    <div key={cat} className="mb-4 last:mb-0">
                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">{cat}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(list || []).map((s, i) => <span key={i} className="text-[11px] bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cv.education?.length > 0 && (
                <div className="mb-7">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Education</h3>
                  {cv.education.filter(e => e.visible !== false).map((e, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <h4 className="text-sm font-semibold text-slate-900">{e.degree}</h4>
                      <div className="text-xs text-slate-500">{e.institution}{e.details ? ` — ${e.details}` : ''}</div>
                      {e.period && <div className="text-xs text-slate-400">{e.period}</div>}
                    </div>
                  ))}
                </div>
              )}
              {cv.achievements?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">Achievements</h3>
                  {cv.achievements.filter(a => a.visible !== false).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-l-[3px] border-blue-600 mb-2 last:mb-0 text-xs text-slate-600">
                      <span>{a.text || a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserCVPage;
