const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-folio')
  .then(async () => {
    try {
      // Check if test user exists
      const existingUser = await User.findOne({ email: 'test@efolio.dev' });
      if (existingUser) {
        console.log('Test user already exists');
      } else {
        // Create test user
        const hashedPassword = await bcrypt.hash('test123', 12);
        const testUser = new User({
          name: 'Test User',
          username: 'testuser',
          email: 'test@efolio.dev',
          password: hashedPassword,
          role: 'owner',
          isEmailVerified: true
        });
        
        await testUser.save();
        console.log('Test user created: test@efolio.dev / test123');
      }
      
      // List all users
      const users = await User.find({}).select('email role name');
      console.log('All users:', users);
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
