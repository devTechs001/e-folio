import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, Image, Video, File, Trash2, Download, Eye, 
    FolderPlus, Search, Filter, Grid, List, X, Check, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const MediaManager = () => {
    const { isOwner } = useAuth();
    const { theme } = useTheme();
    const { success, error, info } = useNotifications();
    
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, images, videos, documents
    const [uploadProgress, setUploadProgress] = useState({});
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    const [mediaFiles, setMediaFiles] = useState([
        {
            id: 1,
            name: 'project-screenshot-1.png',
            type: 'image',
            size: '2.4 MB',
            url: '/assets/images/project1.jpg',
            uploadDate: '2024-01-15',
            usedIn: ['Projects', 'Portfolio'],
            thumbnail: '/assets/images/project1.jpg'
        },
        {
            id: 2,
            name: 'demo-video.mp4',
            type: 'video',
            size: '15.8 MB',
            url: '/assets/videos/demo.mp4',
            uploadDate: '2024-01-14',
            usedIn: ['Projects'],
            thumbnail: '/assets/images/video-thumb.jpg'
        },
        {
            id: 3,
            name: 'resume.pdf',
            type: 'document',
            size: '0.5 MB',
            url: '/assets/documents/resume.pdf',
            uploadDate: '2024-01-10',
            usedIn: ['About'],
            thumbnail: null
        },
        {
            id: 4,
            name: 'profile-picture.jpg',
            type: 'image',
            size: '1.2 MB',
            url: '/assets/images/profile.jpg',
            uploadDate: '2024-01-05',
            usedIn: ['Header', 'About'],
            thumbnail: '/assets/images/profile.jpg'
        }
    ]);

    const [folders, setFolders] = useState([
        { id: 1, name: 'Projects', fileCount: 12, color: '#00efff' },
        { id: 2, name: 'Profile Images', fileCount: 5, color: '#00d4ff' },
        { id: 3, name: 'Documents', fileCount: 8, color: '#f97316' },
        { id: 4, name: 'Videos', fileCount: 3, color: '#10b981' }
    ]);

    // Access control
    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '40px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        background: `${theme.surface}90`,
                        borderRadius: '16px',
                        border: `1px solid rgba(239, 68, 68, 0.3)`,
                        maxWidth: '500px'
                    }}>
                        <Lock size={64} style={{ color: '#ef4444', margin: '0 auto 20px' }} />
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ef4444',
                            marginBottom: '12px',
                            fontFamily: theme.fontHeading
                        }}>Access Restricted</h2>
                        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
                            Media Manager is only available to the owner.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const getFileIcon = (type) => {
        switch (type) {
            case 'image':
                return <Image className="w-5 h-5 text-blue-400" />;
            case 'video':
                return <Video className="w-5 h-5 text-purple-400" />;
            case 'document':
                return <File className="w-5 h-5 text-green-400" />;
            default:
                return <File className="w-5 h-5 text-gray-400" />;
        }
    };

    const handleFileSelect = (fileId) => {
        setSelectedFiles(prev => 
            prev.includes(fileId) 
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const handleDeleteSelected = () => {
        if (selectedFiles.length === 0) return;
        
        setMediaFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
        success(`Deleted ${selectedFiles.length} file(s)`);
        setSelectedFiles([]);
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        
        files.forEach((file, index) => {
            const fileId = Date.now() + index;
            
            // Simulate upload progress
            setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
            
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    const currentProgress = prev[fileId] || 0;
                    if (currentProgress >= 100) {
                        clearInterval(interval);
                        
                        // Add file to media library
                        const newFile = {
                            id: fileId,
                            name: file.name,
                            type: file.type.startsWith('image/') ? 'image' : 
                                  file.type.startsWith('video/') ? 'video' : 'document',
                            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                            url: URL.createObjectURL(file),
                            uploadDate: new Date().toISOString().split('T')[0],
                            usedIn: [],
                            thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                        };
                        
                        setMediaFiles(prev => [newFile, ...prev]);
                        success(`Uploaded ${file.name}`);
                        
                        return prev;
                    }
                    
                    return { ...prev, [fileId]: currentProgress + 10 };
                });
            }, 200);
        });
        
        setShowUploadModal(false);
    };

    const filteredMedia = mediaFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || file.type === filterType.replace('s', '');
        return matchesSearch && matchesFilter;
    });

    const totalSize = mediaFiles.reduce((acc, file) => {
        const size = parseFloat(file.size);
        return acc + size;
    }, 0);

    return (
        <DashboardLayout
            title="Media Manager"
            subtitle="Manage your portfolio images, videos, and documents"
            actions={
                <button
                    onClick={() => setShowUploadModal(true)}
                    style={{
                        padding: '12px 24px',
                        background: theme.gradient,
                        color: theme.background,
                        borderRadius: '10px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 4px 15px ${theme.primary}40`
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px ${theme.primary}60`;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 15px ${theme.primary}40`;
                    }}
                >
                    <Upload size={18} />
                    <span>Upload Files</span>
                </button>
            }
        >
        <div style={{ padding: '24px' }}>
            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div style={{
                    background: `${theme.surface}60`,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${theme.border}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Total Files</p>
                            <p style={{ fontSize: '32px', fontWeight: '700', color: theme.primary }}>{mediaFiles.length}</p>
                        </div>
                        <File size={40} style={{ color: `${theme.primary}80` }} />
                    </div>
                </div>
                
                <div style={{
                    background: `${theme.surface}60`,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${theme.border}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Images</p>
                            <p style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
                                {mediaFiles.filter(f => f.type === 'image').length}
                            </p>
                        </div>
                        <Image size={40} style={{ color: '#3b82f680' }} />
                    </div>
                </div>
                
                <div style={{
                    background: `${theme.surface}60`,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${theme.border}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Videos</p>
                            <p style={{ fontSize: '32px', fontWeight: '700', color: '#a855f7' }}>
                                {mediaFiles.filter(f => f.type === 'video').length}
                            </p>
                        </div>
                        <Video size={40} style={{ color: '#a855f780' }} />
                    </div>
                </div>
                
                <div style={{
                    background: `${theme.surface}60`,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${theme.border}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>Storage Used</p>
                            <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{totalSize.toFixed(1)} MB</p>
                        </div>
                        <Upload size={40} style={{ color: '#10b98180' }} />
                    </div>
                </div>
            </div>

            {/* Folders */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Folders</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.map(folder => (
                        <motion.div
                            key={folder.id}
                            className="bg-dark-600 rounded-lg p-4 border border-primary-500/20 cursor-pointer hover:border-primary-500/50 transition-all"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: folder.color + '20' }}
                                >
                                    <FolderPlus className="w-6 h-6" style={{ color: folder.color }} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-200">{folder.name}</p>
                                    <p className="text-xs text-gray-400">{folder.fileCount} files</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-dark-600 rounded-lg p-4 mb-4 border border-primary-500/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-primary-500 text-dark-500 rounded-lg font-medium hover:bg-primary-400 transition-colors flex items-center space-x-2"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Upload Files</span>
                        </button>
                        
                        {selectedFiles.length > 0 && (
                            <>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors flex items-center space-x-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete ({selectedFiles.length})</span>
                                </button>
                                
                                <button
                                    onClick={() => setSelectedFiles([])}
                                    className="px-4 py-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-300 transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-dark-400 border border-primary-500/20 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-dark-400 border border-primary-500/20 rounded-lg text-gray-100 focus:outline-none focus:border-primary-500"
                        >
                            <option value="all">All Files</option>
                            <option value="images">Images</option>
                            <option value="videos">Videos</option>
                            <option value="documents">Documents</option>
                        </select>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-500 text-dark-500' : 'bg-dark-400 text-gray-400'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-500 text-dark-500' : 'bg-dark-400 text-gray-400'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="bg-dark-600 rounded-lg p-4 mb-4 border border-primary-500/20">
                    <h4 className="font-medium text-gray-200 mb-3">Uploading Files...</h4>
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                        <div key={fileId} className="mb-2">
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>File {fileId}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-dark-400 rounded-full h-2">
                                <div 
                                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Media Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filteredMedia.map(file => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-dark-600 rounded-lg border ${
                                    selectedFiles.includes(file.id) 
                                        ? 'border-primary-500' 
                                        : 'border-primary-500/20'
                                } overflow-hidden cursor-pointer hover:border-primary-500/50 transition-all`}
                            >
                                <div 
                                    className="relative aspect-square bg-dark-400 flex items-center justify-center"
                                    onClick={() => handleFileSelect(file.id)}
                                >
                                    {file.thumbnail ? (
                                        <img 
                                            src={file.thumbnail} 
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        getFileIcon(file.type)
                                    )}
                                    
                                    {selectedFiles.includes(file.id) && (
                                        <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                                <Check className="w-5 h-5 text-dark-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-3">
                                    <p className="font-medium text-gray-200 text-sm truncate mb-1">{file.name}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{file.size}</span>
                                        <span>{file.uploadDate}</span>
                                    </div>
                                    {file.usedIn.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {file.usedIn.map(use => (
                                                <span key={use} className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs">
                                                    {use}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center space-x-2 mt-2">
                                        <button className="flex-1 p-1 bg-dark-400 hover:bg-dark-300 rounded text-gray-400 hover:text-primary-400 transition-colors">
                                            <Eye className="w-4 h-4 mx-auto" />
                                        </button>
                                        <button className="flex-1 p-1 bg-dark-400 hover:bg-dark-300 rounded text-gray-400 hover:text-green-400 transition-colors">
                                            <Download className="w-4 h-4 mx-auto" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMediaFiles(prev => prev.filter(f => f.id !== file.id));
                                                success('File deleted');
                                            }}
                                            className="flex-1 p-1 bg-dark-400 hover:bg-dark-300 rounded text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-dark-600 rounded-lg border border-primary-500/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-dark-400">
                            <tr>
                                <th className="text-left p-4 text-gray-300 font-medium">
                                    <input 
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFiles(filteredMedia.map(f => f.id));
                                            } else {
                                                setSelectedFiles([]);
                                            }
                                        }}
                                        className="rounded border-primary-500/20"
                                    />
                                </th>
                                <th className="text-left p-4 text-gray-300 font-medium">Name</th>
                                <th className="text-left p-4 text-gray-300 font-medium">Type</th>
                                <th className="text-left p-4 text-gray-300 font-medium">Size</th>
                                <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                                <th className="text-left p-4 text-gray-300 font-medium">Used In</th>
                                <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedia.map(file => (
                                <tr key={file.id} className="border-t border-primary-500/10 hover:bg-dark-400/50">
                                    <td className="p-4">
                                        <input 
                                            type="checkbox"
                                            checked={selectedFiles.includes(file.id)}
                                            onChange={() => handleFileSelect(file.id)}
                                            className="rounded border-primary-500/20"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            {file.thumbnail ? (
                                                <img src={file.thumbnail} alt={file.name} className="w-10 h-10 rounded object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-dark-400 rounded flex items-center justify-center">
                                                    {getFileIcon(file.type)}
                                                </div>
                                            )}
                                            <span className="text-gray-200">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400 capitalize">{file.type}</td>
                                    <td className="p-4 text-gray-400">{file.size}</td>
                                    <td className="p-4 text-gray-400">{file.uploadDate}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {file.usedIn.map(use => (
                                                <span key={use} className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs">
                                                    {use}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <button className="p-1 text-gray-400 hover:text-primary-400">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-green-400">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setMediaFiles(prev => prev.filter(f => f.id !== file.id));
                                                    success('File deleted');
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-dark-600 rounded-lg p-6 max-w-md w-full mx-4 border border-primary-500/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-primary-400">Upload Files</h3>
                                <button 
                                    onClick={() => setShowUploadModal(false)}
                                    className="text-gray-400 hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="border-2 border-dashed border-primary-500/30 rounded-lg p-8 text-center hover:border-primary-500/50 transition-all cursor-pointer">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                                    <p className="text-gray-200 mb-2">Click to upload or drag and drop</p>
                                    <p className="text-sm text-gray-400">
                                        Images, videos, or documents up to 50MB
                                    </p>
                                </label>
                            </div>
                            
                            <div className="mt-4 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 bg-dark-400 text-gray-300 rounded-lg hover:bg-dark-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </DashboardLayout>
    );
};

export default MediaManager;
