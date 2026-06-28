import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { 
    User, Mail, Phone, MapPin, Github, Linkedin, Globe, 
    Calendar, Briefcase, GraduationCap, Award, Code, 
    Download, FileText, ExternalLink, CheckCircle
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
            responsibilities: [
                "Developed and maintained full-stack applications using React and Node.js",
                "Integrated AI/ML models into web applications for enhanced functionality",
                "Led a team of 5 developers on various projects",
                "Improved application performance by 40% through optimization"
            ],
            technologies: ["React", "Node.js", "MongoDB", "Python", "TensorFlow"]
        },
        {
            title: "Frontend Developer",
            company: "Digital Solutions Co",
            period: "2020 - 2022",
            location: "Nairobi, Kenya",
            responsibilities: [
                "Built responsive web applications using React and Vue.js",
                "Collaborated with UX team to implement modern designs",
                "Optimized applications for performance and SEO",
                "Mentored junior developers on best practices"
            ],
            technologies: ["React", "Vue.js", "TypeScript", "Tailwind CSS", "Git"]
        }
    ];

    const education = [
        {
            degree: "Bachelor of Science in Computer Science",
            institution: "University of Nairobi",
            period: "2016 - 2020",
            location: "Nairobi, Kenya",
            achievements: [
                "Graduated with First Class Honors (GPA: 3.8/4.0)",
                "Dean's List for 4 consecutive semesters",
                "Led the Computer Science Student Association"
            ]
        }
    ];

    const skills = {
        "Frontend": ["React", "Vue.js", "Angular", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript"],
        "Backend": ["Node.js", "Express.js", "Python", "Django", "PHP", "Laravel", "MongoDB", "PostgreSQL"],
        "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "OpenAI API"],
        "Tools": ["Git", "Docker", "AWS", "CI/CD", "Jest", "Webpack", "Vite", "Figma"]
    };

    const projects = [
        {
            name: "E-Folio Pro",
            description: "Advanced portfolio platform with AI-powered features, real-time collaboration, and comprehensive analytics.",
            technologies: ["React", "Node.js", "MongoDB", "OpenAI", "Socket.io"],
            highlights: ["AI chatbot integration", "Real-time collaboration", "Advanced analytics dashboard"],
            link: "https://devtechs001.github.io/e-folio"
        },
        {
            name: "AI Task Manager",
            description: "Smart task management system with AI-powered prioritization and automated scheduling.",
            technologies: ["Python", "React", "TensorFlow", "PostgreSQL"],
            highlights: ["ML-based task prioritization", "Automated scheduling", "Natural language processing"],
            link: "https://github.com/devTechs001/ai-task-manager"
        }
    ];

    const achievements = [
        "Best Developer Award - Tech Innovations Ltd (2023)",
        "Published research paper on AI in Web Development (2022)",
        "Speaker at Nairobi Tech Conference (2021)",
        "Open Source Contributor with 500+ GitHub stars"
    ];

    const downloadAsImage = async () => {
        setIsGenerating(true);
        try {
            const element = cvRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: false,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            
            const link = document.createElement('a');
            link.download = `${personalInfo.name.replace(' ', '_')}_CV.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error generating CV image:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadAsHtml = () => {
        const inlineCss = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #fff; line-height: 1.6; }
            .cv-print { max-width: 900px; margin: 0 auto; padding: 40px; }
            .cv-header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; padding: 40px; border-radius: 12px 12px 0 0; }
            .profile-section { display: flex; align-items: center; gap: 24px; margin-bottom: 20px; }
            .profile-avatar { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
            .profile-info h1 { font-size: 28px; margin-bottom: 4px; }
            .profile-info h2 { font-size: 16px; opacity: 0.9; font-weight: 400; margin-bottom: 8px; }
            .profile-info .bio { font-size: 13px; opacity: 0.85; line-height: 1.5; }
            .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
            .contact-item { display: flex; align-items: center; gap: 8px; opacity: 0.9; }
            .cv-main { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; padding: 30px; background: #fff; }
            .cv-section { margin-bottom: 28px; }
            .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #2563eb; }
            .section-header h3 { font-size: 18px; color: #2563eb; }
            .experience-item, .project-item, .education-item { margin-bottom: 20px; }
            .exp-header, .project-header, .edu-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .exp-title h4, .project-header h4, .edu-header h4 { font-size: 16px; color: #1e293b; }
            .company, .institution { font-size: 13px; color: #64748b; display: block; }
            .exp-meta, .edu-meta { text-align: right; font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
            .responsibilities, .achievements { list-style: none; padding: 0; }
            .responsibilities li, .achievements li { font-size: 13px; color: #475569; padding: 3px 0 3px 20px; position: relative; }
            .responsibilities li::before, .achievements li::before { content: '\\2022'; position: absolute; left: 4px; color: #2563eb; }
            .technologies { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .tech-tag { font-size: 11px; background: #eef2ff; color: #4338ca; padding: 3px 10px; border-radius: 12px; }
            .skills-grid { display: flex; flex-direction: column; gap: 16px; }
            .skill-category h4 { font-size: 13px; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .skill-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .skill-item { font-size: 12px; background: #f8fafc; color: #334155; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .project-description { font-size: 13px; color: #64748b; margin-bottom: 8px; }
            .project-highlights { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
            .highlight-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #475569; }
            .achievement-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #475569; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${personalInfo.name} - CV</title>
<style>${inlineCss}</style>
</head>
<body>
<div class="cv-print">
    <div class="cv-header">
        <div class="profile-section">
            <div class="profile-avatar">${personalInfo.name.charAt(0)}</div>
            <div class="profile-info">
                <h1>${personalInfo.name}</h1>
                <h2>${personalInfo.title}</h2>
                <p class="bio">${personalInfo.bio}</p>
            </div>
        </div>
        <div class="contact-grid">
            <div class="contact-item">${personalInfo.email}</div>
            <div class="contact-item">${personalInfo.phone}</div>
            <div class="contact-item">${personalInfo.location}</div>
            <div class="contact-item">${personalInfo.website}</div>
            <div class="contact-item">${personalInfo.github}</div>
            <div class="contact-item">${personalInfo.linkedin}</div>
        </div>
    </div>
    <div class="cv-main">
        <div class="left-column">
            <div class="cv-section">
                <div class="section-header"><h3>Professional Experience</h3></div>
                ${experience.map(exp => `
                <div class="experience-item">
                    <div class="exp-header">
                        <div class="exp-title">
                            <h4>${exp.title}</h4>
                            <span class="company">${exp.company}</span>
                        </div>
                        <div class="exp-meta">
                            <span>${exp.period}</span>
                            <span>${exp.location}</span>
                        </div>
                    </div>
                    <ul class="responsibilities">
                        ${exp.responsibilities.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                    <div class="technologies">${exp.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
                </div>`).join('')}
            </div>
            <div class="cv-section">
                <div class="section-header"><h3>Featured Projects</h3></div>
                ${projects.map(p => `
                <div class="project-item">
                    <div class="project-header">
                        <h4>${p.name}</h4>
                    </div>
                    <p class="project-description">${p.description}</p>
                    <div class="project-highlights">${p.highlights.map(h => `<span class="highlight-item">${h}</span>`).join('')}</div>
                    <div class="technologies">${p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
                </div>`).join('')}
            </div>
        </div>
        <div class="right-column">
            <div class="cv-section">
                <div class="section-header"><h3>Technical Skills</h3></div>
                <div class="skills-grid">
                    ${Object.entries(skills).map(([cat, list]) => `
                    <div class="skill-category">
                        <h4>${cat}</h4>
                        <div class="skill-list">${list.map(s => `<span class="skill-item">${s}</span>`).join('')}</div>
                    </div>`).join('')}
                </div>
            </div>
            <div class="cv-section">
                <div class="section-header"><h3>Education</h3></div>
                ${education.map(edu => `
                <div class="education-item">
                    <div class="edu-header">
                        <h4>${edu.degree}</h4>
                        <span class="institution">${edu.institution}</span>
                    </div>
                    <div class="edu-meta">
                        <span>${edu.period}</span>
                        <span>${edu.location}</span>
                    </div>
                    <ul class="achievements">${edu.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
                </div>`).join('')}
            </div>
            <div class="cv-section">
                <div class="section-header"><h3>Achievements</h3></div>
                ${achievements.map(a => `<div class="achievement-item">${a}</div>`).join('')}
            </div>
        </div>
    </div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = `${personalInfo.name.replace(' ', '_')}_CV.html`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="cv-container">
            <div className="cv-actions">
                <button 
                    onClick={downloadAsImage}
                    disabled={isGenerating}
                    className="download-btn"
                >
                    {isGenerating ? (
                        <>
                            <div className="spinner"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            Download as Image
                        </>
                    )}
                </button>
                <button 
                    onClick={downloadAsHtml}
                    className="download-btn html-btn"
                >
                    <FileText size={20} />
                    Download as HTML
                </button>
            </div>

            <div ref={cvRef} className="cv-content">
                {/* Header Section */}
                <header className="cv-header">
                    <div className="header-content">
                        <div className="profile-section">
                            <div className="profile-avatar">
                                <User size={80} />
                            </div>
                            <div className="profile-info">
                                <h1 className="name">{personalInfo.name}</h1>
                                <h2 className="title">{personalInfo.title}</h2>
                                <p className="bio">{personalInfo.bio}</p>
                            </div>
                        </div>
                        <div className="contact-section">
                            <div className="contact-grid">
                                <div className="contact-item">
                                    <Mail size={16} />
                                    <span>{personalInfo.email}</span>
                                </div>
                                <div className="contact-item">
                                    <Phone size={16} />
                                    <span>{personalInfo.phone}</span>
                                </div>
                                <div className="contact-item">
                                    <MapPin size={16} />
                                    <span>{personalInfo.location}</span>
                                </div>
                                <div className="contact-item">
                                    <Globe size={16} />
                                    <span>{personalInfo.website}</span>
                                </div>
                                <div className="contact-item">
                                    <Github size={16} />
                                    <span>{personalInfo.github}</span>
                                </div>
                                <div className="contact-item">
                                    <Linkedin size={16} />
                                    <span>{personalInfo.linkedin}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="cv-main">
                    <div className="left-column">
                        {/* Experience Section */}
                        <section className="cv-section">
                            <div className="section-header">
                                <Briefcase size={20} />
                                <h3>Professional Experience</h3>
                            </div>
                            <div className="experience-list">
                                {experience.map((exp, index) => (
                                    <div key={index} className="experience-item">
                                        <div className="exp-header">
                                            <div className="exp-title">
                                                <h4>{exp.title}</h4>
                                                <span className="company">{exp.company}</span>
                                            </div>
                                            <div className="exp-meta">
                                                <span className="period">
                                                    <Calendar size={14} />
                                                    {exp.period}
                                                </span>
                                                <span className="location">
                                                    <MapPin size={14} />
                                                    {exp.location}
                                                </span>
                                            </div>
                                        </div>
                                        <ul className="responsibilities">
                                            {exp.responsibilities.map((resp, idx) => (
                                                <li key={idx}>{resp}</li>
                                            ))}
                                        </ul>
                                        <div className="technologies">
                                            {exp.technologies.map((tech, idx) => (
                                                <span key={idx} className="tech-tag">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Projects Section */}
                        <section className="cv-section">
                            <div className="section-header">
                                <Code size={20} />
                                <h3>Featured Projects</h3>
                            </div>
                            <div className="projects-list">
                                {projects.map((project, index) => (
                                    <div key={index} className="project-item">
                                        <div className="project-header">
                                            <h4>{project.name}</h4>
                                            {project.link && (
                                                <a href={project.link} className="project-link">
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                        </div>
                                        <p className="project-description">{project.description}</p>
                                        <div className="project-highlights">
                                            {project.highlights.map((highlight, idx) => (
                                                <div key={idx} className="highlight-item">
                                                    <CheckCircle size={12} />
                                                    <span>{highlight}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="technologies">
                                            {project.technologies.map((tech, idx) => (
                                                <span key={idx} className="tech-tag">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="right-column">
                        {/* Skills Section */}
                        <section className="cv-section">
                            <div className="section-header">
                                <Code size={20} />
                                <h3>Technical Skills</h3>
                            </div>
                            <div className="skills-grid">
                                {Object.entries(skills).map(([category, skillList]) => (
                                    <div key={category} className="skill-category">
                                        <h4>{category}</h4>
                                        <div className="skill-list">
                                            {skillList.map((skill, idx) => (
                                                <span key={idx} className="skill-item">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Education Section */}
                        <section className="cv-section">
                            <div className="section-header">
                                <GraduationCap size={20} />
                                <h3>Education</h3>
                            </div>
                            <div className="education-list">
                                {education.map((edu, index) => (
                                    <div key={index} className="education-item">
                                        <div className="edu-header">
                                            <h4>{edu.degree}</h4>
                                            <span className="institution">{edu.institution}</span>
                                        </div>
                                        <div className="edu-meta">
                                            <span className="period">
                                                <Calendar size={14} />
                                                {edu.period}
                                            </span>
                                            <span className="location">
                                                <MapPin size={14} />
                                                {edu.location}
                                            </span>
                                        </div>
                                        <ul className="achievements">
                                            {edu.achievements.map((achievement, idx) => (
                                                <li key={idx}>{achievement}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Achievements Section */}
                        <section className="cv-section">
                            <div className="section-header">
                                <Award size={20} />
                                <h3>Achievements</h3>
                            </div>
                            <div className="achievements-list">
                                {achievements.map((achievement, index) => (
                                    <div key={index} className="achievement-item">
                                        <CheckCircle size={16} />
                                        <span>{achievement}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CVComponent;
