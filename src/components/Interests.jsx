import React from 'react';
import '../styles/Interests.css';

const Interests = () => {
    return (
        <section className="interests" id="interests">
            <div className="title-container">
                <h2 className="title">
                    <i className="fas fa-star star-left"></i>
                    Hobbies & <span>Interests</span>
                    <i className="fas fa-star star-right"></i>
                </h2>
                <div className="title-underline"></div>
            </div>
            
            <div className="interests-container">
                <div className="interest-box" data-aos="fade-up">
                    <i className="fas fa-code icon-3d"></i>
                    <h3>Programming</h3>
                    <p>Passionate about solving complex problems through code and building innovative solutions that make a difference.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="100">
                    <i className="fas fa-palette icon-3d"></i>
                    <h3>Web Design</h3>
                    <p>Creating visually appealing and user-friendly interfaces that enhance the digital experience.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="200">
                    <i className="fas fa-mobile-alt icon-3d"></i>
                    <h3>Mobile Development</h3>
                    <p>Exploring the world of mobile applications and creating responsive solutions for various platforms.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="300">
                    <i className="fas fa-robot icon-3d"></i>
                    <h3>AI & Machine Learning</h3>
                    <p>Fascinated by the potential of artificial intelligence and its applications in solving real-world problems.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="400">
                    <i className="fas fa-link icon-3d"></i>
                    <h3>Blockchain Technology</h3>
                    <p>Interested in decentralized systems and their potential to revolutionize digital transactions.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="500">
                    <i className="fas fa-book-reader icon-3d"></i>
                    <h3>Continuous Learning</h3>
                    <p>Committed to staying updated with the latest technologies and industry best practices.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="600">
                    <i className="fas fa-users icon-3d"></i>
                    <h3>Community Building</h3>
                    <p>Enjoy participating in tech communities and sharing knowledge with fellow developers.</p>
                </div>

                <div className="interest-box" data-aos="fade-up" data-aos-delay="700">
                    <i className="fas fa-lightbulb icon-3d"></i>
                    <h3>Innovation</h3>
                    <p>Passionate about creating new solutions and pushing the boundaries of what's possible with technology.</p>
                </div>
            </div>
        </section>
    );
};

export default Interests;
