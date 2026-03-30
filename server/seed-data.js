const mongoose = require('mongoose');
const Project = require('./models/Project.model');
const Skill = require('./models/Skill.model');
const DashboardStats = require('./models/DashboardStats');
const Testimonial = require('./models/Testimonial.model');
const User = require('./models/User.model');
const dotenv = require('dotenv');
const enterpriseProjects = require('./seed-enterprise-projects');

dotenv.config();

const seedProjects = [
    {
        title: "E-Commerce Platform",
        description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
        thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/ecommerce",
            live: "https://demo-ecommerce.com",
            demo: "https://demo-ecommerce.com"
        },
        technologies: ["React", "Node.js", "MongoDB", "Stripe"],
        category: "Web",
        tags: ["ecommerce", "react", "nodejs", "mongodb"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 1,
        views: 1250,
        likes: 45
    },
    {
        title: "Portfolio Website",
        description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/portfolio",
            live: "https://yourusername.github.io/portfolio",
            demo: "https://yourusername.github.io/portfolio"
        },
        technologies: ["React", "Tailwind CSS", "Framer Motion"],
        category: "Web",
        tags: ["portfolio", "react", "tailwind", "animation"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 2,
        views: 890,
        likes: 32
    },
    {
        title: "Task Management App",
        description: "React-based task management application with real-time updates and collaborative features.",
        thumbnail: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/taskmanager",
            live: "https://yourusername.github.io/taskmanager",
            demo: "https://yourusername.github.io/taskmanager"
        },
        technologies: ["React", "Firebase", "Redux"],
        category: "Web",
        tags: ["task", "management", "react", "firebase"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 3,
        views: 756,
        likes: 28
    },
    {
        title: "Social Media Dashboard",
        description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/dashboard",
            live: "https://yourusername.github.io/dashboard",
            demo: "https://yourusername.github.io/dashboard"
        },
        technologies: ["React", "D3.js", "Chart.js"],
        category: "Web",
        tags: ["dashboard", "analytics", "d3", "charts"],
        featured: false,
        status: "completed",
        visibility: "public",
        order: 4,
        views: 623,
        likes: 19
    },
    {
        title: "Weather App",
        description: "Dynamic weather application with location-based forecasts and interactive maps.",
        thumbnail: "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/weather-app",
            live: "https://yourusername.github.io/weather-app",
            demo: "https://yourusername.github.io/weather-app"
        },
        technologies: ["React", "OpenWeatherMap API", "Leaflet"],
        category: "Web",
        tags: ["weather", "api", "maps", "react"],
        featured: false,
        status: "completed",
        visibility: "public",
        order: 5,
        views: 445,
        likes: 15
    },
    {
        title: "Chat Application",
        description: "Real-time chat application with WebSocket integration and file sharing capabilities.",
        thumbnail: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/chat-app",
            live: "https://yourusername.github.io/chat-app",
            demo: "https://yourusername.github.io/chat-app"
        },
        technologies: ["React", "Socket.io", "Express", "MongoDB"],
        category: "Web",
        tags: ["chat", "websocket", "realtime", "socket.io"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 6,
        views: 1102,
        likes: 38
    },
    {
        title: "AI Image Generator",
        description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/ai-image-generator",
            live: "https://yourusername.github.io/ai-image-generator",
            demo: "https://yourusername.github.io/ai-image-generator"
        },
        technologies: ["React", "TensorFlow.js", "Python", "FastAPI"],
        category: "AI/ML",
        tags: ["ai", "tensorflow", "python", "image-generation"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 7,
        views: 1587,
        likes: 67
    },
    {
        title: "Crypto Trading Bot",
        description: "Automated cryptocurrency trading bot with technical analysis and risk management features.",
        thumbnail: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/crypto-bot",
            live: "https://yourusername.github.io/crypto-bot",
            demo: "https://yourusername.github.io/crypto-bot"
        },
        technologies: ["Python", "TensorFlow", "Pandas", "Binance API"],
        category: "AI/ML",
        tags: ["crypto", "trading", "bot", "python"],
        featured: false,
        status: "completed",
        visibility: "public",
        order: 8,
        views: 934,
        likes: 41
    },
    {
        title: "Virtual Reality Game",
        description: "Immersive VR game developed with Unity, featuring realistic physics and interactive environments.",
        thumbnail: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/vr-game",
            live: "https://yourusername.github.io/vr-game",
            demo: "https://yourusername.github.io/vr-game"
        },
        technologies: ["Unity", "C#", "Oculus SDK"],
        category: "Other",
        tags: ["vr", "unity", "game", "oculus"],
        featured: false,
        status: "completed",
        visibility: "public",
        order: 9,
        views: 567,
        likes: 22
    },
    {
        title: "High-Performance Game Engine",
        description: "Custom game engine built with C++ featuring advanced rendering, physics simulation, and multi-threading capabilities.",
        thumbnail: "https://images.unsplash.com/photo-1627398242455-45a46ff9c8e4?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/game-engine",
            live: "https://yourusername.github.io/game-engine",
            demo: "https://yourusername.github.io/game-engine"
        },
        technologies: ["C++", "OpenGL", "Vulkan", "DirectX", "CUDA"],
        category: "Other",
        tags: ["gamedev", "cpp", "opengl", "vulkan", "engine"],
        featured: false,
        status: "completed",
        visibility: "public",
        order: 10,
        views: 423,
        likes: 18
    },
    {
        title: "Enterprise Java System",
        description: "Large-scale enterprise application built with Java Spring Boot, microservices architecture, and cloud deployment.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
        links: {
            github: "https://github.com/yourusername/enterprise-java",
            live: "https://demo-enterprise-java.com",
            demo: "https://demo-enterprise-java.com"
        },
        technologies: ["Java", "Spring Boot", "Microservices", "Docker", "Kubernetes", "PostgreSQL"],
        category: "Web",
        tags: ["java", "spring", "enterprise", "microservices", "docker"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 11,
        views: 789,
        likes: 34
    }
];

