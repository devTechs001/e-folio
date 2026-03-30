// models/Workspace.js
const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Link to original collaboration request
    collaborationRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollaborationRequest'
    },
    // Owner who created the workspace
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Collaborators with access
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        email: String,
        name: String,
        role: {
            type: String,
            enum: ['admin', 'editor', 'viewer', 'contributor'],
            default: 'contributor'
        },
        permissions: {
            read: { type: Boolean, default: true },
            write: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            manage_tasks: { type: Boolean, default: false },
            manage_files: { type: Boolean, default: false },
            view_analytics: { type: Boolean, default: false },
            collaborate_with_others: { type: Boolean, default: false } // Can see/interact with other collaborators
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active'
        },
        lastActive: Date
    }],
    // Projects assigned to this workspace
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    // Tasks within the workspace
    tasks: [{
        title: String,
        description: String,
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'review', 'completed'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        dueDate: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Files/resources shared in workspace
    resources: [{
        name: String,
        type: String, // file, link, note
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        access: {
            type: String,
            enum: ['all', 'owner_only', 'specific_roles'],
            default: 'all'
        }
    }],
    // Workspace settings
    settings: {
        allowCollaboratorInteraction: { type: Boolean, default: false }, // Can collaborators see each other
        enableChat: { type: Boolean, default: false },
        enableTaskBoard: { type: Boolean, default: true },
        enableFileSharing: { type: Boolean, default: true },
        enableAnalytics: { type: Boolean, default: true },
        visibility: {
            type: String,
            enum: ['private', 'invite_only', 'public'],
            default: 'private'
        }
    },
    // Workspace type/template
    workspaceType: {
        type: String,
        enum: ['development', 'design', 'marketing', 'content', 'research', 'custom'],
        default: 'custom'
    },
    // Duration
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date, // null = unlimited
    status: {
        type: String,
        enum: ['active', 'archived', 'suspended'],
        default: 'active'
    },
    // Activity tracking
    activity: [{
        type: {
            type: String,
            enum: ['collaborator_added', 'collaborator_removed', 'task_created', 'task_completed', 
                   'file_uploaded', 'setting_changed', 'project_added', 'message']
        },
        details: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Analytics
    analytics: {
        totalTasks: { type: Number, default: 0 },
        completedTasks: { type: Number, default: 0 },
        totalFiles: { type: Number, default: 0 },
        totalCollaborators: { type: Number, default: 0 },
        lastActivity: Date
    }
}, {
    timestamps: true
});

// Indexes
workspaceSchema.index({ ownerId: 1, status: 1 });
workspaceSchema.index({ 'collaborators.userId': 1 });
workspaceSchema.index({ status: 1, createdAt: -1 });
workspaceSchema.index({ workspaceType: 1 });

// Methods
workspaceSchema.methods.addCollaborator = async function(collaboratorData) {
    const collaborator = {
        userId: collaboratorData.userId,
        email: collaboratorData.email,
        name: collaboratorData.name,
        role: collaboratorData.role || 'contributor',
        permissions: collaboratorData.permissions || {
            read: true,
            write: false,
            delete: false,
            manage_tasks: false,
            manage_files: false,
            view_analytics: false,
            collaborate_with_others: false
        }
    };
    
    this.collaborators.push(collaborator);
    await this.save();
    
    // Add activity log
    this.activity.push({
        type: 'collaborator_added',
        details: `Added ${collaborator.name} as ${collaborator.role}`,
        performedBy: collaboratorData.addedBy
    });
    
    return collaborator;
};

workspaceSchema.methods.removeCollaborator = async function(userId, removedBy) {
    this.collaborators = this.collaborators.filter(c => c.userId.toString() !== userId.toString());
    await this.save();
    
    this.activity.push({
        type: 'collaborator_removed',
        details: `Removed collaborator`,
        performedBy: removedBy
    });
};

workspaceSchema.methods.addTask = async function(taskData) {
    const task = {
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate
    };
    
    this.tasks.push(task);
    this.analytics.totalTasks = this.tasks.length;
    await this.save();
    
    return task;
};

workspaceSchema.methods.updateTaskStatus = function(taskId, newStatus) {
    const task = this.tasks.id(taskId);
    if (task) {
        task.status = newStatus;
        if (newStatus === 'completed') {
            this.analytics.completedTasks += 1;
        }
    }
    return task;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
