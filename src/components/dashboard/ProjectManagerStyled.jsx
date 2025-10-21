import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, ExternalLink, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const ProjectManager = () => {
    const { theme } = useTheme();
    const { success } = useNotifications();
    const [projects] = useState([
        { id: 1, title: 'E-Commerce Platform', description: 'Full-stack online store', status: 'completed', tech: ['React', 'Node.js'], image: '/assets/project1.jpg' },
        { id: 2, title: 'Portfolio Website', description: 'Personal portfolio site', status: 'in-progress', tech: ['React', 'Tailwind'], image: '/assets/project2.jpg' }
    ]);

    return (
        <DashboardLayout
            title="Project Manager"
            subtitle="Manage your portfolio projects"
            actions={
                <button style={{
                    padding: '12px 24px', background: theme.gradient, color: theme.background,
                    borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'
                }}>
                    <Plus size={18} /> Add Project
                </button>
            }
        >
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: `${theme.surface}80`, borderRadius: '16px',
                            border: `1px solid ${theme.border}`, overflow: 'hidden',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div style={{ height: '200px', background: `${theme.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '48px' }}>📦</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h3 style={{ color: theme.text, fontSize: '20px', fontWeight: '600', margin: 0 }}>{project.title}</h3>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                    background: project.status === 'completed' ? '#10b98120' : '#f59e0b20',
                                    color: project.status === 'completed' ? '#10b981' : '#f59e0b',
                                    textTransform: 'capitalize'
                                }}>{project.status}</span>
                            </div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '16px' }}>{project.description}</p>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                {project.tech.map(tech => (
                                    <span key={tech} style={{
                                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                                        background: `${theme.primary}20`, color: theme.primary, fontWeight: '500'
                                    }}>{tech}</span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{ flex: 1, padding: '10px', background: theme.gradient, border: 'none', borderRadius: '8px', color: theme.background, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Edit size={16} /> Edit
                                </button>
                                <button style={{ padding: '10px', background: `${theme.primary}15`, border: 'none', borderRadius: '8px', color: theme.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Eye size={16} />
                                </button>
                                <button style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </DashboardLayout>
    );
};

export default ProjectManager;
