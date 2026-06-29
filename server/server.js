const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Prevent unhandled rejections from crashing the server
process.on('unhandledRejection', (reason) => {
    console.warn('⚠️ Unhandled Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.warn('⚠️ Uncaught Exception:', err?.message || err);
});

// Load environment variables
dotenv.config();

// Import handlers
const chatHandler = require('./socket/chat.handler.enhanced');
const connectDB = require('./config/database');
const keyRotator = require('./services/keyRotator.service');
const Education = require('./models/Education');
const Interests = require('./models/Interests');
const UserModel = require('./models/User.model');

// Import routes
const authRoutes = require('./routes/auth.routes');
const collaborationRoutes = require('./routes/collaboration.routes');
const collaborationRequestsRoutes = require('./routes/collaboration-requests.routes');
const collaboratorsRoutes = require('./routes/collaborators.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const skillsRoutes = require('./routes/skills.routes');
const projectsRoutes = require('./routes/projects.routes');
const publicRoutes = require('./routes/public.routes');
const chatRoutes = require('./routes/chat.routes');
const aiRoutes = require('./routes/ai.routes');
const trackingRoutes = require('./routes/tracking.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const emailRoutes = require('./routes/email.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const mediaRoutes = require('./routes/media.routes');
const learningRoutes = require('./routes/learning.routes');
const educationRoutes = require('./routes/education.routes');
const interestsRoutes = require('./routes/interests.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const testimonialsRoutes = require('./routes/testimonials.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const contactRoutes = require('./routes/contact.routes');
const netlifyFormRoutes = require('./routes/netlify-form.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const cvRoutes = require('./routes/cv.routes');
const adminRoutes = require('./routes/admin.routes');
const templateRoutes = require('./routes/template.routes');

// Create Express app and server
const app = express();
const server = http.createServer(app);

// Socket.IO CORS - Allow multiple origins
const socketAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://e-folio-pro.netlify.app',
    'https://e-folio-pro.netlify.app/',
    'https://devtechs001.github.io'
].filter(Boolean);

const io = socketIo(server, {
    cors: {
        origin: [
            process.env.CLIENT_URL,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'https://e-folio-pro.netlify.app',
            'https://devtechs001.github.io'
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    }
});
global.io = io;

const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow multiple origins and handle trailing slashes
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://e-folio-pro.netlify.app',
    'https://e-folio-pro.netlify.app/',
    'https://devtechs001.github.io'
].filter(Boolean); // Remove undefined values

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            console.warn(`Allowed origins:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/collaboration-requests', collaborationRequestsRoutes);
app.use('/api/collaborators', collaboratorsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/interests', interestsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/netlify-form', netlifyFormRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templateRoutes);


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

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});


// Initialize Socket.io handlers
chatHandler(io);
const settingsHandler = require('./socket/settings.handler');
settingsHandler(io);

// Pass Socket.IO instance to collaboration controller
const collaborationController = require('./controllers/collaboration.controller');
// collaborationController.setSocketIO(io); // Function doesn't exist

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ error: err.message || 'Something went wrong!' });
});

// Start server
connectDB().then(async () => {
    // Auto-seed education & interests if empty
    try {
        const eduCount = await Education.countDocuments();
        const intCount = await Interests.countDocuments();
        if (eduCount === 0 || intCount === 0) {
            const owner = await UserModel.findOne({ role: 'owner' }).lean();
            if (owner) {
                const userId = owner._id;
                const educationData = [
                    { institution: 'Bungoma National Polytechnic', degree: 'Diploma in Computer Science', fieldOfStudy: 'Computer Science', startDate: new Date('2023-09-01'), endDate: null, currentlyStudying: true, description: 'Specializing in software development, web technologies, and computer systems.', grade: 'Ongoing', location: 'Bungoma, Kenya' },
                    { institution: 'Ayes Consults Ltd.', degree: 'ICT Essentials', fieldOfStudy: 'Information Technology', startDate: new Date('2023-03-01'), endDate: new Date('2023-07-01'), description: 'Comprehensive training in Microsoft Office Suite, computer maintenance, and essential IT skills.', grade: 'Distinction', location: 'Nairobi, Kenya' },
                    { institution: 'Google Africa', degree: 'Digital Skills Training', fieldOfStudy: 'Digital Marketing', startDate: new Date('2023-01-01'), endDate: new Date('2023-03-01'), description: 'Mastered digital marketing, online presence management, and web analytics.', grade: 'Certified', location: 'Online' },
                    { institution: 'FreeCodeCamp', degree: 'Certificate in Web Development', fieldOfStudy: 'Web Development', startDate: new Date('2022-01-01'), endDate: new Date('2023-01-01'), description: 'Full-stack web development covering HTML5, CSS3, JavaScript, React, and Node.js.', grade: 'Certified', location: 'Online' },
                    { institution: 'Coursera', degree: 'Python Programming Certification', fieldOfStudy: 'Computer Science', startDate: new Date('2022-01-01'), endDate: new Date('2022-12-01'), description: 'Advanced Python programming concepts including data structures and algorithms.', grade: 'Certified', location: 'Online' },
                    { institution: 'Musingu High School', degree: 'Secondary Education', fieldOfStudy: 'General Education', startDate: new Date('2019-01-01'), endDate: new Date('2022-11-01'), description: 'Completed secondary education with excellent grades in Mathematics, Physics, and Computer Studies.', grade: 'B+ (Plus)', location: 'Kakamega, Kenya' }
                ];
                const interestsData = [
                    { name: 'Programming', category: 'technical', level: 'expert', description: 'Passionate about solving complex problems through code.', icon: 'fas fa-code', color: 'blue' },
                    { name: 'Web Design', category: 'creative', level: 'expert', description: 'Creating visually appealing and user-friendly interfaces.', icon: 'fas fa-palette', color: 'purple' },
                    { name: 'Mobile Development', category: 'technical', level: 'advanced', description: 'Exploring mobile applications and responsive solutions.', icon: 'fas fa-mobile-alt', color: 'cyan' },
                    { name: 'AI & Machine Learning', category: 'technical', level: 'advanced', description: 'Fascinated by AI applications in solving real-world problems.', icon: 'fas fa-robot', color: 'green' },
                    { name: 'Blockchain Technology', category: 'technical', level: 'advanced', description: 'Interested in decentralized systems.', icon: 'fas fa-link', color: 'orange' },
                    { name: 'Continuous Learning', category: 'personal', level: 'expert', description: 'Committed to staying updated with latest technologies.', icon: 'fas fa-book-reader', color: 'indigo' },
                    { name: 'Community Building', category: 'social', level: 'advanced', description: 'Enjoy participating in tech communities.', icon: 'fas fa-users', color: 'pink' },
                    { name: 'Innovation', category: 'creative', level: 'expert', description: 'Passionate about creating new solutions.', icon: 'fas fa-lightbulb', color: 'yellow' },
                    { name: 'Game Development', category: 'creative', level: 'advanced', description: 'Creating interactive experiences through code.', icon: 'fas fa-gamepad', color: 'red' },
                    { name: 'Cloud Computing', category: 'technical', level: 'advanced', description: 'Building scalable cloud-based solutions.', icon: 'fas fa-cloud', color: 'teal' },
                    { name: 'Cybersecurity', category: 'technical', level: 'advanced', description: 'Ensuring digital safety in application development.', icon: 'fas fa-shield-alt', color: 'gray' },
                    { name: 'Content Creation', category: 'social', level: 'advanced', description: 'Sharing knowledge through tutorials and blogs.', icon: 'fas fa-video', color: 'rose' }
                ];
                if (eduCount === 0) {
                    await Education.insertMany(educationData.map(e => ({ ...e, userId })));
                    console.log(`🌱 Auto-seeded ${educationData.length} education entries`);
                }
                if (intCount === 0) {
                    await Interests.insertMany(interestsData.map(i => ({ ...i, userId })));
                    console.log(`🌱 Auto-seeded ${interestsData.length} interests`);
                }
            }
        }
    } catch (err) {
        console.warn('Auto-seed skipped:', err.message);
    }

    // Auto-seed premium templates if empty
    try {
        const PremiumTemplate = require('./models/PremiumTemplate');
        const templateCount = await PremiumTemplate.countDocuments();
        if (templateCount === 0) {
            const templateData = require('./seed/portfolioTemplates');
            await PremiumTemplate.insertMany(templateData);
            console.log(`🌱 Auto-seeded ${templateData.length} premium templates`);
        }
    } catch (err) {
        console.warn('Template auto-seed skipped:', err.message);
    }

    server.listen(PORT, () => {
        console.log('\n🚀 ===================================');
        console.log(`✅ E-Folio Server Running`);
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Atlas/Local (with fallback)' : 'Local Only'}`);
        console.log(`🔌 Socket.io: Ready`);
        keyRotator.start();
        console.log(`🔑 Free LLM API key rotator started (checking every 30 min)`);
        console.log('=====================================\n');
    });
});

process.on('SIGTERM', () => {
    console.log('Server closed');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Server shutting down');
    server.close(() => {
        process.exit(0);
    });
});