const seedTestimonials = [
    {
        name: "Sarah Johnson",
        position: "CEO",
        company: "TechStart Inc.",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3",
        rating: 5,
        content: "Working with this developer was an absolute pleasure. They delivered our e-commerce platform ahead of schedule and exceeded all our expectations. The attention to detail and technical expertise is unmatched.",
        featured: true,
        visible: true,
        date: new Date('2024-01-15'),
        email: "sarah@techstart.com",
        website: "https://techstart.com",
        order: 1
    },
    {
        name: "Michael Chen",
        position: "CTO",
        company: "InnovateTech Solutions",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3",
        rating: 5,
        content: "Exceptional work on our AI-powered analytics dashboard. The developer's ability to understand complex requirements and translate them into elegant solutions is remarkable. Highly recommended!",
        featured: true,
        visible: true,
        date: new Date('2024-02-20'),
        email: "m.chen@innovatetech.com",
        website: "https://innovatetech.com",
        order: 2
    },
    {
        name: "Emily Rodriguez",
        position: "Product Manager",
        company: "Digital Dynamics",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3",
        rating: 5,
        content: "The portfolio website they built for us is stunning. It perfectly captures our brand identity and has significantly increased our conversion rates. Professional, creative, and reliable.",
        featured: false,
        visible: true,
        date: new Date('2024-03-10'),
        email: "emily@digitaldynamics.com",
        website: "https://digitaldynamics.com",
        order: 3
    },
    {
        name: "David Kim",
        position: "Founder",
        company: "StartupHub",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3",
        rating: 5,
        content: "Outstanding development work on our real-time chat application. The performance optimization and user experience improvements have been game-changing for our platform.",
        featured: false,
        visible: true,
        date: new Date('2024-04-05'),
        email: "david@startuphub.io",
        website: "https://startuphub.io",
        order: 4
    },
    {
        name: "Jessica Taylor",
        position: "Marketing Director",
        company: "BrandBoost Agency",
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3",
        rating: 5,
        content: "The weather app they developed is both beautiful and functional. Our users love the intuitive interface and accurate forecasts. A truly talented developer!",
        featured: false,
        visible: true,
        date: new Date('2024-05-12'),
        email: "jessica@brandboost.com",
        website: "https://brandboost.com",
        order: 5
    },
    {
        name: "Robert Anderson",
        position: "VP Engineering",
        company: "CloudScale Systems",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3",
        rating: 5,
        content: "Impressive work on our enterprise Java system. The microservices architecture they implemented has improved our scalability and performance significantly. Top-notch technical skills.",
        featured: false,
        visible: true,
        date: new Date('2024-06-18'),
        email: "r.anderson@cloudscale.com",
        website: "https://cloudscale.com",
        linkedin: "https://linkedin.com/in/robertanderson",
        order: 6
    }
];

