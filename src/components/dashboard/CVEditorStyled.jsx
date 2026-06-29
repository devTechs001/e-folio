import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Code, Award, Settings, Eye, Download,
  Plus, Trash2, Edit3, Save, FileText, X, Check, ChevronDown, ChevronUp,
  Move, Copy, Globe, Mail, Phone, MapPin, Github, Linkedin, RefreshCw,
  Undo, Redo, History, Upload, AlertCircle, Lightbulb, Sparkles,
  GripVertical, Maximize, Minimize, FileJson, Image, PanelRightOpen,
  PanelRightClose, AlertTriangle, CheckCircle, Clock, Bookmark, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const emptyCV = {
  personalInfo: {
    name: '', title: '', email: '', phone: '', location: '',
    website: '', github: '', linkedin: '', bio: '', avatar: ''
  },
  experience: [],
  education: [],
  skills: {},
  projects: [],
  achievements: [],
  settings: {
    template: 'modern', primaryColor: '#2563eb', fontFamily: 'Inter, sans-serif',
    showPhoto: false, showQRCode: false, showContactIcons: true,
    sectionOrder: ['experience', 'education', 'skills', 'projects', 'achievements'],
    customCSS: ''
  }
};

const templateOptions = [
  { id: 'modern', name: 'Modern', description: 'Clean two-column layout' },
  { id: 'classic', name: 'Classic', description: 'Traditional single column' },
  { id: 'minimal', name: 'Minimal', description: 'Minimalist design' },
  { id: 'creative', name: 'Creative', description: 'Bold creative layout' },
  { id: 'professional', name: 'Professional', description: 'Corporate standard' }
];

