import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  User, Mail, Phone, MapPin, Github, Linkedin, Globe,
  Calendar, Briefcase, GraduationCap, Award, Code,
  Download, FileText, File, ExternalLink, CheckCircle
} from 'lucide-react';
import '../styles/CVComponent.css';

const CVComponent = () => {
  const cvRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const personalInfo = {
    name: "Dev Techs",
    title: "Full Stack Developer & AI Engineer",
    email: "devtechs842@gmail.com",
    phone: "+254 758 175 275",
    location: "Nairobi, Kenya",
    website: "https://devtechs001.github.io/e-folio",
    github: "https://github.com/devTechs001",
    linkedin: "https://www.linkedin.com/in/daniel-mukula",
    bio: "Passionate full-stack developer with expertise in React, Node.js, and AI technologies. Specialized in building scalable web applications and integrating cutting-edge AI solutions."
  };

  const experience = [
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
  ];

  const education = [
    {
      degree: "BSc. Computer Science",
      institution: "University of Nairobi",
      period: "2016 - 2020",
      details: "First Class Honors (GPA: 3.8/4.0)"
    }
  ];

  const skills = {
    "Frontend": ["React", "Vue.js", "Angular", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript"],
    "Backend": ["Node.js", "Express.js", "Python", "Django", "MongoDB", "PostgreSQL"],
    "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "NLP", "OpenAI API"],
    "Tools": ["Git", "Docker", "AWS", "CI/CD", "Jest", "Webpack", "Vite", "Figma"]
  };

  const projects = [
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
  ];

  const achievements = [
    "Best Developer Award — Tech Innovations Ltd (2023)",
    "Published research on AI in Web Development (2022)",
    "Speaker at Nairobi Tech Conference (2021)",
    "Open Source Contributor with 500+ GitHub stars"
  ];

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
      link.download = 'Dev_Techs_CV.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('CV image error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHtml = () => {
    const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#0f172a;background:#f1f5f9;line-height:1.5}
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
.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin:0 0 16px;display:flex;align-items:center;gap:8px}
.section-title:after{content:'';flex:1;height:1px;background:#e2e8f0}
.exp{margin-bottom:20px}
.exp:last-child{margin-bottom:0}
.exp-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:12px}
.exp-h h4{font-size:15px;font-weight:600;color:#0f172a;margin:0}
.exp-h .company{font-size:13px;color:#2563eb;font-weight:500;display:block}
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
.achieve{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-radius:8px;border-left:3px solid #2563eb;margin-bottom:8px;font-size:13px;color:#475569}
.achieve:last-child{margin-bottom:0}
@media(max-width:768px){main{grid-template-columns:1fr}.header-inner{flex-direction:column;text-align:center}.left{border-right:none;border-bottom:1px solid #e2e8f0}}
@media print{body{background:#fff}.cv{box-shadow:none;border-radius:0;margin:0}}
`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${personalInfo.name} - CV</title>
<style>${css}</style>
</head>
<body>
<div class="cv">
<header>
<div class="header-inner">
<div class="avatar">${personalInfo.name.charAt(0)}</div>
<div class="info">
<h1>${personalInfo.name}</h1>
<div class="title">${personalInfo.title}</div>
<div class="bio">${personalInfo.bio}</div>
</div>
</div>
<div class="contact-bar">
<span>${personalInfo.email}</span>
<span>${personalInfo.phone}</span>
<span>${personalInfo.location}</span>
<span>${personalInfo.website}</span>
<span>${personalInfo.github}</span>
<span>${personalInfo.linkedin}</span>
</div>
</header>
<main>
<div class="left">
<div class="section">
<div class="section-title">Experience</div>
${experience.map(e => `
<div class="exp">
<div class="exp-h">
<div><h4>${e.title}</h4><span class="company">${e.company}</span></div>
<div class="exp-meta">${e.period}<br>${e.location}</div>
</div>
<div class="exp-desc">${e.description}</div>
<div class="tech">${e.technologies.map(t => `<span>${t}</span>`).join('')}</div>
</div>`).join('')}
</div>
<div class="section">
<div class="section-title">Projects</div>
${projects.map(p => `
<div class="project">
<h4>${p.name}</h4>
<p>${p.description}</p>
<div class="tech">${p.technologies.map(t => `<span>${t}</span>`).join('')}</div>
</div>`).join('')}
</div>
</div>
<div class="right">
<div class="section">
<div class="section-title">Skills</div>
${Object.entries(skills).map(([cat, list]) => `
<div class="skill-b">
<h4>${cat}</h4>
<div class="skill-tags">${list.map(s => `<span>${s}</span>`).join('')}</div>
</div>`).join('')}
</div>
<div class="section">
<div class="section-title">Education</div>
${education.map(e => `
<div class="edu">
<h4>${e.degree}</h4>
<div class="inst">${e.institution}</div>
<div class="per">${e.period} — ${e.details}</div>
</div>`).join('')}
</div>
<div class="section">
<div class="section-title">Achievements</div>
${achievements.map(a => `<div class="achieve">${a}</div>`).join('')}
</div>
</div>
</main>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = 'Dev_Techs_CV.html';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="cv-container">
      <div className="cv-actions">
        <button onClick={downloadAsImage} disabled={isGenerating} className="download-btn">
          {isGenerating ? (
            <><div className="spinner" /> Generating...</>
          ) : (
            <><Download size={20} /> Download as Image</>
          )}
        </button>
        <button onClick={downloadAsHtml} className="download-btn html-btn">
          <FileText size={20} /> Download as HTML
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
              <h1>{personalInfo.name}</h1>
              <div className="title">{personalInfo.title}</div>
              <div className="bio">{personalInfo.bio}</div>
            </div>
          </div>
          <div className="cv-contact-bar">
            <span className="contact-chip"><Mail size={14} />{personalInfo.email}</span>
            <span className="contact-chip"><Phone size={14} />{personalInfo.phone}</span>
            <span className="contact-chip"><MapPin size={14} />{personalInfo.location}</span>
            <span className="contact-chip"><Globe size={14} />{personalInfo.website}</span>
            <span className="contact-chip"><Github size={14} />{personalInfo.github}</span>
            <span className="contact-chip"><Linkedin size={14} />{personalInfo.linkedin}</span>
          </div>
        </div>

        <div className="cv-main">
          <div className="left-column">
            <div className="cv-section">
              <div className="section-title">Experience</div>
              {experience.map((e, i) => (
                <div key={i} className="exp-item">
                  <div className="exp-header">
                    <div>
                      <h4>{e.title}</h4>
                      <span className="company">{e.company}</span>
                    </div>
                    <div className="exp-meta">{e.period}<br />{e.location}</div>
                  </div>
                  <p className="exp-desc">{e.description}</p>
                  <div className="exp-tech">
                    {e.technologies.map((t, j) => <span key={j} className="tech-pill">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cv-section">
              <div className="section-title">Projects</div>
              {projects.map((p, i) => (
                <div key={i} className="project-item">
                  <div className="project-name">{p.name}</div>
                  <p className="project-desc">{p.description}</p>
                  <div className="exp-tech">
                    {p.technologies.map((t, j) => <span key={j} className="tech-pill">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="right-column">
            <div className="cv-section">
              <div className="section-title">Skills</div>
              {Object.entries(skills).map(([cat, list]) => (
                <div key={cat} className="skill-block">
                  <h4>{cat}</h4>
                  <div className="skill-tags">
                    {list.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cv-section">
              <div className="section-title">Education</div>
              {education.map((e, i) => (
                <div key={i} className="edu-item">
                  <h4>{e.degree}</h4>
                  <div className="institution">{e.institution}</div>
                  <div className="period">{e.period} — {e.details}</div>
                </div>
              ))}
            </div>

            <div className="cv-section">
              <div className="section-title">Achievements</div>
              {achievements.map((a, i) => (
                <div key={i} className="achievement-item">{a}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVComponent;
