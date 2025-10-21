const express = require('express');
const router = express.Router();

// In-memory storage
let skills = [];

// Get all skills
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            skills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add skill
router.post('/', (req, res) => {
    try {
        const { name, level, category, type, color } = req.body;

        if (!name || level === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name and level are required'
            });
        }

        const newSkill = {
            id: Date.now().toString(),
            name,
            level: parseInt(level),
            category: category || 'Frontend',
            type: type || 'technical',
            color: color || '#00efff',
            createdAt: new Date().toISOString()
        };

        skills.push(newSkill);

        res.json({
            success: true,
            message: 'Skill added successfully',
            skill: newSkill
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update skill
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, level, category, type, color } = req.body;

        const index = skills.findIndex(s => s.id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        skills[index] = {
            ...skills[index],
            name: name || skills[index].name,
            level: level !== undefined ? parseInt(level) : skills[index].level,
            category: category || skills[index].category,
            type: type || skills[index].type,
            color: color || skills[index].color,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Skill updated successfully',
            skill: skills[index]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete skill
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = skills.findIndex(s => s.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        skills.splice(index, 1);

        res.json({
            success: true,
            message: 'Skill deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
