const mongoose = require('mongoose');
const Education = require('./models/Education');
const Interests = require('./models/Interests');
const User = require('./models/User.model');
require('dotenv').config();

const educationData = [
  {
    institution: 'Bungoma National Polytechnic',
    degree: 'Diploma in Computer Science',
    fieldOfStudy: 'Computer Science',
    startDate: new Date('2023-09-01'),
    endDate: null,
    currentlyStudying: true,
    description: 'Specializing in software development, web technologies, and computer systems. Key focus on practical programming skills and modern development practices.',
    grade: 'Ongoing',
    location: 'Bungoma, Kenya'
  },
  {
    institution: 'Ayes Consults Ltd.',
    degree: 'ICT Essentials',
    fieldOfStudy: 'Information Technology',
    startDate: new Date('2023-03-01'),
    endDate: new Date('2023-07-01'),
    description: 'Comprehensive training in Microsoft Office Suite, computer maintenance, and essential IT skills for modern workplace efficiency.',
    grade: 'Distinction',
    location: 'Nairobi, Kenya'
  },
  {
    institution: 'Google Africa',
    degree: 'Digital Skills Training',
    fieldOfStudy: 'Digital Marketing',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-03-01'),
    description: 'Mastered digital marketing, online presence management, and web analytics fundamentals for business growth.',
    grade: 'Certified',
    location: 'Online'
  },
  {
    institution: 'FreeCodeCamp',
    degree: 'Certificate in Web Development',
    fieldOfStudy: 'Web Development',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2023-01-01'),
    description: 'Comprehensive training in full-stack web development. Covered HTML5, CSS3, JavaScript, React, and Node.js.',
    grade: 'Certified',
    location: 'Online'
  },
  {
    institution: 'Coursera',
    degree: 'Python Programming Certification',
    fieldOfStudy: 'Computer Science',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2022-12-01'),
    description: 'Advanced Python programming concepts including data structures, algorithms, and object-oriented programming.',
    grade: 'Certified',
    location: 'Online'
  },
  {
    institution: 'Musingu High School',
    degree: 'Secondary Education',
    fieldOfStudy: 'General Education',
    startDate: new Date('2019-01-01'),
    endDate: new Date('2022-11-01'),
    description: 'Completed secondary education with excellent grades in Mathematics, Physics, and Computer Studies.',
    grade: 'B+ (Plus)',
    location: 'Kakamega, Kenya'
  }
];

const interestsData = [
  { name: 'Programming', category: 'technical', level: 'expert', description: 'Passionate about solving complex problems through code and building innovative solutions that make a difference.', icon: 'fas fa-code', color: 'blue' },
  { name: 'Web Design', category: 'creative', level: 'expert', description: 'Creating visually appealing and user-friendly interfaces that enhance the digital experience.', icon: 'fas fa-palette', color: 'purple' },
  { name: 'Mobile Development', category: 'technical', level: 'advanced', description: 'Exploring the world of mobile applications and creating responsive solutions for various platforms.', icon: 'fas fa-mobile-alt', color: 'cyan' },
  { name: 'AI & Machine Learning', category: 'technical', level: 'advanced', description: 'Fascinated by the potential of artificial intelligence and its applications in solving real-world problems.', icon: 'fas fa-robot', color: 'green' },
  { name: 'Blockchain Technology', category: 'technical', level: 'advanced', description: 'Interested in decentralized systems and their potential to revolutionize digital transactions.', icon: 'fas fa-link', color: 'orange' },
  { name: 'Continuous Learning', category: 'personal', level: 'expert', description: 'Committed to staying updated with the latest technologies and industry best practices.', icon: 'fas fa-book-reader', color: 'indigo' },
  { name: 'Community Building', category: 'social', level: 'advanced', description: 'Enjoy participating in tech communities and sharing knowledge with fellow developers.', icon: 'fas fa-users', color: 'pink' },
  { name: 'Innovation', category: 'creative', level: 'expert', description: 'Passionate about creating new solutions and pushing the boundaries of what is possible with technology.', icon: 'fas fa-lightbulb', color: 'yellow' },
  { name: 'Game Development', category: 'creative', level: 'advanced', description: 'Creating interactive experiences and exploring game mechanics and storytelling through code.', icon: 'fas fa-gamepad', color: 'red' },
  { name: 'Cloud Computing', category: 'technical', level: 'advanced', description: 'Building scalable cloud-based solutions and understanding modern infrastructure.', icon: 'fas fa-cloud', color: 'teal' },
  { name: 'Cybersecurity', category: 'technical', level: 'advanced', description: 'Ensuring digital safety and understanding security best practices in application development.', icon: 'fas fa-shield-alt', color: 'gray' },
  { name: 'Content Creation', category: 'social', level: 'advanced', description: 'Sharing knowledge through tutorials, blogs, and video content to help others learn.', icon: 'fas fa-video', color: 'rose' }
];

const seed = async () => {
  try {
    const atlasURI = process.env.MONGODB_URI;
    const localURI = 'mongodb://localhost:27017/efolio';

    const options = { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 };

    if (atlasURI) {
      try {
        await mongoose.connect(atlasURI, options);
        console.log('Connected to MongoDB Atlas');
      } catch (e) {
        console.log('Atlas failed, trying local...');
        await mongoose.connect(localURI, { ...options, serverSelectionTimeoutMS: 5000 });
        console.log('Connected to local MongoDB');
      }
    } else {
      await mongoose.connect(localURI, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to local MongoDB');
    }

    const user = await User.findOne({ role: 'owner' }).lean();
    if (!user) {
      console.error('No owner user found. Run scripts/seed.js first.');
      process.exit(1);
    }

    const userId = user._id;

    await Education.deleteMany({});
    const eduWithUser = educationData.map(e => ({ ...e, userId }));
    await Education.insertMany(eduWithUser);
    console.log(`Seeded ${educationData.length} education entries`);

    await Interests.deleteMany({});
    const intWithUser = interestsData.map(i => ({ ...i, userId }));
    await Interests.insertMany(intWithUser);
    console.log(`Seeded ${interestsData.length} interests`);

    console.log('Education and interests seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
