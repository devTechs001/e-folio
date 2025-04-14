import React from 'react';
import '../styles/Skills.css';

const Skills = () => {
    const technicalSkills = [
        { name: "HTML5", level: 90, icon: "fa-brands fa-html5" },
        { name: "CSS3", level: 85, icon: "fa-brands fa-css3-alt" },
        { name: "JavaScript", level: 80, icon: "fa-brands fa-js" },
        { name: "React", level: 75, icon: "fa-brands fa-react" },
        { name: "Python", level: 70, icon: "fa-brands fa-python" },
        { name: "Node.js", level: 65, icon: "fa-brands fa-node-js" },
        { name: "Git", level: 85, icon: "fa-brands fa-git-alt" },
        { name: "Database", level: 60, icon: "fa-solid fa-database" }
    ];

    const professionalSkills = [
        { name: "Problem Solving", level: 90 },
        { name: "Creativity", level: 85 },
        { name: "Team Work", level: 95 },
        { name: "Communication", level: 85 }
    ];

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
