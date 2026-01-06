const express = require('express');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const router = express.Router();

// Rate limiting for admin routes (implement with express-rate-limit in production)
const loginAttempts = new Map();

const checkRateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }

  const attempts = loginAttempts.get(ip);
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({ 
      message: 'Too many login attempts. Please try again later.' 
    });
  }

  attempts.push(now);
  loginAttempts.set(ip, attempts.slice(-maxAttempts));
  next();
};

// @route   POST /api/admin/auth/login
// @desc    Admin login with enhanced security
// @access  Public
router.post('/login', checkRateLimit, [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, twoFactorCode } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Find admin with password field
    const admin = await Admin.findOne({ email, isActive: true }).select('+password +twoFactorSecret');
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (admin.isLocked) {
      await admin.logSecurityEvent('LOGIN_ATTEMPT_LOCKED', false, ipAddress, userAgent, 'Account locked');
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to too many failed attempts' 
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      await admin.incLoginAttempts();
      await admin.logSecurityEvent('LOGIN_FAILED', false, ipAddress, userAgent, 'Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (admin.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required' 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        // Check backup codes
        const backupCode = admin.backupCodes.find(
          code => code.code === twoFactorCode.toUpperCase() && !code.used
        );

        if (!backupCode) {
          await admin.incLoginAttempts();
          await admin.logSecurityEvent('LOGIN_FAILED', false, ipAddress, userAgent, 'Invalid 2FA code');
          return res.status(401).json({ message: 'Invalid two-factor authentication code' });
        }

        // Mark backup code as used
        backupCode.used = true;
        await admin.save();
      }
    }

    // Successful login - reset attempts and create session
    await admin.resetLoginAttempts();
    admin.lastLogin = new Date();
    
    const sessionToken = admin.createSession(ipAddress, userAgent);
    await admin.save();

    await admin.logSecurityEvent('LOGIN_SUCCESS', true, ipAddress, userAgent, 'Successful login');

    // Set secure cookie
    res.cookie('adminSession', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        twoFactorEnabled: admin.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('[ADMIN LOGIN ERROR]', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/admin/auth/logout
// @desc    Admin logout
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies.adminSession;
    
    if (sessionToken) {
      const admin = await Admin.findBySessionToken(sessionToken);
      if (admin) {
        await admin.invalidateSession(sessionToken);
        await admin.logSecurityEvent('LOGOUT', true, req.ip, req.get('User-Agent'), 'Manual logout');
      }
    }

    res.clearCookie('adminSession');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[ADMIN LOGOUT ERROR]', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   GET /api/admin/auth/me
// @desc    Get current admin info
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const sessionToken = req.cookies.adminSession;
    
    if (!sessionToken) {
      return res.status(401).json({ message: 'No session found' });
    }

    const admin = await Admin.findBySessionToken(sessionToken);
    
    if (!admin) {
      res.clearCookie('adminSession');
      return res.status(401).json({ message: 'Invalid session' });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        twoFactorEnabled: admin.twoFactorEnabled,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('[ADMIN ME ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/auth/setup-2fa
// @desc    Setup two-factor authentication
// @access  Private
router.post('/setup-2fa', async (req, res) => {
  try {
    const sessionToken = req.cookies.adminSession;
    const admin = await Admin.findBySessionToken(sessionToken);
    
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (admin.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Mobile Repair Admin (${admin.email})`,
      issuer: 'Mobile Repair'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (not saved until verified)
    admin.twoFactorSecret = secret.base32;
    await admin.save();

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('[2FA SETUP ERROR]', error);
    res.status(500).json({ message: 'Server error setting up 2FA' });
  }
});

// @route   POST /api/admin/auth/verify-2fa
// @desc    Verify and enable two-factor authentication
// @access  Private
router.post('/verify-2fa', [
  body('token').notEmpty().withMessage('2FA token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sessionToken = req.cookies.adminSession;
    const admin = await Admin.findBySessionToken(sessionToken).select('+twoFactorSecret');
    
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { token } = req.body;

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA and generate backup codes
    admin.twoFactorEnabled = true;
    const backupCodes = admin.generateBackupCodes();
    await admin.save();

    await admin.logSecurityEvent('2FA_ENABLED', true, req.ip, req.get('User-Agent'), '2FA successfully enabled');

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes
    });
  } catch (error) {
    console.error('[2FA VERIFY ERROR]', error);
    res.status(500).json({ message: 'Server error verifying 2FA' });
  }
});

// @route   POST /api/admin/auth/disable-2fa
// @desc    Disable two-factor authentication
// @access  Private
router.post('/disable-2fa', [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sessionToken = req.cookies.adminSession;
    const admin = await Admin.findBySessionToken(sessionToken).select('+password +twoFactorSecret');
    
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { password } = req.body;

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      await admin.logSecurityEvent('2FA_DISABLE_FAILED', false, req.ip, req.get('User-Agent'), 'Invalid password');
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    admin.backupCodes = [];
    await admin.save();

    await admin.logSecurityEvent('2FA_DISABLED', true, req.ip, req.get('User-Agent'), '2FA disabled');

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('[2FA DISABLE ERROR]', error);
    res.status(500).json({ message: 'Server error disabling 2FA' });
  }
});

module.exports = router;