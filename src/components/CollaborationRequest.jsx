import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Mail, Briefcase, MessageSquare, CheckCircle, Github, Linkedin, Globe } from 'lucide-react';
import { useNotifications } from './NotificationSystem';

const CollaborationRequest = () => {
    const { success, error, info } = useNotifications();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        company: '',
        message: '',
        portfolio: '',
        github: '',
        linkedin: '',
        skills: [],
        availability: 'full-time'
    });

    const [customSkill, setCustomSkill] = useState('');

    const skillOptions = [
        'React', 'Node.js', 'TypeScript', 'Python', 'Java', 'C++',
        'UI/UX Design', 'DevOps', 'Cloud Architecture', 'Mobile Development',
        'Data Science', 'Machine Learning', 'Blockchain', 'Cybersecurity'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const addCustomSkill = () => {
        if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, customSkill.trim()]
            }));
            setCustomSkill('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.role || !formData.message) {
            error('Please fill in all required fields');
            return;
        }

        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            error('Please enter a valid email address');
            return;
        }

        // Save request to localStorage (will be visible to owner)
        const requests = JSON.parse(localStorage.getItem('collaboration_requests') || '[]');
        const newRequest = {
            id: Date.now(),
            ...formData,
            status: 'pending',
            submittedAt: new Date().toISOString()
        };

        requests.push(newRequest);
        localStorage.setItem('collaboration_requests', JSON.stringify(requests));

        setSubmitted(true);
        success('Collaboration request submitted successfully!');
        info('You will receive an invite link via email once approved');
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-color, #081b29)' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full p-8 rounded-2xl text-center"
                    style={{ 
                        backgroundColor: 'var(--surface-color, #0f2438)',
                        border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                    >
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </motion.div>

                    <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--primary-color, #00efff)' }}>
                        Request Submitted!
                    </h2>
                    <p className="mb-6" style={{ color: 'var(--text-secondary, #b0b0b0)' }}>
                        Thank you for your interest in collaborating! Your request has been sent to the portfolio owner.
                    </p>

                    <div className="space-y-4 text-left mb-6">
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-color, #081b29)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--primary-color, #00efff)' }}>
                                What happens next?
                            </h3>
                            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary, #b0b0b0)' }}>
                                <li className="flex items-start">
                                    <span className="mr-2">1.</span>
                                    <span>The owner will review your collaboration request</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">2.</span>
                                    <span>If approved, you'll receive an invite link via email</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">3.</span>
                                    <span>Use the invite link to access the collaboration dashboard</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                            <p className="text-sm" style={{ color: '#fb923c' }}>
                                <strong>Note:</strong> Make sure to check your email regularly for the invitation. The invite link will be unique to you.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                        style={{ 
                            backgroundColor: 'var(--primary-color, #00efff)',
                            color: 'var(--bg-color, #081b29)'
                        }}
                    >
                        Back to Portfolio
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-color, #081b29)' }}>
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--primary-color, #00efff)' }}>
                        Collaborate With Me
                    </h1>
                    <p style={{ color: 'var(--text-secondary, #b0b0b0)' }}>
                        Fill out the form below to request collaboration access. I'll review your request and send you an invite link if approved.
                    </p>
                </motion.div>

                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="p-8 rounded-2xl space-y-6"
                    style={{ 
                        backgroundColor: 'var(--surface-color, #0f2438)',
                        border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                    }}
                >
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-color, #00efff)' }}>
                            Personal Information
                        </h3>

                        <div>
                            <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--primary-color, #00efff)' }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--bg-color, #081b29)',
                                        color: 'var(--text-color, #ededed)',
                                        border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))',
                                        '--tw-ring-color': 'var(--primary-color, #00efff)'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--primary-color, #00efff)' }} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="john@example.com"
                                    className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--bg-color, #081b29)',
                                        color: 'var(--text-color, #ededed)',
                                        border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                                    Role/Title *
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--primary-color, #00efff)' }} />
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        placeholder="Full Stack Developer"
                                        className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                        style={{ 
                                            backgroundColor: 'var(--bg-color, #081b29)',
                                            color: 'var(--text-color, #ededed)',
                                            border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                                    Company/Organization
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Your Company"
                                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        backgroundColor: 'var(--bg-color, #081b29)',
                                        color: 'var(--text-color, #ededed)',
                                        border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-color, #00efff)' }}>
                            Professional Links
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 font-medium text-sm" style={{ color: 'var(--text-color, #ededed)' }}>
                                    Portfolio
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--primary-color, #00efff)' }} />
                                    <input
                                        type="url"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleChange}
                                        placeholder="yoursite.com"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm"
                                        style={{ 
                                            backgroundColor: 'var(--bg-color, #081b29)',
                                            color: 'var(--text-color, #ededed)',
                                            border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-sm" style={{ color: 'var(--text-color, #ededed)' }}>
                                    GitHub
                                </label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--primary-color, #00efff)' }} />
                                    <input
                                        type="text"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleChange}
                                        placeholder="github.com/username"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm"
                                        style={{ 
                                            backgroundColor: 'var(--bg-color, #081b29)',
                                            color: 'var(--text-color, #ededed)',
                                            border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium text-sm" style={{ color: 'var(--text-color, #ededed)' }}>
                                    LinkedIn
                                </label>
                                <div className="relative">
                                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--primary-color, #00efff)' }} />
                                    <input
                                        type="text"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleChange}
                                        placeholder="linkedin.com/in/username"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm"
                                        style={{ 
                                            backgroundColor: 'var(--bg-color, #081b29)',
                                            color: 'var(--text-color, #ededed)',
                                            border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-color, #00efff)' }}>
                            Skills & Expertise
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {skillOptions.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                                    style={{
                                        backgroundColor: formData.skills.includes(skill)
                                            ? 'var(--primary-color, #00efff)'
                                            : 'var(--bg-color, #081b29)',
                                        color: formData.skills.includes(skill)
                                            ? 'var(--bg-color, #081b29)'
                                            : 'var(--text-color, #ededed)',
                                        border: `1px solid ${formData.skills.includes(skill) ? 'transparent' : 'var(--border-color, rgba(0, 239, 255, 0.2))'}`
                                    }}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customSkill}
                                onChange={(e) => setCustomSkill(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                                placeholder="Add custom skill..."
                                className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                style={{ 
                                    backgroundColor: 'var(--bg-color, #081b29)',
                                    color: 'var(--text-color, #ededed)',
                                    border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                }}
                            />
                            <button
                                type="button"
                                onClick={addCustomSkill}
                                className="px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:opacity-80"
                                style={{ 
                                    backgroundColor: 'var(--primary-color, #00efff)',
                                    color: 'var(--bg-color, #081b29)'
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map(skill => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: 'rgba(0, 239, 255, 0.2)',
                                            color: 'var(--primary-color, #00efff)',
                                            border: '1px solid var(--primary-color, #00efff)'
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Availability */}
                    <div>
                        <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                            Availability
                        </label>
                        <select
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                            style={{ 
                                backgroundColor: 'var(--bg-color, #081b29)',
                                color: 'var(--text-color, #ededed)',
                                border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                            }}
                        >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="freelance">Freelance</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block mb-2 font-medium" style={{ color: 'var(--text-color, #ededed)' }}>
                            Tell me about your collaboration interest *
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-5 h-5" style={{ color: 'var(--primary-color, #00efff)' }} />
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="5"
                                placeholder="Share your ideas for collaboration, relevant experience, and what value you can bring to projects..."
                                className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
                                style={{ 
                                    backgroundColor: 'var(--bg-color, #081b29)',
                                    color: 'var(--text-color, #ededed)',
                                    border: '1px solid var(--border-color, rgba(0, 239, 255, 0.2))'
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-300"
                        style={{ 
                            backgroundColor: 'var(--primary-color, #00efff)',
                            color: 'var(--bg-color, #081b29)'
                        }}
                    >
                        <Send className="w-5 h-5" />
                        <span>Submit Collaboration Request</span>
                    </motion.button>

                    <p className="text-center text-sm" style={{ color: 'var(--text-secondary, #b0b0b0)' }}>
                        By submitting this form, you agree to be contacted regarding collaboration opportunities.
                    </p>
                </motion.form>
            </div>
        </div>
    );
};

export default CollaborationRequest;
