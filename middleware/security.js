const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory (use Redis in production)
    store: new rateLimit.MemoryStore()
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit - more lenient
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    500, // limit each IP to 500 requests per windowMs
    'Too many requests from this IP, please try again later'
  ),

  // More lenient rate limit for auth endpoints
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // limit each IP to 20 requests per windowMs
    'Too many authentication attempts, please try again later'
  ),

  // More lenient rate limit for booking/order creation
  creation: createRateLimit(
    5 * 60 * 1000, // 5 minutes
    50, // limit each IP to 50 requests per windowMs
    'Too many creation requests, please slow down'
  ),

  // Very lenient rate limit for product browsing
  browsing: createRateLimit(
    1 * 60 * 1000, // 1 minute
    200, // limit each IP to 200 requests per windowMs
    'Too many requests, please slow down'
  ),

  // Special lenient rate limit for admin operations
  admin: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    200, // limit each IP to 200 requests per windowMs
    'Too many admin requests, please slow down'
  )
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://mobirepair.com',
      'https://www.mobirepair.com'
    ];
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow for now, log for debugging
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token']
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any keys that start with '$' or contain '.'
  mongoSanitize()(req, res, () => {
    // Clean user input from malicious HTML
    xss()(req, res, () => {
      // Prevent HTTP Parameter Pollution
      hpp({
        whitelist: ['category', 'brand', 'sort', 'page', 'limit'] // Allow these params to be arrays
      })(req, res, next);
    });
  });
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(<script|javascript:|vbscript:|onload=|onerror=)/i,
    /(union|select|insert|delete|drop|create|alter)/i,
    /(\$ne|\$gt|\$lt|\$in|\$nin)/i,
    /(\.\.\/|\.\.\\)/,
    /(%3C|%3E|%22|%27)/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check request body, query, and params
  const requestData = { ...req.body, ...req.query, ...req.params };
  
  if (checkValue(requestData)) {
    return res.status(400).json({
      error: 'Invalid request data detected',
      message: 'Request contains potentially malicious content'
    });
  }

  next();
};

// File upload security (if needed)
const fileUploadSecurity = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousIndicators = [
    req.get('User-Agent')?.includes('bot'),
    req.get('User-Agent')?.includes('crawler'),
    req.url.includes('..'),
    req.url.includes('<script'),
    Object.keys(req.query || {}).length > 20, // Too many query parameters
    JSON.stringify(req.body || {}).length > 100000 // Very large request body
  ];

  if (suspiciousIndicators.some(indicator => indicator)) {
    console.warn(`[SECURITY] Suspicious request from ${req.ip}:`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// API key validation (for future use)
const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key');
  
  // Skip API key validation for now (implement when needed)
  if (process.env.REQUIRE_API_KEY === 'true' && !apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key'
    });
  }
  
  next();
};

module.exports = {
  rateLimits,
  securityHeaders,
  corsOptions,
  sanitizeInput,
  validateRequest,
  fileUploadSecurity,
  securityLogger,
  validateApiKey
};