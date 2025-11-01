const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
require('dotenv').config();

const seedOwner = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected');

        // Check if owner already exists
        const existingOwner = await User.findOne({ email: process.env.OWNER_EMAIL });
        
        if (existingOwner) {
            console.log('⚠️  Owner user already exists:', existingOwner.email);
            process.exit(0);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(process.env.OWNER_PASSWORD, 10);

        // Create owner user
        const owner = new User({
            name: process.env.OWNER_NAME || 'Portfolio Owner',
            email: process.env.OWNER_EMAIL,
            password: hashedPassword,
            role: 'owner',
            status: 'active',
            permissions: ['all'],
            avatar: '',
            lastLogin: new Date()
        });

        await owner.save();
        console.log('✅ Owner user created successfully:');
        console.log('   Email:', owner.email);
        console.log('   Name:', owner.name);
        console.log('   Role:', owner.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedOwner();
