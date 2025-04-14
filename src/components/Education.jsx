import React from 'react';
import '../styles/Education.css';

const Education = () => {
    return (
        <section className="education" id="education">
            <h2 className="heading">Education <span>History</span></h2>
            <div className="education-container">
                <div className="education-box">
                    <i className="fas fa-graduation-cap"></i>
                    <div className="education-year">2023 - 2025</div>
                    <h3>Diploma in Computer Science</h3>
                    <p>Level 6</p>
                    <p>Bungoma National Polytechnic</p>
                    <p className="education-details">
                        Specializing in software development, web technologies, and computer systems.
                        Key focus on practical programming skills and modern development practices.
                    </p>
                </div>

                <div className="education-box">
                    <i className="fas fa-laptop-code"></i>
                    <div className="education-year">March 2023 - July 2023</div>
                    <h3>ICT Essentials</h3>
                    <p>Office Automation Specialist</p>
                    <p>Ayes Consults Ltd.</p>
                    <p className="education-details">
                        Comprehensive training in Microsoft Office Suite, computer maintenance,
                        and essential IT skills for modern workplace efficiency.
                    </p>
                </div>

                <div className="education-box">
                    <i className="fas fa-certificate"></i>
                    <div className="education-year">Jan 2023 - March 2023</div>
                    <h3>Digital Skills Training</h3>
                    <p>Google Digital Skills Certificate</p>
                    <p>Google Africa</p>
                    <p className="education-details">
                        Mastered digital marketing, online presence management,
                        and web analytics fundamentals for business growth.
                    </p>
                </div>

                <div className="education-box">
                    <i className="fas fa-laptop-code"></i>
                    <div className="education-year">2022 - 2023</div>
                    <h3>Certificate in Web Development</h3>
                    <p>Level 5</p>
                    <p>FreeCodeCamp</p>
                    <p className="education-details">
                        Comprehensive training in full-stack web development.
                        Covered HTML5, CSS3, JavaScript, React, and Node.js.
                    </p>
                </div>

                <div className="education-box">
                    <i className="fas fa-code"></i>
                    <div className="education-year">2022</div>
                    <h3>Python Programming Certification</h3>
                    <p>Professional Certificate</p>
                    <p>Coursera</p>
                    <p className="education-details">
                        Advanced Python programming concepts including data structures,
                        algorithms, and object-oriented programming.
                    </p>
                </div>

                <div className="education-box">
                    <i className="fas fa-school"></i>
                    <div className="education-year">2019 - 2022</div>
                    <h3>Secondary Education</h3>
                    <p>K.C.S.E Certificate</p>
                    <p>Musingu High School</p>
                    <p className="education-details">
                        Completed secondary education with excellent grades in
                        Mathematics, Physics, and Computer Studies.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Education;
