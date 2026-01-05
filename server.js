const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');
const {
  rateLimits,
  securityHeaders,
  corsOptions,
  sanitizeInput,
  validateRequest,
  securityLogger,
  validateApiKey
} = require('./middleware/security');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware (apply early)
app.use(securityLogger);
app.use(securityHeaders);
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/auth', rateLimits.auth);
app.use('/api/admin', rateLimits.admin);
app.use('/api/repairs', rateLimits.creation);
app.use('/api/orders', rateLimits.creation);
app.use('/api/products', rateLimits.browsing);
app.use('/api', rateLimits.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and validation
app.use(sanitizeInput);
app.use(validateRequest);
app.use(validateApiKey);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/adminLogin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL (Supabase)'
  });
});

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Get database info
    const [results] = await sequelize.query('SELECT version() as version, current_database() as database, current_user as user');
    
    res.json({
      success: true,
      message: 'Database connection successful',
      database: 'PostgreSQL (Supabase)',
      connection: 'Active',
      info: results[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin initialization endpoint
app.post('/api/init-admin', async (req, res) => {
  try {
    const Admin = require('./models/Admin');
    
    // Sync database tables
    await sequelize.sync();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      where: { email: process.env.ADMIN_EMAIL } 
    });
    
    if (existingAdmin) {
      return res.json({ 
        success: true, 
        message: 'Admin already exists',
        email: existingAdmin.email 
      });
    }

    // Create admin user
    const admin = await Admin.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'support@mobilerpairdurgapur.in',
      phone: process.env.ADMIN_PHONE || '7407926912',
      password: process.env.ADMIN_PASSWORD || 'Raigafre@34578',
      role: 'admin'
    });

    res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      email: admin.email 
    });
  } catch (error) {
    console.error('[ADMIN INIT ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating admin user',
      error: error.message 
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mobi repair API Server Running',
    version: '2.0.0',
    status: 'secure',
    database: 'PostgreSQL'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// PostgreSQL Connection and Server Start
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: PostgreSQL (Supabase)`);
      console.log('Security features enabled:');
      console.log('- Rate limiting ✓');
      console.log('- Input sanitization ✓');
      console.log('- Security headers ✓');
      console.log('- CORS protection ✓');
      console.log('- Request validation ✓');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();