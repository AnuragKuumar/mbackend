const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

// Sample products data
const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max Premium Case',
    description: 'Ultra-protective case with military-grade drop protection for iPhone 15 Pro Max',
    category: 'Covers',
    brand: 'Apple',
    price: 2999,
    originalPrice: 3999,
    stock: 50,
    images: ['/images/iphone-15-pro.svg'],
    specifications: {
      material: 'TPU + PC',
      color: 'Transparent',
      compatibility: 'iPhone 15 Pro Max',
      features: 'Drop Protection, Wireless Charging Compatible, Camera Protection'
    },
    isFeatured: true,
    isActive: true,
    rating: {
      average: 4.5,
      count: 128
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra Armor Case',
    description: 'Heavy-duty protection case with kickstand for Samsung Galaxy S24 Ultra',
    category: 'Covers',
    brand: 'Samsung',
    price: 2499,
    originalPrice: 3299,
    stock: 35,
    images: ['/images/samsung-s24-ultra.svg'],
    specifications: {
      material: 'Polycarbonate',
      color: 'Black',
      compatibility: 'Samsung Galaxy S24 Ultra',
      features: 'Kickstand, Card Holder, Magnetic Mount Ready'
    },
    isFeatured: true,
    isActive: true,
    rating: {
      average: 4.3,
      count: 89
    }
  },
  {
    name: 'Universal Wireless Charger 15W',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices',
    category: 'Chargers',
    brand: 'Mobile repair',
    price: 1999,
    originalPrice: 2499,
    stock: 75,
    images: ['https://via.placeholder.com/300x300/000000/FFFFFF?text=Wireless+Charger'],
    specifications: {
      power: '15W',
      compatibility: 'Qi-enabled devices',
      features: 'Fast Charging, LED Indicator, Over-heat Protection'
    },
    isFeatured: false,
    isActive: true,
    rating: {
      average: 4.2,
      count: 156
    }
  },
  {
    name: 'USB-C to Lightning Cable 2m',
    description: 'High-quality braided cable for fast charging and data transfer',
    category: 'Chargers',
    brand: 'Apple',
    price: 899,
    originalPrice: 1299,
    stock: 100,
    images: ['https://via.placeholder.com/300x300/FFFFFF/000000?text=USB-C+Cable'],
    specifications: {
      length: '2 meters',
      material: 'Braided Nylon',
      features: 'Fast Charging, Data Transfer, Tangle-free'
    },
    isFeatured: false,
    isActive: true,
    rating: {
      average: 4.7,
      count: 234
    }
  },
  {
    name: 'Tempered Glass Screen Protector',
    description: '9H hardness tempered glass with oleophobic coating',
    category: 'Screen Protectors',
    brand: 'Mobile repair',
    price: 599,
    originalPrice: 899,
    stock: 200,
    images: ['https://via.placeholder.com/300x300/E0E0E0/000000?text=Screen+Protector'],
    specifications: {
      hardness: '9H',
      thickness: '0.33mm',
      features: 'Anti-fingerprint, Bubble-free, Case-friendly'
    },
    isFeatured: false,
    isActive: true,
    rating: {
      average: 4.4,
      count: 312
    }
  },
  {
    name: 'Bluetooth Earbuds Pro',
    description: 'Premium wireless earbuds with active noise cancellation',
    category: 'Earphones',
    brand: 'Mobile repair',
    price: 4999,
    originalPrice: 6999,
    stock: 25,
    images: ['https://via.placeholder.com/300x300/000000/FFFFFF?text=Earbuds+Pro'],
    specifications: {
      battery: '6+24 hours',
      features: 'ANC, Touch Controls, IPX4 Water Resistant',
      connectivity: 'Bluetooth 5.2'
    },
    isFeatured: true,
    isActive: true,
    rating: {
      average: 4.6,
      count: 67
    }
  },
  {
    name: 'Car Phone Mount Magnetic',
    description: 'Strong magnetic car mount with 360-degree rotation',
    category: 'Accessories',
    brand: 'Mobile repair',
    price: 1299,
    originalPrice: 1799,
    stock: 60,
    images: ['https://via.placeholder.com/300x300/333333/FFFFFF?text=Car+Mount'],
    specifications: {
      mount: 'Dashboard/Windshield',
      compatibility: 'Universal',
      features: '360° Rotation, Strong Magnet, Easy Installation'
    },
    isFeatured: false,
    isActive: true,
    rating: {
      average: 4.1,
      count: 89
    }
  },
  {
    name: 'Power Bank 20000mAh',
    description: 'High-capacity power bank with fast charging and multiple ports',
    category: 'Power Banks',
    brand: 'Mobile repair',
    price: 2799,
    originalPrice: 3499,
    stock: 40,
    images: ['https://via.placeholder.com/300x300/1E40AF/FFFFFF?text=Power+Bank'],
    specifications: {
      capacity: '20000mAh',
      ports: 'USB-A x2, USB-C x1',
      features: 'Fast Charging, LED Display, Multiple Safety Protection'
    },
    isFeatured: true,
    isActive: true,
    rating: {
      average: 4.5,
      count: 145
    }
  }
];

// Sample admin user (credentials from environment variables)
const adminUser = {
  name: 'Admin User',
  email: process.env.ADMIN_EMAIL || 'support@mobilerpairdurgapur.in',
  phone: process.env.ADMIN_PHONE || '7407926912',
  password: process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',
  role: 'admin'
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobirepair');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({});
    
    // Check if admin user exists
    console.log('👑 Creating admin user...');
    const admin = new User(adminUser);
    await admin.save();
    console.log('✅ Admin user created');

    // Insert sample products
    console.log('📱 Inserting sample products...');
    await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${sampleProducts.length} products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Products: ${sampleProducts.length}`);
    console.log(`- Admin Email: ${adminUser.email}`);
    console.log(`- Admin Password: ${adminUser.password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProducts, adminUser };