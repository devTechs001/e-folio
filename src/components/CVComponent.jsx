import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  User, Mail, Phone, MapPin, Github, Linkedin, Globe,
  Download, File
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
