const { validateSection } = require('../utils/portfolioHelpers');

const validatePortfolioConfig = (req, res, next) => {
    const { config } = req.body;

    if (!config) {
        return res.status(400).json({
            success: false,
            message: 'Portfolio configuration is required'
        });
    }

    // Validate sections
    if (config.sections && Array.isArray(config.sections)) {
        for (const section of config.sections) {
            const validation = validateSection(section);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid section configuration',
                    errors: validation.errors
                });
            }
        }
    }

    // Validate theme
    if (config.theme) {
        const requiredThemeFields = ['primaryColor', 'backgroundColor', 'textColor'];
        for (const field of requiredThemeFields) {
            if (!config.theme[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Theme ${field} is required`
                });
            }
        }
    }

    next();
};

module.exports = { validatePortfolioConfig };