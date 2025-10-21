import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, Video, File, Trash2, Download, Eye, FolderPlus, Search, Grid, List, X, Check, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const MediaManager = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error } = useNotifications();
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [mediaFiles, setMediaFiles] = useState([
        { id: 1, name: 'project-screenshot.png', type: 'image', size: '2.4 MB', uploadDate: '2024-01-15' },
        { id: 2, name: 'demo-video.mp4', type: 'video', size: '15.8 MB', uploadDate: '2024-01-14' },
        { id: 3, name: 'resume.pdf', type: 'document', size: '0.5 MB', uploadDate: '2024-01-10' }
    ]);

    const folders = [
        { id: 1, name: 'Projects', fileCount: 12, color: theme.primary },
        { id: 2, name: 'Profile Images', fileCount: 5, color: '#3b82f6' },
        { id: 3, name: 'Documents', fileCount: 8, color: '#f59e0b' },
        { id: 4, name: 'Videos', fileCount: 3, color: '#10b981' }
    ];

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px' }}>
                    <div style={{ textAlign: 'center', padding: '40px', background: `${theme.surface}90`, borderRadius: '16px', border: `1px solid rgba(239, 68, 68, 0.3)`, maxWidth: '500px' }}>
                        <Lock size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444', marginBottom: '12px', fontFamily: theme.fontHeading }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>Media Manager is only available to the owner.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const getFileIcon = (type) => {
        switch (type) {
            case 'image': return <Image size={24} style={{ color: '#3b82f6' }} />;
            case 'video': return <Video size={24} style={{ color: '#a855f7' }} />;
            case 'document': return <File size={24} style={{ color: '#10b981' }} />;
            default: return <File size={24} style={{ color: theme.textSecondary }} />;
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const newFile = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                uploadDate: new Date().toISOString().split('T')[0]
            };
            setMediaFiles(prev => [newFile, ...prev]);
        });
        success(`Uploaded ${files.length} file(s)`);
        setShowUploadModal(false);
    };

    const handleDelete = (id) => {
        setMediaFiles(prev => prev.filter(f => f.id !== id));
        success('File deleted');
    };

    const filteredMedia = mediaFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || file.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const totalSize = mediaFiles.reduce((acc, file) => acc + parseFloat(file.size), 0);

    return (
        <DashboardLayout
            title="Media Manager"
            subtitle="Manage your portfolio images, videos, and documents"
            actions={
                <button onClick={() => setShowUploadModal(true)} style={{
                    padding: '12px 24px', background: theme.gradient, color: theme.background,
                    borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                    boxShadow: `0 4px 15px ${theme.primary}40`, transition: 'all 0.3s ease'
                }}>
                    <Upload size={18} /> Upload Files
                </button>
            }
        >
            <div style={{ padding: '24px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Files', value: mediaFiles.length, icon: File, color: theme.primary },
                        { label: 'Images', value: mediaFiles.filter(f => f.type === 'image').length, icon: Image, color: '#3b82f6' },
                        { label: 'Videos', value: mediaFiles.filter(f => f.type === 'video').length, icon: Video, color: '#a855f7' },
                        { label: 'Storage', value: totalSize.toFixed(1) + ' MB', icon: Upload, color: '#10b981' }
                    ].map((stat, i) => (
                        <div key={i} style={{ background: `${theme.surface}80`, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(10px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
                                    <h3 style={{ fontSize: '32px', fontWeight: '700', color: stat.color, margin: 0 }}>{stat.value}</h3>
                                </div>
                                <stat.icon size={40} style={{ color: `${stat.color}80` }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Folders */}
                <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px', fontFamily: theme.fontHeading }}>Folders</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {folders.map(folder => (
                        <motion.div key={folder.id} whileHover={{ scale: 1.02 }} style={{
                            background: `${theme.surface}80`, borderRadius: '12px', padding: '20px',
                            border: `1px solid ${theme.border}`, cursor: 'pointer', backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${folder.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FolderPlus size={24} style={{ color: folder.color }} />
                                </div>
                                <div>
                                    <h4 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', margin: 0 }}>{folder.name}</h4>
                                    <p style={{ color: theme.textSecondary, fontSize: '12px', margin: 0 }}>{folder.fileCount} files</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Toolbar */}
                <div style={{ background: `${theme.surface}80`, borderRadius: '12px', padding: '16px', marginBottom: '24px', border: `1px solid ${theme.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                        <input type="text" placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px 10px 40px', background: `${theme.background}80`, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none' }}
                        />
                    </div>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: '10px 16px', background: `${theme.background}80`, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All Files</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="document">Documents</option>
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setViewMode('grid')} style={{
                            padding: '10px', background: viewMode === 'grid' ? theme.gradient : `${theme.primary}15`,
                            border: 'none', borderRadius: '8px', color: viewMode === 'grid' ? theme.background : theme.primary, cursor: 'pointer'
                        }}>
                            <Grid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} style={{
                            padding: '10px', background: viewMode === 'list' ? theme.gradient : `${theme.primary}15`,
                            border: 'none', borderRadius: '8px', color: viewMode === 'list' ? theme.background : theme.primary, cursor: 'pointer'
                        }}>
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Files Display */}
                {viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {filteredMedia.map(file => (
                            <motion.div key={file.id} whileHover={{ y: -4 }} style={{
                                background: `${theme.surface}80`, borderRadius: '12px', border: `1px solid ${theme.border}`,
                                overflow: 'hidden', cursor: 'pointer', backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ height: '160px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {getFileIcon(file.type)}
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <h4 style={{ color: theme.text, fontSize: '15px', fontWeight: '600', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: theme.textSecondary, marginBottom: '12px' }}>
                                        <span>{file.size}</span>
                                        <span>{file.uploadDate}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ flex: 1, padding: '8px', background: `${theme.primary}15`, border: 'none', borderRadius: '6px', color: theme.primary, cursor: 'pointer' }}>
                                            <Eye size={16} />
                                        </button>
                                        <button style={{ flex: 1, padding: '8px', background: `${theme.primary}15`, border: 'none', borderRadius: '6px', color: theme.primary, cursor: 'pointer' }}>
                                            <Download size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(file.id)} style={{ flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: `${theme.surface}80`, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                        {filteredMedia.map((file, index) => (
                            <div key={file.id} style={{
                                padding: '16px', borderBottom: index < filteredMedia.length - 1 ? `1px solid ${theme.border}` : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${theme.background}20`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getFileIcon(file.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ color: theme.text, fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>{file.name}</h4>
                                        <p style={{ color: theme.textSecondary, fontSize: '13px', margin: 0 }}>{file.size} • {file.uploadDate}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={{ padding: '8px', background: `${theme.primary}15`, border: 'none', borderRadius: '6px', color: theme.primary, cursor: 'pointer' }}><Eye size={16} /></button>
                                    <button style={{ padding: '8px', background: `${theme.primary}15`, border: 'none', borderRadius: '6px', color: theme.primary, cursor: 'pointer' }}><Download size={16} /></button>
                                    <button onClick={() => handleDelete(file.id)} style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div onClick={() => setShowUploadModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
                            style={{ background: theme.surface, borderRadius: '20px', padding: '32px', maxWidth: '500px', width: '90%', border: `1px solid ${theme.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ color: theme.text, fontSize: '24px', fontWeight: '700', margin: 0, fontFamily: theme.fontHeading }}>Upload Files</h3>
                                <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ border: `2px dashed ${theme.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer', background: `${theme.primary}05` }}>
                                <input type="file" multiple onChange={handleFileUpload} id="file-upload" style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx" />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    <Upload size={48} style={{ color: theme.primary, margin: '0 auto 16px' }} />
                                    <p style={{ color: theme.text, fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>Click to upload or drag and drop</p>
                                    <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>Images, videos, or documents up to 50MB</p>
                                </label>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MediaManager;
