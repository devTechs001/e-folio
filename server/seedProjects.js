const mongoose = require('mongoose');
const Project = require('./models/Project.model');
const User = require('./models/User.model');
require('dotenv').config();

const seedProjects = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected');

        // Find the owner user
        const owner = await User.findOne({ role: 'owner' });
        if (!owner) {
            console.error('❌ Owner user not found. Please run seed.js first to create the owner.');
            process.exit(1);
        }

        console.log('👤 Found owner:', owner.email);

        // Clear existing projects
        await Project.deleteMany({});
        console.log('🗑️  Cleared existing projects');

        const projectsData = [
            {
                title: "E-Commerce Platform",
                description: "Full-stack e-commerce solution with secure payment integration, user authentication, and real-time inventory management.",
                technologies: ["React", "Node.js", "MongoDB", "Stripe", "JWT"],
                category: "Web",
                featured: true,
                status: "completed",
                order: 1,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3", caption: "E-Commerce Platform" }],
                links: {
                    github: "https://github.com/yourusername/ecommerce",
                    live: "https://demo-ecommerce.com",
                    demo: "https://demo-ecommerce.com"
                }
            },
            {
                title: "Portfolio Website",
                description: "Modern portfolio website built with React, featuring smooth animations and responsive design.",
                technologies: ["React", "CSS", "AOS", "Framer Motion"],
                category: "Web",
                featured: true,
                status: "completed",
                order: 2,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3", caption: "Portfolio Website" }],
                links: {
                    github: "https://github.com/yourusername/portfolio",
                    live: "https://yourusername.github.io/portfolio",
                    demo: "https://yourusername.github.io/portfolio"
                }
            },
            {
                title: "Task Management App",
                description: "React-based task management application with real-time updates and collaborative features.",
                technologies: ["React", "Firebase", "Material-UI"],
                category: "Web",
                featured: false,
                status: "completed",
                order: 3,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3", caption: "Task Management" }],
                links: {
                    github: "https://github.com/yourusername/taskmanager",
                    demo: "https://yourusername.github.io/taskmanager"
                }
            },
            {
                title: "Social Media Dashboard",
                description: "Comprehensive dashboard for social media analytics with real-time data visualization.",
                technologies: ["React", "D3.js", "Chart.js", "REST API"],
                category: "Web",
                featured: true,
                status: "completed",
                order: 4,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Analytics Dashboard" }],
                links: {
                    github: "https://github.com/yourusername/dashboard",
                    live: "https://yourusername.github.io/dashboard"
                }
            },
            {
                title: "Weather App",
                description: "Dynamic weather application with location-based forecasts and interactive maps.",
                technologies: ["React", "OpenWeatherMap API", "Leaflet"],
                category: "Web",
                featured: false,
                status: "completed",
                order: 5,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3", caption: "Weather App" }],
                links: {
                    github: "https://github.com/yourusername/weather-app",
                    demo: "https://yourusername.github.io/weather-app"
                }
            },
            {
                title: "Chat Application",
                description: "Real-time chat application with WebSocket integration and file sharing capabilities.",
                technologies: ["React", "Socket.io", "Node.js", "Express"],
                category: "Web",
                featured: true,
                status: "completed",
                order: 6,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?ixlib=rb-4.0.3", caption: "Chat Application" }],
                links: {
                    github: "https://github.com/yourusername/chat-app",
                    demo: "https://yourusername.github.io/chat-app"
                }
            },
            {
                title: "AI Image Generator",
                description: "Advanced AI-powered image generation platform using stable diffusion models and neural networks.",
                technologies: ["React", "TensorFlow.js", "Python", "Stable Diffusion"],
                category: "AI/ML",
                featured: true,
                status: "completed",
                order: 7,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3", caption: "AI Image Generator" }],
                links: {
                    github: "https://github.com/yourusername/ai-image-generator",
                    live: "https://yourusername.github.io/ai-image-generator"
                }
            },
            {
                title: "Crypto Trading Bot",
                description: "Automated cryptocurrency trading bot with technical analysis and risk management features.",
                technologies: ["Python", "TensorFlow", "Pandas", "Binance API"],
                category: "AI/ML",
                featured: false,
                status: "completed",
                order: 8,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3", caption: "Crypto Bot" }],
                links: {
                    github: "https://github.com/yourusername/crypto-bot"
                }
            },
            {
                title: "Mobile Fitness Tracker",
                description: "Cross-platform mobile app for tracking workouts, nutrition, and health metrics.",
                technologies: ["React Native", "Firebase", "Redux"],
                category: "Mobile",
                featured: false,
                status: "completed",
                order: 9,
                userId: owner._id,
                images: [{ url: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?ixlib=rb-4.0.3", caption: "Fitness Tracker" }],
                links: {
                    github: "https://github.com/yourusername/fitness-tracker"
                }
            }
        ];

        // Insert projects
        await Project.insertMany(projectsData);
        console.log('✅ Successfully seeded', projectsData.length, 'projects');

        // Show summary
        const featuredCount = projectsData.filter(p => p.featured).length;
        const categories = [...new Set(projectsData.map(p => p.category))];
        
        console.log('\n📊 Summary:');
        console.log('   Total projects:', projectsData.length);
        console.log('   Featured:', featuredCount);
        console.log('   Regular:', projectsData.length - featuredCount);
        console.log('   Categories:', categories.join(', '));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding projects:', error);
        process.exit(1);
    }
};

seedProjects();
