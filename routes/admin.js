const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const RepairBooking = require('../models/RepairBooking');
const User = require('../models/User');
const { adminAuth } = require('../middleware/adminAuth');
const smsService = require('../services/smsService');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin only)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const totalBookings = await RepairBooking.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Get status-wise booking counts
    const bookingStats = await RepairBooking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await RepairBooking.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalBookings,
        totalProducts,
        bookingStats
      },
      recentOrders,
      recentBookings
    });
  } catch (error) {
    console.error('[ADMIN DASHBOARD ERROR]', error);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all repair bookings
// @access  Private (Admin only)
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const bookings = await RepairBooking.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RepairBooking.countDocuments(filter);

    res.json({
      success: true,
      bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('[ADMIN BOOKINGS ERROR]', error);
    res.status(500).json({ message: 'Server error loading bookings' });
  }
});

// @route   PUT /api/admin/bookings/:id
// @desc    Update repair booking
// @access  Private (Admin only)
router.put('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status, estimatedCost, adminNotes } = req.body;

    const booking = await RepairBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    
    if (status) booking.status = status;
    if (estimatedCost) {
      booking.estimatedCost = estimatedCost;
      booking.totalCost = estimatedCost + booking.serviceFee;
    }
    if (adminNotes) booking.adminNotes = adminNotes;

    await booking.save();

    // Send SMS notification if status changed
    if (status && status !== oldStatus) {
      try {
        const smsResult = await smsService.sendBookingStatusUpdate(booking, status);
        console.log('📱 SMS Notification Result:', smsResult);
        
        if (smsResult.success) {
          console.log(`✅ SMS sent to ${booking.customerDetails.name} (${booking.customerDetails.phone})`);
        } else {
          console.log(`❌ SMS failed for ${booking.customerDetails.name}: ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error('SMS Service Error:', smsError);
        // Don't fail the booking update if SMS fails
      }
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
      smsNotification: status && status !== oldStatus ? 'SMS notification sent' : 'No SMS sent'
    });
  } catch (error) {
    console.error('[ADMIN BOOKING UPDATE ERROR]', error);
    res.status(500).json({ message: 'Server error updating booking' });
  }
});

module.exports = router;
// @route   POST /api/admin/send-sms
// @desc    Send custom SMS to customer
// @access  Private (Admin only)
router.post('/send-sms', [
  adminAuth,
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, customerName, message } = req.body;

    const smsResult = await smsService.sendCustomMessage(phone, customerName, message);

    if (smsResult.success) {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        details: smsResult
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send SMS',
        error: smsResult.error
      });
    }
  } catch (error) {
    console.error('[SEND SMS ERROR]', error);
    res.status(500).json({ message: 'Server error sending SMS' });
  }
});