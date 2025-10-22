import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, Briefcase, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';
import apiService from '../services/api.service';

const CollaborationRequest = () => {
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', role: '', message: '', skills: []
    });
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

    const skillOptions = [
        'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'TypeScript', 
        'Python', 'Django', 'Flask', 'UI/UX Design', 'DevOps', 'Docker', 
        'Kubernetes', 'AWS', 'Azure', 'MongoDB', 'PostgreSQL', 'GraphQL',
        'Mobile Development', 'React Native', 'Flutter', 'Testing', 'CI/CD'
    ];

    const roleOptions = [
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'UI/UX Designer', 'DevOps Engineer', 'Mobile Developer',
        'Data Scientist', 'Project Manager', 'Technical Writer'
    ];

    const emailDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];

    const handleEmailChange = (value) => {
        setFormData({ ...formData, email: value });
        
        // Auto-suggest email domains
        if (value.includes('@')) {
            setEmailSuggestions([]);
        } else if (value.length > 2 && !value.includes('@')) {
            setEmailSuggestions(emailDomains);
        } else {
            setEmailSuggestions([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            error('Please fill in all required fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            error('Please enter a valid email address');
            return;
        }
        
        try {
            const response = await apiService.submitCollaborationRequest(formData);
            if (response.success) {
                setSubmitted(true);
                success('Request submitted successfully! We will review it and get back to you soon.');
            } else {
                error(response.message || 'Failed to submit request');
            }
        } catch (err) {
            console.error('Submission error:', err);
            error(err.message || 'Failed to submit request. Please try again.');
        }
    };

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: theme.background }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{
                    maxWidth: '500px', padding: '48px', borderRadius: '20px', background: `${theme.surface}90`,
                    border: `1px solid ${theme.border}`, textAlign: 'center', backdropFilter: 'blur(10px)'
                }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ delay: 0.2 }} style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: theme.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={40} style={{ color: theme.background }} />
                    </motion.div>
                    <h2 style={{ color: theme.text, fontSize: '28px', fontWeight: '700', marginBottom: '12px', fontFamily: theme.fontHeading }}>
                        Request Submitted!
                    </h2>
                    <p style={{ color: theme.textSecondary, fontSize: '16px', marginBottom: '24px', lineHeight: '1.6' }}>
                        Thank you for your interest! You'll receive an invite link via email once approved.
                    </p>
                    <Link to="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                        background: theme.gradient, color: theme.background, borderRadius: '10px',
                        fontWeight: '600', textDecoration: 'none', fontSize: '15px'
                    }}>
                        <ArrowLeft size={18} /> Back to Portfolio
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)', background: theme.background }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: 'clamp(24px, 4vw, 32px)', textAlign: 'center' }}>
                    <h1 style={{ color: theme.text, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '700', marginBottom: '12px', fontFamily: theme.fontHeading }}>
                        Collaborate with Me
                    </h1>
                    <p style={{ color: theme.textSecondary, fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: '1.6', padding: '0 clamp(8px, 2vw, 16px)' }}>
                        Let's work together! Fill out the form below to request collaboration access.
                    </p>
                </motion.div>

                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onSubmit={handleSubmit} style={{
                    background: `${theme.surface}80`, borderRadius: 'clamp(12px, 3vw, 20px)', padding: 'clamp(20px, 4vw, 32px)',
                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: theme.textSecondary, fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '8px', fontWeight: '600' }}>
                                <User size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Full Name *
                            </label>
                            <input required type="text" value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%', padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                    fontSize: 'clamp(14px, 2vw, 15px)', outline: 'none', boxSizing: 'border-box'
                                }}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: theme.textSecondary, fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '8px', fontWeight: '600' }}>
                                <Mail size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Email Address *
                            </label>
                            <input required type="email" value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%', padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                    fontSize: 'clamp(14px, 2vw, 15px)', outline: 'none', boxSizing: 'border-box'
                                }}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '8px', fontWeight: '600' }}>
                            <Briefcase size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Your Role
                        </label>
                        <input type="text" value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{
                                width: '100%', padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)', background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                fontSize: 'clamp(14px, 2vw, 15px)', outline: 'none', boxSizing: 'border-box'
                            }}
                            placeholder="e.g., Developer, Designer, Project Manager"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '12px', fontWeight: '600' }}>
                            Skills (Select all that apply)
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.5vw, 8px)', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                            {skillOptions.map(skill => (
                                <button key={skill} type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        skills: formData.skills.includes(skill)
                                            ? formData.skills.filter(s => s !== skill)
                                            : [...formData.skills, skill]
                                    })}
                                    style={{
                                        padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)', borderRadius: '8px',
                                        background: formData.skills.includes(skill) ? theme.gradient : `${theme.primary}15`,
                                        border: `1px solid ${formData.skills.includes(skill) ? theme.primary : theme.border}`,
                                        color: formData.skills.includes(skill) ? theme.background : theme.text,
                                        cursor: 'pointer', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: '600',
                                        transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                        <p style={{ color: theme.textSecondary, fontSize: 'clamp(11px, 1.5vw, 12px)', marginTop: '8px', fontStyle: 'italic' }}>
                            {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '8px', fontWeight: '600' }}>
                            <MessageSquare size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Message *
                        </label>
                        <textarea required value={formData.message} rows={window.innerWidth < 640 ? 4 : 5}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            style={{
                                width: '100%', padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)', background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                fontSize: 'clamp(14px, 2vw, 15px)', outline: 'none', resize: 'vertical', fontFamily: theme.fontBody,
                                boxSizing: 'border-box', minHeight: 'clamp(100px, 15vw, 120px)'
                            }}
                            placeholder="Tell me about yourself and why you'd like to collaborate..."
                        />
                    </div>

                    <button type="submit" style={{
                        width: '100%', padding: 'clamp(12px, 2.5vw, 16px)', background: theme.gradient, border: 'none',
                        borderRadius: '12px', color: theme.background, fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: `0 8px 24px ${theme.primary}40`, transition: 'all 0.3s ease'
                    }}>
                        <Send size={window.innerWidth < 640 ? 18 : 20} /> 
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {window.innerWidth < 640 ? 'Submit Request' : 'Submit Collaboration Request'}
                        </span>
                    </button>
                </motion.form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link to="/" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} /> Back to Portfolio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CollaborationRequest;
