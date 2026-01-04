const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobirepair');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('👑 Admin user already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD, // This will be hashed by the pre-save hook
      role: 'admin'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log(`👑 Name: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`📱 Phone: ${admin.phone}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log('\n🎉 Admin credentials configured from environment variables');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

createAdmin();