import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Rocket, Wrench, FlaskConical, Globe, Github, RefreshCw,
  Search, Terminal, ExternalLink, Filter, X, Trash2, Database,
  Wrench as ToolkitIcon, Heart, ArrowUpRight, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import api from '../services/api.service';
import ProjectModal from './ProjectModal';
import '../styles/Lab.css';

const LAB_STATUSES = ['live', 'beta', 'development', 'experimental'];
const LAB_SAMPLE_TAG = 'lab-sample';
const CACHE_KEY = 'lab_bundle';

const STATUS_LABELS = {
  live: 'Live',
  beta: 'Beta',
  development: 'In Development',
  experimental: 'Experimental'
};

const STATUS_ICONS = {
  live: Rocket,
  beta: Wrench,
  development: FlaskConical,
  experimental: Flame
};

const isSample = (project) =>
  Array.isArray(project?.tags) && project.tags.includes(LAB_SAMPLE_TAG);

const getDemoLink = (links) => {
  const l = links || {};
  return l.netlify || l.live || l.demo || null;
};

const getCodeLink = (links) => (links || {}).github || null;

const settledValue = (result) =>
  result.status === 'fulfilled' && result.value?.success ? result.value : null;

const Lab = () => {
  const { isOwner: checkOwner } = useAuth();
  const { connected, on, off } = useSocket();
  const owner = typeof checkOwner === 'function' ? checkOwner() : false;

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dataStatus, setDataStatus] = useState('loading'); // live | partial | unavailable
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const loadTokenRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const token = ++loadTokenRef.current;
    setLoadError('');
    try {
      const cached = !force && cacheService.get(CACHE_KEY);
      if (cached) {
        setProjects(cached.projects || []);
        setSkills(cached.skills || []);
        setHobbies(cached.hobbies || []);
        setDataStatus('live');
        setLoading(false);
        return;
      }

      // All three collections are the SAME data the dashboard manages:
      // /dashboard/projects, /dashboard/skills and /dashboard/hobbies.
      const [projectsResult, skillsResult, hobbiesResult] = await Promise.allSettled([
        api.request('/public/projects?status=all&limit=100'),
        api.request('/public/skills'),
        api.request('/public/interests')
      ]);
      if (token !== loadTokenRef.current) return;

      const projectsData = settledValue(projectsResult);
      const skillsData = settledValue(skillsResult);
      const hobbiesData = settledValue(hobbiesResult);

      const realProjects = Array.isArray(projectsData?.projects)
        ? projectsData.projects.filter(p => LAB_STATUSES.includes(String(p.status || '').toLowerCase()))
        : [];
      const realSkills = Array.isArray(skillsData?.skills) ? skillsData.skills : [];
      const realHobbies = Array.isArray(hobbiesData?.interests)
        ? hobbiesData.interests
        : (Array.isArray(hobbiesData?.data) ? hobbiesData.data : []);

      setProjects(realProjects);
      setSkills(realSkills);
      setHobbies(realHobbies);

      const okCount = [projectsData, skillsData, hobbiesData].filter(Boolean).length;
      setDataStatus(okCount === 3 ? 'live' : okCount === 0 ? 'unavailable' : 'partial');
      if (okCount < 3) {
        setLoadError('Some lab data is temporarily unavailable. Showing only the records that loaded.');
      }
      if (okCount === 3) {
        cacheService.set(CACHE_KEY, {
          projects: realProjects, skills: realSkills, hobbies: realHobbies
        }, CACHE_TTL.TEN_MINUTES);
      }
    } catch (error) {
      if (token !== loadTokenRef.current) return;
      setProjects([]);
      setSkills([]);
      setHobbies([]);
      setDataStatus('unavailable');
      setLoadError('Lab data is temporarily unavailable. Please try again later.');
    } finally {
      if (token === loadTokenRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => { loadTokenRef.current++; };
  }, [load]);

  useEffect(() => {
    if (!connected) return;
    const handleChanged = () => {
      setLiveUpdate(true);
      cacheService.delete(CACHE_KEY);
      load(true);
      setTimeout(() => setLiveUpdate(false), 2000);
    };
    const events = ['project_changed', 'project_updated', 'skills_changed', 'interests_changed'];
    events.forEach(event => on(event, handleChanged));
    return () => events.forEach(event => off(event, handleChanged));
  }, [connected, on, off, load]);

  const metrics = useMemo(() => projects.reduce((acc, p) => {
    const s = String(p.status || '').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {}), [projects]);

  const sampleCount = useMemo(() => projects.filter(isSample).length, [projects]);

  const skillGroups = useMemo(() => skills.reduce((acc, skill) => {
    const key = skill.category || skill.type || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {}), [skills]);

  const query = searchQuery.trim().toLowerCase();
  const visible = projects.filter(p => {
    if (activeFilter !== 'all' && String(p.status || '').toLowerCase() !== activeFilter) return false;
    if (!query) return true;
    const titleMatch = (p.title || '').toLowerCase().includes(query);
    const descMatch = (p.description || '').toLowerCase().includes(query);
    const techMatch = (p.technologies || []).some(t => String(t).toLowerCase().includes(query));
    const tagMatch = (p.tags || []).some(t => String(t).toLowerCase().includes(query));
    return titleMatch || descMatch || techMatch || tagMatch;
  });

  const filters = [
    { key: 'all', label: 'All', count: projects.length },
    ...LAB_STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s], count: metrics[s] || 0 }))
  ];

  const removeSample = async (project) => {
    const id = project.id || project._id;
    if (!id) return;
    if (!window.confirm(`Delete the sample experiment "${project.title}"?`)) return;
    setDeletingId(id);
    try {
      const response = await api.deleteProject(id);
      if (response?.success === false) throw new Error(response.message || 'Delete failed');
      setProjects(prev => prev.filter(p => (p.id || p._id) !== id));
      cacheService.delete(CACHE_KEY);
      cacheService.delete('public_projects');
      window.dispatchEvent(new CustomEvent('settingsChanged'));
      if (selectedProject && (selectedProject.id || selectedProject._id) === id) setSelectedProject(null);
    } catch (error) {
      window.alert(error?.message || 'Could not delete the sample. Open the Lab dashboard and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <section className="lab-section" id="lab">
        <div className="lab-loader">
          <div className="lab-svg-loader"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="lab-section" id="lab">
      <div className="lab-container">
        {/* Header */}
        <div className="lab-header text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="lab-eyebrow flex items-center gap-1.5">
              <Terminal size={14} className="text-cyan-400" /> Experiments & Security Lab
            </span>
            <button
              onClick={() => { setLiveUpdate(true); cacheService.delete(CACHE_KEY); load(true); setTimeout(() => setLiveUpdate(false), 1200); }}
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-cyan-400 transition"
              title="Refresh Lab data"
            >
              <RefreshCw size={14} className={liveUpdate ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-textColor mb-4">
            My <span className="text-mainColor gradient-text">Lab</span>
          </h2>
          <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto">
            Live experiments, the toolkit behind them, and what I tinker with off the
            bench — all pulled from the same records managed in the dashboard.
          </p>

          <div className="lab-header-meta mt-3">
            <span className={`lab-source lab-source-${dataStatus}`}>
              <Database size={12} />
              {dataStatus === 'live' && 'Live dashboard data'}
              {dataStatus === 'partial' && 'Partial dashboard data'}
              {dataStatus === 'unavailable' && 'Data unavailable'}
            </span>
            {connected && (
              <motion.span className="lab-live" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="lab-live-dot"></span> Live socket synced
              </motion.span>
            )}
            {sampleCount > 0 && (
              <span className="lab-source lab-source-sample">
                <FlaskConical size={12} /> {sampleCount} deletable sample{sampleCount !== 1 ? 's' : ''}
              </span>
            )}
            {liveUpdate && (
              <motion.span className="lab-live lab-live-refresh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RefreshCw size={12} className="lab-live-refresh-spin" /> Synced
              </motion.span>
            )}
          </div>

          {owner && (
            <div className="lab-dashboard-links">
              <Link to="/dashboard/lab" className="lab-dashboard-link">
                <FlaskConical size={14} /> Lab dashboard <ArrowUpRight size={13} />
              </Link>
              <Link to="/dashboard/projects" className="lab-dashboard-link">Projects</Link>
              <Link to="/dashboard/skills" className="lab-dashboard-link">Skills</Link>
              <Link to="/dashboard/hobbies" className="lab-dashboard-link">Hobbies</Link>
            </div>
          )}

          {loadError && (
            <div className="lab-error">
              <AlertCircle size={14} /> {loadError}
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div className="lab-metrics">
          <div className="lab-metric">
            <FlaskConical size={18} />
            <div><strong>{projects.length}</strong><span>Experiments</span></div>
          </div>
          <div className="lab-metric">
            <Rocket size={18} />
            <div><strong>{metrics.live || 0}</strong><span>Live</span></div>
          </div>
          <div className="lab-metric">
            <Wrench size={18} />
            <div><strong>{metrics.beta || 0}</strong><span>Beta</span></div>
          </div>
          <div className="lab-metric">
            <Globe size={18} />
            <div><strong>{metrics.development || 0}</strong><span>In Development</span></div>
          </div>
          <div className="lab-metric">
            <Trash2 size={18} />
            <div><strong>{sampleCount}</strong><span>Samples</span></div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="lab-controls flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="lab-filters" role="tablist" aria-label="Filter lab projects">
            {filters.map(f => (
              <button
                key={f.key}
                role="tab"
                aria-selected={activeFilter === f.key}
                className={`lab-filter ${activeFilter === f.key ? 'lab-filter-active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                <span className="lab-filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiments..."
              className="w-full pl-9 pr-8 py-2 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-textColor placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Project Grid */}
        <motion.div layout className="lab-grid">
          <AnimatePresence mode="popLayout">
            {visible.map((project, index) => {
              const demo = getDemoLink(project.links);
              const code = getCodeLink(project.links);
              const status = String(project.status || 'development').toLowerCase();
              const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.beta;
              const StatusIcon = STATUS_ICONS[status] || FlaskConical;
              const statusClass = status in STATUS_LABELS ? status : 'development';
              const updated = project.updatedAt
                ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                : null;
              const cardKey = project._id || project.id || `lab-${index}`;
              const sample = isSample(project);
              const deleting = deletingId === (project.id || project._id);

              return (
                <motion.article
                  layout
                  key={cardKey}
                  className={`lab-card group cursor-pointer hover:border-cyan-500/50 ${sample ? 'lab-card-sample' : ''}`}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.05 }}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="lab-thumb">
                    {(project.thumbnail || project.imageUrl) ? (
                      <img src={project.thumbnail || project.imageUrl} alt={project.title} loading="lazy" />
                    ) : (
                      <div className="lab-thumb-placeholder">{(project.title || 'L').charAt(0)}</div>
                    )}
                    <div className="lab-thumb-overlay"></div>
                    <span className={`lab-status lab-status-${statusClass}`}>
                      <StatusIcon size={12} /> {statusLabel}
                    </span>
                    {sample && <span className="lab-sample-badge">Sample · deletable</span>}
                  </div>
                  <div className="lab-body">
                    <h3 className="lab-title group-hover:text-cyan-400 transition flex items-center justify-between">
                      <span>{project.title}</span>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 text-cyan-400 transition" />
                    </h3>
                    <p className="lab-desc line-clamp-3">{project.description}</p>
                    {project.technologies?.length > 0 && (
                      <div className="lab-tech">
                        {project.technologies.slice(0, 5).map((t, i) => (
                          <span key={i} className="lab-tech-pill">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="lab-meta">
                      {updated && <span className="lab-meta-item">Updated {updated}</span>}
                      <span className="lab-meta-item">#{index + 1}</span>
                      {project.views > 0 && <span className="lab-meta-item">{project.views} views</span>}
                    </div>
                    <div className="lab-actions" onClick={(e) => e.stopPropagation()}>
                      {demo && (
                        <a className="lab-btn lab-btn-demo" href={demo} target="_blank" rel="noopener noreferrer">
                          <Rocket size={14} /> Live Demo
                        </a>
                      )}
                      {code && (
                        <a className="lab-btn lab-btn-code" href={code} target="_blank" rel="noopener noreferrer">
                          <Github size={14} /> Source
                        </a>
                      )}
                      <button
                        className="lab-btn lab-btn-details text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 hover:border-cyan-500 transition"
                        onClick={() => setSelectedProject(project)}
                      >
                        Inspect Details
                      </button>
                      {owner && sample && (
                        <button
                          className="lab-btn lab-btn-delete"
                          disabled={deleting}
                          onClick={() => removeSample(project)}
                          title="Delete this sample record from the database"
                        >
                          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete sample'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lab-empty text-center py-12">
            <FlaskConical size={36} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">
              {searchQuery
                ? `No lab experiments matching "${searchQuery}"`
                : loadError
                  ? loadError
                  : 'No lab experiments yet. Tag a project with a lab status to show it here.'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mt-3 text-cyan-400 text-sm hover:underline">
                Clear Search
              </button>
            )}
            {owner && (
              <Link to="/dashboard/projects" className="lab-empty-link">
                Manage projects in the dashboard <ArrowUpRight size={13} />
              </Link>
            )}
          </motion.div>
        )}

        {/* Real skills from /dashboard/skills */}
        <div className="lab-data-section" id="lab-toolkit">
          <div className="lab-data-heading">
            <div>
              <span className="lab-data-eyebrow"><ToolkitIcon size={13} /> Real data · Skills</span>
              <h3>Toolkit behind the experiments</h3>
              <p>Grouped from the same skills you manage in the dashboard.</p>
            </div>
            {owner && (
              <Link to="/dashboard/skills" className="lab-dashboard-link">Manage skills <ArrowUpRight size={13} /></Link>
            )}
          </div>
          {Object.keys(skillGroups).length > 0 ? (
            <div className="lab-skill-groups">
              {Object.entries(skillGroups).slice(0, 8).map(([group, items]) => (
                <div className="lab-skill-group" key={group}>
                  <h4>{group} <span>{items.length}</span></h4>
                  <div className="lab-skill-list">
                    {items.slice(0, 8).map((skill, i) => (
                      <div className="lab-skill" key={skill._id || skill.id || i}>
                        <span>{skill.name}</span>
                        <div className="lab-skill-bar">
                          <div style={{ width: `${Math.min(100, Math.max(0, Number(skill.level) || 0))}%` }} />
                        </div>
                        <small>{Number(skill.level) || 0}</small>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="lab-data-empty">No skills published yet.</p>
          )}
        </div>

        {/* Real hobbies/interests from /dashboard/hobbies */}
        <div className="lab-data-section" id="lab-hobbies">
          <div className="lab-data-heading">
            <div>
              <span className="lab-data-eyebrow"><Heart size={13} /> Real data · Hobbies</span>
              <h3>Off the bench</h3>
              <p>The interests stored in the Hobbies manager.</p>
            </div>
            {owner && (
              <Link to="/dashboard/hobbies" className="lab-dashboard-link">Manage hobbies <ArrowUpRight size={13} /></Link>
            )}
          </div>
          {hobbies.length > 0 ? (
            <div className="lab-hobby-grid">
              {hobbies.slice(0, 8).map((hobby, i) => (
                <div className="lab-hobby" key={hobby.id || hobby._id || i}>
                  <div className="lab-hobby-top">
                    <span className="lab-hobby-category">{hobby.category || 'other'}</span>
                    {Number(hobby.level) > 0 && <span className="lab-hobby-level">{hobby.level}%</span>}
                  </div>
                  <h4>{hobby.title || hobby.name}</h4>
                  <p>{hobby.description || 'No description yet.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="lab-data-empty">No hobbies published yet.</p>
          )}
        </div>

        <div className="lab-footer-note">
          <Filter size={13} />
          <span>
            Projects, skills and hobbies are live database records. Items tagged
            <code>{LAB_SAMPLE_TAG}</code> are sample entries that an owner can delete here or in the Lab dashboard.
          </span>
        </div>

        {/* Project Modal Preview */}
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onProjectUpdate={(updated) => {
              setProjects(prev => prev.map(p => (p.id === updated.id || p._id === updated._id) ? updated : p));
              setSelectedProject(updated);
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Lab;
