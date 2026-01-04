const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
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
app.use('/api/admin', rateLimits.admin); // Special lenient rate limit for admin
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
// app.use('/api', require('./routes/initAdmin')); // REMOVED FOR SECURITY

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobirepair')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mobi repair API Server Running',
    version: '1.0.0',
    status: 'secure'
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
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Security features enabled:');
  console.log('- Rate limiting ✓');
  console.log('- Input sanitization ✓');
  console.log('- Security headers ✓');
  console.log('- CORS protection ✓');
  console.log('- Request validation ✓');
});