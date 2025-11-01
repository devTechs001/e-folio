const sanitizeHtml = require('sanitize-html');

// Sanitize portfolio content
const sanitizePortfolioContent = (content) => {
    if (typeof content === 'string') {
        return sanitizeHtml(content, {
            allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
            allowedAttributes: {
                'a': ['href', 'target', 'rel']
            }
        });
    }
    return content;
};

// Validate section structure
const validateSection = (section) => {
    const errors = [];

    if (!section.id) errors.push('Section ID is required');
    if (!section.name) errors.push('Section name is required');
    if (!section.type) errors.push('Section type is required');
    if (typeof section.visible !== 'boolean') errors.push('Section visibility must be boolean');

    return {
        valid: errors.length === 0,
        errors
    };
};

// Generate section preview
const generateSectionPreview = (section) => {
    return {
        id: section.id,
        name: section.name,
        type: section.type,
        hasContent: !!(section.content?.title || section.content?.description),
        settingsCount: section.settings ? Object.keys(section.settings).length : 0
    };
};

// Optimize portfolio config
const optimizeConfig = (config) => {
    // Remove unnecessary data
    const optimized = JSON.parse(JSON.stringify(config));
    
    // Remove empty sections
    if (optimized.sections) {
        optimized.sections = optimized.sections.filter(s => s.visible);
    }

    return optimized;
};

// Calculate portfolio score
const calculatePortfolioScore = (config) => {
    let score = 0;
    const maxScore = 100;

    // Sections (40 points)
    if (config.sections && config.sections.length > 0) {
        score += Math.min(40, config.sections.length * 8);
    }

    // Theme customization (20 points)
    if (config.theme) {
        const themeFields = ['primaryColor', 'secondaryColor', 'fontFamily', 'headingFont'];
        const customizedFields = themeFields.filter(field => config.theme[field]);
        score += (customizedFields.length / themeFields.length) * 20;
    }

    // SEO (20 points)
    if (config.seo) {
        if (config.seo.title) score += 7;
        if (config.seo.description) score += 7;
        if (config.seo.keywords && config.seo.keywords.length > 0) score += 6;
    }

    // Content quality (20 points)
    if (config.sections) {
        const sectionsWithContent = config.sections.filter(s => 
            s.content?.title && s.content?.description
        );
        score += (sectionsWithContent.length / config.sections.length) * 20;
    }

    return Math.min(score, maxScore);
};

module.exports = {
    sanitizePortfolioContent,
    validateSection,
    generateSectionPreview,
    optimizeConfig,
    calculatePortfolioScore
};