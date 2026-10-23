import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Rocket, Wrench, FlaskConical, Globe, Github, RefreshCw, 
  Search, Shield, Terminal, ExternalLink, Sparkles, Filter, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import api from '../services/api.service';
import ProjectModal from './ProjectModal';
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
    _id: 'lab-recon',
    title: 'Network Recon Suite',
    description: 'Passive & active reconnaissance toolkit for pentest labs — port scanning, OSINT gathering, DNS enumeration and service fingerprinting.',
    fullDescription: 'An enterprise-grade reconnaissance suite designed for offensive security engagements and authorized lab testing. Features automated port discovery, sub-domain brute-forcing, passive OSINT correlation, and vulnerability heuristic detection. Built with Python and Scapy with exportable JSON/HTML reports.',
    thumbnail: 'https://picsum.photos/800/600?random=41',
    status: 'beta',
    technologies: ['Python', 'Nmap', 'Scapy', 'OSINT', 'Docker'],
    tags: ['cybersecurity', 'recon', 'pentest', 'networking'],
    challenges: 'Optimizing multi-threaded socket probes without triggering ISP flood filters or crashing target interfaces.',
    achievements: ['Sub-second response time on standard 1000-port scans', 'Integrated with MITRE ATT&CK framework mapping'],
    links: { github: 'https://github.com/devTechs001/network-recon-suite' },
    likes: 24,
    views: 312,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'lab-wifi',
    _id: 'lab-wifi',
    title: 'Wi-Fi Security Playground',
    description: 'Hands-on wireless security practicals — WPA2/WPA3 capture, PMKID handshake analysis and deauth detection in a sandboxed hardware lab.',
    fullDescription: 'Sandboxed hardware laboratory for wireless protocol inspection and defensive monitoring. Employs Raspberry Pi with dual monitor-mode interfaces to detect rogue access points, Evil Twin deauthentication floods, and 802.11 frame manipulation.',
    thumbnail: 'https://picsum.photos/800/600?random=42',
    status: 'development',
    technologies: ['Raspberry Pi', 'aircrack-ng', 'Wireshark', 'Python', 'Linux'],
    tags: ['wireless', 'iot', 'hardware', 'defense'],
    challenges: 'Preventing packet loss during channel hopping across dual-band 2.4GHz and 5GHz ranges.',
    achievements: ['Real-time audio alert on deauth attacks', 'Capture replay verification sandbox'],
    links: { github: 'https://github.com/devTechs001/wifi-security-lab' },
    likes: 38,
    views: 450,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'lab-burp-web',
    _id: 'lab-burp-web',
    title: 'Web Pentest Lab (DVWA & OWASP)',
    description: 'Ethical web application practicals: SQLi, XSS, SSRF and IDOR walkthroughs against DVWA with auto-generated pentest reports.',
    fullDescription: 'Comprehensive vulnerable web application proving ground mapped to OWASP Top 10 vulnerabilities. Includes customized scripts for exploiting blind SQL injections, prototype pollution, CSRF token validation bypasses, and privilege escalation scenarios.',
    thumbnail: 'https://picsum.photos/800/600?random=43',
    status: 'experimental',
    technologies: ['Burp Suite', 'DVWA', 'Docker', 'Node.js', 'PostgreSQL'],
    tags: ['owasp', 'web-security', 'docker', 'pentest'],
    challenges: 'Creating repeatable isolated container instances for each exploitation exercise.',
    achievements: ['Full automated teardown and redeploy pipeline', 'Interactive exploit walk-through guides'],
    links: { github: 'https://github.com/devTechs001/web-pentest-lab', netlify: 'https://webpentestlab.netlify.app/' },
    likes: 52,
    views: 680,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
  },
  {
    id: 'lab-cloud-audit',
    _id: 'lab-cloud-audit',
    title: 'Cloud IAM & S3 Misconfig Sentinel',
    description: 'Automated auditing utility for AWS IAM role permission bloat and open S3 storage buckets with real-time alerting.',
    fullDescription: 'Serverless security sentinel monitoring cloud infrastructure for public object leaks, excessive wildcard IAM policies, and unencrypted EBS volumes. Generates actionable remediation runbooks with terraform-ready fixes.',
    thumbnail: 'https://picsum.photos/800/600?random=44',
    status: 'live',
    technologies: ['AWS SDK', 'Node.js', 'Terraform', 'Lambda', 'Docker'],
    tags: ['cloud', 'aws', 'iam', 'devsecops'],
    challenges: 'Evaluating complex IAM cross-account trust relationships with multiple condition keys.',
    achievements: ['Tested across 15+ mock production environments', 'Auto-generates least-privilege policy diffs'],
    links: { github: 'https://github.com/devTechs001/cloud-iam-sentinel' },
    likes: 41,
    views: 520,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
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
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
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
      if (response && response.success && response.projects) {
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

  const query = searchQuery.trim().toLowerCase();
  const visible = projects
    .filter(p => {
      if (activeFilter !== 'all') {
        if (String(p.status || '').toLowerCase() !== activeFilter) return false;
      }
      if (query) {
        const titleMatch = (p.title || '').toLowerCase().includes(query);
        const descMatch = (p.description || '').toLowerCase().includes(query);
        const techMatch = (p.technologies || []).some(t => t.toLowerCase().includes(query));
        const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(query));
        return titleMatch || descMatch || techMatch || tagMatch;
      }
      return true;
    });

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
        {/* Header */}
        <div className="lab-header text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="lab-eyebrow flex items-center gap-1.5">
              <Terminal size={14} className="text-cyan-400" /> Experiments & Security Lab
            </span>
            <button
              onClick={() => { setLiveUpdate(true); load(true); setTimeout(() => setLiveUpdate(false), 1200); }}
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-cyan-400 transition"
              title="Refresh Lab Projects"
            >
              <RefreshCw size={14} className={liveUpdate ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-textColor mb-4">
            My <span className="text-mainColor gradient-text">Lab</span>
          </h2>
          <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto">
            My hands-on hacking lab and ethical practicals — recon, wireless, and web
            pentest experiments. Expect active iteration, research prototypes, and live benchmarks.
          </p>

          <div className="lab-header-meta mt-3">
            {connected && (
              <motion.span
                className="lab-live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="lab-live-dot"></span>
                Live socket synced
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

        {/* Metrics Row */}
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

        {/* Search & Filter Controls */}
        <div className="lab-controls flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Status Tabs */}
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

          {/* Search Box */}
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
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
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

              return (
                <motion.article
                  layout
                  key={cardKey}
                  className="lab-card group cursor-pointer hover:border-cyan-500/50"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.05 }}
                  onClick={() => setSelectedProject(project)}
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
                      {project.views > 0 && (
                        <span className="lab-meta-item">{project.views} views</span>
                      )}
                    </div>
                    <div className="lab-actions" onClick={(e) => e.stopPropagation()}>
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
                      <button
                        className="lab-btn lab-btn-details text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 hover:border-cyan-500 transition"
                        onClick={() => setSelectedProject(project)}
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lab-empty text-center py-12"
          >
            <FlaskConical size={36} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">
              {searchQuery ? `No lab experiments matching "${searchQuery}"` : 'Nothing in this bucket yet — the oven is still heating up.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-cyan-400 text-sm hover:underline"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}

        
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
