const mongoose = require('mongoose');
const RepairBooking = require('../models/RepairBooking');
require('dotenv').config();

// Sample repair bookings data
const sampleBookings = [
  {
    deviceBrand: 'Apple (iPhone)',
    deviceModel: 'iPhone 14 Pro',
    serviceType: 'Display/Screen Issues',
    deliveryOption: 'doorstep-service',
    customerDetails: {
      name: 'Rahul Kumar',
      phone: '9876543210',
      email: 'rahul@mobilerpairdurgapur.in',
      address: 'Ananda Gopal, Bhiringi Girls school, Benachity, Durgapur, West Bengal 713213'
    },
    issueDescription: 'Screen is cracked and touch is not working properly. Need urgent repair.',
    estimatedCost: 8500,
    serviceFee: 200,
    totalCost: 8700,
    status: 'pending',
    preferredDate: '2024-01-15',
    preferredTime: '2:00 PM - 4:00 PM',
    notes: 'Please call before coming',
    isGuestBooking: false
  },
  {
    deviceBrand: 'Samsung',
    deviceModel: 'Galaxy S23 Ultra',
    serviceType: 'Battery Problems',
    deliveryOption: 'doorstep-service',
    customerDetails: {
      name: 'Priya Sharma',
      phone: '9123456789',
      email: 'priya@mobilerpairdurgapur.in',
      address: 'Sector 15, Noida, UP 201301'
    },
    issueDescription: 'Battery drains very fast, need replacement. Phone gets hot while charging.',
    estimatedCost: 4500,
    serviceFee: 200,
    totalCost: 4700,
    status: 'accepted',
    preferredDate: '2024-01-16',
    preferredTime: '10:00 AM - 12:00 PM',
    notes: 'Available all day',
    isGuestBooking: true
  },
  {
    deviceBrand: 'OnePlus',
    deviceModel: 'OnePlus 11',
    serviceType: 'Charging Port Issues',
    deliveryOption: 'doorstep-service',
    customerDetails: {
      name: 'Amit Singh',
      phone: '9800999600',
      email: 'amit@mobilerpairdurgapur.in',
      address: 'Gurgaon, Haryana 122001'
    },
    issueDescription: 'Phone not charging properly, port seems loose. Sometimes works, sometimes doesn\'t.',
    estimatedCost: 2500,
    serviceFee: 200,
    totalCost: 2700,
    status: 'completed',
    preferredDate: '2024-01-14',
    preferredTime: '4:00 PM - 6:00 PM',
    notes: 'Fixed successfully',
    adminNotes: 'Charging port replaced, tested working fine',
    isGuestBooking: false
  },
  {
    deviceBrand: 'Xiaomi',
    deviceModel: 'Mi 13 Pro',
    serviceType: 'Software Issues',
    deliveryOption: 'doorstep-service',
    customerDetails: {
      name: 'Sneha Patel',
      phone: '9988776655',
      email: 'sneha@mobilerpairdurgapur.in',
      address: 'Ananda Gopal, Bhiringi Girls school, Benachity, Durgapur, West Bengal 713213'
    },
    issueDescription: 'Phone keeps restarting randomly. Apps crash frequently. Need software fix.',
    estimatedCost: 1500,
    serviceFee: 200,
    totalCost: 1700,
    status: 'in-progress',
    preferredDate: '2024-01-17',
    preferredTime: '11:00 AM - 1:00 PM',
    notes: 'Backup data before repair',
    adminNotes: 'Software update in progress',
    isGuestBooking: true
  },
  {
    deviceBrand: 'Vivo',
    deviceModel: 'V29 Pro',
    serviceType: 'Camera Issues',
    deliveryOption: 'doorstep-service',
    customerDetails: {
      name: 'Ravi Gupta',
      phone: '9876543211',
      email: 'ravi@mobilerpairdurgapur.in',
      address: 'Park Street, Kolkata, West Bengal 700016'
    },
    issueDescription: 'Rear camera not working, shows black screen. Front camera works fine.',
    estimatedCost: 6500,
    serviceFee: 200,
    totalCost: 6700,
    status: 'pending',
    preferredDate: '2024-01-18',
    preferredTime: '3:00 PM - 5:00 PM',
    notes: 'Camera is very important for work',
    isGuestBooking: false
  }
];

const seedRepairBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobirepair');
    console.log('✅ Connected to MongoDB');

    // Clear existing repair bookings
    console.log('🗑️  Clearing existing repair bookings...');
    await RepairBooking.deleteMany({});
    
    // Insert sample repair bookings
    console.log('📱 Inserting sample repair bookings...');
    await RepairBooking.insertMany(sampleBookings);
    console.log(`✅ Inserted ${sampleBookings.length} repair bookings`);

    console.log('\n🎉 Repair bookings seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total Bookings: ${sampleBookings.length}`);
    console.log(`- Pending: ${sampleBookings.filter(b => b.status === 'pending').length}`);
    console.log(`- Accepted: ${sampleBookings.filter(b => b.status === 'accepted').length}`);
    console.log(`- In Progress: ${sampleBookings.filter(b => b.status === 'in-progress').length}`);
    console.log(`- Completed: ${sampleBookings.filter(b => b.status === 'completed').length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding repair bookings failed:', error);
    process.exit(1);
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedRepairBookings();
}

module.exports = { seedRepairBookings, sampleBookings };