const { body, validationResult } = require('express-validator');

/**
 * @desc    Validate testimonial input
 * @access  Public/Private
 */
exports.validateTestimonial = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    
    body('position')
        .trim()
        .notEmpty()
        .withMessage('Position is required')
        .isLength({ max: 100 })
        .withMessage('Position cannot exceed 100 characters'),
    
    body('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('avatar')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid URL for avatar'),
    
    body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid URL for website'),
    
    body('linkedin')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid URL for LinkedIn'),
    
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Testimonial content is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Content must be between 10 and 1000 characters'),
    
    body('project')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Project name cannot exceed 200 characters'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean'),
    
    body('visible')
        .optional()
        .isBoolean()
        .withMessage('Visible must be a boolean'),
    
    body('verified')
        .optional()
        .isBoolean()
        .withMessage('Verified must be a boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

/**
 * @desc    Validate bulk operations
 * @access  Private/Admin
 */
exports.validateBulkOperation = [
    body('ids')
        .isArray({ min: 1 })
        .withMessage('Please provide an array of testimonial IDs'),
    
    body('ids.*')
        .isMongoId()
        .withMessage('Each ID must be a valid MongoDB ID'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

/**
 * @desc    Validate bulk update operations
 * @access  Private/Admin
 */
exports.validateBulkUpdate = [
    body('ids')
        .isArray({ min: 1 })
        .withMessage('Please provide an array of testimonial IDs'),
    
    body('ids.*')
        .isMongoId()
        .withMessage('Each ID must be a valid MongoDB ID'),
    
    body('updates')
        .isObject()
        .withMessage('Updates must be an object'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

/**
 * @desc    Validate display order update
 * @access  Private/Admin
 */
exports.validateDisplayOrder = [
    body('displayOrder')
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    }
];
