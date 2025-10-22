const Skill = require('../models/Skill.model');

class SkillsController {
    // Get all skills
    async getSkills(req, res) {
        try {
            const { type, category } = req.query;
            
            let query = {};
            if (type) query.type = type;
            if (category) query.category = category;

            const skills = await Skill.find(query)
                .sort({ order: 1, createdAt: -1 });

            res.json({
                success: true,
                skills,
                count: skills.length
            });
        } catch (error) {
            console.error('Get skills error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch skills',
                error: error.message 
            });
        }
    }

    // Get single skill by ID
    async getSkillById(req, res) {
        try {
            const skill = await Skill.findById(req.params.id);
            
            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }

            res.json({
                success: true,
                skill
            });
        } catch (error) {
            console.error('Get skill error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch skill',
                error: error.message 
            });
        }
    }

    // Create new skill
    async createSkill(req, res) {
        try {
            const { name, level, category, type, color, icon, description, order } = req.body;

            // Validation
            if (!name || level === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and level are required'
                });
            }

            if (level < 0 || level > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Level must be between 0 and 100'
                });
            }

            // Get userId from authenticated user (if auth middleware is applied)
            // For now, use a default userId or get from request
            const userId = req.user?.id || req.body.userId || '507f1f77bcf86cd799439011'; // Default ObjectId

            const newSkill = new Skill({
                name,
                level: parseInt(level),
                category: category || 'Frontend',
                type: type || 'technical',
                color: color || '#00efff',
                icon,
                description,
                order: order || 0,
                userId
            });

            await newSkill.save();

            res.status(201).json({
                success: true,
                message: 'Skill created successfully',
                skill: newSkill
            });
        } catch (error) {
            console.error('Create skill error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to create skill',
                error: error.message 
            });
        }
    }

    // Update skill
    async updateSkill(req, res) {
        try {
            const { id } = req.params;
            const { name, level, category, type, color, icon, description, order } = req.body;

            // Validation
            if (level !== undefined && (level < 0 || level > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Level must be between 0 and 100'
                });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (level !== undefined) updateData.level = parseInt(level);
            if (category) updateData.category = category;
            if (type) updateData.type = type;
            if (color) updateData.color = color;
            if (icon !== undefined) updateData.icon = icon;
            if (description !== undefined) updateData.description = description;
            if (order !== undefined) updateData.order = order;

            const skill = await Skill.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }

            res.json({
                success: true,
                message: 'Skill updated successfully',
                skill
            });
        } catch (error) {
            console.error('Update skill error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update skill',
                error: error.message 
            });
        }
    }

    // Delete skill
    async deleteSkill(req, res) {
        try {
            const { id } = req.params;

            const skill = await Skill.findByIdAndDelete(id);

            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }

            res.json({
                success: true,
                message: 'Skill deleted successfully'
            });
        } catch (error) {
            console.error('Delete skill error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete skill',
                error: error.message 
            });
        }
    }

    // Bulk create skills (useful for seeding)
    async bulkCreateSkills(req, res) {
        try {
            const { skills } = req.body;

            if (!Array.isArray(skills) || skills.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Skills array is required'
                });
            }

            // Add default userId to all skills if not provided
            const userId = req.user?.id || req.body.userId || '507f1f77bcf86cd799439011';
            const skillsWithUserId = skills.map(skill => ({
                ...skill,
                userId: skill.userId || userId
            }));

            const createdSkills = await Skill.insertMany(skillsWithUserId);

            res.status(201).json({
                success: true,
                message: `${createdSkills.length} skills created successfully`,
                skills: createdSkills
            });
        } catch (error) {
            console.error('Bulk create skills error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to create skills',
                error: error.message 
            });
        }
    }

    // Get skills statistics
    async getSkillsStats(req, res) {
        try {
            const totalSkills = await Skill.countDocuments();
            const technicalSkills = await Skill.countDocuments({ type: 'technical' });
            const professionalSkills = await Skill.countDocuments({ type: 'professional' });

            const categories = await Skill.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const avgLevel = await Skill.aggregate([
                { $group: { _id: null, avgLevel: { $avg: '$level' } } }
            ]);

            res.json({
                success: true,
                stats: {
                    total: totalSkills,
                    technical: technicalSkills,
                    professional: professionalSkills,
                    averageLevel: avgLevel[0]?.avgLevel || 0,
                    categories: categories.map(c => ({ category: c._id, count: c.count }))
                }
            });
        } catch (error) {
            console.error('Get skills stats error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch skills statistics',
                error: error.message 
            });
        }
    }
}

module.exports = new SkillsController();
