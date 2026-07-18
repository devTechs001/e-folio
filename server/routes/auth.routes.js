const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User.model');
const AppSettings = require('../models/AppSettings');

const crypto = require('crypto');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many registration attempts, please try again later.' }
});

function sanitizeString(val) {
    if (typeof val !== 'string') return null;
    return val.trim();
}

function constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Register new user
router.post('/register', registerLimiter, async (req, res) => {
    try {
        // Check maintenance mode
        const appSettings = await AppSettings.findOne();
        if (appSettings?.maintenanceMode) {
            return res.status(503).json({
                success: false,
                message: appSettings.maintenanceMessage || 'Registration is currently disabled due to maintenance.'
            });
        }
        if (appSettings && appSettings.allowRegistration === false) {
            return res.status(503).json({
                success: false,
                message: 'Registration is currently disabled by the admin.'
            });
        }

        const name = sanitizeString(req.body.name);
        const username = sanitizeString(req.body.username);
        const email = sanitizeString(req.body.email);
        const password = sanitizeString(req.body.password);

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, username, email, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'An account with this email already exists'
                    : 'This username is already taken'
            });
        }

        const user = await User.create({ name, username, email, password });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: 'user'
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Cache for owner password hash (set on first comparison)
let ownerPasswordHash = null;

async function getOwnerPasswordHash() {
    if (ownerPasswordHash) return ownerPasswordHash;
    ownerPasswordHash = await bcrypt.hash(process.env.OWNER_PASSWORD, 10);
    return ownerPasswordHash;
}

// Login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const email = sanitizeString(req.body.email);
        const password = sanitizeString(req.body.password);

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Owner login (with bcrypt comparison)
        if (email === process.env.OWNER_EMAIL) {
            const hash = await getOwnerPasswordHash();
            const isOwnerMatch = await bcrypt.compare(password, hash);
            if (isOwnerMatch) {
                const token = jwt.sign(
                    { email, role: 'owner', id: 'owner_001' },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: 'owner_001',
                        name: process.env.OWNER_NAME || 'Portfolio Owner',
                        email,
                        role: 'owner'
                    },
                    token
                });
            }
        }

        // Regular user login
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: 'user'
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = { id: decoded.id, email: decoded.email, role: decoded.role };

        if (decoded.role === 'user' && decoded.id !== 'owner_001') {
            const dbUser = await User.findById(decoded.id).select('name username email role isPremium');
            if (dbUser) {
                user = {
                    id: dbUser._id,
                    name: dbUser.name,
                    username: dbUser.username,
                    email: dbUser.email,
                    role: 'user',
                    isPremium: dbUser.isPremium
                };
            }
        } else if (decoded.role === 'owner') {
            user.name = process.env.OWNER_NAME || 'Portfolio Owner';
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
});

// Google OAuth sign-in
router.post('/google', async (req, res) => {
    try {
        const { credential, username: preferredUsername } = req.body;
        if (typeof credential !== 'string' || !credential) {
            return res.status(400).json({ success: false, message: 'Google credential is required' });
        }

        let googlePayload;
        const verifyResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyResp.ok) {
            const altResp = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${credential}`);
            if (!altResp.ok) {
                return res.status(401).json({ success: false, message: 'Invalid Google credential' });
            }
            googlePayload = await altResp.json();
        } else {
            googlePayload = await verifyResp.json();
        }

        if (!googlePayload || !googlePayload.sub) {
            return res.status(401).json({ success: false, message: 'Invalid Google credential' });
        }

        const googleId = googlePayload.sub;
        const email = googlePayload.email;
        const name = googlePayload.name || email.split('@')[0];
        const avatar = googlePayload.picture;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email not provided by Google' });
        }

        let user = await User.findOne({ email });

        if (user) {
            // Existing user - log them in
            user.lastLoginAt = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            await user.save();
        } else {
            // Check maintenance mode
            const appSettings = await AppSettings.findOne();
            if (appSettings?.maintenanceMode || appSettings?.allowRegistration === false) {
                return res.status(503).json({ success: false, message: 'Registration is currently disabled.' });
            }

            // Generate a unique username
            let username = preferredUsername || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let usernameExists = await User.findOne({ username });
            let counter = 1;
            while (usernameExists) {
                const tryUsername = `${username}${counter}`;
                usernameExists = await User.findOne({ username: tryUsername });
                if (!usernameExists) {
                    username = tryUsername;
                    break;
                }
                counter++;
            }

            // Generate a random password (they'll use Google to sign in)
            const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

            user = await User.create({
                name,
                username,
                email,
                password: randomPassword,
                avatar,
                role: 'user',
                lastLoginAt: new Date(),
                loginCount: 1,
                isActive: true
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Google sign-in successful',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: 'user',
                isPremium: user.isPremium || false
            },
            token
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Server error during Google authentication' });
    }
});

module.exports = router;
