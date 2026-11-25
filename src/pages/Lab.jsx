import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Rocket, Wrench, FlaskConical, Globe, Github, RefreshCw,
  Search, Terminal, ExternalLink, Filter, X, Trash2,
  Wrench as ToolkitIcon, Heart, ArrowUpRight, FolderGit2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import api from '../services/api.service';
import ArchiveNote from '../components/ArchiveNote';
import SectionHeading from '../components/SectionHeading';
import { loadPublicSection, isLiveContent, getSnapshotSection, PUBLIC_ENDPOINTS } from '../services/publicContent';
import { mergeUnique, LAB_STATUSES } from '../utils/labClassification';
import socketService from '../services/socket.service';
import { subscribeLabChanged, publishLabChanged } from '../utils/projectSync';
import { recordDevIssue, publicEmptyCopy } from '../utils/publicMessaging';
import ProjectModal from './ProjectModal';
import '../styles/Lab.css';

// Phase 41: the Lab and the Projects page share one classification rule
// (src/utils/labClassification.js), so a portfolio project that happens to be
// `live` or `beta` stays on the Projects page instead of appearing here too.
// Phase 42: the Lab stores real LabEntry records in their own collection.
// The old `lab-sample` tag concept is gone — these are genuine experiments the
// owner maintains, not disposable placeholders.
const LAB_SEED_KEY = 'lab-core';
const CACHE_KEY = 'lab_bundle';

/**
 * Lab card poster.
 *
 * Phase 37: the card used to render `thumbnail || imageUrl` only, so a record
 * whose image lived in `images[]` (the normal case for an uploaded project)
 * showed a letter placeholder instead of its photo. The poster is now resolved
 * the same way the API does, and a broken URL falls back to the designed
 * placeholder instead of a broken-image icon.
 */
const LabThumb = ({ project, statusClass, statusLabel, StatusIcon, sampleLabel }) => {
  const source = project.thumbnail || project.imageUrl || project.images?.[0]?.url || '';
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(source) && !failed;
  const initial = String(project.title || 'L').trim().charAt(0).toUpperCase();

  return (
    <div className={`lab-thumb ${showImage ? 'lab-thumb--photo' : 'lab-thumb--empty'}`}>
      {showImage ? (
        <img
          src={source}
          alt={project.title || 'Lab experiment'}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="lab-thumb-placeholder" aria-hidden="true">
          <span className="lab-thumb-placeholder__glyph">{initial}</span>
          <span className="lab-thumb-placeholder__label">No preview image</span>
        </div>
      )}
      <div className="lab-thumb-overlay" aria-hidden="true"></div>
      <span className={`lab-status lab-status-${statusClass}`}>
        <StatusIcon size={12} /> {statusLabel}
      </span>
      {sampleLabel}
    </div>
  );
};

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

// A seeded record is still a real experiment, but it is the one dataset the
// seeder can refresh. Nothing here is a placeholder.
const isSeeded = (project) => Boolean(project?.seedKey);

const getDemoLink = (links) => {
  const l = links || {};
  return l.netlify || l.live || l.demo || null;
};

const getCodeLink = (links) => (links || {}).github || null;

/**
 * Phase 42 — `embedded` distinguishes the two places this component renders:
 *   - the landing page section (default): no page chrome, no duplicate header;
 *   - the standalone /lab route: shows its own page-level link to Projects.
 */
