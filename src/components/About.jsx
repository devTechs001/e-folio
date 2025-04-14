import React, { useEffect } from 'react';
import Typed from 'typed.js';
import '../styles/About.css';

const About = () => {
    useEffect(() => {
        const options = {
            strings: [
                'Frontend Developer',
                'Web Designer',
                'UI/UX Designer',
                'Software Developer'
            ],
            typeSpeed: 100,
            backSpeed: 50,
            backDelay: 2000,
            loop: true
        };

        const typed = new Typed('.multiple-text', options);

        return () => {
            typed.destroy();
        };
    }, []);

    return (
        <section className="about" id="about">
            <div className="about-content">
                <h3>WELCOME TO<span> MY PORTFOLIO</span></h3>
                <h1>Danie Tech</h1>
                <h3>I'm a <span className="multiple-text"></span></h3>
                <p>
                    I am a passionate and creative developer with a strong foundation in web development 
                    and software engineering. I specialize in creating responsive and user-friendly web 
                    applications using modern technologies and best practices. With expertise in frontend 
                    development and UI/UX design, I focus on delivering high-quality solutions that meet 
                    client needs and exceed expectations.
                </p>
                <p>
                    My approach combines technical excellence with creative problem-solving, ensuring 
                    that each project not only functions flawlessly but also provides an exceptional 
                    user experience. I'm constantly learning and staying updated with the latest 
                    technologies to deliver innovative solutions.
                </p>
                <div className="social-media">
                    <a href="https://www.facebook.com/profile.php?id=100089960419104" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="Facebook">
                        <i className="fab fa-facebook"></i>
                    </a>
                    <a href="https://www.instagram.com/king_wisdom_ndk/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="Instagram">
                        <i className="fab fa-instagram"></i>
                    </a>
                    <a href="https://github.com/devTechs001" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="GitHub">
                        <i className="fab fa-github"></i>
                    </a>
                    <a href="https://t.me/+254758175275" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="Telegram">
                        <i className="fab fa-telegram"></i>
                    </a>
                    <a href="https://wa.me/254758175275" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="WhatsApp">
                        <i className="fab fa-whatsapp"></i>
                    </a>
                </div>
                <a href="/assets/cv/CV2.pdf" className="btn" download>
                    <i className="fas fa-download"></i> Download CV
                </a>
            </div>
            <div className="about-image">
                <img src="assets/images/profile-pic.jpg" alt="Daniel Mukula" />
                <div className="circle-spin"></div>
            </div>
        </section>
    );
};

export default About;
