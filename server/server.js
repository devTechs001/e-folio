const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const collaborationRoutes = require('./routes/collaboration.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const skillsRoutes = require('./routes/skills.routes');
const projectsRoutes = require('./routes/projects.routes');
const chatRoutes = require('./routes/chat.routes');
const aiRoutes = require('./routes/ai.routes');
const trackingRoutes = require('./routes/tracking.routes');

// Import handlers
const chatHandler = require('./socket/chat.handler.enhanced');
const connectDB = require('./config/database');

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tracking', trackingRoutes);


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


// Initialize Socket.io handlers
chatHandler(io);

// Pass Socket.IO instance to collaboration controller
const collaborationController = require('./controllers/collaboration.controller');
collaborationController.setSocketIO(io);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log('\n🚀 ===================================');
        console.log(`✅ E-Folio Server Running`);
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'In-Memory Mode'}`);
        console.log(`🔌 Socket.io: Ready`);
        console.log('=====================================\n');
    });
});

process.on('SIGTERM', () => {
    console.log('Server closed');
    server.close(() => {
        process.exit(0);
    });
});
