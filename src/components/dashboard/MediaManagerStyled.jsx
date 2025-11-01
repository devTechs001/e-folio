import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Image,
    Video,
    File,
    Trash2,
    Download,
    Eye,
    FolderPlus,
    Search,
    Grid,
    List,
    X,
    Check,
    Lock,
    Edit2,
    Copy,
    Share2,
    Link as LinkIcon,
    Folder,
    MoreVertical,
    Filter,
    SortAsc,
    FileText,
    Music,
    Archive,
    CheckSquare,
    Square,
    RefreshCw,
    Star,
    Clock,
    HardDrive,
    AlertCircle,
    Maximize2,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Crop,
    Sliders,
    ExternalLink,
    Move,
    Database,
    Cloud
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import apiService from '../../services/api.service';
import DashboardLayout from './DashboardLayout';
import { useDropzone } from 'react-dropzone';

const MediaManager = () => {
    const { isOwner, user } = useAuth();
    const { theme } = useTheme();
    const { success, error: showError, warning } = useNotifications();
    
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [mediaFiles, setMediaFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [storageInfo, setStorageInfo] = useState({
        used: 0,
        total: 10 * 1024, // 10GB in MB
        files: 0
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOwner()) {
            loadMediaData();
        }
    }, [isOwner, currentFolder]);

    const loadMediaData = async () => {
        try {
            setLoading(true);
            const [filesRes, foldersRes, storageRes] = await Promise.all([
                apiService.getMediaFiles(currentFolder),
                apiService.getFolders(),
                apiService.getStorageInfo()
            ]);

            if (filesRes.success) {
                setMediaFiles(filesRes.data);
            }
            if (foldersRes.success) {
                setFolders(foldersRes.data);
            }
            if (storageRes.success) {
                setStorageInfo(storageRes.data);
            }
        } catch (err) {
            console.error('Failed to load media:', err);
            showError('Failed to load media files');
        } finally {
            setLoading(false);
        }
    };

    const refreshMedia = async () => {
        setRefreshing(true);
        await loadMediaData();
        setRefreshing(false);
        success('Media refreshed');
    };

    // Dropzone configuration
    const onDrop = useCallback(async (acceptedFiles) => {
        await handleFileUpload(acceptedFiles);
    }, [currentFolder]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        multiple: true,
        maxSize: 50 * 1024 * 1024 // 50MB
    });

    const handleFileUpload = async (files) => {
        const formData = new FormData();
        
        files.forEach((file, index) => {
            formData.append('files', file);
        });

        if (currentFolder) {
            formData.append('folderId', currentFolder);
        }

        try {
            setShowUploadModal(false);
            
            // Track upload progress
            const uploadPromises = files.map(async (file, index) => {
                const individualFormData = new FormData();
                individualFormData.append('file', file);
                if (currentFolder) {
                    individualFormData.append('folderId', currentFolder);
                }

                return apiService.uploadFile(individualFormData, (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: percentCompleted
                    }));
                });
            });

            await Promise.all(uploadPromises);

            success(`Uploaded ${files.length} file(s) successfully`);
            setUploadProgress({});
            await loadMediaData();
        } catch (err) {
            console.error('Upload error:', err);
            showError('Failed to upload files');
            setUploadProgress({});
        }
    };

    const handleDelete = async (fileIds) => {
        if (!confirm(`Delete ${fileIds.length} file(s)?`)) return;

        try {
            const response = await apiService.deleteFiles(fileIds);
            if (response.success) {
                success('Files deleted successfully');
                setSelectedFiles([]);
                await loadMediaData();
            }
        } catch (err) {
            showError('Failed to delete files');
        }
    };

    const handleDownload = async (fileId) => {
        try {
            const response = await apiService.downloadFile(fileId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', response.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            showError('Failed to download file');
        }
    };

    const handlePreview = (file) => {
        setPreviewFile(file);
        setShowPreviewModal(true);
    };

    const handleCreateFolder = async (name, color) => {
        try {
            const response = await apiService.createFolder({
                name,
                color,
                parentId: currentFolder
            });

            if (response.success) {
                success('Folder created');
                setShowCreateFolderModal(false);
                await loadMediaData();
            }
        } catch (err) {
            showError('Failed to create folder');
        }
    };

    const handleRenameFile = async (fileId, newName) => {
        try {
            const response = await apiService.renameFile(fileId, newName);
            if (response.success) {
                success('File renamed');
                await loadMediaData();
            }
        } catch (err) {
            showError('Failed to rename file');
        }
    };

    const handleCopyLink = async (file) => {
        const link = file.url || `${window.location.origin}/media/${file._id}`;
        await navigator.clipboard.writeText(link);
        success('Link copied to clipboard');
    };

    const handleShareFile = async (fileId, settings) => {
        try {
            const response = await apiService.shareFile(fileId, settings);
            if (response.success) {
                success('File shared successfully');
                setShowShareModal(false);
            }
        } catch (err) {
            showError('Failed to share file');
        }
    };

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const selectAllFiles = () => {
        if (selectedFiles.length === filteredMedia.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredMedia.map(f => f._id));
        }
    };

    const getFileIcon = (type, mimeType) => {
        if (type === 'image' || mimeType?.startsWith('image/')) {
            return <Image size={24} className="text-blue-400" />;
        } else if (type === 'video' || mimeType?.startsWith('video/')) {
            return <Video size={24} className="text-purple-400" />;
        } else if (type === 'audio' || mimeType?.startsWith('audio/')) {
            return <Music size={24} className="text-green-400" />;
        } else if (mimeType?.includes('pdf')) {
            return <FileText size={24} className="text-red-400" />;
        } else if (mimeType?.includes('zip') || mimeType?.includes('rar')) {
            return <Archive size={24} className="text-yellow-400" />;
        }
        return <File size={24} className="text-slate-400" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const filteredMedia = mediaFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || file.type === filterType;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'size':
                return (b.size || 0) - (a.size || 0);
            case 'date':
            default:
                return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        }
    });

    const storagePercentage = (storageInfo.used / storageInfo.total) * 100;

    if (!isOwner()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh] p-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-12 bg-red-500/10 border-2 border-red-500/50 rounded-2xl max-w-md"
                    >
                        <Lock size={64} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-red-400 mb-4">Access Restricted</h2>
                        <p className="text-slate-400">Media Manager is only available to the owner.</p>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading media...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Media Manager"
            subtitle="Manage your portfolio images, videos, and documents"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshMedia}
                        disabled={refreshing}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
                    >
                        <Upload size={18} />
                        Upload Files
                    </button>
                </div>
            }
        >
            <div className="p-6" {...getRootProps()}>
                <input {...getInputProps()} />
                
                {/* Drag overlay */}
                <AnimatePresence>
                    {isDragActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-cyan-500/20 backdrop-blur-sm z-50 flex items-center justify-center"
                        >
                            <div className="bg-slate-800 border-2 border-dashed border-cyan-500 rounded-2xl p-12 text-center">
                                <Upload size={64} className="text-cyan-400 mx-auto mb-4" />
                                <p className="text-2xl font-bold text-white mb-2">Drop files here</p>
                                <p className="text-slate-400">Release to upload</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Storage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: 'Total Files',
                            value: storageInfo.files,
                            icon: File,
                            color: 'cyan',
                            bgColor: 'bg-cyan-500/20',
                            textColor: 'text-cyan-400'
                        },
                        {
                            label: 'Images',
                            value: mediaFiles.filter(f => f.type === 'image').length,
                            icon: Image,
                            color: 'blue',
                            bgColor: 'bg-blue-500/20',
                            textColor: 'text-blue-400'
                        },
                        {
                            label: 'Videos',
                            value: mediaFiles.filter(f => f.type === 'video').length,
                            icon: Video,
                            color: 'purple',
                            bgColor: 'bg-purple-500/20',
                            textColor: 'text-purple-400'
                        },
                        {
                            label: 'Storage Used',
                            value: formatFileSize(storageInfo.used * 1024 * 1024),
                            icon: HardDrive,
                            color: 'green',
                            bgColor: 'bg-green-500/20',
                            textColor: 'text-green-400'
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <stat.icon size={24} className={stat.textColor} />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                            <h3 className={`text-3xl font-bold ${stat.textColor}`}>
                                {stat.value}
                            </h3>
                        </motion.div>
                    ))}
                </div>

                {/* Storage Quota */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-1">Storage Quota</h3>
                            <p className="text-slate-400 text-sm">
                                {formatFileSize(storageInfo.used * 1024 * 1024)} of {formatFileSize(storageInfo.total * 1024 * 1024)} used
                            </p>
                        </div>
                        <span className="text-2xl font-bold text-cyan-400">
                            {storagePercentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${storagePercentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                                storagePercentage > 90
                                    ? 'bg-red-500'
                                    : storagePercentage > 75
                                    ? 'bg-yellow-500'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                        />
                    </div>
                    {storagePercentage > 90 && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-400" />
                            <p className="text-red-400 text-sm">Storage almost full. Consider deleting unused files.</p>
                        </div>
                    )}
                </div>

                {/* Folders */}
                {folders.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">Folders</h3>
                            <button
                                onClick={() => setShowCreateFolderModal(true)}
                                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                            >
                                <FolderPlus size={18} />
                                New Folder
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                            {currentFolder && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setCurrentFolder(null)}
                                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Folder size={32} className="text-slate-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">..</p>
                                            <p className="text-slate-500 text-xs">Back</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {folders.map((folder) => (
                                <motion.div
                                    key={folder._id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setCurrentFolder(folder._id)}
                                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Folder size={32} style={{ color: folder.color || '#06b6d4' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{folder.name}</p>
                                            <p className="text-slate-400 text-xs">{folder.fileCount || 0} files</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}

                {/* Toolbar */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[250px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All Files</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="document">Documents</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="date">Date</option>
                            <option value="name">Name</option>
                            <option value="size">Size</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {/* Bulk Actions */}
                        {selectedFiles.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">
                                    {selectedFiles.length} selected
                                </span>
                                <button
                                    onClick={() => handleDelete(selectedFiles)}
                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Select All */}
                    {filteredMedia.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <button
                                onClick={selectAllFiles}
                                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {selectedFiles.length === filteredMedia.length ? (
                                    <CheckSquare size={16} />
                                ) : (
                                    <Square size={16} />
                                )}
                                Select All ({filteredMedia.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Files Display */}
                {filteredMedia.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Database size={64} className="text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Files Found</h3>
                            <p className="text-slate-500 mb-6">
                                {searchQuery ? 'Try adjusting your search' : 'Upload your first file to get started'}
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto"
                            >
                                <Upload size={18} />
                                Upload Files
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredMedia.map((file) => (
                            <FileCard
                                key={file._id}
                                file={file}
                                selected={selectedFiles.includes(file._id)}
                                onSelect={() => toggleFileSelection(file._id)}
                                onPreview={() => handlePreview(file)}
                                onDownload={() => handleDownload(file._id)}
                                onDelete={() => handleDelete([file._id])}
                                onCopyLink={() => handleCopyLink(file)}
                                getFileIcon={getFileIcon}
                                formatFileSize={formatFileSize}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="w-12 px-4 py-3 text-left">
                                        <button onClick={selectAllFiles}>
                                            {selectedFiles.length === filteredMedia.length ? (
                                                <CheckSquare size={18} className="text-cyan-400" />
                                            ) : (
                                                <Square size={18} className="text-slate-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Name</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Size</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Type</th>
                                    <th className="px-4 py-3 text-left text-slate-400 text-sm font-semibold">Modified</th>
                                    <th className="px-4 py-3 text-right text-slate-400 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedia.map((file, index) => (
                                    <tr
                                        key={file._id}
                                        className={`border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors ${
                                            selectedFiles.includes(file._id) ? 'bg-cyan-500/10' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-4">
                                            <button onClick={() => toggleFileSelection(file._id)}>
                                                {selectedFiles.includes(file._id) ? (
                                                    <CheckSquare size={18} className="text-cyan-400" />
                                                ) : (
                                                    <Square size={18} className="text-slate-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(file.type, file.mimeType)}
                                                <span className="text-white font-medium truncate">{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-400">{formatFileSize(file.size)}</td>
                                        <td className="px-4 py-4 text-slate-400 capitalize">{file.type}</td>
                                        <td className="px-4 py-4 text-slate-400">
                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handlePreview(file)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye size={16} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(file._id)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleCopyLink(file)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <LinkIcon size={16} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete([file._id])}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} className="text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Upload Progress */}
                <AnimatePresence>
                    {Object.keys(uploadProgress).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 right-6 w-96 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50"
                        >
                            <h4 className="text-white font-semibold mb-4">Uploading Files</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {Object.entries(uploadProgress).map(([filename, progress]) => (
                                    <div key={filename}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-slate-300 truncate">{filename}</span>
                                            <span className="text-sm text-cyan-400 font-semibold">{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload Modal */}
                <AnimatePresence>
                    {showUploadModal && (
                        <UploadModal
                            onClose={() => setShowUploadModal(false)}
                            onUpload={handleFileUpload}
                            theme={theme}
                        />
                    )}
                </AnimatePresence>

                {/* Preview Modal */}
                <AnimatePresence>
                    {showPreviewModal && previewFile && (
                        <PreviewModal
                            file={previewFile}
                            onClose={() => {
                                setShowPreviewModal(false);
                                setPreviewFile(null);
                            }}
                            theme={theme}
                        />
                    )}
                </AnimatePresence>

                {/* Create Folder Modal */}
                <AnimatePresence>
                    {showCreateFolderModal && (
                        <CreateFolderModal
                            onClose={() => setShowCreateFolderModal(false)}
                            onCreate={handleCreateFolder}
                            theme={theme}
                        />
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(100, 116, 139, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
            `}</style>
        </DashboardLayout>
    );
};

// File Card Component
const FileCard = ({ file, selected, onSelect, onPreview, onDownload, onDelete, onCopyLink, getFileIcon, formatFileSize }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border overflow-hidden cursor-pointer transition-all ${
                selected ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-slate-700/50 hover:border-cyan-500/50'
            }`}
        >
            {/* Thumbnail */}
            <div
                className="h-40 bg-slate-900/50 flex items-center justify-center relative group"
                onClick={onPreview}
            >
                {file.type === 'image' && file.url ? (
                    <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center">
                        {getFileIcon(file.type, file.mimeType)}
                    </div>
                )}
                
                {/* Selection Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="absolute top-2 left-2 w-6 h-6 bg-slate-800/80 rounded flex items-center justify-center border border-slate-600 hover:border-cyan-500 transition-colors"
                >
                    {selected && <Check size={14} className="text-cyan-400" />}
                </button>

                {/* Preview Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye size={32} className="text-white" />
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h4 className="text-white font-medium text-sm mb-2 truncate" title={file.name}>
                    {file.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={onDownload}
                        className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors"
                        title="Download"
                    >
                        <Download size={14} className="text-cyan-400 mx-auto" />
                    </button>
                    <button
                        onClick={onCopyLink}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        title="Copy Link"
                    >
                        <LinkIcon size={14} className="text-blue-400 mx-auto" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} className="text-red-400 mx-auto" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Upload Modal Component
const UploadModal = ({ onClose, onUpload, theme }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const handleUpload = () => {
        if (selectedFiles.length > 0) {
            onUpload(selectedFiles);
            setSelectedFiles([]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Upload Files</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div
                    className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-cyan-500 transition-colors mb-6"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                    />
                    <Upload size={48} className="text-cyan-400 mx-auto mb-4" />
                    <p className="text-white font-semibold text-lg mb-2">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-slate-400">
                        Images, videos, documents up to 50MB
                    </p>
                </div>

                {selectedFiles.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-white font-semibold mb-3">
                            Selected Files ({selectedFiles.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <File size={20} className="text-cyan-400" />
                                        <div>
                                            <p className="text-white text-sm">{file.name}</p>
                                            <p className="text-slate-400 text-xs">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    >
                                        <X size={16} className="text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                    >
                        Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Preview Modal Component  
const PreviewModal = ({ file, onClose, theme }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-6xl w-full max-h-[90vh] bg-slate-800 rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-white font-semibold truncate">{file.name}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 max-h-[calc(90vh-120px)] overflow-auto">
                    {file.type === 'image' && (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full h-auto mx-auto rounded-lg"
                        />
                    )}
                    {file.type === 'video' && (
                        <video
                            src={file.url}
                            controls
                            className="max-w-full h-auto mx-auto rounded-lg"
                        />
                    )}
                    {file.type === 'audio' && (
                        <audio
                            src={file.url}
                            controls
                            className="w-full"
                        />
                    )}
                    {!['image', 'video', 'audio'].includes(file.type) && (
                        <div className="text-center py-12">
                            <File size={64} className="text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Preview not available for this file type</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// Create Folder Modal Component
const CreateFolderModal = ({ onClose, onCreate, theme }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#06b6d4');

    const colors = [
        '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
        '#f59e0b', '#10b981', '#ef4444', '#64748b'
    ];

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name, color);
            setName('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-white mb-6">Create New Folder</h3>

                <div className="mb-6">
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                        Folder Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter folder name..."
                        autoFocus
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                        Color
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-10 h-10 rounded-lg transition-all ${
                                    color === c ? 'ring-2 ring-white scale-110' : ''
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                    >
                        Create
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MediaManager;