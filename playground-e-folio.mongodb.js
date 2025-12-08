/* global use, db */
// MongoDB Playground for E-Folio Project
// This playground contains sample data and queries for the portfolio application

// Select the database to use.
use('e-folio');

// Clear existing collections (for testing)
db.getCollection('users').deleteMany({});
db.getCollection('projects').deleteMany({});
db.getCollection('collaborationRequests').deleteMany({});
db.getCollection('skills').deleteMany({});

// Insert sample users
db.getCollection('users').insertMany([
  {
    _id: ObjectId(),
    name: "Portfolio Owner",
    email: "devtechs842@gmail.com",
    password: "$2b$10$hashedpasswordhere",
    role: "owner",
    avatar: "https://example.com/avatar.jpg",
    bio: "Full-stack developer specializing in React, Node.js, and cloud architectures.",
    location: "San Francisco, CA",
    website: "https://e-folio-pro.netlify.app",
    github: "https://github.com/username",
    linkedin: "https://linkedin.com/in/username",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample projects
db.getCollection('projects').insertMany([
  {
    _id: ObjectId(),
    title: "E-Folio Portfolio Platform",
    description: "A modern portfolio platform with collaboration features, built with React and Node.js",
    image: "https://example.com/project1.jpg",
    technologies: ["React", "Node.js", "MongoDB", "Tailwind CSS", "Express"],
    liveUrl: "https://e-folio-pro.netlify.app",
    githubUrl: "https://github.com/username/e-folio",
    featured: true,
    category: "Web Application",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-03-01"),
    status: "completed",
    tags: ["portfolio", "react", "fullstack", "mongodb"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    title: "AI-Powered Task Manager",
    description: "Intelligent task management system with ML-powered prioritization and scheduling",
    image: "https://example.com/project2.jpg",
    technologies: ["Python", "TensorFlow", "React", "FastAPI", "PostgreSQL"],
    liveUrl: "https://taskmanager.example.com",
    githubUrl: "https://github.com/username/ai-task-manager",
    featured: true,
    category: "AI/ML",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-04-01"),
    status: "completed",
    tags: ["ai", "machine-learning", "python", "react"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    title: "Real-Time Analytics Dashboard",
    description: "Comprehensive analytics dashboard with real-time data visualization and reporting",
    image: "https://example.com/project3.jpg",
    technologies: ["Vue.js", "D3.js", "WebSocket", "Node.js", "Redis"],
    liveUrl: "https://analytics.example.com",
    githubUrl: "https://github.com/username/analytics-dashboard",
    featured: false,
    category: "Data Visualization",
    startDate: new Date("2024-03-01"),
    endDate: null,
    status: "in-progress",
    tags: ["analytics", "dashboard", "real-time", "visualization"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample skills
db.getCollection('skills').insertMany([
  {
    _id: ObjectId(),
    name: "React",
    category: "Frontend",
    level: "expert",
    yearsOfExperience: 4,
    projects: ["E-Folio Portfolio Platform", "AI-Powered Task Manager"],
    icon: "react",
    color: "#61DAFB",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Node.js",
    category: "Backend",
    level: "expert",
    yearsOfExperience: 4,
    projects: ["E-Folio Portfolio Platform", "Real-Time Analytics Dashboard"],
    icon: "nodejs",
    color: "#339933",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "MongoDB",
    category: "Database",
    level: "advanced",
    yearsOfExperience: 3,
    projects: ["E-Folio Portfolio Platform"],
    icon: "mongodb",
    color: "#47A248",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Python",
    category: "Backend",
    level: "intermediate",
    yearsOfExperience: 2,
    projects: ["AI-Powered Task Manager"],
    icon: "python",
    color: "#3776AB",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample collaboration requests
db.getCollection('collaborationRequests').insertMany([
  {
    _id: ObjectId(),
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    timezone: "America/New_York",
    role: "Frontend Developer",
    company: "Tech Solutions Inc",
    experience: "3-5 years",
    skills: ["React", "TypeScript", "CSS"],
    portfolio: "https://johnsmith.dev",
    github: "https://github.com/johnsmith",
    linkedin: "https://linkedin.com/in/johnsmith",
    twitter: "https://twitter.com/johnsmith",
    website: "https://johnsmith.dev",
    projectType: "Web Application",
    budget: "$5,000 - $10,000",
    timeline: "1-3 months",
    availability: "Immediately",
    preferredContact: "email",
    message: "I'm interested in collaborating on a React-based web application. I have 4 years of experience with frontend development and would love to work together on an innovative project.",
    attachments: [],
    references: [
      {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        relationship: "Former Manager"
      }
    ],
    remoteWork: true,
    willingToRelocate: false,
    newsletter: true,
    terms: true,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 987-6543",
    location: "Los Angeles, CA",
    timezone: "America/Los_Angeles",
    role: "Full Stack Developer",
    company: "Digital Agency",
    experience: "5-7 years",
    skills: ["Node.js", "React", "MongoDB", "AWS"],
    portfolio: "https://sarahjohnson.dev",
    github: "https://github.com/sarahjohnson",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    twitter: "",
    website: "https://sarahjohnson.dev",
    projectType: "Full Stack Application",
    budget: "$10,000 - $25,000",
    timeline: "3-6 months",
    availability: "2 weeks",
    preferredContact: "linkedin",
    message: "Looking for a challenging full-stack project where I can leverage my experience with Node.js and React. I'm particularly interested in projects involving cloud technologies.",
    attachments: [],
    references: [
      {
        name: "Mike Wilson",
        email: "mike.wilson@example.com",
        relationship: "Client"
      }
    ],
    remoteWork: true,
    willingToRelocate: true,
    newsletter: false,
    terms: true,
    status: "approved",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)  // 5 days ago
  }
]);

// Sample Queries for Testing

// 1. Find all featured projects
const featuredProjects = db.getCollection('projects').find({ featured: true });
console.log("Featured Projects:", featuredProjects.toArray());

// 2. Find skills by category
const frontendSkills = db.getCollection('skills').find({ category: "Frontend" });
console.log("Frontend Skills:", frontendSkills.toArray());

// 3. Find pending collaboration requests
const pendingRequests = db.getCollection('collaborationRequests').find({ status: "pending" });
console.log("Pending Requests:", pendingRequests.toArray());

// 4. Aggregate projects by category
const projectsByCategory = db.getCollection('projects').aggregate([
  { $group: { _id: "$category", count: { $sum: 1 }, projects: { $push: "$title" } } },
  { $sort: { count: -1 } }
]);
console.log("Projects by Category:", projectsByCategory.toArray());

// 5. Find collaboration requests by experience level
const requestsByExperience = db.getCollection('collaborationRequests').aggregate([
  { $group: { _id: "$experience", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
console.log("Requests by Experience Level:", requestsByExperience.toArray());

// 6. Find recent collaboration requests (last 30 days)
const recentRequests = db.getCollection('collaborationRequests').find({
  createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
}).sort({ createdAt: -1 });
console.log("Recent Requests:", recentRequests.toArray());

// 7. Count total documents in each collection
console.log("Total Users:", db.getCollection('users').countDocuments());
console.log("Total Projects:", db.getCollection('projects').countDocuments());
console.log("Total Skills:", db.getCollection('skills').countDocuments());
console.log("Total Collaboration Requests:", db.getCollection('collaborationRequests').countDocuments());

console.log("MongoDB Playground for E-Folio initialized successfully!");
