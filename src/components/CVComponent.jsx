import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  User, Mail, Phone, MapPin, Github, Linkedin, Globe,
  Download, File
} from 'lucide-react';
import api from '../services/api.service';
import '../styles/CVComponent.css';

const DEFAULT_CV = {
  personalInfo: {
    name: "Dev Techs",
    title: "Full Stack Developer & AI Engineer",
    email: "devtechs842@gmail.com",
    phone: "+254 758 175 275",
    location: "Nairobi, Kenya",
    website: "https://devtechs001.github.io/e-folio",
    github: "https://github.com/devTechs001",
    linkedin: "https://www.linkedin.com/in/daniel-mukula",
    bio: "Passionate full-stack developer with expertise in React, Node.js, and AI technologies. Specialized in building scalable web applications and integrating cutting-edge AI solutions."
  },
  experience: [
    {
      title: "Full Stack Developer",
      company: "Tech Innovations Ltd",
      period: "2022 - Present",
      location: "Nairobi, Kenya",
      description: "Lead development of full-stack applications using React and Node.js. Integrated AI/ML models into web applications, led a team of 5 developers, and improved application performance by 40% through optimization.",
      technologies: ["React", "Node.js", "MongoDB", "Python", "TensorFlow"]
    },
    {
      title: "Frontend Developer",
      company: "Digital Solutions Co",
      period: "2020 - 2022",
      location: "Nairobi, Kenya",
      description: "Built responsive web applications using React and Vue.js. Collaborated with UX team to implement modern designs, optimized applications for performance and SEO, mentored junior developers.",
      technologies: ["React", "Vue.js", "TypeScript", "Tailwind CSS", "Git"]
    }
  ],
  education: [
    {
      degree: "BSc. Computer Science",
      institution: "University of Nairobi",
      period: "2016 - 2020",
      details: "First Class Honors (GPA: 3.8/4.0)"
    }
  ],
  skills: {
    "Frontend": ["React", "Vue.js", "Angular", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript"],
    "Backend": ["Node.js", "Express.js", "Python", "Django", "MongoDB", "PostgreSQL"],
    "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "NLP", "OpenAI API"],
    "Tools": ["Git", "Docker", "AWS", "CI/CD", "Jest", "Webpack", "Vite", "Figma"]
  },
  projects: [
    {
      name: "E-Folio Pro",
      description: "Advanced portfolio platform with AI-powered features, real-time collaboration, and comprehensive analytics.",
      highlights: ["AI chatbot integration", "Real-time collaboration", "Advanced analytics dashboard"],
      technologies: ["React", "Node.js", "MongoDB", "OpenAI", "Socket.io"]
    },
    {
      name: "AI Task Manager",
      description: "Smart task management system with AI-powered prioritization and automated scheduling.",
      highlights: ["ML-based task prioritization", "Automated scheduling", "Natural language processing"],
      technologies: ["Python", "React", "TensorFlow", "PostgreSQL"]
    }
  ],
  achievements: [
    "Best Developer Award — Tech Innovations Ltd (2023)",
    "Published research on AI in Web Development (2022)",
    "Speaker at Nairobi Tech Conference (2021)",
    "Open Source Contributor with 500+ GitHub stars"
  ]
};

const asArray = (value) => Array.isArray(value) ? value : [];

const CVComponent = () => {
  const cvRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const [cv, setCv] = useState(DEFAULT_CV);

  useEffect(() => {
    let cancelled = false;

    const normalize = (data, fallback) => {
      const d = data || {};
      const personalInfo = {
        ...fallback.personalInfo,
        ...(d.personalInfo || {})
      };
      const experience = asArray(d.experience).filter(e => e.visible !== false).map(e => ({
        ...fallback.experience[0],
        title: e.title,
        company: e.company,
        period: e.period,
        location: e.location || '',
        description: e.description,
        technologies: asArray(e.technologies)
      }));
      const education = asArray(d.education).filter(e => e.visible !== false).map(e => ({
        degree: e.degree,
        institution: e.institution,
        period: e.period,
        details: e.details || ''
      }));
      let skills = fallback.skills;
      if (d.skills && typeof d.skills === 'object') {
        const entries = Object.entries(d.skills).filter(([, list]) => asArray(list).length);
        if (entries.length) {
          skills = Object.fromEntries(entries.map(([cat, list]) => [cat, asArray(list)]));
        }
      }
      const projects = asArray(d.projects).filter(p => p.visible !== false).map(p => ({
        name: p.name,
        description: p.description,
        highlights: asArray(p.highlights),
        technologies: asArray(p.technologies),
        url: p.url || ''
      }));
      const achievements = asArray(d.achievements)
        .filter(a => a.text && a.visible !== false)
        .map(a => a.text);

      return {
        personalInfo,
        experience,
        education,
        skills,
        projects,
        achievements
      };
    };

    const startFetch = async () => {
      try {
        const authed = await api.getCV();
        if (cancelled) return;
        if (authed && authed.success && authed.data) {
          setCv(normalize(authed.data, DEFAULT_CV));
          setSource('dashboard');
          return;
        }
        const profile = await api.getOwnerPublicProfile();
        if (cancelled) return;
        const username = profile && profile.success && profile.profile ? profile.profile.username : null;
        if (username) {
          const pub = await api.getPublicCV(username);
          if (cancelled) return;
          if (pub && pub.success && pub.cv) {
            setCv(normalize(pub.cv, DEFAULT_CV));
            setSource('public');
            return;
          }
        }
        setCv(DEFAULT_CV);
        setSource('sample');
      } catch (err) {
        if (cancelled) return;
        setCv(DEFAULT_CV);
        setSource('sample');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    startFetch();
    return () => { cancelled = true; };
  }, []);

  const { personalInfo, experience, education, skills, projects, achievements } = cv;

  const downloadAsImage = async () => {
    setIsGenerating(true);
    try {
      const el = cvRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight
      });
      const link = document.createElement('a');
      const safeName = (personalInfo.name || 'CV').replace(/\s+/g, '_');
      link.download = `${safeName}_CV.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('CV image error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const contactItems = [
    { icon: Mail, value: personalInfo.email },
    { icon: Phone, value: personalInfo.phone },
    { icon: MapPin, value: personalInfo.location },
    { icon: Globe, value: personalInfo.website, href: personalInfo.website },
    { icon: Github, value: personalInfo.github, href: personalInfo.github },
    { icon: Linkedin, value: personalInfo.linkedin, href: personalInfo.linkedin }
  ].filter(i => i.value);

  return (
    <div className="cv-container">
      <div className="cv-actions">
        {loading && <div className="cv-loading">Loading CV...</div>}
        {source === 'sample' && !loading && (
          <div className="cv-hint">No saved CV found yet — showing a sample. Edit it from the dashboard to make it yours.</div>
        )}
        <button onClick={downloadAsImage} disabled={isGenerating} className="download-btn">
          {isGenerating ? (
            <><div className="spinner" /> Generating...</>
          ) : (
            <><Download size={20} /> Download as Image</>
          )}
        </button>
        <a href={`${import.meta.env.BASE_URL}CV2.pdf`} download className="download-btn pdf-btn">
          <File size={20} /> Download as PDF
        </a>
      </div>

      <div ref={cvRef} className="cv-content">
        <div className="cv-header">
          <div className="header-content">
            <div className="cv-avatar"><User size={40} /></div>
            <div className="cv-name-title">
              <h1>{personalInfo.name || 'Your Name'}</h1>
              <div className="title">{personalInfo.title}</div>
              {personalInfo.bio && <div className="bio">{personalInfo.bio}</div>}
            </div>
          </div>
          {contactItems.length > 0 && (
            <div className="cv-contact-bar">
              {contactItems.map((c, i) => {
                const inner = (<><c.icon size={14} />{c.value}</>);
                return c.href ? (
                  <a key={i} className="contact-chip" href={c.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <span key={i} className="contact-chip">{inner}</span>
                );
              })}
            </div>
          )}
        </div>

        <div className="cv-main">
          <div className="left-column">
            {experience.length > 0 && (
              <div className="cv-section">
                <div className="section-title">Experience</div>
                {experience.map((e, i) => (
                  <div key={i} className="exp-item">
                    <div className="exp-header">
                      <div>
                        <h4>{e.title}</h4>
                        <span className="company">{e.company}</span>
                      </div>
                      <div className="exp-meta">{e.period}{e.location ? <><br />{e.location}</> : null}</div>
                    </div>
                    {e.description && <p className="exp-desc">{e.description}</p>}
                    {e.technologies.length > 0 && (
                      <div className="exp-tech">
                        {e.technologies.map((t, j) => <span key={j} className="tech-pill">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div className="cv-section">
                <div className="section-title">Projects</div>
                {projects.map((p, i) => (
                  <div key={i} className="project-item">
                    <div className="project-name">{p.name}</div>
                    {p.description && <p className="project-desc">{p.description}</p>}
                    {p.technologies.length > 0 && (
                      <div className="exp-tech">
                        {p.technologies.map((t, j) => <span key={j} className="tech-pill">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="right-column">
            {Object.keys(skills).filter(k => skills[k] && skills[k].length).length > 0 && (
              <div className="cv-section">
                <div className="section-title">Skills</div>
                {Object.entries(skills).filter(([, list]) => list && list.length).map(([cat, list]) => (
                  <div key={cat} className="skill-block">
                    <h4>{cat}</h4>
                    <div className="skill-tags">
                      {list.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div className="cv-section">
                <div className="section-title">Education</div>
                {education.map((e, i) => (
                  <div key={i} className="edu-item">
                    <h4>{e.degree}</h4>
                    <div className="institution">{e.institution}</div>
                    <div className="period">{e.period}{e.details ? ` — ${e.details}` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {achievements.length > 0 && (
              <div className="cv-section">
                <div className="section-title">Achievements</div>
                {achievements.map((a, i) => (
                  <div key={i} className="achievement-item">{a}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVComponent;