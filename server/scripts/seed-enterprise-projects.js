#!/usr/bin/env node
/**
 * Enterprise Projects Seed Script
 * 
 * This script seeds the database with enterprise-level projects
 * Run: node scripts/seed-enterprise-projects.js
 * 
 * Usage:
 *   npm run seed:enterprise    (from server directory)
 *   node scripts/seed-enterprise-projects.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import models
const Project = require('../models/Project.model');
const User = require('../models/User.model');

// Import enterprise projects data
const enterpriseProjects = require('../seed-enterprise-projects');

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/efolio';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
};

// Get or create owner user
const getOrCreateOwnerUser = async () => {
    try {
        let ownerUser = await User.findOne({ role: 'owner' });
        
        if (!ownerUser) {
            console.log('📝 Creating owner user...');
            ownerUser = await User.create({
                name: 'Portfolio Owner',
                username: 'portfolio_owner',
                email: 'owner@efolio.dev',
                role: 'owner',
                password: 'password123', // Should be hashed in production
                preferences: {
                    theme: 'dark',
                    language: 'en'
                }
            });
            console.log('✅ Owner user created');
        } else {
            console.log('✅ Owner user found');
        }
        
        return ownerUser;
    } catch (error) {
        console.error('❌ Error getting/creating owner user:', error.message);
        return null;
    }
};

// Seed enterprise projects
const seedEnterpriseProjects = async (userId) => {
    try {
        console.log('\n📦 Seeding enterprise projects...');
        console.log(`   Total projects to seed: ${enterpriseProjects.length}`);
        
        // Add userId to all projects
        const projectsWithUser = enterpriseProjects.map(project => ({
            ...project,
            userId: userId
        }));
        
        // Check for existing projects and skip duplicates
        const existingTitles = await Project.distinct('title');
        const newProjects = projectsWithUser.filter(
            p => !existingTitles.includes(p.title)
        );
        
        if (newProjects.length === 0) {
            console.log('⚠️  All enterprise projects already exist in database');
            return 0;
        }
        
        console.log(`   New projects to add: ${newProjects.length}`);
        console.log(`   Existing projects skipped: ${projectsWithUser.length - newProjects.length}`);
        
        // Insert new projects
        const inserted = await Project.insertMany(newProjects);
        
        console.log(`✅ Successfully seeded ${inserted.length} enterprise projects`);
        
        // Print summary
        console.log('\n📊 Projects Summary:');
        console.log('   ─────────────────────────────────────');
        inserted.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.title}`);
            console.log(`      Category: ${project.category}`);
            console.log(`      Status: ${project.status}`);
            console.log(`      Featured: ${project.featured}`);
        });
        
        // Get total project count
        const totalProjects = await Project.countDocuments({ userId });
        console.log(`\n📈 Total projects in database: ${totalProjects}`);
        
        return inserted.length;
    } catch (error) {
        console.error('❌ Error seeding enterprise projects:', error.message);
        return 0;
    }
};

// Display project links
const displayProjectLinks = () => {
    console.log('\n🔗 Project Links:');
    console.log('   ─────────────────────────────────────');
    enterpriseProjects.forEach((project, index) => {
        console.log(`\n   ${index + 1}. ${project.title}`);
        console.log(`      GitHub: ${project.links.github}`);
        console.log(`      Live:   ${project.links.live}`);
        if (project.links.demo) {
            console.log(`      Demo:   ${project.links.demo}`);
        }
    });
};

// Main function
const main = async () => {
    console.log('\n🚀 ===================================');
    console.log('   E-Folio Enterprise Projects Seeder');
    console.log('=====================================\n');
    
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
        console.log('\n❌ Exiting: Database connection failed');
        process.exit(1);
    }
    
    // Get or create owner user
    const ownerUser = await getOrCreateOwnerUser();
    if (!ownerUser) {
        console.log('\n❌ Exiting: Could not get/create owner user');
        process.exit(1);
    }
    
    // Seed projects
    const seededCount = await seedEnterpriseProjects(ownerUser._id);
    
    // Display project links
    if (seededCount > 0) {
        displayProjectLinks();
    }
    
    console.log('\n✅ ===================================');
    console.log('   Seeding completed successfully!');
    console.log('=====================================\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed\n');
    
    process.exit(0);
};

// Run the script
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
