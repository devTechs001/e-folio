// scripts/seed-projects.js
const mongoose = require('mongoose');
const Project = require('../server/models/Project.model');
const User = require('../server/models/User.model');
require('dotenv').config();

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
        likes: 42,
        links: {
            github: "https://github.com/devTechs001/ecommerce-platform",
            live: "https://devtechs001.github.io/omnibiz/",
            demo: "https://devtechs001.github.io/omnibiz/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d", caption: "Main E-commerce View" },
            { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Product Detail Page" },
            { url: "https://images.unsplash.com/photo-1556740738-b6a82e8bfca5", caption: "Shopping Cart" },
            { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3", caption: "Checkout Process" }
        ],
        completionDate: new Date("2024-01-15"),
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
        likes: 34,
        links: {
            github: "https://github.com/devTechs001/GB-chat",
            live: "https://devtechs001.github.io/GB-chat/",
            demo: "https://devtechs001.github.io/GB-chat/"
        },
        images: [
            { url: "https://images.unsplash.com/photo-1611601179222-ecb0bbcd7bc3", caption: "Chat Interface" },
            { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2", caption: "Group Chat" },
            { url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0", caption: "Mobile View" },
            { url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71", caption: "File Sharing" }
        ],
        completionDate: new Date("2024-02-15"),
        teamSize: 2,
        challenges: "Implementing real-time messaging, file uploads, and scalable socket connections",
        achievements: ["1000+ active users", "99.9% uptime", "Sub-second message delivery"],
        priority: "high",
        visibility: "public"
    },
    {
        title: "Moview Watch",
        description: "Movie streaming platform with personalized recommendations, watchlists, and social features.",
        fullDescription: "A comprehensive movie streaming platform that provides users with a vast library of films and TV shows. Features include personalized recommendations based on viewing history, watchlist management, user ratings and reviews, social sharing, genre filtering, search functionality, and responsive design for optimal viewing on any device.",
        technologies: ["React", "Redux", "TMDB API", "Node.js", "Express", "MongoDB", "JWT", "CSS3", "Video.js"],
        category: "Web",
        status: "completed",
        featured: true,
        tags: ["Streaming", "Movies", "Entertainment", "API Integration", "Media"],
        views: 1243,
        likes: 56,
        links: {
            github: "https://github.com/devTechs001/moview-watch",
            live: "https://devtechs001.github.io/moview-watch/",
            demo: "https://devtechs001.github.io/moview-watch/"
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
                username: 'admin',
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

        // Check if projects already exist
        const existingProjects = await Project.find({ userId: adminUser._id });
        const existingTitles = existingProjects.map(p => p.title);

        // Add new projects that don't exist
        for (const projectData of projects) {
            if (!existingTitles.includes(projectData.title)) {
                const project = new Project({
                    ...projectData,
                    userId: adminUser._id,
                    startDate: new Date(projectData.completionDate),
                    endDate: projectData.completionDate,
                    currentStage: 'deployment'
                });
                
                await project.save();
                console.log(`Created project: ${project.title}`);
            } else {
                console.log(`Project already exists: ${projectData.title}`);
            }
        }

        console.log('✅ Projects seeded successfully!');
        console.log(`Total projects in database: ${await Project.countDocuments({ userId: adminUser._id })}`);

    } catch (error) {
        console.error('❌ Error seeding projects:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the seed function
seedProjects();
