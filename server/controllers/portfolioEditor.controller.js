const PortfolioConfig = require('../models/PortfolioConfig');
const PortfolioVersion = require('../models/PortfolioVersion');
const User = require('../models/User.model');
const fs = require('fs').promises;
const path = require('path');

class PortfolioEditorController {
    // Get portfolio configuration
    async getPortfolioConfig(req, res) {
        try {
            const userId = req.user.id;

            let config = await PortfolioConfig.findOne({ userId })
                .sort({ updatedAt: -1 })
                .lean();

            if (!config) {
                // Create default configuration
                config = await this.createDefaultConfig(userId);
            }

            res.json({
                success: true,
                data: config.config,
                version: config.version,
                updatedAt: config.updatedAt
            });
        } catch (error) {
            console.error('Get portfolio config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch portfolio configuration'
            });
        }
    }

    // Save portfolio configuration
    async savePortfolioConfig(req, res) {
        try {
            const userId = req.user.id;
            const { config, versionName } = req.body;

            // Validate configuration
            const validation = this.validateConfig(config);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid configuration',
                    errors: validation.errors
                });
            }

            // Get current config for versioning
            const currentConfig = await PortfolioConfig.findOne({ userId });

            // Create version backup
            if (currentConfig) {
                await PortfolioVersion.create({
                    userId,
                    config: currentConfig.config,
                    version: currentConfig.version,
                    name: versionName || `Auto-save ${new Date().toLocaleString()}`,
                    createdBy: userId
                });
            }

            // Update or create configuration
            const newVersion = currentConfig ? currentConfig.version + 1 : 1;
            
            const portfolioConfig = await PortfolioConfig.findOneAndUpdate(
                { userId },
                {
                    userId,
                    config,
                    version: newVersion,
                    isPublished: false,
                    lastEditedAt: new Date()
                },
                { upsert: true, new: true }
            );

            // Log activity
            await this.logActivity(userId, 'portfolio_config_saved', {
                version: newVersion,
                sectionsCount: config.sections?.length || 0
            });

            res.json({
                success: true,
                message: 'Portfolio configuration saved',
                version: newVersion,
                data: portfolioConfig.config
            });
        } catch (error) {
            console.error('Save portfolio config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save portfolio configuration'
            });
        }
    }

    // Get portfolio versions
    async getPortfolioVersions(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 20;

            const versions = await PortfolioVersion.find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('name version createdAt config.sections')
                .lean();

            const formattedVersions = versions.map(v => ({
                id: v._id,
                name: v.name,
                version: v.version,
                createdAt: v.createdAt,
                sectionsCount: v.config?.sections?.length || 0,
                preview: this.generateVersionPreview(v.config)
            }));

            res.json({
                success: true,
                data: formattedVersions
            });
        } catch (error) {
            console.error('Get versions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch versions'
            });
        }
    }

    // Restore portfolio version
    async restorePortfolioVersion(req, res) {
        try {
            const userId = req.user.id;
            const { versionId } = req.params;

            const version = await PortfolioVersion.findOne({
                _id: versionId,
                userId
            });

            if (!version) {
                return res.status(404).json({
                    success: false,
                    message: 'Version not found'
                });
            }

            // Create backup of current config before restoring
            const currentConfig = await PortfolioConfig.findOne({ userId });
            if (currentConfig) {
                await PortfolioVersion.create({
                    userId,
                    config: currentConfig.config,
                    version: currentConfig.version,
                    name: `Backup before restore - ${new Date().toLocaleString()}`,
                    createdBy: userId
                });
            }

            // Restore version
            const newVersion = currentConfig ? currentConfig.version + 1 : 1;
            const restored = await PortfolioConfig.findOneAndUpdate(
                { userId },
                {
                    userId,
                    config: version.config,
                    version: newVersion,
                    isPublished: false,
                    lastEditedAt: new Date()
                },
                { upsert: true, new: true }
            );

            // Log activity
            await this.logActivity(userId, 'version_restored', {
                restoredVersion: version.version,
                newVersion
            });

            res.json({
                success: true,
                message: 'Version restored successfully',
                data: restored.config
            });
        } catch (error) {
            console.error('Restore version error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restore version'
            });
        }
    }

    // Publish portfolio
    async publishPortfolio(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const config = await PortfolioConfig.findOne({ userId });

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: 'No portfolio configuration found'
                });
            }

            // Generate static HTML
            const html = await this.generatePortfolioHTML(config.config, user);

            // Save to public directory
            const publicDir = path.join(__dirname, '../public/portfolios');
            await fs.mkdir(publicDir, { recursive: true });
            
            const filename = `${user.username || user._id}.html`;
            const filepath = path.join(publicDir, filename);
            
            await fs.writeFile(filepath, html);

            // Update config as published
            config.isPublished = true;
            config.publishedAt = new Date();
            await config.save();

            // Update user portfolio URL
            const portfolioUrl = `${process.env.APP_URL}/portfolio/${user.username || user._id}`;
            await User.findByIdAndUpdate(userId, {
                portfolioUrl,
                portfolioPublished: true
            });

            // Log activity
            await this.logActivity(userId, 'portfolio_published', {
                url: portfolioUrl
            });

            res.json({
                success: true,
                message: 'Portfolio published successfully',
                url: portfolioUrl
            });
        } catch (error) {
            console.error('Publish portfolio error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to publish portfolio'
            });
        }
    }

    // Unpublish portfolio
    async unpublishPortfolio(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            const config = await PortfolioConfig.findOne({ userId });
            if (config) {
                config.isPublished = false;
                await config.save();
            }

            // Delete published file
            const publicDir = path.join(__dirname, '../public/portfolios');
            const filename = `${user.username || user._id}.html`;
            const filepath = path.join(publicDir, filename);

            try {
                await fs.unlink(filepath);
            } catch (err) {
                // File might not exist
            }

            await User.findByIdAndUpdate(userId, {
                portfolioPublished: false
            });

            res.json({
                success: true,
                message: 'Portfolio unpublished'
            });
        } catch (error) {
            console.error('Unpublish portfolio error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unpublish portfolio'
            });
        }
    }

    // Duplicate portfolio
    async duplicatePortfolio(req, res) {
        try {
            const userId = req.user.id;
            const { name } = req.body;

            const currentConfig = await PortfolioConfig.findOne({ userId });

            if (!currentConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'No configuration to duplicate'
                });
            }

            // Create version with new name
            const duplicate = await PortfolioVersion.create({
                userId,
                config: currentConfig.config,
                version: currentConfig.version,
                name: name || `Copy of ${currentConfig.config.seo?.title || 'Portfolio'}`,
                createdBy: userId
            });

            res.json({
                success: true,
                message: 'Portfolio duplicated',
                data: duplicate
            });
        } catch (error) {
            console.error('Duplicate portfolio error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to duplicate portfolio'
            });
        }
    }

    // Get portfolio templates
    async getTemplates(req, res) {
        try {
            const templates = await this.loadTemplates();

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Get templates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch templates'
            });
        }
    }

    // Apply template
    async applyTemplate(req, res) {
        try {
            const userId = req.user.id;
            const { templateId } = req.body;

            const templates = await this.loadTemplates();
            const template = templates.find(t => t.id === templateId);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Backup current config
            const currentConfig = await PortfolioConfig.findOne({ userId });
            if (currentConfig) {
                await PortfolioVersion.create({
                    userId,
                    config: currentConfig.config,
                    version: currentConfig.version,
                    name: `Backup before template - ${new Date().toLocaleString()}`,
                    createdBy: userId
                });
            }

            // Apply template
            const newVersion = currentConfig ? currentConfig.version + 1 : 1;
            const updated = await PortfolioConfig.findOneAndUpdate(
                { userId },
                {
                    userId,
                    config: template.config,
                    version: newVersion,
                    isPublished: false,
                    lastEditedAt: new Date()
                },
                { upsert: true, new: true }
            );

            res.json({
                success: true,
                message: 'Template applied successfully',
                data: updated.config
            });
        } catch (error) {
            console.error('Apply template error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to apply template'
            });
        }
    }

    // Helper methods
    async createDefaultConfig(userId) {
        const defaultConfig = {
            sections: [
                {
                    id: 'section_1',
                    name: 'Hero Section',
                    type: 'hero',
                    visible: true,
                    locked: false,
                    settings: {
                        background: 'gradient',
                        textAlign: 'center',
                        showCTA: true,
                        animation: 'fadeIn'
                    },
                    content: {
                        title: 'Welcome to My Portfolio',
                        description: 'Full-stack developer & creative problem solver',
                        data: {}
                    }
                }
            ],
            theme: {
                primaryColor: '#06b6d4',
                secondaryColor: '#3b82f6',
                backgroundColor: '#0f172a',
                textColor: '#f8fafc',
                fontFamily: 'Inter, sans-serif',
                headingFont: 'Poppins, sans-serif'
            },
            seo: {
                title: 'My Portfolio',
                description: 'Welcome to my portfolio',
                keywords: [],
                ogImage: ''
            },
            settings: {
                animations: true,
                smoothScroll: true,
                darkMode: true,
                showSocialLinks: true
            }
        };

        return await PortfolioConfig.create({
            userId,
            config: defaultConfig,
            version: 1,
            isPublished: false
        });
    }

    validateConfig(config) {
        const errors = [];

        if (!config) {
            errors.push('Configuration is required');
        }

        if (!config.sections || !Array.isArray(config.sections)) {
            errors.push('Sections must be an array');
        }

        if (!config.theme || typeof config.theme !== 'object') {
            errors.push('Theme configuration is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    generateVersionPreview(config) {
        return {
            sections: config.sections?.map(s => ({
                name: s.name,
                type: s.type,
                visible: s.visible
            })) || [],
            theme: {
                primaryColor: config.theme?.primaryColor,
                backgroundColor: config.theme?.backgroundColor
            }
        };
    }

    async generatePortfolioHTML(config, user) {
        const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.seo?.title || user.name + "'s Portfolio"}</title>
    <meta name="description" content="${config.seo?.description || ''}">
    <meta name="keywords" content="${config.seo?.keywords?.join(', ') || ''}">
    <meta property="og:title" content="${config.seo?.title || user.name + "'s Portfolio"}">
    <meta property="og:description" content="${config.seo?.description || ''}">
    <meta property="og:image" content="${config.seo?.ogImage || ''}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${config.theme?.fontFamily || 'Arial, sans-serif'};
            background-color: ${config.theme?.backgroundColor || '#0f172a'};
            color: ${config.theme?.textColor || '#f8fafc'};
            line-height: 1.6;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: ${config.theme?.headingFont || 'Arial, sans-serif'};
        }
        
        .section {
            padding: 80px 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, ${config.theme?.primaryColor || '#06b6d4'}, ${config.theme?.secondaryColor || '#3b82f6'});
        }
        
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            animation: fadeInUp 1s ease;
        }
        
        .hero p {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            animation: fadeInUp 1s ease 0.2s both;
        }
        
        .cta-button {
            padding: 15px 40px;
            background: white;
            color: ${config.theme?.primaryColor || '#06b6d4'};
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            transition: transform 0.3s;
            animation: fadeInUp 1s ease 0.4s both;
        }
        
        .cta-button:hover {
            transform: scale(1.05);
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        ${config.settings?.smoothScroll ? 'html { scroll-behavior: smooth; }' : ''}
    </style>
</head>
<body>
    ${this.generateSectionsHTML(config.sections, config)}
    
    ${config.settings?.animations ? `
    <script>
        // Add scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s, transform 0.6s';
            observer.observe(section);
        });
    </script>
    ` : ''}
</body>
</html>
        `;

        return template;
    }

    generateSectionsHTML(sections, config) {
        if (!sections) return '';

        return sections
            .filter(s => s.visible)
            .map(section => {
                switch (section.type) {
                    case 'hero':
                        return `
                            <section class="section hero" id="${section.id}">
                                <h1>${section.content?.title || 'Welcome'}</h1>
                                <p>${section.content?.description || ''}</p>
                                ${section.settings?.showCTA ? '<a href="#contact" class="cta-button">Get in Touch</a>' : ''}
                            </section>
                        `;
                    case 'about':
                        return `
                            <section class="section" id="${section.id}">
                                <h2>${section.content?.title || 'About Me'}</h2>
                                <p>${section.content?.description || ''}</p>
                            </section>
                        `;
                    default:
                        return `
                            <section class="section" id="${section.id}">
                                <h2>${section.content?.title || section.name}</h2>
                                <p>${section.content?.description || ''}</p>
                            </section>
                        `;
                }
            })
            .join('\n');
    }

    async loadTemplates() {
        // In production, load from database or file system
        return [
            {
                id: 'minimal',
                name: 'Minimal Portfolio',
                description: 'Clean and simple design',
                thumbnail: '/templates/minimal.jpg',
                config: {
                    sections: [
                        {
                            id: 'hero',
                            name: 'Hero',
                            type: 'hero',
                            visible: true,
                            settings: { background: 'solid', textAlign: 'left' },
                            content: { title: 'Minimal Portfolio', description: 'Less is more' }
                        }
                    ],
                    theme: {
                        primaryColor: '#000000',
                        secondaryColor: '#ffffff',
                        backgroundColor: '#ffffff',
                        textColor: '#000000',
                        fontFamily: 'Arial, sans-serif',
                        headingFont: 'Arial, sans-serif'
                    },
                    seo: { title: 'Minimal Portfolio', description: '', keywords: [] },
                    settings: { animations: false, smoothScroll: true, darkMode: false, showSocialLinks: true }
                }
            },
            {
                id: 'modern',
                name: 'Modern Design',
                description: 'Contemporary and vibrant',
                thumbnail: '/templates/modern.jpg',
                config: {
                    sections: [
                        {
                            id: 'hero',
                            name: 'Hero',
                            type: 'hero',
                            visible: true,
                            settings: { background: 'gradient', textAlign: 'center' },
                            content: { title: 'Modern Portfolio', description: 'Bold and beautiful' }
                        }
                    ],
                    theme: {
                        primaryColor: '#06b6d4',
                        secondaryColor: '#3b82f6',
                        backgroundColor: '#0f172a',
                        textColor: '#f8fafc',
                        fontFamily: 'Inter, sans-serif',
                        headingFont: 'Poppins, sans-serif'
                    },
                    seo: { title: 'Modern Portfolio', description: '', keywords: [] },
                    settings: { animations: true, smoothScroll: true, darkMode: true, showSocialLinks: true }
                }
            }
        ];
    }

    async logActivity(userId, action, metadata = {}) {
        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            userId,
            action,
            metadata,
            timestamp: new Date()
        });
    }
}

module.exports = new PortfolioEditorController();