const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/canteenhub';

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if the user already exists
    let admin = await User.findOne({ email: 'superadmin@gmail.com' });
    if (admin) {
      console.log('Superadmin already exists. Updating details...');
      admin.password = '123456';
      admin.name = 'Superadmin';
      admin.role = 'super_admin';
      await admin.save();
      console.log('Superadmin updated successfully!');
    } else {
      console.log('Creating new Superadmin...');
      admin = new User({
        name: 'Superadmin',
        email: 'superadmin@gmail.com',
        password: '123456',
        role: 'super_admin'
      });
      await admin.save();
      console.log('Superadmin created successfully!');
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();
