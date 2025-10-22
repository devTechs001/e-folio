import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import '../styles/Skills.css';

const Skills = () => {
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            console.log('Fetching skills from API...');
            const response = await apiService.getSkills();
            console.log('Skills API response:', response);
            
            if (response.success && response.skills && response.skills.length > 0) {
                console.log(`Loaded ${response.skills.length} skills from database`);
                const technical = response.skills.filter(s => s.type === 'technical');
                const professional = response.skills.filter(s => s.type === 'professional');
                
                setTechnicalSkills(technical.slice(0, 8)); // Show top 8
                setProfessionalSkills(professional.slice(0, 4)); // Show top 4
            } else {
                console.log('No skills from API, using fallback data');
                setTechnicalSkills(getFallbackTechnicalSkills());
                setProfessionalSkills(getFallbackProfessionalSkills());
            }
        } catch (error) {
            console.error('Error loading skills:', error);
            console.log('Using fallback skills due to error');
            setTechnicalSkills(getFallbackTechnicalSkills());
            setProfessionalSkills(getFallbackProfessionalSkills());
        } finally {
            setLoading(false);
        }
    };

    const getFallbackTechnicalSkills = () => [
        { name: "HTML5", level: 90, icon: "fa-brands fa-html5" },
        { name: "CSS3", level: 85, icon: "fa-brands fa-css3-alt" },
        { name: "JavaScript", level: 80, icon: "fa-brands fa-js" },
        { name: "React", level: 75, icon: "fa-brands fa-react" },
        { name: "Python", level: 70, icon: "fa-brands fa-python" },
        { name: "Node.js", level: 65, icon: "fa-brands fa-node-js" },
        { name: "Git", level: 85, icon: "fa-brands fa-git-alt" },
        { name: "Database", level: 60, icon: "fa-solid fa-database" }
    ];

    const getFallbackProfessionalSkills = () => [
        { name: "Problem Solving", level: 90 },
        { name: "Creativity", level: 85 },
        { name: "Team Work", level: 95 },
        { name: "Communication", level: 85 }
    ];

    if (loading) {
        return (
            <section className="skills" id="skills">
                <h2 className="heading">My <span>Skills</span></h2>
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--textColor)' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--mainColor)' }}></i>
                    <p style={{ marginTop: '1rem' }}>Loading skills...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="skills" id="skills">
            <h2 className="heading">My <span>Skills</span></h2>
            
            <div className="skills-container">
                <div className="container1" data-aos="fade-right">
                    <h3 className="sub-heading">Technical Skills</h3>
                    <div className="technical-bars">
                        {technicalSkills.map((skill, index) => (
                            <div className="bar" key={index}>
                                <div className="info">
                                    <i className={skill.icon}></i>
                                    <span>{skill.name}</span>
                                </div>
                                <div className="progress-line">
                                    <div 
                                        className="progress"
                                        style={{ width: `${skill.level}%` }}
                                    >
                                        <span className="percent-tooltip">{skill.level}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="container2" data-aos="fade-left">
                    <h3 className="sub-heading">Professional Skills</h3>
                    <div className="radial-bars">
                        {professionalSkills.map((skill, index) => (
                            <div className="radial-bar" key={index}>
                                <svg x="0px" y="0px" viewBox="0 0 200 200">
                                    <circle className="progress-bg" cx="100" cy="100" r="80"/>
                                    <circle 
                                        className="progress-circle"
                                        cx="100" 
                                        cy="100" 
                                        r="80"
                                        style={{
                                            strokeDashoffset: `${503 - (503 * skill.level) / 100}`
                                        }}
                                    />
                                </svg>
                                <div className="percentage">{skill.level}%</div>
                                <div className="text">{skill.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Skills;
