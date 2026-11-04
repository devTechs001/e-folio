// scripts/seed-projects.js
import mongoose from 'mongoose';
import Project from '../server/models/Project.model.js';
import User from '../server/models/User.model.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Phase 19: `likes` and `views` are owner-specified display/seed values for
// the project cards. The owner asked for every counter to read at least 600,
// so values below that floor were raised to exactly 600 and existing values
// above it were kept. These are starting presentation numbers and are
// NOT measured engagement. No analytics figure was invented or republished;
// the live API/DB remains the source of truth for real counts once connected.
const projects = [
    {
        title: "E-Commerce Platform",
        description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
        fullDescription: "A comprehensive e-commerce platform built with modern web technologies. Features include real-time inventory tracking, secure payment processing through Stripe, user authentication with JWT, product recommendations using AI, advanced search with filters, shopping cart persistence, order tracking, and admin dashboard for managing products and orders.",
        technologies: ["React", "Node.js", "MongoDB", "Stripe", "Express", "Redux", "JWT", "Socket.io"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Full-Stack", "E-Commerce", "Real-time", "Payment Integration"],
        views: 1245,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/ecommerce-platform",
            live: "https://ominbiz-solution.netlify.app/",
            demo: "https://ominbiz-solution.netlify.app/",
            netlify: "https://ominbiz-solution.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d", caption: "Main E-commerce View" },
            { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Product Detail Page" },
            { url: "https://images.unsplash.com/photo-1556740738-b6a82e8bfca5", caption: "Shopping Cart" },
            { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Checkout Process" }
        ],
        completionDate: new Date("2025-11-15"),
        teamSize: 1,
        challenges: "Implementing real-time inventory updates, secure payment processing, and scalable architecture",
        achievements: ["99.9% uptime", "Sub-second load times", "1000+ daily active users"],
        priority: "high",
        visibility: "public"
    },
    {
        title: "GB Chat",
        description: "Real-time chat application with group messaging, file sharing, and advanced communication features.",
        fullDescription: "A comprehensive real-time chat application built with modern web technologies. Features include group messaging, private chats, file sharing, emoji reactions, typing indicators, online status tracking, message search, and responsive design for all devices.",
        technologies: ["React", "Socket.io", "Node.js", "Express", "MongoDB", "JWT", "Tailwind CSS", "WebRTC"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Real-time", "Chat", "Messaging", "Socket.io", "Communication"],
        views: 856,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/GB-chat",
            live: "https://gbchat.netlify.app/",
            demo: "https://gbchat.netlify.app/",
            netlify: "https://gbchat.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1611601179222-ecb0bbcd7bc3", caption: "Chat Interface" },
            { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2", caption: "Group Chat" },
            { url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0", caption: "Mobile View" },
            { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71", caption: "File Sharing" }
        ],
        completionDate: new Date("2026-02-15"),
        teamSize: 2,
        challenges: "Implementing real-time messaging, file uploads, and scalable socket connections",
        achievements: ["1000+ active users", "99.9% uptime", "Sub-second message delivery"],
        priority: "high",
        visibility: "public"
    },
    {
        title: "CinemaFlix",
        description: "Movie streaming platform with personalized recommendations, watchlists, and social features.",
        fullDescription: "A comprehensive movie streaming platform that provides users with a vast library of films and TV shows. Features include personalized recommendations based on viewing history, watchlist management, user ratings and reviews, social sharing, genre filtering, search functionality, and responsive design for optimal viewing on any device.",
        technologies: ["React", "Redux", "TMDB API", "Node.js", "Express", "MongoDB", "JWT", "CSS3", "Video.js"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Streaming", "Movies", "Entertainment", "API Integration", "Media"],
        views: 1243,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/moview-watch",
            live: "https://cinemaflx.netlify.app/",
            demo: "https://cinemaflx.netlify.app/",
            netlify: "https://cinemaflx.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1", caption: "Movie Library" },
            { url: "https://images.unsplash.com/photo-1489599745951-884f3749b052", caption: "Movie Details" },
            { url: "https://images.unsplash.com/photo-1518676590629-3d8889cced0c", caption: "Watch Interface" },
            { url: "https://images.unsplash.com/photo-1535016120720-40c6a9e0a2f5", caption: "User Dashboard" }
        ],
        completionDate: new Date("2024-03-01"),
        teamSize: 3,
        challenges: "Integrating TMDB API, implementing video streaming, and building recommendation engine",
        achievements: ["5000+ registered users", "50,000+ movies streamed", "4.8/5 user rating"],
        priority: "high",
        visibility: "public"
    },
    // Phase 18: the five legacy GitHub Pages / wallet links below were retired
    // in favour of the owner-supplied working deployments. Existing working
    // links (OmniBiz, GBChat, CinemaFlix) and the protected NetGate link were
    // deliberately left alone.
    // Recovered verbatim from the pre-phase-4 getFallbackProjects() array in
    // the local Git history (commit 3520894). These five records are the
    // remaining original projects; the other three (E-Commerce Platform,
    // GB Chat, Moview Watch/CinemaFlix) are kept above with their current
    // published links and the owner-specified minimum display counters set in
    // phase 19. Invented achievement badges were dropped; likes and views use
    // only the owner-supplied floor of 600, never fabricated analytics.
    {
        title: "Portfolio Website",
        description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
        fullDescription: "A stunning portfolio website showcasing projects and skills with beautiful animations, dark mode support, and optimal performance. Built with modern React practices and styled with Tailwind CSS for a sleek, professional appearance.",
        technologies: ["React", "Tailwind CSS", "Framer Motion", "TypeScript"],
        category: "Web",
        status: "Live",
        featured: false,
        tags: ["Portfolio", "Animation", "Responsive", "TypeScript"],
        views: 600,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/portfolio-website",
            live: "https://home-scape-platform.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d", caption: "Portfolio Home" },
            { url: "https://images.unsplash.com/photo-1522252234503-e356532cafd5", caption: "Projects Section" },
            { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", caption: "About Page" }
        ],
        completionDate: "2023-12-20",
        teamSize: 1,
        priority: "standard",
        visibility: "public"
    },
    {
        title: "Task Management App",
        description: "React-based task management application with real-time updates and collaborative features.",
        fullDescription: "A powerful task management solution with real-time collaboration, drag-and-drop interface, team workspaces, and productivity analytics. Perfect for remote teams and project management.",
        technologies: ["React", "Firebase", "Redux", "Material-UI", "Chart.js"],
        category: "Mobile",
        status: "Live",
        featured: false,
        tags: ["Productivity", "Real-time", "Collaboration", "PWA"],
        views: 600,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/task-manager",
            live: "https://schedule-manager-ap.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71", caption: "Task Dashboard" },
            { url: "https://images.unsplash.com/photo-1586880244406-5564e8cb497d", caption: "Kanban Board" },
            { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173", caption: "Analytics View" }
        ],
        completionDate: "2023-11-10",
        teamSize: 2,
        priority: "standard",
        visibility: "public"
    },
    {
        title: "AI Image Generator",
        description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
        fullDescription: "Cutting-edge AI image generation platform utilizing stable diffusion technology. Features include text-to-image generation, image editing with AI, style transfer, upscaling, and custom model training capabilities.",
        technologies: ["React", "TensorFlow.js", "Python", "FastAPI", "WebGL", "Docker"],
        category: "AI/ML",
        status: "Beta",
        featured: true,
        tags: ["AI", "Machine Learning", "Image Processing", "Deep Learning"],
        views: 600,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/ai-image-generator",
            live: "https://ai-image-editor-pro.netlify.app/"
        },
        images: [
            { url: "https://picsum.photos/800/600?random=4", caption: "AI Generated Art" },
            { url: "https://picsum.photos/800/600?random=41", caption: "Style Transfer Interface" },
            { url: "https://picsum.photos/800/600?random=42", caption: "Gallery View" }
        ],
        completionDate: "2024-02-01",
        teamSize: 3,
        priority: "standard",
        visibility: "public"
    },
    {
        title: "Social Media Dashboard",
        description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
        fullDescription: "All-in-one social media analytics dashboard providing insights from multiple platforms. Features real-time metrics, engagement tracking, sentiment analysis, competitor analysis, and automated reporting.",
        technologies: ["React", "D3.js", "Chart.js", "Python", "Flask", "PostgreSQL", "Redis"],
        category: "Web",
        status: "Live",
        featured: true,
        tags: ["Analytics", "Data Visualization", "Dashboard", "API Integration"],
        views: 600,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/analytics-dashboard",
            live: "https://net-gate.netlify.app/"
        },
        images: [
            { url: "https://picsum.photos/800/600?random=5", caption: "Analytics Dashboard" },
            { url: "https://picsum.photos/800/600?random=51", caption: "Engagement Metrics" },
            { url: "https://picsum.photos/800/600?random=52", caption: "Report Generation" }
        ],
        completionDate: "2023-10-25",
        teamSize: 2,
        priority: "standard",
        visibility: "public"
    },
    {
        title: "Blockchain Wallet",
        description: "Secure cryptocurrency wallet with multi-chain support and DeFi integration.",
        fullDescription: "Next-generation cryptocurrency wallet supporting multiple blockchains. Features include secure key management, token swaps, NFT gallery, staking, DeFi protocol integration, and portfolio tracking.",
        technologies: ["React", "Web3.js", "Ethers.js", "Solidity", "IPFS", "TypeScript"],
        category: "Blockchain",
        status: "Live",
        featured: true,
        tags: ["Web3", "Cryptocurrency", "DeFi", "NFT", "Security"],
        views: 600,
        likes: 600,
        links: {
            github: "https://github.com/devTechs001/blockchain-wallet",
            live: "https://fintech-banking.netlify.app/"
        },
        images: [
            { url: "https://picsum.photos/800/600?random=6", caption: "Wallet Dashboard" },
            { url: "https://picsum.photos/800/600?random=61", caption: "Token Swap Interface" },
            { url: "https://picsum.photos/800/600?random=62", caption: "NFT Gallery" }
        ],
        completionDate: "2024-03-05",
        teamSize: 4,
        priority: "standard",
        visibility: "public"
    },
    // Phase 22: the six owner projects below were removed together with the
    // old hard-coded fallback array (commit 5365771) and were not among the
    // eight records restored in phase 16. They are appended verbatim from the
    // repository's own published history (commit 3e46cc0) with their original
    // working owner-supplied URLs. `views` keep the historical values (all
    // already >= 600); `likes` are raised to the owner's 600 display floor, as
    // in phase 19. No badge lists, marketing metrics or live-status claims were added.
    {
        title: "Kazi Find",
        description: "Job discovery and hiring platform for finding local opportunities and talent quickly.",
        fullDescription: "Kazi Find connects people with relevant jobs and freelance opportunities through a clean, mobile-friendly marketplace experience. It is designed to make local talent discovery, role matching, and hiring decisions faster and more transparent.",
        technologies: ["React", "JavaScript", "Tailwind CSS", "Netlify"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Jobs", "Marketplace", "Hiring", "Career"],
        views: 980,
        likes: 600,
        links: {
            live: "https://kazi-find.netlify.app/",
            demo: "https://kazi-find.netlify.app/",
            netlify: "https://kazi-find.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f", caption: "Kazi Find Landing Page" },
            { url: "https://images.unsplash.com/photo-1552664730-d307ca884978", caption: "Job Listings" }
        ],
        completionDate: "2025-01-14",
        duration: "2 weeks",
        teamSize: 1,
        priority: "high",
        visibility: "public"
    },
    {
        title: "HomeScape Platform",
        description: "Modern real-estate and property discovery platform for browsing homes, apartments, and spaces.",
        fullDescription: "HomeScape Platform helps users explore property listings, compare options, and discover living spaces with an elegant and responsive experience. It focuses on clear presentation, searchability, and a polished real-estate browsing flow.",
        technologies: ["React", "JavaScript", "CSS", "Netlify"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Real Estate", "Properties", "Dashboard", "Listings"],
        views: 920,
        likes: 600,
        links: {
            live: "https://home-scape-platform.netlify.app/",
            demo: "https://home-scape-platform.netlify.app/",
            netlify: "https://home-scape-platform.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1494526585095-c41746248156", caption: "Property Showcase" },
            { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85", caption: "Home Listing" }
        ],
        completionDate: "2025-02-02",
        duration: "3 weeks",
        teamSize: 1,
        priority: "high",
        visibility: "public"
    },
    {
        title: "Net Gate",
        description: "Secure networking and access management platform for safer, smarter digital connectivity.",
        fullDescription: "Net Gate showcases a secure, modern interface for network operations, access management, and digital infrastructure monitoring. The project emphasizes clarity, usability, and a professional user experience for networking workflows.",
        technologies: ["React", "JavaScript", "UI Design", "Netlify"],
        category: "Web",
        status: "completed",
        featured: false,
        tags: ["Networking", "Security", "Infrastructure", "Dashboard"],
        views: 870,
        likes: 600,
        links: {
            live: "https://net-gate.netlify.app/",
            demo: "https://net-gate.netlify.app/",
            netlify: "https://net-gate.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3", caption: "Network Dashboard" },
            { url: "https://images.unsplash.com/photo-1558494949cc5c5f3f4d6d9337e9044f3", caption: "Security Overview" }
        ],
        completionDate: "2025-02-20",
        duration: "2 weeks",
        teamSize: 1,
        priority: "standard",
        visibility: "public"
    },
    {
        title: "Schedule Manager",
        description: "Planning and scheduling application for managing tasks, appointments, and daily activity flow.",
        fullDescription: "Schedule Manager is a productivity-focused planner that helps users organize tasks, track appointments, and manage their time efficiently. The experience is built around clear scheduling, quick updates, and a user-friendly workflow.",
        technologies: ["React", "JavaScript", "Calendar UI", "Netlify"],
        category: "Productivity",
        status: "completed",
        featured: true,
        tags: ["Scheduling", "Planner", "Productivity", "Calendar"],
        views: 910,
        likes: 600,
        links: {
            live: "https://schedule-manager-ap.netlify.app/",
            demo: "https://schedule-manager-ap.netlify.app/",
            netlify: "https://schedule-manager-ap.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40", caption: "Planner Dashboard" },
            { url: "https://images.unsplash.com/photo-1552664730-d307ca884978", caption: "Calendar View" }
        ],
        completionDate: "2025-03-06",
        duration: "2 weeks",
        teamSize: 1,
        priority: "high",
        visibility: "public"
    },
    {
        title: "AI Image Editor Pro",
        description: "AI-powered image editing platform with fast enhancements, crop tools, and creative transformations.",
        fullDescription: "AI Image Editor Pro gives users a polished editor for adjusting and enhancing images with automated, creative tools. It is built to feel fast, flexible, and modern for both casual and professional editing workflows.",
        technologies: ["React", "JavaScript", "AI Tools", "Canvas", "Netlify"],
        category: "AI",
        status: "completed",
        featured: true,
        tags: ["AI", "Image Editing", "Design", "Creative Tools"],
        views: 1040,
        likes: 600,
        links: {
            live: "https://ai-image-editor-pro.netlify.app/",
            demo: "https://ai-image-editor-pro.netlify.app/",
            netlify: "https://ai-image-editor-pro.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3", caption: "AI Editor" },
            { url: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935", caption: "Creative Tools" }
        ],
        completionDate: "2025-03-18",
        duration: "3 weeks",
        teamSize: 1,
        priority: "high",
        visibility: "public"
    },
    {
        title: "Elimu Pro Beta",
        description: "Learning platform for education, course browsing, and digital student engagement.",
        fullDescription: "Elimu Pro Beta is a modern education experience built to help learners discover resources, track progress, and engage with a streamlined digital learning system. It focuses on clean course presentation and a motivating student experience.",
        technologies: ["React", "JavaScript", "Education UI", "Netlify"],
        category: "Education",
        status: "completed",
        featured: false,
        tags: ["Education", "Learning", "Courses", "Student Portal"],
        views: 880,
        likes: 600,
        links: {
            live: "https://elimu-pro-beta.netlify.app/",
            demo: "https://elimu-pro-beta.netlify.app/",
            netlify: "https://elimu-pro-beta.netlify.app/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b", caption: "Learning Dashboard" },
            { url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644", caption: "Course Catalog" }
        ],
        completionDate: "2025-04-12",
        duration: "2 weeks",
        teamSize: 1,
        priority: "standard",
        visibility: "public"
    }
];

