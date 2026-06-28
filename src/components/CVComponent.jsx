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
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight
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
