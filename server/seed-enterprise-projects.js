// Enterprise Projects for E-Folio Portfolio
// These projects are linked to the deployed e-folio at https://e-folio-pro.netlify.app

const enterpriseProjects = [
    // ========== ORIGINAL 8 ENTERPRISE PROJECTS ==========
    {
        title: "Enterprise SaaS Dashboard - Analytics & CRM",
        description: "Scalable, enterprise-grade SaaS dashboard with real-time analytics, multi-tenant CRM, advanced data visualization, RBAC, custom report generation, and real-time notifications.",
        fullDescription: "A comprehensive enterprise SaaS platform featuring multi-tenant architecture, advanced analytics dashboard with customizable widgets, customer relationship management tools, role-based access control, custom report generation with export capabilities, real-time notifications via WebSocket, and responsive design. The platform supports thousands of concurrent users with Redis caching, database optimization, and horizontal scaling capabilities.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Analytics Dashboard" },
            { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3", caption: "CRM Interface" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-saas-dashboard",
            live: "https://enterprise-saas-dashboard.netlify.app",
            demo: "https://enterprise-saas-dashboard.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-saas-dashboard#readme"
        },
        technologies: ["React", "Vite", "Node.js", "Express", "MongoDB", "Redis", "Socket.io", "Material-UI", "Recharts", "Redux Toolkit"],
        category: "Web",
        tags: ["saas", "dashboard", "analytics", "crm", "enterprise", "multi-tenant", "rbac"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 12,
        views: 2450,
        likes: 128,
        priority: "high",
        currentStage: "deployment",
        teamSize: 3,
        achievements: ["99.9% uptime", "10k+ concurrent users", "SOC 2 compliant"],
        challenges: "Implementing multi-tenant architecture with data isolation while maintaining performance"
    },
    {
        title: "Enterprise E-Commerce Platform",
        description: "Full-stack MERN e-commerce platform with payment integration (Stripe/PayPal), inventory management, admin dashboard, order tracking, discount codes, and email notifications.",
        fullDescription: "A production-ready e-commerce solution featuring complete shopping cart functionality, secure payment processing with Stripe and PayPal, advanced product search and filtering, customer reviews and ratings, inventory management system, comprehensive admin dashboard with analytics, order tracking and history, promotional code system, automated email notifications, and mobile-first responsive design.",
        thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3", caption: "Storefront" },
            { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3", caption: "Checkout Process" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-ecommerce-platform",
            live: "https://enterprise-ecommerce-platform.netlify.app",
            demo: "https://enterprise-ecommerce-platform.netlify.app/demo",
            api: "https://ecommerce-api.demo.com/api"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Stripe API", "PayPal SDK", "Nodemailer", "TailwindCSS", "Redux Toolkit", "Formik"],
        category: "Web",
        tags: ["ecommerce", "marketplace", "payments", "stripe", "inventory", "admin-panel"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 13,
        views: 3120,
        likes: 187,
        priority: "high",
        currentStage: "maintenance",
        teamSize: 4,
        achievements: ["PCI DSS compliant", "50k+ products", "Payment integration"],
        challenges: "Implementing secure payment processing with multiple gateways and fraud detection"
    },
    {
        title: "Enterprise Project Management Tool",
        description: "Jira/Asana-like project management platform with Kanban boards, Gantt charts, sprint planning, time tracking, team collaboration, real-time chat, and agile/scrum support.",
        fullDescription: "A comprehensive project management solution featuring interactive Kanban boards with drag-and-drop, Gantt charts for timeline visualization, sprint planning tools for agile teams, time tracking and reporting, team collaboration features with real-time chat, file attachments and sharing, burndown charts, role-based permissions, integration with GitHub and Slack, customizable workflows, and mobile-responsive design.",
        thumbnail: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3", caption: "Kanban Board" },
            { url: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3", caption: "Gantt Chart" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-project-management",
            live: "https://enterprise-pm-tool.netlify.app",
            demo: "https://enterprise-pm-tool.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-project-management#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "Redis", "React DnD", "FullCalendar", "Recharts", "Bull Queue"],
        category: "Web",
        tags: ["project-management", "kanban", "gantt", "agile", "scrum", "collaboration", "jira-alternative"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 14,
        views: 2890,
        likes: 156,
        priority: "high",
        currentStage: "deployment",
        teamSize: 5,
        achievements: ["Agile certified", "100+ teams using", "GitHub integration"],
        challenges: "Building real-time collaboration features with conflict resolution for concurrent edits"
    },
    {
        title: "Enterprise Social Media Platform",
        description: "Scalable social media platform like Twitter/Facebook with posts, stories, real-time chat, video sharing, notifications, follow system, hashtags, and infinite scroll.",
        fullDescription: "A feature-rich social networking platform supporting text, image, and video posts, ephemeral stories feature, real-time messaging with Socket.io, video upload and streaming, push notifications, follow/unfollow system with feeds, hashtags and mentions, advanced search and discovery, user profiles with customization, privacy controls, content moderation tools, and infinite scroll for seamless browsing.",
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3", caption: "Social Feed" },
            { url: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3", caption: "User Profile" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-social-media-platform",
            live: "https://enterprise-social-platform.netlify.app",
            demo: "https://enterprise-social-platform.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "Redis", "Cloudinary", "WebRTC", "Framer Motion", "Elasticsearch"],
        category: "Web",
        tags: ["social-media", "networking", "real-time", "chat", "stories", "video-sharing"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 15,
        views: 4250,
        likes: 234,
        priority: "high",
        currentStage: "deployment",
        teamSize: 6,
        achievements: ["100k+ users supported", "Real-time messaging", "Video streaming"],
        challenges: "Implementing efficient feed generation algorithm for millions of users with real-time updates"
    },
    {
        title: "Enterprise FinTech Banking Dashboard",
        description: "Secure banking platform with account management, transaction tracking, money transfers, investment portfolio, bill payments, 2FA, fraud detection, and PCI DSS compliance.",
        fullDescription: "A comprehensive FinTech solution featuring multi-account management, real-time transaction history with analytics, internal and external money transfers, investment portfolio tracking, automated bill payments, two-factor authentication with TOTP, AI-powered fraud detection, PDF statement generation, multi-currency support, budget planning tools, financial reports, biometric authentication support, and comprehensive audit logging.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Banking Dashboard" },
            { url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3", caption: "Analytics" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-fintech-banking",
            live: "https://enterprise-fintech.netlify.app",
            demo: "https://enterprise-fintech.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-fintech-banking#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Redis", "Speakeasy (2FA)", "PDFKit", "Crypto-js", "Recharts", "Helmet"],
        category: "Web",
        tags: ["fintech", "banking", "finance", "2fa", "security", "pci-dss", "payments"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 16,
        views: 3560,
        likes: 198,
        priority: "urgent",
        currentStage: "maintenance",
        teamSize: 5,
        achievements: ["PCI DSS compliant", "Bank-grade security", "2FA implemented"],
        challenges: "Implementing end-to-end encryption and maintaining PCI DSS compliance while ensuring usability"
    },
    {
        title: "Enterprise Healthcare Management System",
        description: "HIPAA-compliant healthcare platform with EHR, appointment scheduling, telemedicine, prescription management, lab tests, patient portal, and medical reports.",
        fullDescription: "A comprehensive healthcare management solution featuring electronic health records (EHR) management, intelligent appointment scheduling with calendar integration, telemedicine capabilities with WebRTC video consultations, prescription management with e-prescribing, lab test management and results tracking, patient portal for accessing records, medical reports generation, department management, billing and insurance integration, and comprehensive audit logging for HIPAA compliance.",
        thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3", caption: "Healthcare Dashboard" },
            { url: "https://images.unsplash.com/photo-1576091160550-217358c7e618?ixlib=rb-4.0.3", caption: "Telemedicine" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-healthcare-management",
            live: "https://enterprise-healthcare.netlify.app",
            demo: "https://enterprise-healthcare.netlify.app/demo"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "WebRTC", "Socket.io", "Twilio", "PDFKit", "FullCalendar", "HIPAA-compliant"],
        category: "Web",
        tags: ["healthcare", "ehr", "telemedicine", "hipaa", "medical", "appointments", "patient-portal"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 17,
        views: 2780,
        likes: 145,
        priority: "urgent",
        currentStage: "deployment",
        teamSize: 7,
        achievements: ["HIPAA compliant", "Telemedicine ready", "EHR certified"],
        challenges: "Ensuring HIPAA compliance with data encryption, access controls, and comprehensive audit trails"
    },
    {
        title: "Enterprise Real-time Collaboration Tool",
        description: "Slack/Discord-like platform with real-time messaging, video conferencing, screen sharing, file sharing, channels, DMs, notifications, and third-party integrations.",
        fullDescription: "A comprehensive team collaboration platform featuring real-time messaging with rich text support, HD video conferencing with screen sharing, file sharing with cloud storage integration, organized channels and direct messages, customizable notifications, user presence indicators, message search with Elasticsearch, pinned messages and threads, custom emojis and reactions, private channels with invite system, bot integration framework, and third-party integrations.",
        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3", caption: "Team Chat" },
            { url: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3", caption: "Video Conference" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-collaboration-tool",
            live: "https://enterprise-collab-tool.netlify.app",
            demo: "https://enterprise-collab-tool.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-collaboration-tool#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "Socket.io", "WebRTC", "Redis", "Bull Queue", "Cloudinary", "Elasticsearch"],
        category: "Web",
        tags: ["collaboration", "chat", "video-conferencing", "slack-alternative", "real-time", "team", "messaging"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 18,
        views: 3890,
        likes: 212,
        priority: "high",
        currentStage: "deployment",
        teamSize: 5,
        achievements: ["Real-time sync", "HD video calls", "1000+ concurrent users"],
        challenges: "Building low-latency real-time messaging system with message ordering and delivery guarantees"
    },
    {
        title: "Enterprise AI-powered CMS",
        description: "Modern CMS with AI content generation, visual page builder, SEO tools, multi-language support, version control, media library, headless API, and content personalization.",
        fullDescription: "A next-generation content management system featuring AI-powered content generation with GPT integration, drag-and-drop visual page builder, advanced SEO optimization tools, multi-language support with i18n, version control and content history, comprehensive media library with image processing, headless CMS API for omnichannel delivery, content scheduling and workflow, multi-user roles and permissions, content personalization engine, auto-tagging and categorization, readability scoring, and analytics dashboard.",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3", caption: "CMS Dashboard" },
            { url: "https://images.unsplash.com/photo-1555421689-d68471e189f2?ixlib=rb-4.0.3", caption: "Page Builder" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-ai-cms",
            live: "https://enterprise-ai-cms.netlify.app",
            demo: "https://enterprise-ai-cms.netlify.app/demo",
            api: "https://cms-api.demo.com/api"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "OpenAI API", "Redis", "TipTap Editor", "Cloudinary", "Elasticsearch", "Sharp"],
        category: "AI/ML",
        tags: ["cms", "ai", "content-management", "headless", "seo", "page-builder", "gpt"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 19,
        views: 3240,
        likes: 176,
        priority: "high",
        currentStage: "deployment",
        teamSize: 4,
        achievements: ["AI content generation", "Headless architecture", "SEO optimized"],
        challenges: "Integrating AI content generation while maintaining content quality and preventing misuse"
    },

    // ========== 5 NEW ADVANCED ENTERPRISE PROJECTS ==========
    {
        title: "Enterprise Learning Management System (LMS)",
        description: "Comprehensive online learning platform with course creation, video streaming, quizzes, certifications, student progress tracking, discussion forums, and SCORM compliance.",
        fullDescription: "A complete learning management system featuring course builder with multimedia support, HD video streaming with adaptive bitrate, interactive quizzes and assessments, automated certificate generation, student progress analytics, discussion forums with moderation, assignment submission and grading, gamification with badges and leaderboards, SCORM/xAPI compliance, instructor dashboard, enrollment management, and mobile learning support. Built for educational institutions and corporate training.",
        thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3", caption: "Learning Dashboard" },
            { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3", caption: "Course Player" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-lms-platform",
            live: "https://enterprise-lms.netlify.app",
            demo: "https://enterprise-lms.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-lms-platform#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "AWS S3", "Cloudflare Stream", "Socket.io", "PDFKit", "Redis", "SCORM"],
        category: "Web",
        tags: ["lms", "e-learning", "education", "courses", "video-streaming", "certifications", "scorm"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 20,
        views: 4120,
        likes: 245,
        priority: "high",
        currentStage: "deployment",
        teamSize: 6,
        achievements: ["SCORM certified", "10k+ students", "Video streaming"],
        challenges: "Implementing SCORM compliance with comprehensive tracking and reporting capabilities"
    },
    {
        title: "Enterprise IoT Dashboard & Monitoring",
        description: "Industrial IoT platform with real-time device monitoring, sensor data visualization, predictive maintenance, alerts, device management, and analytics.",
        fullDescription: "A comprehensive IoT monitoring platform featuring real-time device status tracking, sensor data visualization with time-series charts, predictive maintenance using ML algorithms, customizable alert system with multiple channels (email, SMS, push), device provisioning and management, firmware OTA updates, energy consumption analytics, geofencing and location tracking, historical data analysis, report generation, and role-based access control. Built for manufacturing, smart buildings, and industrial automation.",
        thumbnail: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?ixlib=rb-4.0.3", caption: "IoT Dashboard" },
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Device Monitoring" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-iot-dashboard",
            live: "https://enterprise-iot.netlify.app",
            demo: "https://enterprise-iot.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-iot-dashboard#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "InfluxDB", "MQTT", "Socket.io", "Grafana", "TimescaleDB", "ML"],
        category: "IoT",
        tags: ["iot", "monitoring", "sensors", "real-time", "predictive-maintenance", "industrial", "mqtt"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 21,
        views: 2980,
        likes: 167,
        priority: "high",
        currentStage: "deployment",
        teamSize: 5,
        achievements: ["10k+ devices", "Real-time monitoring", "Predictive ML"],
        challenges: "Processing millions of sensor data points in real-time with sub-second latency"
    },
    {
        title: "Enterprise Supply Chain Management",
        description: "End-to-end supply chain platform with inventory tracking, order management, warehouse management, logistics, supplier portal, and demand forecasting.",
        fullDescription: "A comprehensive supply chain management system featuring real-time inventory tracking across multiple warehouses, purchase order management, supplier relationship management with portal, warehouse management with bin locations, logistics and shipment tracking, demand forecasting using ML, automated reordering, barcode/RFID scanning, quality control workflows, cost analysis and optimization, compliance tracking, and comprehensive reporting. Built for manufacturing and distribution companies.",
        thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3", caption: "Supply Chain Dashboard" },
            { url: "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3", caption: "Warehouse Management" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-supply-chain",
            live: "https://enterprise-supply-chain.netlify.app",
            demo: "https://enterprise-supply-chain.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-supply-chain#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "PostgreSQL", "Redis", "ML", "Barcode", "RFID", "Socket.io"],
        category: "Web",
        tags: ["supply-chain", "inventory", "warehouse", "logistics", "erp", "procurement", "forecasting"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 22,
        views: 2560,
        likes: 142,
        priority: "high",
        currentStage: "deployment",
        teamSize: 8,
        achievements: ["Multi-warehouse", "ML forecasting", "RFID integration"],
        challenges: "Integrating real-time inventory tracking across multiple warehouses with synchronization"
    },
    {
        title: "Enterprise HR Management System",
        description: "Complete HR platform with employee management, payroll, attendance, leave management, performance reviews, recruitment, and employee self-service portal.",
        fullDescription: "A comprehensive HR management system featuring employee database with organizational charts, automated payroll processing with tax calculations, attendance tracking with biometric integration, leave and time-off management, performance review cycles with 360-degree feedback, recruitment and ATS with job postings, onboarding workflows, training and development tracking, employee self-service portal, document management, compliance reporting, and analytics dashboard. Built for mid to large enterprises.",
        thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3", caption: "HR Dashboard" },
            { url: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?ixlib=rb-4.0.3", caption: "Employee Portal" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-hrms",
            live: "https://enterprise-hrms.netlify.app",
            demo: "https://enterprise-hrms.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-hrms#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "PostgreSQL", "Redis", "PDFKit", "Socket.io", "Biometric API"],
        category: "Web",
        tags: ["hrms", "hr", "payroll", "attendance", "recruitment", "performance", "employee"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 23,
        views: 3340,
        likes: 189,
        priority: "high",
        currentStage: "deployment",
        teamSize: 6,
        achievements: ["Payroll automation", "Biometric integration", "360 reviews"],
        challenges: "Implementing complex payroll calculations with multi-country tax compliance"
    },
    {
        title: "Enterprise Business Intelligence Platform",
        description: "Advanced BI platform with data visualization, interactive dashboards, ad-hoc reporting, data warehousing, ETL pipelines, and AI-powered insights.",
        fullDescription: "A comprehensive business intelligence platform featuring drag-and-drop dashboard builder, interactive data visualizations with 50+ chart types, ad-hoc report generation, data warehousing integration, ETL pipeline orchestration, data blending from multiple sources, AI-powered insights and anomaly detection, natural language querying, scheduled report delivery, row-level security, embedded analytics, white-label options, and mobile BI apps. Built for data-driven enterprises.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "BI Dashboard" },
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3", caption: "Data Visualization" }
        ],
        links: {
            github: "https://github.com/devtechs001/enterprise-bi-platform",
            live: "https://enterprise-bi.netlify.app",
            demo: "https://enterprise-bi.netlify.app/demo",
            documentation: "https://github.com/devtechs001/enterprise-bi-platform#readme"
        },
        technologies: ["React", "Vite", "Node.js", "MongoDB", "PostgreSQL", "ClickHouse", "D3.js", "Python", "Airflow", "ML"],
        category: "Web",
        tags: ["bi", "analytics", "data-visualization", "dashboard", "reporting", "etl", "data-warehouse"],
        featured: true,
        status: "completed",
        visibility: "public",
        order: 24,
        views: 3780,
        likes: 201,
        priority: "high",
        currentStage: "deployment",
        teamSize: 7,
        achievements: ["50+ chart types", "AI insights", "Real-time data"],
        challenges: "Building performant queries on billion-row datasets with sub-second response times"
    }
];

module.exports = enterpriseProjects;
