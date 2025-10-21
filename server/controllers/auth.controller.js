const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

            // Check owner credentials
            if (email === process.env.OWNER_EMAIL && password === process.env.OWNER_PASSWORD) {
                const token = jwt.sign(
                    { email, role: 'owner', id: 'owner_001' },
                    process.env.JWT_SECRET || 'efolio_secret',
                    { expiresIn: '7d' }
                );

                return res.json({
                    success: true,
                    user: {
                        id: 'owner_001',
                        name: process.env.OWNER_NAME || 'Owner',
                        email,
                        role: 'owner'
                    },
                    token
                });
            }

            // Invalid credentials
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
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
