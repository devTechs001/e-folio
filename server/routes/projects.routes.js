const express = require('express');
const router = express.Router();

// In-memory storage
let projects = [];

// Get all projects
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single project
router.get('/:id', (req, res) => {
    try {
        const project = projects.find(p => p.id === req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            project
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create project
router.post('/', (req, res) => {
    try {
        const { title, description, technologies, status, category, links } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        const newProject = {
            id: Date.now().toString(),
            title,
            description,
            technologies: technologies || [],
            status: status || 'in-progress',
            category: category || 'Web',
            links: links || {},
            featured: false,
            createdAt: new Date().toISOString()
        };

        projects.push(newProject);

        res.json({
            success: true,
            message: 'Project created successfully',
            project: newProject
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update project
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const index = projects.findIndex(p => p.id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        projects[index] = {
            ...projects[index],
            ...updates,
            id,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Project updated successfully',
            project: projects[index]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete project
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = projects.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        projects.splice(index, 1);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