const seedSkills = [
    // Technical Skills
    { name: "HTML5", level: 90, icon: "fa-brands fa-html5", type: "technical", category: "Frontend", visible: true, order: 1 },
    { name: "CSS3", level: 85, icon: "fa-brands fa-css3-alt", type: "technical", category: "Frontend", visible: true, order: 2 },
    { name: "JavaScript", level: 80, icon: "fa-brands fa-js", type: "technical", category: "Frontend", visible: true, order: 3 },
    { name: "React", level: 75, icon: "fa-brands fa-react", type: "technical", category: "Frontend", visible: true, order: 4 },
    { name: "Python", level: 70, icon: "fa-brands fa-python", type: "technical", category: "Backend", visible: true, order: 5 },
    { name: "Node.js", level: 65, icon: "fa-brands fa-node-js", type: "technical", category: "Backend", visible: true, order: 6 },
    { name: "Git", level: 85, icon: "fa-brands fa-git-alt", type: "technical", category: "Tools", visible: true, order: 7 },
    { name: "Database", level: 60, icon: "fa-solid fa-database", type: "technical", category: "Backend", visible: true, order: 8 },
    { name: "TypeScript", level: 72, icon: "fa-brands fa-js", type: "technical", category: "Frontend", visible: true, order: 9 },
    { name: "Docker", level: 68, icon: "fa-brands fa-docker", type: "technical", category: "DevOps", visible: true, order: 10 },
    { name: "MongoDB", level: 75, icon: "fa-solid fa-database", type: "technical", category: "Backend", visible: true, order: 11 },
    { name: "Vue.js", level: 70, icon: "fa-brands fa-vuejs", type: "technical", category: "Frontend", visible: true, order: 12 },
    
    // Professional Skills
    { name: "Problem Solving", level: 90, type: "professional", category: "Problem Solving", visible: true, order: 13 },
    { name: "Creativity", level: 85, type: "professional", category: "Creativity", visible: true, order: 14 },
    { name: "Team Work", level: 95, type: "professional", category: "Teamwork", visible: true, order: 15 },
    { name: "Communication", level: 85, type: "professional", category: "Communication", visible: true, order: 16 },
    { name: "Leadership", level: 80, type: "professional", category: "Leadership", visible: true, order: 17 },
    { name: "Time Management", level: 88, type: "professional", category: "Project Management", visible: true, order: 18 },
    { name: "Adaptability", level: 92, type: "professional", category: "Problem Solving", visible: true, order: 19 },
    { name: "Critical Thinking", level: 87, type: "professional", category: "Problem Solving", visible: true, order: 20 }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/efolio');
        console.log('Connected to MongoDB');

        // Clear existing data
        await Project.deleteMany({});
        await Skill.deleteMany({});
        await Testimonial.deleteMany({});
        await DashboardStats.deleteMany({});
        
        console.log('Cleared existing data');

        // Get or create owner user
        let ownerUser = await User.findOne({ role: 'owner' });
        if (!ownerUser) {
            ownerUser = await User.create({
                name: 'Portfolio Owner',
                username: 'portfolio_owner',
                email: 'owner@efolio.dev',
                role: 'owner',
                password: 'password123', // This should be hashed
                preferences: {
                    theme: 'dark',
                    language: 'en'
                }
            });
        }

        // Add userId to all seed data
        const userId = ownerUser._id;
        
        // Seed projects (existing + enterprise)
        const projectsWithUser = seedProjects.map(project => ({
            ...project,
            userId: userId
        }));

        // Add enterprise projects
        const enterpriseProjectsWithUser = enterpriseProjects.map(project => ({
            ...project,
            userId: userId
        }));

        // Combine all projects
        const allProjects = [...projectsWithUser, ...enterpriseProjectsWithUser];

        await Project.insertMany(allProjects);
        console.log(`Seeded ${allProjects.length} projects (${seedProjects.length} original + ${enterpriseProjects.length} enterprise)`);

        // Seed skills
        const skillsWithUser = seedSkills.map(skill => ({
            ...skill,
            userId: userId
        }));
        
        await Skill.insertMany(skillsWithUser);
        console.log('Seeded skills');

        // Seed testimonials
        const testimonialsWithUser = seedTestimonials.map(testimonial => ({
            ...testimonial,
            userId: userId
        }));
        
        await Testimonial.insertMany(testimonialsWithUser);
        console.log('Seeded testimonials');

        // Seed dashboard stats
        await DashboardStats.create({
            userId: userId,
            totalProjects: allProjects.length,
            totalVisitors: 1543,
            collaborators: 5,
            messages: 23,
            growth: {
                projects: 15.3,
                visitors: 23.5,
                collaborators: 8.2,
                messages: 12.1
            }
        });
        console.log('Seeded dashboard stats');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
