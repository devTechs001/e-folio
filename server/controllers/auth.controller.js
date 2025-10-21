const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

class AuthController {
    // Login handler
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user in database
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Account is not active. Please contact the administrator.'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { 
                    email: user.email, 
                    role: user.role, 
                    id: user._id 
                },
                process.env.JWT_SECRET || 'efolio_secret',
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    // Verify token
    async verify(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'efolio_secret');

            return res.json({
                success: true,
                user: {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role
                }
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }

    // Logout (client-side token removal)
    async logout(req, res) {
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

module.exports = new AuthController();
