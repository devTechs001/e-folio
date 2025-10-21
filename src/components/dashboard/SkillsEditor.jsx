import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, Save, X, Code, Briefcase, TrendingUp, Award, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../NotificationSystem';

const SkillsEditor = () => {
    const { canEdit, isOwner } = useAuth();
    const { success, error } = useNotifications();
    const [technicalSkills, setTechnicalSkills] = useState([]);
    const [professionalSkills, setProfessionalSkills] = useState([]);
    const [showAddTechnical, setShowAddTechnical] = useState(false);
    const [showAddProfessional, setShowAddProfessional] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);

    // Initialize with existing skills
    useEffect(() => {
        const initialTechnical = [
            { id: 1, name: "HTML5", level: 90, icon: "fa-brands fa-html5", category: "frontend" },
            { id: 2, name: "CSS3", level: 85, icon: "fa-brands fa-css3-alt", category: "frontend" },
            { id: 3, name: "JavaScript", level: 80, icon: "fa-brands fa-js", category: "frontend" },
            { id: 4, name: "React", level: 75, icon: "fa-brands fa-react", category: "frontend" },
            { id: 5, name: "Python", level: 70, icon: "fa-brands fa-python", category: "backend" },
            { id: 6, name: "Node.js", level: 65, icon: "fa-brands fa-node-js", category: "backend" },
            { id: 7, name: "Git", level: 85, icon: "fa-brands fa-git-alt", category: "tools" },
            { id: 8, name: "Database", level: 60, icon: "fa-solid fa-database", category: "backend" }
        ];

        const initialProfessional = [
            { id: 1, name: "Problem Solving", level: 90 },
            { id: 2, name: "Creativity", level: 85 },
            { id: 3, name: "Team Work", level: 95 },
            { id: 4, name: "Communication", level: 85 }
        ];

        setTechnicalSkills(initialTechnical);
        setProfessionalSkills(initialProfessional);
    }, []);

    const [newTechnicalSkill, setNewTechnicalSkill] = useState({
        name: '',
        level: 50,
        icon: 'fa-solid fa-code',
        category: 'frontend'
    });

    const [newProfessionalSkill, setNewProfessionalSkill] = useState({
        name: '',
        level: 50
    });

    const categories = [
        { value: 'frontend', label: 'Frontend', color: '#0ef' },
        { value: 'backend', label: 'Backend', color: '#00d4ff' },
        { value: 'tools', label: 'Tools', color: '#0ef' },
        { value: 'database', label: 'Database', color: '#00d4ff' },
        { value: 'other', label: 'Other', color: '#888' }
    ];

    const iconOptions = [
        'fa-brands fa-html5', 'fa-brands fa-css3-alt', 'fa-brands fa-js',
        'fa-brands fa-react', 'fa-brands fa-vue', 'fa-brands fa-angular',
        'fa-brands fa-python', 'fa-brands fa-java', 'fa-brands fa-php',
        'fa-brands fa-node-js', 'fa-solid fa-database', 'fa-brands fa-git-alt',
        'fa-solid fa-code', 'fa-solid fa-cogs', 'fa-solid fa-server'
    ];

    const handleAddTechnicalSkill = () => {
        if (!canEdit() || !newTechnicalSkill.name.trim()) {
            error('Please enter a skill name');
            return;
        }

        const skill = {
            ...newTechnicalSkill,
            id: Date.now(),
            name: newTechnicalSkill.name.trim()
        };

        setTechnicalSkills([...technicalSkills, skill]);
        setNewTechnicalSkill({
            name: '',
            level: 50,
            icon: 'fa-solid fa-code',
            category: 'frontend'
        });
        setShowAddTechnical(false);
        success(`Added ${skill.name} to technical skills`);
    };

    const handleAddProfessionalSkill = () => {
        if (!canEdit() || !newProfessionalSkill.name.trim()) return;

        const skill = {
            ...newProfessionalSkill,
            id: Date.now(),
            name: newProfessionalSkill.name.trim()
        };

        setProfessionalSkills([...professionalSkills, skill]);
        setNewProfessionalSkill({
            name: '',
            level: 50
        });
        setShowAddProfessional(false);
    };

    const handleUpdateTechnicalSkill = (id, field, value) => {
        if (!canEdit()) return;
        setTechnicalSkills(technicalSkills.map(skill =>
            skill.id === id ? { ...skill, [field]: value } : skill
        ));
    };

    const handleUpdateProfessionalSkill = (id, field, value) => {
        if (!canEdit()) return;
        setProfessionalSkills(professionalSkills.map(skill =>
            skill.id === id ? { ...skill, [field]: value } : skill
        ));
    };

    const handleDeleteTechnicalSkill = (id) => {
        if (!isOwner()) return;
        const skill = technicalSkills.find(s => s.id === id);
        setTechnicalSkills(technicalSkills.filter(skill => skill.id !== id));
        success(`Deleted ${skill?.name || 'skill'}`);
    };

    const handleDeleteProfessionalSkill = (id) => {
        if (!isOwner()) return;
        const skill = professionalSkills.find(s => s.id === id);
        setProfessionalSkills(professionalSkills.filter(skill => skill.id !== id));
        success(`Deleted ${skill?.name || 'skill'}`);
    };

    if (!isOwner()) {
        return (
            <div className="flex items-center justify-center h-screen bg-dark-500">
                <div className="text-center p-8 bg-dark-600 rounded-lg border border-red-500/20">
                    <Award className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Access Restricted</h2>
                    <p className="text-gray-300">Skills management is only available to the portfolio owner.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-500 p-6">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-primary-500 mb-2 flex items-center gap-3">
                    <Code className="w-8 h-8" />
                    Skills Management
                </h1>
                <p className="text-gray-400">
                    Showcase your technical expertise and professional competencies
                </p>
            </motion.div>

            {/* Technical Skills Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-dark-600 rounded-lg p-6 mb-6 border border-primary-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary-500 flex items-center gap-2">
                        <Zap className="w-6 h-6" />
                        Technical Skills
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddTechnical(true)}
                        className="px-4 py-2 bg-primary-500 text-dark-500 rounded-lg font-medium hover:bg-primary-400 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Skill
                    </motion.button>
                </div>

                <div className="skills-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {technicalSkills.map(skill => (
                        <div key={skill.id} className="skill-card" style={{
                            background: 'rgba(0, 239, 255, 0.05)',
                            border: '1px solid rgba(0, 239, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '20px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '15px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <i className={skill.icon} style={{
                                        fontSize: '24px',
                                        color: categories.find(c => c.value === skill.category)?.color || '#0ef',
                                        marginRight: '10px'
                                    }}></i>
                                    {canEdit() ? (
                                        <input
                                            type="text"
                                            value={skill.name}
                                            onChange={(e) => handleUpdateTechnicalSkill(skill.id, 'name', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ededed',
                                                fontSize: '16px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <span style={{ color: '#ededed', fontSize: '16px', fontWeight: 'bold' }}>
                                            {skill.name}
                                        </span>
                                    )}
                                </div>
                                
                                {isOwner() && (
                                    <button
                                        onClick={() => handleDeleteTechnicalSkill(skill.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#ff4444',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <span style={{
                                    background: categories.find(c => c.value === skill.category)?.color || '#0ef',
                                    color: '#081b29',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {categories.find(c => c.value === skill.category)?.label || skill.category}
                                </span>
                            </div>

                            <div className="progress-container" style={{ marginBottom: '10px' }}>
                                <div style={{
                                    background: 'rgba(0, 239, 255, 0.2)',
                                    borderRadius: '10px',
                                    height: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                                        height: '100%',
                                        width: `${skill.level}%`,
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                            </div>

                            {canEdit() ? (
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skill.level}
                                    onChange={(e) => handleUpdateTechnicalSkill(skill.id, 'level', parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        marginBottom: '10px'
                                    }}
                                />
                            ) : null}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ color: '#0ef', fontWeight: 'bold' }}>
                                    {skill.level}%
                                </span>
                                {canEdit() && (
                                    <select
                                        value={skill.category}
                                        onChange={(e) => handleUpdateTechnicalSkill(skill.id, 'category', e.target.value)}
                                        style={{
                                            background: '#081b29',
                                            border: '1px solid #0ef',
                                            color: '#ededed',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Professional Skills Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-600 rounded-lg p-6 border border-primary-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary-500 flex items-center gap-2">
                        <Briefcase className="w-6 h-6" />
                        Professional Skills
                    </h2>
                    {canEdit() && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddProfessional(true)}
                            style={{
                                background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                                color: '#081b29',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                            className="px-4 py-2 bg-primary-500 text-dark-500 rounded-lg font-medium hover:bg-primary-400 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Skill
                        </motion.button>
                    )}
                </div>

                <div className="professional-skills-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {professionalSkills.map(skill => (
                        <div key={skill.id} className="professional-skill-card" style={{
                            background: 'rgba(0, 239, 255, 0.05)',
                            border: '1px solid rgba(0, 239, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div className="radial-progress" style={{
                                width: '100px',
                                height: '100px',
                                margin: '0 auto 15px',
                                position: 'relative'
                            }}>
                                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="rgba(0, 239, 255, 0.2)"
                                        strokeWidth="8"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="#0ef"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - skill.level / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: '#0ef',
                                    fontWeight: 'bold',
                                    fontSize: '16px'
                                }}>
                                    {skill.level}%
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '10px'
                            }}>
                                {canEdit() ? (
                                    <input
                                        type="text"
                                        value={skill.name}
                                        onChange={(e) => handleUpdateProfessionalSkill(skill.id, 'name', e.target.value)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#ededed',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            width: '100%'
                                        }}
                                    />
                                ) : (
                                    <span style={{ color: '#ededed', fontSize: '14px', fontWeight: 'bold' }}>
                                        {skill.name}
                                    </span>
                                )}
                                
                                {isOwner() && (
                                    <button
                                        onClick={() => handleDeleteProfessionalSkill(skill.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#ff4444',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                            </div>

                            {canEdit() && (
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skill.level}
                                    onChange={(e) => handleUpdateProfessionalSkill(skill.id, 'level', parseInt(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Add Technical Skill Modal */}
            {showAddTechnical && canEdit() && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#081b29',
                        border: '2px solid #0ef',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Add Technical Skill</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Skill Name
                            </label>
                            <input
                                type="text"
                                value={newTechnicalSkill.name}
                                onChange={(e) => setNewTechnicalSkill({...newTechnicalSkill, name: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Proficiency Level: {newTechnicalSkill.level}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={newTechnicalSkill.level}
                                onChange={(e) => setNewTechnicalSkill({...newTechnicalSkill, level: parseInt(e.target.value)})}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Category
                            </label>
                            <select
                                value={newTechnicalSkill.category}
                                onChange={(e) => setNewTechnicalSkill({...newTechnicalSkill, category: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: '#081b29',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Icon
                            </label>
                            <select
                                value={newTechnicalSkill.icon}
                                onChange={(e) => setNewTechnicalSkill({...newTechnicalSkill, icon: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: '#081b29',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            >
                                {iconOptions.map(icon => (
                                    <option key={icon} value={icon}>
                                        {icon.split(' ').pop().replace('fa-', '')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowAddTechnical(false)}
                                style={{
                                    background: 'transparent',
                                    border: '2px solid #888',
                                    color: '#888',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTechnicalSkill}
                                style={{
                                    background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                                    color: '#081b29',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Add Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Professional Skill Modal */}
            {showAddProfessional && canEdit() && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#081b29',
                        border: '2px solid #0ef',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ color: '#0ef', marginBottom: '20px' }}>Add Professional Skill</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Skill Name
                            </label>
                            <input
                                type="text"
                                value={newProfessionalSkill.name}
                                onChange={(e) => setNewProfessionalSkill({...newProfessionalSkill, name: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '5px',
                                    color: '#ededed'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '5px' }}>
                                Proficiency Level: {newProfessionalSkill.level}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={newProfessionalSkill.level}
                                onChange={(e) => setNewProfessionalSkill({...newProfessionalSkill, level: parseInt(e.target.value)})}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowAddProfessional(false)}
                                style={{
                                    background: 'transparent',
                                    border: '2px solid #888',
                                    color: '#888',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProfessionalSkill}
                                style={{
                                    background: 'linear-gradient(45deg, #0ef, #00d4ff)',
                                    color: '#081b29',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Add Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsEditor;
