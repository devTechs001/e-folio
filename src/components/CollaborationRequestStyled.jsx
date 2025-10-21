import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, Briefcase, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from './NotificationSystem';

const CollaborationRequest = () => {
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', role: '', message: '', skills: []
    });

    const skillOptions = ['React', 'Node.js', 'TypeScript', 'Python', 'UI/UX Design', 'DevOps', 'Mobile Development'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            error('Please fill in all required fields');
            return;
        }
        const requests = JSON.parse(localStorage.getItem('collaboration_requests') || '[]');
        requests.push({ id: Date.now(), ...formData, status: 'pending', submittedAt: new Date().toISOString() });
        localStorage.setItem('collaboration_requests', JSON.stringify(requests));
        setSubmitted(true);
        success('Request submitted successfully!');
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
        <div style={{ minHeight: '100vh', padding: '40px 20px', background: theme.background }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <h1 style={{ color: theme.text, fontSize: '36px', fontWeight: '700', marginBottom: '12px', fontFamily: theme.fontHeading }}>
                        Collaborate with Me
                    </h1>
                    <p style={{ color: theme.textSecondary, fontSize: '16px', lineHeight: '1.6' }}>
                        Let's work together! Fill out the form below to request collaboration access.
                    </p>
                </motion.div>

                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onSubmit={handleSubmit} style={{
                    background: `${theme.surface}80`, borderRadius: '20px', padding: '32px',
                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                <User size={16} style={{ display: 'inline', marginRight: '6px' }} /> Full Name *
                            </label>
                            <input required type="text" value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                    fontSize: '15px', outline: 'none'
                                }}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} /> Email Address *
                            </label>
                            <input required type="email" value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                    fontSize: '15px', outline: 'none'
                                }}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                            <Briefcase size={16} style={{ display: 'inline', marginRight: '6px' }} /> Your Role
                        </label>
                        <input type="text" value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{
                                width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                fontSize: '15px', outline: 'none'
                            }}
                            placeholder="e.g., Developer, Designer, Project Manager"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                            Skills
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {skillOptions.map(skill => (
                                <button key={skill} type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        skills: formData.skills.includes(skill)
                                            ? formData.skills.filter(s => s !== skill)
                                            : [...formData.skills, skill]
                                    })}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px',
                                        background: formData.skills.includes(skill) ? theme.gradient : `${theme.primary}15`,
                                        border: `1px solid ${formData.skills.includes(skill) ? theme.primary : theme.border}`,
                                        color: formData.skills.includes(skill) ? theme.background : theme.text,
                                        cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                                    }}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                            <MessageSquare size={16} style={{ display: 'inline', marginRight: '6px' }} /> Message *
                        </label>
                        <textarea required value={formData.message} rows={5}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            style={{
                                width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                fontSize: '15px', outline: 'none', resize: 'vertical', fontFamily: theme.fontBody
                            }}
                            placeholder="Tell me about yourself and why you'd like to collaborate..."
                        />
                    </div>

                    <button type="submit" style={{
                        width: '100%', padding: '16px', background: theme.gradient, border: 'none',
                        borderRadius: '12px', color: theme.background, fontSize: '16px', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: `0 8px 24px ${theme.primary}40`, transition: 'all 0.3s ease'
                    }}>
                        <Send size={20} /> Submit Collaboration Request
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
