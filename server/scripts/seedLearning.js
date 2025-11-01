const mongoose = require('mongoose');
const Video = require('../models/LearningVideo');
const Tutorial = require('../models/Tutorial');
const FAQ = require('../models/FAQ');
const Community = require('../models/Community');
const Achievement = require('../models/Achievement');

async function seedLearningData() {
    try {
        // Clear existing data
        await Promise.all([
            Video.deleteMany({}),
            Tutorial.deleteMany({}),
            FAQ.deleteMany({}),
            Community.deleteMany({}),
            Achievement.deleteMany({})
        ]);

        // Seed videos
        await Video.create([
            {
                title: 'Getting Started with E-Folio',
                description: 'Learn the basics of E-Folio and how to set up your portfolio',
                videoUrl: 'https://www.youtube.com/watch?v=example1',
                thumbnail: '/thumbnails/video1.jpg',
                duration: '12:45',
                durationSeconds: 765,
                category: 'getting-started',
                difficulty: 'beginner',
                tags: ['introduction', 'setup', 'basics'],
                views: 2500,
                likes: 234,
                isPublished: true,
                publishedAt: new Date()
            },
            // Add more videos...
        ]);

        // Seed tutorials
        await Tutorial.create([
            {
                title: 'How to Add Projects',
                description: 'Step-by-step guide to adding projects to your portfolio',
                category: 'getting-started',
                difficulty: 'easy',
                estimatedTime: '5 min',
                steps: [
                    {
                        title: 'Navigate to Projects',
                        content: 'Click on the Projects menu item in the dashboard',
                        order: 1
                    },
                    {
                        title: 'Click Add Project',
                        content: 'Click the "Add Project" button in the top right',
                        order: 2
                    }
                ],
                isPublished: true
            },
            // Add more tutorials...
        ]);

        // Seed FAQs
        await FAQ.create([
            {
                question: 'How do I invite collaborators?',
                answer: 'Go to the Collaborators section in your dashboard and click the "Invite" button. Enter their email address and set their permissions.',
                category: 'collaboration',
                order: 1,
                isPublished: true
            },
            // Add more FAQs...
        ]);

        // Seed communities
        await Community.create([
            {
                name: 'E-Folio Users',
                description: 'General community for all E-Folio users',
                icon: '👥',
                members: 12500,
                category: 'users',
                platform: 'discord',
                inviteLink: 'https://discord.gg/example',
                isActive: true
            },
            // Add more communities...
        ]);

        // Seed achievements
        await Achievement.create([
            {
                name: 'First Steps',
                description: 'Complete your first tutorial',
                icon: '🎯',
                category: 'learning',
                points: 10,
                criteria: {
                    type: 'tutorials_completed',
                    target: 1
                },
                tier: 'bronze',
                isActive: true
            },
            {
                name: 'Video Enthusiast',
                description: 'Watch 10 videos',
                icon: '📺',
                category: 'learning',
                points: 50,
                criteria: {
                    type: 'videos_completed',
                    target: 10
                },
                tier: 'silver',
                isActive: true
            },
            {
                name: 'Learning Master',
                description: 'Earn 500 learning points',
                icon: '🏆',
                category: 'milestone',
                points: 100,
                criteria: {
                    type: 'total_points',
                    target: 500
                },
                tier: 'gold',
                isActive: true
            }
        ]);

        console.log('Learning data seeded successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

module.exports = seedLearningData;