const SectionCard = ({ item, index, onEdit, onDelete, onToggle, icon: Icon, children }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -100 }}
    className={`group p-4 rounded-xl border transition-all ${
      item.visible === false
        ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
        : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
          {Icon && <Icon size={16} className="text-cyan-400" />}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onToggle(index)}
          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors">
          {item.visible === false ? <Eye size={14} className="text-slate-500" /> : <Eye size={14} className="text-slate-400" />}
        </button>
        <button onClick={() => onEdit(index)}
          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors">
          <Edit3 size={14} className="text-slate-400" />
        </button>
        <button onClick={() => onDelete(index)}
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-slate-800 rounded-2xl ${size} w-full max-h-[90vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FormModal = ({ showFormModal, setShowFormModal, formMode, activeTab, editingItem, saveFormItem, getSectionLabel }) => {
  const section = activeTab;
  const [form, setForm] = useState({});
  const [newTech, setNewTech] = useState('');
  const [newHighlight, setNewHighlight] = useState('');

  useEffect(() => {
    if (editingItem?.data) {
      setForm({
        ...editingItem.data,
        technologies: editingItem.data.technologies || [],
        highlights: editingItem.data.highlights || []
      });
    } else {
      setForm({
        title: '', company: '', period: '', location: '', description: '',
        degree: '', institution: '', details: '',
        name: '', technologies: [], highlights: [], url: '',
        text: '', visible: true
      });
    }
  }, [editingItem, showFormModal]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addTech = () => {
    if (newTech.trim() && !form.technologies.includes(newTech.trim())) {
      update('technologies', [...(form.technologies || []), newTech.trim()]);
      setNewTech('');
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim() && !form.highlights.includes(newHighlight.trim())) {
      update('highlights', [...(form.highlights || []), newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const renderField = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[key] || ''} onChange={e => update(key, e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm resize-none" rows={opts.rows || 3} {...opts} />
      ) : type === 'select' ? (
        <select value={form[key] || ''} onChange={e => update(key, e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm">
          {opts.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key] || ''} onChange={e => update(key, e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" {...opts} />
      )}
    </div>
  );

  const renderTechInput = () => (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">Technologies</label>
      <div className="flex gap-2 mb-2">
        <input value={newTech} onChange={e => setNewTech(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
          placeholder="Add technology..." className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
        <button onClick={addTech} className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(form.technologies || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
            {t}
            <button onClick={() => update('technologies', form.technologies.filter((_, j) => j !== i))}
              className="hover:text-red-400"><X size={12} /></button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
      title={`${formMode === 'add' ? 'Add' : 'Edit'} ${getSectionLabel()}`}>
      <div className="space-y-4">
        {section === 'experience' && (
          <>
            {renderField('Job Title', 'title')}
            {renderField('Company', 'company')}
            <div className="grid grid-cols-2 gap-4">
              {renderField('Period', 'period')}
              {renderField('Location', 'location')}
            </div>
            {renderField('Description', 'description', 'textarea', { rows: 4 })}
            {renderTechInput()}
          </>
        )}
        {section === 'education' && (
          <>
            {renderField('Degree', 'degree')}
            {renderField('Institution', 'institution')}
            <div className="grid grid-cols-2 gap-4">
              {renderField('Period', 'period')}
              {renderField('Details', 'details')}
            </div>
          </>
        )}
        {section === 'projects' && (
          <>
            {renderField('Project Name', 'name')}
            {renderField('Description', 'description', 'textarea', { rows: 3 })}
            {renderField('URL', 'url')}
            {renderTechInput()}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Highlights</label>
              <div className="flex gap-2 mb-2">
                <input value={newHighlight} onChange={e => setNewHighlight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  placeholder="Add highlight..." className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
                <button onClick={addHighlight} className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">Add</button>
              </div>
              <div className="space-y-1">
                {(form.highlights || []).map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-700/30 rounded-lg text-sm text-slate-300">
                    <span>{h}</span>
                    <button onClick={() => update('highlights', form.highlights.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {section === 'achievements' && (
          <>
            {renderField('Achievement Text', 'text', 'textarea', { rows: 2, placeholder: 'e.g. Best Developer Award — Company (2023)' })}
          </>
        )}
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" id="form-visible" checked={form.visible !== false}
            onChange={e => update('visible', e.target.checked)} className="rounded bg-slate-700 border-slate-600" />
          <label htmlFor="form-visible" className="text-sm text-slate-400">Visible on CV</label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <button onClick={() => setShowFormModal(false)}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={() => saveFormItem(form)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium">
            {formMode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const CVEditorStyled = () => {
  const { theme } = useTheme();
  const { success, error: showError } = useNotifications();
  const cvRef = useRef(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cv, setCV] = useState(JSON.parse(JSON.stringify(emptyCV)));
  const [versions, setVersions] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [showSkillCategoryModal, setShowSkillCategoryModal] = useState(false);
  const [skillCategoryName, setSkillCategoryName] = useState('');
  const [skillCategorySkills, setSkillCategorySkills] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [activeCat, setActiveCat] = useState(null);

  useEffect(() => {
    loadCV();
    loadVersions();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  const loadCV = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCV();
      if (response.success && response.data) {
        const data = response.data;
        const merged = {
          personalInfo: { ...emptyCV.personalInfo, ...(data.personalInfo || {}) },
          experience: data.experience || [],
          education: data.education || [],
          skills: data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills) ? data.skills : {},
          projects: data.projects || [],
          achievements: data.achievements || [],
          settings: { ...emptyCV.settings, ...(data.settings || {}) }
        };
        setCV(merged);
      }
    } catch (err) {
      console.error('Failed to load CV:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await apiService.getCVVersions();
      if (response.success) {
        setVersions(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const saveCV = async () => {
    try {
      setSaving(true);
      const response = await apiService.saveCV(cv);
      if (response.success) {
        success('CV saved successfully');
        setUnsavedChanges(false);
        loadVersions();
      } else {
        showError(response.message || 'Failed to save CV');
      }
    } catch (err) {
      showError('Failed to save CV');
    } finally {
      setSaving(false);
    }
  };

  const createVersion = async () => {
    try {
      const response = await apiService.createCVVersion(`Version ${versions.length + 1}`);
      if (response.success) {
        success('Version created');
        loadVersions();
      }
    } catch (err) {
      showError('Failed to create version');
    }
  };

  const updateCV = (section, data) => {
    setCV(prev => ({ ...prev, [section]: data }));
    setUnsavedChanges(true);
  };

  const downloadAsHtml = useCallback(() => {
    const p = cv.personalInfo;
    const primaryColor = cv.settings.primaryColor || '#2563eb';
    const hasSkills = Object.keys(cv.skills || {}).length > 0;
    const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${cv.settings.fontFamily || 'Inter, sans-serif'};color:#0f172a;background:#f1f5f9;line-height:1.5}
.cv{max-width:900px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08)}
header{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:32px 40px}
.header-inner{display:flex;gap:32px;align-items:center}
.avatar{width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:3px solid rgba(255,255,255,0.2);font-size:36px;color:rgba(255,255,255,0.5)}
.info{flex:1}
.info h1{font-size:28px;font-weight:700;margin:0 0 4px;letter-spacing:-0.5px}
.info .title{font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 8px}
.info .bio{font-size:13px;color:rgba(255,255,255,0.65);margin:0;line-height:1.5;max-width:500px}
.contact-bar{display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)}
.contact-bar span{font-size:12px;color:rgba(255,255,255,0.8)}
main{display:grid;grid-template-columns:1.4fr 1fr}
.left{padding:32px;border-right:1px solid #e2e8f0}
.right{padding:32px;background:#fafbfc}
.section{margin-bottom:28px}
.section:last-child{margin-bottom:0}
.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${primaryColor};margin:0 0 16px;display:flex;align-items:center;gap:8px}
.section-title:after{content:'';flex:1;height:1px;background:#e2e8f0}
.exp{margin-bottom:20px}
.exp:last-child{margin-bottom:0}
.exp-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:12px}
.exp-h h4{font-size:15px;font-weight:600;color:#0f172a;margin:0}
.exp-h .company{font-size:13px;color:${primaryColor};font-weight:500;display:block}
.exp-meta{text-align:right;font-size:12px;color:#94a3b8;white-space:nowrap}
.exp-desc{font-size:13px;color:#475569;line-height:1.6;margin:0 0 8px}
.tech{display:flex;flex-wrap:wrap;gap:4px}
.tech span{font-size:11px;background:#eef2ff;color:#4338ca;padding:2px 10px;border-radius:20px;font-weight:500}
.project{margin-bottom:20px}
.project:last-child{margin-bottom:0}
.project h4{font-size:15px;font-weight:600;color:#0f172a;margin:0 0 4px}
.project p{font-size:13px;color:#475569;margin:0 0 6px;line-height:1.5}
.edu{margin-bottom:16px}
.edu:last-child{margin-bottom:0}
.edu h4{font-size:14px;font-weight:600;color:#0f172a;margin:0 0 2px}
.edu .inst{font-size:13px;color:#64748b;margin:0 0 2px}
.edu .per{font-size:12px;color:#94a3b8}
.skill-b{margin-bottom:16px}
.skill-b:last-child{margin-bottom:0}
.skill-b h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 8px}
.skill-tags{display:flex;flex-wrap:wrap;gap:6px}
.skill-tags span{font-size:12px;background:#fff;color:#334155;padding:4px 12px;border-radius:6px;border:1px solid #e2e8f0;font-weight:500}
.achieve{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;border-left:3px solid ${primaryColor};margin-bottom:8px;font-size:13px;color:#475569}
.achieve:last-child{margin-bottom:0}
@media(max-width:768px){main{grid-template-columns:1fr}.header-inner{flex-direction:column;text-align:center}.left{border-right:none;border-bottom:1px solid #e2e8f0}}
@media print{body{background:#fff}.cv{box-shadow:none;border-radius:0;margin:0}}
`;
    const renderExp = () => cv.experience.filter(e => e.visible !== false).map(e => `
<div class="exp">
<div class="exp-h">
<div><h4>${e.title || ''}</h4><span class="company">${e.company || ''}</span></div>
<div class="exp-meta">${e.period || ''}${e.location ? '<br/>'+e.location : ''}</div>
</div>
${e.description ? `<p class="exp-desc">${e.description}</p>` : ''}
${e.technologies?.length ? '<div class="tech">'+e.technologies.map(t => `<span>${t}</span>`).join('')+'</div>' : ''}
</div>`).join('');

    const renderEdu = () => cv.education.filter(e => e.visible !== false).map(e => `
<div class="edu">
<h4>${e.degree || ''}</h4>
<div class="inst">${e.institution || ''}</div>
<div class="per">${e.period || ''}${e.details ? ' — '+e.details : ''}</div>
</div>`).join('');

    const renderSkills = () => Object.entries(cv.skills || {}).map(([cat, list]) => list?.length ? `
<div class="skill-b">
<h4>${cat}</h4>
<div class="skill-tags">${list.map(s => `<span>${s}</span>`).join('')}</div>
</div>` : '').join('');

    const renderProjects = () => cv.projects.filter(p => p.visible !== false).map(p => `
<div class="project">
<h4>${p.name || ''}</h4>
${p.description ? `<p>${p.description}</p>` : ''}
${p.technologies?.length ? '<div class="tech">'+p.technologies.map(t => `<span>${t}</span>`).join('')+'</div>' : ''}
</div>`).join('');

    const renderAchievements = () => cv.achievements.filter(a => a.visible !== false).map(a =>
      `<div class="achieve">${a.text || ''}</div>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${p.name || 'CV'} - Curriculum Vitae</title>
<style>${css}</style>
</head>
<body>
<div class="cv">
<header>
<div class="header-inner">
<div class="avatar">${(p.name || '?').charAt(0)}</div>
<div class="info">
<h1>${p.name || ''}</h1>
${p.title ? `<div class="title">${p.title}</div>` : ''}
${p.bio ? `<div class="bio">${p.bio}</div>` : ''}
</div>
</div>
<div class="contact-bar">
${p.email ? `<span>${p.email}</span>` : ''}
${p.phone ? `<span>${p.phone}</span>` : ''}
${p.location ? `<span>${p.location}</span>` : ''}
${p.website ? `<span>${p.website}</span>` : ''}
${p.github ? `<span>${p.github}</span>` : ''}
${p.linkedin ? `<span>${p.linkedin}</span>` : ''}
</div>
</header>
<main>
<div class="left">
${cv.experience?.length ? `<div class="section"><div class="section-title">Experience</div>${renderExp()}</div>` : ''}
${cv.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${renderProjects()}</div>` : ''}
</div>
<div class="right">
${hasSkills ? `<div class="section"><div class="section-title">Skills</div>${renderSkills()}</div>` : ''}
${cv.education?.length ? `<div class="section"><div class="section-title">Education</div>${renderEdu()}</div>` : ''}
${cv.achievements?.length ? `<div class="section"><div class="section-title">Achievements</div>${renderAchievements()}</div>` : ''}
</div>
</main>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = `${(p.name || 'CV').replace(/\s+/g, '_')}_CV.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    success('CV downloaded as HTML');
  }, [cv, success]);

  const downloadAsJson = () => {
    const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${(cv.personalInfo.name || 'CV').replace(/\s+/g, '_')}_CV.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    success('CV exported as JSON');
  };

  const addSkillCategory = () => {
    if (!skillCategoryName.trim()) return;
    const skillsList = skillCategorySkills.split(',').map(s => s.trim()).filter(Boolean);
    updateCV('skills', {
      ...cv.skills,
      [skillCategoryName.trim()]: skillsList
    });
    setSkillCategoryName('');
    setSkillCategorySkills('');
    setShowSkillCategoryModal(false);
    success('Skill category added');
  };

  const removeSkillCategory = (cat) => {
    const newSkills = { ...cv.skills };
    delete newSkills[cat];
    updateCV('skills', newSkills);
  };

  const addSkillToCategory = (cat, skill) => {
    const current = cv.skills[cat] || [];
    updateCV('skills', { ...cv.skills, [cat]: [...current, skill] });
  };

  const removeSkillFromCategory = (cat, index) => {
    const current = [...(cv.skills[cat] || [])];
    current.splice(index, 1);
    updateCV('skills', { ...cv.skills, [cat]: current });
  };

  const openAddModal = () => {
    setFormMode('add');
    setEditingItem(null);
    setShowFormModal(true);
  };

  const openEditModal = (index) => {
    setFormMode('edit');
    setEditingItem({ index, data: { ...getSectionData()[index] } });
    setShowFormModal(true);
  };

  const getSectionData = () => {
    switch (activeTab) {
      case 'experience': return cv.experience;
      case 'education': return cv.education;
      case 'projects': return cv.projects;
      case 'achievements': return cv.achievements;
      default: return [];
    }
  };

  const getSectionLabel = () => {
    switch (activeTab) {
      case 'experience': return 'Experience';
      case 'education': return 'Education';
      case 'projects': return 'Project';
      case 'achievements': return 'Achievement';
      default: return 'Item';
    }
  };

  const saveFormItem = (data) => {
    const section = activeTab;
    if (formMode === 'add') {
      updateCV(section, [...getSectionData(), { id: generateId(), ...data }]);
    } else if (editingItem) {
      const items = [...getSectionData()];
      items[editingItem.index] = { ...items[editingItem.index], ...data };
      updateCV(section, items);
    }
    setShowFormModal(false);
    setEditingItem(null);
  };

  const deleteSectionItem = (index) => {
    const section = activeTab;
    const items = getSectionData().filter((_, i) => i !== index);
    updateCV(section, items);
  };

  const toggleSectionItem = (index) => {
    const section = activeTab;
    const items = getSectionData().map((item, i) =>
      i === index ? { ...item, visible: item.visible === false ? true : false } : item
    );
    updateCV(section, items);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase, count: cv.experience.filter(e => e.visible !== false).length },
    { id: 'education', label: 'Education', icon: GraduationCap, count: cv.education.filter(e => e.visible !== false).length },
    { id: 'skills', label: 'Skills', icon: Code, count: Object.keys(cv.skills || {}).length },
    { id: 'projects', label: 'Projects', icon: Award, count: cv.projects.filter(p => p.visible !== false).length },
    { id: 'achievements', label: 'Achievements', icon: Star, count: cv.achievements.filter(a => a.visible !== false).length },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  const renderPersonalInfo = () => {
    const p = cv.personalInfo;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
            <input value={p.name} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" placeholder="Dev Techs" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
            <input value={p.title} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" placeholder="Full Stack Developer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><Mail size={14} className="inline mr-1" />Email</label>
            <input value={p.email} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><Phone size={14} className="inline mr-1" />Phone</label>
            <input value={p.phone} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><MapPin size={14} className="inline mr-1" />Location</label>
            <input value={p.location} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, location: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><Globe size={14} className="inline mr-1" />Website</label>
            <input value={p.website} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, website: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><Github size={14} className="inline mr-1" />GitHub</label>
            <input value={p.github} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, github: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5"><Linkedin size={14} className="inline mr-1" />LinkedIn</label>
            <input value={p.linkedin} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, linkedin: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Bio / Summary</label>
          <textarea value={p.bio} onChange={e => updateCV('personalInfo', { ...cv.personalInfo, bio: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm resize-none" rows={3} />
        </div>
      </div>
    );
  };

  const renderExperience = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cv.experience.length} experience entries</p>
        <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
          <Plus size={16} /> Add Experience
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {cv.experience.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No experience entries yet. Click "Add Experience" to start.</p>
          </div>
        ) : (
          cv.experience.map((item, i) => (
            <SectionCard key={item.id || i} item={item} index={i}
              onEdit={openEditModal} onDelete={deleteSectionItem} onToggle={toggleSectionItem} icon={Briefcase}>
              <h4 className="text-sm font-semibold text-white">{item.title || 'Untitled'}</h4>
              <p className="text-xs text-cyan-400">{item.company}</p>
              {item.period && <p className="text-xs text-slate-500 mt-0.5">{item.period}{item.location ? ` · ${item.location}` : ''}</p>}
            </SectionCard>
          ))
        )}
      </AnimatePresence>
      <FormModal showFormModal={showFormModal} setShowFormModal={setShowFormModal} formMode={formMode} activeTab={activeTab} editingItem={editingItem} saveFormItem={saveFormItem} getSectionLabel={getSectionLabel} />
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cv.education.length} education entries</p>
        <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
          <Plus size={16} /> Add Education
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {cv.education.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No education entries yet.</p>
          </div>
        ) : (
          cv.education.map((item, i) => (
            <SectionCard key={item.id || i} item={item} index={i}
              onEdit={openEditModal} onDelete={deleteSectionItem} onToggle={toggleSectionItem} icon={GraduationCap}>
              <h4 className="text-sm font-semibold text-white">{item.degree || 'Untitled'}</h4>
              <p className="text-xs text-slate-400">{item.institution}</p>
              {item.period && <p className="text-xs text-slate-500 mt-0.5">{item.period}{item.details ? ` — ${item.details}` : ''}</p>}
            </SectionCard>
          ))
        )}
      </AnimatePresence>
      <FormModal showFormModal={showFormModal} setShowFormModal={setShowFormModal} formMode={formMode} activeTab={activeTab} editingItem={editingItem} saveFormItem={saveFormItem} getSectionLabel={getSectionLabel} />
    </div>
  );

  const renderSkills = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{Object.keys(cv.skills).length} categories</p>
          <button onClick={() => setShowSkillCategoryModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
            <Plus size={16} /> Add Category
          </button>
        </div>
        <Modal isOpen={showSkillCategoryModal} onClose={() => setShowSkillCategoryModal(false)} title="Add Skill Category">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Category Name</label>
              <input value={skillCategoryName} onChange={e => setSkillCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" placeholder="e.g. Frontend" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Skills (comma separated)</label>
              <input value={skillCategorySkills} onChange={e => setSkillCategorySkills(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" placeholder="React, Vue.js, TypeScript" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
              <button onClick={() => setShowSkillCategoryModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
              <button onClick={addSkillCategory}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium">Add</button>
            </div>
          </div>
        </Modal>
        {Object.keys(cv.skills).length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Code size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No skill categories yet. Click "Add Category" to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(cv.skills).map(([cat, skills]) => (
              <div key={cat} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <button onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                  <span className="text-sm font-semibold text-white">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{skills?.length || 0} skills</span>
                    <button onClick={e => { e.stopPropagation(); removeSkillCategory(cat); }}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                    {activeCat === cat ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>
                {activeCat === cat && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex gap-2">
                      <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkillToCategory(cat, newSkillName.trim()); setNewSkillName(''); } }}
                        placeholder="Add skill..." className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
                      <button onClick={() => { addSkillToCategory(cat, newSkillName.trim()); setNewSkillName(''); }}
                        className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(skills || []).map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
                          {skill}
                          <button onClick={() => removeSkillFromCategory(cat, i)}
                            className="hover:text-red-400"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProjects = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cv.projects.length} projects</p>
        <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
          <Plus size={16} /> Add Project
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {cv.projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Award size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects yet.</p>
          </div>
        ) : (
          cv.projects.map((item, i) => (
            <SectionCard key={item.id || i} item={item} index={i}
              onEdit={openEditModal} onDelete={deleteSectionItem} onToggle={toggleSectionItem} icon={Award}>
              <h4 className="text-sm font-semibold text-white">{item.name || 'Untitled'}</h4>
              {item.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>}
              {item.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.technologies.map((t, j) => <span key={j} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded">{t}</span>)}
                </div>
              )}
            </SectionCard>
          ))
        )}
      </AnimatePresence>
      <FormModal showFormModal={showFormModal} setShowFormModal={setShowFormModal} formMode={formMode} activeTab={activeTab} editingItem={editingItem} saveFormItem={saveFormItem} getSectionLabel={getSectionLabel} />
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cv.achievements.length} achievements</p>
        <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
          <Plus size={16} /> Add Achievement
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {cv.achievements.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Star size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No achievements yet.</p>
          </div>
        ) : (
          cv.achievements.map((item, i) => (
            <SectionCard key={item.id || i} item={item} index={i}
              onEdit={openEditModal} onDelete={deleteSectionItem} onToggle={toggleSectionItem} icon={Star}>
              <p className="text-sm text-slate-300">{item.text || 'Untitled'}</p>
            </SectionCard>
          ))
        )}
      </AnimatePresence>
      <FormModal showFormModal={showFormModal} setShowFormModal={setShowFormModal} formMode={formMode} activeTab={activeTab} editingItem={editingItem} saveFormItem={saveFormItem} getSectionLabel={getSectionLabel} />
    </div>
  );

  const renderSettings = () => {
    const s = cv.settings;
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Template</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templateOptions.map(t => (
              <button key={t.id} onClick={() => updateCV('settings', { ...cv.settings, template: t.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  s.template === t.id
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-500/30'
                }`}>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs mt-0.5 opacity-70">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={s.primaryColor} onChange={e => updateCV('settings', { ...cv.settings, primaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer bg-transparent" />
              <input value={s.primaryColor} onChange={e => updateCV('settings', { ...cv.settings, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Font Family</label>
            <select value={s.fontFamily} onChange={e => updateCV('settings', { ...cv.settings, fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm">
              <option value="Inter, sans-serif">Inter</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="'Segoe UI', sans-serif">Segoe UI</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={s.showPhoto} onChange={e => updateCV('settings', { ...cv.settings, showPhoto: e.target.checked })}
              className="rounded bg-slate-700 border-slate-600" />
            <span className="text-sm text-slate-300">Show Photo on CV</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={s.showContactIcons} onChange={e => updateCV('settings', { ...cv.settings, showContactIcons: e.target.checked })}
              className="rounded bg-slate-700 border-slate-600" />
            <span className="text-sm text-slate-300">Show Contact Icons</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Custom CSS</label>
          <textarea value={s.customCSS} onChange={e => updateCV('settings', { ...cv.settings, customCSS: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm font-mono resize-none" rows={6}
            placeholder="/* Add custom CSS overrides */" />
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const p = cv.personalInfo;
    const primaryColor = cv.settings.primaryColor || '#2563eb';
    const hasSkills = Object.keys(cv.skills || {}).length > 0;
    const visibleExp = cv.experience.filter(e => e.visible !== false);
    const visibleEdu = cv.education.filter(e => e.visible !== false);
    const visibleProjects = cv.projects.filter(p => p.visible !== false);
    const visibleAchievements = cv.achievements.filter(a => a.visible !== false);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Live preview of your CV</p>
          <div className="flex items-center gap-2">
            <button onClick={downloadAsHtml}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm">
              <FileText size={16} /> HTML
            </button>
            <button onClick={downloadAsJson}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
              <FileJson size={16} /> JSON
            </button>
          </div>
        </div>
        <div ref={cvRef} className="bg-white rounded-xl overflow-hidden shadow-xl" style={{ fontFamily: cv.settings.fontFamily }}>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-3xl text-white/50 border-2 border-white/20">
                {(p.name || '?').charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">{p.name || 'Your Name'}</h1>
                {p.title && <div className="text-sm text-white/80 mt-1">{p.title}</div>}
                {p.bio && <div className="text-xs text-white/60 mt-2 max-w-lg">{p.bio}</div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10 text-xs text-white/80 justify-center sm:justify-start">
              {p.email && <span>{p.email}</span>}
              {p.phone && <span>{p.phone}</span>}
              {p.location && <span>{p.location}</span>}
              {p.website && <span>{p.website}</span>}
              {p.github && <span>{p.github}</span>}
              {p.linkedin && <span>{p.linkedin}</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="md:col-span-3 p-6 md:border-r border-gray-200">
              {visibleExp.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Experience</h3>
                  <div className="space-y-5">
                    {visibleExp.map((e, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{e.title}</h4>
                            {e.company && <span className="text-xs font-medium" style={{ color: primaryColor }}>{e.company}</span>}
                          </div>
                          <div className="text-xs text-gray-400 text-right whitespace-nowrap">
                            {e.period}{e.location ? <><br/>{e.location}</> : ''}
                          </div>
                        </div>
                        {e.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{e.description}</p>}
                        {e.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {e.technologies.map((t, j) => <span key={j} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {visibleProjects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Projects</h3>
                  <div className="space-y-4">
                    {visibleProjects.map((proj, i) => (
                      <div key={i}>
                        <h4 className="text-sm font-semibold text-gray-900">{proj.name}</h4>
                        {proj.description && <p className="text-xs text-gray-600 mt-1">{proj.description}</p>}
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.map((t, j) => <span key={j} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2 p-6 bg-gray-50">
              {hasSkills && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Skills</h3>
                  <div className="space-y-4">
                    {Object.entries(cv.skills || {}).map(([cat, list]) => list?.length > 0 ? (
                      <div key={cat}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((s, i) => <span key={i} className="px-2.5 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">{s}</span>)}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
              {visibleEdu.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Education</h3>
                  <div className="space-y-3">
                    {visibleEdu.map((e, i) => (
                      <div key={i}>
                        <h4 className="text-sm font-semibold text-gray-900">{e.degree}</h4>
                        <div className="text-xs text-gray-500">{e.institution}</div>
                        <div className="text-xs text-gray-400">{e.period}{e.details ? ` — ${e.details}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {visibleAchievements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Achievements</h3>
                  <div className="space-y-2">
                    {visibleAchievements.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-white rounded-lg border-l-2 text-xs text-gray-600" style={{ borderLeftColor: primaryColor }}>
                        {a.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal': return renderPersonalInfo();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'skills': return renderSkills();
      case 'projects': return renderProjects();
      case 'achievements': return renderAchievements();
      case 'settings': return renderSettings();
      case 'preview': return renderPreview();
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading CV editor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="CV Editor"
      subtitle="Create and manage your professional curriculum vitae"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={createVersion}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
            <History size={16} /> Save Version
          </button>
          <button onClick={() => setShowVersionModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            <Bookmark size={16} /> Versions ({versions.length})
          </button>
          <button
            onClick={saveCV}
            disabled={saving || !unsavedChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saving || !unsavedChanges
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            }`}
          >
            <Save size={16} />
            {saving ? 'Saving...' : unsavedChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-0">
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 p-4 lg:p-6 overflow-x-auto lg:overflow-visible">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}>
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                    }`}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 min-w-0 border-t lg:border-t-0 lg:border-l border-slate-700/50">
          <div className="p-4 lg:p-6">
            {unsavedChanges && (
              <div className="flex items-center gap-2 px-4 py-2 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-yellow-400">You have unsaved changes. Click "Save Changes" to persist.</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} title="Version History" size="max-w-lg">
        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No versions saved yet. Click "Save Version" to create one.</p>
          ) : (
            [...versions].reverse().map((v, i) => (
              <div key={v._id || i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-sm text-white font-medium">{v.name}</p>
                  <p className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const response = await apiService.restoreCVVersion(v._id);
                      if (response.success) {
                        const data = response.data;
                        setCV({
                          personalInfo: { ...emptyCV.personalInfo, ...(data.personalInfo || {}) },
                          experience: data.experience || [],
                          education: data.education || [],
                          skills: data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills) ? data.skills : {},
                          projects: data.projects || [],
                          achievements: data.achievements || [],
                          settings: { ...emptyCV.settings, ...(data.settings || {}) }
                        });
                        setUnsavedChanges(true);
                        success('Version restored');
                        setShowVersionModal(false);
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                    Restore
                  </button>
                  <button
                    onClick={async () => {
                      await apiService.deleteCVVersion(v._id);
                      loadVersions();
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default CVEditorStyled;
