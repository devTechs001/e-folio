// Complete Projects Seed for E-Folio Portfolio
// Includes: Enterprise Projects + All Other Projects
// Run: node scripts/seed-all-projects.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('../models/Project.model');
const User = require('../models/User.model');

dotenv.config();

// All projects from the react-projects folder
const allProjects = [
    // ========== ENTERPRISE PROJECTS (13) ==========
    {
        title: "Enterprise SaaS Dashboard - Analytics & CRM",
        description: "Scalable, enterprise-grade SaaS dashboard with real-time analytics, multi-tenant CRM, RBAC, and custom reports.",
        fullDescription: "A comprehensive enterprise SaaS platform featuring multi-tenant architecture, advanced analytics dashboard, CRM tools, role-based access control, and real-time notifications.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Dashboard" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-saas-dashboard",
            live: "https://enterprise-saas-dashboard.netlify.app",
            demo: "https://enterprise-saas-dashboard.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Redis", "Socket.io", "Material-UI"],
        category: "Web",
        tags: ["saas", "dashboard", "analytics", "crm", "enterprise"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 1,
        views: 2450,
        likes: 128
    },
    {
        title: "Enterprise E-Commerce Platform",
        description: "Full-stack MERN e-commerce with Stripe/PayPal payments, inventory management, and admin dashboard.",
        fullDescription: "Production-ready e-commerce with shopping cart, secure payments, product search, reviews, inventory management, and order tracking.",
        thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3", caption: "Store" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-ecommerce-platform",
            live: "https://enterprise-ecommerce-platform.netlify.app",
            demo: "https://enterprise-ecommerce-platform.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Stripe", "PayPal", "TailwindCSS"],
        category: "Web",
        tags: ["ecommerce", "marketplace", "payments", "stripe"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 2,
        views: 3120,
        likes: 187
    },
    {
        title: "Enterprise Project Management Tool",
        description: "Jira/Asana-like platform with Kanban, Gantt charts, sprint planning, and team collaboration.",
        fullDescription: "Comprehensive PM tool with Kanban boards, Gantt charts, agile/scrum support, time tracking, and real-time collaboration.",
        thumbnail: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3", caption: "Kanban" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-project-management",
            live: "https://enterprise-pm-tool.netlify.app",
            demo: "https://enterprise-pm-tool.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "React DnD", "FullCalendar"],
        category: "Web",
        tags: ["project-management", "kanban", "agile", "scrum"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 3,
        views: 2890,
        likes: 156
    },
    {
        title: "Enterprise Social Media Platform",
        description: "Twitter/Facebook-like platform with posts, stories, real-time chat, and video sharing.",
        fullDescription: "Feature-rich social network with posts, stories, messaging, video sharing, notifications, and infinite scroll.",
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3", caption: "Feed" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-social-media-platform",
            live: "https://enterprise-social-platform.netlify.app",
            demo: "https://enterprise-social-platform.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "Cloudinary", "WebRTC"],
        category: "Web",
        tags: ["social-media", "networking", "chat", "stories"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 4,
        views: 4250,
        likes: 234
    },
    {
        title: "Enterprise FinTech Banking Dashboard",
        description: "Secure banking platform with 2FA, transactions, money transfers, and PCI DSS compliance.",
        fullDescription: "Comprehensive FinTech solution with account management, transactions, transfers, 2FA, fraud detection, and audit logging.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Banking" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-fintech-banking",
            live: "https://enterprise-fintech.netlify.app",
            demo: "https://enterprise-fintech.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "2FA", "Crypto-js", "PDFKit"],
        category: "Web",
        tags: ["fintech", "banking", "finance", "2fa", "security"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 5,
        views: 3560,
        likes: 198
    },
    {
        title: "Enterprise Healthcare Management System",
        description: "HIPAA-compliant platform with EHR, telemedicine, appointments, and patient portal.",
        fullDescription: "Healthcare management with EHR, telemedicine, appointments, prescriptions, lab tests, and HIPAA compliance.",
        thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3", caption: "Healthcare" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-healthcare-management",
            live: "https://enterprise-healthcare.netlify.app",
            demo: "https://enterprise-healthcare.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "WebRTC", "Twilio", "HIPAA"],
        category: "Web",
        tags: ["healthcare", "ehr", "telemedicine", "hipaa"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 6,
        views: 2780,
        likes: 145
    },
    {
        title: "Enterprise Real-time Collaboration Tool",
        description: "Slack/Discord-like platform with chat, video conferencing, and screen sharing.",
        fullDescription: "Team collaboration with real-time messaging, HD video calls, screen sharing, channels, and integrations.",
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3", caption: "Chat" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-collaboration-tool",
            live: "https://enterprise-collab-tool.netlify.app",
            demo: "https://enterprise-collab-tool.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "WebRTC", "Redis"],
        category: "Web",
        tags: ["collaboration", "chat", "video", "messaging"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 7,
        views: 3890,
        likes: 212
    },
    {
        title: "Enterprise AI-powered CMS",
        description: "Modern CMS with AI content generation, page builder, SEO tools, and headless API.",
        fullDescription: "Next-gen CMS with AI content generation, visual builder, SEO tools, multi-language, and headless API.",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3", caption: "CMS" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-ai-cms",
            live: "https://enterprise-ai-cms.netlify.app",
            demo: "https://enterprise-ai-cms.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "OpenAI", "TipTap", "Cloudinary"],
        category: "AI/ML",
        tags: ["cms", "ai", "headless", "seo"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 8,
        views: 3240,
        likes: 176
    },
    {
        title: "Enterprise Learning Management System (LMS)",
        description: "Online learning platform with courses, video streaming, quizzes, and certifications.",
        fullDescription: "Complete LMS with course builder, video streaming, quizzes, certificates, progress tracking, and SCORM compliance.",
        thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3", caption: "LMS" }],
        links: {
            github: "https://github.com/devtechs001/enterprise-lms-platform",
            live: "https://enterprise-lms.netlify.app",
            demo: "https://enterprise-lms.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "AWS S3", "Cloudflare Stream"],
        category: "Web",
        tags: ["lms", "e-learning", "courses", "video"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 9,
        views: 4120,
        likes: 245
    },
    {
        title: "MERN Authentication System",
        description: "Complete authentication system with JWT, role-based access, and user management.",
        fullDescription: "Full-featured auth system with registration, login, JWT tokens, password reset, and admin panel.",
        thumbnail: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3", caption: "Auth" }],
        links: {
            github: "https://github.com/devtechs001/mern-auth-system",
            live: "https://mern-auth-system.netlify.app",
            demo: "https://mern-auth-system.netlify.app/demo"
        },
        technologies: ["React", "Node.js", "MongoDB", "JWT", "bcrypt"],
        category: "Web",
        tags: ["auth", "authentication", "jwt", "mern"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 10,
        views: 1890,
        likes: 98
    },
    {
        title: "Schedule Manager",
        description: "Intelligent scheduling system with calendar integration and automated reminders.",
        fullDescription: "Smart scheduling with calendar sync, automated reminders, conflict detection, and team coordination.",
        thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3", caption: "Schedule" }],
        links: {
            github: "https://github.com/devtechs001/schedule-manager",
            live: "https://schedule-manager.netlify.app",
            demo: "https://schedule-manager.netlify.app/demo"
        },
        technologies: ["React", "Node.js", "MongoDB", "Socket.io", "FullCalendar"],
        category: "Web",
        tags: ["scheduler", "calendar", "reminders"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 11,
        views: 1560,
        likes: 87
    },
    {
        title: "Video Calling Platform",
        description: "WebRTC-based video calling with screen sharing and real-time chat.",
        fullDescription: "HD video calling platform with screen sharing, chat, recording, and multi-participant support.",
        thumbnail: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3", caption: "Video Call" }],
        links: {
            github: "https://github.com/devtechs001/react-video-calling",
            live: "https://react-video-calling.netlify.app",
            demo: "https://react-video-calling.netlify.app/demo"
        },
        technologies: ["React", "WebRTC", "Socket.io", "Node.js"],
        category: "Web",
        tags: ["video", "webrtc", "calling", "chat"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 12,
        views: 2340,
        likes: 134
    },
    {
        title: "WhatsApp Clone (Wastapp)",
        description: "Real-time messaging app with media sharing and end-to-end encryption.",
        fullDescription: "WhatsApp-like app with real-time messaging, media sharing, groups, and encryption.",
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3", caption: "Chat" }],
        links: {
            github: "https://github.com/devtechs001/wastapp-clone",
            live: "https://wastapp-clone.netlify.app",
            demo: "https://wastapp-clone.netlify.app/demo"
        },
        technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
        category: "Web",
        tags: ["chat", "messaging", "whatsapp", "real-time"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 13,
        views: 2890,
        likes: 167
    },
    {
        title: "Real Estate Platform",
        description: "Property listings with search, agent portal, and virtual tours.",
        fullDescription: "Real estate platform with property listings, advanced search, agent profiles, and virtual tours.",
        thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3", caption: "Real Estate" }],
        links: {
            github: "https://github.com/devtechs001/real-estate-platform",
            live: "https://real-estate-platform.netlify.app",
            demo: "https://real-estate-platform.netlify.app/demo"
        },
        technologies: ["React", "Node.js", "MongoDB", "Mapbox"],
        category: "Web",
        tags: ["real-estate", "property", "listings"],
        featured: false,
        status: "in-progress",
        visibility: "public",
        order: 14,
        views: 1230,
        likes: 76
    },
    {
        title: "AI Video Player",
        description: "Intelligent video player with AI-powered features and analytics.",
        fullDescription: "Smart video player with AI recommendations, auto-generated captions, and viewing analytics.",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3", caption: "AI Player" }],
        links: {
            github: "https://github.com/devtechs001/ai-player",
            live: "https://ai-player.netlify.app",
            demo: "https://ai-player.netlify.app/demo"
        },
        technologies: ["React", "AI/ML", "TensorFlow", "Video.js"],
        category: "AI/ML",
        tags: ["ai", "video", "player", "ml"],
        featured: false,
        status: "in-progress",
        visibility: "public",
        order: 15,
        views: 980,
        likes: 54
    },
    {
        title: "Image Editor",
        description: "Advanced image editing with filters, effects, and export options.",
        fullDescription: "Full-featured image editor with filters, effects, layers, and multiple export formats.",
        thumbnail: "https://images.unsplash.com/photo-1558655146-9f4011767917?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1558655146-9f4011767917?ixlib=rb-4.0.3", caption: "Editor" }],
        links: {
            github: "https://github.com/devtechs001/image-editor",
            live: "https://image-editor.netlify.app",
            demo: "https://image-editor.netlify.app/demo"
        },
        technologies: ["React", "Canvas API", "Fabric.js"],
        category: "Web",
        tags: ["image", "editor", "canvas", "filters"],
        featured: false,
        status: "in-progress",
        visibility: "public",
        order: 16,
        views: 1450,
        likes: 89
    },
    {
        title: "World Tourist Virtual",
        description: "Virtual tourism platform with 360° views and interactive experiences.",
        fullDescription: "Immersive virtual tourism with 360° panoramas, guided tours, and interactive landmarks.",
        thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [{ url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3", caption: "Virtual Tour" }],
        links: {
            github: "https://github.com/devtechs001/world-tourist-virtual",
            live: "https://world-tourist-virtual.netlify.app",
            demo: "https://world-tourist-virtual.netlify.app/demo"
        },
        technologies: ["React", "Three.js", "WebGL", "VR"],
        category: "Web",
        tags: ["vr", "tourism", "360", "virtual"],
        featured: false,
        status: "in-progress",
        visibility: "public",
        order: 17,
        views: 1120,
        likes: 67
    }
];

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/efolio';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
};

// Get or create owner user
const getOrCreateOwnerUser = async () => {
    try {
        let ownerUser = await User.findOne({ role: 'owner' });
        if (!ownerUser) {
            console.log('📝 Creating owner user...');
            ownerUser = await User.create({
                name: 'Portfolio Owner',
                username: 'portfolio_owner',
                email: 'owner@efolio.dev',
                role: 'owner',
                password: 'password123'
            });
            console.log('✅ Owner user created');
        } else {
            console.log('✅ Owner user found');
        }
        return ownerUser;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
};

// Seed all projects
const seedAllProjects = async (userId) => {
    try {
        console.log('\n📦 Seeding all projects...');
        console.log(`   Total projects: ${allProjects.length}`);

        const projectsWithUser = allProjects.map(project => ({
            ...project,
            userId: userId
        }));

        // Check for existing projects
        const existingTitles = await Project.distinct('title');
        const newProjects = projectsWithUser.filter(
            p => !existingTitles.includes(p.title)
        );

        if (newProjects.length === 0) {
            console.log('⚠️  All projects already exist');
            return 0;
        }

        console.log(`   New projects: ${newProjects.length}`);

        const inserted = await Project.insertMany(newProjects);
        console.log(`✅ Seeded ${inserted.length} projects`);

        // Summary
        console.log('\n📊 Projects Summary:');
        console.log('   ─────────────────────────────────────');
        inserted.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title}`);
            console.log(`      GitHub: ${p.links.github}`);
            console.log(`      Live: ${p.links.live}`);
        });

        const total = await Project.countDocuments({ userId });
        console.log(`\n📈 Total projects in DB: ${total}`);

        return inserted.length;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return 0;
    }
};

// Main
const main = async () => {
    console.log('\n🚀 E-Folio Complete Projects Seeder\n');

    const connected = await connectDB();
    if (!connected) process.exit(1);

    const ownerUser = await getOrCreateOwnerUser();
    if (!ownerUser) process.exit(1);

    await seedAllProjects(ownerUser._id);

    await mongoose.connection.close();
    console.log('\n✅ Done!\n');
    process.exit(0);
};

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
