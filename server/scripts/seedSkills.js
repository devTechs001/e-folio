const mongoose = require('mongoose');
require('dotenv').config();
const Skill = require('../models/Skill.model');

// Default user ID (update this after creating your owner user)
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011'; // This will be replaced by actual user ID

// Add userId to all skills
const createSkillsWithUserId = () => skills.map(skill => ({
    ...skill,
    userId: DEFAULT_USER_ID
}));

const skills = [
    // Frontend Skills
    { name: 'React', level: 90, category: 'Frontend', type: 'technical', color: '#61dafb', icon: 'fa-brands fa-react' },
    { name: 'Vue.js', level: 82, category: 'Frontend', type: 'technical', color: '#42b883', icon: 'fa-brands fa-vuejs' },
    { name: 'Angular', level: 75, category: 'Frontend', type: 'technical', color: '#dd0031', icon: 'fa-brands fa-angular' },
    { name: 'Next.js', level: 85, category: 'Frontend', type: 'technical', color: '#000000', icon: 'fa-solid fa-code' },
    { name: 'TypeScript', level: 88, category: 'Frontend', type: 'technical', color: '#3178c6', icon: 'fa-brands fa-js' },
    { name: 'HTML5', level: 95, category: 'Frontend', type: 'technical', color: '#e34c26', icon: 'fa-brands fa-html5' },
    { name: 'CSS3', level: 93, category: 'Frontend', type: 'technical', color: '#264de4', icon: 'fa-brands fa-css3-alt' },
    { name: 'JavaScript', level: 92, category: 'Frontend', type: 'technical', color: '#f0db4f', icon: 'fa-brands fa-js' },
    { name: 'Tailwind CSS', level: 88, category: 'Frontend', type: 'technical', color: '#06b6d4', icon: 'fa-solid fa-palette' },
    { name: 'Redux', level: 80, category: 'Frontend', type: 'technical', color: '#764abc', icon: 'fa-solid fa-store' },
    
    // Backend Skills
    { name: 'Node.js', level: 90, category: 'Backend', type: 'technical', color: '#68a063', icon: 'fa-brands fa-node-js' },
    { name: 'Express.js', level: 88, category: 'Backend', type: 'technical', color: '#000000', icon: 'fa-brands fa-node-js' },
    { name: 'Python', level: 82, category: 'Backend', type: 'technical', color: '#3776ab', icon: 'fa-brands fa-python' },
    { name: 'Django', level: 75, category: 'Backend', type: 'technical', color: '#092e20', icon: 'fa-brands fa-python' },
    { name: 'Flask', level: 78, category: 'Backend', type: 'technical', color: '#000000', icon: 'fa-brands fa-python' },
    { name: 'PHP', level: 70, category: 'Backend', type: 'technical', color: '#777bb4', icon: 'fa-brands fa-php' },
    { name: 'Laravel', level: 72, category: 'Backend', type: 'technical', color: '#ff2d20', icon: 'fa-solid fa-code' },
    { name: 'GraphQL', level: 76, category: 'Backend', type: 'technical', color: '#e10098', icon: 'fa-solid fa-project-diagram' },
    { name: 'REST APIs', level: 90, category: 'Backend', type: 'technical', color: '#009688', icon: 'fa-solid fa-exchange-alt' },
    
    // Database Skills
    { name: 'MongoDB', level: 85, category: 'Database', type: 'technical', color: '#47a248', icon: 'fa-solid fa-database' },
    { name: 'PostgreSQL', level: 80, category: 'Database', type: 'technical', color: '#336791', icon: 'fa-solid fa-database' },
    { name: 'MySQL', level: 82, category: 'Database', type: 'technical', color: '#4479a1', icon: 'fa-solid fa-database' },
    { name: 'Redis', level: 75, category: 'Database', type: 'technical', color: '#dc382d', icon: 'fa-solid fa-server' },
    { name: 'Firebase', level: 78, category: 'Database', type: 'technical', color: '#ffca28', icon: 'fa-solid fa-fire' },
    
    // DevOps & Tools
    { name: 'Git', level: 92, category: 'Tools', type: 'technical', color: '#f34f29', icon: 'fa-brands fa-git-alt' },
    { name: 'GitHub', level: 90, category: 'Tools', type: 'technical', color: '#181717', icon: 'fa-brands fa-github' },
    { name: 'Docker', level: 80, category: 'DevOps', type: 'technical', color: '#2496ed', icon: 'fa-brands fa-docker' },
    { name: 'Kubernetes', level: 70, category: 'DevOps', type: 'technical', color: '#326ce5', icon: 'fa-solid fa-dharmachakra' },
    { name: 'AWS', level: 75, category: 'Cloud', type: 'technical', color: '#ff9900', icon: 'fa-brands fa-aws' },
    { name: 'Azure', level: 72, category: 'Cloud', type: 'technical', color: '#0078d4', icon: 'fa-brands fa-microsoft' },
    { name: 'CI/CD', level: 78, category: 'DevOps', type: 'technical', color: '#2088ff', icon: 'fa-solid fa-infinity' },
    { name: 'Nginx', level: 74, category: 'DevOps', type: 'technical', color: '#009639', icon: 'fa-solid fa-server' },
    
    // Real-time & Communication
    { name: 'Socket.IO', level: 88, category: 'Backend', type: 'technical', color: '#010101', icon: 'fa-solid fa-plug' },
    { name: 'WebRTC', level: 72, category: 'Frontend', type: 'technical', color: '#333333', icon: 'fa-solid fa-video' },
    { name: 'WebSocket', level: 85, category: 'Backend', type: 'technical', color: '#010101', icon: 'fa-solid fa-comments' },
    
    // Mobile Development
    { name: 'React Native', level: 80, category: 'Mobile', type: 'technical', color: '#61dafb', icon: 'fa-brands fa-react' },
    { name: 'Flutter', level: 70, category: 'Mobile', type: 'technical', color: '#02569b', icon: 'fa-solid fa-mobile-alt' },
    
    // Testing & Quality
    { name: 'Jest', level: 82, category: 'Testing', type: 'technical', color: '#c21325', icon: 'fa-solid fa-flask' },
    { name: 'Cypress', level: 75, category: 'Testing', type: 'technical', color: '#17202c', icon: 'fa-solid fa-check-circle' },
    { name: 'Testing Library', level: 80, category: 'Testing', type: 'technical', color: '#e33332', icon: 'fa-solid fa-vial' },
    
    // Professional Skills
    { name: 'Problem Solving', level: 95, type: 'professional' },
    { name: 'Team Collaboration', level: 92, type: 'professional' },
    { name: 'Communication', level: 90, type: 'professional' },
    { name: 'Leadership', level: 85, type: 'professional' },
    { name: 'Time Management', level: 88, type: 'professional' },
    { name: 'Critical Thinking', level: 93, type: 'professional' },
    { name: 'Creativity', level: 90, type: 'professional' },
    { name: 'Adaptability', level: 92, type: 'professional' },
    { name: 'Project Management', level: 86, type: 'professional' },
    { name: 'Agile Methodology', level: 88, type: 'professional' },
    { name: 'Code Review', level: 90, type: 'professional' },
    { name: 'Mentoring', level: 84, type: 'professional' }
];

async function seedSkills() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-folio');
        console.log('✅ Connected to MongoDB');

        // Clear existing skills
        await Skill.deleteMany({});
        console.log('🗑️  Cleared existing skills');

        // Insert new skills with userId
        const skillsWithUserId = createSkillsWithUserId();
        const insertedSkills = await Skill.insertMany(skillsWithUserId);
        console.log(`\n✅ Successfully seeded ${insertedSkills.length} skills!`);
        
        console.log('\n📊 Skills breakdown:');
        console.log(`   - Technical Skills: ${skills.filter(s => s.type === 'technical').length}`);
        console.log(`   - Professional Skills: ${skills.filter(s => s.type === 'professional').length}`);
        
        console.log('\n💡 You can now:');
        console.log('   1. View skills in your dashboard');
        console.log('   2. Edit skills in Skills Editor');
        console.log('   3. Add more skills as needed');
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding skills:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the seeder
seedSkills();
