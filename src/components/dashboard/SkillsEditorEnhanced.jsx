import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Check, X, Code, Award, TrendingUp, Search, Filter, Download, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import ApiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';

const SkillsEditorEnhanced = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [activeTab, setActiveTab] = useState('technical');
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('level');

    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);

    const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Frontend', color: theme.primary, icon: 'fa-solid fa-code' });
    const [editingId, setEditingId] = useState(null);

    const iconOptions = [
        { value: 'fa-brands fa-html5', label: 'HTML5', color: '#e34c26' },
        { value: 'fa-brands fa-css3-alt', label: 'CSS3', color: '#264de4' },
        { value: 'fa-brands fa-js', label: 'JavaScript', color: '#f7df1e' },
        { value: 'fa-brands fa-react', label: 'React', color: '#61dafb' },
        { value: 'fa-brands fa-vue', label: 'Vue', color: '#42b883' },
        { value: 'fa-brands fa-angular', label: 'Angular', color: '#dd0031' },
        { value: 'fa-brands fa-node-js', label: 'Node.js', color: '#68a063' },
        { value: 'fa-brands fa-python', label: 'Python', color: '#3776ab' },
        { value: 'fa-brands fa-java', label: 'Java', color: '#007396' },
        { value: 'fa-brands fa-php', label: 'PHP', color: '#777bb4' },
        { value: 'fa-brands fa-git-alt', label: 'Git', color: '#f05032' },
        { value: 'fa-solid fa-database', label: 'Database', color: '#4479a1' },
        { value: 'fa-solid fa-code', label: 'Code', color: theme.primary }
    ];

    const categoryOptions = [
        { value: 'Frontend', color: '#61dafb' },
        { value: 'Backend', color: '#68a063' },
        { value: 'DevOps', color: '#f7931e' },
        { value: 'Database', color: '#4479a1' },
        { value: 'Tools', color: '#f05032' },
        { value: 'Mobile', color: '#a4c639' }
    ];

    // Load skills from database
    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getSkills();
            const skills = response.skills || [];
            
            setTechnicalSkills(skills.filter(s => s.type === 'technical'));
            setProfessionalSkills(skills.filter(s => s.type === 'professional'));
        } catch (err) {
            console.error('Error loading skills:', err);
            setTechnicalSkills([]);
            setProfessionalSkills([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.name.trim()) {
            error('Please enter a skill name');
            return;
        }

        try {
            const skillData = { ...newSkill, type: activeTab };
            const response = await ApiService.addSkill(skillData);
            
            if (activeTab === 'technical') {
                setTechnicalSkills([...technicalSkills, response.skill]);
            } else {
                setProfessionalSkills([...professionalSkills, response.skill]);
            }
            
            setNewSkill({ name: '', level: 50, category: 'Frontend', color: theme.primary, icon: 'fa-solid fa-code' });
            setShowAddModal(false);
            success(`Added ${newSkill.name}`);
        } catch (err) {
            error('Failed to add skill');
        }
    };

    const handleUpdate = async (id, field, value) => {
        try {
            await ApiService.updateSkill(id, { [field]: value });
            
            if (activeTab === 'technical') {
                setTechnicalSkills(technicalSkills.map(s => s.id === id ? { ...s, [field]: value } : s));
            } else {
                setProfessionalSkills(professionalSkills.map(s => s.id === id ? { ...s, [field]: value } : s));
            }
        } catch (err) {
            error('Failed to update skill');
        }
    };

    const handleDelete = async (id) => {
        try {
            await ApiService.deleteSkill(id);
            
            if (activeTab === 'technical') {
                setTechnicalSkills(technicalSkills.filter(s => s.id !== id));
            } else {
                setProfessionalSkills(professionalSkills.filter(s => s.id !== id));
            }
            success('Skill deleted');
        } catch (err) {
            error('Failed to delete skill');
        }
    };

    // Filter and sort
    const currentSkills = activeTab === 'technical' ? technicalSkills : professionalSkills;
    const filteredSkills = currentSkills
        .filter(skill => {
            const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
            return matchesSearch && (activeTab === 'professional' || matchesCategory);
        })
        .sort((a, b) => {
            if (sortBy === 'level') return b.level - a.level;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
            return 0;
        });

    const stats = [
        { label: 'Total Skills', value: technicalSkills.length + professionalSkills.length },
        { label: 'Technical', value: technicalSkills.length },
        { label: 'Professional', value: professionalSkills.length },
        { label: 'Avg Level', value: Math.round(currentSkills.reduce((acc, s) => acc + s.level, 0) / currentSkills.length) || 0 }
    ];

    return (
        <DashboardLayout
            title="Skills Editor"
            subtitle="Manage your technical and professional skills with real-time sync"
            actions={
                <button onClick={() => setShowAddModal(true)} style={{
                    padding: '12px 24px', background: theme.gradient, color: theme.background,
                    borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                    boxShadow: `0 4px 15px ${theme.primary}40`
                }}>
                    <Plus size={18} /> Add Skill
                </button>
            }
        >
            <div style={{ padding: '24px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{
                            background: `${theme.surface}80`, borderRadius: '12px', padding: '20px',
                            border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                        }}>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '700', color: theme.primary, margin: 0 }}>{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    {['technical', 'professional'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '12px 32px', background: activeTab === tab ? theme.gradient : `${theme.primary}15`,
                            border: 'none', borderRadius: '10px', color: activeTab === tab ? theme.background : theme.text,
                            cursor: 'pointer', fontSize: '16px', fontWeight: '600', textTransform: 'capitalize',
                            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            {tab === 'technical' ? <Code size={18} /> : <Award size={18} />}
                            {tab} Skills
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div style={{
                    background: `${theme.surface}80`, borderRadius: '16px', padding: '20px',
                    marginBottom: '24px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                            <input type="text" placeholder="Search skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 40px', background: `${theme.background}80`,
                                    border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Category Filter (technical only) */}
                        {activeTab === 'technical' && (
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                                style={{
                                    padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`,
                                    borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer'
                                }}>
                                <option value="all">All Categories</option>
                                {categoryOptions.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.value}</option>
                                ))}
                            </select>
                        )}

                        {/* Sort */}
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`,
                                borderRadius: '10px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer'
                            }}>
                            <option value="level">Highest Level</option>
                            <option value="name">Name A-Z</option>
                            {activeTab === 'technical' && <option value="category">Category</option>}
                        </select>
                    </div>
                </div>

                {/* Skills List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>Loading skills...</div>
                ) : filteredSkills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
                        <p>No skills found. Add your first skill!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {filteredSkills.map((skill, index) => (
                            <motion.div key={skill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: `linear-gradient(135deg, ${theme.surface}90, ${theme.surface}60)`,
                                    borderRadius: '16px', padding: '24px',
                                    border: `1px solid ${skill.color || theme.border}40`,
                                    backdropFilter: 'blur(10px)', position: 'relative',
                                    boxShadow: `0 4px 15px ${skill.color || theme.primary}15`
                                }}
                            >
                                {/* Header with Icon */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        {skill.icon && (
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: `${skill.color || theme.primary}20`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '24px', color: skill.color || theme.primary
                                            }}>
                                                <i className={skill.icon}></i>
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            {editingId === skill.id ? (
                                                <input type="text" value={skill.name}
                                                    onChange={(e) => handleUpdate(skill.id, 'name', e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '6px 12px', background: `${theme.background}80`,
                                                        border: `1px solid ${theme.border}`, borderRadius: '6px',
                                                        color: theme.text, fontSize: '16px', fontWeight: '600', outline: 'none'
                                                    }}
                                                />
                                            ) : (
                                                <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', margin: '0 0 6px 0' }}>
                                                    {skill.name}
                                                </h3>
                                            )}
                                            {skill.category && (
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                                    background: `${skill.color || theme.primary}25`, color: skill.color || theme.primary,
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    {skill.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingId(editingId === skill.id ? null : skill.id)} style={{
                                            padding: '8px', background: editingId === skill.id ? theme.gradient : `${theme.primary}15`,
                                            border: 'none', borderRadius: '8px',
                                            color: editingId === skill.id ? theme.background : theme.primary, cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {editingId === skill.id ? <Check size={16} /> : <Edit3 size={16} />}
                                        </button>
                                        <button onClick={() => handleDelete(skill.id)} style={{
                                            padding: '8px', background: 'rgba(239, 68, 68, 0.15)', border: 'none',
                                            borderRadius: '8px', color: '#ef4444', cursor: 'pointer'
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar with Inline Edit */}
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: theme.textSecondary, fontSize: '14px', fontWeight: '600' }}>Proficiency</span>
                                        <span style={{ color: skill.color || theme.primary, fontSize: '18px', fontWeight: '700' }}>{skill.level}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%', height: '10px', background: `${theme.background}60`,
                                        borderRadius: '6px', overflow: 'hidden', border: `1px solid ${theme.border}`
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${skill.level}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                            style={{
                                                height: '100%',
                                                background: skill.color
                                                    ? `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`
                                                    : theme.gradient,
                                                borderRadius: '6px',
                                                boxShadow: `0 0 10px ${skill.color || theme.primary}40`
                                            }}
                                        />
                                    </div>
                                    {editingId === skill.id && (
                                        <input type="range" min="0" max="100" value={skill.level}
                                            onChange={(e) => handleUpdate(skill.id, 'level', parseInt(e.target.value))}
                                            style={{
                                                width: '100%', marginTop: '12px', accentColor: skill.color || theme.primary
                                            }}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div onClick={() => setShowAddModal(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
                            style={{
                                background: theme.surface, borderRadius: '20px', padding: '32px', maxWidth: '500px',
                                width: '90%', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <h3 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', marginBottom: '24px', fontFamily: theme.fontHeading }}>
                                Add New Skill
                            </h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                    Skill Name
                                </label>
                                <input type="text" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    placeholder="e.g., React, Leadership"
                                    style={{
                                        width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                        border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                        fontSize: '15px', outline: 'none'
                                    }}
                                />
                            </div>
                            {activeTab === 'technical' && (
                                <>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                            Icon
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                            {iconOptions.map(option => (
                                                <button key={option.value} type="button"
                                                    onClick={() => setNewSkill({ ...newSkill, icon: option.value, color: option.color })}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px',
                                                        background: newSkill.icon === option.value ? `${option.color}30` : `${theme.background}60`,
                                                        border: `2px solid ${newSkill.icon === option.value ? option.color : theme.border}`,
                                                        cursor: 'pointer', fontSize: '20px', color: option.color,
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <i className={option.value}></i>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                            Category
                                        </label>
                                        <select value={newSkill.category} onChange={(e) => {
                                            const cat = categoryOptions.find(c => c.value === e.target.value);
                                            setNewSkill({ ...newSkill, category: e.target.value, color: cat?.color || theme.primary });
                                        }}
                                            style={{
                                                width: '100%', padding: '12px 16px', background: `${theme.background}80`,
                                                border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text,
                                                fontSize: '15px', outline: 'none', cursor: 'pointer'
                                            }}
                                        >
                                            {categoryOptions.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.value}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                                    Level: {newSkill.level}%
                                </label>
                                <input type="range" min="0" max="100" value={newSkill.level}
                                    onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: newSkill.color }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={handleAddSkill} style={{
                                    flex: 1, padding: '14px', background: theme.gradient, border: 'none',
                                    borderRadius: '10px', color: theme.background, fontSize: '16px', fontWeight: '700',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}>
                                    <Check size={18} /> Add Skill
                                </button>
                                <button onClick={() => setShowAddModal(false)} style={{
                                    padding: '14px 24px', background: `${theme.surface}80`, border: `1px solid ${theme.border}`,
                                    borderRadius: '10px', color: theme.text, fontSize: '16px', fontWeight: '600', cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SkillsEditorEnhanced;
