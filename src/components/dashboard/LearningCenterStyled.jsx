import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Book, Users, MessageCircle, HelpCircle, Search, Video, FileText, Award, ExternalLink } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import DashboardLayout from './DashboardLayout';

const LearningCenter = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('videos');

    const videos = [
        { id: 1, title: 'Getting Started with E-Folio', duration: '12:45', views: '2.5K', thumbnail: '📹', category: 'Beginner' },
        { id: 2, title: 'Advanced Customization', duration: '18:30', views: '1.8K', thumbnail: '🎨', category: 'Advanced' },
        { id: 3, title: 'Collaboration Best Practices', duration: '15:20', views: '3.2K', thumbnail: '🤝', category: 'Intermediate' }
    ];

    const tutorials = [
        { id: 1, title: 'How to Add Projects', icon: FileText, difficulty: 'Easy', time: '5 min' },
        { id: 2, title: 'Theme Customization Guide', icon: Award, difficulty: 'Medium', time: '10 min' },
        { id: 3, title: 'Setting Up Collaboration', icon: Users, difficulty: 'Medium', time: '8 min' }
    ];

    const faqs = [
        { q: 'How do I invite collaborators?', a: 'Go to Collaborators section and click "Invite" button.' },
        { q: 'Can I customize themes?', a: 'Yes! Visit Theme Manager to select from 18 themes or create your own.' },
        { q: 'How do I track visitors?', a: 'Check the Visitors Analytics page for detailed insights.' }
    ];

    const communities = [
        { name: 'E-Folio Users', members: '12.5K', icon: '👥', active: true },
        { name: 'Developers Hub', members: '8.3K', icon: '💻', active: true },
        { name: 'Design Community', members: '6.1K', icon: '🎨', active: false }
    ];

    return (
        <DashboardLayout title="Learning Center" subtitle="Tutorials, resources, and community support">
            <div style={{ padding: '24px' }}>
                {/* Search Bar */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ position: 'relative', maxWidth: '600px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                        <input type="text" placeholder="Search tutorials, videos, FAQs..." style={{
                            width: '100%', padding: '14px 16px 14px 48px', background: `${theme.surface}80`,
                            border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text,
                            fontSize: '15px', outline: 'none'
                        }} />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'videos', icon: Video, label: 'Video Tutorials' },
                        { id: 'tutorials', icon: Book, label: 'Written Guides' },
                        { id: 'community', icon: Users, label: 'Community' },
                        { id: 'faq', icon: HelpCircle, label: 'FAQ' }
                    ].map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)} style={{
                            padding: '12px 24px', background: activeTab === id ? theme.gradient : `${theme.primary}15`,
                            border: 'none', borderRadius: '10px', color: activeTab === id ? theme.background : theme.text,
                            cursor: 'pointer', fontSize: '15px', fontWeight: '600', display: 'flex',
                            alignItems: 'center', gap: '8px', transition: 'all 0.3s ease'
                        }}>
                            <Icon size={18} /> {label}
                        </button>
                    ))}
                </div>

                {/* Videos Tab */}
                {activeTab === 'videos' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: theme.fontHeading }}>
                            Video Library
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {videos.map(video => (
                                <motion.div key={video.id} whileHover={{ y: -4 }} style={{
                                    background: `${theme.surface}80`, borderRadius: '16px', padding: '20px',
                                    border: `1px solid ${theme.border}`, cursor: 'pointer', backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{
                                        width: '100%', height: '180px', background: `${theme.primary}20`,
                                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '64px', marginBottom: '16px'
                                    }}>
                                        {video.thumbnail}
                                        <div style={{
                                            position: 'absolute', width: '60px', height: '60px',
                                            background: theme.gradient, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 4px 12px ${theme.primary}60`
                                        }}>
                                            <Play size={28} style={{ color: theme.background, marginLeft: '4px' }} />
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
                                        background: `${theme.accent}20`, color: theme.accent,
                                        fontSize: '12px', fontWeight: '600', marginBottom: '12px'
                                    }}>
                                        {video.category}
                                    </span>
                                    <h4 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                                        {video.title}
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary, fontSize: '14px' }}>
                                        <span>⏱️ {video.duration}</span>
                                        <span>👁️ {video.views} views</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tutorials Tab */}
                {activeTab === 'tutorials' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: theme.fontHeading }}>
                            Step-by-Step Guides
                        </h3>
                        {tutorials.map((tutorial, index) => (
                            <motion.div key={tutorial.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '20px', marginBottom: '16px', background: `${theme.surface}80`,
                                    borderRadius: '12px', border: `1px solid ${theme.border}`, cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: `${theme.primary}20`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <tutorial.icon size={24} style={{ color: theme.primary }} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                                            {tutorial.title}
                                        </h4>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: theme.textSecondary }}>
                                            <span>📊 {tutorial.difficulty}</span>
                                            <span>⏱️ {tutorial.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink size={20} style={{ color: theme.primary }} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Community Tab */}
                {activeTab === 'community' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: theme.fontHeading }}>
                            Join Our Communities
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {communities.map((community, index) => (
                                <motion.div key={index} whileHover={{ scale: 1.02 }} style={{
                                    padding: '24px', background: `${theme.surface}80`, borderRadius: '16px',
                                    border: `1px solid ${theme.border}`, textAlign: 'center', backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{community.icon}</div>
                                    <h4 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                        {community.name}
                                    </h4>
                                    <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '16px' }}>
                                        {community.members} members
                                    </p>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 16px', borderRadius: '8px',
                                        background: community.active ? `${theme.primary}20` : `${theme.textSecondary}20`,
                                        color: community.active ? theme.primary : theme.textSecondary,
                                        fontSize: '12px', fontWeight: '600'
                                    }}>
                                        {community.active ? '🟢 Active' : '🔴 Inactive'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* FAQ Tab */}
                {activeTab === 'faq' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: theme.fontHeading }}>
                            Frequently Asked Questions
                        </h3>
                        {faqs.map((faq, index) => (
                            <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    padding: '24px', marginBottom: '16px', background: `${theme.surface}80`,
                                    borderRadius: '12px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <HelpCircle size={24} style={{ color: theme.primary, flexShrink: 0 }} />
                                    <h4 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                                        {faq.q}
                                    </h4>
                                </div>
                                <p style={{ color: theme.textSecondary, fontSize: '15px', margin: '0 0 0 36px', lineHeight: '1.6' }}>
                                    {faq.a}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LearningCenter;
