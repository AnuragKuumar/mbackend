// Simple In-Memory Database
class MemoryDB {
  constructor() {
    this.admins = [];
    this.repairBookings = [];
    this.users = [];
    this.products = [];
    this.orders = [];
    this.initialized = false;
  }

  // Initialize with default admin
  async init() {
    if (this.initialized) return;
    
    console.log('🗄️  Initializing in-memory database...');
    
    // Create default admin if not exists
    const adminExists = this.admins.find(admin => admin.email === process.env.ADMIN_EMAIL);
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Raigafre@34578', salt);
      
      this.admins.push({
        id: 'admin-1',
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL || 'support@mobilerpairdurgapur.in',
        phone: process.env.ADMIN_PHONE || '7407926912',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Default admin user created');
    }
    
    // Add sample repair bookings
    this.repairBookings = [
      {
        id: 'booking-1',
        customerName: 'Rahul Kumar',
        customerPhone: '9876543210',
        customerEmail: 'rahul@example.com',
        deviceBrand: 'Apple (iPhone)',
        deviceModel: 'iPhone 14',
        serviceType: 'Display/Screen Issues',
        issueDescription: 'Screen is cracked and not responding to touch',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'booking-2',
        customerName: 'Priya Sharma',
        customerPhone: '9123456789',
        customerEmail: 'priya@example.com',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S23',
        serviceType: 'Battery Problems',
        issueDescription: 'Battery drains very quickly',
        status: 'in-progress',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    this.initialized = true;
    console.log('✅ In-memory database initialized');
  }

  // Admin methods
  async findAdminByEmail(email) {
    return this.admins.find(admin => admin.email === email);
  }

  async createAdmin(adminData) {
    const id = 'admin-' + (this.admins.length + 1);
    const admin = { id, ...adminData, createdAt: new Date(), updatedAt: new Date() };
    this.admins.push(admin);
    return admin;
  }

  // Repair booking methods
  async getAllBookings(limit = 20) {
    return this.repairBookings.slice(0, limit);
  }

  async createBooking(bookingData) {
    const id = 'booking-' + (this.repairBookings.length + 1);
    const booking = { 
      id, 
      ...bookingData, 
      status: 'pending',
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.repairBookings.push(booking);
    return booking;
  }

  async updateBookingStatus(id, status) {
    const booking = this.repairBookings.find(b => b.id === id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date();
      return booking;
    }
    return null;
  }

  async getStats() {
    return {
      totalBookings: this.repairBookings.length,
      pendingBookings: this.repairBookings.filter(b => b.status === 'pending').length,
      inProgressBookings: this.repairBookings.filter(b => b.status === 'in-progress').length,
      completedBookings: this.repairBookings.filter(b => b.status === 'completed').length
    };
  }
}

// Create singleton instance
const memoryDB = new MemoryDB();

module.exports = memoryDB;