const Lab = ({ embedded = true }) => {
  const { isOwner: checkOwner } = useAuth();
  const { connected, on, off } = useSocket();
  const owner = typeof checkOwner === 'function' ? checkOwner() : false;

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentSource, setContentSource] = useState('');
  const [dataStatus, setDataStatus] = useState('loading'); // live | partial | archive | loading
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const loadTokenRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const token = ++loadTokenRef.current;
    try {
      const cached = !force && cacheService.get(CACHE_KEY);
      if (cached) {
        setProjects(cached.projects || []);
        setSkills(cached.skills || []);
        setHobbies(cached.hobbies || []);
        setDataStatus('live');
        setContentSource('live');
        setLoading(false);
        return;
      }

      // Each section tries the live API first and falls back to its saved
      // local copy. Visitors always see a complete, consistent page; all
      // technical failures are recorded for the dev diagnostics panel.
      // Phase 42: the Lab reads its OWN endpoint. It used to read the projects
      // feed and filter, which meant a lab entry was still a Project document
      // and the two modules could never be cleanly separated.
      const [labResponse, skillsResponse, hobbiesResponse] = await Promise.all([
        loadPublicSection('lab', { fallbackSection: 'labProjects', key: 'experiments' }),
        loadPublicSection('skills'),
        loadPublicSection('interests')
      ]);
      if (token !== loadTokenRef.current) return;

      const liveLabProjects = Array.isArray(labResponse.experiments) ? labResponse.experiments : [];
      // Complete the section from the SAME local saved copy used for offline
      // visits, so the Lab never flips between empty (API up) and four
      // experiments (API down). Both sources are real local records.
      const savedLab = getSnapshotSection('labProjects');
      const savedLabProjects = Array.isArray(savedLab.projects) ? savedLab.projects : [];
      // Dedupe on stable identity first, then title slug — a rebuilt snapshot
      // changes ids, so id-only or title-only matching both break.
      const realProjects = mergeUnique(liveLabProjects, savedLabProjects);
      const usedSavedCopy = realProjects.length > liveLabProjects.length;
      const realSkills = Array.isArray(skillsResponse.skills) ? skillsResponse.skills : [];
      const realHobbies = Array.isArray(hobbiesResponse.interests)
        ? hobbiesResponse.interests
        : (Array.isArray(hobbiesResponse.data) ? hobbiesResponse.data : []);

      setProjects(realProjects);
      setSkills(realSkills);
      setHobbies(realHobbies);

      const allLive = [labResponse, skillsResponse, hobbiesResponse].every(isLiveContent);
      const fullyLive = allLive && !usedSavedCopy;
      // `partial` = live endpoints answered, but saved experiment records
      // completed the grid. Never label a healthy backend as an archive.
      setDataStatus(fullyLive ? 'live' : allLive ? 'partial' : 'archive');
      setContentSource(fullyLive ? 'live' : 'snapshot');
      // Only cache a fully live section, so a saved copy never masks a
      // backend that comes back online.
      if (fullyLive) {
        cacheService.set(CACHE_KEY, {
          projects: realProjects, skills: realSkills, hobbies: realHobbies
        }, CACHE_TTL.TEN_MINUTES);
      }
    } catch (error) {
      if (token !== loadTokenRef.current) return;
      recordDevIssue({ section: 'lab', endpoint: PUBLIC_ENDPOINTS.lab, error });
      setProjects([]);
      setSkills([]);
      setHobbies([]);
      setDataStatus('archive');
      setContentSource('snapshot');
    } finally {
      if (token === loadTokenRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    cacheService.delete(CACHE_KEY);
    load(true);
  }, [load]);

  useEffect(() => {
    load();
    return () => { loadTokenRef.current++; };
  }, [load]);

  useEffect(() => {
    if (!connected) return;
    const handleChanged = () => {
      setLiveUpdate(true);
      refresh();
      setTimeout(() => setLiveUpdate(false), 2000);
    };
    // `skills_changed` / `interests_changed` were never emitted by the
    // server; the canonical Lab signal is `lab:changed` (plus the existing
    // project broadcasts and the settings namespace event).
    const events = ['project_changed', 'project_updated', 'lab:changed', 'settings:updated'];
    events.forEach(event => on(event, handleChanged));
    return () => events.forEach(event => off(event, handleChanged));
  }, [connected, on, off, refresh]);

  // Phase 24: the root socket only exists for signed-in users. These
  // anonymous-safe signals, cross-tab notices and a hidden-tab-aware poll
  // keep every public Lab page in sync with dashboard edits.
  useEffect(() => socketService.subscribePublicProjects(refresh), [refresh]);
  useEffect(() => socketService.subscribePublicLab(refresh), [refresh]);
  useEffect(() => subscribeLabChanged(refresh), [refresh]);
  useEffect(() => {
    window.addEventListener('settingsChanged', refresh);
    return () => window.removeEventListener('settingsChanged', refresh);
  }, [refresh]);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const poll = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 30000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const metrics = useMemo(() => projects.reduce((acc, p) => {
    const s = String(p.status || '').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {}), [projects]);

  const seededCount = useMemo(() => projects.filter(isSeeded).length, [projects]);

  // A zero metric is not useful public information: only populated values
  // become cards, so the page never prints a bare 0.
  const metricCards = useMemo(() => ([
    { key: 'experiments', icon: FlaskConical, value: projects.length, label: 'Experiments' },
    { key: 'live', icon: Rocket, value: metrics.live || 0, label: 'Live' },
    { key: 'beta', icon: Wrench, value: metrics.beta || 0, label: 'Beta' },
    { key: 'development', icon: Globe, value: metrics.development || 0, label: 'In Development' },
    { key: 'seeded', icon: FlaskConical, value: owner ? seededCount : 0, label: 'Maintained' }
  ].filter(card => card.value > 0)), [projects.length, metrics, seededCount, owner]);

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

  const removeExperiment = async (project) => {
    const id = project.id || project._id;
    if (!id) return;
    if (!window.confirm(`Delete the experiment "${project.title}"?\n\nThis removes the Lab entry only. No portfolio project is affected.`)) return;
    setDeletingId(id);
    try {
      const response = await api.deleteLabEntry(id);
      if (response?.success === false) throw new Error(response.message || 'Delete failed');
      setProjects(prev => prev.filter(p => (p.id || p._id) !== id));
      cacheService.delete(CACHE_KEY);
      cacheService.delete('public_projects');
      window.dispatchEvent(new CustomEvent('settingsChanged'));
      publishLabChanged();
      if (selectedProject && (selectedProject.id || selectedProject._id) === id) setSelectedProject(null);
    } catch (error) {
      window.alert(error?.message || 'Could not delete this experiment. Open the Lab dashboard and try again.');
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

          <SectionHeading
            text="My Lab"
            accent="Lab"
            lede="Experiments, the toolkit behind them, and what I tinker with off the bench."
          />

          <div className="lab-header-meta mt-3">
            <span className={`lab-source lab-source-${dataStatus}`}>
              <FlaskConical size={12} />
              {dataStatus === 'archive' ? 'From the portfolio archive' : 'Latest from the portfolio'}
            </span>
            {owner && connected && (
              <motion.span className="lab-live" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="lab-live-dot"></span> Live socket synced
              </motion.span>
            )}
            {owner && seededCount > 0 && (
              <span className="lab-source lab-source-sample">
                <FlaskConical size={12} /> {seededCount} maintained experiment{seededCount !== 1 ? 's' : ''}
              </span>
            )}
            {owner && liveUpdate && (
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
              <Link to="/dashboard/projects" className="lab-dashboard-link">Projects dashboard</Link>
              {!embedded && (
                <Link to="/projects" className="lab-dashboard-link">
                  <FolderGit2 size={14} /> Projects page
                </Link>
              )}
              <Link to="/dashboard/skills" className="lab-dashboard-link">Skills</Link>
              <Link to="/dashboard/hobbies" className="lab-dashboard-link">Hobbies</Link>
            </div>
          )}

          <ArchiveNote source={contentSource} />
        </div>

        {/* Metrics Row — only non-zero values are shown. */}
        {metricCards.length > 0 && (
          <div className="lab-metrics">
            {metricCards.map(card => (
              <div className="lab-metric" key={card.key}>
                {React.createElement(card.icon, { size: 18 })}
                <div><strong>{card.value}</strong><span>{card.label}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="lab-controls flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="lab-filters" role="tablist" aria-label="Filter lab projects">
            {filters.filter(f => f.key === 'all' || f.count > 0).map(f => (
              <button
                key={f.key}
                role="tab"
                aria-selected={activeFilter === f.key}
                className={`lab-filter ${activeFilter === f.key ? 'lab-filter-active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                {f.count > 0 && <span className="lab-filter-count">{f.count}</span>}
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
              const seedRecord = isSeeded(project);
              const deleting = deletingId === (project.id || project._id);

              return (
                <motion.article
                  layout
                  key={cardKey}
                  className={`lab-card group cursor-pointer hover:border-cyan-500/50 ${seedRecord ? 'lab-card-sample' : ''}`}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.05 }}
                  onClick={() => setSelectedProject(project)}
                >
                  <LabThumb
                    project={project}
                    statusClass={statusClass}
                    statusLabel={statusLabel}
                    StatusIcon={StatusIcon}
                    sampleLabel={owner && seedRecord
                      ? <span className="lab-sample-badge">Lab · maintained</span>
                      : null}
                  />
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
                      {owner && seedRecord && (
                        <button
                          className="lab-btn lab-btn-delete"
                          disabled={deleting}
                          onClick={() => removeExperiment(project)}
                          title="Delete this experiment from the Lab"
                        >
                          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete experiment'}
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
                : publicEmptyCopy('emptyLab')}
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
              <p>A grouped view of the tools used across the experiments.</p>
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
                        {Number(skill.level) > 0 && (
                          <>
                            <div className="lab-skill-bar">
                              <div style={{ width: `${Math.min(100, Number(skill.level))}%` }} />
                            </div>
                            <small>{Number(skill.level)}</small>
                          </>
                        )}
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
              <p>Things I explore away from the bench.</p>
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
          {owner ? (
            <span>
              Projects, skills and hobbies are live database records. Items tagged
              the Lab dashboard holds the experiments shown here. They live in their own collection, separate from portfolio projects.
            </span>
          ) : (
            <span>Experiments, tools and interests from the portfolio. New entries are added regularly.</span>
          )}
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
