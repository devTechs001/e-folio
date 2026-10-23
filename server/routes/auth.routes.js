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
    max: 40,
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
    const rawPass = (process.env.OWNER_PASSWORD || 'DevDan@123#').replace(/^["']|["']$/g, '').trim();
    ownerPasswordHash = await bcrypt.hash(rawPass, 10);
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

        const normalizedEmail = email.toLowerCase();
        const ownerEmail = (process.env.OWNER_EMAIL || 'devtechs842@gmail.com').replace(/^["']|["']$/g, '').trim().toLowerCase();
        const rawOwnerPass = (process.env.OWNER_PASSWORD || 'DevDan@123#').replace(/^["']|["']$/g, '').trim();
        const jwtSecret = process.env.JWT_SECRET || 'efolio_pro_jwt_secret_key_2024_secure';

        // Owner login
        if (normalizedEmail === ownerEmail) {
            const hash = await getOwnerPasswordHash();
            const isOwnerMatch = (await bcrypt.compare(password, hash)) || (password === rawOwnerPass);
            if (isOwnerMatch) {
                let ownerUser = await User.findOne({ email: ownerEmail });
                if (!ownerUser) {
                    ownerUser = await User.findOne({ role: 'owner' });
                }
                const ownerId = ownerUser ? ownerUser._id.toString() : '507f1f77bcf86cd799439011';

                const token = jwt.sign(
                    { email: ownerEmail, role: 'owner', id: ownerId },
                    jwtSecret,
                    { expiresIn: '7d' }
                );

                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: ownerId,
                        name: ownerUser?.name || process.env.OWNER_NAME || 'Portfolio Owner',
                        email: ownerEmail,
                        role: 'owner'
                    },
                    token
                });
            }
        }

        // Regular user login
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Persist last login
        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role || 'user' },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role || 'user'
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

// Collaborator login (validates against an existing collaborator/user account)
router.post('/login/collaborator', loginLimiter, async (req, res) => {
    try {
        const email = sanitizeString(req.body.email);
        const password = sanitizeString(req.body.password);
        const accessCode = sanitizeString(req.body.accessCode);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // If an access code is configured, require it
        const collabAccessCode = process.env.COLLAB_ACCESS_CODE ? process.env.COLLAB_ACCESS_CODE.replace(/^["']|["']$/g, '').trim() : null;
        if (collabAccessCode) {
            if (!accessCode || !constantTimeCompare(collabAccessCode, accessCode)) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid collaboration access code'
                });
            }
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (user.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Use the owner login instead'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        const jwtSecret = process.env.JWT_SECRET || 'efolio_pro_jwt_secret_key_2024_secure';
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: 'collaborator' },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: 'collaborator'
            },
            token
        });
    } catch (error) {
        console.error('Collaborator login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during collaborator login'
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

        const jwtSecret = process.env.JWT_SECRET || 'efolio_pro_jwt_secret_key_2024_secure';
        const decoded = jwt.verify(token, jwtSecret);

        let user = { id: decoded.id, email: decoded.email, role: decoded.role };

        if (decoded.role === 'owner') {
            user.name = process.env.OWNER_NAME || 'Portfolio Owner';
            user.id = decoded.id || '507f1f77bcf86cd799439011';
        } else if (['user', 'collaborator'].includes(decoded.role)) {
            const dbUser = await User.findById(decoded.id).select('name username email role isPremium avatar isActive');
            if (dbUser) {
                user = {
                    id: dbUser._id.toString(),
                    name: dbUser.name,
                    username: dbUser.username,
                    email: dbUser.email,
                    avatar: dbUser.avatar,
                    role: decoded.role === 'collaborator' ? 'collaborator' : (dbUser.role || 'user'),
                    isPremium: dbUser.isPremium
                };
            }
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

// Logout
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
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
