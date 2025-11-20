import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import '../styles/Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        preferredContact: 'email'
    });

    const [formStatus, setFormStatus] = useState({
        loading: false,
        success: false,
        error: null
    });

    const [charCount, setCharCount] = useState(0);
    const [focusedField, setFocusedField] = useState(null);
    const maxChars = 500;

    const contactMethods = [
        {
            icon: 'fas fa-envelope',
            title: 'Email',
            value: 'danielmukula8@gmail.com',
            link: 'mailto:danielmukula8@gmail.com',
            color: 'blue',
            description: 'Best for detailed inquiries'
        },
        {
            icon: 'fas fa-phone',
            title: 'Phone',
            value: '+254 758 175 275',
            link: 'tel:+254758175275',
            color: 'green',
            description: 'Available Mon-Fri, 9AM-6PM EAT'
        },
        {
            icon: 'fas fa-map-marker-alt',
            title: 'Location',
            value: 'Nairobi, Kenya',
            link: null,
            color: 'purple',
            description: 'East Africa Time Zone (EAT)'
        },
        {
            icon: 'fab fa-whatsapp',
            title: 'WhatsApp',
            value: 'Chat on WhatsApp',
            link: 'https://wa.me/254758175275',
            color: 'emerald',
            description: 'Quick responses guaranteed'
        }
    ];

    const socialLinks = [
        { name: 'GitHub', icon: 'fab fa-github', url: 'https://github.com/devTechs001', color: 'gray' },
        { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://www.linkedin.com/in/daniel-mukula', color: 'blue' },
        { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://www.facebook.com/profile.php?id=100089960419104', color: 'blue' },
        { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://www.instagram.com/king_wisdom_ndk/', color: 'pink' },
        { name: 'Telegram', icon: 'fab fa-telegram-plane', url: 'https://t.me/+254758175275', color: 'cyan' },
        { name: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/254758175275', color: 'green' }
    ];

    const quickMessages = [
        "I'd like to discuss a project",
        "Interested in collaboration",
        "Request for consultation",
        "Job opportunity inquiry"
    ];

    useEffect(() => {
        setCharCount(formData.message.length);
    }, [formData.message]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'message' && value.length > maxChars) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuickMessage = (message) => {
        setFormData(prev => ({ ...prev, subject: message }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ loading: true, success: false, error: null });

        try {
            // Attempt to send via API
            const response = await apiService.sendContactMessage(formData);
            
            if (response.success) {
                setFormStatus({ loading: false, success: true, error: null });
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                    preferredContact: 'email'
                });
                
                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    setFormStatus({ loading: false, success: false, error: null });
                }, 5000);
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Fallback to mailto
            const mailtoLink = `mailto:danielmukula8@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
                `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`
            )}`;
            
            window.location.href = mailtoLink;
            
            setFormStatus({ 
                loading: false, 
                success: false, 
                error: 'Opened email client. Please send the message manually.' 
            });
        }
    };

    const inputClasses = (fieldName) => `
        w-full px-4 py-3 bg-transparent border-2 rounded-xl text-textColor
        transition-all duration-300 outline-none peer
        ${focusedField === fieldName 
            ? 'border-mainColor shadow-input-focus' 
            : 'border-mainColor/30 hover:border-mainColor/50'
        }
    `;

    const labelClasses = (hasValue) => `
        absolute left-4 transition-all duration-300 pointer-events-none
        ${hasValue || focusedField 
            ? '-top-3 text-xs bg-sbgColor px-2 text-mainColor font-semibold' 
            : 'top-3 text-base text-textColor/60'
        }
    `;

    return (
        <section className="contact-section bg-sbgColor py-20 px-4 md:px-8 lg:px-16 relative overflow-hidden" id="contact">
            {/* Background Decorations */}
            <div className="contact-blob contact-blob-1"></div>
            <div className="contact-blob contact-blob-2"></div>
            <div className="contact-grid-pattern"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16" data-aos="fade-down">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textColor mb-4">
                        Contact <span className="gradient-text-contact">Me</span>
                    </h2>
                    <p className="text-textColor/70 text-base md:text-lg max-w-2xl mx-auto">
                        Have a project in mind? Let's discuss how we can work together
                    </p>
                    
                    {/* Availability Badge */}
                    <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                        <span className="availability-dot"></span>
                        <span className="text-green-400 text-sm font-medium">Available for new projects</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-5 gap-8 mb-12">
                    {/* Left Column - Contact Info */}
                    <div className="lg:col-span-2 space-y-6" data-aos="fade-right">
                        {/* Contact Methods */}
                        <div className="contact-info-card">
                            <h3 className="text-2xl md:text-3xl font-bold text-textColor mb-4 flex items-center gap-2">
                                <i className="fas fa-paper-plane text-mainColor"></i>
                                Let's Connect
                            </h3>
                            <p className="text-textColor/70 text-sm md:text-base mb-6 leading-relaxed">
                                I'm always open to discussing new projects, creative ideas, or opportunities 
                                to be part of your visions. Feel free to reach out!
                            </p>

                            <div className="space-y-4">
                                {contactMethods.map((method, index) => (
                                    <div
                                        key={index}
                                        className={`contact-method-card contact-method-${method.color}`}
                                        data-aos="fade-up"
                                        data-aos-delay={index * 100}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="contact-icon-wrapper">
                                                <i className={method.icon}></i>
                                                <div className="icon-pulse"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-textColor font-semibold mb-1">{method.title}</h4>
                                                {method.link ? (
                                                    <a 
                                                        href={method.link}
                                                        className="text-mainColor hover:text-mainColor/80 transition-colors duration-300 text-sm md:text-base break-all"
                                                        target={method.link.startsWith('http') ? '_blank' : undefined}
                                                        rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                    >
                                                        {method.value}
                                                    </a>
                                                ) : (
                                                    <p className="text-textColor/80 text-sm md:text-base">{method.value}</p>
                                                )}
                                                <p className="text-textColor/50 text-xs mt-1">{method.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="contact-info-card" data-aos="fade-up">
                            <h4 className="text-xl font-semibold text-mainColor mb-4 flex items-center gap-2">
                                <i className="fas fa-share-alt"></i>
                                Follow Me
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {socialLinks.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`social-link-modern social-link-${social.color}`}
                                        aria-label={social.name}
                                        data-aos="zoom-in"
                                        data-aos-delay={index * 50}
                                    >
                                        <i className={social.icon}></i>
                                        <span className="social-tooltip-modern">{social.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="response-time-card" data-aos="fade-up">
                            <div className="flex items-center gap-3">
                                <div className="response-icon">
                                    <i className="fas fa-clock"></i>
                                </div>
                                <div>
                                    <p className="text-textColor/60 text-sm">Average Response Time</p>
                                    <p className="text-mainColor text-lg font-bold">Within 24 hours</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Contact Form */}
                    <div className="lg:col-span-3" data-aos="fade-left">
                        <div className="contact-form-card">
                            <h3 className="text-2xl md:text-3xl font-bold text-textColor mb-2">
                                Send Me a Message
                            </h3>
                            <p className="text-textColor/60 text-sm mb-6">
                                Fill out the form below and I'll get back to you as soon as possible
                            </p>

                            {/* Quick Message Templates */}
                            <div className="mb-6">
                                <p className="text-sm text-textColor/70 mb-3">Quick Templates:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickMessages.map((msg, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleQuickMessage(msg)}
                                            className="quick-message-btn"
                                        >
                                            <i className="fas fa-bolt mr-2"></i>
                                            {msg}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name & Email Row */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClasses('name')}
                                            required
                                        />
                                        <label className={labelClasses(formData.name)}>
                                            <i className="fas fa-user mr-1"></i>
                                            Full Name
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClasses('email')}
                                            required
                                        />
                                        <label className={labelClasses(formData.email)}>
                                            <i className="fas fa-envelope mr-1"></i>
                                            Email Address
                                        </label>
                                    </div>
                                </div>

                                {/* Phone & Subject Row */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('phone')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClasses('phone')}
                                            required
                                        />
                                        <label className={labelClasses(formData.phone)}>
                                            <i className="fas fa-phone mr-1"></i>
                                            Phone Number
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('subject')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClasses('subject')}
                                            required
                                        />
                                        <label className={labelClasses(formData.subject)}>
                                            <i className="fas fa-tag mr-1"></i>
                                            Subject
                                        </label>
                                    </div>
                                </div>

                                {/* Preferred Contact Method */}
                                <div>
                                    <label className="text-textColor/70 text-sm mb-2 block">
                                        Preferred Contact Method
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {['email', 'phone', 'whatsapp'].map((method) => (
                                            <label
                                                key={method}
                                                className="radio-card-label"
                                            >
                                                <input
                                                    type="radio"
                                                    name="preferredContact"
                                                    value={method}
                                                    checked={formData.preferredContact === method}
                                                    onChange={handleChange}
                                                    className="radio-input"
                                                />
                                                <span className="radio-card">
                                                    <i className={`fas fa-${method === 'email' ? 'envelope' : method === 'phone' ? 'phone' : 'whatsapp'} mr-2`}></i>
                                                    {method.charAt(0).toUpperCase() + method.slice(1)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="relative">
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('message')}
                                        onBlur={() => setFocusedField(null)}
                                        rows="6"
                                        className={inputClasses('message') + ' resize-none'}
                                        required
                                    ></textarea>
                                    <label className={`${labelClasses(formData.message)} ${formData.message ? 'top-[-12px]' : 'top-3'}`}>
                                        <i className="fas fa-comment-alt mr-1"></i>
                                        Your Message
                                    </label>
                                    <div className="absolute bottom-3 right-3 text-xs text-textColor/50">
                                        {charCount}/{maxChars}
                                    </div>
                                </div>

                                {/* Status Messages */}
                                {formStatus.success && (
                                    <div className="success-message" data-aos="fade-up">
                                        <i className="fas fa-check-circle mr-2"></i>
                                        Message sent successfully! I'll get back to you soon.
                                    </div>
                                )}

                                {formStatus.error && (
                                    <div className="error-message" data-aos="fade-up">
                                        <i className="fas fa-exclamation-circle mr-2"></i>
                                        {formStatus.error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={formStatus.loading}
                                    className="submit-btn group"
                                >
                                    {formStatus.loading ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                                            <span>Send Message</span>
                                            <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                                        </>
                                    )}
                                    <div className="btn-shine"></div>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-aos="fade-up">
                    <div className="stat-card-contact">
                        <div className="stat-icon">
                            <i className="fas fa-project-diagram"></i>
                        </div>
                        <div className="stat-value">100+</div>
                        <div className="stat-label">Projects Completed</div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-value">50+</div>
                        <div className="stat-label">Happy Clients</div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon">
                            <i className="fas fa-star"></i>
                        </div>
                        <div className="stat-value">5.0</div>
                        <div className="stat-label">Average Rating</div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-value">24h</div>
                        <div className="stat-label">Response Time</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;