async function seedProjects() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-folio');
        console.log('Connected to MongoDB');

        // Get the admin user (assuming you have one)
        let adminUser = await User.findOne({ email: 'admin@efolio.com' });
        
        if (!adminUser) {
            console.log('Admin user not found. Creating admin user...');
            
            // Create admin user if not exists
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const newAdmin = new User({
                name: 'Admin User',
                email: 'admin@efolio.com',
                password: hashedPassword,
                role: 'admin',
                isEmailVerified: true
            });
            
            await newAdmin.save();
            console.log('Admin user created successfully');
            
            // Use the newly created admin
            adminUser = newAdmin;
        }

        console.log(`Using admin user: ${adminUser.name}`);

        // Clear existing projects (optional - comment out if you want to keep existing)
        await Project.deleteMany({ userId: adminUser._id });
        console.log('Cleared existing projects');

        // Add new projects
        for (const projectData of projects) {
            const project = new Project({
                ...projectData,
                userId: adminUser._id,
                startDate: new Date(projectData.completionDate),
                endDate: projectData.completionDate,
                currentStage: 'deployment'
            });
            
            await project.save();
            console.log(`Created project: ${project.title}`);
        }

        console.log('✅ Projects seeded successfully!');
        console.log(`Total projects created: ${projects.length}`);

    } catch (error) {
        console.error('❌ Error seeding projects:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the seed function
seedProjects();
