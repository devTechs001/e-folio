const mongoose = require('mongoose');
require('dotenv').config();

// Define Skill Schema
const skillSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { type: Number, required: true, min: 0, max: 100 },
    category: String,
    type: { type: String, enum: ['technical', 'professional'], required: true },
    color: String,
    icon: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Skill = mongoose.model('Skill', skillSchema);

const skills = [
    // Technical Skills
    { name: 'React', level: 90, category: 'Frontend', type: 'technical', color: '#61dafb', icon: 'fa-brands fa-react' },
    { name: 'Node.js', level: 85, category: 'Backend', type: 'technical', color: '#68a063', icon: 'fa-brands fa-node-js' },
    { name: 'TypeScript', level: 80, category: 'Frontend', type: 'technical', color: '#3178c6', icon: 'fa-brands fa-js' },
    { name: 'Python', level: 75, category: 'Backend', type: 'technical', color: '#3776ab', icon: 'fa-brands fa-python' },
    { name: 'HTML5', level: 95, category: 'Frontend', type: 'technical', color: '#e34c26', icon: 'fa-brands fa-html5' },
    { name: 'CSS3', level: 90, category: 'Frontend', type: 'technical', color: '#264de4', icon: 'fa-brands fa-css3-alt' },
    { name: 'JavaScript', level: 88, category: 'Frontend', type: 'technical', color: '#f0db4f', icon: 'fa-brands fa-js' },
    { name: 'MongoDB', level: 70, category: 'Database', type: 'technical', color: '#47a248', icon: 'fa-solid fa-database' },
    { name: 'Git', level: 85, category: 'Tools', type: 'technical', color: '#f34f29', icon: 'fa-brands fa-git-alt' },
    { name: 'Docker', level: 65, category: 'DevOps', type: 'technical', color: '#2496ed', icon: 'fa-brands fa-docker' },
    { name: 'Express.js', level: 82, category: 'Backend', type: 'technical', color: '#000000', icon: 'fa-brands fa-node-js' },
    { name: 'Socket.IO', level: 78, category: 'Backend', type: 'technical', color: '#010101', icon: 'fa-solid fa-plug' },
    
    // Professional Skills
    { name: 'Problem Solving', level: 95, type: 'professional' },
    { name: 'Team Collaboration', level: 90, type: 'professional' },
    { name: 'Communication', level: 85, type: 'professional' },
    { name: 'Leadership', level: 80, type: 'professional' },
    { name: 'Time Management', level: 88, type: 'professional' },
    { name: 'Critical Thinking', level: 92, type: 'professional' },
    { name: 'Creativity', level: 87, type: 'professional' },
    { name: 'Adaptability', level: 90, type: 'professional' }
];

async function seedSkills() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-folio');
        console.log('✅ Connected to MongoDB');

        // Clear existing skills
        await Skill.deleteMany({});
        console.log('🗑️  Cleared existing skills');

        // Insert new skills
        const insertedSkills = await Skill.insertMany(skills);
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
