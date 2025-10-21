const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ MongoDB Connected');
        } else {
            console.log('⚠️  MongoDB URI not provided, running without database');
        }
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
};

// Data Storage
let activeUsers = new Map();
let chatRooms = new Map();
let collaborationSessions = new Map();

// Initialize default chat rooms
chatRooms.set('general', {
    id: 'general',
    name: 'General',
    type: 'public',
    messages: [],
    members: new Set()
});

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'E-Folio Pro Server Running', 
        timestamp: new Date(),
        version: '2.0.0',
        uptime: process.uptime()
    });
});

// Analytics API
app.get('/api/analytics', (req, res) => {
    res.json({
        totalViews: Math.floor(Math.random() * 10000),
        uniqueVisitors: Math.floor(Math.random() * 5000),
        onlineUsers: activeUsers.size,
        timestamp: new Date()
    });
});

// Owner Authentication API
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Check if credentials match owner
    if (email === process.env.OWNER_EMAIL && password === process.env.OWNER_PASSWORD) {
        res.json({
            success: true,
            user: {
                id: 'owner-001',
                name: 'Portfolio Owner',
                email: email,
                role: 'owner'
            },
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials. Access denied.'
        });
    }
});

// Collaboration Requests API
app.get('/api/collaboration-requests', (req, res) => {
    // Return stored requests (in production, get from database)
    res.json({
        requests: [],
        count: 0
    });
});

app.post('/api/collaboration-requests', (req, res) => {
    const { name, email, role, message, skills } = req.body;
    
    // Validate required fields
    if (!name || !email || !role || !message) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }
    
    // In production, save to database
    res.json({
        success: true,
        message: 'Collaboration request submitted successfully',
        requestId: Date.now()
    });
});

// Generate Invite Code API
app.post('/api/collaboration/generate-invite', (req, res) => {
    const { requestId } = req.body;
    
    const inviteCode = `INVITE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const inviteLink = `${process.env.CLIENT_URL}/collaborate?invite=${inviteCode}`;
    
    res.json({
        success: true,
        inviteCode,
        inviteLink
    });
});

// Socket.io Connection Handling
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('authenticate', (userData) => {
        activeUsers.set(socket.id, {
            id: socket.id,
            ...userData,
            lastSeen: new Date(),
            status: 'online'
        });

        socket.join('general');
        socket.broadcast.emit('user_joined', { user: activeUsers.get(socket.id) });
        socket.emit('online_users', Array.from(activeUsers.values()));
        
        console.log(`👤 User authenticated: ${userData.name}`);
    });

    socket.on('send_message', (data) => {
        const { roomId, message } = data;
        const user = activeUsers.get(socket.id);
        
        if (user) {
            const messageData = {
                id: Date.now(),
                user: user.name,
                message,
                timestamp: new Date(),
                roomId
            };
            
            io.to(roomId).emit('new_message', messageData);
        }
    });

    socket.on('disconnect', () => {
        activeUsers.delete(socket.id);
        io.emit('user_left', { userId: socket.id });
        console.log(`🔌 User disconnected: ${socket.id}`);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 E-Folio Server running on port ${PORT}`);
        console.log(`📡 Socket.io ready for connections`);
    });
});

process.on('SIGTERM', () => {
    console.log('Server closed');
    server.close(() => {
        process.exit(0);
    });
});
