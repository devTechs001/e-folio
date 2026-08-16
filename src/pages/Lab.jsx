import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Rocket, Wrench, FlaskConical, Globe, Github, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import api from '../services/api.service';
import '../styles/Lab.css';

const LAB_STATUSES = ['live', 'beta', 'development', 'experimental'];

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

const FALLBACK_LAB = [
  {
    id: 'lab-recon',
    title: 'Network Recon Suite',
    description: 'Passive & active reconnaissance toolkit for pentest labs — port scanning, OSINT gathering and service fingerprinting.',
    thumbnail: 'https://picsum.photos/800/600?random=41',
    status: 'beta',
    technologies: ['Python', 'Nmap', 'Scapy', 'OSINT'],
    links: { github: 'https://github.com/devTechs001/network-recon-suite' },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'lab-wifi',
    title: 'Wi-Fi Security Playground',
    description: 'Hands-on wireless security practicals — WPA2/WPA3 capture, handshake analysis and deauth detection in a sandboxed lab.',
    thumbnail: 'https://picsum.photos/800/600?random=42',
    status: 'development',
    technologies: ['Raspberry Pi', 'aircrack-ng', 'Wireshark', 'Python'],
    links: { github: 'https://github.com/devTechs001/wifi-security-lab' },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'lab-burp-web',
    title: 'Web Pentest Lab (DVWA)',
    description: 'Ethical web application practicals: SQLi, XSS and IDOR walkthroughs against DVWA with auto-generated pentest reports.',
    thumbnail: 'https://picsum.photos/800/600?random=43',
    status: 'experimental',
    technologies: ['Burp Suite', 'DVWA', 'Docker'],
    links: { github: 'https://github.com/devTechs001/web-pentest-lab', netlify: 'https://webpentestlab.netlify.app/' },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
  }
];

const getDemoLink = (links) => {
  const l = links || {};
  return l.netlify || l.live || l.demo || null;
};

const getCodeLink = (links) => (links || {}).github || null;

const Lab = () => {
  const { user } = useAuth();
  const { connected, on, off } = useSocket();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const loadTokenRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const token = ++loadTokenRef.current;
    try {
      const cached = !force && cacheService.get('lab_projects');
      if (cached) {
        setProjects(cached);
        setLoading(false);
        return;
      }
      const response = await api.request('/public/projects?status=all&limit=100');
      if (token !== loadTokenRef.current) return;
      if (response.success && response.projects) {
        const labProjects = response.projects.filter(p =>
          LAB_STATUSES.includes(String(p.status || '').toLowerCase())
        );
        if (labProjects.length > 0) {
          cacheService.set('lab_projects', labProjects, CACHE_TTL.TEN_MINUTES);
          setProjects(labProjects);
        } else {
          setProjects(FALLBACK_LAB);
        }
      } else {
        setProjects(FALLBACK_LAB);
      }
    } catch (error) {
      if (token !== loadTokenRef.current) return;
      setProjects(FALLBACK_LAB);
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

    const handleProjectChanged = () => {
      setLiveUpdate(true);
      load(true);
      const t = setTimeout(() => setLiveUpdate(false), 2000);
      return () => clearTimeout(t);
    };

    on('project_changed', handleProjectChanged);
    on('project_updated', handleProjectChanged);
    return () => {
      off('project_changed', handleProjectChanged);
      off('project_updated', handleProjectChanged);
    };
  }, [connected, on, off, load]);

  const metrics = projects.reduce((acc, p) => {
    const s = String(p.status || '').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const visible = activeFilter === 'all'
    ? projects
    : projects.filter(p => String(p.status || '').toLowerCase() === activeFilter);

  const filters = [
    { key: 'all', label: 'All', count: projects.length },
    ...LAB_STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s], count: metrics[s] || 0 }))
  ];

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
        <div className="lab-header text-center mb-10">
          <span className="lab-eyebrow">Experiments & Side Projects</span>
          <h2 className="text-4xl md:text-5xl font-bold text-textColor mb-4">
            My <span className="text-mainColor gradient-text">Lab</span>
          </h2>
<p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto">
          My hands-on hacking lab and ethical practicals — recon, wireless, and web
          pentest experiments. Expect rough edges and frequent updates.
        </p>
          <div className="lab-header-meta">
            {connected && (
              <motion.span
                className="lab-live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="lab-live-dot"></span>
                Live updates
              </motion.span>
            )}
            {liveUpdate && (
              <motion.span
                className="lab-live lab-live-refresh"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RefreshCw size={12} className="lab-live-refresh-spin" /> Synced
              </motion.span>
            )}
          </div>
        </div>

        <div className="lab-metrics">
          <div className="lab-metric">
            <FlaskConical size={18} />
            <div>
              <strong>{projects.length}</strong>
              <span>Experiments</span>
            </div>
          </div>
          <div className="lab-metric">
            <Rocket size={18} />
            <div>
              <strong>{metrics.live || 0}</strong>
              <span>Live</span>
            </div>
          </div>
          <div className="lab-metric">
            <Wrench size={18} />
            <div>
              <strong>{metrics.beta || 0}</strong>
              <span>Beta</span>
            </div>
          </div>
          <div className="lab-metric">
            <Globe size={18} />
            <div>
              <strong>{metrics.development || 0}</strong>
              <span>In Development</span>
            </div>
          </div>
        </div>

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

              return (
                <motion.article
                  layout
                  key={project.id}
                  className="lab-card"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.05 }}
                >
                  <div className="lab-thumb">
                    {(project.thumbnail || project.imageUrl) ? (
                      <img
                        src={project.thumbnail || project.imageUrl}
                        alt={project.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="lab-thumb-placeholder">{project.title.charAt(0)}</div>
                    )}
                    <div className="lab-thumb-overlay"></div>
                    <span className={`lab-status lab-status-${statusClass}`}>
                      <StatusIcon size={12} /> {statusLabel}
                    </span>
                  </div>
                  <div className="lab-body">
                    <h3 className="lab-title">{project.title}</h3>
                    <p className="lab-desc">{project.description}</p>
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
                    </div>
                    <div className="lab-actions">
                      {demo && (
                        <a
                          className="lab-btn lab-btn-demo"
                          href={demo}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Rocket size={14} /> Live Demo
                        </a>
                      )}
                      {code && (
                        <a
                          className="lab-btn lab-btn-code"
                          href={code}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github size={14} /> Source
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lab-empty"
          >
            Nothing in this bucket yet — the oven is still heating up.
          </motion.p>
        )}

        {user && (
          <div className="lab-cta text-center mt-12">
            <a href="#/dashboard/projects" className="lab-cta-btn">
              <FlaskConical size={16} /> Publish a Lab Project
            </a>
            <p className="lab-cta-hint">
              Edit this page live from your dashboard — changes sync here instantly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Lab;