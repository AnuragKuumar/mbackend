const express = require('express');
const { body, validationResult } = require('express-validator');
const RepairBooking = require('../models/RepairBooking');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Optional auth middleware - doesn't require authentication
const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return next(); // Continue without user
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    next(); // Continue without user even if token is invalid
  }
};

// @route   POST /api/repairs
// @desc    Book a repair service (supports guest bookings)
// @access  Public
router.post('/', [
  optionalAuth, // Optional authentication
  body('deviceBrand').notEmpty().withMessage('Device brand is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('customerDetails.name').notEmpty().withMessage('Customer name is required'),
  body('customerDetails.phone').notEmpty().withMessage('Phone number is required'),
  body('issueDescription').notEmpty().withMessage('Issue description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const {
      deviceBrand,
      deviceModel,
      serviceType,
      deliveryOption,
      customerDetails,
      issueDescription,
      preferredDate,
      preferredTime,
      notes,
      isGuestBooking
    } = req.body;

    // Calculate service fee based on delivery option
    let serviceFee = 0;
    if (deliveryOption === 'doorstep-service') {
      serviceFee = 99; // Extra charge for doorstep service
    }

    const bookingData = {
      deviceBrand,
      deviceModel: deviceModel || 'Not specified',
      serviceType,
      deliveryOption: deliveryOption || 'doorstep-service',
      customerName: customerDetails.name,
      customerPhone: customerDetails.phone,
      customerEmail: customerDetails.email || null, // Allow null for optional email
      customerAddress: customerDetails.address || null,
      issueDescription,
      preferredDate,
      preferredTime,
      serviceFee,
      totalCost: serviceFee,
      notes,
      isGuestBooking: isGuestBooking !== false // Default to true for guest bookings
    };

    // Add user reference if authenticated
    if (req.user) {
      bookingData.userId = req.user.id;
      bookingData.isGuestBooking = false;
    }

    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));

    // Create booking using Sequelize
    const booking = await RepairBooking.create(bookingData);

    res.status(201).json({
      success: true,
      message: 'Repair booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Repair booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/repairs/my-bookings
// @desc    Get user's repair bookings
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await RepairBooking.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/repairs/:id
// @desc    Get single repair booking
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await RepairBooking.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/repairs/:id/cancel
// @desc    Cancel repair booking
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await RepairBooking.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot cancel this booking' 
      });
    }

    await booking.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;