import React, { useState } from 'react';
import '../styles/Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        window.location.href = `mailto:danielmukula8@gmail.com?subject=${formData.subject}&body=${formData.message}`;
    };

    return (
        <section className="contact" id="contact">
            <h2 className="heading">Contact <span>Me</span></h2>
            
            <div className="contact-container">
                <div className="contact-info">
                    <h3>Let's Connect</h3>
                    <p>I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.</p>
                    
                    <div className="contact-details">
                        <div className="contact-item">
                            <i className="fas fa-envelope"></i>
                            <div className="info">
                                <h4>Email</h4>
                                <a href="mailto:danielmukula8@gmail.com">danielmukula8@gmail.com</a>
                            </div>
                        </div>
                        
                        <div className="contact-item">
                            <i className="fas fa-phone"></i>
                            <div className="info">
                                <h4>Phone</h4>
                                <a href="tel:+254758175275">+254 758 175 275</a>
                            </div>
                        </div>
                        
                        <div className="contact-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <div className="info">
                                <h4>Location</h4>
                                <p>Nairobi, Kenya</p>
                            </div>
                        </div>
                    </div>

                    <div className="social-links">
                        <h4 style={{ marginBottom: '20px', color: 'var(--mainColor)', fontSize: '18px' }}>Follow Me</h4>
                        <div className="social-icons" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <a href="https://github.com/devTechs001" target="_blank" rel="noopener noreferrer" title="GitHub" className="social-icon-modern" style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #333, #000)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <i className="fab fa-github" style={{ fontSize: '24px', color: '#fff', zIndex: 1 }}></i>
                            </a>
                            <a href="https://www.linkedin.com/in/daniel-mukula" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="social-icon-modern" style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #0077b5, #005582)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 5px 15px rgba(0, 119, 181, 0.4)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <i className="fab fa-linkedin-in" style={{ fontSize: '24px', color: '#fff', zIndex: 1 }}></i>
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=100089960419104" target="_blank" rel="noopener noreferrer" title="Facebook" className="social-icon-modern" style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #1877f2, #0c63d4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 5px 15px rgba(24, 119, 242, 0.4)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <i className="fab fa-facebook-f" style={{ fontSize: '24px', color: '#fff', zIndex: 1 }}></i>
                            </a>
                            <a href="https://www.instagram.com/king_wisdom_ndk/" target="_blank" rel="noopener noreferrer" title="Instagram" className="social-icon-modern" style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 5px 15px rgba(225, 48, 108, 0.4)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <i className="fab fa-instagram" style={{ fontSize: '24px', color: '#fff', zIndex: 1 }}></i>
                            </a>
                            <a href="https://wa.me/254758175275" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="social-icon-modern" style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #25d366, #128c7e)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 5px 15px rgba(37, 211, 102, 0.4)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <i className="fab fa-whatsapp" style={{ fontSize: '24px', color: '#fff', zIndex: 1 }}></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="contact-form">
                    <h3>Send Me a Message</h3>
                    <form id="contactForm" onSubmit={handleSubmit}>
                        <div className="input-box">
                            <div className="input-field">
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                <label>Full Name</label>
                            </div>
                            <div className="input-field">
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                <label>Email Address</label>
                            </div>
                        </div>
                        
                        <div className="input-box">
                            <div className="input-field">
                                <input 
                                    type="tel" 
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                                <label>Phone Number</label>
                            </div>
                            <div className="input-field">
                                <input 
                                    type="text" 
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                                <label>Subject</label>
                            </div>
                        </div>
                        
                        <div className="input-field">
                            <textarea 
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                            <label>Your Message</label>
                        </div>
                        
                        <div className="button-container">
                            <button type="submit" className="btn">
                                Send Message
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
