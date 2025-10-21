import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, Edit3, Eye, Save, Plus, Trash2, Settings, Monitor, Tablet, Smartphone, Code } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const PortfolioEditor = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success } = useNotifications();
    const [editorMode, setEditorMode] = useState('visual');
    const [viewportSize, setViewportSize] = useState('desktop');

    const [sections, setSections] = useState([
        { id: 1, name: 'Header', type: 'navigation', visible: true },
        { id: 2, name: 'Hero Section', type: 'hero', visible: true },
        { id: 3, name: 'About', type: 'content', visible: true },
        { id: 4, name: 'Skills', type: 'skills', visible: true },
        { id: 5, name: 'Projects', type: 'portfolio', visible: true },
        { id: 6, name: 'Contact', type: 'contact', visible: true }
    ]);

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>
                    Portfolio Editor is only available to the owner.
                </div>
            </DashboardLayout>
        );
    }

    const toggleSection = (id) => {
        setSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
        success('Section updated');
    };

    return (
        <DashboardLayout
            title="Portfolio Editor"
            subtitle="Customize your portfolio layout and content"
            actions={
                <button onClick={() => success('Portfolio saved!')} style={{
                    padding: '12px 24px', background: theme.gradient, color: theme.background,
                    borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                    boxShadow: `0 4px 15px ${theme.primary}40`
                }}>
                    <Save size={18} /> Save Changes
                </button>
            }
        >
            <div style={{ display: 'flex', height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{
                    width: '280px', background: `${theme.surface}80`, borderRight: `1px solid ${theme.border}`,
                    padding: '20px', overflowY: 'auto'
                }}>
                    <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Editor Mode
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {['visual', 'code', 'preview'].map(mode => (
                            <button key={mode} onClick={() => setEditorMode(mode)} style={{
                                flex: 1, padding: '10px', background: editorMode === mode ? theme.gradient : `${theme.primary}15`,
                                border: 'none', borderRadius: '8px', color: editorMode === mode ? theme.background : theme.text,
                                cursor: 'pointer', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize'
                            }}>
                                {mode}
                            </button>
                        ))}
                    </div>

                    <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Viewport
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {[
                            { name: 'desktop', icon: Monitor },
                            { name: 'tablet', icon: Tablet },
                            { name: 'mobile', icon: Smartphone }
                        ].map(({ name, icon: Icon }) => (
                            <button key={name} onClick={() => setViewportSize(name)} style={{
                                flex: 1, padding: '10px', background: viewportSize === name ? theme.gradient : `${theme.primary}15`,
                                border: 'none', borderRadius: '8px', color: viewportSize === name ? theme.background : theme.primary,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Icon size={18} />
                            </button>
                        ))}
                    </div>

                    <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Sections
                    </h3>
                    {sections.map(section => (
                        <div key={section.id} style={{
                            padding: '12px', marginBottom: '8px', background: `${theme.background}40`,
                            borderRadius: '10px', border: `1px solid ${theme.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layout size={16} style={{ color: theme.primary }} />
                                <span style={{ color: theme.text, fontSize: '14px', fontWeight: '500' }}>
                                    {section.name}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => toggleSection(section.id)} style={{
                                    padding: '6px', background: section.visible ? `${theme.primary}20` : 'transparent',
                                    border: `1px solid ${theme.border}`, borderRadius: '6px',
                                    color: section.visible ? theme.primary : theme.textSecondary, cursor: 'pointer'
                                }}>
                                    <Eye size={14} />
                                </button>
                                <button style={{
                                    padding: '6px', background: 'transparent',
                                    border: `1px solid ${theme.border}`, borderRadius: '6px',
                                    color: theme.textSecondary, cursor: 'pointer'
                                }}>
                                    <Settings size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button style={{
                        width: '100%', padding: '12px', background: `${theme.primary}15`,
                        border: `1px solid ${theme.primary}30`, borderRadius: '10px',
                        color: theme.primary, cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                        marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Plus size={16} /> Add Section
                    </button>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: theme.background }}>
                    <div style={{
                        maxWidth: viewportSize === 'desktop' ? '100%' : viewportSize === 'tablet' ? '768px' : '375px',
                        margin: '0 auto', background: `${theme.surface}60`,
                        borderRadius: '16px', border: `1px solid ${theme.border}`,
                        minHeight: '600px', padding: '24px'
                    }}>
                        {editorMode === 'visual' && (
                            <div>
                                <h2 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
                                    Visual Editor
                                </h2>
                                <p style={{ color: theme.textSecondary, fontSize: '15px', marginBottom: '24px' }}>
                                    Drag and drop sections to customize your portfolio layout
                                </p>
                                {sections.filter(s => s.visible).map(section => (
                                    <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            padding: '24px', marginBottom: '16px', background: `${theme.background}40`,
                                            borderRadius: '12px', border: `2px dashed ${theme.border}`,
                                            cursor: 'move'
                                        }}
                                    >
                                        <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                            {section.name}
                                        </h3>
                                        <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>
                                            {section.type} section - Click to edit content
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {editorMode === 'code' && (
                            <div>
                                <div style={{
                                    background: '#1e1e1e', borderRadius: '12px', padding: '20px',
                                    fontFamily: "'Fira Code', monospace", fontSize: '14px',
                                    color: '#d4d4d4', lineHeight: '1.6', overflow: 'auto'
                                }}>
                                    <pre style={{ margin: 0 }}>
                                        {JSON.stringify(sections, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {editorMode === 'preview' && (
                            <div>
                                <h2 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
                                    Live Preview
                                </h2>
                                <p style={{ color: theme.textSecondary, fontSize: '15px' }}>
                                    This is how your portfolio will look with current settings
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PortfolioEditor;
