const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
require('dotenv').config();

const seedOwner = async () => {
    try {
        // Define connection URIs
        const atlasURI = process.env.MONGODB_URI;  // Atlas connection string from environment
        const localURI = 'mongodb://localhost:27017/efolio';  // Local fallback
        
        // Connection options
        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        };

        // Try Atlas connection first (if URI is provided)
        if (atlasURI) {
            try {
                console.log('📡 Attempting connection to MongoDB Atlas for seeding...');
                await mongoose.connect(atlasURI, options);
                console.log('✅ MongoDB Atlas Connected for seeding');
            } catch (atlasError) {
                console.error('❌ MongoDB Atlas connection failed:', atlasError.message);
                console.log('⚠️  Attempting fallback to local MongoDB for seeding...');
                
                // If Atlas fails, try local connection
                await mongoose.connect(localURI, { 
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000 
                });
                console.log('✅ Local MongoDB Connected for seeding');
            }
        } else {
            // If no Atlas URI provided, connect to local
            console.log('📡 No Atlas URI provided, attempting local MongoDB connection for seeding...');
            await mongoose.connect(localURI, { 
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000 
            });
            console.log('✅ Local MongoDB Connected for seeding');
        }

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
